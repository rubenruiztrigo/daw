-- Diagnostics to check RLS and post status
-- Run this in Supabase SQL Editor

-- 1. Check if the columns exist and their current values for the problematic post
SELECT id, author_id, is_pinned, pinned_at 
FROM posts 
WHERE id = 'f62990b2-134e-4d76-957c-884ccdda1690';

-- 2. Check current RLS policies on posts and news
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('posts', 'news');

-- 3. Fix RLS policies if they are missing or too restrictive for update
-- Ensure users can update their own posts
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'posts' AND cmd = 'UPDATE' AND policyname = 'Users can update their own posts'
    ) THEN
        CREATE POLICY "Users can update their own posts" ON posts 
        FOR UPDATE USING (auth.uid() = author_id) 
        WITH CHECK (auth.uid() = author_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'news' AND cmd = 'UPDATE' AND policyname = 'Users can update their own news'
    ) THEN
        CREATE POLICY "Users can update their own news" ON news 
        FOR UPDATE USING (auth.uid() = author_id) 
        WITH CHECK (auth.uid() = author_id);
    END IF;
END $$;

-- 4. Enable RLS just in case (though it usually is)
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
