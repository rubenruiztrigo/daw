-- Setup Supabase Storage Buckets and Policies

-- 1. Create buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-images', 'chat-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('badge-images', 'badge-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can manage their own objects" ON storage.objects;

-- 4. Create Policies

-- Allow public access to all objects in these buckets
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id IN ('chat-images', 'post-images', 'badge-images') );

-- Allow authenticated users to upload files to these buckets
CREATE POLICY "Authenticated Users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id IN ('chat-images', 'post-images', 'badge-images') );

-- Allow users to update or delete their own files
CREATE POLICY "Users can manage their own objects"
ON storage.objects FOR ALL
TO authenticated
USING ( auth.uid() = owner )
WITH CHECK ( auth.uid() = owner );
