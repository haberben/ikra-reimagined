
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- assign_admin_if_eligible function (auto-assigns admin to known email)
CREATE OR REPLACE FUNCTION public.assign_admin_if_eligible()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_uid uuid;
BEGIN
  v_uid := auth.uid();
  SELECT email INTO v_email FROM auth.users WHERE id = v_uid;
  IF v_email = 'ibrahmyldrim@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_uid, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END;
$$;

-- Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  image_url text,
  video_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view notifications" ON public.notifications
  FOR SELECT TO public USING (true);

CREATE POLICY "Admins can insert notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete notifications" ON public.notifications
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Make wallpaper text fields optional
ALTER TABLE public.wallpapers ALTER COLUMN arabic_text DROP NOT NULL;
ALTER TABLE public.wallpapers ALTER COLUMN turkish_text DROP NOT NULL;

-- Add admin-only policies for wallpapers
CREATE POLICY "Admins can update wallpapers" ON public.wallpapers
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete wallpapers" ON public.wallpapers
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Add admin-only policies for daily_content
CREATE POLICY "Admins can update daily content" ON public.daily_content
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete daily content" ON public.daily_content
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
