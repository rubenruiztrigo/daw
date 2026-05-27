
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useScrollLock } from '../hooks/useScrollLock';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Post, CalendarEvent, Chat, BADGE_CATALOG, Badge, calculateNovas } from '../types';
import { Briefcase, MapPin, Share2, Edit3, Calendar, LayoutGrid, Newspaper, UserPlus, UserMinus, Camera, MessageCircle, Plus, Award, Maximize2, X, Check, Palette, Repeat, Clock, Users, ChevronRight, Sparkles, AlignLeft, Save, Loader2, Heart, CheckCircle2, Megaphone, Trophy, Target, Zap, Crown, Star, Medal, BadgeCheck, Mic, GraduationCap, Info, Trash2 } from 'lucide-react';
import { RankingHistoryModal } from './RankingHistoryModal';
import { PreferencesModal } from './PreferencesModal';
import { ShareModal } from './ShareModal';
import { UsersListModal } from './UsersListModal';
import { PostCard } from './PostCard';
import { NewsCard } from './NewsCard';
import { ImageCropModal } from './ImageCropModal';
import { LevelsListModal } from './LevelsListModal';
import { getLevelInfo, getBannerStyle } from '../utils/gamificationUtils';
import { supabase } from '../supabaseClient';
import { Language, useTranslation } from '../utils/translations';
import { getSafeAvatar, DEFAULT_AVATAR } from '../utils/avatarUtils';
import { EventPreview } from './EventPreview';
import { generateDefaultEventImage } from '../utils/eventImageUtils';
import { PersonalDataModal } from './PersonalDataModal';



const BADGE_IMAGES: Record<string, string> = {
  'congress_2024': '/img/insignias/Congreso_2024.png',
  'congress_2024_speaker': '/img/insignias/Congreso_2024.png',
  'congress_2025': '/img/insignias/Congreso_2025.png',
  'congress_2025_speaker': '/img/insignias/Congreso_2025.png',
  'event_burocracia': '/img/insignias/Burocrac_IA.png',
  'event_burocracia_speaker': '/img/insignias/Burocrac_IA.png',
  'event_innovalencia': '/img/insignias/InnoValencia.png',
  'event_innovalencia_speaker': '/img/insignias/InnoValencia.png',
  'event_innovamos': '/img/insignias/InnovamosLab.png',
  'event_innovamos_speaker': '/img/insignias/InnovamosLab.png',
  'award_innovator': '/img/insignias/Excelencia_2025.png',
  'award_woman': '/img/insignias/Excelencia_2025.png',
  'award_talent': '/img/insignias/Excelencia_2025.png',
  'award_excellence': '/img/insignias/Excelencia_2025.png',
  'award_special': '/img/insignias/Excelencia_2025.png',
  'award_creativity': '/img/insignias/Excelencia_2025.png',
  'award_transformative_project': '/img/insignias/Excelencia_2025.png',
  'award_efficiency': '/img/insignias/Excelencia_2025.png',
  'award_digital_transformation': '/img/insignias/Excelencia_2025.png',
  'award_people_management': '/img/insignias/Excelencia_2025.png',
  'award_good_government': '/img/insignias/Excelencia_2025.png',
  'ranking_top1': '/img/insignias/top-1.png',
  'ranking_top2': '/img/insignias/top-2.png',
  'ranking_top3': '/img/insignias/top-3.png',
};

const getBadgeImage = (b: any) => {
  if (b.image_url) return b.image_url;
  const id = (b.id || '').toLowerCase();
  const label = (b.label || '').toLowerCase();
  if (BADGE_IMAGES[id]) return BADGE_IMAGES[id];
  if (id.includes('innovamos') || label.includes('innovamos')) return '/img/insignias/InnovamosLab.png';
  if (id.includes('innovalencia') || label.includes('innovalencia')) return '/img/insignias/InnoValencia.png';
  if (id.includes('burocrac') || label.includes('burocrac')) return '/img/insignias/Burocrac_IA.png';
  if (id.includes('2024') && (id.includes('congres') || label.includes('congres'))) return '/img/insignias/Congreso_2024.png';
  if (id.includes('2025') && (id.includes('congres') || label.includes('congres'))) return '/img/insignias/Congreso_2025.png';
  if (b.category === 'premios_excelencia' || id.startsWith('award_') || label.includes('excelencia')) return '/img/insignias/Excelencia_2025.png';
  return '/img/insignias/insignia-degradado.png';
};

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
  onLikeComment?: (id: string) => void;
  onLikeReply?: (id: string) => void;
  onVote?: (id: string, dir: 'up' | 'down') => void;
  onRepost: (id: string) => void;
  onAddComment?: (postId: string, text: string) => void;
  onAddReply?: (commentId: string, text: string, parentReplyId?: string) => void;
  onVoteComment?: (commentId: string, dir: 'up' | 'down') => void;
  onSupportEvent?: (event: any) => void;
  users: User[];
  onSearchHashtag?: (tag: string) => void;
  onNavigateToEvent?: (userId: string, eventId: string) => void;
  focusedEventId?: string | null;
  onClearFocusedEvent?: () => void;
  onAddPost?: (content: string, type: 'post' | 'news', tags: string[], imageUrls?: string[], docUrl?: string, docName?: string, eventId?: string, title?: string) => Promise<void>;
  onPromoteEvent?: (event: CalendarEvent) => void;
  chats?: Chat[];
  followerUserIds?: Set<string>;
  followedUserIds?: Set<string>;
  onShareViaChat?: (recipientId: string, text: string, postId?: string, sharedProfileId?: string, sharedEventId?: string, imageUrls?: string[], newsId?: string, scheduledAt?: Date) => Promise<void>;
  globalEvents?: any[];
  language: Language;
  pinnedPosts?: Set<string>;
  onTogglePin?: (postId: string) => void;
  onLoadMore?: (authorId: string) => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  likedIds?: Set<string>;
  votedUpIds?: Set<string>;
  votedDownIds?: Set<string>;
  repostedIds?: Set<string>;
  hasMoreNews?: boolean;
  isLoadingMoreNews?: boolean;
  isLoadingProfileFeed?: boolean;
}


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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
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
              <span className={`text-[10px] font-black ${status.color} uppercase tracking-widest`}>{t('level_label', { level: status.level })}</span>
            </div>
            <div className="h-4 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden p-1 border border-slate-50 dark:border-zinc-900">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out animate-shimmer-bar"
                style={{
                  width: `${Math.max(2, progress)}%`,
                  backgroundColor: status.currentLevelInfo.bannerColor || '#3b82f6',
                  backgroundImage: 'linear-gradient(110deg, transparent 40%, rgba(255,255,255,0.5) 50%, transparent 60%)',
                  boxShadow: `0 0 20px ${status.currentLevelInfo.bannerColor}90`
                }}
              />
            </div>
          </div>

          <p className="text-gray-600 dark:text-gray-300 font-medium leading-relaxed italic">
            "{status.desc}"
          </p>

          <div className="pt-4">
            <button
              onClick={() => {
                navigate('/recompensas');
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

const FullScreenImageModal: React.FC<{ imageUrl: string, onClose: () => void }> = ({ imageUrl, onClose }) => {
  useScrollLock();
  return createPortal(
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300 cursor-pointer" onClick={onClose}>
      <button onClick={onClose} className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all border border-white/10 z-10"><X size={24} /></button>
      <img src={imageUrl} className="max-w-full max-h-[90vh] rounded-[3rem] object-contain animate-in zoom-in-95 duration-300 border-4 border-white/5" alt="Profile Preview" onClick={(e) => e.stopPropagation()} />
    </div>,
    document.body
  );
};

const CreateEventModal: React.FC<{
  userId: string,
  onClose: () => void,
  onSave: () => void,
  onAddPost?: (content: string, type: 'post' | 'news', tags: string[], imageUrls?: string[], docUrl?: string, docName?: string, eventId?: string, title?: string) => Promise<void>,
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
    description: '',
    image_url: ''
  });
  useScrollLock();

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (re) => {
            setFormData(prev => ({ ...prev, image_url: re.target?.result as string }));
          };
          reader.readAsDataURL(file);
        }
        break;
      }
    }
  };

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

    const finalImageUrl = formData.image_url || generateDefaultEventImage();

    const { data, error } = await supabase
      .from('user_events')
      .insert({
        creator_id: userId,
        title: formData.title,
        type: formData.type,
        event_date: formData.date,
        event_time: formData.time,
        location: formData.location,
        description: formData.description,
        image_url: finalImageUrl
      })
      .select('id')
      .maybeSingle();

    if (!error && data) {
      if (shouldPromote && onAddPost) {
        const eventTag = (formData.title || '')
          .split(/\s+/)
          .filter(Boolean)
          .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join('');

        const promoText = `¡Mira este nuevo evento! #${eventTag}`;

        await onAddPost(
          promoText,
          'post',
          [eventTag],
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
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
              maxLength={50}
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
            <div className="space-y-1 animate-in fade-in duration-300">
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
                  min={new Date().toISOString().split('T')[0]}
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

          <div className="space-y-2">
            <div className="flex items-center justify-between ml-1">
              <label className="text-[10px] font-black text-slate-500 uppercase">Portada evento (Opcional)</label>
              <div className="relative group">
                <Info size={14} className="text-slate-400 cursor-help" />
                <div className="absolute right-0 bottom-full mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 text-center shadow-xl">
                  Si no seleccionas ninguna imagen, se usará una imagen por defecto.
                  <div className="absolute top-full right-1 -mt-1 border-4 border-transparent border-t-slate-800"></div>
                </div>
              </div>
            </div>
            
            <div 
              className={`relative w-full outline-none transition-all ${
                formData.image_url 
                  ? 'flex items-start justify-start pl-2 pt-2 pb-2' 
                  : 'group/cover h-32 rounded-2xl bg-slate-50 dark:bg-zinc-900 border-2 border-dashed border-slate-200 dark:border-zinc-800 overflow-hidden flex items-center justify-center hover:border-blue-500/50 focus-within:border-indigo-900/50 dark:focus-within:border-indigo-400/60 focus-within:bg-indigo-50/50 dark:focus-within:bg-indigo-900/10'
              }`}
              tabIndex={0}
              onPaste={handlePaste}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const file = e.dataTransfer.files?.[0];
                if (file && file.type.startsWith('image/')) {
                  const reader = new FileReader();
                  reader.onload = (re) => {
                    setFormData(prev => ({ ...prev, image_url: re.target?.result as string }));
                  };
                  reader.readAsDataURL(file);
                }
              }}
            >
              {formData.image_url ? (
                <div className="relative inline-flex mt-1">
                  <img src={formData.image_url} className="h-28 w-auto max-w-full object-contain rounded-xl shadow-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900" alt="Cover" />
                  <button 
                    onClick={(e) => { e.stopPropagation(); setFormData(prev => ({ ...prev, image_url: '' })); }}
                    className="absolute -top-3 -right-3 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-transform hover:scale-110 z-10 border-2 border-white dark:border-[#0a0a0a]"
                    title="Quitar imagen"
                  >
                    <X size={14} strokeWidth={3} />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-3 text-slate-400 w-full h-full">
                  <div className="flex items-center justify-center space-x-4">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!formData.image_url) {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = (ev) => {
                            const file = (ev.target as HTMLInputElement).files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (re) => {
                                setFormData(prev => ({ ...prev, image_url: re.target?.result as string }));
                              };
                              reader.readAsDataURL(file);
                            }
                          };
                          input.click();
                        }
                      }}
                      className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center hover:bg-blue-200 dark:hover:bg-blue-800/40 transition-colors shadow-sm"
                      title="Seleccionar del dispositivo"
                    >
                      <Plus size={24} strokeWidth={3} />
                    </button>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Selecciona una imagen
                  </span>
                </div>
              )}
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

const EventDetailsModal: React.FC<{ 
  event: CalendarEvent, 
  onClose: () => void, 
  language: Language,
  onSupport: (id: string) => void,
  isSupported: boolean,
  onPromote: (event: CalendarEvent) => void,
  onShare: (event: CalendarEvent) => void
}> = ({ event, onClose, language, onSupport, isSupported, onPromote, onShare }) => {
  const t = useTranslation(language);
  const eventDate = new Date(event.event_date);
  const formattedDate = eventDate.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  const [isClosing, setIsClosing] = useState(false);
  useScrollLock();

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 250);
  };

  return createPortal(
    <div
      className={`fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-250 ${isClosing ? 'opacity-0' : 'animate-in fade-in duration-300'}`}
      onClick={handleClose}
    >
      <div
        className={`bg-white dark:bg-[#111] w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-zinc-800 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden transition-all duration-250 ${isClosing ? 'opacity-0 scale-95' : 'animate-in zoom-in-95 duration-300'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-48 md:h-64 bg-slate-50 dark:bg-zinc-900/30 overflow-hidden">
          <img 
            src={event.image_url || '/img/novagob.brand_isotipo_black.svg'} 
            className="w-full h-full object-cover"
            alt={event.title}
          />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
          
          {/* Apoyos Arriba Izquierda */}
          <div className="absolute top-6 left-6 flex items-center space-x-2">
            <div className="flex items-center bg-black/40 backdrop-blur-md text-white px-4 py-2 rounded-2xl border border-white/10 shadow-lg">
              <span className="text-sm font-black tracking-tight">
                {event.attendees || 0} {(event.attendees || 0) === 1 ? 'apoyo' : 'apoyos'}
              </span>
            </div>
            
            <button 
              onClick={() => onShare(event)}
              className="p-2.5 bg-black/40 backdrop-blur-md text-white/70 hover:text-white rounded-2xl border border-white/10 shadow-lg transition-all"
              title="Compartir evento"
            >
              <Share2 size={16} strokeWidth={3} />
            </button>
          </div>

          <button
            onClick={handleClose}
            className="absolute top-6 right-6 p-2 bg-black/20 backdrop-blur-md text-white rounded-full hover:bg-black/40 transition-all z-10 border border-white/10"
          >
            <X size={20} />
          </button>
          
          <div className="absolute bottom-6 left-8 right-8">
            <div className="inline-block px-4 py-2 bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10">
              <h2 className="text-xl md:text-2xl font-black text-white leading-tight drop-shadow-lg">
                {event.title}
              </h2>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-4">
          {/* Fecha y Lugar debajo de la imagen */}
          <div className="flex flex-wrap gap-4 pb-2 border-b border-gray-100 dark:border-zinc-800/50">
            <div className="flex items-center text-xs font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest bg-slate-50 dark:bg-zinc-900/50 px-4 py-2 rounded-xl border border-slate-100 dark:border-zinc-800/50">
              <Calendar size={14} className="mr-2.5 text-blue-500" strokeWidth={3} />
              {formattedDate}
            </div>
            <div className="flex items-center text-xs font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest bg-slate-50 dark:bg-zinc-900/50 px-4 py-2 rounded-xl border border-slate-100 dark:border-zinc-800/50">
              <MapPin size={14} className="mr-2.5 text-emerald-500" strokeWidth={3} />
              {event.location}
            </div>
            <div className="flex items-center text-xs font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest bg-slate-50 dark:bg-zinc-900/50 px-4 py-2 rounded-xl border border-slate-100 dark:border-zinc-800/50">
              {event.event_time.substring(0, 5)}h
            </div>
          </div>

          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 pl-1">Sobre el evento</span>
            <div className="text-sm md:text-base text-slate-600 dark:text-zinc-400 leading-relaxed font-medium bg-slate-50 dark:bg-zinc-900/30 p-6 rounded-3xl border border-slate-100 dark:border-zinc-800/50 whitespace-pre-wrap">
              {event.description}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSupport(event.id);
              }}
              className={`flex-1 h-14 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center space-x-2 border shadow-sm ${isSupported
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-200 dark:border-blue-800'
                : 'bg-white dark:bg-zinc-900 text-slate-400 border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-600'
                }`}
            >
              {isSupported ? (
                <><Check size={18} strokeWidth={3} /><span>Apoyado</span></>
              ) : (
                <><Heart size={18} strokeWidth={3} /><span>Apoyar</span></>
              )}
            </button>
            <button
              onClick={() => onPromote(event)}
              className="flex-1 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/20 transform active:scale-95"
            >
              <Megaphone size={18} strokeWidth={3} />
              <span>Promocionar</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
export const ProfileView: React.FC<ProfileViewProps> = ({
  user, isCurrentUser, isFollowed, isFollower, onToggleFollow, onStartChat, posts,
  onUpdateUser, onDeletePost, onNavigateToProfile, onNavigateToPost, onPreviewImage, currentUser, onLike, onLikeComment, onLikeReply, onVote, onRepost, onAddComment, users, onSearchHashtag, onNavigateToEvent, focusedEventId, onClearFocusedEvent, onAddPost, onPromoteEvent, chats = [], followerUserIds = new Set(), followedUserIds = new Set(), onShareViaChat, globalEvents = [], language,
  pinnedPosts = new Set(), onTogglePin,
  repostedIds = new Set(),
  hasMoreNews = false,
  isLoadingMoreNews = false,
  isLoadingProfileFeed = false,
  onLoadMore, hasMore = false, isLoadingMore = false
}) => {
  const navigate = useNavigate();
  const lastAutoOpenedId = React.useRef<string | null>(null);
  const t = useTranslation(language);
  const canViewLists = isCurrentUser || (isFollowed && isFollower);
  const [isPreferencesModalOpen, setIsPreferencesModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);


  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [isShowStatusModalOpen, setIsShowStatusModalOpen] = useState(false);
  const [viewingUsersList, setViewingUsersList] = useState<'followers' | 'following' | 'event-supporters' | null>(null);
  const [viewingListId, setViewingListId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>(() => {
    // 1. Prioritize user-specific tab from session storage
    const userSpecific = sessionStorage.getItem(`profile_tab_${user.id}`);
    if (userSpecific) return userSpecific as ProfileTab;
    
    // 2. Fallback to generic last active tab
    const generic = sessionStorage.getItem('profile_active_tab');
    if (generic) return generic as ProfileTab;
    
    return 'posts';
  });

  useEffect(() => {
    if (!onLoadMore || !user.id) return;
    const handleScroll = () => {
      const scrollPos = window.innerHeight + window.scrollY;
      const threshold = document.documentElement.scrollHeight - 800;
      if (scrollPos >= threshold && !isLoadingMore && hasMore) {
        onLoadMore(user.id);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [onLoadMore, isLoadingMore, hasMore, user.id]);
  const [repostedPostIds, setRepostedPostIds] = useState<string[]>([]);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [userEvents, setUserEvents] = useState<CalendarEvent[]>([]);
  const [supportedEventIds, setSupportedEventIds] = useState<Set<string>>(new Set());
  const [sharingEvent, setSharingEvent] = useState<CalendarEvent | null>(null);
  const [sharingPost, setSharingPost] = useState<Post | null>(null);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [showRankingModal, setShowRankingModal] = useState(false);
  const [showLevelsModal, setShowLevelsModal] = useState(false);
  const [allBadges, setAllBadges] = useState<Badge[]>(BADGE_CATALOG);
  const [userBadgeIds, setUserBadgeIds] = useState<Set<string>>(new Set());
  const [badgeAssignmentDates, setBadgeAssignmentDates] = useState<Map<string, string>>(new Map());
  const [rankingHistory, setRankingHistory] = useState<{ id: string, badge_id: string, created_at: string }[]>([]);
  const [selectedEventForDetails, setSelectedEventForDetails] = useState<CalendarEvent | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const [localAvatar, setLocalAvatar] = useState<string>(user.avatar);

  // Si el usuario cambia (por ejemplo, se visita otro perfil), sincronizamos el avatar local
  useEffect(() => {
    setLocalAvatar(user.avatar);
  }, [user.avatar, user.id]);

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

    // If we have location state, prioritize it
    if (location.state?.tab) {
      if (location.state.tab !== activeTab) {
        setActiveTab(location.state.tab);
      }
      return;
    }

    // Otherwise restore from session storage if different
    const savedTab = sessionStorage.getItem(tabKey) as ProfileTab;
    if (savedTab && savedTab !== activeTab) {
      setActiveTab(savedTab);
    }
  }, [user.id, location.state]);



  useEffect(() => {
    if (user.id) {
      sessionStorage.setItem(`profile_tab_${user.id}`, activeTab);
      sessionStorage.setItem('profile_active_tab', activeTab);
    }
  }, [activeTab, user.id]);

  // Switch to events tab immediately when we have a focusedEventId
  useEffect(() => {
    if (focusedEventId) {
      setActiveTab('events');
    }
  }, [focusedEventId]);

  // Pre-populate userEvents from globalEvents cache so the focused event
  // opens instantly without waiting for the Supabase fetch to complete
  useEffect(() => {
    if (userEvents.length === 0 && globalEvents.length > 0) {
      const cached = globalEvents.filter(e => e.creator_id === user.id);
      if (cached.length > 0) setUserEvents(cached);
    }
  }, [globalEvents, user.id]);

  // Scroll to event card then open the modal once events have loaded
  useEffect(() => {
    if (!focusedEventId || userEvents.length === 0) return;

    // PERFORMANCE OPTIMIZATION: If the event was just opened via handleOpenEventInstant,
    // we SKIP the scroll animation and delays to feel direct and fast.
    if (focusedEventId === lastAutoOpenedId.current) return;

    const event = userEvents.find(e => e.id === focusedEventId);
    if (!event) return;

    // First scroll to the card so the user sees where they are
    setTimeout(() => {
      const element = document.getElementById(`event-${focusedEventId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      // Then open the modal after the scroll animation finishes
      setTimeout(() => {
        setSelectedEventForDetails(event);
      }, 150);
    }, 50);
  }, [focusedEventId, userEvents]);

  const handleOpenEventInstant = useCallback((event: CalendarEvent) => {
    // 1. Open instantly
    setSelectedEventForDetails(event);
    // 2. Mark as already handled so the useEffect doesn't trigger scroll/delays
    lastAutoOpenedId.current = event.id;
    // 3. Update URL using the current profile's username to avoid reloading the profile
    if (onNavigateToEvent) {
      onNavigateToEvent(user.username || user.id, event.id);
    }
  }, [onNavigateToEvent, user.username, user.id]);

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

      // 1. Fetch ALL badge definitions
      const { data: allDbBadges } = await supabase
        .from('badges')
        .select('id, label, category, nova_reward, image_url')
        .order('label');

      const merged = [...BADGE_CATALOG];
      if (allDbBadges && allDbBadges.length > 0) {
        allDbBadges.forEach(dbB => {
          const badgeIdLower = dbB.id.toLowerCase();
          const existingIdx = merged.findIndex(m => m.id.toLowerCase() === badgeIdLower);

          if (existingIdx !== -1) {
            merged[existingIdx] = {
              ...merged[existingIdx],
              label: dbB.label || merged[existingIdx].label,
              nova_reward: dbB.nova_reward ?? merged[existingIdx].nova_reward,
              image_url: dbB.image_url || undefined,
            };
          } else {
            merged.push({
              id: dbB.id,
              label: dbB.label || dbB.id,
              color: 'bg-slate-100 text-slate-500 border-slate-200',
              category: (dbB.category || 'congreso') as Badge['category'],
              nova_reward: dbB.nova_reward,
              image_url: dbB.image_url || undefined,
            } as Badge);
          }
        });
      }
      setAllBadges(merged);

      // 2. Fetch user's badge assignments with dates
      const { data: assignments } = await supabase
        .from('user_badges')
        .select('badge_id, created_at')
        .eq('user_id', user.id);

      if (assignments) {
        setUserBadgeIds(new Set(assignments.map(a => a.badge_id.toLowerCase())));
        const datesMap = new Map<string, string>();
        assignments.forEach(a => {
          datesMap.set(a.badge_id.toLowerCase(), a.created_at);
        });
        setBadgeAssignmentDates(datesMap);
      }

      const { data: rankHistory } = await supabase
        .from('ranking_history')
        .select('id, badge_id, created_at')
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
    if (!currentUser?.id || !user?.id || isCurrentUser || followedUserIds.size === 0) {
      setCommonFollowers([]);
      return;
    }

    // 1. Convert followedUserIds Set to an array for the query
    const myFollowedIds = Array.from(followedUserIds);

    // 2. Fetch follower_ids who follow THIS profile AND are followed by ME (mutuals)
    const { data: followRows, error: followRowsError } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('followed_id', user.id)
      .in('follower_id', myFollowedIds)
      .limit(50);

    if (followRowsError || !followRows) {
      setCommonFollowers([]);
      return;
    }

    const mutualFollowerIds = followRows.map((row: any) => row.follower_id).filter(Boolean);
    if (mutualFollowerIds.length === 0) {
      setCommonFollowers([]);
      return;
    }

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, avatar')
      .in('id', mutualFollowerIds)
      .limit(50);

    if (profilesError || !profiles) {
      setCommonFollowers([]);
      return;
    }

    const mutuals = profiles.map((profile: any) => ({
      id: profile.id,
      avatar: getSafeAvatar(profile.avatar)
    }));

    setCommonFollowers(mutuals);
  };



  const fetchUserEvents = async () => {
    setLoadingEvents(true);
    const { data, error } = await supabase
      .from('user_events')
      .select('id, creator_id, title, type, event_date, event_time, location, description, attendees_count, image_url')
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
        attendees: ev.attendees_count,
        image_url: ev.image_url
      })));
    }
    setLoadingEvents(false);
  };

  const getSupporterId = async () => {
    try {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.id) {
        return data.user.id;
      }
    } catch (error) {
      console.error('[ProfileView] Error getting auth user for event support:', error);
    }

    return currentUser.id || null;
  };

  const categories = [
    { id: 'congresos', label: 'Congreso', icon: Calendar },
    { id: 'premios_excelencia', label: 'Premios', icon: Medal },
    { id: 'eventos', label: 'Eventos', icon: GraduationCap },
    { id: 'ranking', label: 'Ranking', icon: Trophy }
  ];

  const handleSupportEvent = async (eventId: string) => {
    const supporterId = await getSupporterId();

    if (!supporterId) {
      console.error('[ProfileView] No se pudo obtener el usuario autenticado para apoyar el evento');
      return;
    }

    const isSupported = supportedEventIds.has(eventId);
    const targetEvent = userEvents.find(ev => ev.id === eventId);

    if (isSupported) {
      const { error } = await supabase
        .from('event_supports')
        .delete()
        .eq('user_id', supporterId)
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
        setSelectedEventForDetails(prev => prev && prev.id === eventId ? { ...prev, attendees: Math.max(0, (prev.attendees || 0) - 1) } : prev);
        return;
      }

      console.error('[ProfileView] Error al quitar apoyo del evento:', error);
      return;
    }

    const { error } = await supabase
      .from('event_supports')
      .insert({
        user_id: supporterId,
        event_id: eventId,
      });

    // If insert succeeded, proceed; if it failed due to duplicate, treat as already supported
    if (!error) {
      if (targetEvent && targetEvent.creator_id !== supporterId) {
        await supabase.from('notifications').insert({
          user_id: targetEvent.creator_id,
          sender_id: supporterId,
          type: 'event_support',
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
      setSelectedEventForDetails(prev => prev && prev.id === eventId ? { ...prev, attendees: (prev.attendees || 0) + 1 } : prev);
      return;
    }

    // Handle duplicate key (already supported) gracefully by updating local state
    if (error) {
      const msg = (error.message || '').toLowerCase();
      if (error.code === '23505' || msg.includes('duplicate') || msg.includes('unique')) {
        // already exists in DB — reflect in UI
        setSupportedEventIds(prev => {
          const next = new Set(prev);
          next.add(eventId);
          return next;
        });
        setUserEvents(prev => prev.map(ev =>
          ev.id === eventId ? { ...ev, attendees: (ev.attendees || 0) + 1 } : ev
        ));
        setSelectedEventForDetails(prev => prev && prev.id === eventId ? { ...prev, attendees: (prev.attendees || 0) + 1 } : prev);
        return;
      }

      console.error('[ProfileView] Error al apoyar el evento:', error);
    }
  };

  const novas = useMemo(() => {
    if (user.novas !== undefined && user.novas !== null) return Math.max(0, user.novas);

    const earnedBadges = allBadges
      .filter(b => userBadgeIds.has(b.id.toLowerCase()))
      .map(b => ({ id: b.id }));

    const combinedBadges = [
      ...earnedBadges,
      ...rankingHistory.map(rh => ({ id: rh.badge_id }))
    ];

    if (earnedBadges.length > 0 || rankingHistory.length > 0) {
      return calculateNovas(combinedBadges.length > 0 ? combinedBadges : (user.badges || []));
    }

    return calculateNovas(user.badges || []);
  }, [user.novas, user.badges, allBadges, userBadgeIds, rankingHistory]);

  const status = useMemo(() => getLevelInfo(novas, language), [novas, language]);

  const bannerStyle = useMemo(() => getBannerStyle(status), [status]);

  const joinedDateFormatted = useMemo(() => {
    const rawDate = user.joinedDate || new Date().toISOString();
    const date = new Date(rawDate);
    const month = date.toLocaleString(language === 'es' ? 'es-ES' : 'en-US', { month: 'long' });
    return t('joined_date', { month, year: date.getFullYear() });
  }, [user.joinedDate, language, t]);

  const allPinnedPostIds = useMemo(() => {
    const set = new Set(posts.filter(p => p.authorId === user.id && p.isPinned).map(p => p.id));
    if (pinnedPosts) {
      pinnedPosts.forEach(id => set.add(id));
    }
    return set;
  }, [posts, user.id, pinnedPosts]);

  const userPosts = useMemo(() => {
    const filtered = posts.filter(p => {
      const isAuthor = p.authorId === user.id || (p.authorUsername && user.username && p.authorUsername.toLowerCase() === user.username.toLowerCase());
      return isAuthor && p.type === 'post';
    });
    // Only show loader if we have absolutely no content to show yet
    if (isLoadingProfileFeed && filtered.length === 0) return null;
    return filtered.sort((a, b) => {
      // 1. Pinned status first
      const aPinned = allPinnedPostIds.has(a.id);
      const bPinned = allPinnedPostIds.has(b.id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      // 2. Then by timestamp
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [posts, user.id, user.username, allPinnedPostIds, isLoadingProfileFeed]);

  const userNews = useMemo(() => {
    const filtered = posts.filter(p => {
      const isAuthor = p.authorId === user.id || (p.authorUsername && user.username && p.authorUsername.toLowerCase() === user.username.toLowerCase());
      return isAuthor && p.type === 'news';
    });
    if (isLoadingProfileFeed && filtered.length === 0) return null;
    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [posts, user.id, user.username, isLoadingProfileFeed]);

  const userRepostsList = useMemo(() => {
    const filtered = posts.filter(p => repostedPostIds.includes(p.id));
    return filtered.sort((a, b) => {
      // 1. Pinned status first
      const aPinned = allPinnedPostIds.has(a.id);
      const bPinned = allPinnedPostIds.has(b.id);

      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;

      // 2. If both are pinned, sort by pinnedAt (newest first)
      if (aPinned && bPinned) {
        const aPinTime = a.pinnedAt ? new Date(a.pinnedAt).getTime() : 0;
        const bPinTime = b.pinnedAt ? new Date(b.pinnedAt).getTime() : 0;
        if (aPinTime !== bPinTime) return bPinTime - aPinTime;
      }

      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [posts, user.id, repostedPostIds, allPinnedPostIds]);

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

  const handleRemovePhoto = () => {
    setLocalAvatar('');
    onUpdateUser({ ...user, avatar: '' });
    setShowPhotoOptions(false);
  };

  const handleCropComplete = (croppedImage: string) => {
    // Actualizamos primero el estado local para ver el cambio al instante en el perfil
    setLocalAvatar(croppedImage);
    onUpdateUser({ ...user, avatar: croppedImage });
    setImageToCrop(null);
  };

  const handlePromoteEventInternal = (event: CalendarEvent) => {
    if (!currentUser) return;
    
    // Close modal first so it doesn't obstruct navigation view
    setSelectedEventForDetails(null);
    
    // Trigger navigation via App.tsx handler
    onPromoteEvent?.(event);
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto px-2 md:px-6 lg:px-8 overflow-x-hidden md:overflow-visible space-y-4 md:space-y-6 pb-12 pt-[88px] md:pt-0 animate-in fade-in duration-500" onClick={() => { if (showPhotoOptions) setShowPhotoOptions(false); }}>
      <div className="bg-white dark:bg-[#111] rounded-[2rem] md:rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 relative z-0 w-full overflow-visible">
        <div
          className="h-20 md:h-48 relative overflow-hidden rounded-t-[2rem] md:rounded-t-[2.5rem] group/banner transition-all duration-700 cursor-pointer"
          style={bannerStyle}
          onClick={() => setShowLevelsModal(true)}
        >
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover/banner:opacity-100 transition-opacity flex items-center justify-center">
            <div className="hidden md:flex bg-white/30 backdrop-blur-sm px-6 py-2 rounded-full border border-white/40 text-slate-900 font-black text-xs uppercase tracking-widest opacity-0 group-hover/banner:opacity-100 transform translate-y-4 group-hover/banner:translate-y-0 transition-all duration-300">
              Ver estatus Novagober
            </div>
          </div>
          <div className="absolute top-4 right-6 flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/30 text-slate-900">
            <Award size={14} className="text-slate-900" />
            <span className="text-[10px] font-black tracking-widest text-slate-900">
              {user.level_name || status.rank}
            </span>
          </div>
        </div>

        <div className="md:px-10 pb-6 md:pb-10">
          <div className="relative flex flex-col items-center text-center md:flex-row md:justify-between md:items-center md:text-left -mt-6 md:-mt-4 mb-4 md:mb-8 gap-3 md:gap-6">
            <div ref={avatarRef} className="relative flex-shrink-0">
              <div className="group relative">
                <img
                  src={getSafeAvatar(localAvatar)}
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
                <div
                  className="absolute top-full left-0 mt-2 bg-white dark:bg-[#111] rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-2xl shadow-black/40 z-[100] animate-in slide-in-from-top-2 duration-200 w-64 overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => {
                      setFullScreenImage(localAvatar);
                      setShowPhotoOptions(false);
                    }}
                    className="w-full flex items-center space-x-3 px-5 py-4 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-all border-b border-gray-50 dark:border-zinc-900"
                  >
                    <Maximize2 size={18} className="text-blue-600" />
                    <span>{t('view_full_image')}</span>
                  </button>

                  {isCurrentUser && (
                    <>
                      <button
                        onClick={() => {
                          fileInputRef.current?.click();
                          setShowPhotoOptions(false);
                        }}
                        className="w-full flex items-center space-x-3 px-5 py-4 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-all border-b border-gray-50 dark:border-zinc-900"
                      >
                        <Camera size={18} className="text-indigo-600" />
                        <span>{t('change_profile_photo')}</span>
                      </button>

                      <button
                        onClick={handleRemovePhoto}
                        className="w-full flex items-center space-x-3 px-5 py-4 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all"
                      >
                        <Trash2 size={18} className="text-red-600" />
                        <span>{t('remove_photo')}</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
            {isCurrentUser && <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />}

            <div className="flex-1 pt-1 md:pt-0 md:translate-y-5 w-full min-w-0 text-center md:text-left relative z-20">
              <div className="flex flex-col md:flex-row items-center gap-1 md:gap-3 mb-0.5 md:mb-2 justify-center md:justify-start">
                <h1 className="text-lg md:text-4xl font-black text-gray-900 dark:text-white tracking-tight leading-tight flex flex-wrap items-center gap-1.5 relative z-20 justify-center md:justify-start text-center md:text-left">
                  {user.name} {user.lastName}
                </h1>
              </div>
              <div className="flex flex-col space-y-1 items-center md:items-start">
                {!user.isOrganization && (
                  <div className="flex items-start md:items-center space-x-2 text-blue-600 dark:text-blue-400 font-bold text-xs md:text-base flex-wrap justify-center md:justify-start w-full">
                    <span className="break-words max-w-full leading-tight">
                      {user.position} {user.username === 'novagob' ? 'de' : 'en'}{' '}
                      {user.linkedOrganizationId ? (
                        <button
                          onClick={() => onNavigateToProfile?.(user.linkedOrganizationId!)}
                          className="text-blue-700 dark:text-blue-300 font-extrabold cursor-pointer inline-flex items-center"
                        >
                          {user.institution}
                        </button>
                      ) : (
                        <span>{user.institution}</span>
                      )}
                    </span>
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
                <button 
                  onClick={() => canViewLists && setViewingUsersList('followers')} 
                  className={`text-center md:text-right ${canViewLists ? 'group cursor-pointer' : 'cursor-default transition-none underline-none'}`}
                >
                  <p className={`text-base md:text-xl font-black text-slate-900 dark:text-white transition-colors uppercase ${canViewLists ? 'group-hover:text-blue-600' : ''}`}>{user.followers}</p>
                  <p className="text-[8px] md:text-[10px] text-gray-400 font-black uppercase tracking-widest">
                    {t('followers')}
                  </p>
                </button>
                <button 
                  onClick={() => canViewLists && setViewingUsersList('following')} 
                  className={`text-center md:text-right ${canViewLists ? 'group cursor-pointer' : 'cursor-default transition-none underline-none'}`}
                >
                  <p className={`text-base md:text-xl font-black text-slate-900 dark:text-white transition-colors uppercase ${canViewLists ? 'group-hover:text-blue-600' : ''}`}>{user.following}</p>
                  <p className="text-[8px] md:text-[10px] text-gray-400 font-black uppercase tracking-widest">
                    {t('following_label')}
                  </p>
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 md:gap-3 w-full mt-4 md:mt-0">
                {isCurrentUser ? (
                  <>
                    <button onClick={() => setIsShareModalOpen(true)} className="bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-zinc-700 px-3 py-2 md:px-4 md:py-2 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all transform active:scale-95 flex items-center justify-center min-w-fit whitespace-nowrap"><Share2 size={12} className="md:w-[14px] md:h-[14px]" /></button>
                    <button onClick={() => setShowEditModal(true)} className="bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-zinc-700 px-3 py-2 md:px-4 md:py-2 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all transform active:scale-95 flex items-center justify-center space-x-2 min-w-fit md:min-w-[120px] whitespace-nowrap"><Edit3 size={12} className="md:w-[14px] md:h-[14px]" /><span>{t('edit_profile')}</span></button>

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

            {!isCurrentUser && commonFollowers.length > 0 && (
              <div
                className={`pt-4 border-t border-gray-50 dark:border-zinc-900 ${canViewLists ? 'cursor-pointer group' : 'cursor-default'}`}
                onClick={() => canViewLists && setViewingUsersList('followers')}
              >
                <div className="flex items-center justify-center md:justify-start space-x-3">
                  <div className="flex -space-x-3 overflow-hidden">
                    {commonFollowers.slice(0, 3).map((follower) => (
                      <img
                        key={follower.id}
                        src={follower.avatar || `/img/imagen-por-defecto.png`}
                        className="w-7 h-7 md:w-8 md:h-8 rounded-full border-2 border-white dark:border-[#111] object-cover ring-2 ring-transparent group-hover:ring-blue-500/30 transition-all"
                        alt=""
                      />
                    ))}
                  </div>
                  {commonFollowers.length > 0 && (
                    <p className="text-xs md:text-sm text-gray-500 dark:text-zinc-500 font-bold group-hover:text-blue-600 transition-colors">
                      {commonFollowers.length === 1
                        ? (language === 'es' ? `1 persona en común` : `1 common connection`)
                        : (language === 'es'
                          ? `${commonFollowers.length} personas en común`
                          : `${commonFollowers.length} common connections`)}
                    </p>
                  )}
                  <ChevronRight size={14} className="text-gray-300 dark:text-zinc-700 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4 md:space-y-6 md:px-0 w-full max-w-full min-w-0">
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
            <span className="font-bold text-sm">{t('events_published')} ({userEvents.length})</span>
          </button>

          <button onClick={() => setActiveTab('badges')} className={`flex-1 min-w-fit px-4 py-3 rounded-2xl flex items-center justify-center space-x-2 transition-all ${activeTab === 'badges' ? 'bg-yellow-50 dark:bg-yellow-900/10 text-yellow-600' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-900 hover:text-gray-600'}`}>
            <Medal size={18} />
            <span className="font-bold text-sm">{t('badges_label')} ({allBadges.filter(b => userBadgeIds.has(b.id.toLowerCase())).length})</span>
          </button>
        </div>

        <div className="flex flex-col gap-3 w-full max-w-full">
          {activeTab === 'posts' && (
            userPosts === null ? (
              <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                <p className="text-slate-400 font-bold">{t('loading_posts') || 'Cargando publicaciones...'}</p>
              </div>
            ) : userPosts.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-[#111] rounded-[2.5rem] border border-dashed border-slate-200 dark:border-zinc-800">
                <LayoutGrid className="mx-auto text-slate-100 dark:text-zinc-900 mb-4" size={48} />
                <p className="text-slate-400 font-bold italic">{t('no_posts')}</p>
              </div>
            ) : userPosts.map(post => (
              <PostCard key={post.id} post={post} onLike={onLike!} onLikeComment={onLikeComment} onLikeReply={onLikeReply} onVote={onVote} onRepost={onRepost} onAddComment={onAddComment!} onDeletePost={onDeletePost} onNavigateToProfile={onNavigateToProfile} onNavigateToPost={onNavigateToPost} onPreviewImage={onPreviewImage} onOpenShare={setSharingPost} currentUser={currentUser} followedUserIds={new Set(isFollowed ? [user.id] : [])} followerUserIds={new Set(isFollower ? [user.id] : [])} onToggleFollow={onToggleFollow} users={users} onSearchHashtag={onSearchHashtag} onNavigateToEvent={onNavigateToEvent} showMenu={isCurrentUser && activeTab === 'posts'} globalEvents={globalEvents} isPinned={allPinnedPostIds.has(post.id)} onTogglePin={onTogglePin} language={language} />
            ))
          )}
          
          {activeTab === 'posts' && userPosts !== null && userPosts.length > 0 && hasMore && !isLoadingMore && (
            <div className="py-6 flex flex-col items-center justify-center space-y-3">
              <div className="hidden sm:block">
                <button 
                  onClick={(e) => { e.stopPropagation(); onLoadMore?.(user.id); }}
                  className="mt-4 px-8 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl font-black text-sm hover:bg-blue-100 transition-all active:scale-95 border border-blue-100 dark:border-blue-900/30 shadow-sm"
                >
                  {t('load_more_posts')}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'news' && (
            <>
              {isCurrentUser && (
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
              )}

              {userNews === null ? (
                <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                  <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-4" />
                  <p className="text-slate-400 font-bold">{t('loading_news') || 'Cargando noticias...'}</p>
                </div>
              ) : userNews.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-[#111] rounded-[2.5rem] border border-dashed border-slate-200 dark:border-zinc-800">
                  <Newspaper className="mx-auto text-slate-100 dark:text-zinc-900 mb-4" size={48} />
                  <p className="text-slate-400 font-bold italic">{t('no_news_registered')}</p>
                </div>
              ) : (
                userNews.map(news => (
                  <NewsCard key={news.id} post={news} onVote={onVote!} onLikeComment={onLikeComment} onLikeReply={onLikeReply} onRepost={onRepost} onAddComment={onAddComment!} currentUser={currentUser} followedUserIds={new Set(isFollowed ? [user.id] : [])} users={users} onNavigateToProfile={onNavigateToProfile} onNavigateToPost={onNavigateToPost} onPreviewImage={onPreviewImage} onSearchHashtag={onSearchHashtag} onOpenShare={setSharingPost} language={language} />
                ))
              )}
              
              {activeTab === 'news' && userNews !== null && userNews.length > 0 && (
                <div className="py-6 flex flex-col items-center justify-center space-y-3">
                  {hasMoreNews && !isLoadingMoreNews && (
                    <div className="hidden sm:block">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onLoadMore?.(user.id); }}
                        className="mt-4 px-8 py-3 bg-orange-50 dark:bg-orange-900/20 text-orange-500 dark:text-orange-400 rounded-2xl font-black text-sm hover:bg-orange-100 transition-all active:scale-95 border border-orange-100 dark:border-orange-900/30 shadow-sm"
                      >
                        {t('load_more_news')}
                      </button>
                    </div>
                  )}
                </div>
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
                return <NewsCard key={`repost-${post.id}`} post={post} onVote={onVote!} onRepost={onRepost} onAddComment={onAddComment!} currentUser={currentUser} followedUserIds={new Set(isFollowed ? [user.id] : [])} users={users} onNavigateToProfile={onNavigateToProfile} onNavigateToPost={onNavigateToPost} onPreviewImage={onPreviewImage} onSearchHashtag={onSearchHashtag} onOpenShare={setSharingPost} language={language} />;
              }
              return (
                <PostCard key={`repost-${post.id}`} post={post} onLike={onLike!} onLikeComment={onLikeComment} onLikeReply={onLikeReply} onVote={onVote} onRepost={onRepost} onAddComment={onAddComment!} onDeletePost={onDeletePost} onNavigateToProfile={onNavigateToProfile} onNavigateToPost={onNavigateToPost} onPreviewImage={onPreviewImage} onOpenShare={setSharingPost} currentUser={currentUser} followedUserIds={new Set(isFollowed ? [user.id] : [])} followerUserIds={new Set(isFollower ? [user.id] : [])} onToggleFollow={onToggleFollow} users={users} onSearchHashtag={onSearchHashtag} onNavigateToEvent={onNavigateToEvent} showMenu={isCurrentUser} globalEvents={globalEvents} isPinned={allPinnedPostIds.has(post.id)} onTogglePin={onTogglePin} language={language} />
              );
            })
          )}

          {activeTab === 'reposts' && userRepostsList.length > 0 && hasMore && !isLoadingMore && (
            <div className="py-6 flex flex-col items-center justify-center space-y-3">
              <div className="hidden sm:block">
                <button 
                  onClick={(e) => { e.stopPropagation(); onLoadMore?.(user.id); }}
                  className="mt-4 px-8 py-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 dark:text-emerald-400 rounded-2xl font-black text-sm hover:bg-emerald-100 transition-all active:scale-95 border border-emerald-100 dark:border-emerald-900/30 shadow-sm"
                >
                  {t('load_more_reposts')}
                </button>
              </div>
            </div>
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
                    const eventDate = new Date(event.event_date);
                    const formattedDate = eventDate.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });
                    const isExpanded = focusedEventId === event.id;

                    return (
                      <div key={event.id} id={`event-${event.id}`}>
                      <EventPreview
                        event={event}
                        language={language}
                        isFocused={focusedEventId === event.id}
                        onNavigateToEvent={() => handleOpenEventInstant(event)}
                        renderActions={() => (
                          <div className="flex flex-wrap items-center gap-2 mt-4 w-full">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleSupportEvent(event.id);
                              }}
                              className={`flex-1 min-w-[80px] h-9 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center space-x-2 border shadow-sm ${supportedEventIds.has(event.id)
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-200 dark:border-blue-800'
                                : 'bg-white dark:bg-zinc-900 text-slate-400 border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-600'
                                }`}
                            >
                              {supportedEventIds.has(event.id) ? (
                                <><Check size={12} strokeWidth={3} /><span>{t('supported')}</span></>
                              ) : (
                                <><Heart size={12} strokeWidth={3} /><span>{t('support')}</span></>
                              )}
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSharingEvent(event);
                              }}
                              className="h-9 px-3 bg-slate-50 dark:bg-zinc-800/80 text-slate-400 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-700 hover:text-blue-600 transition-all flex items-center justify-center border border-slate-200/50 dark:border-zinc-700/50"
                              title={t('share')}
                            >
                              <Share2 size={14} strokeWidth={3} />
                            </button>
                          </div>
                        )}
                      />
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          )}

          {activeTab === 'badges' && (
            <div className="space-y-12 pb-10">
              {(() => {
                const earnedBadges = allBadges
                  .filter(b => userBadgeIds.has(b.id.toLowerCase()))
                  .sort((a, b) => {
                    const dateA = badgeAssignmentDates.get(a.id.toLowerCase()) || '';
                    const dateB = badgeAssignmentDates.get(b.id.toLowerCase()) || '';
                    return dateB.localeCompare(dateA);
                  });

                if (earnedBadges.length === 0) {
                  return (
                    <div className="text-center py-20 bg-white dark:bg-[#111] rounded-[2.5rem] border border-dashed border-slate-200 dark:border-zinc-800">
                      <Medal className="mx-auto text-slate-100 dark:text-zinc-900 mb-4" size={48} />
                      <p className="text-slate-400 font-bold italic">{language === 'es' ? 'No has recibido ninguna insignia todavía.' : 'You haven\'t received any badges yet.'}</p>
                    </div>
                  );
                }

                return (
                  <>
                    <div className="grid grid-cols-5 gap-2">
                      {earnedBadges.map(badge => {
                        const isSpeaker = (badge.label || '').toLowerCase().includes('ponente');
                        const isAward = badge.category === 'premio';
                        const isNovas = badge.category?.toLowerCase() === 'novas';
                        const isVerified = badge.id === 'verified';
                        const isPioneer = badge.id === 'pioneer';
                        const isTraining = badge.category?.toLowerCase() === 'formacion';
                        const isEvent = badge.category?.toLowerCase() === 'eventos';
                        const isTopRanking = ['ranking_top1', 'ranking_top2', 'ranking_top3'].includes((badge.id || '').toLowerCase());

                        let gradient = 'from-blue-500 to-indigo-600';
                        let IconComponent = Award;

                        if (isSpeaker) {
                          gradient = 'from-amber-400 via-orange-500 to-amber-600';
                          IconComponent = Mic;
                        } else if (badge.label.toLowerCase().includes('asistente')) {
                          gradient = 'from-slate-400 to-slate-600';
                          IconComponent = Users;
                        } else if (isAward) {
                          gradient = 'from-yellow-400 via-amber-500 to-yellow-600';
                          IconComponent = Trophy;
                        } else if (isNovas) {
                          gradient = 'from-purple-500 via-pink-500 to-rose-500';
                          IconComponent = Sparkles;
                        } else if (isVerified) {
                          gradient = 'from-cyan-400 to-blue-500';
                          IconComponent = BadgeCheck;
                        } else if (isPioneer) {
                          gradient = 'from-amber-300 to-orange-500';
                          IconComponent = Star;
                        } else if (isTraining) {
                          gradient = 'from-indigo-500 to-purple-600';
                          IconComponent = Target;
                        } else if (isEvent) {
                          gradient = 'from-emerald-400 to-teal-600';
                          IconComponent = Calendar;
                        }

                        const frameGradient = 'from-purple-500 via-indigo-500 to-purple-600';

                        return (
                          <div key={badge.id} className="group relative aspect-square rounded-full transition-all duration-500 perspective-1000">
                            <div className="w-full h-full relative preserve-3d group-hover:rotate-y-180 transition-transform duration-700 cursor-pointer will-change-transform transform-gpu">
                              {/* Front Side: Image + Blurred Title Overlay */}
                              <div className="absolute inset-0 bg-white dark:bg-[#0a0a0a] rounded-full flex items-center justify-center overflow-hidden backface-hidden border-2 border-slate-100 dark:border-zinc-800">
                                <img src={getBadgeImage(badge)} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={badge.label} />
                                
                                {/* Overlay: Legible Title */}
                                <div className={`absolute inset-0 flex items-center justify-center p-3 rounded-full ${isTopRanking ? '' : 'bg-slate-900/18 backdrop-blur-[1px] ring-inset ring-1 ring-white/10'}`}>
                                  <h4 className="text-xs md:text-sm font-black text-white leading-tight text-center uppercase tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] px-2">
                                    {badge.label}
                                  </h4>
                                </div>

                                {/* Shine Effect */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>
                              </div>

                              {/* Back Side: Nova Rewards / Branding */}
                              <div className="absolute inset-0 bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-md rounded-full flex flex-col items-center justify-center overflow-hidden backface-hidden rotate-y-180 border-2 border-blue-500 dark:border-blue-400">
                                <div className={`absolute inset-0 bg-gradient-to-br ${frameGradient} opacity-20`}></div>
                                <div className="relative z-10 flex flex-col items-center justify-center">
                                  <img src="/img/novagob.brand_isotipo_black.svg" className="w-12 h-12 md:w-14 md:h-14 object-contain opacity-20 dark:invert mb-1" alt="NovaGob" />
                                  {badge.nova_reward !== undefined && badge.nova_reward !== null && badge.nova_reward > 0 && (
                                    <div className="flex items-baseline gap-1 mt-1">
                                      <span className="text-[14px] md:text-base font-black text-blue-600 dark:text-blue-400 leading-none">{badge.nova_reward}</span>
                                      <span className="text-[14px] md:text-base font-black text-slate-400 uppercase tracking-widest">novas</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {isPreferencesModalOpen && (
        <PreferencesModal user={user} onClose={() => setIsPreferencesModalOpen(false)} onSave={onUpdateUser} />
      )}

      {isShareModalOpen && (
        <ShareModal
          isOpen={true}
          user={user}
          onClose={() => setIsShareModalOpen(false)}
          onShare={onShareViaChat}
          users={users}
          followerUserIds={followerUserIds}
          followedUserIds={followedUserIds}
          currentUser={currentUser}
          chats={chats}
        />
      )}

      {sharingPost && (
        <ShareModal
          isOpen={true}
          post={sharingPost}
          onClose={() => setSharingPost(null)}
          onShare={onShareViaChat}
          users={users}
          followerUserIds={followerUserIds}
          followedUserIds={followedUserIds}
          currentUser={currentUser}
          chats={chats}
        />
      )}

      {sharingEvent && (
        <ShareModal
          isOpen={true}
          event={sharingEvent}
          onClose={() => setSharingEvent(null)}
          onShare={onShareViaChat}
          users={users}
          followerUserIds={followerUserIds}
          followedUserIds={followedUserIds}
          currentUser={currentUser}
          chats={chats}
        />
      )}

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

      {fullScreenImage && (
        <FullScreenImageModal imageUrl={fullScreenImage} onClose={() => setFullScreenImage(null)} />
      )}

      {imageToCrop && (
        <ImageCropModal image={imageToCrop} onClose={() => setImageToCrop(null)} onSave={handleCropComplete} />
      )}

      {showRankingModal && createPortal(
        <RankingHistoryModal
          badges={rankingHistory.map(rh => {
            const badgeIdLower = rh.badge_id.toLowerCase();
            const catalogBadge = BADGE_CATALOG.find(c => c.id.toLowerCase() === badgeIdLower);
            return {
              ...(catalogBadge || { id: rh.badge_id, label: rh.badge_id, color: 'bg-slate-100', category: 'ranking' }),
              created_at: rh.created_at
            } as any;
          })}
          onClose={() => setShowRankingModal(false)}
          mode="personal"
        />,
        document.body
      )}
      {selectedEventForDetails && (
        <EventDetailsModal
          event={selectedEventForDetails}
          onClose={() => {
            setSelectedEventForDetails(null);
            onClearFocusedEvent();
          }}
          language={language}
          onSupport={handleSupportEvent}
          isSupported={supportedEventIds.has(selectedEventForDetails.id)}
          onPromote={handlePromoteEventInternal}
          onShare={setSharingEvent}
        />
      )}
      {showEditModal && (
        <PersonalDataModal
          user={user}
          onClose={() => setShowEditModal(false)}
          onSave={onUpdateUser}
          language={language}
        />
      )}

    </div>

  );
};

