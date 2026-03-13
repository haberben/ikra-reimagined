-- DDL for Mood Contents Table (Duygu Durumu Keşfi)
CREATE TABLE IF NOT EXISTS public.mood_contents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mood TEXT NOT NULL, -- e.g., 'Üzgün', 'Stresli', 'Şükreden', 'Kararsız', 'Umutsuz', 'Yalnız', 'Öfkeli'
    type TEXT NOT NULL CHECK (type IN ('ayet', 'hadis')),
    turkish_text TEXT NOT NULL,
    arabic_text TEXT,
    source TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.mood_contents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read mood contents" ON public.mood_contents
    FOR SELECT USING (true);

CREATE POLICY "Admins can insert mood contents" ON public.mood_contents
    FOR INSERT WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
      )
    );

CREATE POLICY "Admins can delete mood contents" ON public.mood_contents
    FOR DELETE USING (
      EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
      )
    );

-- INSERT INITIAL SEED DATA
INSERT INTO public.mood_contents (mood, type, turkish_text, source) VALUES
('Üzgün', 'ayet', 'Gevşemeyin, hüzünlenmeyin. Eğer (gerçekten) inanıyorsanız üstün gelecek olan sizsiniz.', 'Âl-i İmrân Suresi, 139. Ayet'),
('Üzgün', 'ayet', 'Duanıza icabet edeceğim.', 'Mümin Suresi, 60. Ayet'),
('Üzgün', 'hadis', 'Müslümanın başına gelen her bir yorgunluk, hastalık, sıkıntı, keder ve üzüntü, hatta ayağına batan dikene varıncaya kadar her şey, onun günahlarına keffaret olur.', 'Buhârî, Merdâ 1'),

('Stresli', 'ayet', 'Bilesiniz ki, kalpler ancak Allah''ı anmakla huzur bulur.', 'Ra''d Suresi, 28. Ayet'),
('Stresli', 'ayet', 'Şüphesiz zorlukla beraber bir kolaylık vardır.', 'İnşirah Suresi, 5. Ayet'),
('Stresli', 'hadis', 'Allah''ım! Zorlukları kolaylaştıran sensin. Dilediğin vakit hüznü, kederi kolaylığa çevirirsin.', 'İbn Hibbân, Ed’ıye, No: 974'),

('Şükreden', 'ayet', 'Eğer şükrederseniz, size olan nimetimi mutlaka artırırım.', 'İbrahim Suresi, 7. Ayet'),
('Şükreden', 'ayet', 'O halde beni anın ki ben de sizi anayım. Bana şükredin ve bana karşı nankörlük etmeyin.', 'Bakara Suresi, 152. Ayet'),
('Şükreden', 'hadis', 'Kimin başına sevindirici bir iş gelirse, şükrederek Allah''a secde etsin.', 'Ebu Davud, Cihad 162'),

('Kararsız', 'ayet', 'Kim Allah’a güvenirse O, ona yeter. Şüphesiz Allah, emrini yerine getirendir.', 'Talâk Suresi, 3. Ayet'),
('Kararsız', 'hadis', 'Bir işe kalkışmak istediğinde, o işin sonunu düşün. Eğer sonucu iyiyse yap, kötüyse ondan vazgeç.', 'Deylemî, Firdevs'),

('Umutsuz', 'ayet', 'Allah’ın rahmetinden ümit kesmeyin. Çünkü kâfirler topluluğundan başkası Allah’ın rahmetinden ümit kesmez.', 'Yusuf Suresi, 87. Ayet'),
('Umutsuz', 'ayet', 'Rabbin seni terk etmedi, sana darılmadı da.', 'Duha Suresi, 3. Ayet'),

('Yalnız', 'ayet', 'Kullarım sana beni sorduklarında bilsinler ki şüphesiz ben onlara çok yakınım.', 'Bakara Suresi, 186. Ayet'),
('Yalnız', 'ayet', 'Biz ona şah damarından daha yakınız.', 'Kaf Suresi, 16. Ayet'),

('Öfkeli', 'ayet', 'O takvâ sahipleri ki, bollukta da darlıkta da Allah için harcarlar; öfkelerini yutarlar ve insanları affederler. Allah da güzel davranışta bulunanları sever.', 'Âl-i İmrân Suresi, 134. Ayet'),
('Öfkeli', 'hadis', 'Yiğit dediğin, güreşte rakibini yenen kimse değildir; asıl yiğit kızdığı zaman öfkesini yenen adamdır.', 'Buhârî, Edeb 76')
ON CONFLICT DO NOTHING;
