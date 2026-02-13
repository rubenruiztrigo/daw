-- Set Replica Identity to FULL
-- This is critical for Supabase Realtime to receive the full record in the 'trigger'
-- Without this, 'payload.new' might be incomplete or events might be skipped
ALTER TABLE posts REPLICA IDENTITY FULL;
ALTER TABLE news REPLICA IDENTITY FULL;
