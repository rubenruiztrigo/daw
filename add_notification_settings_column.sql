-- Añadir columna de configuración de notificaciones a la tabla profiles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'notification_settings') THEN
        ALTER TABLE public.profiles ADD COLUMN notification_settings jsonb DEFAULT '{
            "likes_post": true,
            "likes_news": true,
            "likes_comment": true,
            "comments_post": true,
            "comments_news": true,
            "replies": true,
            "follows": true,
            "event_supports": true,
            "reposts": true,
            "read_receipts": true
        }'::jsonb;
    END IF;
END $$;
