-- RLS Policies for user_sessions and user_profiles tables

-- This script sets up Row Level Security (RLS) for the user_sessions and user_profiles tables.
-- These policies ensure that users can only access and manage their own data,
-- enhancing security and preventing unauthorized data access.

-- Make sure to run these commands in your Supabase project's SQL Editor.
-- Go to Dashboard -> SQL Editor -> New Query.


-- ----------------------------------------
-- Policies for user_sessions table
-- ----------------------------------------

-- 1. Enable RLS on the table if not already enabled
-- ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- 2. Allow users to read their own session data
CREATE POLICY "Allow individual read access on user_sessions"
ON public.user_sessions
FOR SELECT
USING (auth.uid() = user_id);

-- 3. Allow users to create a new session for themselves
CREATE POLICY "Allow individual insert access on user_sessions"
ON public.user_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 4. Allow users to delete their own session data (e.g., on logout)
CREATE POLICY "Allow individual delete access on user_sessions"
ON public.user_sessions
FOR DELETE
USING (auth.uid() = user_id);


-- ----------------------------------------
-- Policies for user_profiles table
-- ----------------------------------------

-- 1. Enable RLS on the table if not already enabled
-- ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 2. Allow users to read their own profile
CREATE POLICY "Allow individual read access on user_profiles"
ON public.user_profiles
FOR SELECT
USING (auth.uid() = user_id);

-- 3. Allow users to create their own profile
CREATE POLICY "Allow individual insert access on user_profiles"
ON public.user_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 4. Allow users to update their own profile
CREATE POLICY "Allow individual update access on user_profiles"
ON public.user_profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
