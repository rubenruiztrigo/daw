-- COMPREHENSIVE FIX for Approval Workflow
-- This script fixes the RLS policies that likely prevent the notification from being sent.

-- 1. Allow everyone to see the 'novagob' user (needed so new users can find the admin ID)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true); -- Allow reading all profiles (common for social networks) 
-- OR if you want to be stricter: USING ( true ); assuming we want social features.

-- 2. Allow authenticated users to INSERT notifications (for registration requests)
DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;
CREATE POLICY "Users can insert notifications" 
ON public.notifications FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

-- 3. Ensure 'novagob' exists and is admin
INSERT INTO public.profiles (id, username, email, is_admin, status, name, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000000', -- Placeholder ID, ideally needs real auth ID
  'novagob', 
  'info@novagob.org', 
  true, 
  'active',
  'NovaGob Admin',
  NOW()
)
ON CONFLICT (username) DO UPDATE 
SET is_admin = true, status = 'active';

-- NOTE: If novagob exists in Auth but not profiles, the insert above might fail on foreign key if ID doesn't match. 
-- The UPDATE will handle existing profile.

-- 4. Verify policies
SELECT * FROM pg_policies WHERE tablename = 'notifications' OR tablename = 'profiles';
