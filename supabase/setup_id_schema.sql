-- ============================================================================
-- Setup ID Schema and Users Table
-- ----------------------------------------------------------------------------
-- This script creates the 'id' schema and 'users' table required for 
-- synchronization triggers and the onboarding process.
-- ============================================================================

-- 1. Create Schema
CREATE SCHEMA IF NOT EXISTS id;

-- 2. Create Users Table
-- This table mirrors core user data and acts as a central registry.
CREATE TABLE IF NOT EXISTS id.users (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name text NOT NULL,
  last_name text,
  username text UNIQUE,
  email text,
  avatar text,
  birth_date date,
  position text,
  institution text,
  job_category text,
  administration_type text,
  country text DEFAULT 'España',
  region text,
  is_organization boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 3. Enable RLS on id.users
ALTER TABLE id.users ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Allow users to see all users (for search/mentions)
CREATE POLICY "Users are viewable by everyone" 
  ON id.users FOR SELECT 
  USING (true);

-- Allow the system (service_role) and triggers to manage users
-- Note: The handle_new_user trigger runs as SECURITY DEFINER, 
-- so it usually bypasses RLS if configured correctly, but we add these for safety.
CREATE POLICY "Users can manage their own entry" 
  ON id.users FOR ALL 
  USING (auth.uid() = id);

-- 5. Grant Permissions
GRANT USAGE ON SCHEMA id TO anon;
GRANT USAGE ON SCHEMA id TO authenticated;
GRANT ALL ON TABLE id.users TO anon;
GRANT ALL ON TABLE id.users TO authenticated;
GRANT ALL ON TABLE id.users TO service_role;

-- 6. Ensure handle_new_user trigger is updated to use this table correctly
-- (The redefine_profiles.sql already contains the logic, but we make sure the schema is there first)
