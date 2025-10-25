-- RLS Policies for Admin and Authenticated Users

-- This script sets up Row Level Security (RLS) for tables managed by the admin panel,
-- such as videos, topics, and challenges. These policies ensure that:
-- 1. Admins (identified by 'admin@admin.com') have full CRUD (Create, Read, Update, Delete) access.
-- 2. Authenticated (logged-in) users have read-only access.

-- Make sure to run these commands in your Supabase project's SQL Editor.
-- Go to Dashboard -> SQL Editor -> New Query.

-- ----------------------------------------
-- Policies for 'videos' table
-- ----------------------------------------
-- Enable RLS on the table if not already enabled.
-- ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- 1. Allow admins full access to the 'videos' table.
CREATE POLICY "Allow full access to admins on videos"
ON public.videos
FOR ALL
USING (auth.jwt() ->> 'email' = 'admin@admin.com')
WITH CHECK (auth.jwt() ->> 'email' = 'admin@admin.com');

-- 2. Allow authenticated users to read videos.
CREATE POLICY "Allow read access to authenticated users on videos"
ON public.videos
FOR SELECT
USING (auth.role() = 'authenticated');


-- ----------------------------------------
-- Policies for 'topics' table
-- ----------------------------------------
-- Enable RLS on the table if not already enabled.
-- ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

-- 1. Allow admins full access to the 'topics' table.
CREATE POLICY "Allow full access to admins on topics"
ON public.topics
FOR ALL
USING (auth.jwt() ->> 'email' = 'admin@admin.com')
WITH CHECK (auth.jwt() ->> 'email' = 'admin@admin.com');

-- 2. Allow authenticated users to read topics.
CREATE POLICY "Allow read access to authenticated users on topics"
ON public.topics
FOR SELECT
USING (auth.role() = 'authenticated');


-- ----------------------------------------
-- Policies for 'challenges' table
-- ----------------------------------------
-- Enable RLS on the table if not already enabled.
-- ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

-- 1. Allow admins full access to the 'challenges' table.
CREATE POLICY "Allow full access to admins on challenges"
ON public.challenges
FOR ALL
USING (auth.jwt() ->> 'email' = 'admin@admin.com')
WITH CHECK (auth.jwt() ->> 'email' = 'admin@admin.com');

-- 2. Allow authenticated users to read challenges.
CREATE POLICY "Allow read access to authenticated users on challenges"
ON public.challenges
FOR SELECT
USING (auth.role() = 'authenticated');

-- Note: You may need to add similar policies for other tables like 'quizzes', 'calendars', etc.
-- You can use the policies above as a template.
