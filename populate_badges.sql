-- Desbloquear insignias de Eventos Especiales para Jaime
INSERT INTO public.user_badges (user_id, badge_id)
SELECT id, unnest(ARRAY['event_innovalencia', 'event_burocracia', 'event_innovamos'])
FROM public.profiles 
WHERE name ILIKE '%Jaime%'
ON CONFLICT (user_id, badge_id) DO NOTHING;

-- Desbloquear insignia de InnoValencia para David (opcional/previo)
INSERT INTO public.user_badges (user_id, badge_id)
SELECT id, 'event_innovalencia' 
FROM public.profiles 
WHERE name ILIKE '%David%' OR username ILIKE '%daviidcruz%'
ON CONFLICT (user_id, badge_id) DO NOTHING;
