-- RLS Policies for User-Specific Tables

-- This script sets up Row Level Security (RLS) for tables where users need to
-- manage their own data, such as challenge submissions, comments, payments, and calendar events.

-- Make sure to run these commands in your Supabase project's SQL Editor.
-- Go to Dashboard -> SQL Editor -> New Query.

-- ----------------------------------------
-- Policies for 'challenge_submissions' table
-- ----------------------------------------
ALTER TABLE public.challenge_submissions ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own submissions
CREATE POLICY "Allow users to insert their own submissions"
ON public.challenge_submissions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own submissions (e.g., for likes)
CREATE POLICY "Allow users to update their own submissions"
ON public.challenge_submissions
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to read all approved submissions
CREATE POLICY "Allow users to read approved submissions"
ON public.challenge_submissions
FOR SELECT
USING (approved = true);


-- ----------------------------------------
-- Policies for 'challenge_comments' table
-- ----------------------------------------
ALTER TABLE public.challenge_comments ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own comments
CREATE POLICY "Allow users to insert their own comments"
ON public.challenge_comments
FOR INSERT
WITH CHECK (auth.uid() = author_id);

-- Allow users to read all comments
CREATE POLICY "Allow users to read all comments"
ON public.challenge_comments
FOR SELECT
TO authenticated;

-- ----------------------------------------
-- Policies for 'challenge_payments' table
-- ----------------------------------------
ALTER TABLE public.challenge_payments ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own payments
CREATE POLICY "Allow users to insert their own payments"
ON public.challenge_payments
FOR INSERT
WITH CHECK (auth.uid() = user_id);


-- ----------------------------------------
-- Policies for 'calendar_events' table
-- ----------------------------------------
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- Allow users to manage their own calendar events
CREATE POLICY "Allow users to manage their own calendar events"
ON public.calendar_events
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
