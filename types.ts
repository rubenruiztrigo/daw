
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
  gender?: 'Hombre' | 'Mujer' | 'Otro';
  birthDate?: string;
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
  joinedDate?: string;
}

export interface Comment {
  id: string;
  authorId?: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  timestamp: string;
  likes?: number;
  userLiked?: boolean;
}

export type PostType = 'post' | 'news';

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
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
  comments: number;
  commentsList: Comment[];
  userLiked: boolean;
  userDownvoted?: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
  isPostShare?: boolean;
  postId?: string;
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
  type: 'follow' | 'like' | 'comment' | 'mention';
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  postId?: string;
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
