-- 1. Create table for deleted messages (Anular envío)
CREATE TABLE IF NOT EXISTS deleted_messages (
    id UUID PRIMARY KEY,
    sender_id UUID REFERENCES profiles(id),
    recipient_id UUID REFERENCES profiles(id),
    text TEXT,
    original_created_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS for deleted_messages
ALTER TABLE deleted_messages ENABLE ROW LEVEL SECURITY;

-- Policies for deleted_messages
CREATE POLICY "Users can insert their own deleted messages" 
ON deleted_messages FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can view deleted messages they sent or received" 
ON deleted_messages FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- 2. Add deleted_for column for "Eliminar para mi"
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_for UUID[] DEFAULT '{}';

-- Allow updates to deleted_for column by participants
CREATE POLICY "Users can edit deleted_for"
ON messages FOR UPDATE
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
