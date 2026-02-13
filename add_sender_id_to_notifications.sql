-- Add sender_id column to notifications table if it doesn't exist
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES public.profiles(id);

-- Update RLS policies to use sender_id (re-applying just in case, though previous script did it)
-- The previous script 'fix_notifications_rls_v2.sql' already defined policies using sender_id, 
-- but they would have failed or been invalid if the column didn't exist. 
-- Now that the column is added, those policies will work (or should be re-run if they failed creation).

-- Let's re-run the policy creation for "Users can insert notifications" just to be safe and ensure it binds correctly.
DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;
CREATE POLICY "Users can insert notifications" ON public.notifications
  FOR INSERT
  WITH CHECK (auth.uid() = sender_id);
