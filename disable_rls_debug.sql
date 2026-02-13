-- DEBUGGING ONLY: Temporarily disable RLS to rule out permission issues
-- If the button appears after running this, we know the RLS policies are too strict.

ALTER TABLE posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE news DISABLE ROW LEVEL SECURITY;

-- Note: To re-enable later, run:
-- ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE news ENABLE ROW LEVEL SECURITY;
