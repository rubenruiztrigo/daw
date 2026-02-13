-- Allow admins to update any profile (e.g. to set status to 'active' or 'rejected')
-- This is critical for the approval workflow to function.

DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
USING (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
)
WITH CHECK (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

-- Also ensure 'novagob' is definitely an admin (redundant safety check)
UPDATE public.profiles
SET is_admin = true, status = 'active'
WHERE username = 'novagob' OR email = 'info@novagob.org';
