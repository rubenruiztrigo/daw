-- Automation Script for Weekly Top Ranking
-- Execute this in your Supabase SQL Editor

-- 1. Create the function that processes the top ranking
CREATE OR REPLACE FUNCTION fn_process_weekly_ranking()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_start_date TIMESTAMPTZ;
    v_end_date TIMESTAMPTZ;
    v_top_user RECORD;
    v_rank INT := 1;
    v_badge_id TEXT;
    v_novas_award INT;
BEGIN
    -- Calculate previous week (Monday 00:00 to Sunday 23:59:59)
    -- current_date - EXTRACT(DOW FROM current_date - 1)::int gets the current Monday.
    -- We subtract 7 days to get the previous Monday.
    v_start_date := date_trunc('week', current_date - interval '1 week');
    v_end_date := v_start_date + interval '6 days 23:59:59.999999';

    -- Find the Top 3 news from the previous week based on upvotes
    FOR v_top_user IN (
        SELECT author_id, SUM(upvotes) as total_upvotes 
        FROM public.news 
        WHERE created_at >= v_start_date AND created_at <= v_end_date
        GROUP BY author_id
        ORDER BY total_upvotes DESC NULLS LAST
        LIMIT 3
    ) LOOP
        -- Determine badge and Novas based on rank
        IF v_rank = 1 THEN
            v_badge_id := 'ranking_top1';
            v_novas_award := 10;
        ELSIF v_rank = 2 THEN
            v_badge_id := 'ranking_top2';
            v_novas_award := 7;
        ELSIF v_rank = 3 THEN
            v_badge_id := 'ranking_top3';
            v_novas_award := 5;
        END IF;

        -- 1. Insert into ranking_history
        INSERT INTO public.ranking_history (user_id, badge_id, created_at)
        VALUES (v_top_user.author_id, v_badge_id, now());

        -- 2. Add Novas to the user's profile
        UPDATE public.profiles
        SET novas = coalesce(novas, 0) + v_novas_award
        WHERE id = v_top_user.author_id;

        -- 3. Notify the user
        INSERT INTO public.notifications (user_id, type, content, created_at)
        VALUES (
            v_top_user.author_id, 
            'system', 
            '¡Enhorabuena! Has acabado **TOP ' || v_rank || '** en el Ranking Semanal.',
            now()
        );

        v_rank := v_rank + 1;
    END LOOP;
END;
$$;

-- 2. Schedule the pg_cron job to run every Monday at 00:00
-- Verify that pg_cron extension is enabled. If this fails, enable pg_cron in the Supabase Dashboard > Database > Extensions
DO $$ 
BEGIN
    -- Clean previous run if it exists to replace it safely
    PERFORM cron.unschedule('weekly-top-ranking-job');
    
    -- Schedule: Every Monday (1) at 00:00.
    PERFORM cron.schedule(
        'weekly-top-ranking-job',
        '0 0 * * 1', 
        'SELECT fn_process_weekly_ranking();'
    );
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error setting up cron schedule. Make sure pg_cron extension is enabled: %', SQLERRM;
END $$;
