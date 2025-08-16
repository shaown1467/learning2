export interface Topic {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  order: number;
  createdAt: Date;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  youtubeUrl: string;
  videoId: string;
  topicId: string;
  order: number;
  files?: FileAttachment[];
  createdAt: Date;
}

export interface FileAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
}

export interface Quiz {
  id: string;
  videoId: string;
  questions: Question[];
  passingScore: number;
  points: number;
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface UserProgress {
  id: string;
  userId: string;
  videoId: string;
  watched: boolean;
  canAccess: boolean;
  summary: string;
  workLink: string;
  quizScore?: number;
  quizPassed: boolean;
  quizAttempts: number;
  completedAt?: Date;
  submittedAt?: Date;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt: Date;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  files?: FileAttachment[];
  categoryId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  approved: boolean;
  pinned: boolean;
  likes: string[];
  likesCount: number;
  commentsCount: number;
  createdAt: Date;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: Date;
}

export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: Date;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: Date;
  time: string;
  liveLink?: string;
  type: 'live' | 'assignment' | 'exam' | 'other';
  createdAt: Date;
}

export interface UserProfile {
  id: string;
  userId: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  points: number;
  completedVideos: number;
  joinedAt: Date;
  updatedAt: Date;
}

export interface UserStats {
  totalUsers: number;
  totalVideos: number;
  totalTopics: number;
  totalPosts: number;
  totalEvents: number;
  averageProgress: number;
}

export interface Challenge {
  id: string;
  type: '7day' | '30day';
  title: string;
  description: string;
  start_date: Date;
  end_date: Date;
  is_active: boolean;
  price: number; // 0 for free, amount for paid
  payment_number?: string; // Bkash/Nagad number for 30-day challenge
  created_at: Date;
}

export interface ChallengeSubmission {
  id: string;
  challenge_id: string;
  challenge_type: '7day' | '30day';
  user_id: string;
  author_name: string;
  author_avatar?: string;
  title: string;
  description: string;
  youtube_url: string;
  video_id: string;
  image_url?: string;
  files?: FileAttachment[];
  approved: boolean;
  likes: string[];
  likes_count: number;
  comments_count: number;
  created_at: Date;
}

export interface ChallengePayment {
  id: string;
  challenge_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  payment_number: string;
  transaction_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: Date;
}

export interface ChallengeComment {
  id: string;
  submission_id: string;
  author_id: string;
  author_name: string;
  author_avatar?: string;
  content: string;
  created_at: Date;
}