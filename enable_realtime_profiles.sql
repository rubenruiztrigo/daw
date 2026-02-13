-- Enable Realtime for Profiles table
-- This allows the application to listen for changes (like approval status) instantly.

-- 1. Add table to the publication
-- We use 'IF NOT EXISTS' logic by attempting to alter. 
-- Supabase doesn't support "ADD TABLE IF NOT EXISTS" directly in standard SQL standard, 
-- but re-adding it is usually safe or we can check.
-- However, the simplest way is just to run the ALTER PUBLICATION command.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
END $$;

-- 2. Verify settings (Optional checking)
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
