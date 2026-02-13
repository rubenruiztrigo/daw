-- EMERGENCY FIX: Unlock all users
-- This script ensures all existing users are set to 'active' so they can log in.

-- 1. Set all users to active (including novagob)
UPDATE public.profiles 
SET status = 'active' 
WHERE status IS NULL OR status = 'pending';

-- 2. Ensure novagob is admin and active
UPDATE public.profiles
SET is_admin = true, status = 'active'
WHERE username = 'novagob';

-- 3. Verify the changes
SELECT username, status, is_admin FROM public.profiles;
