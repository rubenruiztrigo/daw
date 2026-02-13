-- Add 'system' to notification types
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check
CHECK (type IN ('like', 'comment', 'follow', 'mention', 'repost', 'registration_request', 'system'));
