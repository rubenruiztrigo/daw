-- Add the titulo column to the news table
ALTER TABLE public.news ADD COLUMN titulo TEXT;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';
