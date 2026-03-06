-- SQL to add pin support to posts and news
DO $$ 
BEGIN
    -- Add is_pinned to posts
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'posts' AND COLUMN_NAME = 'is_pinned') THEN
        ALTER TABLE public.posts ADD COLUMN is_pinned BOOLEAN DEFAULT false;
    END IF;

    -- Add pinned_at to posts
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'posts' AND COLUMN_NAME = 'pinned_at') THEN
        ALTER TABLE public.posts ADD COLUMN pinned_at TIMESTAMPTZ;
    END IF;

    -- Add is_pinned to news
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'news' AND COLUMN_NAME = 'is_pinned') THEN
        ALTER TABLE public.news ADD COLUMN is_pinned BOOLEAN DEFAULT false;
    END IF;

    -- Add pinned_at to news
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'news' AND COLUMN_NAME = 'pinned_at') THEN
        ALTER TABLE public.news ADD COLUMN pinned_at TIMESTAMPTZ;
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';
