-- Create video_playlists table
CREATE TABLE public.video_playlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  youtube_playlist_url TEXT NOT NULL,
  youtube_playlist_id TEXT NOT NULL,
  cover_image_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.video_playlists ENABLE ROW LEVEL SECURITY;

-- Everyone can view published playlists
CREATE POLICY "Anyone can view published playlists"
  ON public.video_playlists FOR SELECT USING (is_published = true);

-- Insert/update for admin (no auth, controlled by app-level password)
CREATE POLICY "Anyone can insert playlists"
  ON public.video_playlists FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update playlists"
  ON public.video_playlists FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete playlists"
  ON public.video_playlists FOR DELETE USING (true);

-- Create storage bucket for video cover images
INSERT INTO storage.buckets (id, name, public) VALUES ('video-covers', 'video-covers', true);

-- Storage policies
CREATE POLICY "Anyone can view video covers"
  ON storage.objects FOR SELECT USING (bucket_id = 'video-covers');

CREATE POLICY "Anyone can upload video covers"
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'video-covers');

-- Index
CREATE INDEX idx_video_playlists_published ON public.video_playlists(is_published, sort_order);