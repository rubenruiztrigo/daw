-- SQL to create the posts_deleted table
CREATE TABLE IF NOT EXISTS public.posts_deleted (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_id UUID NOT NULL,
    author_id UUID NOT NULL REFERENCES public.profiles(id),
    content TEXT,
    image_url TEXT,
    doc_url TEXT,
    doc_name TEXT,
    tags TEXT[],
    post_type TEXT NOT NULL, -- 'post' or 'news'
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    reposts_count INTEGER DEFAULT 0,
    original_created_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure columns exist if table was created previously (Idempotent schema updates)
DO $$ 
BEGIN
    -- Handle legacy column names if they exist
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'posts_deleted' AND COLUMN_NAME = 'post_id') THEN
        IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'posts_deleted' AND COLUMN_NAME = 'original_id') THEN
            ALTER TABLE public.posts_deleted RENAME COLUMN post_id TO original_id;
        ELSE
            -- If both exist, drop the legacy one
            ALTER TABLE public.posts_deleted DROP COLUMN post_id;
        END IF;
    END IF;

    -- Ensure original_id exists (just in case)
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'posts_deleted' AND COLUMN_NAME = 'original_id') THEN
        ALTER TABLE public.posts_deleted ADD COLUMN original_id UUID;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'posts_deleted' AND COLUMN_NAME = 'author_id') THEN
        -- Add author_id if it was missing (should have been there but to be safe)
        ALTER TABLE public.posts_deleted ADD COLUMN author_id UUID REFERENCES public.profiles(id);
    END IF;

    -- Content columns
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'posts_deleted' AND COLUMN_NAME = 'content') THEN
        ALTER TABLE public.posts_deleted ADD COLUMN content TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'posts_deleted' AND COLUMN_NAME = 'image_url') THEN
        ALTER TABLE public.posts_deleted ADD COLUMN image_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'posts_deleted' AND COLUMN_NAME = 'doc_url') THEN
        ALTER TABLE public.posts_deleted ADD COLUMN doc_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'posts_deleted' AND COLUMN_NAME = 'doc_name') THEN
        ALTER TABLE public.posts_deleted ADD COLUMN doc_name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'posts_deleted' AND COLUMN_NAME = 'tags') THEN
        ALTER TABLE public.posts_deleted ADD COLUMN tags TEXT[];
    END IF;

    -- Metadata columns
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'posts_deleted' AND COLUMN_NAME = 'post_type') THEN
        ALTER TABLE public.posts_deleted ADD COLUMN post_type TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'posts_deleted' AND COLUMN_NAME = 'likes_count') THEN
        ALTER TABLE public.posts_deleted ADD COLUMN likes_count INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'posts_deleted' AND COLUMN_NAME = 'comments_count') THEN
        ALTER TABLE public.posts_deleted ADD COLUMN comments_count INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'posts_deleted' AND COLUMN_NAME = 'reposts_count') THEN
        ALTER TABLE public.posts_deleted ADD COLUMN reposts_count INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'posts_deleted' AND COLUMN_NAME = 'original_created_at') THEN
        ALTER TABLE public.posts_deleted ADD COLUMN original_created_at TIMESTAMPTZ;
    END IF;
END $$;
ALTER TABLE public.posts_deleted ENABLE ROW LEVEL SECURITY;

-- Policies (only admins can view deleted posts, but anyone can insert during deletion)
DROP POLICY IF EXISTS "Anyone can insert deleted posts" ON public.posts_deleted;
CREATE POLICY "Anyone can insert deleted posts" ON public.posts_deleted FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view deleted posts" ON public.posts_deleted;
CREATE POLICY "Admins can view deleted posts" ON public.posts_deleted FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);


-- Function to move post to deleted table and active table
CREATE OR REPLACE FUNCTION public.fn_delete_post_secure(p_post_id UUID, p_author_id UUID, p_type TEXT)
RETURNS VOID AS $$
DECLARE
    v_table TEXT;
BEGIN
    IF p_type = 'news' THEN
        v_table := 'news';
    ELSE
        v_table := 'posts';
    END IF;

    -- Check if record exists and user is author
    -- This is partially enforced by the query itself but good for clarity

    -- Insert into posts_deleted
    EXECUTE format('
        INSERT INTO public.posts_deleted (
            original_id, author_id, content, image_url, doc_url, doc_name, tags, post_type, likes_count, comments_count, reposts_count, original_created_at
        )
        SELECT id, author_id, content, image_url, doc_url, doc_name, tags, %L, likes_count, comments_count, reposts_count, created_at
        FROM public.%I
        WHERE id = %L AND author_id = %L
    ', p_type, v_table, p_post_id, p_author_id);

    -- Delete from original table
    EXECUTE format('DELETE FROM public.%I WHERE id = %L AND author_id = %L', v_table, p_post_id, p_author_id);
    
    -- If no rows deleted, it might be because the ID or author didn''t match
    -- But since it's a VOID function, we just finish
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.fn_delete_post_secure(UUID, UUID, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';
