
-- Asegurar que la tabla profiles tenga los contadores inicializados
UPDATE public.profiles SET followers_count = 0 WHERE followers_count IS NULL;
UPDATE public.profiles SET following_count = 0 WHERE following_count IS NULL;

-- Función optimizada para sincronizar seguidores/seguidos
CREATE OR REPLACE FUNCTION public.handle_follow_count_sync()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    -- Incrementar seguidores del usuario seguido
    UPDATE public.profiles 
    SET followers_count = COALESCE(followers_count, 0) + 1 
    WHERE id = NEW.followed_id;
    
    -- Incrementar seguidos del usuario que inicia la acción
    UPDATE public.profiles 
    SET following_count = COALESCE(following_count, 0) + 1 
    WHERE id = NEW.follower_id;
    
  ELSIF (TG_OP = 'DELETE') THEN
    -- Decrementar seguidores del usuario que deja de ser seguido
    UPDATE public.profiles 
    SET followers_count = GREATEST(0, COALESCE(followers_count, 0) - 1) 
    WHERE id = OLD.followed_id;
    
    -- Decrementar seguidos del usuario que deja de seguir
    UPDATE public.profiles 
    SET following_count = GREATEST(0, COALESCE(following_count, 0) - 1) 
    WHERE id = OLD.follower_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-crear el trigger para asegurar limpieza
DROP TRIGGER IF EXISTS on_follow_change ON public.follows;
CREATE TRIGGER on_follow_change
  AFTER INSERT OR DELETE ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.handle_follow_count_sync();
