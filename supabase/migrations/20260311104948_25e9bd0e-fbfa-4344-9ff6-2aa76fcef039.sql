
INSERT INTO storage.buckets (id, name, public) VALUES ('suggestions', 'suggestions', true);

CREATE POLICY "Anyone can view suggestion files" ON storage.objects FOR SELECT TO public USING (bucket_id = 'suggestions');
CREATE POLICY "Authenticated can upload suggestion files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'suggestions');
