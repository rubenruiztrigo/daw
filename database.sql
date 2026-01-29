
-- =====================================================
-- 1. LIMPIEZA DINÁMICA DE DISPARADORES EN 'follows'
-- =====================================================

DO $$ 
DECLARE 
    trig_record RECORD;
BEGIN
    -- Buscamos todos los triggers asociados a la tabla follows
    FOR trig_record IN 
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_schema = 'public' 
        AND event_object_table = 'follows'
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(trig_record.trigger_name) || ' ON public.follows';
    END LOOP;
END $$;

-- Eliminación de funciones antiguas relacionadas con el conteo de seguidores
DROP FUNCTION IF EXISTS public.handle_follow_counters() CASCADE;
DROP FUNCTION IF EXISTS public.sync_follow_stats() CASCADE;

-- =====================================================
-- 2. ASEGURAR INTEGRIDAD DE DATOS (RESTRICCIÓN ÚNICA)
-- =====================================================

-- Eliminamos la restricción si existe para recrearla limpiamente
ALTER TABLE IF EXISTS public.follows DROP CONSTRAINT IF EXISTS follows_follower_id_followed_id_key;
-- Esta restricción impide que exista más de una fila para el mismo par (seguidor, seguido)
ALTER TABLE public.follows ADD CONSTRAINT follows_follower_id_followed_id_key UNIQUE (follower_id, followed_id);

-- =====================================================
-- 3. FUNCIÓN DE CONTEO DEFINITIVA
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_follow_stats_v2()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        -- Incrementamos seguidores del usuario "seguido"
        UPDATE public.profiles 
        SET followers_count = COALESCE(followers_count, 0) + 1 
        WHERE id = NEW.followed_id;
        
        -- Incrementamos seguidos del usuario "seguidor"
        UPDATE public.profiles 
        SET following_count = COALESCE(following_count, 0) + 1 
        WHERE id = NEW.follower_id;
        
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        -- Decrementamos seguidores del usuario "seguido" (mínimo 0)
        UPDATE public.profiles 
        SET followers_count = GREATEST(0, COALESCE(followers_count, 0) - 1) 
        WHERE id = OLD.followed_id;
        
        -- Decrementamos seguidos del usuario "seguidor" (mínimo 0)
        UPDATE public.profiles 
        SET following_count = GREATEST(0, COALESCE(following_count, 0) - 1) 
        WHERE id = OLD.follower_id;
        
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. CREACIÓN DEL TRIGGER ÚNICO
-- =====================================================

CREATE TRIGGER tr_follows_balance_v2
AFTER INSERT OR DELETE ON public.follows
FOR EACH ROW EXECUTE FUNCTION public.handle_follow_stats_v2();
