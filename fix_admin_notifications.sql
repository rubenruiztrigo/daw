-- Fix RLS and Constraints for Admin Notifications

-- 1. Ensure 'system' is in the allowed types
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check
CHECK (type IN ('like', 'comment', 'follow', 'mention', 'repost', 'registration_request', 'system'));

-- 2. Allow admins to update ANY notification of type 'registration_request'
-- First, we need a way to know if a user is an admin.
-- Assuming 'profiles' table has 'is_admin' boolean column.

DROP POLICY IF EXISTS "Admins can update registration requests" ON public.notifications;

CREATE POLICY "Admins can update registration requests" ON public.notifications
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
    AND type IN ('registration_request', 'system') -- Allow updating system msgs too if they were converted
  );

-- 3. Alternative: If checking 'is_admin' is too complex due to recursion/RLS on profiles,
-- we can allow updating notifications where the user is the SENDER (which they aren't here)
-- OR just allow authenticated users to update notifications if they match the specific logic.
-- BUT, for security, the above policy is best.

-- NOTE: If 'is_admin' is not accessible due to RLS on profiles, you might need to unrestricted read on profiles for auth users.
-- Let's ensure profiles are readable.
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);
