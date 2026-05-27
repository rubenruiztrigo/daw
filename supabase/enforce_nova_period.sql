-- ============================================================================
-- Enforce Nova Accumulation Period
-- ----------------------------------------------------------------------------
-- This script adds a trigger and updates the add_novas function to restrict
-- the accumulation of novas to the range defined in platform_settings:
-- 'nova_period_start' and 'nova_period_end'.
-- ============================================================================

-- 1. Create or replace the helper function to check period restrictions
CREATE OR REPLACE FUNCTION public.check_nova_accumulation_period()
RETURNS trigger AS $$
DECLARE
  v_start_val text;
  v_end_val text;
  v_start timestamptz;
  v_end timestamptz;
  v_now timestamptz := now();
  v_is_admin boolean := false;
BEGIN
  -- Only check if we are increasing novas
  IF COALESCE(NEW.novas, 0) > COALESCE(OLD.novas, 0) THEN
    -- Bypass if executed by database superusers (SQL Editor / migrations)
    IF current_user IN ('postgres', 'supabase_admin', 'dashboard_user') THEN
      v_is_admin := true;
    ELSIF auth.uid() IS NOT NULL THEN
      SELECT is_admin INTO v_is_admin FROM public.profiles WHERE id = auth.uid();
    END IF;

    -- If not admin, check period restriction
    IF NOT COALESCE(v_is_admin, false) THEN
      SELECT value INTO v_start_val FROM public.platform_settings WHERE key = 'nova_period_start';
      SELECT value INTO v_end_val FROM public.platform_settings WHERE key = 'nova_period_end';

      IF v_start_val IS NOT NULL AND v_start_val <> '' THEN
        v_start := (v_start_val || ' 00:00:00')::timestamp at time zone 'UTC';
      END IF;
      IF v_end_val IS NOT NULL AND v_end_val <> '' THEN
        v_end := (v_end_val || ' 23:59:59.999')::timestamp at time zone 'UTC';
      END IF;

      -- If start date is set and we are before it, OR end date is set and we are after it
      IF (v_start IS NOT NULL AND v_now < v_start) OR (v_end IS NOT NULL AND v_now > v_end) THEN
        -- Cancel the increase by retaining the old novas value
        NEW.novas := OLD.novas;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Bind the trigger to the profiles table
DROP TRIGGER IF EXISTS trg_check_nova_accumulation ON public.profiles;
CREATE TRIGGER trg_check_nova_accumulation
  BEFORE UPDATE OF novas ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_nova_accumulation_period();

-- 3. Update the add_novas RPC function to respect the same restrictions
CREATE OR REPLACE FUNCTION public.add_novas(target_user_id uuid, delta integer)
RETURNS void AS $$
DECLARE
  v_start_val text;
  v_end_val text;
  v_start timestamptz;
  v_end timestamptz;
  v_now timestamptz := now();
  v_is_admin boolean := false;
BEGIN
  -- Only restrict if we are adding novas (delta > 0)
  IF delta > 0 THEN
    -- Bypass if executed by database superusers (SQL Editor / migrations)
    IF current_user IN ('postgres', 'supabase_admin', 'dashboard_user') THEN
      v_is_admin := true;
    ELSIF auth.uid() IS NOT NULL THEN
      SELECT is_admin INTO v_is_admin FROM public.profiles WHERE id = auth.uid();
    END IF;

    IF NOT COALESCE(v_is_admin, false) THEN
      SELECT value INTO v_start_val FROM public.platform_settings WHERE key = 'nova_period_start';
      SELECT value INTO v_end_val FROM public.platform_settings WHERE key = 'nova_period_end';

      IF v_start_val IS NOT NULL AND v_start_val <> '' THEN
        v_start := (v_start_val || ' 00:00:00')::timestamp at time zone 'UTC';
      END IF;
      IF v_end_val IS NOT NULL AND v_end_val <> '' THEN
        v_end := (v_end_val || ' 23:59:59.999')::timestamp at time zone 'UTC';
      END IF;

      -- If outside the defined range, exit early (do not add)
      IF (v_start IS NOT NULL AND v_now < v_start) OR (v_end IS NOT NULL AND v_now > v_end) THEN
        RETURN;
      END IF;
    END IF;
  END IF;

  -- Perform the clamp update (never go below 0)
  UPDATE public.profiles
  SET novas = greatest(0, coalesce(novas, 0) + delta)
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
