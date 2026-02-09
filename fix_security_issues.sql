-- Fix: Function has a role mutable search_path
-- We explicitly set the search_path to 'public' for SECURITY DEFINER functions to prevent search_path hijacking.

ALTER FUNCTION public.handle_post_repost_count() SET search_path = public;
ALTER FUNCTION public.handle_news_interactions() SET search_path = public;
ALTER FUNCTION public.handle_post_like_count() SET search_path = public;
ALTER FUNCTION public.handle_news_comments_count() SET search_path = public;
ALTER FUNCTION public.handle_event_support_sync() SET search_path = public;
ALTER FUNCTION public.handle_post_likes_count() SET search_path = public;
ALTER FUNCTION public.handle_post_comments_count() SET search_path = public;
ALTER FUNCTION public.handle_follow_counts() SET search_path = public;
ALTER FUNCTION public.handle_news_vote_counters_v2() SET search_path = public;
ALTER FUNCTION public.handle_news_vote_sync() SET search_path = public;
ALTER FUNCTION public.handle_follows_counters() SET search_path = public;
ALTER FUNCTION public.handle_post_vote_counters_v2() SET search_path = public;
ALTER FUNCTION public.sync_repost_counters_final() SET search_path = public;
ALTER FUNCTION public.handle_follow_stats_v2() SET search_path = public;
ALTER FUNCTION public.handle_repost_counters_v2() SET search_path = public;
ALTER FUNCTION public.sync_news_votes_v4() SET search_path = public;
ALTER FUNCTION public.handle_news_vote() SET search_path = public;
ALTER FUNCTION public.handle_follow_stats() SET search_path = public;
ALTER FUNCTION public.handle_post_comment_count() SET search_path = public;
ALTER FUNCTION public.handle_news_comment_count() SET search_path = public;
ALTER FUNCTION public.handle_reply_count_sync() SET search_path = public;
ALTER FUNCTION public.handle_follow_count_sync() SET search_path = public;
ALTER FUNCTION public.handle_repost_operations_v5() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.handle_comment_likes_count() SET search_path = public;

-- Fix: Table public.notifications has an overly permissive RLS policy
-- "notifications_insert_all" allowed unrestricted access.
-- We restrict INSERT to only allow users to create notifications where they are the sender.

DROP POLICY IF EXISTS "notifications_insert_all" ON "public"."notifications";
CREATE POLICY "notifications_insert_own" ON "public"."notifications"
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);

-- Fix: Table public.profiles has an overly permissive RLS policy for UPDATE
-- "System can update profile counters" allowed unrestricted access.
-- Profile counters should be updated by triggers (which bypass RLS if SECURITY DEFINER) 
-- or by the user themselves only for their own profile (if client-side).
-- Since we are securing functions, we can remove this unsafe open policy.
-- If client-side updates are needed for other fields, existing policies usually cover 'own profile' updates.

DROP POLICY IF EXISTS "System can update profile counters" ON "public"."profiles";

-- Ensure users can update their own profile (if not already covered by another policy)
-- DO NOT RUN if you already have a "Users can update own profile" policy.
-- The safe bet is just to drop the unsafe one.
