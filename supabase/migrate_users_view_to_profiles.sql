-- ============================================================================
-- Migration: Ensure profiles table has all columns from users_view
-- ----------------------------------------------------------------------------
-- This script adds missing columns to the profiles table to allow removing 
-- the users_view abstraction.
-- ============================================================================

-- Core Identity
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_name text;

-- Stats and Ranking
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS novas integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS followers_count integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS following_count integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS level_name text;

-- Flags and Settings
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_time boolean DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_banned boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banned_until timestamp with time zone;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS maintenance_notice boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

-- JSONB Settings
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS chat_settings jsonb DEFAULT '{"senderColor": "#3b82f6", "receiverColor": "#f1f5f9", "backgroundColor": "#ffffff", "readReceipts": true}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notification_settings jsonb DEFAULT '{"follows": true, "replies": true, "reposts": true, "mentions": true, "likes_post": true, "likes_news": true, "comments_post": true, "comments_news": true, "likes_comment": true, "event_supports": true}'::jsonb;

-- Organization and Work
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_organization boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS administration_type text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS job_category text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linked_organization_id uuid;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS position text;

-- Personal
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS interests text[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date date;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country text DEFAULT 'España';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS region text;

-- Ensure created_at and updated_at
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- ----------------------------------------------------------------------------
-- Optional: Data Sync (Run if you want to populate missing emails/usernames)
-- ----------------------------------------------------------------------------
-- UPDATE public.profiles p
-- SET 
--   email = u.email,
--   username = COALESCE(p.username, u.raw_user_meta_data->>'username', SPLIT_PART(u.email, '@', 1))
-- FROM auth.users u
-- WHERE p.id = u.id AND (p.email IS NULL OR p.username IS NULL);
