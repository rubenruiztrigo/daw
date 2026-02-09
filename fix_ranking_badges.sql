-- 1. Remove the "Top 1 Semanal" badge for Week 5 January (Badge ID from script)
DELETE FROM public.user_badges 
WHERE id = 'b62be548-340d-4ae0-8e06-08f0f0b0a0a3';

-- 2. Trigger the weekly ranking badge assignment for the last completed week
-- This will process the week of Feb 2nd - Feb 8th if not already processed.
SELECT public.assign_weekly_ranking_badges();

-- 3. Verify the results
SELECT * FROM public.user_badges 
WHERE created_at > (now() - interval '1 hour')
ORDER BY created_at DESC;
