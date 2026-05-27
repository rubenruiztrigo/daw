import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Post, User, CalendarEvent, Chat } from '../types';
import { ImageIcon, Clapperboard, Smile, X, Users, Sparkles, Plus, AtSign, Calendar, MapPin, Loader2, RefreshCw, Heart, Megaphone, Share2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { getMentionSuggestions, MENTION_REGEX } from '../utils/mentionUtils';
import { PostCard } from './PostCard';
import { ShareModal } from './ShareModal';
import { CreatePostModal } from './CreatePostModal';
import { Language, useTranslation } from '../utils/translations';
import { getSafeAvatar } from '../utils/avatarUtils';
import { compressImage } from '../utils/imageUtils';
import { safeLocalStorageSet } from '../utils/cacheUtils';
import { EventPreview } from './EventPreview';
import { LinkPreview } from './LinkPreview';
import { extractAllExternalUrls, isExternalUrl } from '../utils/stringUtils';

interface SelectedImage {
    id: string;
    preview: string;
    url?: string;
    status: 'uploading' | 'done' | 'error';
}

type FeedTab = 'for-you' | 'following' | 'admin';

import { useScrollDirection } from '../hooks/useScrollDirection';

interface SocialFeedProps {
  posts: Post[];
  user: User;
  onLike: (postId: string) => void;
  onVote: (postId: string, optionId: string) => void;
  onRepost: (postId: string) => void;
  onAddPost: (content: string, type: 'post' | 'news', tags?: string[], imageUrls?: string[], docUrl?: string, docName?: string, eventId?: string, title?: string, showLinkPreview?: boolean, linkPreviewUrl?: string | null) => Promise<void>;
  onAddComment: (postId: string, content: string) => void;
  onLikeComment?: (commentId: string) => void;
  onLikeReply?: (replyId: string) => void;
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
  onShareViaChat: (recipientId: string, text: string, postId?: string, sharedProfileId?: string, sharedEventId?: string, imageUrls?: string[], newsId?: string, scheduledAt?: Date) => Promise<void>;
  globalEvents: CalendarEvent[];
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  language: Language;
  likedIds?: Set<string>;
  votedUpIds?: Set<string>;
  votedDownIds?: Set<string>;
  repostedIds?: Set<string>;
  hasNewContent?: boolean;
  onRefresh?: () => void;
  pinnedPosts?: Set<string>;
  onTogglePin?: (postId: string) => void;
  chats?: Chat[];
  chatsLoading?: boolean;
  activeTab: FeedTab;
  onTabChange: (tab: FeedTab) => void;
  isLoading?: boolean;
  feedFetched?: boolean;
}

export const SocialFeed: React.FC<SocialFeedProps> = ({
  posts, user, onLike, onVote, onRepost, onAddPost, onAddComment, onLikeComment, onLikeReply, onDeletePost, onSearchHashtag, onSharePost, onNavigateToProfile, onNavigateToPost, followedUserIds = new Set(), followerUserIds = new Set(), onToggleFollow, users = [], initialContent, prefilledEvent, onClearInitialContent, onViewCalendar, onNavigateToEvent, onShareViaChat, globalEvents = [],
  onLoadMore, hasMore = false, isLoadingMore = false, language, likedIds = new Set(), votedUpIds = new Set(), votedDownIds = new Set(), repostedIds = new Set(), hasNewContent = false, onRefresh,
  pinnedPosts = new Set(), onTogglePin, chats = [], chatsLoading = false,
  activeTab, onTabChange, isLoading = false, feedFetched = false
}) => {
  const handleTabChange = (tab: FeedTab) => {
    // 1. Save current scroll position before switching
    scrollPositions.current[activeTab] = window.scrollY;
    
    // 2. Perform the switch
    onTabChange(tab);
    sessionStorage.setItem('social_feed_tab', tab);
  };

  // 3. Restore scroll position when activeTab changes
  useEffect(() => {
    const savedPos = scrollPositions.current[activeTab];
    // We use a small timeout to let the new posts render before scrolling
    // This provides a much smoother transition
    const timer = setTimeout(() => {
      window.scrollTo(0, savedPos);
    }, 0);
    return () => clearTimeout(timer);
  }, [activeTab]);
  const t = useTranslation(language);
  const scrollDirection = useScrollDirection();

  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasMoreRef = useRef(hasMore);
  const isLoadingMoreRef = useRef(isLoadingMore);
  const isLoadingRef = useRef(isLoading);
  const onLoadMoreRef = useRef(onLoadMore);
  useEffect(() => { hasMoreRef.current = hasMore; }, [hasMore]);
  useEffect(() => { isLoadingMoreRef.current = isLoadingMore; }, [isLoadingMore]);
  useEffect(() => { isLoadingRef.current = isLoading; }, [isLoading]);
  useEffect(() => { onLoadMoreRef.current = onLoadMore; }, [onLoadMore]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMoreRef.current && !isLoadingMoreRef.current && !isLoadingRef.current) {
          onLoadMoreRef.current?.();
        }
      },
      { rootMargin: '300px' }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, []);

  const [content, setContent] = useState('');
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<{ url: string, name: string } | null>(null);
  const [sharingPost, setSharingPost] = useState<Post | null>(null);
  const [linkedEvent, setLinkedEvent] = useState<CalendarEvent | null>(null);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStartIndex, setMentionStartIndex] = useState<number>(-1);
  const [userEvents, setUserEvents] = useState<CalendarEvent[]>([]);
  const [showEventDropdown, setShowEventDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showEmpty, setShowEmpty] = useState(false);
  const [dismissedUrls, setDismissedUrls] = useState<Set<string>>(new Set());

  const detectedUrls = useMemo(() => {
    return extractAllExternalUrls(content, isExternalUrl);
  }, [content]);

  // Si una URL desaparece del texto, la quitamos de dismissedUrls; así al volver a
  // pegarla se mostrará la preview de nuevo.
  useEffect(() => {
    setDismissedUrls(prev => {
      const detectedSet = new Set(detectedUrls);
      let changed = false;
      const next = new Set<string>();
      prev.forEach(u => { if (detectedSet.has(u)) next.add(u); else changed = true; });
      return changed ? next : prev;
    });
  }, [detectedUrls]);

  // Sólo se muestra UNA preview a la vez: la primera URL detectada que no esté cerrada.
  // Si ya hay una visible, pegar otra URL no añade otra preview.
  // La preview es mutuamente excluyente con imágenes y con eventos enlazados.
  const activePreviewUrl = useMemo(() => {
    if (selectedImages.length > 0 || linkedEvent) return null;
    return detectedUrls.find(u => !dismissedUrls.has(u)) || null;
  }, [detectedUrls, dismissedUrls, selectedImages.length, linkedEvent]);

  const canShowLinkPreview = !!activePreviewUrl;

  // Only show "No hay publicaciones" after the first fetch has completed and confirmed no posts
  useEffect(() => {
    if (posts.length > 0 || pinnedPosts.size > 0 || isLoading || !feedFetched) {
      setShowEmpty(false);
      return;
    }
    const timer = setTimeout(() => setShowEmpty(true), 500);
    return () => clearTimeout(timer);
  }, [posts.length, pinnedPosts.size, isLoading, feedFetched]);

  // INDEPENDENT SCROLL MEMORY
  const scrollPositions = useRef<Record<string, number>>({ 'for-you': 0, 'following': 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const eventButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const fetchUserEvents = async () => {
      // "Tus eventos" del composer: todos los eventos creados por el usuario con
      // fecha futura, sin importar el número de apoyos (attendees_count). El filtro
      // de ≥50 apoyos sólo aplica a la vista del calendario público.
      const { data } = await supabase
        .from('user_events')
        .select('id, creator_id, title, type, event_date, event_time, location, description, attendees_count, image_url')
        .eq('creator_id', user.id)
        .gte('event_date', new Date().toISOString().split('T')[0])
        .order('event_date', { ascending: true });

      if (data) {
        const mappedEvents = data.map(ev => ({
          id: ev.id,
          creator_id: ev.creator_id,
          title: ev.title,
          type: ev.type as any,
          event_date: ev.event_date,
          event_time: ev.event_time,
          location: ev.location,
          description: ev.description,
          attendees: ev.attendees_count,
          image_url: ev.image_url
        }));
        setUserEvents(mappedEvents);
        
        // WARM THE CACHE: Store these events in the manifest so they load instantly if shared
        try {
          const manifest = JSON.parse(localStorage.getItem('event_manifest') || '{}');
          mappedEvents.forEach(e => {
            manifest[e.id] = e;
          });
          safeLocalStorageSet('event_manifest', JSON.stringify(manifest));
        } catch (e) {
          // Ignore — manifest warming is best-effort
        }
      }
    };
    fetchUserEvents();
  }, [user.id]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showEventDropdown) {
        setShowEventDropdown(false);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
        eventButtonRef.current && !eventButtonRef.current.contains(event.target as Node)) {
        setShowEventDropdown(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEventDropdown]);

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
      if (window.innerWidth < 640) {
        setIsCreateModalOpen(true);
      }
      if (onClearInitialContent) onClearInitialContent();
      setTimeout(() => {
        textareaRef.current?.focus();
        textareaRef.current?.setSelectionRange(content.length, content.length);
      }, 100);
    }
  }, [initialContent, prefilledEvent]);

  const filteredPosts = useMemo(() => {
    // Sorting by timestamp: newest first
    return posts
      .filter(p => p.type === 'post' || p.type === 'repost')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [posts]);

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
      setMentionQuery(match[1]);
      setMentionStartIndex(textBeforeCursor.lastIndexOf('@'));
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

  const uploadImage = async (file: File, id: string) => {
    try {
      const compressedBlob = await compressImage(file);
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(filePath, compressedBlob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('post-images')
        .getPublicUrl(filePath);

      setSelectedImages(prev => prev.map(img =>
        img.id === id ? { ...img, url: publicUrl, status: 'done' } : img
      ));
    } catch (error) {
      console.error('Error uploading image:', error);
      setSelectedImages(prev => prev.map(img =>
        img.id === id ? { ...img, status: 'error' } : img
      ));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    const isUploading = selectedImages.some(img => img.status === 'uploading');
    if (isSubmitting || isUploading) return;
    if (!content.trim() && selectedImages.length === 0 && !selectedDoc && !linkedEvent) return;

    setIsSubmitting(true);
    try {
      const uploadedImageUrls = selectedImages
        .filter(img => img.status === 'done' && img.url)
        .map(img => img.url as string);

      const tags = content.match(/#[\wáéíóúÁÉÍÓÚñÑ]+/g)?.map(t => t.slice(1)) || [];
      const showLinkPreview = canShowLinkPreview;
      const linkPreviewUrl = activePreviewUrl;
      await onAddPost(content, 'post', tags, uploadedImageUrls, selectedDoc?.url, selectedDoc?.name, linkedEvent?.id, undefined, showLinkPreview, linkPreviewUrl);

      setMentionQuery(null);
      setContent('');
      setSelectedImages([]);
      setSelectedDoc(null);
      setLinkedEvent(null);
      setDismissedUrls(new Set());
      if (textareaRef.current) textareaRef.current.style.height = '';
    } catch (error) {
      console.error('Error publishing post:', error);
      alert('Error al publicar. Por favor intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') setMentionQuery(null);
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
      filesToProcess.forEach((file: any) => {
        const id = Math.random().toString(36).substring(7);
        const reader = new FileReader();
        reader.onloadend = () => {
          const newImage: SelectedImage = {
            id,
            preview: reader.result as string,
            status: 'uploading'
          };
          setSelectedImages(prev => [...prev, newImage]);
          uploadImage(file, id);
        };
        reader.readAsDataURL(file);
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
          const id = Math.random().toString(36).substring(7);
          const reader = new FileReader();
          reader.onloadend = () => {
            const newImage: SelectedImage = {
              id,
              preview: reader.result as string,
              status: 'uploading'
            };
            setSelectedImages(prev => {
              if (prev.length >= maxImages) return prev;
              return [...prev, newImage];
            });
            uploadImage(file, id);
          };
          reader.readAsDataURL(file);
          currentImageCount++;
        }
      }
    }
  };

  return (
    <div className="pb-24">
      <button 
        onClick={() => setIsCreateModalOpen(true)} 
        className={`fixed right-6 md:hidden w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-blue-700 transition-all active:scale-95 z-[999] ${scrollDirection === 'down' ? 'bottom-8' : 'bottom-24'}`}
      >
        <Plus size={28} />
      </button>
      {sharingPost && (
        <ShareModal 
          isOpen={sharingPost !== null} 
          onClose={() => setSharingPost(null)} 
          onShare={onShareViaChat} 
          post={sharingPost} 
          chats={chats}
          chatsLoading={chatsLoading}
          language={language}
          currentUser={user}
          users={users}
          followedUserIds={followedUserIds}
          followerUserIds={followerUserIds}
        />
      )}
      
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onPost={async (content, type, tags, imageUrls, docUrl, docName, eventId, title, showLinkPreview, linkPreviewUrl) => {
          await onAddPost(content, type, tags, imageUrls, docUrl, docName, eventId, title, showLinkPreview, linkPreviewUrl);
        }}
        user={user}
        language={language}
        userEvents={userEvents}
        users={users}
        initialContent={content}
        prefilledEvent={linkedEvent}
      />

      {/* STICKY/FIXED HEADER TABS */}
      <div className={`
        fixed top-16 left-0 right-0 z-50 md:sticky md:top-0 md:left-auto md:right-auto md:z-50 
        bg-white dark:bg-[#0a0a0a] border-gray-100 dark:border-zinc-900 border-b h-14 
        transition-transform duration-300 md:translate-y-0
        ${scrollDirection === 'down' ? '-translate-y-[calc(100%+64px)] md:translate-y-0' : 'translate-y-0'}
      `}>
        <div className="w-full h-full max-w-4xl mx-auto flex items-center justify-between px-2 md:px-0">
          <button onClick={() => handleTabChange('for-you')} className="flex-1 h-full text-xs font-bold relative group transition-all focus:outline-none whitespace-nowrap">
            <span className={activeTab === 'for-you' ? 'text-gray-900 dark:text-white' : 'text-gray-400'}>{t('for_you')}</span>
            {activeTab === 'for-you' && <div className="absolute bottom-0 left-0 h-1 bg-blue-600 w-full rounded-t-lg md:left-1/2 md:-translate-x-1/2 md:w-1/2" />}
          </button>
          <div className="w-px h-6 bg-gray-100 dark:bg-zinc-800" />
          <button onClick={() => handleTabChange('following')} className="flex-1 h-full text-xs font-bold relative group transition-all focus:outline-none whitespace-nowrap">
            <span className={activeTab === 'following' ? 'text-gray-900 dark:text-white' : 'text-gray-400'}>{t('following')}</span>
            {activeTab === 'following' && <div className="absolute bottom-0 left-0 h-1 bg-blue-600 w-full rounded-t-lg md:left-1/2 md:-translate-x-1/2 md:w-1/2" />}
          </button>
        </div>
      </div>

      <div className={`max-w-4xl mx-auto px-2 pb-4 md:px-6 md:pb-6 flex flex-col gap-3 pt-[136px] md:pt-6 transition-all duration-300 ${
        scrollDirection === 'down' ? '-translate-y-[120px]' : 'translate-y-0'
      }`}>
        {/* Hero Search Section - Only on Feed */}
        <div className="sm:block hidden">
          <div className="bg-white dark:bg-[#111] rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
            <div className="flex items-start space-x-4">
              <img src={getSafeAvatar(user.avatar)} className="w-12 h-12 rounded-full object-cover shrink-0" alt="" />
              <form onSubmit={handleSubmit} className="flex-1 min-w-0">
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={handleTextChange}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    placeholder={t('post_placeholder')}
                    className="w-full bg-transparent border-none text-xl text-slate-900 dark:text-white placeholder-slate-400 focus:ring-0 focus:outline-none resize-none min-h-[50px] p-0"
                  />
                  
                  {mentionQuery !== null && (
                    <div className="absolute left-0 top-full mt-2 w-64 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-zinc-800 z-[60] overflow-hidden shadow-2xl animate-in slide-in-from-top-2">
                      {mentionSuggestions.length > 0 ? mentionSuggestions.map(u => (
                        <button key={u.id} type="button" onClick={() => selectMention(u)} className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors text-left border-b border-gray-50 dark:border-zinc-800 last:border-0">
                          <img src={getSafeAvatar(u.avatar)} className="w-8 h-8 rounded-full object-cover" alt="" />
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{u.name} {u.lastName}</p>
                            <p className="text-xs text-blue-500">@{u.username}</p>
                          </div>
                        </button>
                      )) : (
                        <div className="px-4 py-3 text-sm text-gray-400 italic">No se encontraron usuarios</div>
                      )}
                    </div>
                  )}

                  {linkedEvent && (
                    <div className="mt-4 max-w-lg">
                      <EventPreview
                        event={linkedEvent}
                        language={language}
                        isCompact={false}
                        onRemove={() => setLinkedEvent(null)}
                      />
                    </div>
                  )}

                  {/* Link preview: sólo una a la vez — la primera URL no cerrada */}
                  {activePreviewUrl && (
                    <div className="mt-4 max-w-lg relative group/linkprev">
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

                <div className="mt-2 pt-2 border-t border-gray-100 dark:border-zinc-800">
                  {/* Image Grid Preview */}
                  {selectedImages.length > 0 && (
                    <div className="grid grid-cols-1 pr-3 md:pr-5 gap-2 mb-3 animate-in fade-in zoom-in-95 duration-200">
                      {selectedImages.length === 1 && (
                        <div className="relative group/img w-full aspect-[2/1]">
                          <img src={selectedImages[0].preview} alt="Preview" className="w-full h-full rounded-2xl object-cover border border-gray-100 dark:border-zinc-800 shadow-sm" />
                          {selectedImages[0].status === 'uploading' && (
                            <div className="absolute inset-0 bg-black/20 rounded-2xl flex items-center justify-center">
                              <Loader2 className="animate-spin text-white" size={32} />
                            </div>
                          )}
                          <button type="button" onClick={() => removeImage(0)} className="absolute top-3 right-3 p-2 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm text-gray-500 hover:text-red-500 rounded-full shadow-lg transition-all opacity-0 group-hover/img:opacity-100"><X size={18} /></button>
                        </div>
                      )}

                      {selectedImages.length === 2 && (
                        <div className="grid grid-cols-2 gap-2 w-full aspect-[2/1]">
                          {selectedImages.map((img, idx) => (
                            <div key={idx} className="relative group/img h-full">
                              <img src={img.preview} alt="Preview" className="w-full h-full rounded-2xl object-cover border border-gray-100 dark:border-zinc-800 shadow-sm" />
                              {img.status === 'uploading' && (
                                <div className="absolute inset-0 bg-black/20 rounded-2xl flex items-center justify-center">
                                  <Loader2 className="animate-spin text-white" size={24} />
                                </div>
                              )}
                              <button type="button" onClick={() => removeImage(idx)} className="absolute top-2 right-2 p-1.5 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm text-gray-500 hover:text-red-500 rounded-full shadow-lg transition-all opacity-0 group-hover/img:opacity-100"><X size={14} /></button>
                            </div>
                          ))}
                        </div>
                      )}

                      {selectedImages.length === 3 && (
                        <div className="grid grid-cols-2 grid-rows-2 gap-2 w-full aspect-[2/1]">
                          <div className="relative group/img row-span-2">
                            <img src={selectedImages[0].preview} alt="Preview" className="w-full h-full rounded-2xl object-cover border border-gray-100 dark:border-zinc-800 shadow-sm" />
                            {selectedImages[0].status === 'uploading' && (
                              <div className="absolute inset-0 bg-black/20 rounded-2xl flex items-center justify-center">
                                <Loader2 className="animate-spin text-white" size={32} />
                              </div>
                            )}
                            <button type="button" onClick={() => removeImage(0)} className="absolute top-2 right-2 p-1.5 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm text-gray-500 hover:text-red-500 rounded-full shadow-lg transition-all opacity-0 group-hover/img:opacity-100"><X size={14} /></button>
                          </div>
                          {selectedImages.slice(1).map((img, idx) => (
                            <div key={idx + 1} className="relative group/img h-full">
                              <img src={img.preview} alt="Preview" className="w-full h-full rounded-2xl object-cover border border-gray-100 dark:border-zinc-800 shadow-sm" />
                              {img.status === 'uploading' && (
                                <div className="absolute inset-0 bg-black/20 rounded-2xl flex items-center justify-center">
                                  <Loader2 className="animate-spin text-white" size={24} />
                                </div>
                              )}
                              <button type="button" onClick={() => removeImage(idx + 1)} className="absolute top-2 right-2 p-1.5 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm text-gray-500 hover:text-red-500 rounded-full shadow-lg transition-all opacity-0 group-hover/img:opacity-100"><X size={14} /></button>
                            </div>
                          ))}
                        </div>
                      )}

                      {selectedImages.length === 4 && (
                        <div className="grid grid-cols-2 grid-rows-2 gap-2 w-full aspect-[2/1]">
                          {selectedImages.map((img, idx) => (
                            <div key={idx} className="relative group/img h-full">
                              <img src={img.preview} alt="Preview" className="w-full h-full rounded-2xl object-cover border border-gray-100 dark:border-zinc-800 shadow-sm" />
                              {img.status === 'uploading' && (
                                <div className="absolute inset-0 bg-black/20 rounded-2xl flex items-center justify-center">
                                  <Loader2 className="animate-spin text-white" size={24} />
                                </div>
                              )}
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
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-zinc-800 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent" disabled={selectedImages.length >= 4 || canShowLinkPreview || !!linkedEvent} title={canShowLinkPreview ? 'Quita la previsualización del enlace para adjuntar imágenes' : linkedEvent ? 'Quita el evento para adjuntar imágenes' : ''}><ImageIcon size={20} /></button>
                      <div className="relative">
                        <button
                          ref={eventButtonRef}
                          type="button"
                          onClick={() => setShowEventDropdown(!showEventDropdown)}
                          disabled={canShowLinkPreview || selectedImages.length > 0}
                          title={canShowLinkPreview ? 'Quita la previsualización del enlace para adjuntar un evento' : selectedImages.length > 0 ? 'Quita las imágenes para adjuntar un evento' : ''}
                          className={`p-2 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent ${showEventDropdown || linkedEvent ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' : 'text-blue-500 hover:bg-blue-50 dark:hover:bg-zinc-800'}`}
                        >
                          <Calendar size={20} />
                        </button>
                        
                        {showEventDropdown && (
                          <div ref={dropdownRef} className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-zinc-800 z-50 overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-200">
                            <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between bg-gray-50 dark:bg-zinc-900/50">
                              <span className="text-xs font-black text-gray-500 uppercase tracking-widest">{t('your_events')}</span>
                              <button type="button" onClick={() => setShowEventDropdown(false)}><X size={14} className="text-gray-400" /></button>
                            </div>
                            <div className="max-h-60 overflow-y-auto custom-scrollbar">
                              {userEvents && userEvents.length > 0 ? userEvents.map(event => (
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
                                  <p className="text-xs text-gray-400 italic">No tienes eventos publicados</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting || selectedImages.some(img => img.status === 'uploading') || (!content.trim() && selectedImages.length === 0 && !selectedDoc && !linkedEvent)}
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
        </div>

        {hasNewContent && onRefresh && (
          <button onClick={onRefresh} className="fixed top-24 left-1/2 -translate-x-1/2 z-40 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-blue-700 transition-all flex items-center space-x-2 animate-in slide-in-from-top-4">
            <RefreshCw size={16} />
            <span className="text-sm font-bold">Nuevas publicaciones</span>
          </button>
        )}

        <div className="space-y-4">
          {filteredPosts.length > 0 ? (
            filteredPosts.map(post => {
              try {
                return (
                  <div key={post.id}>
                    <PostCard
                      post={post}
                      onLike={onLike}
                      onVote={onVote}
                      onRepost={onRepost}
                      onAddComment={onAddComment}
                      onLikeComment={onLikeComment}
                      onLikeReply={onLikeReply}
                      onDeletePost={onDeletePost}
                      onSearchHashtag={onSearchHashtag}
                      currentUser={user}
                      onOpenShare={setSharingPost}
                      onNavigateToProfile={onNavigateToProfile}
                      onNavigateToPost={onNavigateToPost}
                      followedUserIds={followedUserIds}
                      followerUserIds={followerUserIds}
                      onToggleFollow={onToggleFollow}
                      users={users}
                      language={language}
                      onNavigateToEvent={onNavigateToEvent}
                      chats={chats}
                      showMenu={false}
                      isPinned={pinnedPosts.has(post.id)}
                      onTogglePin={onTogglePin}
                      likedIds={likedIds}
                      votedUpIds={votedUpIds}
                      votedDownIds={votedDownIds}
                      repostedIds={repostedIds}
                    />
                  </div>
                );
              } catch (err) {
                console.error('Error rendering PostCard for post', post.id, err);
                return null;
              }
            })
          ) : (isLoading || !feedFetched) ? (
            // Skeleton Loader for Instant Feel — shown while loading OR before first fetch completes
            [1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-[#111] rounded-[2rem] p-6 border border-gray-100 dark:border-zinc-800 animate-pulse">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-zinc-800 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-1/4" />
                    <div className="h-3 bg-gray-200 dark:bg-zinc-800 rounded w-1/6" />
                  </div>
                </div>
                <div className="space-y-3 px-16">
                  <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-full" />
                  <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-5/6" />
                  <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-4/6" />
                </div>
                <div className="mt-6 flex items-center justify-between px-16">
                   <div className="h-8 w-16 bg-gray-100 dark:bg-zinc-900 rounded-xl" />
                   <div className="h-8 w-16 bg-gray-100 dark:bg-zinc-900 rounded-xl" />
                   <div className="h-8 w-16 bg-gray-100 dark:bg-zinc-900 rounded-xl" />
                </div>
              </div>
            ))
          ) : showEmpty ? (
            <div className="bg-white dark:bg-[#111] rounded-[2rem] p-12 text-center border border-gray-100 dark:border-zinc-800 shadow-sm animate-in fade-in duration-500">
              <div className="w-20 h-20 bg-gray-50 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles size={40} className="text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No hay publicaciones aún</h3>
              <p className="text-gray-500 max-w-sm mx-auto">Sigue a otros usuarios o publica algo para empezar a ver contenido en tu feed.</p>
            </div>
          ) : null}
          
          <div ref={sentinelRef} className="h-1" />

          {isLoadingMore && (
            <div className="flex justify-center py-8">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 border-4 border-blue-600/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            </div>
          )}

          {!hasMore && (posts.length > 0 || pinnedPosts.size > 0) && !isLoadingMore && (
            <div className="py-6 flex flex-col items-center justify-center space-y-3">
              <div className="h-px w-12 bg-gray-100 dark:bg-zinc-800" />
              <p className="text-[10px] font-black text-gray-400 dark:text-zinc-600 uppercase tracking-[0.2em]">
                {t('end_of_results')}
              </p>
              <Sparkles size={16} className="text-gray-200 dark:text-zinc-800" />
            </div>
          )}

      </div>
    </div>
  </div>
);
};
