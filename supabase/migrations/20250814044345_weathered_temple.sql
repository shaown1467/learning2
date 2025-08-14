/*
  # Initial Schema Setup for Learning Management System

  1. New Tables
    - `user_profiles` - User profile information
    - `topics` - Course topics
    - `videos` - Video content
    - `quizzes` - Quiz data
    - `quiz_questions` - Quiz questions
    - `user_progress` - User video progress
    - `categories` - Community post categories
    - `posts` - Community posts
    - `comments` - Post comments
    - `events` - Calendar events
    - `challenges` - Challenge data
    - `challenge_submissions` - Challenge submissions
    - `challenge_payments` - Challenge payments
    - `challenge_comments` - Challenge submission comments
    - `user_sessions` - User session management

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  avatar text,
  bio text,
  points integer DEFAULT 0,
  completed_videos integer DEFAULT 0,
  joined_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Topics
CREATE TABLE IF NOT EXISTS topics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  thumbnail text,
  "order" integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Videos
CREATE TABLE IF NOT EXISTS videos (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  youtube_url text NOT NULL,
  video_id text NOT NULL,
  topic_id uuid REFERENCES topics(id) ON DELETE CASCADE,
  "order" integer DEFAULT 0,
  files jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

-- Quizzes
CREATE TABLE IF NOT EXISTS quizzes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id uuid REFERENCES videos(id) ON DELETE CASCADE,
  passing_score integer DEFAULT 70,
  points integer DEFAULT 10,
  created_at timestamptz DEFAULT now()
);

-- Quiz Questions
CREATE TABLE IF NOT EXISTS quiz_questions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE,
  question text NOT NULL,
  options jsonb NOT NULL,
  correct_answer integer NOT NULL,
  "order" integer DEFAULT 0
);

-- User Progress
CREATE TABLE IF NOT EXISTS user_progress (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id uuid REFERENCES videos(id) ON DELETE CASCADE,
  watched boolean DEFAULT false,
  can_access boolean DEFAULT true,
  summary text,
  work_link text,
  quiz_score integer,
  quiz_passed boolean DEFAULT false,
  quiz_attempts integer DEFAULT 0,
  completed_at timestamptz,
  submitted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, video_id)
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  color text DEFAULT '#3B82F6',
  created_at timestamptz DEFAULT now()
);

-- Posts
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  content text NOT NULL,
  image_url text,
  youtube_url text,
  files jsonb DEFAULT '[]',
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  author_avatar text,
  approved boolean DEFAULT false,
  pinned boolean DEFAULT false,
  likes text[] DEFAULT '{}',
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Comments
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  author_avatar text,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Events
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  date date NOT NULL,
  time text NOT NULL,
  live_link text,
  type text CHECK (type IN ('live', 'assignment', 'exam', 'other')) DEFAULT 'other',
  created_at timestamptz DEFAULT now()
);

-- Challenges
CREATE TABLE IF NOT EXISTS challenges (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  type text CHECK (type IN ('7day', '30day')) NOT NULL,
  title text NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_active boolean DEFAULT true,
  price integer DEFAULT 0,
  payment_number text,
  created_at timestamptz DEFAULT now()
);

-- Challenge Submissions
CREATE TABLE IF NOT EXISTS challenge_submissions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id uuid REFERENCES challenges(id) ON DELETE CASCADE,
  challenge_type text CHECK (challenge_type IN ('7day', '30day')) NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  author_avatar text,
  title text NOT NULL,
  description text NOT NULL,
  youtube_url text NOT NULL,
  video_id text NOT NULL,
  image_url text,
  files jsonb DEFAULT '[]',
  approved boolean DEFAULT false,
  likes text[] DEFAULT '{}',
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Challenge Payments
CREATE TABLE IF NOT EXISTS challenge_payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id uuid REFERENCES challenges(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  user_email text NOT NULL,
  payment_number text NOT NULL,
  transaction_id text NOT NULL,
  amount integer NOT NULL,
  status text CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Challenge Comments
CREATE TABLE IF NOT EXISTS challenge_comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id uuid REFERENCES challenge_submissions(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  author_avatar text,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- User Sessions
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  device_info text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- User Profiles
CREATE POLICY "Users can read all profiles" ON user_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Topics (Public read, admin write)
CREATE POLICY "Anyone can read topics" ON topics FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage topics" ON topics FOR ALL TO authenticated USING (auth.jwt() ->> 'email' = 'admin@admin.com');

-- Videos (Public read, admin write)
CREATE POLICY "Anyone can read videos" ON videos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage videos" ON videos FOR ALL TO authenticated USING (auth.jwt() ->> 'email' = 'admin@admin.com');

-- Quizzes (Public read, admin write)
CREATE POLICY "Anyone can read quizzes" ON quizzes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage quizzes" ON quizzes FOR ALL TO authenticated USING (auth.jwt() ->> 'email' = 'admin@admin.com');

-- Quiz Questions (Public read, admin write)
CREATE POLICY "Anyone can read quiz questions" ON quiz_questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage quiz questions" ON quiz_questions FOR ALL TO authenticated USING (auth.jwt() ->> 'email' = 'admin@admin.com');

-- User Progress
CREATE POLICY "Users can read own progress" ON user_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own progress" ON user_progress FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admin can read all progress" ON user_progress FOR SELECT TO authenticated USING (auth.jwt() ->> 'email' = 'admin@admin.com');

-- Categories (Public read, admin write)
CREATE POLICY "Anyone can read categories" ON categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage categories" ON categories FOR ALL TO authenticated USING (auth.jwt() ->> 'email' = 'admin@admin.com');

-- Posts
CREATE POLICY "Anyone can read approved posts" ON posts FOR SELECT TO authenticated USING (approved = true OR auth.uid() = author_id OR auth.jwt() ->> 'email' = 'admin@admin.com');
CREATE POLICY "Users can create posts" ON posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE TO authenticated USING (auth.uid() = author_id OR auth.jwt() ->> 'email' = 'admin@admin.com');
CREATE POLICY "Admin can delete posts" ON posts FOR DELETE TO authenticated USING (auth.jwt() ->> 'email' = 'admin@admin.com');

-- Comments
CREATE POLICY "Anyone can read comments" ON comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create comments" ON comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "Admin can delete comments" ON comments FOR DELETE TO authenticated USING (auth.jwt() ->> 'email' = 'admin@admin.com');

-- Events (Public read, admin write)
CREATE POLICY "Anyone can read events" ON events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage events" ON events FOR ALL TO authenticated USING (auth.jwt() ->> 'email' = 'admin@admin.com');

-- Challenges (Public read, admin write)
CREATE POLICY "Anyone can read challenges" ON challenges FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage challenges" ON challenges FOR ALL TO authenticated USING (auth.jwt() ->> 'email' = 'admin@admin.com');

-- Challenge Submissions
CREATE POLICY "Anyone can read approved submissions" ON challenge_submissions FOR SELECT TO authenticated USING (approved = true OR auth.uid() = user_id OR auth.jwt() ->> 'email' = 'admin@admin.com');
CREATE POLICY "Users can create submissions" ON challenge_submissions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own submissions" ON challenge_submissions FOR UPDATE TO authenticated USING (auth.uid() = user_id OR auth.jwt() ->> 'email' = 'admin@admin.com');
CREATE POLICY "Admin can delete submissions" ON challenge_submissions FOR DELETE TO authenticated USING (auth.jwt() ->> 'email' = 'admin@admin.com');

-- Challenge Payments
CREATE POLICY "Users can read own payments" ON challenge_payments FOR SELECT TO authenticated USING (auth.uid() = user_id OR auth.jwt() ->> 'email' = 'admin@admin.com');
CREATE POLICY "Users can create payments" ON challenge_payments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin can update payments" ON challenge_payments FOR UPDATE TO authenticated USING (auth.jwt() ->> 'email' = 'admin@admin.com');

-- Challenge Comments
CREATE POLICY "Anyone can read challenge comments" ON challenge_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create challenge comments" ON challenge_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own challenge comments" ON challenge_comments FOR UPDATE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "Admin can delete challenge comments" ON challenge_comments FOR DELETE TO authenticated USING (auth.jwt() ->> 'email' = 'admin@admin.com');

-- User Sessions
CREATE POLICY "Users can manage own sessions" ON user_sessions FOR ALL TO authenticated USING (auth.uid() = user_id);