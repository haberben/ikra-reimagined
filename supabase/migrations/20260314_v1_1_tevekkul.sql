-- DDL for Tevekkül Vakti Table (Günlük Motivasyon / Hatırlatma)
CREATE TABLE IF NOT EXISTS public.tevekkul_vakti (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_text TEXT NOT NULL,
    source TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.tevekkul_vakti ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read tevekkul_vakti" ON public.tevekkul_vakti
    FOR SELECT USING (true);

CREATE POLICY "Admins can insert tevekkul_vakti" ON public.tevekkul_vakti
    FOR INSERT WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
      )
    );

CREATE POLICY "Admins can delete tevekkul_vakti" ON public.tevekkul_vakti
    FOR DELETE USING (
      EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
      )
    );

-- INSERT INITIAL SEED DATA
INSERT INTO public.tevekkul_vakti (content_text, source) VALUES
('"Allah, kulunun rızkını, kimsenin aklına gelmeyecek bir yerden verir." Bugün kalbini ferah tut, çünkü Rabbin seni unutmadı.', 'Tevekkül Notu'),
('Vazgeçmek üzere olduğunda hatırla; Allah, sabredenlerle beraberdir.', 'Tevekkül Notu'),
('Belki de o çok istediğin şeyin vakti gelmemiştir. Bekleyişin ibadetindir, umutsuzluğa kapılma.', 'Tevekkül Notu'),
('Rüzgarın yönünü değiştiremezsin ama yelkenlerini ayarlayabilirsin. Duana sarıl ve gerisini Allah''a bırak.', 'Tevekkül Notu'),
('Ne zaman daralsan Müzemmil 9. ayeti düşün: "O, doğunun da batının da Rabbidir. O''ndan başka hiçbir ilah yoktur. Öyleyse yalnız O''na dayan, O''na güven."', 'Müzzemmil Suresi, 9. Ayet')
ON CONFLICT DO NOTHING;
