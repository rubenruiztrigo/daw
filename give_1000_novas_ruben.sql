-- Asignar la insignia legendaria a rubenruiz para que llegue a 1000 Novas
DO $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Buscar al usuario 'rubenruiz'
    SELECT id INTO target_user_id
    FROM public.profiles
    WHERE username = 'rubenruiz'
    LIMIT 1;

    IF target_user_id IS NOT NULL THEN
        -- Insertar la insignia en user_badges
        INSERT INTO public.user_badges (user_id, badge_id)
        VALUES (target_user_id, 'legendary_contributor')
        ON CONFLICT (user_id, badge_id) DO NOTHING;
        
        RAISE NOTICE 'Asignada insignia legendaria (1000 Novas) a rubenruiz (%)', target_user_id;
    ELSE
        RAISE NOTICE 'Usuario rubenruiz no encontrado';
    END IF;
END $$;
