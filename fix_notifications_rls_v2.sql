-- Fix RLS policies for notifications table

-- 1. Enable RLS (just in case)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 2. Allow authenticated users to insert notifications
-- This is crucial for "registration_request"
DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;
CREATE POLICY "Users can insert notifications" ON public.notifications
  FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- 3. Allow users to see their own notifications (received)
DROP POLICY IF EXISTS "Users can see their own notifications" ON public.notifications;
CREATE POLICY "Users can see their own notifications" ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- 4. Allow users to see notifications they sent (optional, but good for debugging)
DROP POLICY IF EXISTS "Users can see sent notifications" ON public.notifications;
CREATE POLICY "Users can see sent notifications" ON public.notifications
  FOR SELECT
  USING (auth.uid() = sender_id);

-- 5. Allow users to update their own notifications (mark as read)
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 6. Ensure 'pending' users can still interact with Supabase to some extent
-- We need to make sure the "profiles" table is readable by everyone or at least by authenticated users, 
-- even if they are pending, to fetch the admin user.
-- (Existing policies usually allow public read, but let's ensure it)

-- Verify admin user exists or create it if not
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE username = 'novagob') THEN
    -- We cannot easily create a user without an auth.users entry, which requires admin API.
    -- But we can assume the user exists based on the report.
    -- If it doesn't, the frontend logic will fail gracefully (log error).
    RAISE NOTICE 'Admin user novagob not found in profiles via SQL check (RLS might hide it).';
  END IF;
END $$;
