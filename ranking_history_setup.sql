-- Script de migración EXCLUSIVA para ranking_history

-- 1. Eliminar la tabla si existía de intentos previos (empezar de cero)
DROP TABLE IF EXISTS public.weekly_ranking_logs;
DROP TABLE IF EXISTS public.ranking_history CASCADE;

-- 2. Crear la tabla ranking_history
CREATE TABLE public.ranking_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    badge_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Migrar los datos existentes de user_badges a ranking_history
INSERT INTO public.ranking_history (user_id, badge_id, created_at)
SELECT user_id, badge_id, created_at
FROM public.user_badges
WHERE badge_id IN ('ranking_top1', 'ranking_top2', 'ranking_top3');

-- 4. ELIMINAR los registros de ranking de la tabla user_badges
-- A partir de ahora, user_badges solo tendrá insignias permanentes.
-- El historial de ranking se mantendrá exclusivamente en ranking_history.
DELETE FROM public.user_badges
WHERE badge_id IN ('ranking_top1', 'ranking_top2', 'ranking_top3');

-- 5. Índices para rendimiento
CREATE INDEX idx_ranking_history_user_id ON public.ranking_history(user_id);
CREATE INDEX idx_ranking_history_badge_id ON public.ranking_history(badge_id);

-- 6. Habilitar RLS
ALTER TABLE public.ranking_history ENABLE ROW LEVEL SECURITY;

-- 7. Políticas de acceso
DO $$ 
BEGIN
    CREATE POLICY "Public read ranking history" ON public.ranking_history FOR SELECT USING (true);

    CREATE POLICY "Admins can manage ranking history" ON public.ranking_history USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Políticas ya existen o error al crear: %', SQLERRM;
END $$;

-- 8. Recargar caché de esquema postgrest
NOTIFY pgrst, 'reload schema';
