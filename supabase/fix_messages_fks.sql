-- ============================================================================
-- Fix Missing Foreign Keys for Messages
-- ----------------------------------------------------------------------------
-- This script ensures that sender_id and recipient_id in the messages table
-- are correctly linked to the profiles table.
-- ============================================================================

DO $$ 
BEGIN
    -- Fix messages table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN
        
        -- Ensure sender_id FK
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'messages_sender_id_fkey'
        ) THEN
            ALTER TABLE public.messages 
            ADD CONSTRAINT messages_sender_id_fkey 
            FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
        END IF;

        -- Ensure recipient_id FK
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'messages_recipient_id_fkey'
        ) THEN
            ALTER TABLE public.messages 
            ADD CONSTRAINT messages_recipient_id_fkey 
            FOREIGN KEY (recipient_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
        END IF;
    END IF;

    -- Fix scheduled_messages table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'scheduled_messages') THEN
        
        -- Ensure sender_id FK
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'scheduled_messages_sender_id_fkey'
        ) THEN
            ALTER TABLE public.scheduled_messages 
            ADD CONSTRAINT scheduled_messages_sender_id_fkey 
            FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
        END IF;

        -- Ensure recipient_id FK
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'scheduled_messages_recipient_id_fkey'
        ) THEN
            ALTER TABLE public.scheduled_messages 
            ADD CONSTRAINT scheduled_messages_recipient_id_fkey 
            FOREIGN KEY (recipient_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- Reload schema to apply changes to PostgREST
NOTIFY pgrst, 'reload schema';
