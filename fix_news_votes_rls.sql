-- Enable RLS on the table (ensure it's enabled)
ALTER TABLE "public"."news_votes" ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow anyone to read votes
-- This is necessary so that users can count votes from other users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'news_votes'
        AND policyname = 'Enable read access for all users'
    ) THEN
        CREATE POLICY "Enable read access for all users" ON "public"."news_votes"
        AS PERMISSIVE FOR SELECT
        TO public
        USING (true);
    END IF;
END
$$;

-- Also ensure authenticated users can insert/update/delete their own votes
-- (Assuming these might already exist, but good to ensure basic CRUD)

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'news_votes'
        AND policyname = 'Enable insert for authenticated users'
    ) THEN
        CREATE POLICY "Enable insert for authenticated users" ON "public"."news_votes"
        FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() = user_id);
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'news_votes'
        AND policyname = 'Enable delete for users based on user_id'
    ) THEN
        CREATE POLICY "Enable delete for users based on user_id" ON "public"."news_votes"
        FOR DELETE
        TO authenticated
        USING (auth.uid() = user_id);
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'news_votes'
        AND policyname = 'Enable update for users based on user_id'
    ) THEN
        CREATE POLICY "Enable update for users based on user_id" ON "public"."news_votes"
        FOR UPDATE
        TO authenticated
        USING (auth.uid() = user_id);
    END IF;
END
$$;
