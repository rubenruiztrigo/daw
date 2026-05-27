-- Fix comment_likes table: RLS policies and UNIQUE constraint

-- 1. Ensure RLS is enabled
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can insert their own likes" ON public.comment_likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON public.comment_likes;
DROP POLICY IF EXISTS "Likes are viewable by everyone" ON public.comment_likes;
DROP POLICY IF EXISTS "Insertar likes propios" ON public.comment_likes;
DROP POLICY IF EXISTS "Borrar likes propios" ON public.comment_likes;
DROP POLICY IF EXISTS "Users can manage their own" ON public.comment_likes;

-- 3. Create fresh policies
CREATE POLICY "Likes are viewable by everyone" 
ON public.comment_likes FOR SELECT 
USING (true);

CREATE POLICY "Users can manage their own likes" 
ON public.comment_likes FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Add UNIQUE constraint to prevent duplicate likes
-- We use a DO block to avoid errors if the constraint already exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_user_comment_like') THEN
        ALTER TABLE public.comment_likes ADD CONSTRAINT unique_user_comment_like UNIQUE (user_id, comment_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_user_reply_like') THEN
        ALTER TABLE public.comment_likes ADD CONSTRAINT unique_user_reply_like UNIQUE (user_id, reply_id);
    END IF;
END $$;

-- 5. Grant permissions
GRANT ALL ON TABLE public.comment_likes TO authenticated;
