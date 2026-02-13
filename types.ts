
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
  description: string;
  color: string;
  category: 'general' | 'novas' | 'congresos' | 'premios' | 'eventos' | 'formacion' | 'ranking';
  value?: number;
}

export const BADGE_CATALOG: Badge[] = [
  // General (Cuenta)
  { id: 'verified', label: 'Verificado', description: 'Identidad verificada por la administración.', color: 'bg-green-100 text-green-600 border-green-200', category: 'general' },
  { id: 'pioneer', label: 'Pionero', description: 'Uno de los primeros 100 usuarios.', color: 'bg-amber-100 text-amber-600 border-amber-200', category: 'general' },

  // Novas
  { id: 'contributor', label: 'Colaborador', description: 'Ha realizado más de 50 publicaciones.', color: 'bg-blue-100 text-blue-600 border-blue-200', category: 'novas' },
  { id: 'influencer', label: 'Influyente', description: 'Sus publicaciones han recibido más de 1000 likes.', color: 'bg-purple-100 text-purple-600 border-purple-200', category: 'novas' },

  // Congresos NovaGob
  { id: 'congress_2021_speaker', label: 'Ponente Congreso 2021', description: 'Ponente en el Congreso NovaGob 2021.', color: 'bg-amber-100 text-amber-600 border-amber-200', category: 'congresos', value: 15 },
  { id: 'congress_2021', label: 'Asistente Congreso 2021', description: 'Asistente al Congreso NovaGob 2021.', color: 'bg-slate-100 text-slate-500 border-slate-200', category: 'congresos', value: 10 },
  { id: 'congress_2022_speaker', label: 'Ponente Congreso 2022', description: 'Ponente en el Congreso NovaGob 2022.', color: 'bg-amber-100 text-amber-600 border-amber-200', category: 'congresos', value: 15 },
  { id: 'congress_2022', label: 'Asistente Congreso 2022', description: 'Asistente al Congreso NovaGob 2022.', color: 'bg-slate-100 text-slate-500 border-slate-200', category: 'congresos', value: 10 },
  { id: 'congress_2023_speaker', label: 'Ponente Congreso 2023', description: 'Ponente en el Congreso NovaGob 2023.', color: 'bg-amber-100 text-amber-600 border-amber-200', category: 'congresos', value: 15 },
  { id: 'congress_2023', label: 'Asistente Congreso 2023', description: 'Asistente al Congreso NovaGob 2023.', color: 'bg-slate-100 text-slate-500 border-slate-200', category: 'congresos', value: 10 },
  { id: 'congress_2024_speaker', label: 'Ponente Congreso 2024', description: 'Ponente en el Congreso NovaGob 2024.', color: 'bg-amber-100 text-amber-600 border-amber-200', category: 'congresos', value: 15 },
  { id: 'congress_2024', label: 'Asistente Congreso 2024', description: 'Asistente al Congreso NovaGob 2024.', color: 'bg-slate-100 text-slate-500 border-slate-200', category: 'congresos', value: 10 },
  { id: 'congress_2025_speaker', label: 'Ponente Congreso 2025', description: 'Ponente en el Congreso NovaGob 2025.', color: 'bg-amber-100 text-amber-600 border-amber-200', category: 'congresos', value: 15 },
  { id: 'congress_2025', label: 'Asistente Congreso 2025', description: 'Asistente al Congreso NovaGob 2025.', color: 'bg-slate-100 text-slate-500 border-slate-200', category: 'congresos', value: 10 },
  { id: 'congress_2026_speaker', label: 'Ponente Congreso 2026', description: 'Ponente en el Congreso NovaGob 2026.', color: 'bg-amber-100 text-amber-600 border-amber-200', category: 'congresos', value: 15 },
  { id: 'congress_2026', label: 'Asistente Congreso 2026', description: 'Asistente al Congreso NovaGob 2026.', color: 'bg-slate-100 text-slate-500 border-slate-200', category: 'congresos', value: 10 },

  // Premios Individuales
  { id: 'award_innovator', label: 'Innovador del Año', description: 'Premio a la persona innovadora del año.', color: 'bg-amber-100 text-amber-600 border-amber-200', category: 'premios', value: 20 },
  { id: 'award_woman', label: 'Mujer Destacada', description: 'Mujer destacada del sector público.', color: 'bg-pink-100 text-pink-600 border-pink-200', category: 'premios', value: 20 },
  { id: 'award_talent', label: 'Nuevo Talento', description: 'Nuevo talento público.', color: 'bg-cyan-100 text-cyan-600 border-cyan-200', category: 'premios', value: 20 },
  { id: 'award_excellence', label: 'Excelencia', description: 'Valor de las personas excelentes.', color: 'bg-emerald-100 text-emerald-600 border-emerald-200', category: 'premios', value: 20 },
  { id: 'award_special', label: 'Mención Especial', description: 'Categoría especial del jurado.', color: 'bg-indigo-100 text-indigo-600 border-indigo-200', category: 'premios', value: 20 },

  // Eventos Especiales
  { id: 'event_innovalencia_speaker', label: 'Ponente InnoValencia', description: 'Ponente en InnoValencia.', color: 'bg-amber-100 text-amber-600 border-amber-200', category: 'eventos', value: 15 },
  { id: 'event_innovalencia', label: 'Asistente InnoValencia', description: 'Asistente a InnoValencia.', color: 'bg-slate-100 text-slate-500 border-slate-200', category: 'eventos', value: 10 },
  { id: 'event_burocracia_speaker', label: 'Ponente Burocrac_IA', description: 'Ponente en el Festival Burocrac_IA.', color: 'bg-amber-100 text-amber-600 border-amber-200', category: 'eventos', value: 15 },
  { id: 'event_burocracia', label: 'Asistente Burocrac_IA', description: 'Asistente al Festival Burocrac_IA.', color: 'bg-slate-100 text-slate-500 border-slate-200', category: 'eventos', value: 10 },
  { id: 'event_innovamos_speaker', label: 'Ponente Foro Innovamos', description: 'Ponente en Foro Innovamos Lab.', color: 'bg-amber-100 text-amber-600 border-amber-200', category: 'eventos', value: 15 },
  { id: 'event_innovamos', label: 'Asistente Foro Innovamos', description: 'Asistente al Foro Innovamos Lab.', color: 'bg-slate-100 text-slate-500 border-slate-200', category: 'eventos', value: 10 },

  // Formación
  { id: 'training_basic', label: 'Curso Básico', description: 'Completó la formación básica de la red.', color: 'bg-indigo-100 text-indigo-600 border-indigo-200', category: 'formacion', value: 10 },
  { id: 'training_advanced', label: 'Curso Avanzado', description: 'Completó la formación avanzada.', color: 'bg-violet-100 text-violet-600 border-violet-200', category: 'formacion', value: 15 },

  // Ranking Semanal
  { id: 'ranking_top1', label: 'Top 1 Semanal', description: 'Primer lugar en el ranking semanal.', color: 'bg-yellow-100 text-yellow-600 border-yellow-200', category: 'ranking', value: 5 },
  { id: 'ranking_top2', label: 'Top 2 Semanal', description: 'Segundo lugar en el ranking semanal.', color: 'bg-slate-200 text-slate-500 border-slate-300', category: 'ranking', value: 3 },
  { id: 'ranking_top3', label: 'Top 3 Semanal', description: 'Tercer lugar en el ranking semanal.', color: 'bg-orange-100 text-orange-700 border-orange-200', category: 'ranking', value: 1 },
  { id: 'legendary_contributor', label: 'Leyenda de la Red', description: 'Nivel legendario alcanzado por contribuciones excepcionales.', color: 'bg-rose-100 text-rose-600 border-rose-200', category: 'novas', value: 1000 },
];

export const calculateNovas = (userBadges: { id: string }[] | undefined): number => {
  if (!userBadges || userBadges.length === 0) return 0;

  return userBadges.reduce((total, ub) => {
    const badge = BADGE_CATALOG.find(b => b.id === ub.id);
    if (!badge) return total;

    let points = badge.value || 0;

    // Fallback logic for badges without explicit value set in catalog
    if (!badge.value) {
      switch (badge.category) {
        case 'congresos':
          points = 15;
          break;
        case 'premios':
          points = 20;
          break;
        case 'eventos':
          points = 15;
          break;
        case 'formacion':
          points = 10;
          break;
        case 'ranking':
          if (badge.id === 'ranking_top1') points = 5;
          else if (badge.id === 'ranking_top2') points = 3;
          else if (badge.id === 'ranking_top3') points = 1;
          break;
        case 'novas':
          points = 5;
          break;
        default:
          points = 0;
      }
    }

    return total + points;
  }, 0);
};

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
  roleDescription?: string;
  organizationName?: string;
  isAdmin?: boolean;
  status?: 'pending' | 'active' | 'rejected';
  avatar: string;
  banner?: string;
  bannerColor?: string;
  bio: string;
  interests: string[];
  followers: number;
  following: number;
  badges?: Badge[];
  joinedDate?: string;
  notificationSettings?: {
    likes_post: boolean;
    likes_news: boolean;
    likes_comment: boolean;
    comments_post: boolean;
    comments_news: boolean;
    replies: boolean;
    follows: boolean;
    event_supports: boolean;
    reposts: boolean;
    read_receipts: boolean;
  };
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
  sharedProfile?: Partial<User>;
  sharedEventId?: string;
  sharedEvent?: CalendarEvent;
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
  type: 'follow' | 'like' | 'comment' | 'mention' | 'repost' | 'registration_request' | 'system';
  senderName: string;
  senderId?: string;
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

export type AppView = 'feed' | 'profile' | 'messages' | 'news' | 'search' | 'settings' | 'notifications' | 'calendar' | 'post-detail' | 'store';
