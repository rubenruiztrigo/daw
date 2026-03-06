-- Add image_urls column to posts and news tables
ALTER TABLE posts ADD COLUMN IF NOT EXISTS image_urls text[] DEFAULT '{}';
ALTER TABLE news ADD COLUMN IF NOT EXISTS image_urls text[] DEFAULT '{}';

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
