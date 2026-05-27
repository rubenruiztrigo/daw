import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Post, User } from '../types';
import { Newspaper, TrendingUp, History, Filter, ChevronRight, MessageSquare, ThumbsUp, MapPin, Calendar, Clock, Trophy, ImageIcon, ChevronUp, Sparkles, Loader2, RefreshCw, Plus, X, Maximize2 } from 'lucide-react';
import { NewsCard } from './NewsCard';
import { ShareModal } from './ShareModal';
import { RankingHistoryModal } from './RankingHistoryModal';
import { CreatePostModal } from './CreatePostModal';
import { Language, useTranslation } from '../utils/translations';
import { useScrollDirection } from '../hooks/useScrollDirection';
import { supabase } from '../supabaseClient';
import { BADGE_CATALOG } from '../types';
import { getSafeAvatar } from '../utils/avatarUtils';
import { LinkPreview } from './LinkPreview';
import { extractAllExternalUrls, isExternalUrl } from '../utils/stringUtils';

interface NewsHubViewProps {
  posts: Post[];
  user: User;
  onVote: (id: string, direction: 'up' | 'down') => void;
  onRepost: (id: string) => void;
  onAddPost: (content: string, type: 'post' | 'news', tags: string[], imageUrls?: string[], docUrl?: string, docName?: string, eventId?: string, title?: string) => Promise<void>;
  onAddComment: (postId: string, text: string) => void;
  onLikeComment?: (commentId: string) => void;
  onLikeReply?: (replyId: string) => void;
  onDeletePost?: (postId: string) => void;
  onNavigateToProfile?: (userId: string) => void;
  onNavigateToPost?: (postId: string) => void;
  onSearchHashtag?: (tag: string) => void;
  currentUser: User;
  followedUserIds?: Set<string>;
  users?: User[];
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  chats?: any[];
  onShareViaChat?: (recipientId: string, text: string, postId?: string, sharedProfileId?: string, sharedEventId?: string, imageUrls?: string[], newsId?: string, scheduledAt?: Date) => Promise<void>;
  followerUserIds?: Set<string>;
  onNavigateToEvent?: (userId: string, eventId: string) => void;
  globalEvents?: any[];
  language: Language;
  hasNewContent?: boolean;
  onRefresh?: () => void;
  likedIds?: Set<string>;
  votedUpIds?: Set<string>;
  votedDownIds?: Set<string>;
  repostedIds?: Set<string>;
  feedFetched?: boolean;
  newsFeedFetched?: boolean;
  onFetchNews?: () => Promise<void>;
}

type NewsTab = 'latest' | 'popular' | 'ranking';

export const NewsHubView: React.FC<NewsHubViewProps> = ({
  posts, user, onVote, onRepost, onAddPost, onAddComment, onLikeComment, onLikeReply, onNavigateToProfile, onNavigateToPost, onSearchHashtag, currentUser, followedUserIds = new Set(), users = [],
  onLoadMore, hasMore = false, isLoadingMore = false, chats, onShareViaChat, followerUserIds = new Set(), onNavigateToEvent, globalEvents = [], language, hasNewContent = false, onRefresh,
  likedIds = new Set(), votedUpIds = new Set(), votedDownIds = new Set(), repostedIds = new Set(), feedFetched = false, newsFeedFetched = false, onFetchNews
}) => {
  // ... inside component ...
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<NewsTab>(() => {
    const saved = sessionStorage.getItem('news_hub_tab') as NewsTab;
    return saved || 'latest';
  });
  const [sharingPost, setSharingPost] = useState<Post | null>(null);
  const [showEmpty, setShowEmpty] = useState(false);
  const t = useTranslation(language);

  // Trigger news fetch on mount if not already fetched; always refresh in background if already cached
  useEffect(() => {
    if (onFetchNews) onFetchNews();
  }, []);

  // showEmpty only after a real news fetch completed with no results
  useEffect(() => {
    if (posts.length > 0 || !newsFeedFetched) {
      setShowEmpty(false);
      return;
    }
    const timer = setTimeout(() => setShowEmpty(true), 500);
    return () => clearTimeout(timer);
  }, [posts.length, newsFeedFetched]);
  const scrollDirection = useScrollDirection();

  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStartIndex, setMentionStartIndex] = useState<number>(-1);
  const [userEvents, setUserEvents] = useState<any[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          const newHeight = Math.max(40, Math.min(400, textareaRef.current.scrollHeight));
          textareaRef.current.style.height = `${newHeight}px`;
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const mentionSuggestions = useMemo(() => {
    if (mentionQuery === null) return [];
    const query = mentionQuery.toLowerCase();
    return users.filter(u =>
      u.name.toLowerCase().includes(query) ||
      (u.lastName?.toLowerCase().includes(query)) ||
      u.username?.toLowerCase().includes(query)
    ).slice(0, 5);
  }, [mentionQuery, users]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const selectionStart = e.target.selectionStart;
    setNewsContent(value);

    const textBeforeCursor = value.slice(0, selectionStart);
    const match = textBeforeCursor.match(/(?:^|\s)@(\S*)$/);

    if (match && match[1].length >= 2) {
      const query = match[1];
      const atIndex = textBeforeCursor.lastIndexOf('@');
      setMentionQuery(query);
      setMentionStartIndex(atIndex);
    } else {
      setMentionQuery(null);
    }
  };

  useEffect(() => {
    const fetchUserEvents = async () => {
      const { data } = await supabase
        .from('user_events')
        .select('id, creator_id, title, type, event_date, event_time, location, description, attendees_count, image_url')
        .eq('creator_id', user.id)
        .gte('event_date', new Date().toISOString().split('T')[0])
        .order('event_date', { ascending: true });

      if (data) {
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
    };
    fetchUserEvents();
  }, [user.id]);

  const selectMention = (selectedUser: User) => {
    if (mentionStartIndex === -1) return;
    const before = newsContent.slice(0, mentionStartIndex);
    const after = newsContent.slice(textareaRef.current?.selectionStart || 0);
    const newContent = `${before}@${selectedUser.username} ${after}`;
    setNewsContent(newContent);
    setMentionQuery(null);
    textareaRef.current?.focus();
  };

  useEffect(() => {
    const savedScroll = sessionStorage.getItem(`news_hub_scroll_${activeTab}`);
    if (savedScroll) {
      const timer = setTimeout(() => {
        window.scrollTo({
          top: parseInt(savedScroll, 10),
          behavior: 'instant' as ScrollBehavior
        });
      }, 100);
      return () => clearTimeout(timer);
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  }, [activeTab]);

  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (textareaRef.current) {
        const rect = textareaRef.current.getBoundingClientRect();
        const newHeight = Math.max(40, Math.min(400, e.clientY - rect.top));
        textareaRef.current.style.height = `${newHeight}px`;
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const [displayLimit, setDisplayLimit] = useState(10);

  const [newsTitle, setNewsTitle] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const prevContentLength = useRef(0);

  useEffect(() => {
    if (textareaRef.current && !isDragging) {
      const isMaximized = textareaRef.current.style.height === '400px';
      const isDeletion = newsContent.length < prevContentLength.current;
      
      if (!isMaximized || isDeletion) {
        textareaRef.current.style.height = 'auto';
        const newHeight = Math.max(40, Math.min(400, textareaRef.current.scrollHeight));
        textareaRef.current.style.height = `${newHeight}px`;
      }
    }
    prevContentLength.current = newsContent.length;
  }, [newsContent]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [dismissedUrls, setDismissedUrls] = useState<Set<string>>(new Set());

  const detectedUrls = useMemo(() => {
    return extractAllExternalUrls(newsContent, isExternalUrl);
  }, [newsContent]);

  // Si una URL desaparece del texto, la quitamos de dismissedUrls.
  useEffect(() => {
    setDismissedUrls(prev => {
      const detectedSet = new Set(detectedUrls);
      let changed = false;
      const next = new Set<string>();
      prev.forEach(u => { if (detectedSet.has(u)) next.add(u); else changed = true; });
      return changed ? next : prev;
    });
  }, [detectedUrls]);

  // Sólo UNA preview a la vez, mutuamente excluyente con imagen.
  const activePreviewUrl = useMemo(() => {
    if (selectedImage) return null;
    return detectedUrls.find(u => !dismissedUrls.has(u)) || null;
  }, [detectedUrls, dismissedUrls, selectedImage]);

  const canShowLinkPreview = !!activePreviewUrl;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setSelectedImage(reader.result as string);
          };
          reader.readAsDataURL(file);
          break; // News only allows one image in this desktop view
        }
      }
    }
  };

  const [showHistory, setShowHistory] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [rankingHistory, setRankingHistory] = useState<{ badge_id: string, created_at: string }[]>([]);

  useEffect(() => {
    setDisplayLimit(10);
    sessionStorage.setItem('news_hub_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    const fetchRankingHistory = async () => {
      const { data } = await supabase
        .from('ranking_history')
        .select('badge_id, created_at')
        .eq('user_id', currentUser.id);

      if (data) setRankingHistory(data);
    };

    if (showHistory) fetchRankingHistory();
  }, [showHistory, currentUser.id]);

  const sortedNews = useMemo(() => {
    let filtered = posts.filter(p => p.type === 'news');
    const now = new Date();

    // Day bounds: 00:00:00.000 to 23:59:59.999
    const startOfDayDate = new Date(now);
    startOfDayDate.setHours(0, 0, 0, 0);
    const startOfDay = startOfDayDate.getTime();

    const endOfDayDate = new Date(now);
    endOfDayDate.setHours(23, 59, 59, 999);
    const endOfDay = endOfDayDate.getTime();

    if (activeTab === 'latest') {
      return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }

    const getUpvotes = (n: Post) => {
      if (n.upvotes !== undefined) return n.upvotes;
      return n.likes > 0 ? n.likes : 0;
    };

    if (activeTab === 'ranking') {
      const day = now.getDay();
      const daysSinceMonday = (day + 6) % 7;
      const mondayStart = new Date(now);
      mondayStart.setDate(now.getDate() - daysSinceMonday);
      mondayStart.setHours(0, 0, 0, 0);
      const sundayEnd = new Date(mondayStart);
      sundayEnd.setDate(mondayStart.getDate() + 6);
      sundayEnd.setHours(23, 59, 59, 999);

      return filtered
        .filter(n => {
          const t = new Date(n.timestamp).getTime();
          return t >= mondayStart.getTime() && t <= sundayEnd.getTime();
        })
        .sort((a, b) => getUpvotes(b) - getUpvotes(a))
        .slice(0, 3);
    }

    if (activeTab === 'popular') {
      const calculateScore = (n: Post) => {
        const interactions = getUpvotes(n) + n.comments;
        const diffMs = now.getTime() - new Date(n.timestamp).getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1; // 1 for first 24h, 2 for 24-48h, etc.
        return interactions / diffDays;
      };

      return filtered.sort((a, b) => calculateScore(b) - calculateScore(a));
    }

    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [posts, activeTab]);

  useEffect(() => {
    if (!onLoadMore) return;
    const handleScroll = () => {
      // Save scroll position for the current tab
      sessionStorage.setItem(`news_hub_scroll_${activeTab}`, window.scrollY.toString());

      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 800) {
        if (displayLimit < sortedNews.length) {
          setDisplayLimit(prev => prev + 10);
        } else if (!isLoadingMore && hasMore) {
          onLoadMore();
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [onLoadMore, isLoadingMore, hasMore, activeTab, displayLimit, sortedNews.length]);

  const displayedNews = activeTab === 'ranking' ? sortedNews : sortedNews.slice(0, displayLimit);

  return (
    <div className="pb-24">
      {sharingPost && (
        <ShareModal 
          isOpen={sharingPost !== null} 
          onClose={() => setSharingPost(null)} 
          onShare={onShareViaChat} 
          post={sharingPost} 
          chats={chats}
          language={language}
          currentUser={currentUser}
          users={users}
          followedUserIds={followedUserIds}
          followerUserIds={followerUserIds}
        />
      )}
      <div className={`
        fixed top-16 left-0 right-0 z-50 md:sticky md:top-0 md:left-auto md:right-auto md:z-50 
        bg-white dark:bg-[#0a0a0a] border-gray-100 dark:border-zinc-900 border-b h-14 
        transition-transform duration-300 md:translate-y-0
        ${scrollDirection === 'down' ? '-translate-y-[calc(100%+64px)] md:translate-y-0' : 'translate-y-0'}
      `}>
        <div className="w-full h-full max-w-4xl mx-auto flex items-center justify-between px-2 md:px-0">
          <button onClick={() => setActiveTab('latest')} className="flex-1 h-full text-xs font-bold relative group transition-all focus:outline-none whitespace-nowrap">
            <span className={activeTab === 'latest' ? 'text-gray-900 dark:text-white' : 'text-gray-400'}>{t('latest_news')}</span>
            {activeTab === 'latest' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 bg-orange-500 w-1/2 rounded-t-lg" />}
          </button>
          <div className="w-px h-6 bg-gray-100 dark:bg-zinc-800" />
          <button onClick={() => setActiveTab('popular')} className="flex-1 h-full text-xs font-bold relative group transition-all focus:outline-none whitespace-nowrap">
            <span className={activeTab === 'popular' ? 'text-gray-900 dark:text-white' : 'text-gray-400'}>{t('most_relevant')}</span>
            {activeTab === 'popular' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 bg-orange-500 w-1/2 rounded-t-lg" />}
          </button>
          <div className="w-px h-6 bg-gray-100 dark:bg-zinc-800" />
          <button onClick={() => setActiveTab('ranking')} className="flex-1 h-full text-xs font-bold relative group transition-all focus:outline-none whitespace-nowrap">
            <span className={activeTab === 'ranking' ? 'text-gray-900 dark:text-white' : 'text-gray-400'}>{t('top_ranking')}</span>
            {activeTab === 'ranking' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 bg-orange-500 w-1/2 rounded-t-lg" />}
          </button>
          <div className="w-px h-6 bg-gray-100 dark:bg-zinc-800" />
          <div className="px-2 flex items-center justify-center">
            <button
              onClick={() => setShowHistory(true)}
              className="p-2 text-orange-600 bg-orange-50/80 dark:bg-orange-900/20 backdrop-blur-sm rounded-xl transition-transform group hover:bg-orange-500 hover:text-white dark:hover:bg-orange-500 border border-orange-100 dark:border-orange-900/30 hover:border-orange-400 active:scale-90"
            >
              <Trophy size={16} className="transition-transform group-hover:rotate-12" />
            </button>
          </div>
        </div>
      </div>

      {showHistory && (
        <RankingHistoryModal
          badges={rankingHistory.map(rh => {
            const catalogBadge = BADGE_CATALOG.find(c => c.id === rh.badge_id);
            return {
              ...catalogBadge!,
              created_at: rh.created_at
            };
          })}
          onClose={() => setShowHistory(false)}
          mode="global_only"
          onNavigateToProfile={() => {
            setShowHistory(false);
            navigate(`/${currentUser.username}`, { state: { tab: 'news', openRanking: true } });
          }}
        />
      )}

      <div className={`max-w-4xl mx-auto px-2 pb-4 md:px-6 md:pb-6 flex flex-col gap-3 pt-[136px] md:pt-6 transition-all duration-300 ${
        scrollDirection === 'down' ? '-translate-y-[120px]' : 'translate-y-0'
      }`}>
        {hasNewContent && onRefresh && (
          <div className="flex justify-center my-4">
            <button
              onClick={onRefresh}
              className="bg-orange-600 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg shadow-orange-600/20 hover:bg-orange-700 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <RefreshCw size={14} className="animate-spin-slow" />
              <span>{t('update_available')}</span>
            </button>
          </div>
        )}
        {activeTab !== 'ranking' ? (
          <>
            <div ref={formRef} className="hidden md:block bg-white dark:bg-[#111] rounded-[2rem] border border-slate-300 dark:border-zinc-800 shadow-sm overflow-hidden transition-all duration-300">
              <div className="flex space-x-3 p-4 md:p-5">
                <img src={getSafeAvatar(user.avatar)} className="w-10 h-10 md:w-11 md:h-11 rounded-full object-cover shrink-0" alt="" />
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newsTitle.trim() || !newsContent.trim() || isSubmitting) return;
                  setIsSubmitting(true);
                  try {
                    const tags = newsContent.match(/#[\wáéíóúÁÉÍÓÚñÑ]+/g)?.map(t => t.slice(1)) || [];
                    await onAddPost(newsContent, 'news', tags, selectedImage ? [selectedImage] : [], undefined, undefined, undefined, newsTitle, canShowLinkPreview, activePreviewUrl);
                    setMentionQuery(null);
                    setNewsTitle('');
                    setNewsContent('');
                    setSelectedImage(null);
                    setDismissedUrls(new Set());
                  } finally {
                    setIsSubmitting(false);
                  }
                }} className="flex-1 min-w-0">
                  <div className="flex flex-col">
                    <div className="min-w-0 relative">
                      <input
                        type="text"
                        value={newsTitle}
                        onChange={(e) => setNewsTitle(e.target.value)}
                        maxLength={100}
                        placeholder="Título de la noticia"
                        className="w-full bg-transparent border-none text-lg font-bold dark:text-white placeholder-gray-400 focus:ring-0 focus:outline-none p-0 mb-0.5"
                      />
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0 relative group/textarea">
                        <textarea
                          ref={textareaRef}
                          value={newsContent}
                          onChange={handleTextChange}
                          onPaste={handlePaste}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                              setMentionQuery(null);
                            }
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              if (!newsTitle.trim() || !newsContent.trim()) return;
                              const tags = newsContent.match(/#[\wáéíóúÁÉÍÓÚñÑ]+/g)?.map(t => t.slice(1)) || [];
                              onAddPost(newsContent, 'news', tags, selectedImage ? [selectedImage] : [], undefined, undefined, undefined, newsTitle, canShowLinkPreview, activePreviewUrl);
                              setMentionQuery(null);
                              setNewsTitle('');
                              setNewsContent('');
                              setSelectedImage(null);
                              setDismissedUrls(new Set());
                            }
                          }}
                          placeholder={`${t('share_your_news')}`}
                          className={`w-full bg-transparent border-none text-base dark:text-white placeholder-gray-400 focus:ring-0 focus:outline-none resize-none min-h-[44px] max-h-[400px] p-0 transition-all duration-300 pr-4 mt-1`}
                          maxLength={2500}
                        />
                        <div 
                          className="absolute bottom-1 right-1 w-6 h-6 flex items-center justify-center cursor-nwse-resize z-10 text-gray-400 group-hover/textarea:text-orange-500 transition-colors"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setIsDragging(true);
                          }}
                          onDoubleClick={() => {
                            if (textareaRef.current) {
                              if (textareaRef.current.style.height === '400px') {
                                textareaRef.current.style.height = 'auto';
                                const newHeight = Math.max(40, Math.min(400, textareaRef.current.scrollHeight));
                                textareaRef.current.style.height = `${newHeight}px`;
                              } else {
                                textareaRef.current.style.height = '400px';
                              }
                            }
                          }}
                          title="Arrastra para redimensionar o doble clic para alternar máximo"
                        >
                          <Maximize2 size={12} className="opacity-50" />
                        </div>

                        {mentionQuery !== null && (
                          <div className="absolute left-0 top-full mt-2 w-64 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-zinc-800 z-[110] overflow-hidden shadow-2xl animate-in slide-in-from-top-2 duration-100">
                            {mentionSuggestions.length > 0 ? mentionSuggestions.map(u => (
                              <button key={u.id} type="button" onClick={() => selectMention(u)} className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors text-left border-b border-gray-50 dark:border-zinc-800 last:border-0 font-bold">
                                <img src={getSafeAvatar(u.avatar)} className="w-8 h-8 rounded-lg object-cover" alt="" />
                                <div className="min-w-0">
                                  <p className="text-sm text-gray-900 dark:text-white truncate">{u.name} {u.lastName}</p>
                                  <p className="text-[10px] text-purple-600 dark:text-purple-400">@{u.username}</p>
                                </div>
                              </button>
                            )) : (
                              <div className="px-4 py-3 text-xs text-gray-400 italic">{t('no_users_found')}</div>
                            )}
                          </div>
                        )}
                      </div>

                      {selectedImage && (
                        <div className="w-24 md:w-32 shrink-0 relative group/img aspect-[4/3] self-start mt-2 border border-gray-100 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm animate-in fade-in zoom-in-95">
                          <img src={selectedImage} alt="Preview" className="w-full h-full object-cover bg-white dark:bg-zinc-900" />
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedImage(null);
                              if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                            className="absolute top-1.5 right-1.5 p-1 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm text-gray-500 hover:text-red-500 rounded-full shadow-md transition-all opacity-0 group-hover/img:opacity-100"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Link preview — sólo una a la vez, mutuamente excluyente con imagen */}
                    {activePreviewUrl && (
                      <div className="mt-3 max-w-lg relative group/linkprev">
                        <LinkPreview url={activePreviewUrl} language={language} />
                        <button
                          type="button"
                          onClick={() => setDismissedUrls(prev => new Set(prev).add(activePreviewUrl))}
                          className="absolute top-2 right-2 p-1.5 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm text-gray-500 hover:text-red-500 rounded-full shadow-md transition-all opacity-0 group-hover/linkprev:opacity-100"
                          title="Quitar previsualización"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => fileInputRef.current?.click()} disabled={canShowLinkPreview} title={canShowLinkPreview ? 'Quita la previsualización del enlace para adjuntar una imagen' : ''} className="p-1.5 text-orange-500 hover:bg-orange-50 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"><ImageIcon size={18} /></button>
                    </div>
 
                    <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setSelectedImage(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }} />
                    <button type="submit" disabled={isSubmitting || !newsTitle.trim() || !newsContent.trim()} className="bg-orange-600 text-white px-4 py-1.5 rounded-full font-bold text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2">
                      {isSubmitting ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>{t('publishing')}...</span>
                        </>
                      ) : (
                        <span>{t('publish')}</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
            <div className="space-y-3 md:space-y-4">
              {displayedNews.length > 0 ? (
                displayedNews.map(post => <NewsCard key={post.id} post={post} onVote={onVote} onRepost={onRepost} onAddComment={onAddComment} currentUser={currentUser} followedUserIds={followedUserIds} users={users} onNavigateToProfile={onNavigateToProfile} onNavigateToPost={onNavigateToPost} onSearchHashtag={onSearchHashtag} onOpenShare={setSharingPost} onNavigateToEvent={onNavigateToEvent} globalEvents={globalEvents} language={language} likedIds={likedIds} votedUpIds={votedUpIds} votedDownIds={votedDownIds} repostedIds={repostedIds} />)
              ) : showEmpty ? (
                <div className="text-center py-20 bg-white dark:bg-[#111] rounded-[2.5rem] border border-dashed border-gray-200 dark:border-zinc-800 px-10">
                  <div className="mx-auto w-16 h-16 bg-orange-50 dark:bg-orange-900/20 rounded-full flex items-center justify-center mb-4">
                    <Clock className="text-orange-500" size={32} />
                  </div>
                  <h4 className="text-slate-900 dark:text-white font-black mb-2">
                    {activeTab === 'latest' ? t('no_news_today') : t('no_relevant_news_today')}
                  </h4>
                  <p className="text-slate-400 font-medium text-sm italic mb-6">
                    {activeTab === 'latest'
                      ? t('no_news_today_description')
                      : t('no_relevant_news_today_description')}
                  </p>
                  {activeTab === 'latest' && (
                    <button
                      onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className="inline-flex items-center space-x-2 px-6 py-3 bg-orange-600 text-white rounded-2xl font-black text-xs hover:bg-orange-700 transition-all"
                    >
                      <Sparkles size={16} />
                      <span>{t('publish_scoop')}</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center py-20 bg-white dark:bg-[#111] rounded-[2.5rem] border border-dashed border-gray-200 dark:border-zinc-800 px-10">
                  <div className="mx-auto w-16 h-16 bg-orange-50 dark:bg-orange-900/20 rounded-full flex items-center justify-center mb-4">
                    <Loader2 className="text-orange-400 animate-spin" size={32} />
                  </div>
                  <h4 className="text-slate-900 dark:text-white font-black mb-2">Cargando noticias...</h4>
                </div>
              )}

              {isLoadingMore && (
                <div className="py-6 flex justify-center">
                  <Loader2 className="animate-spin text-orange-600" size={24} />
                </div>
              )}

              {(!hasMore && displayLimit >= sortedNews.length) && displayedNews.length > 0 && !isLoadingMore && (
                <div className="py-6 flex flex-col items-center justify-center space-y-3">
                  <div className="h-px w-12 bg-gray-100 dark:bg-zinc-800" />
                  <p className="text-[10px] font-black text-gray-400 dark:text-zinc-600 uppercase tracking-[0.2em]">
                    {t('end_of_results')}
                  </p>
                  <Sparkles size={16} className="text-gray-200 dark:text-zinc-800" />
                </div>
              )}

            </div>
          </>
        ) : (
          <div className="space-y-3 md:space-y-4 animate-in fade-in duration-500">
            <div className="flex items-center space-x-3 px-4 mb-2">
              <Trophy className="text-orange-500" size={24} />
              <h3 className="text-xl font-black text-gray-900 dark:text-white">{t('top_ranking')}</h3>
            </div>
            {displayedNews.length > 0 ? (
              displayedNews.map((post, index) => (
                <div key={post.id} className="bg-white dark:bg-[#111] p-6 rounded-[2rem] border border-gray-50 dark:border-zinc-900 flex items-center transition-all group cursor-pointer" onClick={() => onNavigateToPost?.(post.id)}>
                  <div className="w-16 flex-shrink-0"><span className="text-5xl font-black text-blue-600 dark:text-blue-500 italic">{index + 1}</span></div>
                  <div className="flex-1 flex items-center space-x-4 min-w-0"><img src={getSafeAvatar(post.authorAvatar)} className="w-12 h-12 rounded-xl object-cover" alt="" /><div className="flex-1 min-w-0 pr-4"><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">{post.authorName}</span><h4 className="text-gray-900 dark:text-white font-bold leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">{post.title || post.content}</h4></div></div>
                  <div className="flex flex-col items-center justify-center min-w-[70px] h-[84px] rounded-3xl bg-orange-50 dark:bg-orange-900/20 text-orange-500 border border-orange-100 dark:border-orange-900/30"><ChevronUp size={24} strokeWidth={4} /><span className="text-lg font-black mt-1 leading-none">{post.upvotes !== undefined ? post.upvotes : post.likes}</span></div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 bg-white dark:bg-[#111] rounded-[2.5rem] border border-dashed border-gray-200 dark:border-zinc-800 px-10">
                <div className="mx-auto w-16 h-16 bg-orange-50 dark:bg-orange-900/20 rounded-full flex items-center justify-center mb-4">
                  <Trophy className="text-orange-500" size={32} />
                </div>
                <h4 className="text-slate-900 dark:text-white font-black mb-2">
                  {t('no_ranking_news')}
                </h4>
              </div>
            )}
          </div>
        )
        }
      </div >

      {!showHistory && (
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className={`md:hidden fixed right-6 w-14 h-14 bg-orange-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-orange-700 transition-all active:scale-95 z-[999] ${scrollDirection === 'down' ? 'bottom-8' : 'bottom-24'}`}
        >
          <Plus size={28} />
        </button>
      )}

      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onPost={(content, type, tags, imageUrls, docUrl, docName, eventId, title) => 
          onAddPost(content, type, tags, imageUrls, docUrl, docName, eventId, title)
        }
        user={user}
        type="news"
        language={language}
        userEvents={userEvents}
        users={users}
      />
    </div >
  );
};
