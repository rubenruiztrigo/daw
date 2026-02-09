-- ==========================================
-- 1. CREACIÓN DE LA TABLA
-- ==========================================
CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    badge_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, badge_id)
);

-- ==========================================
-- 2. SEGURIDAD (RLS)
-- ==========================================
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Everyone can view user badges') THEN
        CREATE POLICY "Everyone can view user badges" ON public.user_badges FOR SELECT USING (true);
    END IF;
END $$;

-- ==========================================
-- 3. ÍNDICES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);

-- ==========================================
-- 4. POBLACIÓN DE DATOS (JAIME Y DAVID)
-- ==========================================

-- Jaime: Eventos Especiales
INSERT INTO public.user_badges (user_id, badge_id)
SELECT id, unnest(ARRAY['event_innovalencia', 'event_burocracia', 'event_innovamos'])
FROM public.profiles 
WHERE name ILIKE '%Jaime%'
ON CONFLICT (user_id, badge_id) DO NOTHING;

-- David: InnoValencia
INSERT INTO public.user_badges (user_id, badge_id)
SELECT id, 'event_innovalencia' 
FROM public.profiles 
WHERE name ILIKE '%David%' OR username ILIKE '%daviidcruz%'
ON CONFLICT (user_id, badge_id) DO NOTHING;
