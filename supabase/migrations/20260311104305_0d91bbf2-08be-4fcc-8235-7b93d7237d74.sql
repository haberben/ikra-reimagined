
-- Suggestions table
CREATE TABLE public.suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_display_name text NOT NULL DEFAULT 'Anonim',
  category text NOT NULL CHECK (category IN ('wallpaper', 'playlist', 'ayet', 'hadis')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  title text,
  description text,
  arabic_text text,
  turkish_text text,
  source text,
  youtube_url text,
  image_url text,
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid
);

ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can insert their own suggestions
CREATE POLICY "Users can insert own suggestions" ON public.suggestions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Users can view their own suggestions
CREATE POLICY "Users can view own suggestions" ON public.suggestions
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Admins/moderators can update suggestions (approve/reject)
CREATE POLICY "Admins can update suggestions" ON public.suggestions
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Admins can delete suggestions
CREATE POLICY "Admins can delete suggestions" ON public.suggestions
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Add contributor_name to existing content tables
ALTER TABLE public.wallpapers ADD COLUMN IF NOT EXISTS contributor_name text;
ALTER TABLE public.daily_content ADD COLUMN IF NOT EXISTS contributor_name text;
ALTER TABLE public.video_playlists ADD COLUMN IF NOT EXISTS contributor_name text;
