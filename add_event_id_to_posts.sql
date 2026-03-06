-- Script to add 'event_id' column to the 'posts' table and reload the schema cache.
-- Please run this in your Supabase SQL Editor.

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'posts' AND COLUMN_NAME = 'event_id'
    ) THEN
        ALTER TABLE public.posts ADD COLUMN event_id UUID REFERENCES public.user_events(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Force PostgREST to reload the schema cache so the API recognizes the new column
NOTIFY pgrst, 'reload schema';

-- Verify it was added
SELECT id, event_id FROM public.posts LIMIT 1;
