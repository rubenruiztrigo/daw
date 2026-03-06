-- Add updated_at column to messages table if it doesn't exist
ALTER TABLE messages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Update existing messages to have a valid updated_at
UPDATE messages SET updated_at = created_at WHERE updated_at IS NULL;

-- Ensure RLS is enabled on messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Add policy to allow users to update their own messages if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'messages' AND cmd = 'UPDATE' AND policyname = 'Users can update their own messages'
    ) THEN
        CREATE POLICY "Users can update their own messages" ON messages 
        FOR UPDATE USING (auth.uid() = sender_id) 
        WITH CHECK (auth.uid() = sender_id);
    END IF;
END $$;
