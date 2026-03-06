-- Execute this in your Supabase SQL Editor
-- 1. Ensure columns exist (Repeat of previous migration just in case)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'posts' AND COLUMN_NAME = 'is_pinned') THEN
        ALTER TABLE public.posts ADD COLUMN is_pinned BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'posts' AND COLUMN_NAME = 'pinned_at') THEN
        ALTER TABLE public.posts ADD COLUMN pinned_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'news' AND COLUMN_NAME = 'is_pinned') THEN
        ALTER TABLE public.news ADD COLUMN is_pinned BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'news' AND COLUMN_NAME = 'pinned_at') THEN
        ALTER TABLE public.news ADD COLUMN pinned_at TIMESTAMPTZ;
    END IF;
END $$;

-- 2. FORCE PostgREST to reload the schema cache
NOTIFY pgrst, 'reload schema';

-- 3. Verify columns are there (This should return rows with the columns)
SELECT id, is_pinned, pinned_at FROM public.posts LIMIT 1;
