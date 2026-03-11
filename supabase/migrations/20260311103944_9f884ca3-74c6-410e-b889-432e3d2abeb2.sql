
CREATE TABLE public.playlist_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id uuid NOT NULL REFERENCES public.video_playlists(id) ON DELETE CASCADE,
  youtube_video_id text NOT NULL,
  title text NOT NULL,
  thumbnail_url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(playlist_id, youtube_video_id)
);

ALTER TABLE public.playlist_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view playlist videos" ON public.playlist_videos FOR SELECT TO public USING (true);
CREATE POLICY "Admins can insert playlist videos" ON public.playlist_videos FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));
CREATE POLICY "Admins can update playlist videos" ON public.playlist_videos FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));
CREATE POLICY "Admins can delete playlist videos" ON public.playlist_videos FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));
