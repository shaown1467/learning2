# Supabase Storage Setup Instructions

## Create Storage Bucket

You need to create a single storage bucket called `uploads` in your Supabase project:

### Steps:

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Storage** in the left sidebar
4. Click **"New bucket"**
5. Enter bucket name: `uploads`
6. Check **"Public bucket"** (so files can be accessed publicly)
7. Click **"Create bucket"**

### Storage Policies

After creating the bucket, set up these storage policies:

1. Go to **Storage** → **Policies**
2. Click **"New policy"** for the `uploads` bucket
3. Create these policies:

**Policy 1: Allow authenticated users to upload**
```sql
CREATE POLICY "Allow authenticated users to upload" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'uploads');
```

**Policy 2: Allow public read access**
```sql
CREATE POLICY "Allow public read access" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'uploads');
```

**Policy 3: Allow users to delete their own files**
```sql
CREATE POLICY "Allow users to delete own files" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### File Organization

Files will be organized in folders within the single `uploads` bucket:
- `topic-thumbnails/user-id/filename.ext`
- `video-files/user-id/filename.ext`
- `images/user-id/filename.ext`
- `files/user-id/filename.ext`
- `challenge-files/user-id/filename.ext`

This approach is simpler and more efficient than creating multiple buckets.