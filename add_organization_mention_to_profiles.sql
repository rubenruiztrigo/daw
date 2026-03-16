-- Migration: Add organization_mention column to profiles table
-- Date: 2026-03-13

-- 1. Add the new column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS organization_mention TEXT;

-- 2. (Optional) Comment on the column
COMMENT ON COLUMN profiles.organization_mention IS 'Custom mention or role description for organization association';
