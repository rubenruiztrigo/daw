
export interface CalendarEvent {
  id: string;
  creator_id: string;
  title: string;
  type: 'physical' | 'online_course' | 'meeting';
  event_date: string;
  event_time: string;
  location: string;
  description: string;
  attendees?: number;
}

export interface ProjectDraft {
  introduction: string;
  objectives: string;
  methodology: string;
  resources: string;
  evaluation: string;
  coverImage?: string;
}

export interface Badge {
  id: string;
  label: string;
  color: string;
}

export interface User {
  id: string;
  name: string;
  lastName?: string;
  username?: string;
  email?: string;
  password?: string;
  birthDate?: string;
  position: string;
  department: string;
  jobCategory?: string;
  administrationType?: string;
  country?: string;
  region?: string;
  avatar: string;
  banner?: string;
  bannerColor?: string;
  bio: string;
  interests: string[];
  followers: number;
  following: number;
  badges?: Badge[];
  joinedDate?: string;
}

export interface CommentReply {
  id: string;
  commentId: string;
  parentReplyId?: string;
  authorId: string;
  authorName: string;
  authorUsername?: string;
  authorAvatar: string;
  text: string;
  timestamp: string;
  likes?: number;
  replies?: CommentReply[];
}

export interface Comment {
  id: string;
  authorId?: string;
  authorName: string;
  authorUsername?: string;
  authorAvatar: string;
  text: string;
  timestamp: string;
  likes?: number;
  userLiked?: boolean;
  replies?: CommentReply[];
}

export type PostType = 'post' | 'news';

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername?: string;
  authorPosition: string;
  authorAvatar: string;
  content: string;
  imageUrl?: string;
  docUrl?: string;
  docName?: string;
  timestamp: string;
  type: PostType;
  tags: string[];
  likes: number;
  reposts: number;
  upvotes?: number;
  downvotes?: number;
  comments: number;
  commentsList: Comment[];
  userLiked: boolean;
  userReposted: boolean;
  userDownvoted?: boolean;
  linkedEventId?: string;
  linkedEvent?: CalendarEvent;
}

export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  text: string;
  timestamp: Date;
  isPostShare?: boolean;
  postId?: string;
  isRead?: boolean;
}

export interface Chat {
  id: string;
  participant: Partial<User>;
  messages: Message[];
  lastMessage: string;
  timestamp: Date;
}

export interface Notification {
  id: string;
  type: 'follow' | 'like' | 'comment' | 'mention' | 'repost';
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  postId?: string;
}

// Fix: Added missing Tender interface used by tenderService.ts, TendersView.tsx and TenderCard.tsx
export interface Tender {
  id: string;
  title: string;
  organism: string;
  status: 'published' | 'evaluation' | 'awarded' | 'closed';
  budget: number;
  type: 'service' | 'supply' | 'works';
  deadline: string;
  description: string;
  link: string;
  region: string;
}

export type AppView = 'feed' | 'profile' | 'messages' | 'news' | 'search' | 'settings' | 'notifications' | 'calendar' | 'post-detail';
