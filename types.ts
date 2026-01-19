
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
  position: string;
  department: string;
  jobCategory?: string;
  administrationType?: string;
  roleDescription?: string;
  organizationName?: string;
  country?: string;
  region?: string;
  avatar: string;
  bio: string;
  interests: string[];
  followers: number;
  following: number;
  badges?: Badge[];
}

export type PostType = 'post' | 'news';

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorPosition: string;
  authorAvatar: string;
  content: string;
  timestamp: string;
  type: PostType;
  tags: string[];
  likes: number;
  comments: number;
  userLiked: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
}

export interface Chat {
  id: string;
  participant: User;
  lastMessage: string;
  timestamp: Date;
}

export interface Tender {
  id: string;
  title: string;
  summary: string;
  link: string;
  updated: string;
  keywordsFound: string[];
  isRead: boolean;
  sourceType: string;
  contractType: string;
  amount?: string;
  organism?: string;
}

export interface ProjectDraft {
  tenderId: string;
  introduction: string;
  objectives: string;
  methodology: string;
  resources: string;
  evaluation: string;
  coverImage?: string;
}