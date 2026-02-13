-- Allow users to insert their own profile
-- This is necessary for the registration flow where the user is authenticated (Auth) but doesn't have a profile yet.

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Ensure users can update their own profile (often needed for complete registration/onboarding updates)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Ensure basic read access is clear (redundant if 'Public profiles...' exists, but good for safety)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);
