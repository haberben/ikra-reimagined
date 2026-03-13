-- DDL for Dua Kardeşliği (Community Dua Requests)
CREATE TABLE IF NOT EXISTS public.dua_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    prayer_text TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT false, -- Requires admin approval before going public
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DDL for Dua Reactions (Amin / Dua Ettim)
CREATE TABLE IF NOT EXISTS public.dua_reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id UUID REFERENCES public.dua_requests(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(request_id, user_id) -- A user can only react once per dua
);

-- ==========================================
-- RLS POLICIES FOR DUA REQUESTS
-- ==========================================
ALTER TABLE public.dua_requests ENABLE ROW LEVEL SECURITY;

-- 1. Anyone logged in can insert a new dua request
CREATE POLICY "Users can insert their own dua requests" ON public.dua_requests
    FOR INSERT WITH CHECK (
      auth.uid() = user_id
    );

-- 2. Anyone can view APPROVED dua requests
CREATE POLICY "Anyone can view approved dua requests" ON public.dua_requests
    FOR SELECT USING (
      is_approved = true
    );

-- 3. Users can view their OWN pending requests
CREATE POLICY "Users can view their own pending dua requests" ON public.dua_requests
    FOR SELECT USING (
      auth.uid() = user_id
    );

-- 4. Admins and Moderators can view ALL requests (including unapproved)
CREATE POLICY "Admins can view all dua requests" ON public.dua_requests
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
      )
    );

-- 5. Admins and Moderators can UPDATE requests (approve/reject/edit)
CREATE POLICY "Admins can update dua requests" ON public.dua_requests
    FOR UPDATE USING (
      EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
      )
    );

-- 6. Admins and Moderators can DELETE requests
CREATE POLICY "Admins can delete dua requests" ON public.dua_requests
    FOR DELETE USING (
      EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
      )
    );

-- 7. Users can DELETE their own requests
CREATE POLICY "Users can delete their own dua requests" ON public.dua_requests
    FOR DELETE USING (
      auth.uid() = user_id
    );

-- ==========================================
-- RLS POLICIES FOR DUA REACTIONS
-- ==========================================
ALTER TABLE public.dua_reactions ENABLE ROW LEVEL SECURITY;

-- 1. Anyone logged in can add a reaction
CREATE POLICY "Users can add a reaction" ON public.dua_reactions
    FOR INSERT WITH CHECK (
      auth.uid() = user_id
    );

-- 2. Anyone can read the reaction counts
CREATE POLICY "Anyone can read reactions" ON public.dua_reactions
    FOR SELECT USING (true);

-- 3. Users can remove their own reactions
CREATE POLICY "Users can delete their own reaction" ON public.dua_reactions
    FOR DELETE USING (
      auth.uid() = user_id
    );
