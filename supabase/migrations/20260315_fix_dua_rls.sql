-- Fix: Ensure admin can see ALL dua requests (including unapproved)
-- Drop the old policy first to avoid duplicate conflicts
DROP POLICY IF EXISTS "Admins can view all dua requests" ON public.dua_requests;

-- Recreate with correct logic
CREATE POLICY "Admins can view all dua requests" ON public.dua_requests
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_roles.user_id = auth.uid() AND role IN ('admin', 'moderator')
      )
    );

-- Also ensure the "anyone can view approved" policy is correct
DROP POLICY IF EXISTS "Anyone can view approved dua requests" ON public.dua_requests;

CREATE POLICY "Anyone can view approved dua requests" ON public.dua_requests
    FOR SELECT USING (
      is_approved = true
    );

-- Also ensure users can view their own pending ones
DROP POLICY IF EXISTS "Users can view their own pending dua requests" ON public.dua_requests;

CREATE POLICY "Users can view their own pending dua requests" ON public.dua_requests
    FOR SELECT USING (
      auth.uid() = user_id
    );

-- Ensure admins can still update (approve/reject)
DROP POLICY IF EXISTS "Admins can update dua requests" ON public.dua_requests;

CREATE POLICY "Admins can update dua requests" ON public.dua_requests
    FOR UPDATE USING (
      EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_roles.user_id = auth.uid() AND role IN ('admin', 'moderator')
      )
    );

-- Ensure admins can delete
DROP POLICY IF EXISTS "Admins can delete dua requests" ON public.dua_requests;

CREATE POLICY "Admins can delete dua requests" ON public.dua_requests
    FOR DELETE USING (
      EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_roles.user_id = auth.uid() AND role IN ('admin', 'moderator')
      )
    );
