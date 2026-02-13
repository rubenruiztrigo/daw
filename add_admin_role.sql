-- Add is_admin column to profiles table if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Grant admin privileges to user 'novagob'
UPDATE public.profiles
SET is_admin = TRUE
WHERE username = 'novagob';

-- Verify the update
SELECT username, is_admin FROM public.profiles WHERE username = 'novagob';
