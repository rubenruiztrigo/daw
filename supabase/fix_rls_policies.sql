-- Fix RLS policies for posts and news tables
-- This ensures that authenticated users can create posts and news items.

-- 1. Enable RLS on posts and news if not already enabled
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts (they might be broken or too restrictive)
DROP POLICY IF EXISTS "Users can insert their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;

DROP POLICY IF EXISTS "Users can insert their own news" ON public.news;
DROP POLICY IF EXISTS "Users can update their own news" ON public.news;
DROP POLICY IF EXISTS "Users can delete their own news" ON public.news;
DROP POLICY IF EXISTS "News are viewable by everyone" ON public.news;

-- 3. Create permissive policies for posts
CREATE POLICY "Posts are viewable by everyone" 
  ON public.posts FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert their own posts" 
  ON public.posts FOR INSERT 
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own posts" 
  ON public.posts FOR UPDATE 
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own posts" 
  ON public.posts FOR DELETE 
  USING (auth.uid() = author_id);

-- 4. Create permissive policies for news
CREATE POLICY "News are viewable by everyone" 
  ON public.news FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert their own news" 
  ON public.news FOR INSERT 
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own news" 
  ON public.news FOR UPDATE 
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own news" 
  ON public.news FOR DELETE 
  USING (auth.uid() = author_id);

-- 5. Fix for Comments and Replies
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Comments viewable by everyone" ON public.post_comments;
DROP POLICY IF EXISTS "Users can insert their own post comments" ON public.post_comments;
CREATE POLICY "Comments viewable by everyone" ON public.post_comments FOR SELECT USING (true);
CREATE POLICY "Users can insert their own post comments" ON public.post_comments FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "News comments viewable by everyone" ON public.news_comments;
DROP POLICY IF EXISTS "Users can insert their own news comments" ON public.news_comments;
CREATE POLICY "News comments viewable by everyone" ON public.news_comments FOR SELECT USING (true);
CREATE POLICY "Users can insert their own news comments" ON public.news_comments FOR INSERT WITH CHECK (auth.uid() = author_id);

-- 6. Fix for Likes/Votes
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Likes viewable by everyone" ON public.post_likes;
DROP POLICY IF EXISTS "Users can manage their own likes" ON public.post_likes;
CREATE POLICY "Likes viewable by everyone" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "Users can manage their own likes" ON public.post_likes FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Replies viewable by everyone" ON public.comment_replies;
DROP POLICY IF EXISTS "Users can insert their own replies" ON public.comment_replies;
CREATE POLICY "Replies viewable by everyone" ON public.comment_replies FOR SELECT USING (true);
CREATE POLICY "Users can insert their own replies" ON public.comment_replies FOR INSERT WITH CHECK (auth.uid() = author_id);

-- 7. Fix for Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can see their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;
CREATE POLICY "Users can see their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert notifications" ON public.notifications FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- 8. Fix for Reposts
ALTER TABLE public.reposts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Reposts viewable by everyone" ON public.reposts;
DROP POLICY IF EXISTS "Users can manage their own reposts" ON public.reposts;
CREATE POLICY "Reposts viewable by everyone" ON public.reposts FOR SELECT USING (true);
CREATE POLICY "Users can manage their own reposts" ON public.reposts FOR ALL USING (auth.uid() = user_id);

-- 9. Grant permissions
GRANT ALL ON TABLE public.posts TO authenticated;
GRANT ALL ON TABLE public.news TO authenticated;
GRANT ALL ON TABLE public.post_comments TO authenticated;
GRANT ALL ON TABLE public.news_comments TO authenticated;
GRANT ALL ON TABLE public.comment_replies TO authenticated;
GRANT ALL ON TABLE public.post_likes TO authenticated;
GRANT ALL ON TABLE public.news_votes TO authenticated;
GRANT ALL ON TABLE public.notifications TO authenticated;
GRANT ALL ON TABLE public.reposts TO authenticated;
GRANT ALL ON TABLE public.comment_likes TO authenticated;
GRANT ALL ON TABLE public.user_events TO authenticated;
GRANT ALL ON TABLE public.rewards TO authenticated;
GRANT ALL ON TABLE public.ranking_history TO authenticated;

-- Policies for user_events
ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Events are viewable by everyone" ON public.user_events;
DROP POLICY IF EXISTS "Users can insert their own events" ON public.user_events;
DROP POLICY IF EXISTS "Users can update their own events" ON public.user_events;
DROP POLICY IF EXISTS "Users can delete their own events" ON public.user_events;

CREATE POLICY "Events are viewable by everyone" ON public.user_events FOR SELECT USING (true);
CREATE POLICY "Users can insert their own events" ON public.user_events FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Users can update their own events" ON public.user_events FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Users can delete their own events" ON public.user_events FOR DELETE USING (auth.uid() = creator_id);

-- Policies for rewards
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Rewards are viewable by everyone" ON public.rewards;
DROP POLICY IF EXISTS "Admins can insert rewards" ON public.rewards;
DROP POLICY IF EXISTS "Admins can update rewards" ON public.rewards;
DROP POLICY IF EXISTS "Admins can delete rewards" ON public.rewards;

CREATE POLICY "Rewards are viewable by everyone" ON public.rewards FOR SELECT USING (true);
CREATE POLICY "Admins can insert rewards" ON public.rewards FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));
CREATE POLICY "Admins can update rewards" ON public.rewards FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));
CREATE POLICY "Admins can delete rewards" ON public.rewards FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

-- Policies for ranking_history
ALTER TABLE public.ranking_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Ranking history is viewable by everyone" ON public.ranking_history;
CREATE POLICY "Ranking history is viewable by everyone" ON public.ranking_history FOR SELECT USING (true);

-- 10. Admin policies for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile" 
  ON public.profiles FOR UPDATE 
  TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

-- 11. Admin policies for posts (deletion)
DROP POLICY IF EXISTS "Admins can delete any post" ON public.posts;
CREATE POLICY "Admins can delete any post" 
  ON public.posts FOR DELETE 
  TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

-- 12. Admin policies for news (deletion)
DROP POLICY IF EXISTS "Admins can delete any news" ON public.news;
CREATE POLICY "Admins can delete any news" 
  ON public.news FOR DELETE 
  TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;

