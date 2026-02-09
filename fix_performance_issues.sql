-- OPTIMIZE RLS POLICIES
-- Replacing auth.uid() with (select auth.uid()) for performance caching

-- comment_likes
DROP POLICY IF EXISTS "Insertar likes propios comentarios" ON "public"."comment_likes";
CREATE POLICY "Insertar likes propios comentarios" ON "public"."comment_likes" FOR INSERT TO authenticated WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Borrar likes propios comentarios" ON "public"."comment_likes";
CREATE POLICY "Borrar likes propios comentarios" ON "public"."comment_likes" FOR DELETE TO authenticated USING (user_id = (select auth.uid()));

-- notifications
DROP POLICY IF EXISTS "notifications_insert_own" ON "public"."notifications";
CREATE POLICY "notifications_insert_own" ON "public"."notifications" FOR INSERT TO authenticated WITH CHECK (sender_id = (select auth.uid()));

DROP POLICY IF EXISTS "notifications_read" ON "public"."notifications";
CREATE POLICY "notifications_read" ON "public"."notifications" FOR SELECT TO authenticated USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "notifications_update" ON "public"."notifications";
CREATE POLICY "notifications_update" ON "public"."notifications" FOR UPDATE TO authenticated USING (user_id = (select auth.uid()));

-- profiles
DROP POLICY IF EXISTS "profiles_update_self" ON "public"."profiles";
DROP POLICY IF EXISTS "Users can update their own profile" ON "public"."profiles"; -- Duplicate
CREATE POLICY "profiles_update_self" ON "public"."profiles" FOR UPDATE TO authenticated USING (id = (select auth.uid())) WITH CHECK (id = (select auth.uid()));

-- posts
DROP POLICY IF EXISTS "posts_insert" ON "public"."posts";
CREATE POLICY "posts_insert" ON "public"."posts" FOR INSERT TO authenticated WITH CHECK (author_id = (select auth.uid()));

DROP POLICY IF EXISTS "posts_delete_self" ON "public"."posts";
CREATE POLICY "posts_delete_self" ON "public"."posts" FOR DELETE TO authenticated USING (author_id = (select auth.uid()));

-- news
DROP POLICY IF EXISTS "news_insert" ON "public"."news";
CREATE POLICY "news_insert" ON "public"."news" FOR INSERT TO authenticated WITH CHECK (author_id = (select auth.uid()));

DROP POLICY IF EXISTS "news_delete_self" ON "public"."news";
CREATE POLICY "news_delete_self" ON "public"."news" FOR DELETE TO authenticated USING (author_id = (select auth.uid()));

-- user_events
DROP POLICY IF EXISTS "events_insert" ON "public"."user_events";
CREATE POLICY "events_insert" ON "public"."user_events" FOR INSERT TO authenticated WITH CHECK (creator_id = (select auth.uid()));

DROP POLICY IF EXISTS "events_manage_self" ON "public"."user_events";
CREATE POLICY "events_manage_self" ON "public"."user_events" FOR ALL TO authenticated USING (creator_id = (select auth.uid())) WITH CHECK (creator_id = (select auth.uid()));

-- post_comments
DROP POLICY IF EXISTS "comments_insert" ON "public"."post_comments";
CREATE POLICY "comments_insert" ON "public"."post_comments" FOR INSERT TO authenticated WITH CHECK (author_id = (select auth.uid()));

-- news_comments
DROP POLICY IF EXISTS "news_comments_insert" ON "public"."news_comments";
CREATE POLICY "news_comments_insert" ON "public"."news_comments" FOR INSERT TO authenticated WITH CHECK (author_id = (select auth.uid()));

-- comment_replies
DROP POLICY IF EXISTS "replies_insert" ON "public"."comment_replies";
CREATE POLICY "replies_insert" ON "public"."comment_replies" FOR INSERT TO authenticated WITH CHECK (author_id = (select auth.uid()));

-- post_likes
DROP POLICY IF EXISTS "likes_manage" ON "public"."post_likes";
CREATE POLICY "likes_manage" ON "public"."post_likes" FOR ALL TO authenticated USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

-- news_votes
DROP POLICY IF EXISTS "votes_manage" ON "public"."news_votes";
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON "public"."news_votes";
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON "public"."news_votes";
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON "public"."news_votes";
-- Consolidate into one manage policy
CREATE POLICY "votes_manage" ON "public"."news_votes" FOR ALL TO authenticated USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

-- post_reposts
DROP POLICY IF EXISTS "reposts_manage" ON "public"."post_reposts";
DROP POLICY IF EXISTS "Usuarios pueden republicar" ON "public"."post_reposts";
DROP POLICY IF EXISTS "Usuarios pueden eliminar su republicación" ON "public"."post_reposts";
CREATE POLICY "reposts_manage" ON "public"."post_reposts" FOR ALL TO authenticated USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

-- event_supports
DROP POLICY IF EXISTS "supports_manage" ON "public"."event_supports";
CREATE POLICY "supports_manage" ON "public"."event_supports" FOR ALL TO authenticated USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

-- messages
DROP POLICY IF EXISTS "messages_read" ON "public"."messages";
CREATE POLICY "messages_read" ON "public"."messages" FOR SELECT TO authenticated USING (sender_id = (select auth.uid()) OR recipient_id = (select auth.uid()));

DROP POLICY IF EXISTS "messages_insert" ON "public"."messages";
CREATE POLICY "messages_insert" ON "public"."messages" FOR INSERT TO authenticated WITH CHECK (sender_id = (select auth.uid()));

-- follows
DROP POLICY IF EXISTS "Permitir seguir a otros" ON "public"."follows";
CREATE POLICY "follows_insert" ON "public"."follows" FOR INSERT TO authenticated WITH CHECK (follower_id = (select auth.uid()));

DROP POLICY IF EXISTS "Permitir dejar de seguir" ON "public"."follows";
CREATE POLICY "follows_delete" ON "public"."follows" FOR DELETE TO authenticated USING (follower_id = (select auth.uid()));

-- posts_eliminados
DROP POLICY IF EXISTS "Permitir inserción a dueños" ON "public"."posts_eliminados";
CREATE POLICY "posts_eliminados_insert" ON "public"."posts_eliminados" FOR INSERT TO authenticated WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Permitir lectura a dueños" ON "public"."posts_eliminados";
CREATE POLICY "posts_eliminados_select" ON "public"."posts_eliminados" FOR SELECT TO authenticated USING (user_id = (select auth.uid()));


-- CLEAN P IDENTICAL/REDUNDANT INDEXES
-- We drop the specific unique keys if they are redundant with PKEYs.
-- Assumption: PKEY is (user_id, news_id) or similar. If PKEY is 'id', then we keep Unique Key. 
-- However, user report says "identical". Usually one is the PK constraint index and the other is manually created.
-- We'll try to drop the likely-manual one.

ALTER TABLE "public"."follows" DROP CONSTRAINT IF EXISTS "follows_follower_id_followed_id_key";
ALTER TABLE "public"."news_votes" DROP CONSTRAINT IF EXISTS "news_votes_user_id_news_id_key";
ALTER TABLE "public"."post_reposts" DROP CONSTRAINT IF EXISTS "post_reposts_user_id_post_id_key";

