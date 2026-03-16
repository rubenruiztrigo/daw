-- setup_milestone_rewards.sql
-- Run this in the Supabase SQL Editor

-- 0. Add nova_reward column to badges table
ALTER TABLE IF EXISTS public.badges ADD COLUMN IF NOT EXISTS nova_reward INT DEFAULT 0;

-- 1. Create a table to track milestone rewards to avoid double-awarding
CREATE TABLE IF NOT EXISTS public.milestone_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    milestone_type TEXT NOT NULL, -- 'likes_20', 'likes_50', 'followers_10', etc.
    reference_id TEXT, -- post_id for likes, or badge_id
    reward_amount INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, milestone_type, reference_id)
);

-- 2. Function to award milestone rewards
CREATE OR REPLACE FUNCTION public.fn_award_milestone_reward(
    p_user_id UUID,
    p_milestone_type TEXT,
    p_reference_id TEXT,
    p_amount INT,
    p_notification_content TEXT
)
RETURNS VOID AS $$
BEGIN
    -- Check if already awarded
    IF EXISTS (
        SELECT 1 FROM public.milestone_rewards 
        WHERE user_id = p_user_id 
        AND milestone_type = p_milestone_type 
        AND (reference_id = p_reference_id OR reference_id IS NULL AND p_reference_id IS NULL)
    ) THEN
        RETURN;
    END IF;

    -- Add reward log
    INSERT INTO public.milestone_rewards (user_id, milestone_type, reference_id, reward_amount)
    VALUES (p_user_id, p_milestone_type, p_reference_id, p_amount);

    -- Add Novas to profile
    UPDATE public.profiles
    SET novas = COALESCE(novas, 0) + p_amount
    WHERE id = p_user_id;

    -- Send notification
    INSERT INTO public.notifications (user_id, type, content, created_at)
    VALUES (p_user_id, 'system', p_notification_content, now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger for Post Likes
CREATE OR REPLACE FUNCTION public.fn_check_post_likes_milestones()
RETURNS TRIGGER AS $$
BEGIN
    -- Check for 20 likes
    IF NEW.likes_count >= 20 THEN
        PERFORM public.fn_award_milestone_reward(
            NEW.author_id,
            'likes_20',
            NEW.id::text,
            3,
            '¡Has ganado **3 novas**! Tu post ha superado los 20 me gusta.'
        );
    END IF;

    -- Check for 50 likes
    IF NEW.likes_count >= 50 THEN
        PERFORM public.fn_award_milestone_reward(
            NEW.author_id,
            'likes_50',
            NEW.id::text,
            5,
            '¡Has ganado **5 novas**! Tu post ha superado los 50 me gusta.'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_check_post_likes_milestones ON public.posts;
CREATE TRIGGER tr_check_post_likes_milestones
AFTER UPDATE OF likes_count ON public.posts
FOR EACH ROW
WHEN (NEW.likes_count >= 20)
EXECUTE FUNCTION public.fn_check_post_likes_milestones();

-- 4. Trigger for Followers
CREATE OR REPLACE FUNCTION public.fn_check_follower_milestones()
RETURNS TRIGGER AS $$
BEGIN
    -- 10 followers
    IF NEW.followers_count >= 10 THEN
        PERFORM public.fn_award_milestone_reward(
            NEW.id,
            'followers_10',
            NULL,
            1,
            '¡Has ganado **1 nova**! Has alcanzado los 10 seguidores.'
        );
    END IF;

    -- 100 followers
    IF NEW.followers_count >= 100 THEN
        PERFORM public.fn_award_milestone_reward(
            NEW.id,
            'followers_100',
            NULL,
            5,
            '¡Has ganado **5 novas**! Has alcanzado los 100 seguidores.'
        );
    END IF;

    -- 500 followers
    IF NEW.followers_count >= 500 THEN
        PERFORM public.fn_award_milestone_reward(
            NEW.id,
            'followers_500',
            NULL,
            10,
            '¡Has ganado **10 novas**! Has alcanzado los 500 seguidores.'
        );
    END IF;

    -- 1000 followers
    IF NEW.followers_count >= 1000 THEN
        PERFORM public.fn_award_milestone_reward(
            NEW.id,
            'followers_1000',
            NULL,
            15,
            '¡Has ganado **15 novas**! Has alcanzado los 1000 seguidores.'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_check_follower_milestones ON public.profiles;
CREATE TRIGGER tr_check_follower_milestones
AFTER UPDATE OF followers_count ON public.profiles
FOR EACH ROW
WHEN (NEW.followers_count >= 10)
EXECUTE FUNCTION public.fn_check_follower_milestones();

-- 5. Trigger for Badges
CREATE OR REPLACE FUNCTION public.fn_award_novas_for_badge()
RETURNS TRIGGER AS $$
DECLARE
    v_amount INT := 0;
    v_label TEXT;
BEGIN
    -- Get badge label and reward amount for notification and award
    SELECT label, COALESCE(nova_reward, 0) INTO v_label, v_amount 
    FROM public.badges 
    WHERE id = NEW.badge_id;
    
    IF v_amount > 0 THEN
        PERFORM public.fn_award_milestone_reward(
            NEW.user_id,
            'badge_reward',
            NEW.badge_id,
            v_amount,
            '¡Enhorabuena! Has recibido la insignia **' || v_label || '** y has ganado **' || v_amount || ' novas**.'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_award_novas_for_badge ON public.user_badges;
CREATE TRIGGER tr_award_novas_for_badge
AFTER INSERT ON public.user_badges
FOR EACH ROW
EXECUTE FUNCTION public.fn_award_novas_for_badge();

NOTIFY pgrst, 'reload schema';
