
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useScrollLock } from '../hooks/useScrollLock';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Post, CalendarEvent, Chat, BADGE_CATALOG, calculateNovas } from '../types';
import { Briefcase, MapPin, Share2, Edit3, Calendar, LayoutGrid, Newspaper, UserPlus, UserMinus, Camera, MessageCircle, Plus, Award, Maximize2, X, Check, Palette, Repeat, Clock, Users, ChevronRight, Sparkles, AlignLeft, Save, Loader2, Heart, CheckCircle2, Megaphone, Trophy, Target, Zap, Crown, Star, Medal, BadgeCheck } from 'lucide-react';
import { RankingHistoryModal } from './RankingHistoryModal';
import { PreferencesModal } from './PreferencesModal';
import { ShareModal } from './ShareModal';
import { UsersListModal } from './UsersListModal';
import { PostCard } from './PostCard';
import { NewsCard } from './NewsCard';
import { ImageCropModal } from './ImageCropModal';
import { LevelsListModal } from './LevelsListModal';
import { getLevelInfo } from '../utils/gamificationUtils';
import { supabase } from '../supabaseClient';
import { Language, useTranslation } from '../utils/translations';

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
  globalEvents?: any[];
  language: Language;
  pinnedPosts?: Set<string>;
  onTogglePin?: (postId: string) => void;
}
// ... (skip down to ShareModal usage) -> Actually I need to split this into two chunks (Interface and Usage) or use multi_replace.
// Since they are far apart, I'll use multi_replace.

// getStatusInfo logic removed and replaced by getLevelInfo from utils

const NovagoberStatusModal: React.FC<{ user: User, onClose: () => void, language: Language }> = ({ user, onClose, language }) => {
  const navigate = useNavigate();
  const t = useTranslation(language);
  const novas = user.novas ?? calculateNovas(user.badges || []);
  const status = getLevelInfo(novas, language);
  useScrollLock();
  const StatusIcon = status.icon;
  const progress = status.nextThreshold
    ? Math.min(100, Math.max(0, ((novas - status.threshold) / (status.nextThreshold - status.threshold)) * 100))
    : 100;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
      <div className="bg-white dark:bg-[#0a0a0a] w-full max-w-md rounded-[3rem] overflow-hidden animate-in zoom-in-95 duration-300 border border-white dark:border-zinc-800" onClick={(e) => e.stopPropagation()}>
        <div className="p-10 text-center space-y-6">
          <div className={`mx-auto w-24 h-24 ${status.bg} ${status.color} rounded-[2rem] flex items-center justify-center`}>
            <StatusIcon size={40} />
          </div>

          <div>
            <h3 className={`text-3xl font-black ${status.color} tracking-tight`}>{status.rank}</h3>
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-2">{t('influence_level')}</p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-end px-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{novas} Novas</span>
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{t('level_label', { level: status.level })}</span>
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
              onClick={() => {
                navigate('/store');
                onClose();
              }}
              className="w-full py-4 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-gray-400 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all active:scale-95"
            >
              {t('rewards')}
            </button>
          </div>
        </div>
      </div>
    </div >,
    document.body
  );
};

const CreateEventModal: React.FC<{
  userId: string,
  onClose: () => void,
  onSave: () => void,
  onAddPost?: (content: string, type: 'post' | 'news', tags: string[], imageUrl?: string, docUrl?: string, docName?: string, linkedEventId?: string) => void,
  language: Language
}> = ({ userId, onClose, onSave, onAddPost, language }) => {
  const [loading, setLoading] = useState(false);
  const t = useTranslation(language);
  const [formData, setFormData] = useState({
    title: '',
    type: 'physical' as 'physical' | 'online',
    date: '',
    time: '',
    location: '',
    description: ''
  });
  useScrollLock();

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
        let typeTag = language === 'es' ? 'Presencial' : 'Physical';
        if (formData.type === 'online') typeTag = language === 'es' ? 'Online' : 'Online';

        await onAddPost(
          t('event_promoted_msg', { title: formData.title }),
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

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
      <div className="bg-white dark:bg-[#0a0a0a] w-full max-w-lg max-h-[85vh] flex flex-col rounded-[2.5rem] overflow-hidden animate-in zoom-in-95 duration-300 border border-white dark:border-zinc-800" onClick={(e) => e.stopPropagation()}>
        <div className="px-8 py-6 border-b border-slate-50 dark:border-zinc-900 flex justify-between items-center bg-white dark:bg-[#0a0a0a] sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-2xl">
              <Calendar size={20} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">{t('organize_event')}</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">{t('event_details_desc')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 dark:hover:bg-zinc-900 rounded-full text-slate-400 transition-all"><X size={24} /></button>
        </div>

        <form onSubmit={(e) => e.preventDefault()} className="p-8 space-y-5 overflow-y-auto custom-scrollbar">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">{t('event_title_label')}</label>
            <input
              required
              type="text"
              maxLength={25}
              placeholder="Ej. Taller de Innovación Abierta"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-5 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50 dark:text-white transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">{t('event_type_label')}</label>
            <select
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value as 'physical' | 'online' })}
              className="w-full px-5 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50 dark:text-white transition-all appearance-none"
            >
              <option value="physical">{t('event_physical')}</option>
              <option value="online">{t('event_online')}</option>
            </select>
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
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, false)}
                disabled={loading || !formData.title || !formData.date || !formData.time}
                className="flex-[1.5] py-4 border-2 border-blue-600 text-blue-600 dark:text-blue-400 rounded-2xl font-black text-sm hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all flex items-center justify-center space-x-2 transform active:scale-95 disabled:opacity-50"
              >
                <Check size={18} />
                <span>{t('publish')}</span>
              </button>
            </div>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              disabled={loading || !formData.title || !formData.date || !formData.time}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all flex items-center justify-center space-x-2 transform active:scale-95 disabled:opacity-50"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <><Megaphone size={18} /><span>{t('publish_and_promote')}</span></>}
            </button>
            <p className="text-[10px] text-center text-slate-400 font-bold px-4">
              {t('promote_desc')}
            </p>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export const ProfileView: React.FC<ProfileViewProps> = ({
  user, isCurrentUser, isFollowed, isFollower, onToggleFollow, onStartChat, posts,
  onUpdateUser, onDeletePost, onNavigateToProfile, onNavigateToPost, onPreviewImage, currentUser, onLike, onVote, onRepost, onAddComment, users, onSearchHashtag, onNavigateToEvent, focusedEventId, onClearFocusedEvent, onAddPost, onPromoteEvent, chats = [], followerUserIds = new Set(), followedUserIds = new Set(), onShareViaChat, globalEvents = [], language,
  pinnedPosts = new Set(), onTogglePin
}) => {
  const navigate = useNavigate();
  const t = useTranslation(language);
  const [isPreferencesModalOpen, setIsPreferencesModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [isShowStatusModalOpen, setIsShowStatusModalOpen] = useState(false);
  const [viewingUsersList, setViewingUsersList] = useState<'followers' | 'following' | 'event-supporters' | null>(null);
  const [viewingListId, setViewingListId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [repostedPostIds, setRepostedPostIds] = useState<string[]>([]);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [userEvents, setUserEvents] = useState<CalendarEvent[]>([]);
  const [supportedEventIds, setSupportedEventIds] = useState<Set<string>>(new Set());
  const [sharingEvent, setSharingEvent] = useState<CalendarEvent | null>(null);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [showRankingModal, setShowRankingModal] = useState(false);
  const [showLevelsModal, setShowLevelsModal] = useState(false);
  const [dbBadges, setDbBadges] = useState<{ id: string, created_at?: string }[]>([]);
  const [rankingHistory, setRankingHistory] = useState<{ id: string, badge_id: string, created_at: string }[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persistence Logic for Profile
  const location = useLocation();

  useEffect(() => {
    if (location.state) {
      if (location.state.tab) {
        setActiveTab(location.state.tab);
      }
      if (location.state.openRanking) {
        setShowRankingModal(true);
      }
      // Clear state to avoid reopening on refresh? 
      // difficult in react-router without replacing history. 
      // For now, it's fine.
    }
  }, [location.state]);

  useEffect(() => {
    const tabKey = `profile_tab_${user.id}`;

    // If we have location state, skip session storage restoration for tab
    if (!location.state?.tab) {
      const savedTab = sessionStorage.getItem(tabKey) as ProfileTab;
      if (savedTab) setActiveTab(savedTab);
    }
  }, [user.id, location.state]);



  useEffect(() => {
    sessionStorage.setItem(`profile_tab_${user.id}`, activeTab);
  }, [activeTab, user.id]);

  useEffect(() => {
    if (focusedEventId && userEvents.length > 0) {
      setActiveTab('events');
      // Delay slightly to ensure rendering
      setTimeout(() => {
        const element = document.getElementById(`event-${focusedEventId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);

      const timer = setTimeout(() => {
        onClearFocusedEvent?.();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [focusedEventId, userEvents]);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: reposts } = await supabase
        .from('reposts')
        .select('post_id, news_id')
        .eq('user_id', user.id);

      if (reposts) {
        const ids = new Set<string>();
        reposts.forEach(r => {
          if (r.post_id) ids.add(r.post_id);
          if (r.news_id) ids.add(r.news_id);
        });
        setRepostedPostIds(Array.from(ids));
      }

      const { data: userBadges } = await supabase
        .from('user_badges')
        .select('badge_id, created_at')
        .eq('user_id', user.id);

      if (userBadges) {
        setDbBadges(userBadges.map(b => ({ id: b.badge_id, created_at: b.created_at })));
      }

      const { data: rankHistory } = await supabase
        .from('ranking_history')
        .select('*')
        .eq('user_id', user.id);

      if (rankHistory) {
        setRankingHistory(rankHistory);
      }

      const { data: supports } = await supabase
        .from('event_supports')
        .select('event_id')
        .eq('user_id', currentUser.id);

      if (supports) setSupportedEventIds(new Set(supports.map(s => s.event_id)));
    };

    fetchUserData();
    fetchUserEvents();
    fetchCommonFollowers();
  }, [user.id, currentUser.id, followedUserIds]);

  const [commonFollowers, setCommonFollowers] = useState<any[]>([]);

  const fetchCommonFollowers = async () => {
    // 1. Fetch followers of THIS profile (up to 50 to get a good sample)
    const { data } = await supabase
      .from('follows')
      .select('follower_id, profiles!follower_id(id, avatar)')
      .eq('followed_id', user.id)
      .neq('follower_id', currentUser.id)
      .limit(50); // Increased limit to find mutuals

    if (data) {
      // 2. Filter: Keep only those who I FOLLOW (Mutuals)
      // "Seguido por... [Personas que YO sigo] y que siguen a [Este Perfil]"
      const mutuals = data
        .map((d: any) => ({
          id: d.profiles.id,
          avatar: d.profiles.avatar
        }))
        .filter((follower: any) => followedUserIds.has(follower.id));

      setCommonFollowers(mutuals.slice(0, 3));
    }
  };



  const fetchUserEvents = async () => {
    setLoadingEvents(true);
    const { data, error } = await supabase
      .from('user_events')
      .select('*')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setUserEvents(data.map(ev => ({
        id: ev.id,
        creator_id: ev.creator_id,
        title: ev.title,
        type: (ev.type === 'online_course' || ev.type === 'meeting') ? 'online' : ev.type,
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

  const novas = useMemo(() => {
    if (user.novas !== undefined && user.novas !== null) return user.novas;

    const combinedBadges = [
      ...dbBadges.map(b => ({ id: b.id })),
      ...rankingHistory.map(rh => ({ id: rh.badge_id }))
    ];

    // If we have fetched DB data, use it. Otherwise fallback to user.badges (if any)
    if (dbBadges.length > 0 || rankingHistory.length > 0) {
      return calculateNovas(combinedBadges.length > 0 ? combinedBadges : (user.badges || []));
    }

    return calculateNovas(user.badges || []);
  }, [user.novas, user.badges, dbBadges, rankingHistory]);

  const status = useMemo(() => getLevelInfo(novas, language), [novas, language]);

  const bannerStyle = useMemo(() => {
    // Gold gradient only for levels HIGHER than 10 (if any)
    if (status.level > 10) {
      return {
        background: 'linear-gradient(135deg, #bf953f 0%, #fcf6ba 25%, #b38728 50%, #fbf5b7 75%, #aa771c 100%)',
        border: '4px solid #000000',
        borderTopLeftRadius: 'inherit',
        borderTopRightRadius: 'inherit',
        boxShadow: 'inset 0 0 15px rgba(0,0,0,0.1)'
      };
    }
    // Level colors now come from status.currentLevelInfo (LEVELS array)
    return {
      backgroundColor: status.currentLevelInfo.bannerColor,
      borderBottom: '1px solid currentColor',
      borderColor: 'rgba(0,0,0,0.05)'
    };
  }, [status.level, status.currentLevelInfo.bannerColor]);

  const joinedDateFormatted = useMemo(() => {
    const rawDate = user.joinedDate || new Date().toISOString();
    const date = new Date(rawDate);
    const month = date.toLocaleString(language === 'es' ? 'es-ES' : 'en-US', { month: 'long' });
    return t('joined_date', { month, year: date.getFullYear() });
  }, [user.joinedDate, language, t]);

  const userPosts = useMemo(() => {
    const filtered = posts.filter(p => p.authorId === user.id && p.type === 'post');
    return filtered.sort((a, b) => {
      const aPinned = pinnedPosts.has(a.id);
      const bPinned = pinnedPosts.has(b.id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return 0;
    });
  }, [posts, user.id, pinnedPosts]);

  const userNews = useMemo(() => posts.filter(p => p.authorId === user.id && p.type === 'news'), [posts, user.id]);

  const userRepostsList = useMemo(() => {
    const filtered = posts.filter(p => repostedPostIds.includes(p.id));
    return filtered.sort((a, b) => {
      const aPinned = pinnedPosts.has(a.id);
      const bPinned = pinnedPosts.has(b.id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return 0;
    });
  }, [posts, user.id, repostedPostIds, pinnedPosts]);

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
    if ((event.type as any) === 'online' || (event.type as any) === 'online_course') typeTag = 'Online';

    const content = `📢 ¡Os invito a participar en este evento que he organizado!\n\n${event.title}\n\n#Evento #${typeTag}`;

    onPromoteEvent?.({
      ...event,
      description: content
    });
  };

  return (
    <div className="max-w-4xl xl:max-w-5xl mx-auto space-y-4 md:space-y-6 pb-12 animate-in fade-in duration-500" onClick={() => { setShowPhotoOptions(false); }}>
      <div className="bg-white dark:bg-[#111] rounded-[2rem] md:rounded-[2.5rem] overflow-hidden border border-gray-100 dark:border-zinc-800 relative z-0">
        <div
          className="h-20 md:h-48 relative overflow-hidden group/banner transition-all duration-700 cursor-pointer"
          style={bannerStyle}
          onClick={() => setShowLevelsModal(true)}
        >
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover/banner:opacity-100 transition-opacity flex items-center justify-center">
            <div className="bg-white/30 backdrop-blur-md px-6 py-2 rounded-full border border-white/40 text-slate-900 font-black text-xs uppercase tracking-widest opacity-0 group-hover/banner:opacity-100 transform translate-y-4 group-hover/banner:translate-y-0 transition-all duration-300">
              Ver estatus Novagober
            </div>
          </div>
          <div className="absolute top-4 right-6 flex items-center space-x-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/30 text-slate-900">
            <Award size={14} className="text-slate-900" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">
              {user.level_name || status.rank}
            </span>
          </div>
        </div>

        <div className="px-4 md:px-10 pb-6 md:pb-10">
          <div className="relative flex flex-col items-center text-center md:flex-row md:justify-between md:items-end md:text-left -mt-6 md:-mt-4 mb-4 md:mb-8 gap-3 md:gap-6">
            <div className="relative flex-shrink-0">
              <div className="group relative">
                <img
                  src={user.avatar}
                  className="w-20 h-20 md:w-44 md:h-44 rounded-2xl md:rounded-[2.5rem] border-4 md:border-8 border-white dark:border-zinc-800 object-cover transition-all cursor-pointer hover:opacity-95 active:scale-95"
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
                      <span>{t('view_full_image')}</span>
                    </button>

                    {isCurrentUser && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center space-x-3 px-5 py-4 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-all"
                      >
                        <Camera size={18} className="text-indigo-600" />
                        <span>{t('change_profile_photo')}</span>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
            {isCurrentUser && <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />}

            <div className="flex-1 pt-1 md:pt-0 w-full min-w-0 text-center md:text-left relative z-20">
              <div className="flex flex-col md:flex-row items-center gap-1 md:gap-3 mb-0.5 md:mb-2 justify-center md:justify-start">
                <h1 className="text-lg md:text-4xl font-black text-gray-900 dark:text-white tracking-tight leading-tight flex flex-wrap items-center gap-1.5 relative z-20 justify-center md:justify-start text-center md:text-left">
                  {user.name} {user.lastName}
                  {user.username === 'novagob' && (
                    <BadgeCheck className="w-5 h-5 md:w-8 md:h-8 text-white fill-blue-500 shrink-0" />
                  )}
                </h1>
              </div>
              <div className="flex flex-col space-y-1 items-center md:items-start">
                {!user.isOrganization && (
                  <div className="flex items-start md:items-center space-x-2 text-blue-600 dark:text-blue-400 font-bold text-xs md:text-base flex-wrap justify-center md:justify-start w-full">
                    <span className="break-words max-w-full leading-tight">{user.position} {user.username === 'novagob' ? 'de' : 'en'} {user.department}</span>
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-3 gap-y-1 text-gray-400 dark:text-zinc-500 font-medium text-[10px] md:text-sm w-full">
                  {user.username !== 'novagob' && (
                    <div className="flex items-center space-x-1 shrink-0"><MapPin size={10} className="md:w-[14px] md:h-[14px]" /><span>{user.region}, {user.country}</span></div>
                  )}
                  <div className="flex items-center space-x-1 shrink-0"><Calendar size={10} className="md:w-[14px] md:h-[14px]" /><span>{user.username === 'novagob' ? "Se unió en enero de 2026" : joinedDateFormatted}</span></div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center md:items-end space-y-3 md:space-y-4 w-full md:w-auto mt-2 md:mt-0">
              <div className="flex items-center justify-center md:justify-end space-x-6 w-full px-4 md:px-0">
                <button onClick={() => setViewingUsersList('followers')} className="text-center md:text-right group">
                  <p className="text-base md:text-xl font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors uppercase">{user.followers}</p>
                  <p className="text-[8px] md:text-[10px] text-gray-400 font-black uppercase tracking-widest">{t('followers')}</p>
                </button>
                <button onClick={() => setViewingUsersList('following')} className="text-center md:text-right group">
                  <p className="text-base md:text-xl font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors uppercase">{user.following}</p>
                  <p className="text-[8px] md:text-[10px] text-gray-400 font-black uppercase tracking-widest">{t('following_label')}</p>
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 md:gap-3 w-full mt-4 md:mt-0">
                {isCurrentUser ? (
                  <>
                    <button onClick={() => setIsShareModalOpen(true)} className="bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-zinc-700 px-3 py-2 md:px-4 md:py-2 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all transform active:scale-95 flex items-center justify-center min-w-fit whitespace-nowrap"><Share2 size={12} className="md:w-[14px] md:h-[14px]" /></button>
                    <button onClick={() => navigate('/settings', { state: { openPersonalData: true } })} className="bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-zinc-700 px-3 py-2 md:px-4 md:py-2 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all transform active:scale-95 flex items-center justify-center space-x-2 min-w-fit md:min-w-[120px] whitespace-nowrap"><Edit3 size={12} className="md:w-[14px] md:h-[14px]" /><span>{t('edit_profile')}</span></button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setIsShareModalOpen(true)} className="p-2 md:p-3 bg-slate-50 dark:bg-zinc-900 text-slate-400 hover:text-blue-600 rounded-xl md:rounded-2xl border border-slate-100 dark:border-zinc-800 transition-all shrink-0"><Share2 size={16} className="md:w-5 md:h-5" /></button>
                    <button onClick={() => onStartChat?.(user)} className="p-2 md:p-3 bg-slate-50 dark:bg-zinc-900 text-slate-400 hover:text-blue-600 rounded-xl md:rounded-2xl border border-slate-100 dark:border-zinc-800 transition-all shrink-0"><MessageCircle size={16} className="md:w-5 md:h-5" /></button>
                    <button
                      onClick={() => onToggleFollow?.(user.id)}
                      className={`px-3 py-2 md:px-6 md:py-3 rounded-xl md:rounded-2xl font-black text-[10px] md:text-sm transition-all transform active:scale-95 flex items-center justify-center space-x-2 min-w-fit md:min-w-[140px] whitespace-nowrap ${isFollowed && isFollower ? 'bg-green-50 dark:bg-green-900/20 text-green-600' : isFollowed ? 'bg-slate-100 dark:bg-zinc-800 text-slate-500' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                    >
                      {isFollowed && isFollower ? <Check size={12} className="md:w-[18px] md:h-[18px]" /> : isFollowed ? <UserMinus size={12} className="md:w-[18px] md:h-[18px]" /> : <UserPlus size={12} className="md:w-[18px] md:h-[18px]" />}
                      <span>
                        {isFollowed && isFollower ? t('friends') :
                          isFollowed ? t('following_label') :
                            isFollower ? t('follow_also') : t('follow')}
                      </span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6 mt-2">
            <div className="space-y-3 flex flex-col items-center md:items-start text-center md:text-left w-full min-w-0">
              <h3 className="text-[9px] md:text-[10px] font-black text-gray-400 dark:text-zinc-600 uppercase tracking-widest px-1">{t('professional_bio')}</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed font-medium text-sm md:text-lg max-w-full whitespace-pre-wrap break-words">{user.bio || t('no_bio')}</p>
            </div>




            {commonFollowers.length > 0 && !isCurrentUser && (
              <div
                className="space-y-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-900/50 p-3 -mx-3 rounded-2xl transition-all"
                onClick={() => setViewingUsersList('followers')}
              >

                <div className="flex items-center justify-center md:justify-start space-x-3">
                  <div className="flex -space-x-3">
                    {commonFollowers.map((follower) => (
                      <img
                        key={follower.id}
                        src={follower.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${follower.id}`}
                        className="w-8 h-8 rounded-full border-2 border-white dark:border-[#111] object-cover"
                        alt=""
                        title="Seguido por..."
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-zinc-500 font-bold">
                    {commonFollowers.length === 1 ? t('common_connections_singular') : t('common_connections_plural', { count: commonFollowers.length })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4 md:space-y-6 mx-0">
        <div className="bg-white dark:bg-[#111] rounded-[1.5rem] md:rounded-[2rem] border border-gray-100 dark:border-zinc-800 p-1.5 md:p-2 flex space-x-1 md:space-x-4 overflow-x-auto scrollbar-hide">
          <button onClick={() => setActiveTab('posts')} className={`flex-1 min-w-fit px-4 py-3 rounded-2xl flex items-center justify-center space-x-2 transition-all ${activeTab === 'posts' ? 'bg-blue-50 dark:bg-blue-900/10 text-blue-600' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-900 hover:text-gray-600'}`}>
            <LayoutGrid size={18} />
            <span className="font-bold text-sm">{t('posts')} ({userPosts.length})</span>
          </button>

          <button onClick={() => setActiveTab('news')} className={`flex-1 min-w-fit px-4 py-3 rounded-2xl flex items-center justify-center space-x-2 transition-all ${activeTab === 'news' ? 'bg-orange-50 dark:bg-orange-900/10 text-orange-500' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-900 hover:text-gray-600'}`}>
            <Newspaper size={18} />
            <span className="font-bold text-sm">{t('news')} ({userNews.length})</span>
          </button>

          <button onClick={() => setActiveTab('reposts')} className={`flex-1 min-w-fit px-4 py-3 rounded-2xl flex items-center justify-center space-x-2 transition-all ${activeTab === 'reposts' ? 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-500' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-900 hover:text-gray-600'}`}>
            <Repeat size={18} />
            <span className="font-bold text-sm">{t('reposts')} ({userRepostsList.length})</span>
          </button>

          <button onClick={() => setActiveTab('events')} className={`flex-1 min-w-fit px-4 py-3 rounded-2xl flex items-center justify-center space-x-2 transition-all ${activeTab === 'events' ? 'bg-blue-50 dark:bg-blue-900/10 text-blue-500' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-900 hover:text-gray-600'}`}>
            <Calendar size={18} />
            <span className="font-bold text-sm">{t('calendar')} {userEvents.length > 0 ? `(${userEvents.length})` : ''}</span>
          </button>

          <button onClick={() => setActiveTab('badges')} className={`flex-1 min-w-fit px-4 py-3 rounded-2xl flex items-center justify-center space-x-2 transition-all ${activeTab === 'badges' ? 'bg-yellow-50 dark:bg-yellow-900/10 text-yellow-600' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-900 hover:text-gray-600'}`}>
            <Medal size={18} />
            <span className="font-bold text-sm">{t('badges_label')} ({dbBadges.length > 0 ? dbBadges.filter((b: any) => !BADGE_CATALOG.find(c => c.id === b.id && c.category === 'ranking')).length : (user.badges ? user.badges.filter((b: any) => !BADGE_CATALOG.find(c => c.id === b.id && c.category === 'ranking')).length : 0)})</span>
          </button>
        </div>

        <div className="grid gap-6">
          {activeTab === 'posts' && (
            userPosts.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-[#111] rounded-[2.5rem] border border-dashed border-slate-200 dark:border-zinc-800">
                <LayoutGrid className="mx-auto text-slate-100 dark:text-zinc-900 mb-4" size={48} />
                <p className="text-slate-400 font-bold italic">{t('no_posts')}</p>
              </div>
            ) : userPosts.map(post => (
              <PostCard key={post.id} post={post} onLike={onLike!} onVote={onVote} onRepost={onRepost} onAddComment={onAddComment!} onDeletePost={onDeletePost} onNavigateToProfile={onNavigateToProfile} onNavigateToPost={onNavigateToPost} onPreviewImage={onPreviewImage} onOpenShare={() => { }} currentUser={currentUser} followedUserIds={new Set(isFollowed ? [user.id] : [])} followerUserIds={new Set(isFollower ? [user.id] : [])} onToggleFollow={onToggleFollow} users={users} onSearchHashtag={onSearchHashtag} onNavigateToEvent={onNavigateToEvent} showMenu={isCurrentUser && activeTab === 'posts'} globalEvents={globalEvents} isPinned={pinnedPosts.has(post.id)} onTogglePin={onTogglePin} />
            ))
          )}

          {activeTab === 'news' && (
            <>
              <div className="mb-6">
                <button
                  onClick={() => setShowRankingModal(true)}
                  className="w-full bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-4 rounded-2xl border border-yellow-100 dark:border-yellow-900/30 flex items-center justify-between group transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/40 rounded-xl text-yellow-600 dark:text-yellow-400">
                      <Trophy size={20} />
                    </div>
                    <div className="text-left">
                      <span className="block font-black text-yellow-700 dark:text-yellow-500 uppercase tracking-widest text-sm flex items-center">
                        {t('weekly_ranking_top')}
                        <Clock className="ml-2 opacity-60" size={14} />
                      </span>
                      <span className="text-[10px] text-yellow-600/70 dark:text-yellow-500/50 font-bold uppercase tracking-wide">
                        {t('view_badge_history')}
                      </span>
                    </div>
                  </div>
                  <div className="transform group-hover:translate-x-1 transition-transform duration-300">
                    <ChevronRight className="text-yellow-600/50" size={20} />
                  </div>
                </button>
              </div>

              {userNews.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-[#111] rounded-[2.5rem] border border-dashed border-slate-200 dark:border-zinc-800">
                  <Newspaper className="mx-auto text-slate-100 dark:text-zinc-900 mb-4" size={48} />
                  <p className="text-slate-400 font-bold italic">{t('no_news_registered')}</p>
                </div>
              ) : (
                userNews.map(news => (
                  <NewsCard key={news.id} post={news} onVote={onVote!} onRepost={onRepost} onAddComment={onAddComment!} currentUser={currentUser} followedUserIds={new Set(isFollowed ? [user.id] : [])} users={users} onNavigateToProfile={onNavigateToProfile} onNavigateToPost={onNavigateToPost} onPreviewImage={onPreviewImage} onSearchHashtag={onSearchHashtag} language={language} />
                ))
              )}
            </>
          )}

          {activeTab === 'reposts' && (
            userRepostsList.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-[#111] rounded-[2.5rem] border border-dashed border-slate-200 dark:border-zinc-800">
                <Repeat className="mx-auto text-slate-100 dark:text-zinc-900 mb-4" size={48} />
                <p className="text-slate-400 font-bold italic">{t('no_reposts')}</p>
              </div>
            ) : userRepostsList.map(post => {
              if (post.type === 'news') {
                return <NewsCard key={`repost-${post.id}`} post={post} onVote={onVote!} onRepost={onRepost} onAddComment={onAddComment!} currentUser={currentUser} followedUserIds={new Set(isFollowed ? [user.id] : [])} users={users} onNavigateToProfile={onNavigateToProfile} onNavigateToPost={onNavigateToPost} onPreviewImage={onPreviewImage} onSearchHashtag={onSearchHashtag} language={language} />;
              }
              return (
                <PostCard key={`repost-${post.id}`} post={post} onLike={onLike!} onVote={onVote} onRepost={onRepost} onAddComment={onAddComment!} onDeletePost={onDeletePost} onNavigateToProfile={onNavigateToProfile} onNavigateToPost={onNavigateToPost} onPreviewImage={onPreviewImage} onOpenShare={() => { }} currentUser={currentUser} followedUserIds={new Set(isFollowed ? [user.id] : [])} followerUserIds={new Set(isFollower ? [user.id] : [])} onToggleFollow={onToggleFollow} users={users} onSearchHashtag={onSearchHashtag} onNavigateToEvent={onNavigateToEvent} showMenu={isCurrentUser && activeTab === 'posts'} globalEvents={globalEvents} isPinned={pinnedPosts.has(post.id)} onTogglePin={onTogglePin} />
              );
            })
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
                    <h4 className="text-slate-900 dark:text-white font-black mb-2">{language === 'es' ? 'No hay eventos organizados' : 'No events organized'}</h4>
                    <p className="text-slate-400 font-medium text-sm italic mb-8">
                      {isCurrentUser
                        ? (language === 'es' ? "Aún no has organizado ningún evento. ¡Sé el promotor del cambio en tu administración!" : "You haven't organized any events yet. Be the promoter of change in your administration!")
                        : (language === 'es' ? "Este usuario aún no ha organizado ningún evento público." : "This user hasn't organized any public events yet.")}
                    </p>
                    {isCurrentUser && (
                      <button onClick={() => setIsCreateEventModalOpen(true)} className="inline-flex items-center space-x-2 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all transform active:scale-95">
                        <Plus size={20} />
                        <span>{t('organize_event')}</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between px-4">
                  <h4 className="text-sm font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">{language === 'es' ? 'Eventos Organizados' : 'Organized Events'}</h4>
                  {isCurrentUser && (
                    <button onClick={() => setIsCreateEventModalOpen(true)} className="bg-purple-600 text-white px-4 py-2 md:px-6 md:py-3 rounded-xl md:rounded-2xl font-black text-xs md:text-sm hover:bg-purple-700 transition-all transform active:scale-95 flex items-center justify-center space-x-2 min-w-[100px] md:min-w-[140px] whitespace-nowrap">
                      <Plus size={14} className="md:w-[18px] md:h-[18px]" />
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
                            {language === 'es' ? 'Evento Seleccionado' : 'Selected Event'}
                          </div>
                        )}
                        <div className="flex justify-between items-start mb-4 pr-12">
                          <h4 className="text-gray-900 dark:text-white font-black text-lg leading-tight group-hover:text-blue-600 transition-colors">
                            {event.title}
                          </h4>
                        </div>
                        {(event.attendees || 0) >= 2 && (
                          <div className="absolute top-6 right-6 p-1 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-full" title="Evento validado para el calendario global">
                            <CheckCircle2 size={18} />
                          </div>
                        )}
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
                            <button onClick={() => { setViewingUsersList('event-supporters'); setViewingListId(event.id); }} className="hover:underline cursor-pointer">
                              {t('supports', { count: event.attendees || 0 })} {(event.attendees || 0) < 2 && (language === 'es' ? `(faltan ${2 - (event.attendees || 0)} para calendario)` : `(need ${2 - (event.attendees || 0)} for calendar)`)}
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2 mb-4 leading-relaxed italic">
                          {event.description}
                        </p>

                        {/* Previous functionality moved to main buttons */}

                        <div className="flex items-center space-x-2 w-full mt-2">
                          <button
                            onClick={() => handleSupportEvent(event.id)}
                            className={`flex-1 py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-2 border ${supportedEventIds.has(event.id)
                              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-200 dark:border-blue-800'
                              : 'bg-white dark:bg-zinc-900 text-slate-500 border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800'
                              }`}
                          >
                            <Users size={14} />
                            <span>{supportedEventIds.has(event.id) ? (language === 'es' ? 'Apoyado' : 'Supported') : (language === 'es' ? 'Apoyar' : 'Support')}</span>
                          </button>

                          <button
                            onClick={() => handlePromoteEventInternal(event)}
                            className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-xs font-black hover:bg-blue-700 transition-all flex items-center justify-center space-x-2"
                          >
                            <Megaphone size={14} />
                            <span>{language === 'es' ? 'Promocionar' : 'Promote'}</span>
                          </button>

                          <button
                            onClick={() => setSharingEvent(event)}
                            className="flex-1 py-3 bg-white dark:bg-zinc-800 text-slate-500 rounded-xl text-xs font-black hover:bg-slate-50 dark:hover:bg-zinc-700 transition-all flex items-center justify-center space-x-2 border border-slate-200 dark:border-zinc-700"
                          >
                            <Share2 size={14} />
                            <span>{language === 'es' ? 'Compartir' : 'Share'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          )}

          {activeTab === 'badges' && (() => {
            const currentBadges = dbBadges.length > 0 ? dbBadges : (user.badges || []);
            const userBadges = currentBadges
              .map(ub => {
                const info = BADGE_CATALOG.find(c => c.id === ub.id);
                return info ? info : {
                  id: ub.id,
                  label: ub.id,
                  description: language === 'es' ? 'Insignia especial' : 'Special badge',
                  color: 'bg-slate-100 text-slate-500 border-slate-200',
                  category: 'general' as const
                };
              })
              .filter(b => b.category !== 'ranking');

            if (userBadges.length > 0) {
              return (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {userBadges.map(badge => (
                      <div key={badge.id} className="p-5 rounded-3xl border bg-white dark:bg-[#111] border-slate-100 dark:border-zinc-800 transition-all hover:scale-[1.02]">
                        <div className="flex items-start space-x-4">
                          <div className={`p-3 rounded-2xl ${badge.color}`}>
                            <img src="/img/novagob.brand_isotipo_black.svg" className="w-6 h-6 dark:invert opacity-80" alt="" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-slate-900 dark:text-white mb-1">{badge.label}</h4>
                            <p className="text-xs text-slate-500 dark:text-gray-400 font-medium leading-relaxed">{badge.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            } else {
              return (
                <div className="text-center py-20 bg-white dark:bg-[#111] rounded-[2.5rem] border border-dashed border-slate-200 dark:border-zinc-800">
                  <Medal className="mx-auto text-slate-100 dark:text-zinc-900 mb-4" size={48} />
                  <p className="text-slate-400 font-bold italic">{language === 'es' ? 'No hay insignias disponibles.' : 'No badges available.'}</p>
                </div>
              );
            }
          })()}


        </div>
      </div>

      {isPreferencesModalOpen && <PreferencesModal user={user} onClose={() => setIsPreferencesModalOpen(false)} onSave={onUpdateUser} />}

      {
        isShareModalOpen && (
          <ShareModal
            user={user}
            onClose={() => setIsShareModalOpen(false)}
            onShare={onShareViaChat}
            users={users}
            followerUserIds={followerUserIds}
            followedUserIds={followedUserIds}
            currentUser={currentUser}
          />
        )
      }
      {
        sharingEvent && (
          <ShareModal
            event={sharingEvent}
            onClose={() => setSharingEvent(null)}
            onShare={onShareViaChat}
            users={users}
            followerUserIds={followerUserIds}
            followedUserIds={followedUserIds}
            currentUser={currentUser}
          />
        )
      }
      {viewingUsersList && createPortal(
        <UsersListModal type={viewingUsersList} userId={viewingListId || user.id} onClose={() => { setViewingUsersList(null); setViewingListId(null); }} onNavigate={(id) => onNavigateToProfile?.(id)} currentUserFollowedIds={followedUserIds} currentUserFollowerIds={followerUserIds} onToggleFollow={onToggleFollow} currentUserId={currentUser.id} />,
        document.body
      )}
      {isCreateEventModalOpen && createPortal(
        <CreateEventModal userId={currentUser.id} onClose={() => setIsCreateEventModalOpen(false)} onSave={fetchUserEvents} onAddPost={onAddPost} language={language} />,
        document.body
      )}
      {isShowStatusModalOpen && createPortal(
        <NovagoberStatusModal user={user} onClose={() => setIsShowStatusModalOpen(false)} language={language} />,
        document.body
      )}

      {showLevelsModal && createPortal(
        <LevelsListModal
          currentNovas={user.novas ?? calculateNovas(user.badges || [])}
          language={language}
          onClose={() => setShowLevelsModal(false)}
        />,
        document.body
      )}

      {
        fullScreenImage && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300 cursor-pointer" onClick={() => setFullScreenImage(null)}>
            <button onClick={() => setFullScreenImage(null)} className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all border border-white/10 z-10"><X size={24} /></button>
            <img src={fullScreenImage} className="max-w-full max-h-[90vh] rounded-[3rem] object-contain animate-in zoom-in-95 duration-300 border-4 border-white/5" alt="Profile Preview" onClick={(e) => e.stopPropagation()} />
          </div>
        )
      }

      {
        imageToCrop && (
          <ImageCropModal image={imageToCrop} onClose={() => setImageToCrop(null)} onSave={handleCropComplete} />
        )
      }
      {showRankingModal && createPortal(
        <RankingHistoryModal
          badges={rankingHistory.map(rh => {
            const catalogBadge = BADGE_CATALOG.find(c => c.id === rh.badge_id);
            return {
              ...catalogBadge!,
              created_at: rh.created_at
            };
          })}
          onClose={() => setShowRankingModal(false)}
          mode="personal"
        />,
        document.body
      )}
    </div >
  );
};
