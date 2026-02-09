-- Table to track which weeks have been processed for ranking rewards
CREATE TABLE IF NOT EXISTS public.weekly_ranking_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    week_start_date DATE NOT NULL, -- Monday of the processed week
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(week_start_date)
);

-- Function to assign badges to previous week's winners
CREATE OR REPLACE FUNCTION public.assign_weekly_ranking_badges()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    last_week_monday DATE;
    last_week_friday TIMESTAMP;
    top_news RECORD;
    rank_counter INT := 1;
    badge_to_assign TEXT;
BEGIN
    -- Calculate last week's Monday (assuming run on a Monday or later)
    -- If today is Monday, last week Monday is today - 7 days.
    -- If today is Tuesday, last week Monday is today - 8 days...
    -- Simpler: truncate to week (Monday) then subtract 1 week.
    last_week_monday := date_trunc('week', now() - interval '1 week')::DATE;
    
    -- Check if already processed
    IF EXISTS (SELECT 1 FROM public.weekly_ranking_logs WHERE week_start_date = last_week_monday) THEN
        RETURN;
    END IF;

    last_week_friday := last_week_monday + interval '4 days' + interval '23 hours 59 minutes 59 seconds';

    -- Find Top 3 News from last week
    FOR top_news IN
        SELECT 
            n.author_id,
            (COALESCE(n.upvotes, 0) - COALESCE(n.downvotes, 0)) as score
        FROM public.news n
        WHERE n.created_at >= last_week_monday::TIMESTAMP
          AND n.created_at <= last_week_friday
        ORDER BY score DESC
        LIMIT 3
    LOOP
        -- Determine badge based on rank
        IF rank_counter = 1 THEN
            badge_to_assign := 'ranking_top1';
        ELSIF rank_counter = 2 THEN
            badge_to_assign := 'ranking_top2';
        ELSIF rank_counter = 3 THEN
            badge_to_assign := 'ranking_top3';
        END IF;

        -- Assign Badge (Insert if not exists)
        BEGIN
            INSERT INTO public.user_badges (user_id, badge_id)
            VALUES (top_news.author_id, badge_to_assign)
            ON CONFLICT (user_id, badge_id) DO NOTHING;
        EXCEPTION WHEN OTHERS THEN
            -- Ignore errors (e.g. if user deleted)
        END;

        rank_counter := rank_counter + 1;
    END LOOP;

    -- Log as processed
    INSERT INTO public.weekly_ranking_logs (week_start_date) VALUES (last_week_monday);
END;
$$;
