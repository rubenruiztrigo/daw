-- 1. Add is_read column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'is_read') THEN
        ALTER TABLE messages ADD COLUMN is_read BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 2. Update RLS policies to allow updating is_read
-- We need to ensure the recipient can mark messages as read.

-- First, enable RLS on the table if not already enabled (it should be)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might conflict or be too restrictive regarding updates
-- (We don't know the exact names, so we'll try to create a new specific one)

DROP POLICY IF EXISTS "Users can update messages sent to them" ON messages;

CREATE POLICY "Users can update messages sent to them"
ON messages FOR UPDATE
USING (auth.uid() = recipient_id)
WITH CHECK (auth.uid() = recipient_id);

-- Ensure users can view their own messages (both sent and received)
DROP POLICY IF EXISTS "Users can view their own messages" ON messages;

CREATE POLICY "Users can view their own messages"
ON messages FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Ensure users can insert messages they send
DROP POLICY IF EXISTS "Users can insert messages" ON messages;

CREATE POLICY "Users can insert messages"
ON messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);
