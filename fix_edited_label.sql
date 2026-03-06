-- 1. Remove the default value so it doesn't auto-populate on INSERT
ALTER TABLE messages ALTER COLUMN updated_at DROP DEFAULT;

-- 2. Clear values for messages that were never edited (where updated_at is close to created_at)
UPDATE messages 
SET updated_at = NULL 
WHERE updated_at IS NOT NULL;
-- Note: This will temporarily hide 'Edited' on all old messages, which is safest.
-- In the future, only real edits will populate this column.
