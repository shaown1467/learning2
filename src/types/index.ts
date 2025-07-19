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
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  price: number; // 0 for free, amount for paid
  paymentNumber?: string; // Bkash/Nagad number for 30-day challenge
  createdAt: Date;
}

export interface ChallengeSubmission {
  id: string;
  challengeId: string;
  challengeType: '7day' | '30day';
  userId: string;
  authorName: string;
  authorAvatar?: string;
  title: string;
  description: string;
  youtubeUrl: string;
  videoId: string;
  imageUrl?: string;
  files?: FileAttachment[];
  approved: boolean;
  likes: string[];
  likesCount: number;
  commentsCount: number;
  createdAt: Date;
}

export interface ChallengePayment {
  id: string;
  challengeId: string;
  userId: string;
  userName: string;
  userEmail: string;
  paymentNumber: string;
  transactionId: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

export interface ChallengeComment {
  id: string;
  submissionId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: Date;
}