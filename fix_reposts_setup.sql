
-- ==========================================
-- 1. Create Reposts Table if not exists
-- ==========================================
CREATE TABLE IF NOT EXISTS public.reposts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    news_id UUID REFERENCES public.news(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Ensure a user can only repost a specific item once
    CONSTRAINT unique_user_post_repost UNIQUE (user_id, post_id),
    CONSTRAINT unique_user_news_repost UNIQUE (user_id, news_id),
    -- Ensure it's either a post or news, not both or neither
    CONSTRAINT check_repost_target CHECK (
        (post_id IS NOT NULL AND news_id IS NULL) OR 
        (post_id IS NULL AND news_id IS NOT NULL)
    )
);

-- Ensure count columns exist in target tables
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'reposts_count') THEN
        ALTER TABLE public.posts ADD COLUMN reposts_count INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'news' AND column_name = 'reposts_count') THEN
        ALTER TABLE public.news ADD COLUMN reposts_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- ==========================================
-- 2. Trigger Function for Reposts Count
-- ==========================================
CREATE OR REPLACE FUNCTION public.fn_update_reposts_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF (NEW.post_id IS NOT NULL) THEN
            UPDATE public.posts SET reposts_count = COALESCE(reposts_count, 0) + 1 WHERE id = NEW.post_id;
        ELSIF (NEW.news_id IS NOT NULL) THEN
            UPDATE public.news SET reposts_count = COALESCE(reposts_count, 0) + 1 WHERE id = NEW.news_id;
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        IF (OLD.post_id IS NOT NULL) THEN
            UPDATE public.posts SET reposts_count = GREATEST(0, COALESCE(reposts_count, 0) - 1) WHERE id = OLD.post_id;
        ELSIF (OLD.news_id IS NOT NULL) THEN
            UPDATE public.news SET reposts_count = GREATEST(0, COALESCE(reposts_count, 0) - 1) WHERE id = OLD.news_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 3. Create Trigger
-- ==========================================
DROP TRIGGER IF EXISTS tr_reposts_count ON public.reposts;
CREATE TRIGGER tr_reposts_count
AFTER INSERT OR DELETE ON public.reposts
FOR EACH ROW EXECUTE FUNCTION public.fn_update_reposts_count();

-- ==========================================
-- 4. Sync Counts
-- ==========================================
UPDATE public.posts p SET reposts_count = (SELECT COUNT(*) FROM public.reposts WHERE post_id = p.id);
UPDATE public.news n SET reposts_count = (SELECT COUNT(*) FROM public.reposts WHERE news_id = n.id);

-- Enable RLS
ALTER TABLE public.reposts ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Public read reposts" ON public.reposts;
CREATE POLICY "Public read reposts" ON public.reposts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can repost" ON public.reposts;
CREATE POLICY "Users can repost" ON public.reposts FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove their repost" ON public.reposts;
CREATE POLICY "Users can remove their repost" ON public.reposts FOR DELETE USING (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
