-- Fix Notification Type Constraint
-- The error "23514" indicates that the 'type' column has a CHECK constraint that doesn't include 'registration_request'.
-- This script updates the constraint to allow the new type.

-- 1. Drop the existing constraint (name is usually notifications_type_check, but if not, this might fail and need manual check)
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- 2. Add the updated constraint with all allowed types
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check
CHECK (type IN ('like', 'comment', 'follow', 'mention', 'repost', 'registration_request'));

-- Note: If you have other types in your DB that are not listed here, this might fail. 
-- If so, please add them to the list above.
