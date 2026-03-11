
-- Add sort_order to wallpapers
ALTER TABLE public.wallpapers ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;
ALTER TABLE public.wallpapers ADD COLUMN IF NOT EXISTS created_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add created_by_user_id to daily_content, notifications, video_playlists
ALTER TABLE public.daily_content ADD COLUMN IF NOT EXISTS created_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS created_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.video_playlists ADD COLUMN IF NOT EXISTS created_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  display_name text,
  is_banned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator') OR auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert profiles" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Allow admins to manage user_roles
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users and admins can view roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update content RLS policies
DROP POLICY IF EXISTS "Anyone can insert wallpapers" ON public.wallpapers;
CREATE POLICY "Authenticated can insert wallpapers" ON public.wallpapers
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

DROP POLICY IF EXISTS "Admins can delete wallpapers" ON public.wallpapers;
CREATE POLICY "Role-based delete wallpapers" ON public.wallpapers
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR (has_role(auth.uid(), 'moderator') AND created_by_user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can update wallpapers" ON public.wallpapers;
CREATE POLICY "Role-based update wallpapers" ON public.wallpapers
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR (has_role(auth.uid(), 'moderator') AND created_by_user_id = auth.uid()));

DROP POLICY IF EXISTS "Anyone can insert daily content" ON public.daily_content;
CREATE POLICY "Authenticated can insert daily content" ON public.daily_content
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

DROP POLICY IF EXISTS "Admins can delete daily content" ON public.daily_content;
CREATE POLICY "Role-based delete daily content" ON public.daily_content
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR (has_role(auth.uid(), 'moderator') AND created_by_user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can update daily content" ON public.daily_content;
CREATE POLICY "Role-based update daily content" ON public.daily_content
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR (has_role(auth.uid(), 'moderator') AND created_by_user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated can insert notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

DROP POLICY IF EXISTS "Admins can delete notifications" ON public.notifications;
CREATE POLICY "Role-based delete notifications" ON public.notifications
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR (has_role(auth.uid(), 'moderator') AND created_by_user_id = auth.uid()));

DROP POLICY IF EXISTS "Anyone can insert playlists" ON public.video_playlists;
CREATE POLICY "Authenticated can insert playlists" ON public.video_playlists
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

DROP POLICY IF EXISTS "Anyone can delete playlists" ON public.video_playlists;
CREATE POLICY "Role-based delete playlists" ON public.video_playlists
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR (has_role(auth.uid(), 'moderator') AND created_by_user_id = auth.uid()));

DROP POLICY IF EXISTS "Anyone can update playlists" ON public.video_playlists;
CREATE POLICY "Role-based update playlists" ON public.video_playlists
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR (has_role(auth.uid(), 'moderator') AND created_by_user_id = auth.uid()));

-- Create profiles for existing users
INSERT INTO public.profiles (user_id, email)
SELECT id, email FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
