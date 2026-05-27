-- ============================================================================
-- Fix Counters Triggers, Realtime Publications, and Notifications RLS Policies
-- ============================================================================

-- 1. Correct RLS Policies on Notifications
-- Allows the sender to update or delete notifications (e.g. toggling off a like or repost)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can see their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;

-- Anyone can select notifications where they are the recipient
CREATE POLICY "Users can see their own notifications" 
  ON public.notifications FOR SELECT 
  USING (auth.uid() = user_id);

-- Anyone can insert a notification as long as they are the sender
CREATE POLICY "Users can insert notifications" 
  ON public.notifications FOR INSERT 
  WITH CHECK (auth.uid() = sender_id);

-- Senders and recipients can update notifications (e.g. marking as read or changing state)
CREATE POLICY "Users can update their own notifications" 
  ON public.notifications FOR UPDATE 
  USING (auth.uid() = user_id OR auth.uid() = sender_id);

-- Senders and recipients can delete notifications (e.g. deleting when undoing a like/repost)
CREATE POLICY "Users can delete their own notifications" 
  ON public.notifications FOR DELETE 
  USING (auth.uid() = user_id OR auth.uid() = sender_id);


-- 2. Triggers to Keep Post Likes Counter in Sync
CREATE OR REPLACE FUNCTION public.fn_sync_post_likes_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 'up' THEN
      UPDATE public.posts SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = NEW.post_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote_type = 'up' THEN
      UPDATE public.posts SET likes_count = GREATEST(0, COALESCE(likes_count, 0) - 1) WHERE id = OLD.post_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.vote_type = NEW.vote_type THEN
      -- No change
    ELSIF OLD.vote_type = 'up' AND NEW.vote_type = 'down' THEN
      UPDATE public.posts SET likes_count = GREATEST(0, COALESCE(likes_count, 0) - 1) WHERE id = NEW.post_id;
    ELSIF OLD.vote_type = 'down' AND NEW.vote_type = 'up' THEN
      UPDATE public.posts SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = NEW.post_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_post_likes_count ON public.post_likes;
CREATE TRIGGER trg_sync_post_likes_count
AFTER INSERT OR DELETE OR UPDATE ON public.post_likes
FOR EACH ROW EXECUTE FUNCTION public.fn_sync_post_likes_count();


-- 3. Triggers to Keep News Votes Counter in Sync
CREATE OR REPLACE FUNCTION public.fn_sync_news_votes_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 'up' THEN
      UPDATE public.news SET 
        up_votes_count = COALESCE(up_votes_count, 0) + 1,
        likes_count = COALESCE(likes_count, 0) + 1
      WHERE id = NEW.news_id;
    ELSIF NEW.vote_type = 'down' THEN
      UPDATE public.news SET down_votes_count = COALESCE(down_votes_count, 0) + 1 WHERE id = NEW.news_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote_type = 'up' THEN
      UPDATE public.news SET 
        up_votes_count = GREATEST(0, COALESCE(up_votes_count, 0) - 1),
        likes_count = GREATEST(0, COALESCE(likes_count, 0) - 1)
      WHERE id = OLD.news_id;
    ELSIF OLD.vote_type = 'down' THEN
      UPDATE public.news SET down_votes_count = GREATEST(0, COALESCE(down_votes_count, 0) - 1) WHERE id = OLD.news_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.vote_type = NEW.vote_type THEN
      -- No change
    ELSIF OLD.vote_type = 'up' AND NEW.vote_type = 'down' THEN
      UPDATE public.news SET 
        up_votes_count = GREATEST(0, COALESCE(up_votes_count, 0) - 1),
        likes_count = GREATEST(0, COALESCE(likes_count, 0) - 1),
        down_votes_count = COALESCE(down_votes_count, 0) + 1
      WHERE id = NEW.news_id;
    ELSIF OLD.vote_type = 'down' AND NEW.vote_type = 'up' THEN
      UPDATE public.news SET 
        down_votes_count = GREATEST(0, COALESCE(down_votes_count, 0) - 1),
        up_votes_count = COALESCE(up_votes_count, 0) + 1,
        likes_count = COALESCE(likes_count, 0) + 1
      WHERE id = NEW.news_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_news_votes_count ON public.news_votes;
CREATE TRIGGER trg_sync_news_votes_count
AFTER INSERT OR DELETE OR UPDATE ON public.news_votes
FOR EACH ROW EXECUTE FUNCTION public.fn_sync_news_votes_count();


-- 4. Triggers to Keep Post Comments Counter in Sync
CREATE OR REPLACE FUNCTION public.fn_sync_post_comments_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET comments_count = COALESCE(comments_count, 0) + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET comments_count = GREATEST(0, COALESCE(comments_count, 0) - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_post_comments_count ON public.post_comments;
CREATE TRIGGER trg_sync_post_comments_count
AFTER INSERT OR DELETE ON public.post_comments
FOR EACH ROW EXECUTE FUNCTION public.fn_sync_post_comments_count();


-- 5. Triggers to Keep News Comments Counter in Sync
CREATE OR REPLACE FUNCTION public.fn_sync_news_comments_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.news SET comments_count = COALESCE(comments_count, 0) + 1 WHERE id = NEW.news_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.news SET comments_count = GREATEST(0, COALESCE(comments_count, 0) - 1) WHERE id = OLD.news_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_news_comments_count ON public.news_comments;
CREATE TRIGGER trg_sync_news_comments_count
AFTER INSERT OR DELETE ON public.news_comments
FOR EACH ROW EXECUTE FUNCTION public.fn_sync_news_comments_count();


-- 6. Triggers to Keep Reposts Counter in Sync
CREATE OR REPLACE FUNCTION public.fn_sync_reposts_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.post_id IS NOT NULL THEN
      UPDATE public.posts SET reposts_count = COALESCE(reposts_count, 0) + 1 WHERE id = NEW.post_id;
    ELSIF NEW.news_id IS NOT NULL THEN
      UPDATE public.news SET reposts_count = COALESCE(reposts_count, 0) + 1 WHERE id = NEW.news_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.post_id IS NOT NULL THEN
      UPDATE public.posts SET reposts_count = GREATEST(0, COALESCE(reposts_count, 0) - 1) WHERE id = OLD.post_id;
    ELSIF OLD.news_id IS NOT NULL THEN
      UPDATE public.news SET reposts_count = GREATEST(0, COALESCE(reposts_count, 0) - 1) WHERE id = OLD.news_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_reposts_count ON public.reposts;
CREATE TRIGGER trg_sync_reposts_count
AFTER INSERT OR DELETE ON public.reposts
FOR EACH ROW EXECUTE FUNCTION public.fn_sync_reposts_count();


-- 7. Safe Execution: Add Tables to Supabase Realtime Publication if not already added
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    -- posts
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'posts'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
    END IF;

    -- news
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'news'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.news;
    END IF;

    -- post_likes
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'post_likes'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.post_likes;
    END IF;

    -- news_votes
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'news_votes'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.news_votes;
    END IF;

    -- post_comments
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'post_comments'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;
    END If;

    -- news_comments
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'news_comments'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.news_comments;
    END IF;

    -- reposts
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'reposts'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.reposts;
    END IF;

    -- notifications
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
  END IF;
END $$;


-- 8. Recalculate and update the current counts to fix existing data
UPDATE public.posts p
SET 
  likes_count = (SELECT count(*) FROM public.post_likes l WHERE l.post_id = p.id AND l.vote_type = 'up'),
  comments_count = (SELECT count(*) FROM public.post_comments c WHERE c.post_id = p.id),
  reposts_count = (SELECT count(*) FROM public.reposts r WHERE r.post_id = p.id);

UPDATE public.news n
SET 
  up_votes_count = (SELECT count(*) FROM public.news_votes v WHERE v.news_id = n.id AND v.vote_type = 'up'),
  down_votes_count = (SELECT count(*) FROM public.news_votes v WHERE v.news_id = n.id AND v.vote_type = 'down'),
  likes_count = (SELECT count(*) FROM public.news_votes v WHERE v.news_id = n.id AND v.vote_type = 'up'),
  comments_count = (SELECT count(*) FROM public.news_comments c WHERE c.news_id = n.id),
  reposts_count = (SELECT count(*) FROM public.reposts r WHERE r.news_id = n.id);

NOTIFY pgrst, 'reload schema';
