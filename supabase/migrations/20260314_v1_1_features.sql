-- DDL for İKRA v1.1 Features
-- Please run this script in your Supabase SQL Editor

-- 1. Daily Facts Table (Bunu Biliyor Muydun?)
CREATE TABLE IF NOT EXISTS public.islamic_facts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fact_text TEXT NOT NULL,
    source TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for islamic_facts
ALTER TABLE public.islamic_facts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read facts" ON public.islamic_facts
    FOR SELECT USING (true);

CREATE POLICY "Admins can insert facts" ON public.islamic_facts
    FOR INSERT WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
      )
    );

CREATE POLICY "Admins can delete facts" ON public.islamic_facts
    FOR DELETE USING (
      EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
      )
    );

-- Insert a sample fact
INSERT INTO public.islamic_facts (fact_text, source) 
VALUES ('Dünyadaki ilk üniversite, 859 yılında Fas''ta Fatıma el-Fıhri isimli Müslüman bir kadın tarafından kurulan Karaviyyin Üniversitesi''dir.', 'Tarihi Kayıtlar')
ON CONFLICT DO NOTHING;
