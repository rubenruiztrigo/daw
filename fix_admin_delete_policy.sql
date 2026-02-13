-- Allow admins to delete any profile
-- This is needed for the 'Reject' workflow where the user is removed from the database.

DROP POLICY IF EXISTS "Admins can delete any profile" ON public.profiles;

CREATE POLICY "Admins can delete any profile"
ON public.profiles
FOR DELETE
USING (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

-- Verify policy
SELECT * FROM pg_policies WHERE tablename = 'profiles';
