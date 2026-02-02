
-- =====================================================
-- ESTRUCTURA DE LA TABLA DE RESPUESTAS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.comment_replies (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id uuid NOT NULL, -- ID del comentario raíz (puede ser de post_comments o news_comments)
    parent_reply_id uuid DEFAULT NULL, -- ID de la respuesta a la que se está contestando (para anidamiento)
    author_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    content text NOT NULL,
    created_at timestamptz DEFAULT now(),
    likes integer DEFAULT 0
);

-- Habilitar RLS
ALTER TABLE public.comment_replies ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso
CREATE POLICY "Permitir lectura pública de respuestas" ON public.comment_replies FOR SELECT USING (true);
CREATE POLICY "Permitir inserción a usuarios autenticados" ON public.comment_replies FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Permitir borrado a dueños" ON public.comment_replies FOR DELETE USING (auth.uid() = author_id);

-- =====================================================
-- TRIGGERS DE CONTEO (ACTUALIZADOS)
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_reply_count_sync_v2()
RETURNS TRIGGER AS $$
DECLARE
    v_post_id uuid;
    v_news_id uuid;
    v_target_user_id uuid;
BEGIN
    -- 1. Intentar encontrar si el comentario es de un Post
    SELECT post_id, author_id INTO v_post_id, v_target_user_id FROM public.post_comments WHERE id = COALESCE(NEW.comment_id, OLD.comment_id);
    
    IF v_post_id IS NOT NULL THEN
        IF (TG_OP = 'INSERT') THEN
            UPDATE public.posts SET comments_count = comments_count + 1 WHERE id = v_post_id;
        ELSIF (TG_OP = 'DELETE') THEN
            UPDATE public.posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = v_post_id;
        END IF;
    ELSE
        -- 2. Si no, intentar en Noticias
        SELECT news_id, author_id INTO v_news_id, v_target_user_id FROM public.news_comments WHERE id = COALESCE(NEW.comment_id, OLD.comment_id);
        IF v_news_id IS NOT NULL THEN
            IF (TG_OP = 'INSERT') THEN
                UPDATE public.news SET comments_count = comments_count + 1 WHERE id = v_news_id;
            ELSIF (TG_OP = 'DELETE') THEN
                UPDATE public.news SET comments_count = GREATEST(0, comments_count - 1) WHERE id = v_news_id;
            END IF;
        END IF;
    END IF;

    IF (TG_OP = 'INSERT') THEN RETURN NEW; ELSE RETURN OLD; END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_replies_count_sync ON public.comment_replies;
CREATE TRIGGER tr_replies_count_sync
AFTER INSERT OR DELETE ON public.comment_replies
FOR EACH ROW EXECUTE FUNCTION public.handle_reply_count_sync_v2();
