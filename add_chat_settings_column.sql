-- Add chat_settings column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS chat_settings JSONB DEFAULT '{"senderColor": "#2563eb", "receiverColor": "#f3f4f6", "backgroundColor": "#ffffff", "readReceipts": true}'::jsonb;

-- Comment for documentation
COMMENT ON COLUMN public.profiles.chat_settings IS 'Stores user preferences for chat appearance and behavior (colors, read receipts)';
