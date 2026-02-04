
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { User, Post, CalendarEvent, Chat } from '../types';
import { Briefcase, MapPin, Share2, Edit3, Calendar, LayoutGrid, Newspaper, UserPlus, UserMinus, Camera, MessageCircle, Plus, Award, Maximize2, X, Check, Palette, Repeat, Clock, Users, ChevronRight, Sparkles, AlignLeft, Save, Loader2, Heart, CheckCircle2, Megaphone, Trophy, Target, Zap } from 'lucide-react';
import { EditProfileModal } from './EditProfileModal';
import { PreferencesModal } from './PreferencesModal';
import { ShareModal } from './ShareModal';
import { UsersListModal } from './UsersListModal';
import { PostCard } from './PostCard';
import { NewsCard } from './NewsCard';
import { ImageCropModal } from './ImageCropModal';
import { supabase } from '../supabaseClient';

type ProfileTab = 'posts' | 'news' | 'reposts' | 'events' | 'badges';

interface ProfileViewProps {
  user: User;
  isCurrentUser: boolean;
  isFollowed?: boolean;
  isFollower?: boolean;
  onToggleFollow?: (userId: string) => void;
  onStartChat?: (user: User) => void;
  posts: Post[];
  onUpdateUser: (updatedUser: User) => void;
  onDeletePost?: (postId: string) => void;
  onNavigateToProfile?: (userId: string) => void;
  onNavigateToPost?: (postId: string) => void;
  onPreviewImage?: (url: string) => void;
  currentUser: User;
  onLike?: (id: string) => void;
  onVote?: (id: string, dir: 'up' | 'down') => void;
  onRepost: (id: string) => void;
  onAddComment?: (postId: string, text: string) => void;
  users: User[];
  onSearchHashtag?: (tag: string) => void;
  onNavigateToEvent?: (userId: string, eventId: string) => void;
  focusedEventId?: string | null;
  onClearFocusedEvent?: () => void;
  onAddPost?: (content: string, type: 'post' | 'news', tags: string[], imageUrl?: string, docUrl?: string, docName?: string, linkedEventId?: string) => void;
  onPromoteEvent?: (event: CalendarEvent) => void;
  chats?: Chat[];
  followerUserIds?: Set<string>;
  followedUserIds?: Set<string>;
  onShareViaChat?: (recipientId: string, text: string, postId?: string, profileId?: string) => void;
}
// ... (skip down to ShareModal usage) -> Actually I need to split this into two chunks (Interface and Usage) or use multi_replace.
// Since they are far apart, I'll use multi_replace.

const NovagoberStatusModal: React.FC<{ user: User, onClose: () => void }> = ({ user, onClose }) => {
  const badgeCount = user.badges?.length || 0;

  const getStatusInfo = (count: number) => {
    if (count === 0) return {
      rank: "Aspirante",
      color: "text-slate-400",
      bg: "bg-slate-50",
      icon: <Target size={40} />,
      desc: "Estás comenzando tu viaje de innovación. ¡Participa para ganar tu primera insignia!",
      next: 1
    };
    if (count <= 2) return {
      rank: "Novagober Bronce",
      color: "text-amber-700",
      bg: "bg-amber-50",
      icon: <Award size={40} />,
      desc: "Eres un miembro activo. Tu contribución empieza a ser relevante para la comunidad.",
      next: 3
    };
    if (count <= 5) return {
      rank: "Novagober Plata",
      color: "text-blue-500",
      bg: "bg-blue-50",
      icon: <Zap size={40} />,
      desc: "Referente local. Tus aportaciones técnicas son valoradas por tus colegas.",
      next: 6
    };
    if (count <= 8) return {
      rank: "Novagober Oro",
      color: "text-yellow-500",
      bg: "bg-yellow-50",
      icon: <Trophy size={40} />,
      desc: "Líder de Innovación. Eres una pieza clave en la transformación de la administración.",
      next: 9
    };
    return {
      rank: "Novagober Diamante",
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      icon: <Sparkles size={40} />,
      desc: "Maestro/a de la Red. Tu influencia trasciende fronteras institucionales.",
      next: 10
    };
  };

  const status = getStatusInfo(badgeCount);
  const progress = (badgeCount / 10) * 100;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
      <div className="bg-white dark:bg-[#0a0a0a] w-full max-w-md rounded-[3rem] overflow-hidden animate-in zoom-in-95 duration-300 border border-white dark:border-zinc-800" onClick={(e) => e.stopPropagation()}>
        <div className="p-10 text-center space-y-6">
          <div className={`mx-auto w-24 h-24 ${status.bg} ${status.color} rounded-[2rem] flex items-center justify-center`}>
            {status.icon}
          </div>

          <div>
            <h3 className={`text-3xl font-black ${status.color} tracking-tight`}>{status.rank}</h3>
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-2">Nivel de Influencia NovaGob</p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-end px-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progreso: {badgeCount}/10</span>
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{Math.round(progress)}%</span>
            </div>
            <div className="h-4 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden p-1 border border-slate-50 dark:border-zinc-900">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <p className="text-gray-600 dark:text-gray-300 font-medium leading-relaxed italic">
            "{status.desc}"
          </p>

          <div className="pt-4">
            <button
              onClick={onClose}
              className="w-full py-4 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-gray-400 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all active:scale-95"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CreateEventModal: React.FC<{
  userId: string,
  onClose: () => void,
  onSave: () => void,
  onAddPost?: (content: string, type: 'post' | 'news', tags: string[], imageUrl?: string, docUrl?: string, docName?: string, linkedEventId?: string) => void
}> = ({ userId, onClose, onSave, onAddPost }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'physical',
    date: '',
    time: '',
    location: '',
    description: ''
  });

  useEffect(() => {
    if (formData.type !== 'physical') {
      setFormData(prev => ({ ...prev, location: 'Online' }));
    } else {
      if (formData.location === 'Online') {
        setFormData(prev => ({ ...prev, location: '' }));
      }
    }
  }, [formData.type]);

  const handleSubmit = async (e: React.FormEvent, shouldPromote: boolean) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase
      .from('user_events')
      .insert({
        creator_id: userId,
        title: formData.title,
        type: formData.type,
        event_date: formData.date,
        event_time: formData.time,
        location: formData.location,
        description: formData.description
      })
      .select()
      .single();

    if (!error && data) {
      if (shouldPromote && onAddPost) {
        let typeTag = 'Presencial';
        if (formData.type === 'online_course') typeTag = 'CursoOnline';
        if (formData.type === 'meeting') typeTag = 'Reunion';

        await onAddPost(
          `He organizado un nuevo evento: ${formData.title}. ¡Os espero a todos! #Evento #${typeTag}`,
          'post',
          ['Evento', typeTag],
          undefined,
          undefined,
          undefined,
          data.id
        );
      }
      onSave();
      onClose();
    } else {
      console.error("Error creating event:", error);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
      <div className="bg-white dark:bg-[#0a0a0a] w-full max-w-lg rounded-[2.5rem] overflow-hidden animate-in zoom-in-95 duration-300 border border-white dark:border-zinc-800" onClick={(e) => e.stopPropagation()}>
        <div className="px-8 py-6 border-b border-slate-50 dark:border-zinc-900 flex justify-between items-center bg-white dark:bg-[#0a0a0a] sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-2xl">
              <Calendar size={20} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Organizar Evento</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Define los detalles de tu evento</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 dark:hover:bg-zinc-900 rounded-full text-slate-400 transition-all"><X size={24} /></button>
        </div>

        <form onSubmit={(e) => e.preventDefault()} className="p-8 space-y-5">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Título del evento</label>
            <input
              required
              type="text"
              placeholder="Ej. Taller de Innovación Abierta"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-5 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50 dark:text-white transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Tipo de Evento</label>
            <select
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-5 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50 dark:text-white transition-all appearance-none"
            >
              <option value="physical">Evento Presencial</option>
              <option value="online_course">Curso Online</option>
              <option value="meeting">Reunión</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Fecha</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input
                  required
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  className="w-full pl-12 pr-5 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50 dark:text-white transition-all"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Hora</label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input
                  required
                  type="time"
                  value={formData.time}
                  onChange={e => setFormData({ ...formData, time: e.target.value })}
                  className="w-full pl-12 pr-5 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50 dark:text-white transition-all"
                />
              </div>
            </div>
          </div>

          {formData.type === 'physical' && (
            <div className="space-y-1 animate-in slide-in-from-top-2 duration-300">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Ubicación</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input
                  required
                  type="text"
                  placeholder="Ej. Sala de conferencias o Dirección"
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  className="w-full pl-12 pr-5 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50 dark:text-white transition-all"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Descripción</label>
            <div className="relative">
              <AlignLeft className="absolute left-4 top-4 text-slate-300" size={16} />
              <textarea
                required
                placeholder="Detalla de qué trata el evento..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-50 dark:text-white transition-all min-h-[100px] resize-none"
              />
            </div>
          </div>

          <div className="pt-4 space-y-3">
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-4 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-gray-400 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, false)}
                disabled={loading || !formData.title || !formData.date || !formData.time}
                className="flex-[1.5] py-4 border-2 border-blue-600 text-blue-600 dark:text-blue-400 rounded-2xl font-black text-sm hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all flex items-center justify-center space-x-2 transform active:scale-95 disabled:opacity-50"
              >
                <Check size={18} />
                <span>Publicar</span>
              </button>
            </div>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              disabled={loading || !formData.title || !formData.date || !formData.time}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all flex items-center justify-center space-x-2 transform active:scale-95 disabled:opacity-50"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <><Megaphone size={18} /><span>Publicar y Promocionar</span></>}
            </button>
            <p className="text-[10px] text-center text-slate-400 font-bold px-4">
              "Publicar y Promocionar" creará el evento y generará automáticamente un post en el feed principal.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export const ProfileView: React.FC<ProfileViewProps> = ({
  user, isCurrentUser, isFollowed, isFollower, onToggleFollow, onStartChat, posts,
  onUpdateUser, onDeletePost, onNavigateToProfile, onNavigateToPost, onPreviewImage, currentUser, onLike, onVote, onRepost, onAddComment, users, onSearchHashtag, onNavigateToEvent, focusedEventId, onClearFocusedEvent, onAddPost, onPromoteEvent, chats = [], followerUserIds = new Set(), followedUserIds = new Set(), onShareViaChat
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPreferencesModalOpen, setIsPreferencesModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [isShowStatusModalOpen, setIsShowStatusModalOpen] = useState(false);
  const [viewingUsersList, setViewingUsersList] = useState<'followers' | 'following' | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [repostedPostIds, setRepostedPostIds] = useState<string[]>([]);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [userEvents, setUserEvents] = useState<CalendarEvent[]>([]);
  const [supportedEventIds, setSupportedEventIds] = useState<Set<string>>(new Set());
  const [loadingEvents, setLoadingEvents] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (focusedEventId) {
      setActiveTab('events');
      const timer = setTimeout(() => {
        onClearFocusedEvent?.();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [focusedEventId]);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: reposts } = await supabase
        .from('post_reposts')
        .select('post_id')
        .eq('user_id', user.id);

      if (reposts) setRepostedPostIds(reposts.map(r => r.post_id));

      const { data: supports } = await supabase
        .from('event_supports')
        .select('event_id')
        .eq('user_id', currentUser.id);

      if (supports) setSupportedEventIds(new Set(supports.map(s => s.event_id)));
    };

    fetchUserData();
    fetchUserEvents();
  }, [user.id, currentUser.id]);

  const fetchUserEvents = async () => {
    setLoadingEvents(true);
    const { data, error } = await supabase
      .from('user_events')
      .select('*')
      .eq('creator_id', user.id)
      .order('event_date', { ascending: true });

    if (!error && data) {
      setUserEvents(data.map(ev => ({
        id: ev.id,
        creator_id: ev.creator_id,
        title: ev.title,
        type: ev.type as any,
        event_date: ev.event_date,
        event_time: ev.event_time,
        location: ev.location,
        description: ev.description,
        attendees: ev.attendees_count
      })));
    }
    setLoadingEvents(false);
  };

  const handleSupportEvent = async (eventId: string) => {
    const isSupported = supportedEventIds.has(eventId);
    const targetEvent = userEvents.find(ev => ev.id === eventId);

    if (isSupported) {
      const { error } = await supabase
        .from('event_supports')
        .delete()
        .eq('user_id', currentUser.id)
        .eq('event_id', eventId);

      if (!error) {
        setSupportedEventIds(prev => {
          const next = new Set(prev);
          next.delete(eventId);
          return next;
        });
        setUserEvents(prev => prev.map(ev =>
          ev.id === eventId ? { ...ev, attendees: Math.max(0, (ev.attendees || 0) - 1) } : ev
        ));
      }
    } else {
      const { error } = await supabase
        .from('event_supports')
        .insert({
          user_id: currentUser.id,
          event_id: eventId
        });

      if (!error) {
        // Enviar notificación al creador del evento
        if (targetEvent && targetEvent.creator_id !== currentUser.id) {
          await supabase.from('notifications').insert({
            user_id: targetEvent.creator_id,
            sender_id: currentUser.id,
            type: 'like', // Usamos el tipo 'like' para el icono de corazón
            content: `ha apoyado tu evento`
          });
        }

        setSupportedEventIds(prev => {
          const next = new Set(prev);
          next.add(eventId);
          return next;
        });
        setUserEvents(prev => prev.map(ev =>
          ev.id === eventId ? { ...ev, attendees: (ev.attendees || 0) + 1 } : ev
        ));
      }
    }
  };

  const bannerColor = useMemo(() => {
    const badgeCount = user.badges?.length || 0;
    const maxBadges = 10;
    const ratio = Math.min(badgeCount / maxBadges, 1);
    const r = Math.round(255 + (147 - 255) * ratio);
    const g = Math.round(255 + (98 - 255) * ratio);
    const b = Math.round(255 + (227 - 255) * ratio);
    return `rgb(${r}, ${g}, ${b})`;
  }, [user.badges]);

  const joinedDateFormatted = useMemo(() => {
    const rawDate = user.joinedDate || new Date().toISOString();
    const date = new Date(rawDate);
    const month = date.toLocaleString('es-ES', { month: 'long' });
    return `Se unió en ${month} de ${date.getFullYear()}`;
  }, [user.joinedDate]);

  const userPosts = useMemo(() => posts.filter(p => p.authorId === user.id && p.type === 'post'), [posts, user.id]);
  const userNews = useMemo(() => posts.filter(p => p.authorId === user.id && p.type === 'news'), [posts, user.id]);
  const userRepostsList = useMemo(() => posts.filter(p => repostedPostIds.includes(p.id)), [posts, user.id, repostedPostIds]);

  const handlePhotoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPhotoOptions(!showPhotoOptions);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setImageToCrop(result);
        setShowPhotoOptions(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedImage: string) => {
    onUpdateUser({ ...user, avatar: croppedImage });
    setImageToCrop(null);
  };

  const handlePromoteEventInternal = (event: CalendarEvent) => {
    if (!currentUser) return;

    let typeTag = 'Presencial';
    if (event.type === 'online_course') typeTag = 'CursoOnline';
    if (event.type === 'meeting') typeTag = 'Reunion';

    const content = `📢 ¡Os invito a participar en este evento que he organizado!\n\n${event.title}\n\nPuedes consultar todos los detalles e inscribirte aquí: https://redsocial.app/u/${event.creator_id}/e/${event.id} #Evento #${typeTag}`;

    onPromoteEvent?.({
      ...event,
      description: content
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500" onClick={() => { setShowPhotoOptions(false); }}>
      <div className="bg-white dark:bg-[#111] rounded-[2.5rem] overflow-hidden border border-gray-100 dark:border-zinc-800">
        <div
          className="h-48 relative overflow-hidden group/banner transition-all duration-700 border-b border-gray-50 dark:border-zinc-900 cursor-pointer"
          style={{ backgroundColor: bannerColor }}
          onClick={() => setIsShowStatusModalOpen(true)}
        >
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover/banner:opacity-100 transition-opacity flex items-center justify-center">
            <div className="bg-white/30 backdrop-blur-md px-6 py-2 rounded-full border border-white/40 text-white font-black text-xs uppercase tracking-widest opacity-0 group-hover/banner:opacity-100 transform translate-y-4 group-hover/banner:translate-y-0 transition-all duration-300">
              Ver estatus Novagober
            </div>
          </div>
          <div className="absolute top-4 right-6 flex items-center space-x-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/30 text-white">
            <Award size={14} className={bannerColor === 'rgb(255, 255, 255)' ? 'text-slate-400' : 'text-white'} />
            <span className={`text-[10px] font-black uppercase tracking-widest ${bannerColor === 'rgb(255, 255, 255)' ? 'text-slate-400' : 'text-white'}`}>
              Nivel de Red: {user.badges?.length || 0}/10
            </span>
          </div>
        </div>

        <div className="px-4 md:px-10 pb-8 md:pb-10">
          <div className="relative flex flex-col items-center text-center md:flex-row md:justify-between md:items-end md:text-left -mt-16 md:-mt-12 mb-8 gap-6">
            <div className="relative flex-shrink-0">
              <div className="group relative">
                <img
                  src={user.avatar}
                  className="w-32 h-32 md:w-44 md:h-44 rounded-[2rem] md:rounded-[2.5rem] border-4 md:border-8 border-white dark:border-zinc-800 object-cover transition-all cursor-pointer hover:opacity-95 active:scale-95 shadow-xl"
                  alt=""
                  onClick={handlePhotoClick}
                />
                {isCurrentUser && (
                  <div className="absolute inset-2 rounded-[2rem] bg-black/20 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity flex items-center justify-center">
                    <Camera className="text-white" size={24} />
                  </div>
                )}
              </div>

              {showPhotoOptions && (
                <>
                  <div
                    className="absolute top-full left-0 mt-3 w-64 bg-white dark:bg-[#111] rounded-2xl border border-gray-100 dark:border-zinc-800 z-[130] animate-in slide-in-from-top-2 duration-200 overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => {
                        setFullScreenImage(user.avatar);
                        setShowPhotoOptions(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-5 py-4 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-all ${isCurrentUser ? 'border-b border-gray-50 dark:border-zinc-900' : ''}`}
                    >
                      <Maximize2 size={18} className="text-blue-600" />
                      <span>Ver imagen completa</span>
                    </button>

                    {isCurrentUser && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center space-x-3 px-5 py-4 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-all"
                      >
                        <Camera size={18} className="text-indigo-600" />
                        <span>Cambiar foto de perfil</span>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
            {isCurrentUser && <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />}

            <div className="flex-1 pt-2 md:pt-0 w-full overflow-hidden">
              <div className="flex flex-col md:flex-row items-center gap-1 md:gap-3 mb-2">
                <h1 className="text-2xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight break-words max-w-full">{user.name} {user.lastName}</h1>
              </div>
              <div className="flex flex-col space-y-1.5 items-center md:items-start">
                <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 font-bold text-sm md:text-base">
                  <Briefcase size={14} className="md:w-4 md:h-4" />
                  <span className="truncate">{user.position} en {user.department}</span>
                </div>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1 text-gray-400 dark:text-zinc-500 font-medium text-[11px] md:text-sm">
                  <div className="flex items-center space-x-1.5"><MapPin size={12} className="md:w-[14px] md:h-[14px]" /><span>{user.region}, {user.country}</span></div>
                  <div className="flex items-center space-x-1.5"><Calendar size={12} className="md:w-[14px] md:h-[14px]" /><span>{joinedDateFormatted}</span></div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center md:items-end space-y-4 w-full md:w-auto">
              <div className="flex items-center justify-center md:justify-end space-x-4 sm:space-x-6 w-full px-4 md:px-0">
                <button onClick={() => setViewingUsersList('followers')} className="text-center md:text-right group">
                  <p className="text-lg md:text-xl font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors uppercase">{user.followers}</p>
                  <p className="text-[9px] md:text-[10px] text-gray-400 font-black uppercase tracking-widest">Seguidores</p>
                </button>
                <button onClick={() => setViewingUsersList('following')} className="text-center md:text-right group">
                  <p className="text-lg md:text-xl font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors uppercase">{user.following}</p>
                  <p className="text-[9px] md:text-[10px] text-gray-400 font-black uppercase tracking-widest">Siguiendo</p>
                </button>
              </div>

              <div className="flex items-center justify-center md:justify-end space-x-3 w-full">
                {isCurrentUser ? (
                  <>
                    <button onClick={() => setIsShareModalOpen(true)} className="p-3 bg-slate-50 dark:bg-zinc-900 text-slate-400 hover:text-blue-600 rounded-2xl border border-slate-100 dark:border-zinc-800 transition-all shadow-sm"><Share2 size={20} /></button>
                    <button onClick={() => setIsEditModalOpen(true)} className="flex-1 md:flex-none bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-black text-sm hover:bg-blue-700 transition-all transform active:scale-95 flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/20"><Edit3 size={18} /><span>Editar Perfil</span></button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setIsShareModalOpen(true)} className="p-3 bg-slate-50 dark:bg-zinc-900 text-slate-400 hover:text-blue-600 rounded-2xl border border-slate-100 dark:border-zinc-800 transition-all shadow-sm"><Share2 size={20} /></button>
                    <button onClick={() => onStartChat?.(user)} className="p-3 bg-slate-50 dark:bg-zinc-900 text-slate-400 hover:text-blue-600 rounded-2xl border border-slate-100 dark:border-zinc-800 transition-all shadow-sm"><MessageCircle size={20} /></button>
                    <button
                      onClick={() => onToggleFollow?.(user.id)}
                      className={`flex-1 md:flex-none px-8 py-3.5 rounded-2xl font-black text-sm transition-all transform active:scale-95 flex items-center justify-center space-x-2 ${isFollowed ? 'bg-slate-100 dark:bg-zinc-800 text-slate-500' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20'}`}
                    >
                      {isFollowed ? <UserMinus size={18} /> : <UserPlus size={18} />}
                      <span>
                        {isFollowed && isFollower ? 'Amigos' :
                          isFollowed ? 'Siguiendo' :
                            isFollower ? 'Seguir también' : 'Seguir'}
                      </span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-8 mt-4">
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-gray-400 dark:text-zinc-600 uppercase tracking-widest px-1">Biografía profesional</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed font-medium text-lg max-w-3xl whitespace-pre-wrap">{user.bio || "Sin biografía todavía."}</p>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-gray-400 dark:text-zinc-600 uppercase tracking-widest px-1">Intereses</h3>
              <div className="flex flex-wrap gap-2 items-center">
                {user.interests && user.interests.length > 0 ? (
                  user.interests.map(interest => (
                    <span key={interest} className="px-4 py-2 bg-blue-50/50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-black border border-blue-100 dark:border-blue-900/20">{interest}</span>
                  ))
                ) : (
                  <span className="text-gray-400 italic text-sm font-medium">No hay intereses seleccionados.</span>
                )}
                {isCurrentUser && (
                  <button
                    onClick={() => setIsPreferencesModalOpen(true)}
                    className="p-2 bg-slate-50 dark:bg-zinc-900 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all border border-dashed border-blue-200 dark:border-blue-800"
                    title="Añadir o cambiar intereses"
                  >
                    <Plus size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex space-x-6 md:space-x-10 border-b border-gray-100 dark:border-zinc-900 px-4 md:px-6 overflow-x-auto scrollbar-hide">
          <button onClick={() => setActiveTab('posts')} className={`pb-4 flex items-center space-x-2 transition-all relative whitespace-nowrap ${activeTab === 'posts' ? 'text-blue-600 font-black' : 'text-gray-400 font-bold hover:text-gray-600'}`}>
            <LayoutGrid size={18} />
            <span>Posts ({userPosts.length})</span>
            {activeTab === 'posts' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full animate-in slide-in-from-left-2 duration-300"></div>}
          </button>
          <button onClick={() => setActiveTab('news')} className={`pb-4 flex items-center space-x-2 transition-all relative whitespace-nowrap ${activeTab === 'news' ? 'text-orange-500 font-black' : 'text-gray-400 font-bold hover:text-gray-600'}`}>
            <Newspaper size={18} />
            <span>Noticias ({userNews.length})</span>
            {activeTab === 'news' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-500 rounded-full animate-in slide-in-from-left-2 duration-300"></div>}
          </button>
          <button onClick={() => setActiveTab('reposts')} className={`pb-4 flex items-center space-x-2 transition-all relative whitespace-nowrap ${activeTab === 'reposts' ? 'text-emerald-500 font-black' : 'text-gray-400 font-bold hover:text-gray-600'}`}>
            <Repeat size={18} />
            <span>Reposts ({userRepostsList.length})</span>
            {activeTab === 'reposts' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500 rounded-full animate-in slide-in-from-left-2 duration-300"></div>}
          </button>
          <button onClick={() => setActiveTab('events')} className={`pb-4 flex items-center space-x-2 transition-all relative whitespace-nowrap ${activeTab === 'events' ? 'text-blue-500 font-black' : 'text-gray-400 font-bold hover:text-gray-600'}`}>
            <Calendar size={18} />
            <span>Eventos {userEvents.length > 0 ? `(${userEvents.length})` : ''}</span>
            {activeTab === 'events' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-full animate-in slide-in-from-left-2 duration-300"></div>}
          </button>
          <button onClick={() => setActiveTab('badges')} className={`pb-4 flex items-center space-x-2 transition-all relative whitespace-nowrap ${activeTab === 'badges' ? 'text-purple-600 font-black' : 'text-gray-400 font-bold hover:text-gray-600'}`}>
            <Award size={18} />
            <span>Insignias ({user.badges?.length || 0})</span>
            {activeTab === 'badges' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-600 rounded-full animate-in slide-in-from-left-2 duration-300"></div>}
          </button>
        </div>

        <div className="grid gap-6">
          {activeTab === 'posts' && (
            userPosts.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-[#111] rounded-[2.5rem] border border-dashed border-slate-200 dark:border-zinc-800">
                <LayoutGrid className="mx-auto text-slate-100 dark:text-zinc-900 mb-4" size={48} />
                <p className="text-slate-400 font-bold italic">No hay posts disponibles.</p>
              </div>
            ) : userPosts.map(post => (
              <PostCard key={post.id} post={post} onLike={onLike!} onVote={onVote} onRepost={onRepost} onAddComment={onAddComment!} onDeletePost={onDeletePost} onNavigateToProfile={onNavigateToProfile} onNavigateToPost={onNavigateToPost} onPreviewImage={onPreviewImage} onOpenShare={() => { }} currentUser={currentUser} followedUserIds={new Set(isFollowed ? [user.id] : [])} followerUserIds={new Set(isFollower ? [user.id] : [])} onToggleFollow={onToggleFollow} users={users} onSearchHashtag={onSearchHashtag} onNavigateToEvent={onNavigateToEvent} />
            ))
          )}

          {activeTab === 'news' && (
            userNews.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-[#111] rounded-[2.5rem] border border-dashed border-slate-200 dark:border-zinc-800">
                <Newspaper className="mx-auto text-slate-100 dark:text-zinc-900 mb-4" size={48} />
                <p className="text-slate-400 font-bold italic">No hay noticias registradas.</p>
              </div>
            ) : userNews.map(news => (
              <NewsCard key={news.id} post={news} onVote={onVote!} onRepost={onRepost} onAddComment={onAddComment!} currentUser={currentUser} followedUserIds={new Set(isFollowed ? [user.id] : [])} users={users} onNavigateToProfile={onNavigateToProfile} onNavigateToPost={onNavigateToPost} onPreviewImage={onPreviewImage} onSearchHashtag={onSearchHashtag} />
            ))
          )}

          {activeTab === 'reposts' && (
            userRepostsList.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-[#111] rounded-[2.5rem] border border-dashed border-slate-200 dark:border-zinc-800">
                <Repeat className="mx-auto text-slate-100 dark:text-zinc-900 mb-4" size={48} />
                <p className="text-slate-400 font-bold italic">No hay republicaciones aún.</p>
              </div>
            ) : userRepostsList.map(post => (
              <PostCard key={`repost-${post.id}`} post={post} onLike={onLike!} onVote={onVote} onRepost={onRepost} onAddComment={onAddComment!} onDeletePost={onDeletePost} onNavigateToProfile={onNavigateToProfile} onNavigateToPost={onNavigateToPost} onPreviewImage={onPreviewImage} onOpenShare={() => { }} currentUser={currentUser} followedUserIds={new Set(isFollowed ? [user.id] : [])} followerUserIds={new Set(isFollower ? [user.id] : [])} onToggleFollow={onToggleFollow} users={users} onSearchHashtag={onSearchHashtag} onNavigateToEvent={onNavigateToEvent} showMenu={isCurrentUser && activeTab === 'posts'} />
            ))
          )}

          {activeTab === 'events' && (
            userEvents.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-[#111] rounded-[2.5rem] border border-dashed border-slate-200 dark:border-zinc-800 px-10">
                {loadingEvents ? (
                  <Loader2 className="animate-spin text-blue-600 mx-auto" size={40} />
                ) : (
                  <>
                    <div className="mx-auto w-16 h-16 bg-blue-50 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                      <Calendar className="text-blue-500" size={32} />
                    </div>
                    <h4 className="text-slate-900 dark:text-white font-black mb-2">No hay eventos organizados</h4>
                    <p className="text-slate-400 font-medium text-sm italic mb-8">
                      {isCurrentUser
                        ? "Aún no has organizado ningún evento. ¡Sé el promotor del cambio en tu administración!"
                        : "Este usuario aún no ha organizado ningún evento público."}
                    </p>
                    {isCurrentUser && (
                      <button onClick={() => setIsCreateEventModalOpen(true)} className="inline-flex items-center space-x-2 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all transform active:scale-95">
                        <Plus size={20} />
                        <span>Crear Evento</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between px-4">
                  <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">Eventos Organizados</h4>
                  {isCurrentUser && (
                    <button onClick={() => setIsCreateEventModalOpen(true)} className="text-blue-600 text-xs font-black uppercase hover:underline flex items-center space-x-1">
                      <Plus size={14} />
                      <span>Nuevo Evento</span>
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userEvents.map(event => {
                    const isFocused = focusedEventId === event.id;
                    return (
                      <div
                        key={event.id}
                        id={`event-${event.id}`}
                        className={`bg-white dark:bg-[#111] p-6 rounded-[2.5rem] border transition-all group animate-in slide-in-from-bottom-2 relative ${isFocused
                          ? 'border-emerald-500 ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-black scale-[1.02]'
                          : 'border-gray-100 dark:border-zinc-800'
                          }`}
                      >
                        {isFocused && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                            Evento Seleccionado
                          </div>
                        )}
                        <div className="flex justify-between items-start mb-4 pr-12">
                          <h4 className="text-gray-900 dark:text-white font-black text-lg leading-tight group-hover:text-blue-600 transition-colors">
                            {event.title}
                          </h4>
                          {(event.attendees || 0) >= 2 && (
                            <div className="p-1 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-full" title="Evento validado para el calendario global">
                              <CheckCircle2 size={18} />
                            </div>
                          )}
                        </div>
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-xs text-gray-500 font-medium">
                            <Calendar size={14} className="mr-2 opacity-50" />
                            <span>{new Date(event.event_date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center text-xs text-gray-500 font-medium">
                            <Clock size={14} className="mr-2 opacity-50" />
                            <span>{event.event_time.substring(0, 5)}h</span>
                          </div>
                          <div className="flex items-center text-xs text-gray-500 font-medium">
                            <MapPin size={14} className="mr-2 opacity-50" />
                            <span className="truncate">{event.location}</span>
                          </div>
                          <div className="flex items-center text-xs text-blue-600 font-bold">
                            <Users size={14} className="mr-2" />
                            <span>{event.attendees || 0} apoyos {(event.attendees || 0) < 2 && `(faltan ${2 - (event.attendees || 0)} para calendario)`}</span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2 mb-4 leading-relaxed italic">
                          {event.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 mb-4 px-1">
                          <button
                            onClick={() => handleSupportEvent(event.id)}
                            className={`flex items-center space-x-1.5 font-black text-[10px] uppercase tracking-widest transition-all ${supportedEventIds.has(event.id)
                              ? 'text-red-500 fill-red-500'
                              : 'text-blue-600 dark:text-blue-400 hover:opacity-70'
                              }`}
                          >
                            <Heart size={14} fill={supportedEventIds.has(event.id) ? "currentColor" : "none"} />
                            <span>{supportedEventIds.has(event.id) ? 'Apoyado' : 'Apoyar'}</span>
                          </button>
                        </div>

                        <button
                          onClick={() => handlePromoteEventInternal(event)}
                          className="w-full py-3 bg-blue-600 text-white rounded-xl text-xs font-black hover:bg-blue-700 transition-all flex items-center justify-center space-x-2 transform active:scale-95"
                        >
                          <Megaphone size={14} />
                          <span>Promocionar evento</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          )}

          {activeTab === 'badges' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(!user.badges || user.badges.length === 0) ? (
                <div className="col-span-full text-center py-20 bg-white dark:bg-[#111] rounded-[2.5rem] border border-dashed border-slate-200 dark:border-zinc-800">
                  <Award className="mx-auto text-slate-100 dark:text-zinc-900 mb-4" size={48} />
                  <p className="text-slate-400 font-bold italic">Aún no has conseguido insignias.</p>
                  <p className="text-xs text-slate-400 mt-2">Participa en la comunidad para desbloquear reconocimientos.</p>
                </div>
              ) : (
                user.badges.map(badge => (
                  <div key={badge.id} className="bg-white dark:bg-[#111] p-6 rounded-[2rem] border border-gray-100 dark:border-zinc-800 flex items-center space-x-4">
                    <div className={`p-4 rounded-2xl ${badge.color || 'bg-purple-50 text-purple-600'} dark:bg-opacity-10`}>
                      <Award size={32} />
                    </div>
                    <div>
                      <h4 className="font-black text-gray-900 dark:text-white">{badge.label}</h4>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Logro verificado</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {isEditModalOpen && <EditProfileModal user={user} onClose={() => setIsEditModalOpen(false)} onSave={onUpdateUser} />}
      {isPreferencesModalOpen && <PreferencesModal user={user} onClose={() => setIsPreferencesModalOpen(false)} onSave={onUpdateUser} />}
      {isShareModalOpen && (
        <ShareModal
          user={user}
          onClose={() => setIsShareModalOpen(false)}
          onShare={onShareViaChat}
          users={users}
          followerUserIds={followerUserIds}
          followedUserIds={followedUserIds}
          currentUser={currentUser}
        />
      )}
      {viewingUsersList && <UsersListModal type={viewingUsersList} userId={user.id} onClose={() => setViewingUsersList(null)} onNavigate={(id) => onNavigateToProfile?.(id)} />}
      {isCreateEventModalOpen && <CreateEventModal userId={currentUser.id} onClose={() => setIsCreateEventModalOpen(false)} onSave={fetchUserEvents} onAddPost={onAddPost} />}
      {isShowStatusModalOpen && <NovagoberStatusModal user={user} onClose={() => setIsShowStatusModalOpen(false)} />}

      {fullScreenImage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300 cursor-pointer" onClick={() => setFullScreenImage(null)}>
          <button onClick={() => setFullScreenImage(null)} className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all border border-white/10 z-10"><X size={24} /></button>
          <img src={fullScreenImage} className="max-w-full max-h-[90vh] rounded-[3rem] object-contain animate-in zoom-in-95 duration-300 border-4 border-white/5" alt="Profile Preview" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {imageToCrop && (
        <ImageCropModal image={imageToCrop} onClose={() => setImageToCrop(null)} onSave={handleCropComplete} />
      )}
    </div>
  );
};
