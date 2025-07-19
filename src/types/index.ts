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
  summary: string;
  workLink: string;
  quizScore?: number;
  quizPassed: boolean;
  completedAt?: Date;
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