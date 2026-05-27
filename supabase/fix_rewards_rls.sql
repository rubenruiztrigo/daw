-- ============================================================================
-- Fix Rewards RLS Policies
-- ----------------------------------------------------------------------------
-- This script ensures that the rewards table has correct RLS policies to allow
-- all users to view rewards, and administrators to create, update, and delete them.
-- ============================================================================

-- 1. Enable RLS on rewards table
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Rewards are viewable by everyone" ON public.rewards;
DROP POLICY IF EXISTS "Admins can insert rewards" ON public.rewards;
DROP POLICY IF EXISTS "Admins can update rewards" ON public.rewards;
DROP POLICY IF EXISTS "Admins can delete rewards" ON public.rewards;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.rewards;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.rewards;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.rewards;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.rewards;

-- 3. Create permissive SELECT policy for everyone
CREATE POLICY "Rewards are viewable by everyone" 
  ON public.rewards FOR SELECT 
  USING (true);

-- 4. Create admin-only policies for INSERT, UPDATE, and DELETE
CREATE POLICY "Admins can insert rewards" 
  ON public.rewards FOR INSERT 
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE POLICY "Admins can update rewards" 
  ON public.rewards FOR UPDATE 
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE POLICY "Admins can delete rewards" 
  ON public.rewards FOR DELETE 
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

-- 5. Grant permissions
GRANT ALL ON TABLE public.rewards TO authenticated;
GRANT SELECT ON TABLE public.rewards TO anon;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
