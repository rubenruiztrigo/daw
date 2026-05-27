-- ============================================================================
-- Fix for linked_organization_id in registration trigger
-- ----------------------------------------------------------------------------
-- This script updates the handle_new_user trigger to correctly capture and
-- store the linked_organization_id from the user's registration metadata.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert into public.profiles
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
    linked_organization_id, -- New field
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
    (new.raw_user_meta_data->>'linked_organization_id')::uuid, -- Capture from metadata
    'pending'
  );

  -- Synchronize with id.users if the schema/table exists
  BEGIN
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
  EXCEPTION WHEN OTHERS THEN
    -- Fallback if id.users doesn't exist yet
    NULL;
  END;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
