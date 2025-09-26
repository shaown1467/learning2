# Supabase Storage Setup Instructions

## CRITICAL: You must complete these steps in your Supabase Dashboard

The application is failing because the required storage bucket doesn't exist. Follow these exact steps:

### Step 1: Create Storage Bucket

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Storage** in the left sidebar
4. Click **"New bucket"**
5. Enter bucket name: `uploads`
6. Check **"Public bucket"** (so files can be accessed publicly)
7. Click **"Create bucket"**

### Step 2: Set Up Storage Policies

After creating the bucket, you MUST set up these storage policies:

1. Go to **Storage** → **Policies**
2. Click **"New policy"** for the `uploads` bucket
3. Create these 3 policies by running these SQL commands in the **SQL Editor**:

```sql
-- Policy 1: Allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'uploads');

-- Policy 2: Allow public read access to all files
CREATE POLICY "Allow public read access" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'uploads');

-- Policy 3: Allow users to delete their own files
CREATE POLICY "Allow users to delete own files" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### Step 3: Verify Setup

After completing the above steps:

1. Go to **Storage** → **uploads** bucket
2. You should see the bucket is created and marked as "Public"
3. Go to **Storage** → **Policies** 
4. You should see 3 policies listed for the `uploads` bucket

### File Organization Structure

Files will be organized in the `uploads` bucket as follows:
```
uploads/
├── videos/user-id/filename.ext
├── challenge-files/user-id/filename.ext
├── topic-thumbnails/user-id/filename.ext
├── images/user-id/filename.ext
└── files/user-id/filename.ext
```

### Troubleshooting

If you still get "Bucket not found" errors after setup:
1. Double-check the bucket name is exactly `uploads`
2. Ensure the bucket is marked as "Public"
3. Verify all 3 policies are created
4. Try refreshing your application

**IMPORTANT**: Without completing these steps, file uploads will continue to fail!