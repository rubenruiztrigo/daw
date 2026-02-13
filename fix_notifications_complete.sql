-- Comprehensive Fix for Notifications System
-- This script does 3 things:
-- 1. Ensures 'sender_id' column exists.
-- 2. Resets and re-applies ALL necessary RLS policies (Select, Insert, Update).
-- 3. Grants permissions to ensure the 'novagob' admin can see everything.

-- 1. Schema Updates
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES public.profiles(id);

-- 2. RLS Policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own notifications (RECEIVED)
DROP POLICY IF EXISTS "Users can see their own notifications" ON public.notifications;
CREATE POLICY "Users can see their own notifications" ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert notifications (SEND) - e.g. for registration requests
DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;
CREATE POLICY "Users can insert notifications" ON public.notifications
  FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Policy: Users can update their own notifications (MARK AS READ)
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 3. Ensure 'novagob' user ID is accessible for the registration logic
-- (This was also in a previous script, but repeating for safety)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);
