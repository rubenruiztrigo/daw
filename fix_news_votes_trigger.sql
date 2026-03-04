-- ==========================================
-- 1. NUCLEAR CLEANUP: Drop ALL existing triggers on news_votes
-- ==========================================
DO $$ 
DECLARE 
    trig_name text;
BEGIN
    FOR trig_name IN 
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_table = 'news_votes' 
        AND trigger_schema = 'public'
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(trig_name) || ' ON public.news_votes';
    END LOOP;
END $$;

-- ==========================================
-- 2. Function to handle likes_count update (ONLY UPVOTES COUNT)
-- ==========================================
CREATE OR REPLACE FUNCTION public.fn_update_news_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    -- INSERT: Only increment if vote is 'up'
    IF (TG_OP = 'INSERT') THEN
        IF (NEW.vote_type = 'up') THEN
            UPDATE public.news SET likes_count = likes_count + 1 WHERE id = NEW.news_id;
        END IF;
    
    -- UPDATE: Handle switching between up/down
    ELSIF (TG_OP = 'UPDATE') THEN
        IF (OLD.vote_type = 'down' AND NEW.vote_type = 'up') THEN
            UPDATE public.news SET likes_count = likes_count + 1 WHERE id = NEW.news_id;
        ELSIF (OLD.vote_type = 'up' AND NEW.vote_type = 'down') THEN
            UPDATE public.news SET likes_count = likes_count - 1 WHERE id = NEW.news_id;
        END IF;

    -- DELETE: Only decrement if the deleted vote was 'up'
    ELSIF (TG_OP = 'DELETE') THEN
        IF (OLD.vote_type = 'up') THEN
            UPDATE public.news SET likes_count = likes_count - 1 WHERE id = OLD.news_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 3. Create the definitive trigger
-- ==========================================
CREATE TRIGGER tr_news_votes_count
AFTER INSERT OR UPDATE OR DELETE ON public.news_votes
FOR EACH ROW EXECUTE FUNCTION public.fn_update_news_likes_count();

-- ==========================================
-- 4. SYNC existing counts (COUNT ONLY 'UP' VOTES)
-- ==========================================
UPDATE public.news n
SET likes_count = (
    SELECT COUNT(*)
    FROM public.news_votes
    WHERE news_id = n.id AND vote_type = 'up'
);

-- REFRESH
NOTIFY pgrst, 'reload schema';
