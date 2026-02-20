-- Add is_organization column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_organization BOOLEAN DEFAULT FALSE;

-- Add organization_objective column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS organization_objective TEXT;

-- Update RLS policies to ensure these columns can be updated
-- (Assuming existing policies allow updating own profile, which usually covers all columns, 
-- but explicit grant might be needed if columns are restricted. 
-- Standard 'Users can update own profile' policy usually matches (auth.uid() = id) with CHECK (true) or specific columns.)

-- Optional: Comments for documentation
COMMENT ON COLUMN public.profiles.is_organization IS 'Flag to identify organization accounts';
COMMENT ON COLUMN public.profiles.organization_objective IS 'Main objective/bio for organizations, limited to 30 chars in UI';
