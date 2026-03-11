
INSERT INTO storage.buckets (id, name, public)
VALUES ('wallpapers', 'wallpapers', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view wallpaper files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'wallpapers');

CREATE POLICY "Authenticated admins can upload wallpapers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'wallpapers' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated admins can delete wallpapers"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'wallpapers' AND public.has_role(auth.uid(), 'admin'));
