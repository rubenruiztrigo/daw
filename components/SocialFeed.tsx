import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Post, User, CalendarEvent, Chat } from '../types';
import { ImageIcon, Clapperboard, Smile, X, Users, Sparkles, Plus, AtSign, Calendar, MapPin, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { getMentionSuggestions, MENTION_REGEX } from '../utils/mentionUtils';
import { PostCard } from './PostCard';
import { ShareModal } from './ShareModal';
import { CreatePostModal } from './CreatePostModal';
import { Language, useTranslation } from '../utils/translations';
import { getSafeAvatar } from '../utils/avatarUtils';

type FeedTab = 'for-you' | 'following';

import { useScrollDirection } from '../hooks/useScrollDirection';

interface SocialFeedProps {
  posts: Post[];
  user: User;
  onLike: (postId: string) => void;
  onVote: (postId: string, optionId: string) => void;
  onRepost: (postId: string) => void;
  onAddPost: (content: string, type: 'post' | 'news', tags?: string[], imageUrl?: string, docUrl?: string, docName?: string, eventId?: string) => Promise<void>;
  onAddComment: (postId: string, content: string) => void;
  onDeletePost: (postId: string) => void;
  onSearchHashtag: (hashtag: string) => void;
  onSharePost: (postId: string) => void;
  onNavigateToProfile: (userId: string) => void;
  onNavigateToPost: (postId: string) => void;
  followedUserIds?: Set<string>;
  followerUserIds?: Set<string>;
  onToggleFollow: (userId: string) => void;
  users?: User[];
  initialContent?: string;
  prefilledEvent?: CalendarEvent;
  onClearInitialContent?: () => void;
  onViewCalendar: () => void;
  onNavigateToEvent: (userId: string, eventId: string) => void;
  onShareViaChat: (postId: string, chatRoomId: string) => void;
  globalEvents: CalendarEvent[];
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  language: Language;
  hasNewContent?: boolean;
  onRefresh?: () => void;
  pinnedPosts?: Set<string>;
  onTogglePin?: (postId: string) => void;
  chats?: Chat[];
}

export const SocialFeedV2: React.FC<SocialFeedProps> = ({
  posts, user, onLike, onVote, onRepost, onAddPost, onAddComment, onDeletePost, onSearchHashtag, onSharePost, onNavigateToProfile, onNavigateToPost, followedUserIds = new Set(), followerUserIds = new Set(), onToggleFollow, users = [], initialContent, prefilledEvent, onClearInitialContent, onViewCalendar, onNavigateToEvent, onShareViaChat, globalEvents = [],
  onLoadMore, hasMore = false, isLoadingMore = false, language, hasNewContent = false, onRefresh,
  pinnedPosts = new Set(), onTogglePin, chats = []
}) => {
  console.log('SocialFeed: Rendering with', { postsCount: posts.length, userId: user.id });
  const [activeTab, setActiveTab] = useState<FeedTab>('for-you');
  const t = useTranslation(language);
  const scrollDirection = useScrollDirection();



  useEffect(() => {
    if (!onLoadMore) return;
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 400 && !isLoadingMore && hasMore) {
        onLoadMore();
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [onLoadMore, isLoadingMore, hasMore]);

  const [content, setContent] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<{ url: string, name: string } | null>(null);
  const [sharingPost, setSharingPost] = useState<Post | null>(null);
  const [linkedEvent, setLinkedEvent] = useState<CalendarEvent | null>(null);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStartIndex, setMentionStartIndex] = useState<number>(-1);
  const [userEvents, setUserEvents] = useState<CalendarEvent[]>([]);
  const [showEventDropdown, setShowEventDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const eventButtonRef = useRef<HTMLButtonElement>(null);
  const formRef = useRef<HTMLDivElement>(null);



  useEffect(() => {
    const fetchUserEvents = async () => {
      const { data } = await supabase
        .from('user_events')
        .select('*')
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
        eventButtonRef.current && !eventButtonRef.current.contains(event.target as Node)) {
        setShowEventDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const savedTab = sessionStorage.getItem('social_feed_tab') as FeedTab;
    if (savedTab) setActiveTab(savedTab);
  }, []);

  useEffect(() => {
    sessionStorage.setItem('social_feed_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (initialContent) setContent(initialContent);
  }, [initialContent]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  useEffect(() => {
    if (prefilledEvent) setLinkedEvent(prefilledEvent);
    if (initialContent || prefilledEvent) {
      if (onClearInitialContent) onClearInitialContent();
      setTimeout(() => {
        textareaRef.current?.focus();
        textareaRef.current?.setSelectionRange(content.length, content.length);
      }, 100);
    }
  }, [initialContent, prefilledEvent]);



  const filteredPosts = useMemo(() => {
    // 1. Pestaña "Siguiendo": solo usuarios a los que sigo
    if (activeTab === 'following') {
      return posts.filter(post => followedUserIds.has(post.authorId));
    }

    // 2. Pestaña "Para ti": Mis posts + Descubrimiento por intereses
    const myInterests = user.interests || [];

    return posts.filter(post => {
      // Siempre mostramos los posts propios
      if (post.authorId === user.id) return true;

      const author = users.find(u => u.id === post.authorId);
      if (!author) return false;

      const authorInterests = author.interests || [];
      // Mostramos posts si comparten al menos 1 interés
      return authorInterests.some(interest => myInterests.includes(interest));
    });
  }, [posts, activeTab, followedUserIds, users, user]);




  const mentionSuggestions = useMemo(() => {
    if (mentionQuery === null) return [];
    return getMentionSuggestions(mentionQuery, users);
  }, [mentionQuery, users]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const selectionStart = e.target.selectionStart;
    setContent(value);

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

  const selectMention = (selectedUser: User) => {
    if (mentionStartIndex === -1) return;
    const before = content.slice(0, mentionStartIndex);
    const after = content.slice(textareaRef.current?.selectionStart || 0);
    const newContent = `${before}@${selectedUser.username} ${after}`;
    setContent(newContent);
    setMentionQuery(null);
    textareaRef.current?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!content.trim() && selectedImages.length === 0 && !selectedDoc && !linkedEvent) || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const tags = content.match(/#[\wáéíóúÁÉÍÓÚñÑ]+/g)?.map(t => t.slice(1)) || [];
      await onAddPost(content, 'post', tags, selectedImages, selectedDoc?.url, selectedDoc?.name, linkedEvent?.id);
      setMentionQuery(null);
      setContent(''); setSelectedImages([]); setSelectedDoc(null); setLinkedEvent(null);
      if (textareaRef.current) textareaRef.current.style.height = '';
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      setMentionQuery(null);
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const remainingSlots = 4 - selectedImages.length;
      const filesToProcess = Array.from(files).slice(0, remainingSlots);

      filesToProcess.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setSelectedImages(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file as File);
      });
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const maxImages = 4;
    let currentImageCount = selectedImages.length;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        if (currentImageCount >= maxImages) break;

        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setSelectedImages(prev => {
              if (prev.length >= maxImages) return prev;
              return [...prev, reader.result as string];
            });
          };
          reader.readAsDataURL(file);
          currentImageCount++;
        }
      }
    }
  };

  return (
    <div className="pb-20 pt-0">
      {/* Barra de depuración visible */}
      <div className={`sticky top-0 z-40 bg-white dark:bg-[#0a0a0a] border-gray-100 dark:border-zinc-900 border-b px-4 h-14 transition-all duration-300 md:-mx-8 -mx-4 ${scrollDirection === 'down' ? '-translate-y-full md:translate-y-0' : 'translate-y-0'}`}>
        <div className="max-w-2xl mx-auto flex items-center justify-between h-full">
          <button onClick={() => setActiveTab('for-you')} className="flex-1 h-full text-sm font-bold relative group transition-all focus:outline-none">
            <span className={activeTab === 'for-you' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-zinc-600'}>{t('for_you')}</span>
            {activeTab === 'for-you' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 bg-blue-600 w-1/2 rounded-t-lg" />}
          </button>
          <div className="w-px h-6 bg-gray-100 dark:bg-zinc-800" />
          <button onClick={() => setActiveTab('following')} className="flex-1 h-full text-sm font-bold relative group transition-all focus:outline-none">
            <span className={activeTab === 'following' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-zinc-600'}>{t('following')}</span>
            {activeTab === 'following' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 bg-blue-600 w-1/2 rounded-t-lg" />}
          </button>
        </div>
      </div>

      <div className="max-w-2xl xl:max-w-3xl mx-auto pt-4 md:pt-6">

        <div className="space-y-4">
          {hasNewContent && onRefresh && (
            <div className="flex justify-center my-4">
              <button
                onClick={onRefresh}
                className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center space-x-2 cursor-pointer"
              >
                <RefreshCw size={14} className="animate-spin-slow" />
                <span>{t('update_available')}</span>
              </button>
            </div>
          )}
          <div ref={formRef} className="hidden md:block bg-white dark:bg-[#111] rounded-[2rem] border border-slate-300 dark:border-zinc-800 relative">
            <div className="flex space-x-4 p-3 md:p-5">
              <img src={getSafeAvatar(user.avatar)} className="w-10 h-10 rounded-full object-cover" alt="" />
              <form onSubmit={handleSubmit} className="flex-1">
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={handleTextChange}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    placeholder={`${t('post_placeholder')}`}
                    maxLength={1000}
                    className={`w-full bg-transparent border-none text-lg text-slate-900 dark:text-white placeholder-slate-400 focus:ring-0 focus:outline-none resize-none min-h-[40px] max-h-[600px] p-0 transition-all duration-200 pr-4 overflow-hidden`}
                  />

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

                {linkedEvent && (
                  <div className="mt-2 mb-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 border border-blue-100 dark:border-blue-800/50 relative group/event">
                    <button type="button" onClick={() => setLinkedEvent(null)} className="absolute top-2 right-2 p-1.5 bg-white dark:bg-zinc-800 text-slate-400 hover:text-red-500 rounded-full"><X size={14} /></button>
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-blue-600 text-white rounded-xl"><Calendar size={18} /></div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-widest mb-1">{t('linked_event')}</p>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">{linkedEvent.title}</h4>
                        <div className="flex items-center space-x-2 mt-1 text-[10px] text-slate-500 font-bold">
                          <MapPin size={10} /> <span>{linkedEvent.location}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}


                {showEventDropdown && (
                  <div ref={dropdownRef} className="absolute bottom-16 left-20 w-72 bg-white dark:bg-[#111] rounded-2xl border border-gray-100 dark:border-zinc-800 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 shadow-xl">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between bg-gray-50 dark:bg-zinc-900/50">
                      <span className="text-xs font-black text-gray-500 uppercase tracking-widest">{t('your_events')}</span>
                      <button type="button" onClick={() => setShowEventDropdown(false)}><X size={14} className="text-gray-400" /></button>
                    </div>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                      {userEvents.length > 0 ? userEvents.map(event => (
                        <button
                          key={event.id}
                          type="button"
                          onClick={() => {
                            setLinkedEvent(event);
                            setShowEventDropdown(false);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors border-b border-gray-50 dark:border-zinc-800/50 last:border-0"
                        >
                          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{event.title}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Calendar size={12} className="text-blue-500" />
                            <span className="text-[10px] font-medium text-gray-500">{new Date(event.event_date).toLocaleDateString()}</span>
                          </div>
                        </button>
                      )) : (
                        <div className="p-6 text-center">
                          <p className="text-xs text-gray-400 italic">{t('no_events_published')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-2 pt-2 border-t border-gray-100 dark:border-zinc-800">
                  {/* Image Grid Preview */}
                  {selectedImages.length > 0 && (
                    <div className="grid grid-cols-1 pr-3 md:pr-5 gap-2 mb-3 animate-in fade-in zoom-in-95 duration-200">
                      {selectedImages.length === 1 && (
                        <div className="relative group/img w-full aspect-[2/1]">
                          <img src={selectedImages[0]} alt="Preview" className="w-full h-full rounded-2xl object-cover border border-gray-100 dark:border-zinc-800 shadow-sm" />
                          <button type="button" onClick={() => removeImage(0)} className="absolute top-3 right-3 p-2 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm text-gray-500 hover:text-red-500 rounded-full shadow-lg transition-all opacity-0 group-hover/img:opacity-100"><X size={18} /></button>
                        </div>
                      )}

                      {selectedImages.length === 2 && (
                        <div className="grid grid-cols-2 gap-2 w-full aspect-[2/1]">
                          {selectedImages.map((img, idx) => (
                            <div key={idx} className="relative group/img h-full">
                              <img src={img} alt="Preview" className="w-full h-full rounded-2xl object-cover border border-gray-100 dark:border-zinc-800 shadow-sm" />
                              <button type="button" onClick={() => removeImage(idx)} className="absolute top-2 right-2 p-1.5 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm text-gray-500 hover:text-red-500 rounded-full shadow-lg transition-all opacity-0 group-hover/img:opacity-100"><X size={14} /></button>
                            </div>
                          ))}
                        </div>
                      )}

                      {selectedImages.length === 3 && (
                        <div className="grid grid-cols-2 grid-rows-2 gap-2 w-full aspect-[2/1]">
                          <div className="relative group/img row-span-2">
                            <img src={selectedImages[0]} alt="Preview" className="w-full h-full rounded-2xl object-cover border border-gray-100 dark:border-zinc-800 shadow-sm" />
                            <button type="button" onClick={() => removeImage(0)} className="absolute top-2 right-2 p-1.5 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm text-gray-500 hover:text-red-500 rounded-full shadow-lg transition-all opacity-0 group-hover/img:opacity-100"><X size={14} /></button>
                          </div>
                          <div className="relative group/img h-full">
                            <img src={selectedImages[1]} alt="Preview" className="w-full h-full rounded-2xl object-cover border border-gray-100 dark:border-zinc-800 shadow-sm" />
                            <button type="button" onClick={() => removeImage(1)} className="absolute top-2 right-2 p-1.5 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm text-gray-500 hover:text-red-500 rounded-full shadow-lg transition-all opacity-0 group-hover/img:opacity-100"><X size={14} /></button>
                          </div>
                          <div className="relative group/img h-full">
                            <img src={selectedImages[2]} alt="Preview" className="w-full h-full rounded-2xl object-cover border border-gray-100 dark:border-zinc-800 shadow-sm" />
                            <button type="button" onClick={() => removeImage(2)} className="absolute top-2 right-2 p-1.5 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm text-gray-500 hover:text-red-500 rounded-full shadow-lg transition-all opacity-0 group-hover/img:opacity-100"><X size={14} /></button>
                          </div>
                        </div>
                      )}

                      {selectedImages.length === 4 && (
                        <div className="grid grid-cols-2 grid-rows-2 gap-2 w-full aspect-[2/1]">
                          {selectedImages.map((img, idx) => (
                            <div key={idx} className="relative group/img h-full">
                              <img src={img} alt="Preview" className="w-full h-full rounded-2xl object-cover border border-gray-100 dark:border-zinc-800 shadow-sm" />
                              <button type="button" onClick={() => removeImage(idx)} className="absolute top-2 right-2 p-1.5 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm text-gray-500 hover:text-red-500 rounded-full shadow-lg transition-all opacity-0 group-hover/img:opacity-100"><X size={14} /></button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <input type="file" ref={fileInputRef} hidden accept="image/*" multiple onChange={handleImageUpload} />
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-zinc-800 rounded-full transition-colors" disabled={selectedImages.length >= 4}><ImageIcon size={20} /></button>
                      <button
                        ref={eventButtonRef}
                        type="button"
                        onClick={() => setShowEventDropdown(!showEventDropdown)}
                        className={`p-2 rounded-full transition-colors ${showEventDropdown || linkedEvent ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' : 'text-blue-500 hover:bg-blue-50 dark:hover:bg-zinc-800'}`}
                      >
                        <Calendar size={20} />
                      </button>
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting || (!content.trim() && selectedImages.length === 0 && !selectedDoc && !linkedEvent)}
                      className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold text-sm disabled:opacity-50 transition-all hover:bg-blue-700 flex items-center space-x-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>{t('publishing')}...</span>
                        </>
                      ) : (
                        <span>{t('post_button')}</span>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          <div className="space-y-4">
            {filteredPosts.length > 0 ? (
              filteredPosts.map(post => {
                console.log('SocialFeed: Mapping post', post.id);
                try {
                  return (
                    <div key={post.id}>
                      <PostCard
                        post={post}
                        onLike={onLike}
                        onVote={onVote}
                        onRepost={onRepost}
                        onAddComment={onAddComment}
                        onDeletePost={onDeletePost}
                        onSearchHashtag={onSearchHashtag}
                        onSharePost={onSharePost}
                        onNavigateToProfile={onNavigateToProfile}
                        onNavigateToPost={onNavigateToPost}
                        onOpenShare={setSharingPost}
                        currentUser={user}
                        followedUserIds={followedUserIds}
                        followerUserIds={followerUserIds}
                        onToggleFollow={onToggleFollow}
                        users={users}
                        onViewCalendar={onViewCalendar}
                        onNavigateToEvent={onNavigateToEvent}
                        globalEvents={globalEvents}
                        language={language}
                      />
                    </div>
                  );
                } catch (e: any) {
                  console.error('Error rendering PostCard:', post.id, e);
                  return <div key={post.id} className="p-4 bg-red-100 text-red-600 rounded-xl mb-4">Error al mostrar este post: {e.message}</div>;
                }
              })
            ) : (
              <div className="text-center py-20 bg-white dark:bg-[#111] rounded-[2.5rem] border border-dashed border-slate-200 dark:border-zinc-800 px-10">
                <div className="mx-auto w-16 h-16 bg-slate-50 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                  {activeTab === 'for-you' ? <Sparkles className="text-blue-500" size={32} /> : <Users className="text-slate-200 dark:text-zinc-800" size={32} />}
                </div>
                <h4 className="text-slate-900 dark:text-white font-black mb-2">
                  {activeTab === 'for-you' ? t('no_interest_matches') : t('not_following_anyone')}
                </h4>
                <p className="text-slate-400 font-medium text-sm italic mb-6">
                  {activeTab === 'for-you'
                    ? t('add_interests_to_connect')
                    : t('follow_colleagues_to_see_updates')}
                </p>
              </div>
            )}

            {isLoadingMore && (
              <div className="py-6 flex justify-center">
                <Loader2 className="animate-spin text-blue-600" size={24} />
              </div>
            )}

            {!hasMore && filteredPosts.length > 0 && (
              <div className="py-12 text-center">
                <div className="w-1.5 h-1.5 bg-slate-300 dark:bg-zinc-700 rounded-full mx-auto mb-4" />
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
                  {t('end_of_results')}
                </p>
              </div>
            )}


            {sharingPost && <ShareModal post={sharingPost} onClose={() => setSharingPost(null)} onShare={onShareViaChat} currentUser={user} users={users} followedUserIds={followedUserIds} followerUserIds={followerUserIds} chats={chats} />}



            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="md:hidden fixed bottom-24 right-4 p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all z-40"
            >
              <Plus size={24} />
            </button>

            <CreatePostModal
              isOpen={isCreateModalOpen}
              onClose={() => setIsCreateModalOpen(false)}
              onPost={onAddPost}
              user={user}
              type="post"
              language={language}
              userEvents={userEvents}
              users={users}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
