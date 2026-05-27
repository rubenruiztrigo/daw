
-- ============================================================================
-- Fix missing columns and relationships across tables to resolve 400 errors
-- ----------------------------------------------------------------------------
-- This script ensures all tables have the columns and relationships the frontend expects.
-- Run this in your Supabase SQL Editor.
-- ============================================================================

-- 1. Profiles Table Cleanup
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banner_color text;

-- 2. News Table Cleanup
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false;
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS pinned_at timestamp with time zone;
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS show_link_preview boolean DEFAULT true;
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS link_preview_url text;
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS up_votes_count integer DEFAULT 0;
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS down_votes_count integer DEFAULT 0;
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS reposts_count integer DEFAULT 0;
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS likes_count integer DEFAULT 0;
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS comments_count integer DEFAULT 0;
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS linked_event_id uuid;

-- 3. Notifications Table Cleanup
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS news_id uuid;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS post_id uuid;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS sender_id uuid REFERENCES public.profiles(id);
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id);
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS type text;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS content text;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false;
ALTER TABLE public.notifications ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 4. Ensure Relationships (Foreign Keys)
-- This is critical for queries like sender:profiles!sender_id(...)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'notifications_sender_id_fkey'
    ) THEN
        ALTER TABLE public.notifications 
        ADD CONSTRAINT notifications_sender_id_fkey 
        FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'news_author_id_fkey'
    ) THEN
        ALTER TABLE public.news 
        ADD CONSTRAINT news_author_id_fkey 
        FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_events_creator_id_fkey'
    ) THEN
        ALTER TABLE public.user_events 
        ADD CONSTRAINT user_events_creator_id_fkey 
        FOREIGN KEY (creator_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 5. Data Integrity Defaults
UPDATE public.news SET up_votes_count = 0 WHERE up_votes_count IS NULL;
UPDATE public.news SET down_votes_count = 0 WHERE down_votes_count IS NULL;
UPDATE public.news SET reposts_count = 0 WHERE reposts_count IS NULL;
UPDATE public.news SET likes_count = 0 WHERE likes_count IS NULL;
UPDATE public.news SET comments_count = 0 WHERE comments_count IS NULL;
UPDATE public.news SET is_pinned = false WHERE is_pinned IS NULL;
UPDATE public.news SET show_link_preview = true WHERE show_link_preview IS NULL;
UPDATE public.notifications SET is_read = false WHERE is_read IS NULL;

-- 6. Ensure Comment likes persistence
ALTER TABLE public.post_comments ADD COLUMN IF NOT EXISTS likes integer DEFAULT 0;
ALTER TABLE public.news_comments ADD COLUMN IF NOT EXISTS likes integer DEFAULT 0;
ALTER TABLE public.comment_replies ADD COLUMN IF NOT EXISTS likes integer DEFAULT 0;

CREATE OR REPLACE FUNCTION public.fn_adjust_comment_likes(p_comment_id uuid, p_delta integer)
RETURNS void AS $$
BEGIN
    -- Try post_comments
    UPDATE public.post_comments SET likes = GREATEST(0, COALESCE(likes, 0) + p_delta) WHERE id = p_comment_id;
    -- Try news_comments
    UPDATE public.news_comments SET likes = GREATEST(0, COALESCE(likes, 0) + p_delta) WHERE id = p_comment_id;
    -- Try comment_replies
    UPDATE public.comment_replies SET likes = GREATEST(0, COALESCE(likes, 0) + p_delta) WHERE id = p_comment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Final cleanup: ensure no negatives exist
UPDATE public.post_comments SET likes = 0 WHERE likes < 0 OR likes IS NULL;
UPDATE public.news_comments SET likes = 0 WHERE likes < 0 OR likes IS NULL;
UPDATE public.comment_replies SET likes = 0 WHERE likes < 0 OR likes IS NULL;
