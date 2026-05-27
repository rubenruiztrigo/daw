-- ============================================================================
-- Redefine profiles table
-- ----------------------------------------------------------------------------
-- This script drops and recreates the profiles table with the requested schema.
-- WARNING: This will delete all existing profile data!
-- ============================================================================

-- Drop if exists (CASCADE to handle foreign key dependencies)
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Create table
CREATE TABLE public.profiles (
  -- Technical Primary Key linked to Auth
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  
  -- Requested Columns
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
  country text DEFAULT 'España'::text,
  region text,
  is_organization boolean DEFAULT false,
  gender text,
  
  -- Essential App Columns (to maintain functionality)
  bio text,
  interests text[] DEFAULT '{}',
  novas integer DEFAULT 0,
  followers_count integer DEFAULT 0,
  following_count integer DEFAULT 0,
  is_admin boolean DEFAULT false,
  status text DEFAULT 'pending',
  first_time boolean DEFAULT true,
  is_banned boolean DEFAULT false,
  banned_until timestamp with time zone,
  maintenance_notice boolean DEFAULT false,
  level_name text,
  chat_settings jsonb DEFAULT '{"senderColor": "#3b82f6", "receiverColor": "#f1f5f9", "backgroundColor": "#ffffff", "readReceipts": true}'::jsonb,
  notification_settings jsonb DEFAULT '{"follows": true, "replies": true, "reposts": true, "mentions": true, "likes_post": true, "likes_news": true, "comments_post": true, "comments_news": true, "likes_comment": true, "event_supports": true}'::jsonb,
  linked_organization_id uuid, -- For organization links
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Trigger function to create a profile automatically on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    name,
    last_name,
    username,
    email,
    position,
    institution,
    job_category,
    administration_type,
    country,
    region,
    is_organization,
    birth_date,
    status
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', ''),
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'username',
    new.email,
    new.raw_user_meta_data->>'position',
    new.raw_user_meta_data->>'institution',
    new.raw_user_meta_data->>'job_category',
    new.raw_user_meta_data->>'administration_type',
    COALESCE(new.raw_user_meta_data->>'country', 'España'),
    new.raw_user_meta_data->>'region',
    COALESCE((new.raw_user_meta_data->>'is_organization')::boolean, false),
    (new.raw_user_meta_data->>'birth_date')::date,
    'pending'
  );

  -- Sincronizar también con id.users
  -- (Asegúrate de que el esquema 'id' y la tabla 'users' existan)
  INSERT INTO id.users (
    id,
    name,
    last_name,
    username,
    email,
    birth_date,
    position,
    institution,
    job_category,
    administration_type,
    country,
    region,
    is_organization
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', ''),
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'username',
    new.email,
    (new.raw_user_meta_data->>'birth_date')::date,
    new.raw_user_meta_data->>'position',
    new.raw_user_meta_data->>'institution',
    new.raw_user_meta_data->>'job_category',
    new.raw_user_meta_data->>'administration_type',
    COALESCE(new.raw_user_meta_data->>'country', 'España'),
    new.raw_user_meta_data->>'region',
    COALESCE((new.raw_user_meta_data->>'is_organization')::boolean, false)
  ) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    last_name = EXCLUDED.last_name,
    username = EXCLUDED.username,
    email = EXCLUDED.email,
    birth_date = EXCLUDED.birth_date,
    position = EXCLUDED.position,
    institution = EXCLUDED.institution,
    job_category = EXCLUDED.job_category,
    administration_type = EXCLUDED.administration_type,
    country = EXCLUDED.country,
    region = EXCLUDED.region,
    is_organization = EXCLUDED.is_organization;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute the function on every new user in auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant permissions
GRANT ALL ON TABLE public.profiles TO anon;
GRANT ALL ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;
