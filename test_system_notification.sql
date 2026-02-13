-- Insert a test system notification for a user (picking one randomly or specific if known)
-- Replacing with a subquery to get a valid user ID (e.g., the first admin or just any user)
DO $$
DECLARE
    target_user_id UUID;
BEGIN
    SELECT id INTO target_user_id FROM public.profiles LIMIT 1;
    
    INSERT INTO public.notifications (user_id, type, content, is_read, sender_id, created_at)
    VALUES (target_user_id, 'system', 'Has sido aceptado en la red social', FALSE, NULL, NOW());
END $$;
