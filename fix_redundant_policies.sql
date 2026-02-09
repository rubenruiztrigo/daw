-- CLEANUP REDUNDANT RLS POLICIES

-----------------------------------------------------------------------
-- NEWS
-----------------------------------------------------------------------
-- Keep 'news_read', drop duplicates
DROP POLICY IF EXISTS "Lectura pública de noticias" ON "public"."news";

-----------------------------------------------------------------------
-- NEWS COMMENTS
-----------------------------------------------------------------------
-- Keep 'news_comments_read', drop duplicates
DROP POLICY IF EXISTS "Lectura pública de comentarios noticias" ON "public"."news_comments";

-----------------------------------------------------------------------
-- NEWS VOTES
DROP POLICY IF EXISTS "votes_manage" ON "public"."news_votes";
CREATE POLICY "votes_manage" ON "public"."news_votes" FOR INSERT TO authenticated WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "votes_manage_update" ON "public"."news_votes";
CREATE POLICY "votes_manage_update" ON "public"."news_votes" FOR UPDATE TO authenticated USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "votes_manage_delete" ON "public"."news_votes";
CREATE POLICY "votes_manage_delete" ON "public"."news_votes" FOR DELETE TO authenticated USING (user_id = (select auth.uid()));

-- Clean up any other duplicates if they exist (from previous reports)
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON "public"."news_votes"; -- Old
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON "public"."news_votes"; -- Old

-----------------------------------------------------------------------
-- POST COMMENTS
-----------------------------------------------------------------------
DROP POLICY IF EXISTS "Lectura pública de comentarios posts" ON "public"."post_comments";

-----------------------------------------------------------------------
-- POST LIKES
-----------------------------------------------------------------------
-- Similar to votes: separate SELECT from MANAGE
DROP POLICY IF EXISTS "Lectura pública de likes posts" ON "public"."post_likes";
-- Ensure we have a public read policy if "Lectura..." was the only one.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'post_likes' AND policyname = 'likes_read') THEN
        CREATE POLICY "likes_read" ON "public"."post_likes" FOR SELECT TO authenticated USING (true);
    END IF;
END
$$;

-- Redefine likes_manage to exclude SELECT (avoid redundancy with likes_read)
DROP POLICY IF EXISTS "likes_manage" ON "public"."post_likes";

DROP POLICY IF EXISTS "likes_manage_insert" ON "public"."post_likes";
CREATE POLICY "likes_manage_insert" ON "public"."post_likes" FOR INSERT TO authenticated WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "likes_manage_delete" ON "public"."post_likes";
CREATE POLICY "likes_manage_delete" ON "public"."post_likes" FOR DELETE TO authenticated USING (user_id = (select auth.uid()));

-----------------------------------------------------------------------
-- POST REPOSTS
-----------------------------------------------------------------------
DROP POLICY IF EXISTS "Reposts visibles para todos" ON "public"."post_reposts";
-- Ensure replacement read policy exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'post_reposts' AND policyname = 'reposts_read') THEN
        CREATE POLICY "reposts_read" ON "public"."post_reposts" FOR SELECT TO authenticated USING (true);
    END IF;
END
$$;

-- Redefine reposts_manage to exclude SELECT
DROP POLICY IF EXISTS "reposts_manage" ON "public"."post_reposts";

DROP POLICY IF EXISTS "reposts_manage_insert" ON "public"."post_reposts";
CREATE POLICY "reposts_manage_insert" ON "public"."post_reposts" FOR INSERT TO authenticated WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "reposts_manage_delete" ON "public"."post_reposts";
CREATE POLICY "reposts_manage_delete" ON "public"."post_reposts" FOR DELETE TO authenticated USING (user_id = (select auth.uid()));

-----------------------------------------------------------------------
-- POSTS
-----------------------------------------------------------------------
DROP POLICY IF EXISTS "Lectura pública de posts" ON "public"."posts";

-----------------------------------------------------------------------
-- PROFILES
-----------------------------------------------------------------------
DROP POLICY IF EXISTS "Lectura pública de perfiles" ON "public"."profiles";
DROP POLICY IF EXISTS "Perfiles lectura pública" ON "public"."profiles";
DROP POLICY IF EXISTS "Perfiles legibles" ON "public"."profiles";
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON "public"."profiles";

-----------------------------------------------------------------------
-- USER EVENTS
-----------------------------------------------------------------------
-- Ensure read policy exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_events' AND policyname = 'events_read') THEN
        CREATE POLICY "events_read" ON "public"."user_events" FOR SELECT TO authenticated USING (true);
    END IF;
END
$$;

-- Drop redundant overlapping policies
DROP POLICY IF EXISTS "events_insert" ON "public"."user_events";
DROP POLICY IF EXISTS "events_manage_self" ON "public"."user_events";

-- Re-create manage policies strictly for write actions to avoid overlap with events_read
DROP POLICY IF EXISTS "events_manage_insert" ON "public"."user_events";
CREATE POLICY "events_manage_insert" ON "public"."user_events" FOR INSERT TO authenticated WITH CHECK (creator_id = (select auth.uid()));

DROP POLICY IF EXISTS "events_manage_update" ON "public"."user_events";
CREATE POLICY "events_manage_update" ON "public"."user_events" FOR UPDATE TO authenticated USING (creator_id = (select auth.uid()));

DROP POLICY IF EXISTS "events_manage_delete" ON "public"."user_events";
CREATE POLICY "events_manage_delete" ON "public"."user_events" FOR DELETE TO authenticated USING (creator_id = (select auth.uid()));

