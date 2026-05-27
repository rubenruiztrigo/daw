-- ============================================================================
-- Fix Maintenance Notice RPC Functions
-- ----------------------------------------------------------------------------
-- This script redefines the launch_maintenance_notice and
-- deactivate_maintenance_notice functions to include a WHERE clause on all
-- UPDATE statements, avoiding "UPDATE requires a WHERE clause" errors under safe
-- update modes. It also adds an administrative check for security.
-- ============================================================================

-- 1. Redefine launch_maintenance_notice
CREATE OR REPLACE FUNCTION public.launch_maintenance_notice(notice_data jsonb)
RETURNS void AS $$
BEGIN
  -- Security: Only permit admins to launch notices
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true) THEN
    RAISE EXCEPTION 'Only administrators can perform this action';
  END IF;

  -- Save notice to platform settings
  INSERT INTO public.platform_settings (key, value, updated_at)
  VALUES ('maintenance_notice', notice_data::text, now())
  ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at;

  -- Set maintenance_notice flag to true for all profiles
  -- A WHERE clause is required to satisfy database safe update configurations
  UPDATE public.profiles
  SET maintenance_notice = true
  WHERE id IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Redefine deactivate_maintenance_notice
CREATE OR REPLACE FUNCTION public.deactivate_maintenance_notice()
RETURNS void AS $$
DECLARE
  v_notice_str text;
  v_notice jsonb;
BEGIN
  -- Security: Only permit admins to deactivate notices
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true) THEN
    RAISE EXCEPTION 'Only administrators can perform this action';
  END IF;

  -- Get the current notice
  SELECT value INTO v_notice_str FROM public.platform_settings WHERE key = 'maintenance_notice';
  
  IF v_notice_str IS NOT NULL THEN
    v_notice := v_notice_str::jsonb;
    -- Set active to false
    v_notice := jsonb_set(v_notice, '{active}', 'false');
    
    -- Save back to platform settings
    UPDATE public.platform_settings
    SET value = v_notice::text, updated_at = now()
    WHERE key = 'maintenance_notice';
  END IF;

  -- Set maintenance_notice flag to false for all profiles
  -- A WHERE clause is required to satisfy database safe update configurations
  UPDATE public.profiles
  SET maintenance_notice = false
  WHERE id IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.launch_maintenance_notice(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deactivate_maintenance_notice() TO authenticated;
