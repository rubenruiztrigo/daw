-- ============================================================================
-- Fix RLS Policies for Badges and Ranking History
-- ----------------------------------------------------------------------------
-- This script ensures that badges and ranking history are viewable by everyone,
-- resolving the empty winners modal issue in the frontend.
-- Run this in your Supabase SQL Editor.
-- ============================================================================

-- 1. Enable RLS on badges
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Badges are viewable by everyone" ON public.badges;

-- 3. Create SELECT policy for badges
CREATE POLICY "Badges are viewable by everyone" 
  ON public.badges FOR SELECT 
  USING (true);

-- 3a. Admin management policies for badges
DROP POLICY IF EXISTS "Admins can insert badges" ON public.badges;
CREATE POLICY "Admins can insert badges" ON public.badges FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
);

DROP POLICY IF EXISTS "Admins can update badges" ON public.badges;
CREATE POLICY "Admins can update badges" ON public.badges FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
);

DROP POLICY IF EXISTS "Admins can delete badges" ON public.badges;
CREATE POLICY "Admins can delete badges" ON public.badges FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
);

GRANT ALL ON TABLE public.badges TO authenticated;

-- 4. Enable RLS on ranking_history
ALTER TABLE public.ranking_history ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Ranking history is viewable by everyone" ON public.ranking_history;

-- 6. Create SELECT policy for ranking_history
CREATE POLICY "Ranking history is viewable by everyone" 
  ON public.ranking_history FOR SELECT 
  USING (true);

-- 7. Grant SELECT permissions to anon and authenticated roles
GRANT SELECT ON public.badges TO anon;
GRANT SELECT ON public.badges TO authenticated;
GRANT SELECT ON public.ranking_history TO anon;
GRANT SELECT ON public.ranking_history TO authenticated;

-- 8. Add foreign key constraint from ranking_history(user_id) to profiles(id) if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ranking_history_user_id_fkey'
    ) THEN
        ALTER TABLE public.ranking_history 
        ADD CONSTRAINT ranking_history_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 9. Redefine reset_all_novas_and_history to clear ranking history and weekly ranking badges
CREATE OR REPLACE FUNCTION public.reset_all_novas_and_history()
RETURNS void AS $$
BEGIN
    -- 1. Reset all novas in profiles to 0
    UPDATE public.profiles SET novas = 0 WHERE id IS NOT NULL;

    -- 2. Clear novas history
    DELETE FROM public.novas_history WHERE user_id IS NOT NULL;

    -- 3. Clear weekly ranking history, keeping only the records from the most recent run (last week's winners)
    DELETE FROM public.ranking_history 
    WHERE created_at < (
        SELECT COALESCE(max(created_at) - interval '1 hour', '-infinity'::timestamptz) 
        FROM public.ranking_history
    );

    -- 4. Remove all weekly ranking badges from users, keeping only the ones from the most recent run
    DELETE FROM public.user_badges 
    WHERE badge_id IN ('ranking_top1', 'ranking_top2', 'ranking_top3')
      AND created_at < (
          SELECT COALESCE(max(created_at) - interval '1 hour', '-infinity'::timestamptz) 
          FROM public.user_badges
          WHERE badge_id IN ('ranking_top1', 'ranking_top2', 'ranking_top3')
      );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 10. Allow admins to update and delete any user event
DROP POLICY IF EXISTS "Admins can update any event" ON public.user_events;
CREATE POLICY "Admins can update any event" ON public.user_events FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
);

DROP POLICY IF EXISTS "Admins can delete any event" ON public.user_events;
CREATE POLICY "Admins can delete any event" ON public.user_events FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
);

-- 11. Fix foreign key constraint on posts(event_id) to set null on delete
ALTER TABLE public.posts 
  DROP CONSTRAINT IF EXISTS posts_event_id_fkey,
  ADD CONSTRAINT posts_event_id_fkey 
  FOREIGN KEY (event_id) 
  REFERENCES public.user_events(id) 
  ON DELETE SET NULL;

-- 12. Enable RLS and add policies for platform_interests table
ALTER TABLE public.platform_interests ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE public.platform_interests TO authenticated;
GRANT SELECT ON TABLE public.platform_interests TO anon;

DROP POLICY IF EXISTS "Interests are viewable by everyone" ON public.platform_interests;
CREATE POLICY "Interests are viewable by everyone" ON public.platform_interests FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can insert interests" ON public.platform_interests;
CREATE POLICY "Admins can insert interests" ON public.platform_interests FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
);

DROP POLICY IF EXISTS "Admins can update interests" ON public.platform_interests;
CREATE POLICY "Admins can update interests" ON public.platform_interests FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
);

DROP POLICY IF EXISTS "Admins can delete interests" ON public.platform_interests;
CREATE POLICY "Admins can delete interests" ON public.platform_interests FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
);

-- 13. Backfill default interests if they do not exist
INSERT INTO public.platform_interests (name)
SELECT name FROM (VALUES
  ('Innovación Pública'),
  ('IA en Gobierno'),
  ('Transformación Digital'),
  ('Transparencia'),
  ('Gestión del Talento'),
  ('Sostenibilidad'),
  ('Innovación urbana'),
  ('Comunicación'),
  ('Buen gobierno'),
  ('Participación'),
  ('Resiliencia'),
  ('Prospectiva'),
  ('Contratación Pública'),
  ('Datos Abiertos'),
  ('Liderazgo'),
  ('Laboratorios de Innovación')
) AS default_interests(name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.platform_interests WHERE platform_interests.name = default_interests.name
);

-- 14. Diagnostic helper functions for pg_cron
CREATE OR REPLACE FUNCTION public.inspect_cron_jobs()
RETURNS TABLE (
  jobid bigint,
  schedule text,
  command text,
  active boolean,
  jobname text
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY SELECT c.jobid, c.schedule, c.command, c.active, c.jobname FROM cron.job c;
END;
$$;

CREATE OR REPLACE FUNCTION public.inspect_cron_runs()
RETURNS TABLE (
  jobid bigint,
  runid bigint,
  command text,
  status text,
  return_message text,
  start_time timestamptz,
  end_time timestamptz
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY SELECT r.jobid, r.runid, r.command, r.status, r.return_message, r.start_time, r.end_time 
  FROM cron.job_run_details r
  ORDER BY r.start_time DESC
  LIMIT 20;
END;
$$;

-- Notify schema reload
NOTIFY pgrst, 'reload schema';







