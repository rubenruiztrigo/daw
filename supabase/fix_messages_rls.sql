-- ============================================================================
-- Fix Messaging RLS Policies
-- ----------------------------------------------------------------------------
-- This script ensures that the messages and scheduled_messages tables have
-- correct RLS policies to allow sending and receiving messages.
-- ============================================================================

-- 1. Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_messages ENABLE ROW LEVEL SECURITY;

-- 2. Clean up old/broken policies for messages
DROP POLICY IF EXISTS "messages_insert_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_select_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_update_policy" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can edit deleted_for" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_v1" ON public.messages;
DROP POLICY IF EXISTS "messages_select_v1" ON public.messages;
DROP POLICY IF EXISTS "messages_update_v1" ON public.messages;

-- 3. Create canonical policies for messages
CREATE POLICY "messages_insert_v1" ON public.messages
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "messages_select_v1" ON public.messages
    FOR SELECT TO authenticated
    USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "messages_update_v1" ON public.messages
    FOR UPDATE TO authenticated
    USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- 4. Clean up and create policies for scheduled_messages
DROP POLICY IF EXISTS "Users can insert their own scheduled messages" ON public.scheduled_messages;
DROP POLICY IF EXISTS "Users can view their own scheduled messages" ON public.scheduled_messages;
DROP POLICY IF EXISTS "scheduled_insert_v1" ON public.scheduled_messages;
DROP POLICY IF EXISTS "scheduled_select_v1" ON public.scheduled_messages;

CREATE POLICY "scheduled_insert_v1" ON public.scheduled_messages
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "scheduled_select_v1" ON public.scheduled_messages
    FOR SELECT TO authenticated
    USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- 5. Grant necessary permissions
GRANT ALL ON TABLE public.messages TO authenticated;
GRANT ALL ON TABLE public.scheduled_messages TO authenticated;
GRANT ALL ON TABLE public.messages TO service_role;
GRANT ALL ON TABLE public.scheduled_messages TO service_role;

-- 6. Ensure messages are in the realtime publication
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE messages;
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';
