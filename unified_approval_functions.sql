DO $$ 
BEGIN
    -- 1. Try to drop constraint if it points to posts (which is UUID)
    EXECUTE (
        SELECT 'ALTER TABLE public.notifications DROP CONSTRAINT ' || quote_ident(constraint_name)
        FROM information_schema.key_column_usage
        WHERE table_name = 'notifications' AND column_name = 'post_id' AND table_schema = 'public'
        LIMIT 1
    );
EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'No FK constraint found or error dropping: %', SQLERRM;
END $$;

-- 2. Drop the CHECK constraint for notification types (it restricts to a fixed set)
DO $$ 
BEGIN
    ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'Error dropping notification check constraint: %', SQLERRM;
END $$;

-- 3. Drop the CHECK constraint for user_rewards statuses
DO $$ 
BEGIN
    ALTER TABLE public.user_rewards DROP CONSTRAINT IF EXISTS user_rewards_status_check;
EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'Error dropping user_rewards check constraint: %', SQLERRM;
END $$;

-- 4. Alter the column to TEXT
ALTER TABLE public.notifications ALTER COLUMN post_id TYPE TEXT;

-- Drop existing functions to allow signature changes (UUID to TEXT)
DROP FUNCTION IF EXISTS public.fn_request_reward(UUID);
DROP FUNCTION IF EXISTS public.fn_resolve_reward(UUID, UUID, UUID, BOOLEAN);

-- 1. Function to request a reward (called by users)
CREATE OR REPLACE FUNCTION public.fn_request_reward(p_reward_id TEXT)
RETURNS void AS $$
DECLARE
    v_sender_id UUID := auth.uid();
    v_reward_name TEXT;
    v_admin_record RECORD;
BEGIN
    -- Get reward name
    SELECT name INTO v_reward_name FROM public.rewards WHERE id = p_reward_id;

    -- Insert into user_rewards
    INSERT INTO public.user_rewards (user_id, reward_id, status)
    VALUES (v_sender_id, p_reward_id, 'solicitado');

    -- Notify all admins
    FOR v_admin_record IN SELECT id FROM public.profiles WHERE is_admin = true LOOP
        INSERT INTO public.notifications (user_id, sender_id, type, post_id, content, is_read)
        VALUES (
            v_admin_record.id, 
            v_sender_id, 
            'reward_request', 
            p_reward_id, 
            'ha solicitado canjear la recompensa: ' || v_reward_name,
            false
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Function to resolve a reward request (called by admins)
CREATE OR REPLACE FUNCTION public.fn_resolve_reward(
    p_user_id UUID, 
    p_reward_id TEXT, 
    p_notification_id UUID, 
    p_approve BOOLEAN
)
RETURNS void AS $$
DECLARE
    v_admin_id UUID := auth.uid();
    v_reward_name TEXT;
    v_status TEXT;
    v_content TEXT;
BEGIN
    -- Check if caller is admin
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_admin_id AND is_admin = true) THEN
        RAISE EXCEPTION 'Solo los administradores pueden realizar esta acción';
    END IF;

    -- Get reward name
    SELECT name INTO v_reward_name FROM public.rewards WHERE id = p_reward_id;

    IF p_approve THEN
        v_status := 'aceptado';
        v_content := 'Tu solicitud de recompensa ha sido canjeada';
    ELSE
        v_status := 'rechazado';
        v_content := 'Tu solicitud de canje para "' || v_reward_name || '" ha sido rechazada.';
    END IF;

    -- Update user_rewards
    UPDATE public.user_rewards 
    SET status = v_status
    WHERE user_id = p_user_id AND reward_id = p_reward_id AND status = 'solicitado';

    -- Update the triggering notification to reflect it's been handled
    UPDATE public.notifications 
    SET content = content || ' (' || v_status || ')', is_read = true
    WHERE id = p_notification_id;

    -- Notify the user
    INSERT INTO public.notifications (user_id, sender_id, type, post_id, content, is_read)
    VALUES (p_user_id, p_user_id, 'reward_accepted', p_reward_id, v_content, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Function to resolve a registration request (called by admins)
CREATE OR REPLACE FUNCTION public.fn_resolve_registration(
    p_user_id UUID, 
    p_notification_id UUID, 
    p_approve BOOLEAN
)
RETURNS void AS $$
DECLARE
    v_admin_id UUID := auth.uid();
    v_status TEXT;
    v_content TEXT;
BEGIN
    -- Check if caller is admin
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_admin_id AND is_admin = true) THEN
        RAISE EXCEPTION 'Solo los administradores pueden realizar esta acción';
    END IF;

    IF p_approve THEN
        v_status := 'active';
        v_content := 'Tu solicitud de registro ha sido aprobada. ¡Bienvenido a la red!';
    ELSE
        v_status := 'rejected';
        v_content := 'Tu solicitud de registro ha sido rechazada.';
    END IF;

    -- Update profile status
    UPDATE public.profiles 
    SET status = v_status
    WHERE id = p_user_id;

    -- Update the triggering notification
    UPDATE public.notifications 
    SET content = content || ' (' || CASE WHEN p_approve THEN 'aceptado' ELSE 'rechazado' END || ')', is_read = true
    WHERE id = p_notification_id;

    -- Notify the user
    INSERT INTO public.notifications (user_id, sender_id, type, content, is_read)
    VALUES (p_user_id, v_admin_id, 'system', v_content, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recargar caché de esquema postgrest
NOTIFY pgrst, 'reload schema';
