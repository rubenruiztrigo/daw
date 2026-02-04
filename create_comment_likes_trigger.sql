-- ==========================================================
-- TRIGGER PARA ACTUALIZAR CONTADOR DE LIKES EN COMENTARIOS
-- ==========================================================

-- 1. Asegurar que existe la columna 'likes' en las tablas de comentarios
ALTER TABLE public.post_comments ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;
ALTER TABLE public.news_comments ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;
ALTER TABLE public.comment_replies ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;

-- 2. Función del Trigger
CREATE OR REPLACE FUNCTION public.handle_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    -- Intentar actualizar post_comments
    UPDATE public.post_comments SET likes = likes + 1 WHERE id = NEW.comment_id;
    -- Intentar actualizar news_comments (si no actualizó arriba, no pasa nada, si IDs son únicos globalmente mejor, sino podrían solaparse muy improbablemente con UUID)
    UPDATE public.news_comments SET likes = likes + 1 WHERE id = NEW.comment_id;
    -- Intentar actualizar replies
    UPDATE public.comment_replies SET likes = likes + 1 WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.post_comments SET likes = GREATEST(0, likes - 1) WHERE id = OLD.comment_id;
    UPDATE public.news_comments SET likes = GREATEST(0, likes - 1) WHERE id = OLD.comment_id;
    UPDATE public.comment_replies SET likes = GREATEST(0, likes - 1) WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Crear el Trigger en comment_likes
DROP TRIGGER IF EXISTS on_comment_like_change ON public.comment_likes;

CREATE TRIGGER on_comment_like_change
AFTER INSERT OR DELETE ON public.comment_likes
FOR EACH ROW EXECUTE FUNCTION public.handle_comment_likes_count();

SELECT 'Triggers de contador de likes creados correctamente.' as result;
