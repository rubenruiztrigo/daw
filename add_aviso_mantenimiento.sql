ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS maintenance_notice boolean NOT NULL DEFAULT false;
