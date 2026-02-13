-- Add status column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Add check constraint for status values
ALTER TABLE public.profiles ADD CONSTRAINT status_check CHECK (status IN ('pending', 'active', 'rejected'));

-- Update existing users to active (so they don't get locked out)
UPDATE public.profiles SET status = 'active' WHERE status = 'pending';

-- Verify the update
SELECT username, status FROM public.profiles LIMIT 10;
