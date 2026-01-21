
-- 1. Asegurar tabla de noticias con contadores independientes
CREATE TABLE IF NOT EXISTS public.news (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    image_url TEXT,
    tags TEXT[] DEFAULT '{}',
    up_votes_count INTEGER DEFAULT 0,
    down_votes_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0, -- Este se usará como el "Net Score" para ranking
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Asegurar tablas de interacción
CREATE TABLE IF NOT EXISTS public.news_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    news_id UUID NOT NULL REFERENCES public.news(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.news_likes (
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    news_id UUID NOT NULL REFERENCES public.news(id) ON DELETE CASCADE,
    vote_type TEXT CHECK (vote_type IN ('up', 'down')) DEFAULT 'up',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, news_id)
);

-- 3. FUNCIÓN DE INTERACCIONES MEJORADA
CREATE OR REPLACE FUNCTION public.handle_news_interactions()
RETURNS TRIGGER AS $$
DECLARE
    target_news_id UUID;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    target_news_id := OLD.news_id;
  ELSE
    target_news_id := NEW.news_id;
  END IF;

  UPDATE public.news 
  SET 
    up_votes_count = (SELECT COUNT(*) FROM public.news_likes WHERE news_id = target_news_id AND vote_type = 'up'),
    down_votes_count = (SELECT COUNT(*) FROM public.news_likes WHERE news_id = target_news_id AND vote_type = 'down'),
    likes_count = (
      SELECT COALESCE(SUM(CASE WHEN vote_type = 'up' THEN 1 WHEN vote_type = 'down' THEN -1 ELSE 0 END), 0)
      FROM public.news_likes WHERE news_id = target_news_id
    )
  WHERE id = target_news_id;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. APLICAR TRIGGER
DROP TRIGGER IF EXISTS tr_news_likes_update ON public.news_likes;
CREATE TRIGGER tr_news_likes_update
AFTER INSERT OR UPDATE OR DELETE ON public.news_likes
FOR EACH ROW EXECUTE FUNCTION public.handle_news_interactions();
