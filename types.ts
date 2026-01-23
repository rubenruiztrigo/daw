
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
  gender?: 'Hombre' | 'Mujer' | 'Prefiero no decirlo';
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
  upvotes?: number; 
  downvotes?: number; 
  comments: number;
  commentsList: Comment[];
  userLiked: boolean;
  userDownvoted?: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  text: string;
  timestamp: Date;
  isPostShare?: boolean;
  postId?: string;
}

export interface Chat {
  id: string; // ID del otro participante
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

export interface ProjectDraft {
  coverImage?: string;
  introduction: string;
  objectives: string;
  methodology: string;
  resources: string;
  evaluation: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  type: 'innovation' | 'training' | 'meeting' | 'congress';
  date: Date;
  location: string;
  description: string;
}

// Added Tender interface to resolve missing exported member error
export interface Tender {
  id: string;
  title: string;
  organization: string;
  budget: string;
  status: string;
  deadline: string;
  link: string;
  description?: string;
}
