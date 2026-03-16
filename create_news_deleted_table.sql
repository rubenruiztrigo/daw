-- SQL to create the news_deleted table and update the secure deletion function
CREATE TABLE IF NOT EXISTS public.news_deleted (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_id UUID NOT NULL,
    author_id UUID NOT NULL REFERENCES public.profiles(id),
    titulo TEXT,
    content TEXT,
    image_url TEXT[],
    tags TEXT[],
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    reposts_count INTEGER DEFAULT 0,
    original_created_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.news_deleted ENABLE ROW LEVEL SECURITY;

-- Policies for news_deleted
DROP POLICY IF EXISTS "Anyone can insert deleted news" ON public.news_deleted;
CREATE POLICY "Anyone can insert deleted news" ON public.news_deleted FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view deleted news" ON public.news_deleted;
CREATE POLICY "Admins can view deleted news" ON public.news_deleted FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Updated function to route deletions to the correct "deleted" table
CREATE OR REPLACE FUNCTION public.fn_delete_post_secure(p_post_id UUID, p_author_id UUID, p_type TEXT)
RETURNS VOID AS $$
DECLARE
    v_source_table TEXT;
    v_target_table TEXT;
BEGIN
    IF p_type = 'news' THEN
        v_source_table := 'news';
        v_target_table := 'news_deleted';
        
        -- Insert into news_deleted
        EXECUTE format('
            INSERT INTO public.news_deleted (
                original_id, author_id, titulo, content, image_url, tags, likes_count, comments_count, reposts_count, original_created_at
            )
            SELECT id, author_id, titulo, content, image_url, tags, likes_count, comments_count, reposts_count, created_at
            FROM public.news
            WHERE id = %L AND author_id = %L
        ', p_post_id, p_author_id);
    ELSE
        v_source_table := 'posts';
        v_target_table := 'posts_deleted';
        
        -- Insert into posts_deleted
        EXECUTE format('
            INSERT INTO public.posts_deleted (
                original_id, author_id, content, image_url, doc_url, doc_name, tags, post_type, likes_count, comments_count, reposts_count, original_created_at
            )
            SELECT id, author_id, content, image_url, doc_url, doc_name, tags, %L, likes_count, comments_count, reposts_count, created_at
            FROM public.posts
            WHERE id = %L AND author_id = %L
        ', p_type, p_post_id, p_author_id);
    END IF;

    -- Delete from original table
    EXECUTE format('DELETE FROM public.%I WHERE id = %L AND author_id = %L', v_source_table, p_post_id, p_author_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.fn_delete_post_secure(UUID, UUID, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';
