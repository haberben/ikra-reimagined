-- Create hatim_groups table
CREATE TABLE public.hatim_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create hatim_juz table
CREATE TABLE public.hatim_juz (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.hatim_groups(id) ON DELETE CASCADE,
  juz_number INTEGER NOT NULL CHECK (juz_number >= 1 AND juz_number <= 30),
  claimed_by TEXT,
  claimed_by_name TEXT,
  claimed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE (group_id, juz_number)
);

-- Create wallpapers table
CREATE TABLE public.wallpapers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  arabic_text TEXT NOT NULL,
  turkish_text TEXT NOT NULL,
  category TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create daily_content table
CREATE TABLE public.daily_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('ayet', 'hadis')),
  arabic_text TEXT NOT NULL,
  turkish_text TEXT NOT NULL,
  source TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- Enable RLS on all tables
ALTER TABLE public.hatim_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hatim_juz ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallpapers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_content ENABLE ROW LEVEL SECURITY;

-- hatim_groups policies
CREATE POLICY "Anyone can view hatim groups" ON public.hatim_groups FOR SELECT USING (true);
CREATE POLICY "Anyone can create hatim groups" ON public.hatim_groups FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update hatim groups" ON public.hatim_groups FOR UPDATE USING (true);

-- hatim_juz policies
CREATE POLICY "Anyone can view hatim juz" ON public.hatim_juz FOR SELECT USING (true);
CREATE POLICY "Anyone can insert hatim juz" ON public.hatim_juz FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update hatim juz" ON public.hatim_juz FOR UPDATE USING (true);

-- wallpapers policies
CREATE POLICY "Anyone can view wallpapers" ON public.wallpapers FOR SELECT USING (true);
CREATE POLICY "Anyone can insert wallpapers" ON public.wallpapers FOR INSERT WITH CHECK (true);

-- daily_content policies
CREATE POLICY "Anyone can view daily content" ON public.daily_content FOR SELECT USING (true);
CREATE POLICY "Anyone can insert daily content" ON public.daily_content FOR INSERT WITH CHECK (true);

-- Enable realtime for hatim tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.hatim_groups;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hatim_juz;

-- Create indexes
CREATE INDEX idx_hatim_juz_group ON public.hatim_juz(group_id);
CREATE INDEX idx_hatim_groups_invite ON public.hatim_groups(invite_code);
CREATE INDEX idx_daily_content_date ON public.daily_content(date);
CREATE INDEX idx_wallpapers_category ON public.wallpapers(category);