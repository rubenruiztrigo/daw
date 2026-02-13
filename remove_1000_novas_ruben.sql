-- Quitar la insignia legendaria a rubenruiz
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
        -- Eliminar la insignia de user_badges
        DELETE FROM public.user_badges 
        WHERE user_id = target_user_id 
          AND badge_id = 'legendary_contributor';
        
        RAISE NOTICE 'Insignia legendaria (1000 Novas) quitada a rubenruiz (%)', target_user_id;
    ELSE
        RAISE NOTICE 'Usuario rubenruiz no encontrado';
    END IF;
END $$;
