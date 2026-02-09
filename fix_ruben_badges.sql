-- 1. Create tables if they don't exist
CREATE TABLE IF NOT EXISTS public.weekly_ranking_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    week_start_date DATE NOT NULL, -- Monday of the processed week
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(week_start_date)
);

CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    badge_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, badge_id)
);

-- 2. Ensure the function exists (Create or Replace)
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
    -- Calculate last week's Monday
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
            (
                SELECT count(*) FROM public.news_votes v 
                WHERE v.news_id = n.id AND v.vote_type = 'up'
            ) - (
                SELECT count(*) FROM public.news_votes v 
                WHERE v.news_id = n.id AND v.vote_type = 'down'
            ) as score
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
            -- Ignore errors
        END;

        rank_counter := rank_counter + 1;
    END LOOP;

    -- Log as processed
    INSERT INTO public.weekly_ranking_logs (week_start_date) VALUES (last_week_monday);
END;
$$;

-- 3. Execute Badge Cleanup and Assignment
DO $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Find the user 'rubenruiz' (checking username or name)
    SELECT id INTO target_user_id
    FROM public.profiles
    WHERE username = 'rubenruiz' OR name ILIKE '%Rubén%' OR name ILIKE '%Ruben%'
    LIMIT 1;

    IF target_user_id IS NOT NULL THEN
        -- Remove "Top 1 Semanal" badge (ranking_top1)
        DELETE FROM public.user_badges 
        WHERE user_id = target_user_id 
          AND badge_id = 'ranking_top1';
          
        RAISE NOTICE 'Removed ranking_top1 badge for user %', target_user_id;
    ELSE
        RAISE NOTICE 'User rubenruiz not found';
    END IF;

    -- Trigger assignment for the last completed week
    PERFORM public.assign_weekly_ranking_badges();
    
    RAISE NOTICE 'Weekly ranking badge assignment triggered.';
END $$;
