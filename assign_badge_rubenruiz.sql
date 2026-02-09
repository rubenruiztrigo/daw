-- Asignar insignia Top 1 Semanal a rubenruiz
-- Se usa la fecha de hace 7 días para simular que fue la semana pasada
INSERT INTO public.user_badges (user_id, badge_id, created_at)
SELECT id, 'ranking_top1', NOW() - INTERVAL '7 days'
FROM public.profiles
WHERE username = 'rubenruiz'
-- Si ya tiene la insignia, no hacemos nada (asumiendo que user_id, badge_id es único, o simplemente se añade otra entrada si no hay constraint)
-- Si hay constraint UNIQUE(user_id, badge_id), usa:
ON CONFLICT (user_id, badge_id) DO NOTHING;
