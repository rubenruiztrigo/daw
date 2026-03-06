-- Convert image_url from text to text[] for multi-image support
-- This script safely migrates existing single URLs into arrays of one element.

-- 1. For posts table
ALTER TABLE posts 
ALTER COLUMN image_url TYPE text[] 
USING CASE 
    WHEN image_url IS NULL OR image_url = '' THEN '{}'::text[] 
    ELSE ARRAY[image_url] 
END;

-- 2. For news table
ALTER TABLE news 
ALTER COLUMN image_url TYPE text[] 
USING CASE 
    WHEN image_url IS NULL OR image_url = '' THEN '{}'::text[] 
    ELSE ARRAY[image_url] 
END;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
