-- Upgrade script: Rename posts_eliminados to posts_deleted and ensure content columns exist
-- Run this in Supabase SQL Editor

DO $$
BEGIN
    -- 1. Rename table if old name exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'posts_eliminados') THEN
        ALTER TABLE public.posts_eliminados RENAME TO posts_deleted;
    END IF;

    -- 2. Create table if it doesn't exist (and wasn't renamed)
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'posts_deleted') THEN
        CREATE TABLE public.posts_deleted (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            post_id uuid NOT NULL,
            user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
            created_at timestamptz DEFAULT now()
        );
        -- Enable RLS for new table
        ALTER TABLE public.posts_deleted ENABLE ROW LEVEL SECURITY;
        
        -- Policies
        CREATE POLICY "Permitir inserción a dueños" ON public.posts_deleted FOR INSERT WITH CHECK (auth.uid() = user_id);
        CREATE POLICY "Permitir lectura a dueños" ON public.posts_deleted FOR SELECT USING (auth.uid() = user_id);
    END IF;

    -- 3. Add content columns to posts_deleted
    
    -- content
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'posts_deleted' AND column_name = 'content') THEN
        ALTER TABLE public.posts_deleted ADD COLUMN content text;
    END IF;

    -- image_url
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'posts_deleted' AND column_name = 'image_url') THEN
        ALTER TABLE public.posts_deleted ADD COLUMN image_url text;
    END IF;

    -- post_type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'posts_deleted' AND column_name = 'post_type') THEN
        ALTER TABLE public.posts_deleted ADD COLUMN post_type text;
    END IF;

    -- original_created_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'posts_deleted' AND column_name = 'original_created_at') THEN
        ALTER TABLE public.posts_deleted ADD COLUMN original_created_at timestamptz;
    END IF;

END $$;
