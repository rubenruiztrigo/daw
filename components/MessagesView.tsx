import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Send, Info, MessageSquare, Check, CheckCheck, Sparkles, X, ArrowLeft, Link as LinkIcon, Image as ImageIcon, Loader2, Calendar, Pencil, Ban, Trash2, MapPin, ChevronRight, ChevronLeft, Clock } from 'lucide-react';
import { User, Chat, Message, Post, CalendarEvent } from '../types';
import { normalizeString, timeAgo, extractFirstUrl, isExternalUrl, parseInternalAppUrl } from '../utils/stringUtils';
import { supabase } from '../supabaseClient';
import { Language, useTranslation } from '../utils/translations';
import { LinkPreview, getOrFetchPreview } from './LinkPreview';
import { RENDER_REGEX, getUserByMention } from '../utils/mentionUtils';
import { getSafeAvatar } from '../utils/avatarUtils';
import { compressImage } from '../utils/imageUtils';
/*  */
interface MessagesViewProps {
  user: User;
  chats: Chat[];
  posts: Post[];
  users?: User[];
  onSendMessage: (recipientId: string, text: string, postId?: string, sharedProfileId?: string, sharedEventId?: string, imageUrls?: string[], newsId?: string, scheduledAt?: Date) => Promise<void>;
  onViewPost?: (postId: string, type?: 'post' | 'news') => void;
  onLike?: (id: string) => void;
  onVote?: (id: string, dir: 'up' | 'down') => void;
  onAddComment?: (postId: string, text: string) => void;
  onNavigateToProfile?: (userId: string) => void;
  onMarkChatAsRead?: (chatId: string) => void;
  externalActiveId?: string | null;
  onNavigateToEvent?: (userId: string, eventId: string) => void;
  onEditMessage: (recipientId: string, messageId: string, text: string) => Promise<void>;
  onDeleteMessage: (recipientId: string, messageId: string) => Promise<void>;
  globalEvents: CalendarEvent[];
  language: Language;
  onRefreshChats?: () => void;
  onFetchChatMessages?: (recipientId: string, offset?: number) => Promise<void>;
  chatsLoading?: boolean;
  chatHasMore?: boolean;
  messagesLoading?: boolean;
}

export const MessagesView: React.FC<MessagesViewProps> = ({
  user, chats, posts, users = [], onSendMessage, onViewPost, onLike, onVote, onAddComment, onNavigateToProfile, onMarkChatAsRead, externalActiveId, onNavigateToEvent, globalEvents, language, onEditMessage, onDeleteMessage, onRefreshChats, onFetchChatMessages, chatsLoading, chatHasMore, messagesLoading
}) => {
  const renderContent = (content: string, isOwn: boolean, urlsToHide: string[] = []) => {
    if (!content) return null;
    const parts = content.split(RENDER_REGEX);
    const hiddenUrls = new Set<string>();
    const linkColor = isOwn ? 'text-blue-200' : 'text-blue-600 dark:text-blue-400';
    const mentionColor = isOwn ? 'text-white' : 'text-purple-600 dark:text-purple-400';
    const hashtagColor = isOwn ? 'text-blue-200' : 'text-blue-600 dark:text-blue-400';

    return parts.map((part, i) => {
      const trimmedPart = part.trim();
      if (trimmedPart.startsWith('#')) {
        return (
          <span key={i} className={`${hashtagColor} font-bold`}>
            {part}
          </span>
        );
      } else if (trimmedPart.startsWith('@')) {
        const mentionedUser = getUserByMention(trimmedPart, users);
        if (!mentionedUser) return part;
        return (
          <button
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              onNavigateToProfile?.(mentionedUser.id);
            }}
            className={`${mentionColor} font-bold hover:underline transition-all`}
          >
            @{mentionedUser.username}
          </button>
        );
      }
      else if (part.startsWith('http')) {
        if (urlsToHide.includes(part) && !hiddenUrls.has(part)) {
          hiddenUrls.add(part);
          return null;
        }
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={`${linkColor} hover:underline transition-all font-medium break-all`}
          >
            {part}
          </a>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();

  // Synchronous helpers — run during render, no paint delay
  const resolveChatIdFromCache = (cid: string | undefined): string | null => {
    if (!cid || !user.id) return null;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cid);
    if (isUUID) return cid;
    try {
      const raw = localStorage.getItem(`chat_list_${user.id}`);
      if (raw) {
        const found = JSON.parse(raw).find((c: any) => c.participant?.username === cid || c.id === cid);
        if (found?.id) return found.id;
      }
    } catch {}
    return null;
  };

  const getParticipantFromCache = (cid: string | undefined): Partial<User> | null => {
    if (!cid || !user.id) return null;
    try {
      const raw = localStorage.getItem(`chat_list_${user.id}`);
      if (raw) {
        const found = JSON.parse(raw).find((c: any) => c.participant?.username === cid || c.id === cid);
        if (found?.participant) return found.participant;
      }
    } catch {}
    return null;
  };

  // Lazy inits — run synchronously on first render, before any browser paint
  const [resolvedId, setResolvedId] = useState<string | null>(() => resolveChatIdFromCache(chatId));
  const [cachedParticipant] = useState<Partial<User> | null>(() => getParticipantFromCache(chatId));

  // Helper: resolve chatId → cached messages synchronously (no async, no paint delay)
  const readCachedMessages = (cid: string | undefined): any[] => {
    if (!cid || !user.id) return [];
    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cid);
      let recipientId: string | null = isUUID ? cid : null;
      if (!recipientId) {
        const sidebarRaw = localStorage.getItem(`chat_list_${user.id}`);
        if (sidebarRaw) {
          const found = JSON.parse(sidebarRaw).find((c: any) => c.participant?.username === cid || c.id === cid);
          if (found?.id) recipientId = found.id;
        }
      }
      if (recipientId) {
        const msgRaw = localStorage.getItem(`chat_msgs_${user.id}_${recipientId}`);
        if (msgRaw) {
          const parsed = JSON.parse(msgRaw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            let eventsMap: Map<string, any> | null = null;
            let inlinePostsMap: Record<string, any> | null = null;
            return parsed.map((m: any) => {
              const base = { ...m, timestamp: new Date(m.timestamp) };
              let result = base;
              // Resolve missing sharedEvent: dedicated chat events cache first, then global
              if (m.sharedEventId && !m.sharedEvent) {
                if (!eventsMap) {
                  eventsMap = new Map();
                  try {
                    const evRaw = localStorage.getItem('global_events_cache');
                    const evParsed = evRaw ? JSON.parse(evRaw) : [];
                    const evArr = Array.isArray(evParsed) ? evParsed : (Array.isArray(evParsed?.data) ? evParsed.data : []);
                    evArr.forEach((e: any) => eventsMap!.set(e.id, e));
                  } catch {}
                  try {
                    const chatEvRaw = localStorage.getItem(`chat_shared_events_${user.id}`);
                    if (chatEvRaw) Object.values(JSON.parse(chatEvRaw)).forEach((e: any) => eventsMap!.set(e.id, e));
                  } catch {}
                }
                result = { ...result, sharedEvent: eventsMap.get(m.sharedEventId) || null };
              }
              // Resolve missing inlineSharedPost from shared inline-posts cache
              const postId = m.postId || m.newsId;
              if (postId && !m.inlineSharedPost) {
                if (!inlinePostsMap) {
                  try {
                    inlinePostsMap = JSON.parse(localStorage.getItem(`chat_inline_posts_${user.id}`) || '{}');
                  } catch { inlinePostsMap = {}; }
                }
                if (inlinePostsMap![postId]) result = { ...result, inlineSharedPost: inlinePostsMap![postId] };
              }
              return result;
            });
          }
        }
      }
    } catch {}
    return [];
  };

  // Lazy initializer — runs synchronously during first render, before any browser paint
  const [instantMessages, setInstantMessages] = useState<any[]>(() => readCachedMessages(chatId));
  const [optimisticMessages, setOptimisticMessages] = useState<any[]>([]);

  useEffect(() => {
    onRefreshChats?.();
  }, []);

  // Update instantMessages when chatId changes (back/forward navigation, sidebar clicks)
  useEffect(() => {
    setInstantMessages(readCachedMessages(chatId));
  }, [chatId]);


  useEffect(() => {
    if (!chatId) {
      setResolvedId(null);
      return;
    }

    // Priorizar búsqueda en chats existentes para resolución instantánea
    const existingChat = chats.find(c => c.participant.username === chatId || c.id === chatId);
    if (existingChat) {
      setResolvedId(existingChat.id);
      // Redirección canónica a username si tenemos el ID en la URL
      if (existingChat.id === chatId && existingChat.participant.username && existingChat.participant.username !== chatId) {
        navigate(`/mensajes/${existingChat.participant.username}`, { replace: true });
      }
      return;
    }

    // Si chatId coincide con algún username o ID en el listado global de usuarios
    const matchingUser = users.find(u => u.username === chatId || u.id === chatId);
    if (matchingUser) {
      setResolvedId(matchingUser.id);
      if (!cachedParticipant) setTemporaryParticipant(matchingUser);
      // Redirección canónica if matchingUser has username but URL uses ID
      if (matchingUser.id === chatId && matchingUser.username && matchingUser.username !== chatId) {
        navigate(`/mensajes/${matchingUser.username}`, { replace: true });
      }
    } else {
      // Intentar una busqueda en remoto asincrona si no lo tenemos (esto pasa en recargas F5)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(chatId || '');
      const orFilter = isUUID ? `username.eq.${chatId},id.eq.${chatId}` : `username.eq.${chatId}`;
      supabase.from('profiles').select('id, name, last_name, username, avatar, position, institution').or(orFilter).maybeSingle()
        .then(({ data }) => {
          if (data) {
            setResolvedId(data.id);
            if (!cachedParticipant) {
              setTemporaryParticipant({ id: data.id, name: data.name, lastName: data.last_name, username: data.username, avatar: getSafeAvatar(data.avatar), position: data.position, institution: data.institution });
            }
            if (data.id === chatId && data.username && data.username !== chatId) {
              navigate(`/mensajes/${data.username}`, { replace: true });
            }
          }
          else setResolvedId(chatId);
        });
    }
  }, [chatId, users, chats, navigate]);

  // When resolvedId becomes a valid UUID (including on page refresh), immediately load
  // that conversation's messages without waiting for the full fetchChats to complete
  const isUUIDFormat = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str || '');
  useEffect(() => {
    if (resolvedId && isUUIDFormat(resolvedId)) {
      // Read localStorage cache directly — same zero-latency path as handleChatClick
      try {
        const cacheKey = `chat_msgs_${user.id}_${resolvedId}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setInstantMessages(parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
          }
        }
      } catch {}
      onFetchChatMessages?.(resolvedId);
    }
  }, [resolvedId]);

  const selectedId = useMemo(() => {
    if (resolvedId) return resolvedId;
    if (chatId && isUUIDFormat(chatId)) return chatId;
    return externalActiveId || null;
  }, [resolvedId, chatId, externalActiveId]);
  const t = useTranslation(language);

  const [messageOffset, setMessageOffset] = useState(0);
  const [isLoadingMoreMessages, setIsLoadingMoreMessages] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const prevScrollHeightRef = useRef(0);

  // Reset pagination when the active chat changes
  useEffect(() => {
    setMessageOffset(0);
    setIsLoadingMoreMessages(false);
    setShowScrollToBottom(false);
  }, [selectedId]);

  const [msg, setMsg] = useState('');
  const [chatSearchTerm, setChatSearchTerm] = useState('');
  const [visibleChatCount, setVisibleChatCount] = useState(15);

  const handleChatClick = async (chatId: string, navigationPath: string) => {
    // 1. Resolve UUID immediately if it's from sidebar (which always passes UUID as chatId)
    if (isUUIDFormat(chatId)) {
      setResolvedId(chatId);
    }
    
    // 2. Set instant messages for zero-delay UI update
    setInstantMessages(readCachedMessages(chatId));
    
    // 3. Trigger fetch (parent manages deduplication)
    onFetchChatMessages?.(chatId);
    
    // 4. Navigate
    navigate(navigationPath);
  };
  const [temporaryParticipant, setTemporaryParticipant] = useState<User | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const getDisplayName = (name: string | undefined, username: string | undefined, lastName?: string) => {
    const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str || '');
    const fullName = `${name || ''} ${lastName || ''}`.trim();
    if (!fullName || fullName === 'Usuario' || isUUID(name || '')) {
      return username ? `@${username}` : (fullName || 'Usuario');
    }
    return fullName;
  };

  const getChatNavigationIdentifier = (participant: Partial<User> | undefined, chatId: string) => {
    const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str || '');
    if (participant?.username && !isUUID(participant.username)) return participant.username;
    return chatId;
  };
  const shouldAutoScrollRef = useRef(true);
  const scrollSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editContainerRef = useRef<HTMLDivElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImageGallery, setSelectedImageGallery] = useState<{ urls: string[], index: number } | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, messageId: string | null } | null>(null);
  const longPressTimer = useRef<any>(null);
  const sendButtonLongPressTimer = useRef<any>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const sendButtonContextMenuRef = useRef<HTMLDivElement>(null);

  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduledAt, setScheduledAt] = useState<string>('');
  const [sendButtonContextMenu, setSendButtonContextMenu] = useState<{ x: number, y: number } | null>(null);
  const [scheduledCount, setScheduledCount] = useState(0);
  const [showScheduledList, setShowScheduledList] = useState(false);
  const [scheduledMessages, setScheduledMessages] = useState<any[]>([]);
  const [pendingImages, setPendingImages] = useState<string[]>([]);

  const navigateGallery = useCallback((direction: number) => {
    setIsZoomed(false);
    setSelectedImageGallery(prev => {
      if (!prev) return null;
      let newIndex = prev.index + direction;
      if (newIndex < 0) newIndex = prev.urls.length - 1;
      if (newIndex >= prev.urls.length) newIndex = 0;
      return { ...prev, index: newIndex };
    });
  }, []);

  const handleTouchStartGallery = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEndGallery = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const currentTouchX = e.changedTouches[0].clientX;
    const diff = touchStart - currentTouchX;

    if (diff > 50) {
      navigateGallery(1); // Swipe left -> next
    } else if (diff < -50) {
      navigateGallery(-1); // Swipe right -> prev
    }
    setTouchStart(null);
  };

  useEffect(() => {
    const handleGalleryKey = (e: KeyboardEvent) => {
      if (!selectedImageGallery) return;
      if (e.key === 'ArrowLeft') navigateGallery(-1);
      if (e.key === 'ArrowRight') navigateGallery(1);
      if (e.key === 'Escape') setSelectedImageGallery(null);
    };
    window.addEventListener('keydown', handleGalleryKey);
    return () => window.removeEventListener('keydown', handleGalleryKey);
  }, [selectedImageGallery, navigateGallery]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !selectedId) return;
    
    const files = Array.from(e.target.files);
    if (pendingImages.length + files.length > 10) {
      alert('Máximo 10 imágenes permitidas.');
      return;
    }

    setIsUploading(true);
    const newUploads: string[] = [];

    try {
      for (const file of files as File[]) {
        if (file.size > 5 * 1024 * 1024) {
          alert(`${t('image_too_large') || 'Imagen demasiado grande'}: ${file.name}`);
          continue;
        }

        const compressedBlob = await compressImage(file);
        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('chat-images')
          .upload(filePath, compressedBlob);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('chat-images')
          .getPublicUrl(filePath);
        
        newUploads.push(publicUrl);
      }
      
      setPendingImages(prev => [...prev, ...newUploads]);
      shouldAutoScrollRef.current = true;
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error al subir una o más imágenes.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const fetchParticipantProfile = async (uid: string) => {
    const fromUsers = users.find(u => u.id === uid);
    if (fromUsers) { setTemporaryParticipant(fromUsers); return; }
    const { data } = await supabase.from('profiles').select('id, name, last_name, username, avatar, position, institution, followers_count, following_count, bio, interests').eq('id', uid).maybeSingle();
    if (data) {
      setTemporaryParticipant({
        id: data.id,
        name: data.name,
        lastName: data.last_name,
        avatar: getSafeAvatar(data.avatar),
        position: data.position,
        institution: data.institution,
        followers: data.followers_count,
        following: data.following_count,
        bio: data.bio || '',
        interests: data.interests || [],
        username: data.username
      });
    }
  };

  const fetchScheduledCount = useCallback(async () => {
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedId || '');
    if (!user.id || !selectedId || !isValidUUID) {
      setScheduledCount(0);
      setScheduledMessages([]);
      return;
    }
    const { data, count, error } = await supabase
      .from('scheduled_messages')
      .select('*', { count: 'exact' })
      .eq('sender_id', user.id)
      .eq('recipient_id', selectedId)
      .order('deliver_at', { ascending: true });
      
    if (!error) {
      setScheduledCount(count || 0);
      setScheduledMessages(data || []);
    }
  }, [user.id, selectedId]);

  useEffect(() => {
    fetchScheduledCount();

    if (!user.id || !selectedId) return;

    const channel = supabase
      .channel('scheduled_messages_count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scheduled_messages',
          filter: `sender_id=eq.${user.id}`
        },
        () => {
          fetchScheduledCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id, selectedId, fetchScheduledCount]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const isAtBottom = distanceFromBottom < 100;
    shouldAutoScrollRef.current = isAtBottom;
    setShowScrollToBottom(distanceFromBottom > 300);

    // Debounced save of scroll position per chat
    if (selectedId) {
      if (scrollSaveTimerRef.current) clearTimeout(scrollSaveTimerRef.current);
      scrollSaveTimerRef.current = setTimeout(() => {
        try {
          const saved = JSON.parse(localStorage.getItem('chat_scroll_positions') || '{}');
          if (isAtBottom) {
            delete saved[selectedId];
          } else {
            saved[selectedId] = distanceFromBottom;
          }
          localStorage.setItem('chat_scroll_positions', JSON.stringify(saved));
        } catch {}
      }, 300);
    }

    // Load older messages when user scrolls near the top
    if (scrollTop < 80 && chatHasMore && !isLoadingMoreMessages && selectedId) {
      const nextOffset = messageOffset + 15;
      setIsLoadingMoreMessages(true);
      prevScrollHeightRef.current = scrollHeight;
      setMessageOffset(nextOffset);
      onFetchChatMessages?.(selectedId, nextOffset).finally(() => {
        setIsLoadingMoreMessages(false);
        // Restore scroll after the DOM has painted the new messages.
        // requestAnimationFrame guarantees the render cycle is complete before we measure.
        requestAnimationFrame(() => {
          if (scrollContainerRef.current && prevScrollHeightRef.current > 0) {
            const newScrollHeight = scrollContainerRef.current.scrollHeight;
            if (newScrollHeight > prevScrollHeightRef.current) {
              scrollContainerRef.current.scrollTop = newScrollHeight - prevScrollHeightRef.current;
            }
            prevScrollHeightRef.current = 0;
          }
        });
      });
    }
  };

  useEffect(() => {
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedId || '');
    if (selectedId && isValidUUID) {
      const existingChat = chats.find(c => c.id === selectedId);
      if (existingChat) {
        setTemporaryParticipant(null);
      } else {
        fetchParticipantProfile(selectedId);
      }
    } else {
      setTemporaryParticipant(null);
    }
  }, [selectedId, chats]);

  // Track previous selectedId to distinguish chat-entry (instant) from new-message (smooth)
  const prevSelectedIdRef = useRef<string | null>(null);

  useEffect(() => {
    shouldAutoScrollRef.current = true;
  }, [selectedId]);

  useEffect(() => {
    if (!scrollContainerRef.current) return;
    if (shouldAutoScrollRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
    prevSelectedIdRef.current = selectedId;
  }, [selectedId, chats, onMarkChatAsRead]);

  // Mark chat as read whenever: the active chat changes OR new messages arrive while the chat is open
  useEffect(() => {
    if (!selectedId) return;
    const chat = chats.find(c => c.id === selectedId);
    const hasUnread = chat?.messages.some(m => m.senderId === selectedId && !m.isRead);
    if (hasUnread) {
      onMarkChatAsRead?.(selectedId);
    }
  }, [selectedId, chats, onMarkChatAsRead]);

  const [hiddenMessageIds, setHiddenMessageIds] = useState<Set<string>>(new Set());

  // Local preview cache — pre-seeded from localStorage so first render already has data.
  const [localPreviews, setLocalPreviews] = useState<Map<string, any>>(() => {
    const map = new Map<string, any>();
    try {
      const posts = JSON.parse(localStorage.getItem('chat_inline_posts_seed') || 'null');
      if (posts) Object.entries(posts).forEach(([k, v]) => map.set(k, v));
    } catch {}
    try {
      const evts = JSON.parse(localStorage.getItem('chat_shared_events_seed') || 'null');
      if (evts) Object.entries(evts).forEach(([k, v]) => map.set(k, v));
    } catch {}
    try {
      const profs = JSON.parse(localStorage.getItem('chat_shared_profiles_seed') || 'null');
      if (profs) Object.entries(profs).forEach(([k, v]) => map.set(k, v));
    } catch {}
    return map;
  });
  const fetchingPreviewIds = React.useRef<Set<string>>(new Set());

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (editContainerRef.current && !editContainerRef.current.contains(event.target as Node)) {
        setEditingMessageId(null);
      }
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(null);
      }
      if (sendButtonContextMenuRef.current && !sendButtonContextMenuRef.current.contains(event.target as Node)) {
        setSendButtonContextMenu(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowScheduler(false);
        setSendButtonContextMenu(null);
        setContextMenu(null);
      }
    };

    if (editingMessageId || contextMenu || sendButtonContextMenu || showScheduler) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [editingMessageId, contextMenu, sendButtonContextMenu, showScheduler]);

  const filteredChats = useMemo(() => {
    setVisibleChatCount(15);
    const query = normalizeString(chatSearchTerm);
    if (!query) return chats;
    return chats.filter(chat => {
      const fullName = normalizeString(`${chat.participant.name} ${chat.participant.lastName || ''}`);
      return fullName.includes(query) || chat.messages.some(m => normalizeString(m.text).includes(query));
    });
  }, [chats, chatSearchTerm]);

  const selectedChat = useMemo(() => {
    if (selectedId) {
      const chat = chats.find(c => c.id === selectedId);
      if (chat) return chat;
    }
    return null;
  }, [chats, selectedId]);

  // Fallback: fetch preview data directly when inlineSharedPost/sharedEvent/sharedProfile is null.
  // Runs after selectedChat or instantMessages change; only fetches IDs not yet resolved.
  useEffect(() => {
    const msgs: any[] = selectedChat?.messages?.length ? selectedChat.messages : instantMessages;
    if (!msgs.length) return;

    const needPost  = msgs.filter((m: any) => m.postId        && !m.inlineSharedPost && !localPreviews.has(m.postId)        && !fetchingPreviewIds.current.has(m.postId));
    const needNews  = msgs.filter((m: any) => m.newsId        && !m.inlineSharedPost && !localPreviews.has(m.newsId)        && !fetchingPreviewIds.current.has(m.newsId));
    const needEvent = msgs.filter((m: any) => m.sharedEventId   && !m.sharedEvent      && !localPreviews.has(m.sharedEventId)   && !fetchingPreviewIds.current.has(m.sharedEventId));
    const needProf  = msgs.filter((m: any) => m.sharedProfileId && !m.sharedProfile     && !localPreviews.has(m.sharedProfileId) && !fetchingPreviewIds.current.has(m.sharedProfileId));

    if (!needPost.length && !needNews.length && !needEvent.length && !needProf.length) return;

    const postIds  = [...new Set<string>(needPost.map((m: any)  => m.postId as string))];
    const newsIds  = [...new Set<string>(needNews.map((m: any)  => m.newsId as string))];
    const eventIds = [...new Set<string>(needEvent.map((m: any) => m.sharedEventId as string))];
    const profIds  = [...new Set<string>(needProf.map((m: any)  => m.sharedProfileId as string))];
    [...postIds, ...newsIds, ...eventIds, ...profIds].forEach(id => fetchingPreviewIds.current.add(id));

    (async () => {
      const [postsRes, newsRes, eventsRes, profsRes] = await Promise.all([
        postIds.length  ? supabase.from('posts').select('id, content, image_url, author_id, type, created_at').in('id', postIds)                                        : Promise.resolve({ data: [] as any[] }),
        newsIds.length  ? supabase.from('news').select('id, titulo, content, image_url, author_id, created_at').in('id', newsIds)                                       : Promise.resolve({ data: [] as any[] }),
        eventIds.length ? supabase.from('user_events').select('id, title, event_date, event_time, location, image_url, description, creator_id').in('id', eventIds)     : Promise.resolve({ data: [] as any[] }),
        profIds.length  ? supabase.from('profiles').select('id, name, last_name, avatar, username, position, institution').in('id', profIds)                             : Promise.resolve({ data: [] as any[] }),
      ]);

      const rawItems = [...(postsRes.data || []), ...(newsRes.data || [])];
      const authorIds = [...new Set<string>(rawItems.map((p: any) => p.author_id).filter(Boolean))];
      const authorMap = new Map<string, any>();
      if (authorIds.length) {
        const { data: authData } = await supabase.from('profiles').select('id, name, last_name, avatar, username, position, is_organization').in('id', authorIds);
        (authData || []).forEach((a: any) => authorMap.set(a.id, a));
      }

      const toImgUrls = (raw: any) => !raw ? null : Array.isArray(raw) ? (raw.length > 0 ? raw : null) : [raw];
      const next = new Map(localPreviews);

      (postsRes.data || []).forEach((p: any) => {
        const a = authorMap.get(p.author_id);
        next.set(p.id, { id: p.id, type: p.type || 'post', content: p.content || '', imageUrl: toImgUrls(p.image_url), title: null, authorId: p.author_id, authorName: a ? `${a.name || ''} ${a.last_name || ''}`.trim() : '', authorAvatar: a?.avatar || null, authorUsername: a?.username || null, authorPosition: a?.position || '', authorIsOrganization: a?.is_organization || false, timestamp: p.created_at ? new Date(p.created_at) : new Date() });
      });
      (newsRes.data || []).forEach((n: any) => {
        const a = authorMap.get(n.author_id);
        next.set(n.id, { id: n.id, type: 'news', content: n.content || '', imageUrl: toImgUrls(n.image_url), title: n.titulo || '', authorId: n.author_id || null, authorName: a ? `${a.name || ''} ${a.last_name || ''}`.trim() : '', authorAvatar: a?.avatar || null, authorUsername: a?.username || null, authorPosition: a?.position || '', authorIsOrganization: a?.is_organization || false, timestamp: n.created_at ? new Date(n.created_at) : new Date() });
      });
      (eventsRes.data || []).forEach((e: any) => next.set(e.id, e));
      (profsRes.data || []).forEach((p: any) => next.set(p.id, { id: p.id, name: p.name || '', lastName: p.last_name || '', username: p.username || '', avatar: p.avatar || null, position: p.position || '', institution: p.institution || '' }));

      if (next.size > localPreviews.size) {
        setLocalPreviews(next);
        // Persist to seed caches so next page load reads them instantly
        try {
          const postsObj: Record<string, any> = {};
          const evtsObj: Record<string, any> = {};
          const profsObj: Record<string, any> = {};
          next.forEach((v, k) => {
            if (v?.type === 'post' || v?.type === 'news') postsObj[k] = v;
            else if (v?.event_date !== undefined || v?.event_time !== undefined) evtsObj[k] = v;
            else if (v?.username !== undefined) profsObj[k] = v;
          });
          localStorage.setItem('chat_inline_posts_seed', JSON.stringify(postsObj));
          localStorage.setItem('chat_shared_events_seed', JSON.stringify(evtsObj));
          localStorage.setItem('chat_shared_profiles_seed', JSON.stringify(profsObj));
        } catch {}
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChat?.messages, instantMessages]);

  // Prefetch external link previews as soon as chat messages load
  useEffect(() => {
    const msgs = selectedChat?.messages || [];
    if (!msgs.length) return;

    msgs.forEach((m) => {
      if (m.text && !m.is_deleted) {
        const firstUrl = extractFirstUrl(m.text);
        if (firstUrl && isExternalUrl(firstUrl)) {
          getOrFetchPreview(firstUrl);
        }
      }
    });
  }, [selectedChat?.messages]);

  const handleSend = async (e: React.FormEvent, isScheduled: boolean = false) => {
    e.preventDefault();
    if (sendButtonContextMenu) return;
    if ((!msg.trim() && pendingImages.length === 0) || !selectedId) return;

    if (isScheduled && !scheduledAt) {
      setShowScheduler(true);
      return;
    }

    shouldAutoScrollRef.current = true;
    const currentMsg = msg;
    const currentImages = [...pendingImages];
    setMsg('');
    setPendingImages([]);

    if (!isScheduled) {
      // Optimistic: show message immediately before server round-trip
      const optimistic = {
        id: `optimistic-${Date.now()}`,
        senderId: user.id,
        recipientId: selectedId,
        text: currentMsg,
        timestamp: new Date(),
        imageUrl: currentImages,
        isRead: false,
        _optimistic: true,
      };
      setOptimisticMessages(prev => [...prev, optimistic]);
    }

    if (isScheduled) {
      const scheduledDate = new Date(scheduledAt);
      setShowScheduler(false);
      setScheduledAt('');
      await onSendMessage(selectedId, currentMsg, undefined, undefined, undefined, currentImages, undefined, scheduledDate);
      fetchScheduledCount();
    } else {
      await onSendMessage(selectedId, currentMsg, undefined, undefined, undefined, currentImages, undefined, undefined);
    }
  };

  const handleEditSubmit = async (messageId: string) => {
    if (!editingText.trim() || !selectedId) return;
    try {
      await onEditMessage(selectedId, messageId, editingText);
      setEditingMessageId(null);
      setEditingText('');
    } catch (err) {
      console.error('Failed to edit message:', err);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, messageId: string, isOwn: boolean) => {
    if (!isOwn) return;
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    // Position menu to the left of the bubble with a clear gap (~40px)
    setContextMenu({
      x: rect.left - 190, // 150px min-width + 40px gap
      y: rect.top,
      messageId
    });
  };

  const handleTouchStart = (messageId: string, isOwn: boolean, e: React.TouchEvent) => {
    if (!isOwn) return;
    const touch = e.touches[0];
    const x = touch.clientX;
    const y = touch.clientY;
    longPressTimer.current = setTimeout(() => {
      setContextMenu({ x, y, messageId });
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleSendButtonContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!msg.trim() && pendingImages.length === 0) return;
    setSendButtonContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleSendButtonTouchStart = (e: React.TouchEvent) => {
    if (!msg.trim() && pendingImages.length === 0) return;
    const touch = e.touches[0];
    const x = touch.clientX;
    const y = touch.clientY;
    sendButtonLongPressTimer.current = setTimeout(() => {
      setSendButtonContextMenu({ x, y });
      if ('vibrate' in navigator) navigator.vibrate(50);
    }, 600);
  };

  const handleSendButtonTouchEnd = () => {
    if (sendButtonLongPressTimer.current) {
      clearTimeout(sendButtonLongPressTimer.current);
      sendButtonLongPressTimer.current = null;
    }
  };

  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [infoSearch, setInfoSearch] = useState('');
  const [infoTab, setInfoTab] = useState<'multimedia' | 'enlaces'>('multimedia');

  const chatInfoData = useMemo(() => {
    if (!selectedChat) return { media: [], sharedItems: [], searchResults: [] };
    const infoMessages = selectedChat.messages.length > 0 ? selectedChat.messages : instantMessages;
    const media: { url: string; timestamp: string }[] = [];
    const sharedItems: { type: 'post' | 'profile' | 'event' | 'link', data: any, timestamp: string, id: string }[] = [];
    const searchResults = infoSearch.trim()
      ? infoMessages.filter(m => normalizeString(m.text).includes(normalizeString(infoSearch)))
      : [];

    infoMessages.forEach(m => {
      const tsStr: string = m.timestamp instanceof Date ? m.timestamp.toISOString() : String(m.timestamp);

      // Images attached to the message (imageUrl array field)
      if (m.imageUrl && m.imageUrl.length > 0) {
        m.imageUrl.forEach(url => media.push({ url, timestamp: tsStr }));
      }

      // Images embedded in text
      const trimmedText = m.text.trim();
      const isImage = trimmedText.startsWith('data:image') ||
        !!trimmedText.match(/^https?:\/\/[^\s]+?\.(?:jpg|jpeg|png|gif|svg|webp)(?:\?.*)?$/i);

      if (isImage) {
        media.push({ url: trimmedText, timestamp: tsStr });
      } else {
        const imgRegex = /https?:\/\/[^\s]+?\.(?:jpg|jpeg|png|gif|svg|webp)(?:\?.*)?/gi;
        let match;
        while ((match = imgRegex.exec(m.text)) !== null) {
          media.push({ url: match[0], timestamp: tsStr });
        }
      }

      let sharedUrl = '';
      // Normalize timestamp to ISO string (m.timestamp may be Date or string from DB)
      if (m.postId || m.newsId) {
        const post = posts.find(p => p.id === (m.postId || m.newsId)) || (m as any).inlineSharedPost;
        if (post) {
          sharedItems.push({ type: 'post', data: post, timestamp: tsStr, id: `post-${post.id}-${m.id}` });
        }
      }
      const profileData = m.sharedProfile || (m as any).inlineSharedProfile || (m.sharedProfileId ? users.find(u => u.id === m.sharedProfileId) : null);
      if (profileData) {
        sharedItems.push({ type: 'profile', data: profileData, timestamp: tsStr, id: `profile-${profileData.id}-${m.id}` });
      }
      if (m.sharedEvent || m.sharedEventId) {
        const event = m.sharedEvent || globalEvents.find(e => e.id === m.sharedEventId);
        if (event) {
          sharedItems.push({ type: 'event', data: event, timestamp: tsStr, id: `event-${event.id}-${m.id}` });
        }
      }

      const linkRegex = /(https?:\/\/[^\s]+)/gi;
      let lMatch;
      while ((lMatch = linkRegex.exec(m.text)) !== null) {
        const foundUrl = lMatch[0];
        if (!foundUrl.match(/\.(?:jpg|jpeg|png|gif|svg|webp)$/i) &&
          !foundUrl.includes('redsocial.app') &&
          !foundUrl.includes('red.novagob.org')) {
          sharedItems.push({ type: 'link', data: { url: foundUrl, text: m.text }, timestamp: tsStr, id: `link-${m.id}-${lMatch.index}` });
        }
      }
    });
    sharedItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    media.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return { media, sharedItems, searchResults };
  }, [selectedChat, infoSearch, posts, globalEvents, instantMessages, selectedId]);

  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  const scrollToMessage = (msgId: string) => {
    setIsInfoOpen(false);
    setInfoSearch('');
    setTimeout(() => {
      const element = document.getElementById(`msg-${msgId}`);
      if (element && scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const elementRect = element.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const relativeTop = elementRect.top - containerRect.top;
        
        container.scrollTo({
          top: container.scrollTop + relativeTop - (container.clientHeight / 2),
          behavior: 'smooth'
        });
        
        setHighlightedMessageId(msgId);
        setTimeout(() => setHighlightedMessageId(null), 2000);
      }
    }, 100);
  };

  const participant = selectedChat?.participant || temporaryParticipant || cachedParticipant || null;

  return (
    <div className="h-full w-full bg-white dark:bg-black overflow-hidden flex flex-row">
      <div className={`border-r border-gray-100 dark:border-zinc-900 flex-col min-w-0 shrink-0 ${participant ? 'hidden md:flex' : 'flex'} w-full md:w-80 h-full`}>
        <div className="p-4 md:p-6 border-b border-gray-50 dark:border-zinc-900">
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4">{t('messages_title')}</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input
              type="text"
              placeholder={t('search_messages')}
              value={chatSearchTerm}
              onChange={(e) => setChatSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-zinc-900 dark:text-white border-none rounded-xl text-sm outline-none font-medium"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto" onScroll={(e) => {
          const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
          if (scrollHeight - scrollTop - clientHeight < 80) {
            setVisibleChatCount(prev => prev + 15);
          }
        }}>
          {temporaryParticipant && !chats.find(c => c.id === temporaryParticipant.id) && (
            <button
              onClick={() => handleChatClick(temporaryParticipant.id, `/mensajes/${getChatNavigationIdentifier(temporaryParticipant, temporaryParticipant.id)}`)}
              className="w-full max-w-full p-4 flex items-center space-x-3 bg-blue-50/30 dark:bg-zinc-800/30 border-r-4 border-blue-600 transition-all overflow-hidden"
            >
              <img src={getSafeAvatar(temporaryParticipant.avatar)} className="w-12 h-12 rounded-2xl object-cover shrink-0" alt="" />
              <div className="flex-1 text-left min-w-0 overflow-hidden">
                <span className="font-bold text-gray-900 dark:text-white text-sm truncate block">
                  {getDisplayName(temporaryParticipant.name, temporaryParticipant.username)}
                </span>
              </div>
            </button>
          )}
          {filteredChats.slice(0, visibleChatCount).map(chat => {
            // Use dedicated last-message fields from fetchChats (messages[] is lazy-loaded)
            const lastMsg = chat.messages.length > 0 ? chat.messages[chat.messages.length - 1] : null;
            const isMe = (chat.lastMessageSenderId ?? lastMsg?.senderId) === user.id;
            const isRead = chat.lastMessageIsRead ?? lastMsg?.isRead;
            const isUnread = !isMe && !isRead;

            return (
              <button
                key={chat.id}
                onClick={() => handleChatClick(chat.id, `/mensajes/${getChatNavigationIdentifier(chat.participant, chat.id)}`)}
                className={`w-full max-w-full p-4 flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-all overflow-hidden ${selectedId === chat.id ? 'bg-blue-50/50 dark:bg-zinc-800/50 border-r-4 border-blue-600' : ''}`}
              >
                <img src={getSafeAvatar(chat.participant.avatar)} className="w-12 h-12 rounded-2xl object-cover shrink-0" alt="" />
                <div className="flex-1 text-left min-w-0 overflow-hidden">
                  <div className="flex justify-between items-center mb-0.5 gap-2">
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-bold text-gray-900 dark:text-white text-sm truncate leading-tight">
                        {getDisplayName(chat.participant.name, chat.participant.username, chat.participant.lastName)}
                      </span>
                    </div>
                    <span className="text-[9px] text-gray-400 font-black uppercase whitespace-nowrap shrink-0">
                      {timeAgo(new Date(chat.timestamp).toISOString(), language)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className={`text-xs min-w-0 flex-1 flex items-center gap-1.5 ${(!isMe && isUnread && selectedId !== chat.id) ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-500 font-medium'}`}>
                      {isMe ? (
                        <span className="shrink-0 text-blue-500/70 font-black text-[9px] uppercase tracking-widest">
                          {isRead && (chat.participant?.chatSettings?.readReceipts !== false) ? t('visto') : t('enviado')}
                        </span>
                      ) : (
                        <span className={`truncate flex-1 ${isUnread && selectedId !== chat.id ? 'font-bold' : 'font-medium'}`}>{(() => {
                            const msg = chat.lastMessage || '';
                            if (msg === 'Imagen' || /\.(jpg|jpeg|png|gif|webp|heic|avif)(\?.*)?$/i.test(msg)) return language === 'es' ? 'Te ha enviado una imagen' : 'They sent you an image';
                            if (isExternalUrl(msg)) return language === 'es' ? 'Te ha enviado un enlace' : 'They sent you a link';
                            return msg;
                          })()}</span>
                      )}
                    </div>
                    {isUnread && selectedId !== chat.id && <div className="w-2 h-2 bg-blue-600 rounded-full shrink-0" />}
                  </div>
                </div>
              </button>
            );
          })}
          {chats.length === 0 && !temporaryParticipant && (
            <div className="p-4 md:p-8 text-center">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                {chatsLoading ? 'Cargando conversaciones...' : t('no_conversations')}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className={`flex flex-col min-h-0 bg-slate-50/30 dark:bg-black/20 h-full relative overflow-hidden flex-1 ${participant ? '' : 'hidden md:flex'}`}>
        {participant ? (
          <>
            <div className="sticky top-0 z-20 p-4 md:p-6 bg-white dark:bg-[#111] border-b border-gray-50 dark:border-zinc-900 flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1 min-w-0 mr-2">
                <button
                  onClick={() => navigate('/mensajes')}
                  className="p-2 -ml-2 text-slate-400 hover:text-blue-600 md:hidden shrunk-0"
                >
                  <ArrowLeft size={20} />
                </button>
                <img
                  src={getSafeAvatar(participant.avatar)}
                  className="w-10 h-10 rounded-xl object-cover cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all shrink-0"
                  alt=""
                  onClick={() => participant.id && onNavigateToProfile?.(participant.id)}
                />
                <div
                  className="cursor-pointer group flex-1 min-w-0 flex flex-col justify-center"
                  onClick={() => participant.id && onNavigateToProfile?.(participant.id)}
                >
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm group-hover:text-blue-600 transition-colors truncate leading-none mb-1">
                    {getDisplayName(participant.name, participant.username, participant.lastName)}
                  </h3>
                  <div className="flex items-center space-x-1.5 overflow-hidden">
                    {participant.position && <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter truncate opacity-80">{participant.position}</span>}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsInfoOpen(true)}
                className="p-2 text-slate-300 hover:text-blue-600 transition-colors"
              >
                <Info size={20} />
              </button>
            </div>

            <div className="relative flex-1 min-h-0 flex flex-col">
              {showScrollToBottom && (
                <button
                  onClick={() => {
                    if (scrollContainerRef.current) {
                      scrollContainerRef.current.scrollTo({ top: scrollContainerRef.current.scrollHeight, behavior: 'smooth' });
                    }
                  }}
                  className="absolute bottom-4 right-4 z-20 w-10 h-10 rounded-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 shadow-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-all"
                  aria-label="Ir al final"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              )}
              <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto min-h-0 p-4 md:p-6 overscroll-contain relative"
                style={{ backgroundColor: user.chatSettings?.backgroundColor || undefined }}
              >
                {isLoadingMoreMessages && (
                  <div className="flex justify-center py-3">
                    <Loader2 size={16} className="animate-spin text-gray-400" />
                  </div>
                )}
                {(() => {
                  // Use real messages when loaded, otherwise show instant cache for zero-delay display
                  const realMessages = selectedChat?.messages || [];
                  // If real messages are empty but we are fetching, base is empty to show loader below
                  const base = realMessages.length > 0 ? realMessages : (messagesLoading ? [] : instantMessages);
                  // Augment base with preview data from instantMessages when phase-1 has nulls.
                  // instantMessages always carries full preview data (from MSG_CACHE localStorage).
                  const instantMap = new Map(instantMessages.map((m: any) => [m.id, m]));
                  const augmented = base.map((m: any) => {
                    const inst = instantMap.get(m.id);
                    if (!inst) return m;
                    const needsAugment = (!m.inlineSharedPost && inst.inlineSharedPost)
                      || (!m.sharedEvent && inst.sharedEvent)
                      || (!m.sharedProfile && inst.sharedProfile)
                      || (!m.inlineSharedProfile && inst.inlineSharedProfile);
                    if (!needsAugment) return m;
                    return {
                      ...m,
                      inlineSharedPost: m.inlineSharedPost ?? inst.inlineSharedPost ?? null,
                      sharedEvent: m.sharedEvent ?? inst.sharedEvent ?? null,
                      sharedProfile: m.sharedProfile ?? inst.sharedProfile ?? null,
                      inlineSharedProfile: m.inlineSharedProfile ?? inst.inlineSharedProfile ?? null,
                    };
                  });
                  // Append optimistic messages not yet confirmed in real messages.
                  // Scope by recipientId so optimistics from other chats don't leak here.
                  // Match only by sender + timestamp proximity (not text) so that
                  // editing the message right after sending doesn't break the dedup.
                  const pendingOptimistic = optimisticMessages.filter(om =>
                    om.recipientId === selectedId &&
                    !realMessages.some(rm =>
                      rm.senderId === om.senderId &&
                      Math.abs(new Date(rm.timestamp).getTime() - new Date(om.timestamp).getTime()) < 30000
                    )
                  );
                  const messagesArray = [...augmented, ...pendingOptimistic];
                  let lastReadIndex = -1;
                  let lastSentIndex = -1;
                  let latestSentMessageIndex = -1;

                  // Read receipts are asymmetric: we only care if the OTHER person lets us see their reads
                  const receiptsEnabled = (participant?.chatSettings?.readReceipts !== false);

                  // Encontrar el último mensaje leído y el último enviado (no leído) por el usuario
                  for (let i = messagesArray.length - 1; i >= 0; i--) {
                    const m = messagesArray[i];
                    if (m.senderId === user.id) {
                      if (latestSentMessageIndex === -1) {
                        latestSentMessageIndex = i;
                      }
                      if (receiptsEnabled && m.isRead && lastReadIndex === -1) {
                        lastReadIndex = i;
                      }
                      if ((!receiptsEnabled || !m.isRead) && lastSentIndex === -1) {
                        lastSentIndex = i;
                      }
                    }
                    if (latestSentMessageIndex !== -1 && (lastReadIndex !== -1 || !receiptsEnabled) && lastSentIndex !== -1) break;
                  }

                  if (messagesLoading && messagesArray.length === 0) {
                    return (
                      <div className="flex-1 flex flex-col items-center justify-center space-y-4 opacity-60">
                        <Loader2 className="animate-spin text-blue-600" size={32} />
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Cargando mensajes...</p>
                      </div>
                    );
                  }

                  if (messagesArray.length === 0) {
                    return (
                      <div className="flex-1 flex flex-col items-center justify-center p-8 opacity-40">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-3xl flex items-center justify-center mb-4">
                          <MessageSquare size={32} className="text-slate-400" />
                        </div>
                        <p className="text-sm font-bold text-slate-400 italic">No hay mensajes todavía</p>
                      </div>
                    );
                  }

                  return messagesArray
                    .filter(m => !hiddenMessageIds.has(m.id))
                    .map((m, index) => {
                      const isLastMessage = index === messagesArray.length - 1;
                      const nextMessage = !isLastMessage ? messagesArray[index + 1] : null;
                      const previousMessage = index > 0 ? messagesArray[index - 1] : null;

                      const isLastInGroup = isLastMessage || (nextMessage && (nextMessage.senderId !== m.senderId || (new Date(nextMessage.timestamp).getTime() - new Date(m.timestamp).getTime() > 10 * 60 * 1000)));
                      const isFirstInGroup = !previousMessage || (previousMessage.senderId !== m.senderId || (new Date(m.timestamp).getTime() - new Date(previousMessage.timestamp).getTime() > 10 * 60 * 1000));
                      const isConsecutive = !isFirstInGroup;
                      const isConsecutiveWithNext = !isLastInGroup;

                      let showTimestamp = true;
                      if (previousMessage) {
                        const currTime = new Date(m.timestamp).getTime();
                        const prevTime = new Date(previousMessage.timestamp).getTime();
                        const diffHours = (currTime - prevTime) / (1000 * 60 * 60);
                        if (diffHours < 1) {
                          showTimestamp = false;
                        }
                      }

                      // Date and Time separator logic
                      let showSeparator = false;
                      let separatorLabel = '';

                      const currentMsgDate = new Date(m.timestamp);
                      const currentDay = new Date(currentMsgDate).setHours(0, 0, 0, 0);

                      if (!previousMessage) {
                        showSeparator = true;
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const yesterday = new Date(today);
                        yesterday.setDate(yesterday.getDate() - 1);

                        if (currentDay === today.getTime()) {
                          separatorLabel = (t as any)('today') || 'Hoy';
                        } else if (currentDay === yesterday.getTime()) {
                          separatorLabel = (t as any)('yesterday') || 'Ayer';
                        } else {
                          separatorLabel = currentMsgDate.toLocaleDateString([], {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          });
                        }
                      } else {
                        const prevMsgDate = new Date(previousMessage.timestamp);
                        const prevDay = new Date(prevMsgDate).setHours(0, 0, 0, 0);

                        if (currentDay !== prevDay) {
                          showSeparator = true;
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          const yesterday = new Date(today);
                          yesterday.setDate(yesterday.getDate() - 1);

                          if (currentDay === today.getTime()) {
                            separatorLabel = (t as any)('today') || 'Hoy';
                          } else if (currentDay === yesterday.getTime()) {
                            separatorLabel = (t as any)('yesterday') || 'Ayer';
                          } else {
                            separatorLabel = currentMsgDate.toLocaleDateString([], {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            });
                          }
                        } else if (currentMsgDate.getTime() - prevMsgDate.getTime() >= 3600000) {
                          // More than 1 hour gap same day
                          showSeparator = true;
                          separatorLabel = currentMsgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        }
                      }

                      return (
                        <React.Fragment key={m.id}>
                          {showSeparator && (
                            <div className="flex justify-center my-6">
                              <div className="bg-slate-100 dark:bg-zinc-800 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400 border border-slate-200 dark:border-zinc-700">
                                {separatorLabel}
                              </div>
                            </div>
                          )}
                          <div
                            id={`msg-${m.id}`}
                            className={`flex flex-col ${isConsecutiveWithNext ? 'mb-[1px]' : 'mb-3'} animate-in fade-in slide-in-from-bottom-2 duration-300 ${m.senderId === user.id ? 'items-end' : 'items-start'}`}
                          >
                            <div className={`max-w-[85%] md:max-w-[75%] space-y-1 flex flex-col ${m.senderId === user.id ? 'items-end ml-auto' : 'items-start mr-auto'} w-fit`}>
                              {(m.postId || m.newsId) ? (
                                (() => {
                                  const sharedPost = posts.find(p => p.id === (m.postId || m.newsId)) || (m as any).inlineSharedPost || localPreviews.get(m.postId || m.newsId);
                                  if (!sharedPost) return (
                                    <div className={`p-0.5 rounded-2xl overflow-hidden ${m.senderId === user.id ? 'rounded-tr-none' : 'bg-gray-100 dark:bg-zinc-800 rounded-tl-none border-[0.5px] border-gray-200 dark:border-zinc-700'}`}
                                      style={m.senderId === user.id ? { backgroundColor: user.chatSettings?.senderColor || '#8b5cf6' } : {}}>
                                      <div className="p-3 bg-white dark:bg-[#111] border-[0.5px] border-gray-100 dark:border-zinc-800 rounded-xl animate-pulse min-w-[180px]">
                                        <div className="flex items-center space-x-2 mb-2">
                                          <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-zinc-700 shrink-0" />
                                          <div className="flex-1 space-y-1.5">
                                            <div className="h-2.5 bg-gray-200 dark:bg-zinc-700 rounded w-3/4" />
                                            <div className="h-2 bg-gray-200 dark:bg-zinc-700 rounded w-1/2" />
                                          </div>
                                        </div>
                                        <div className="h-2.5 bg-gray-200 dark:bg-zinc-700 rounded w-full mb-1.5" />
                                        <div className="h-2.5 bg-gray-200 dark:bg-zinc-700 rounded w-5/6" />
                                      </div>
                                    </div>
                                  );
                                  return (
                                    <div
                                      className={`p-0.5 rounded-2xl overflow-hidden cursor-pointer transition-all ${m.senderId === user.id ? 'rounded-tr-none' : 'bg-gray-100 dark:bg-zinc-800 rounded-tl-none border-[0.5px] border-gray-200 dark:border-zinc-700'}`}
                                      style={m.senderId === user.id ? { backgroundColor: user.chatSettings?.senderColor || '#8b5cf6' } : {}}
                                      onClick={() => onViewPost?.(sharedPost.id, sharedPost.type as 'post' | 'news')}
                                    >
                                      <div className="p-3 bg-white dark:bg-[#111] border-[0.5px] border-gray-100 dark:border-zinc-800 rounded-xl">
                                        {sharedPost.type === 'news' ? (
                                          <div className="flex flex-col gap-2">
                                            {/* Header */}
                                            <div className="flex items-start justify-between gap-x-4">
                                              <div className="flex items-center space-x-2 min-w-0 flex-1">
                                                <img 
                                                  src={getSafeAvatar(sharedPost.authorAvatar)} 
                                                  className="w-8 h-8 md:w-9 md:h-9 rounded-lg object-cover shrink-0 shadow-sm border border-gray-100 dark:border-zinc-800" 
                                                  alt="" 
                                                />
                                                <div className="min-w-0">
                                                  <div className="flex items-center space-x-1.5 flex-wrap">
                                                    <span className="font-bold text-slate-900 dark:text-white text-xs md:text-[11px] truncate">{sharedPost.authorName}</span>
                                                  </div>
                                                  {!sharedPost.authorIsOrganization && !users?.find(u => u.id === sharedPost.authorId)?.isOrganization && <p className="text-[10px] md:text-[8px] font-black text-orange-600 uppercase tracking-widest leading-none mt-1">{sharedPost.authorPosition}</p>}
                                                </div>
                                              </div>
                                              <span className="text-slate-400 text-[11px] font-bold lowercase whitespace-nowrap ml-2">
                                                {timeAgo(sharedPost.timestamp, language)}
                                              </span>
                                            </div>

                                            {/* Main Section */}
                                            <div className="flex gap-3 items-start">
                                              <div className="flex-1 min-w-0 space-y-1">
                                                {sharedPost.title && (
                                                  <h4 className="text-sm md:text-base font-black text-slate-900 dark:text-white leading-[1.15] tracking-tight">
                                                    {sharedPost.title}
                                                  </h4>
                                                )}
                                                <p className="text-slate-600 dark:text-gray-400 text-xs md:text-[10px] leading-relaxed line-clamp-3">
                                                  {sharedPost.content}
                                                </p>
                                              </div>
                                              {sharedPost.imageUrl && sharedPost.imageUrl.length > 0 && (
                                                <div className="w-20 h-20 md:w-28 md:h-28 shrink-0 rounded-xl overflow-hidden border border-gray-100 dark:border-zinc-800 shadow-sm">
                                                  <img 
                                                    src={Array.isArray(sharedPost.imageUrl) ? sharedPost.imageUrl[0] : sharedPost.imageUrl} 
                                                    className="w-full h-full object-cover" 
                                                    alt="" 
                                                  />
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="flex flex-col gap-3">
                                            {/* Header */}
                                            <div className="flex items-start justify-between gap-x-4">
                                              <div className="flex items-center space-x-2 min-w-0 flex-1">
                                                <img 
                                                  src={getSafeAvatar(sharedPost.authorAvatar)} 
                                                  className="w-8 h-8 md:w-9 md:h-9 rounded-lg object-cover shrink-0 shadow-sm border border-gray-100 dark:border-zinc-800" 
                                                  alt="" 
                                                />
                                                <div className="min-w-0">
                                                  <div className="flex items-center space-x-1.5 flex-wrap">
                                                    <span className="font-bold text-slate-900 dark:text-white text-xs md:text-[11px] truncate">{sharedPost.authorName}</span>
                                                  </div>
                                                  {!sharedPost.authorIsOrganization && !users?.find(u => u.id === sharedPost.authorId)?.isOrganization && <p className="text-[10px] md:text-[8px] font-black text-blue-700 dark:text-blue-500 uppercase tracking-widest leading-none mt-1">{sharedPost.authorPosition}</p>}
                                                </div>
                                              </div>
                                              <span className="text-slate-400 text-[11px] font-bold lowercase whitespace-nowrap ml-2">
                                                {timeAgo(sharedPost.timestamp, language)}
                                              </span>
                                            </div>

                                            {/* Content */}
                                            <div className="text-slate-800 dark:text-gray-200 text-xs md:text-sm leading-relaxed">
                                              <p className="line-clamp-3">{sharedPost.content}</p>
                                            </div>

                                            {/* Post Images */}
                                            {sharedPost.imageUrl && sharedPost.imageUrl.length > 0 && (
                                              <div className="mt-2 w-full">
                                                {sharedPost.imageUrl.length === 1 && (
                                                  <div className="relative w-full aspect-[2/1] rounded-xl overflow-hidden border border-gray-100 dark:border-zinc-800">
                                                    <img
                                                      src={sharedPost.imageUrl[0]}
                                                      alt=""
                                                      loading="lazy"
                                                      className="w-full h-full object-cover"
                                                    />
                                                  </div>
                                                )}
                                                {sharedPost.imageUrl.length === 2 && (
                                                  <div className="grid grid-cols-2 gap-1 w-full aspect-[2/1] rounded-xl overflow-hidden border border-gray-100 dark:border-zinc-800">
                                                    {sharedPost.imageUrl.map((url: string, i: number) => (
                                                      <img
                                                        key={i}
                                                        src={url}
                                                        alt=""
                                                        loading="lazy"
                                                        className="w-full h-full object-cover"
                                                      />
                                                    ))}
                                                  </div>
                                                )}
                                                {sharedPost.imageUrl.length === 3 && (
                                                  <div className="grid grid-cols-2 grid-rows-2 gap-1 w-full aspect-[2/1] rounded-xl overflow-hidden border border-gray-100 dark:border-zinc-800">
                                                    <div className="relative row-span-2">
                                                      <img src={sharedPost.imageUrl[0]} alt="" loading="lazy" className="w-full h-full object-cover" />
                                                    </div>
                                                    <div className="relative h-full">
                                                      <img src={sharedPost.imageUrl[1]} alt="" loading="lazy" className="w-full h-full object-cover" />
                                                    </div>
                                                    <div className="relative h-full">
                                                      <img src={sharedPost.imageUrl[2]} alt="" loading="lazy" className="w-full h-full object-cover" />
                                                    </div>
                                                  </div>
                                                )}
                                                {sharedPost.imageUrl.length >= 4 && (
                                                  <div className="grid grid-cols-2 grid-rows-2 gap-1 w-full aspect-[2/1] rounded-xl overflow-hidden border border-gray-100 dark:border-zinc-800">
                                                    {sharedPost.imageUrl.slice(0, 4).map((url: string, i: number) => (
                                                      <div key={i} className="relative h-full">
                                                        <img src={url} alt="" loading="lazy" className="w-full h-full object-cover" />
                                                        {i === 3 && sharedPost.imageUrl.length > 4 && (
                                                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none">
                                                            <span className="text-white font-black text-xs">+{sharedPost.imageUrl.length - 4}</span>
                                                          </div>
                                                        )}
                                                      </div>
                                                    ))}
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        )}
                                        {/* Unified Timestamp */}
                                        <div className="flex items-center space-x-1.5 mt-0 mb-0.5 text-[10px] font-black uppercase tracking-widest justify-end ml-auto pr-0 -mr-2 text-gray-400">
                                          <span className="font-medium">
                                            {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                          </span>
                                        </div>
                                      </div>

                                      {m.text && <div className={`px-4 py-2 text-sm font-medium ${m.senderId === user.id ? 'text-white' : 'text-gray-700 dark:text-gray-200'}`}>{m.text}</div>}
                                    </div>
                                  )
                                })()
                              ) : m.sharedProfileId ? (
                                (() => {
                                  const profile = m.sharedProfile || (m as any).inlineSharedProfile || localPreviews.get(m.sharedProfileId) || users.find(u => u.id === m.sharedProfileId);
                                  if (!profile) return (
                                    <div className={`p-0.5 rounded-2xl overflow-hidden ${m.senderId === user.id ? 'rounded-tr-none' : 'bg-gray-100 dark:bg-zinc-800 rounded-tl-none border-[0.5px] border-gray-200 dark:border-zinc-700'}`}
                                      style={m.senderId === user.id ? { backgroundColor: user.chatSettings?.senderColor || '#8b5cf6' } : {}}>
                                      <div className="p-4 bg-white dark:bg-[#111] border-[0.5px] border-gray-100 dark:border-zinc-800 rounded-xl animate-pulse min-w-[180px]">
                                        <div className="flex items-center space-x-3">
                                          <div className="w-14 h-14 rounded-xl bg-gray-200 dark:bg-zinc-700 shrink-0" />
                                          <div className="flex-1 space-y-2">
                                            <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded w-3/4" />
                                            <div className="h-2.5 bg-gray-200 dark:bg-zinc-700 rounded w-1/2" />
                                            <div className="h-2 bg-gray-200 dark:bg-zinc-700 rounded w-1/3" />
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                  return (
                                    <div
                                      className={`p-0.5 rounded-2xl overflow-hidden cursor-pointer transition-all ${m.senderId === user.id ? 'rounded-tr-none' : 'bg-gray-100 dark:bg-zinc-800 rounded-tl-none border-[0.5px] border-gray-200 dark:border-zinc-700'}`}
                                      style={m.senderId === user.id ? { backgroundColor: user.chatSettings?.senderColor || '#8b5cf6' } : {}}
                                      onClick={() => profile.id && onNavigateToProfile?.(profile.id)}
                                    >
                                      <div className="p-4 bg-white dark:bg-[#111] border-[0.5px] border-gray-100 dark:border-zinc-800 rounded-xl">
                                        <div className="flex items-center space-x-3 md:space-x-4">
                                          <img src={getSafeAvatar(profile.avatar)} className="w-14 h-14 md:w-20 md:h-20 rounded-xl object-cover shadow-sm" alt="" />
                                          <div className="min-w-0 flex-1">
                                            <p className="text-sm font-black text-gray-900 dark:text-white truncate">
                                              {getDisplayName(profile.name, profile.username, profile.lastName)}
                                            </p>
                                            <p className="text-[11px] md:text-[10px] text-slate-500 font-bold uppercase truncate tracking-wide">{profile.position}</p>
                                            <p className="text-[10px] md:text-[9px] text-blue-600 font-black mt-1.5 uppercase tracking-widest">{t('view_profile')}</p>
                                          </div>
                                        </div>
                                        {/* Unified Timestamp */}
                                        <div className="flex items-center space-x-1.5 mt-0 mb-0.5 text-[10px] font-black uppercase tracking-widest justify-end ml-auto pr-0 -mr-2 text-gray-400">
                                          <span className="font-medium">
                                            {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                          </span>
                                        </div>
                                      </div>

                                      {m.text && <div className={`px-4 py-2 text-sm font-medium ${m.senderId === user.id ? 'text-white' : 'text-gray-700 dark:text-gray-200'}`}>{m.text}</div>}
                                    </div>
                                  )
                                })()
                              ) : m.sharedEventId ? (
                                (() => {
                                  const event = m.sharedEvent || localPreviews.get(m.sharedEventId) || globalEvents.find(e => e.id === m.sharedEventId);
                                  if (!event) return (
                                    <div className={`p-0.5 rounded-2xl overflow-hidden ${m.senderId === user.id ? 'rounded-tr-none' : 'bg-gray-100 dark:bg-zinc-800 rounded-tl-none border-[0.5px] border-gray-200 dark:border-zinc-700'}`}
                                      style={m.senderId === user.id ? { backgroundColor: user.chatSettings?.senderColor || '#8b5cf6' } : {}}>
                                      <div className="p-0 bg-white dark:bg-[#111] border-[0.5px] border-gray-100 dark:border-zinc-800 rounded-xl overflow-hidden animate-pulse min-w-[200px]">
                                        <div className="w-full h-24 bg-gray-200 dark:bg-zinc-700" />
                                        <div className="p-3 space-y-2">
                                          <div className="h-2 bg-gray-200 dark:bg-zinc-700 rounded w-1/3" />
                                          <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded w-4/5" />
                                          <div className="flex gap-1.5">
                                            <div className="h-5 bg-gray-200 dark:bg-zinc-700 rounded w-20" />
                                            <div className="h-5 bg-gray-200 dark:bg-zinc-700 rounded w-16" />
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                  const creatorId = event.creator_id || globalEvents.find(e => e.id === event.id)?.creator_id || '';
                                  return (
                                    <div
                                      className={`p-0.5 rounded-2xl overflow-hidden cursor-pointer transition-all ${m.senderId === user.id ? 'rounded-tr-none' : 'bg-gray-100 dark:bg-zinc-800 rounded-tl-none border-[0.5px] border-gray-200 dark:border-zinc-700'}`}
                                      style={m.senderId === user.id ? { backgroundColor: user.chatSettings?.senderColor || '#8b5cf6' } : {}}
                                      onClick={() => creatorId && onNavigateToEvent?.(creatorId, event.id)}
                                    >
                                      <div className="p-0 bg-white dark:bg-[#111] border-[0.5px] border-gray-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                                        <div className="flex flex-col md:flex-row shadow-sm min-h-[140px]">
                                          {/* Image Section */}
                                          <div className="relative w-full md:w-40 h-36 md:h-full shrink-0 overflow-hidden">
                                            <img
                                              src={event.image_url || '/img/novagob.brand_isotipo_black.svg'}
                                              className="w-full h-full object-contain bg-gray-50 dark:bg-zinc-900"
                                              alt={event.title}
                                            />
                                            {/* Gradient Overlays */}
                                            <div className="hidden md:block absolute inset-y-0 -right-px w-16 bg-gradient-to-r from-transparent to-white dark:to-[#111] pointer-events-none z-[5]"></div>
                                            <div className="md:hidden absolute inset-x-0 -bottom-px h-12 bg-gradient-to-b from-transparent to-white dark:to-[#111] pointer-events-none z-[5]"></div>
                                          </div>
                                          {/* Content Section */}
                                          <div className="flex-1 p-3 md:p-4 flex flex-col justify-between min-w-0 relative z-10 border-l border-gray-50/50 dark:border-zinc-900/50">
                                            <div className="space-y-1.5">
                                              <h4 className="text-gray-900 dark:text-white font-black text-sm leading-tight truncate pr-2">
                                                {event.title}
                                              </h4>
                                              <div className="flex flex-wrap gap-1.5 pt-0.5">
                                                <div className="flex items-center text-[10px] md:text-[11px] text-gray-400 font-bold uppercase tracking-wider bg-slate-50 dark:bg-zinc-900/50 px-1.5 py-0.5 rounded-md border border-slate-100 dark:border-zinc-800/50">
                                                  <Calendar size={10} className="mr-1 text-blue-500" strokeWidth={3} />
                                                  <span>{new Date(event.event_date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                </div>
                                                <div className="flex items-center text-[10px] md:text-[11px] text-gray-400 font-bold uppercase tracking-wider bg-slate-50 dark:bg-zinc-900/50 px-1.5 py-0.5 rounded-md border border-slate-100 dark:border-zinc-800/50">
                                                  <MapPin size={10} className="mr-1 text-emerald-500" strokeWidth={3} />
                                                  <span className="truncate max-w-[80px]">{event.location}</span>
                                                </div>
                                              </div>
                                            </div>
                                            <div className="mt-2 pt-1">
                                              <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400 flex items-center">
                                                {t('view_event_details') || t('view_event') || 'VER EVENTO'}
                                                <ChevronRight size={10} className="ml-0.5" />
                                              </span>
                                            </div>
                                            {/* Unified Timestamp */}
                                            <div className="flex items-center space-x-1.5 mt-0 mb-0.5 text-[10px] font-black uppercase tracking-widest justify-end ml-auto pr-0 -mr-2 text-gray-400">
                                              <span className="font-medium">
                                                {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                              </span>
                                            </div>
                                          </div>
                                        </div>

                                        {m.text && <div className={`px-4 py-2 text-sm font-medium ${m.senderId === user.id ? 'text-white' : 'text-gray-700 dark:text-gray-200'}`}>{m.text}</div>}
                                      </div>
                                    </div>
                                  )
                                })()
                              ) : (
                                (() => {
                                  const trimmedText = (m.text || '').trim();
                                  const imageRegex = /https?:\/\/[^\s]+?\.(?:jpg|jpeg|png|gif|webp|svg)(?:\?.*)?/i;
                                  const isBase64 = trimmedText.includes('data:image') || trimmedText.includes(';base64,');
                                  const isDirectUrl = !!trimmedText.match(/^https?:\/\/[^\s]+?\.(?:jpg|jpeg|png|gif|webp|svg)(?:\?.*)?/i);
                                  const extractedImageUrl = !isDirectUrl && !isBase64 ? m.text.match(imageRegex)?.[0] : null;
                                  const isImage = isBase64 || isDirectUrl;
                                  const hasImageInText = !!extractedImageUrl;
                                  
                                  const isProbablyData = !isImage && !hasImageInText &&
                                    !trimmedText.startsWith('http') &&
                                    (trimmedText.includes(';base64,') || (trimmedText.length > 60 && !trimmedText.includes(' ')));

                                  if (isProbablyData) {
                                    return <div className="p-3 text-xs italic text-slate-400 bg-slate-100 dark:bg-zinc-800 rounded-lg">Adjunto o dato de sistema</div>;
                                  }

                                  if (m.is_deleted) {
                                    return (
                                      <div className={`px-4 py-2.5 rounded-2xl flex items-center gap-2 ${m.senderId === user.id ? 'rounded-tr-none' : 'bg-white dark:bg-[#111] shadow-sm border border-gray-100 dark:border-zinc-900 rounded-tl-none'}`}
                                        style={m.senderId === user.id ? { backgroundColor: user.chatSettings?.senderColor || '#8b5cf6' } : {}}
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${m.senderId === user.id ? 'text-white/50' : 'text-gray-400'}`}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                                        <span className={`text-[13px] italic ${m.senderId === user.id ? 'text-white/60' : 'text-gray-400 dark:text-zinc-500'}`}>
                                          {language === 'es' ? 'Mensaje eliminado' : 'Message deleted'}
                                        </span>
                                        <span className={`text-[9px] font-medium ml-auto pl-2 ${m.senderId === user.id ? 'text-white/40' : 'text-gray-300 dark:text-zinc-600'}`}>
                                          {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      </div>
                                    );
                                  }

                                  const firstUrl = extractFirstUrl(m.text);
                                  const hasPreview = firstUrl && isExternalUrl(firstUrl) && !isImage;
                                  // Resolve internal app URLs to profile/post previews
                                  const internalParsed = (firstUrl && !isExternalUrl(firstUrl)) ? parseInternalAppUrl(firstUrl) : null;
                                  const internalId = internalParsed?.identifier ?? '';
                                  const internalProfile: User | undefined = internalParsed?.type === 'profile'
                                    ? (users ?? [] as User[]).find((u: User) => u.username?.toLowerCase() === internalId.toLowerCase() || u.id === internalId)
                                    : undefined;
                                  const internalPost: Post | undefined = (internalParsed?.type === 'post' || internalParsed?.type === 'news')
                                    ? posts.find(p => p.id === internalId)
                                    : undefined;
                                  const isOwnMessage = m.senderId === user.id;

                                  const hasImageColumn = m.imageUrl && m.imageUrl.length > 0;
                                  const hasNoOuterBubble = hasImageColumn || hasPreview;

                                  return (
                                      <div
                                        key={m.id}
                                        onContextMenu={(e) => handleContextMenu(e, m.id, m.senderId === user.id)}
                                        onTouchStart={(e) => handleTouchStart(m.id, m.senderId === user.id, e)}
                                        onTouchEnd={handleTouchEnd}
                                        className={`relative group ${m.senderId === user.id ? 'items-end' : 'items-start'} ${hasImageColumn ? 'w-fit' : ''}`}
                                      >
                                        <div
                                          className={`${hasNoOuterBubble ? 'p-0 bg-transparent shadow-none border-none' : 'px-4 py-2.5 rounded-2xl'} text-[13px] md:text-[15px] font-medium leading-relaxed transition-all relative ${m.senderId === user.id
                                            ? (hasNoOuterBubble ? '' : 'text-white')
                                            : (hasNoOuterBubble ? '' : 'bg-white dark:bg-[#111] text-gray-800 dark:text-gray-200 shadow-sm border border-gray-100 dark:border-zinc-900')
                                            } ${isFirstInGroup && m.senderId === user.id && !hasNoOuterBubble ? 'rounded-tr-none' : ''}
                                            ${isFirstInGroup && m.senderId !== user.id && !hasNoOuterBubble ? 'rounded-tl-none' : ''}
                                            ${highlightedMessageId === m.id ? 'ring-4 ring-blue-500/30' : ''}`}
                                          style={(m.senderId === user.id && !hasNoOuterBubble) ? { backgroundColor: user.chatSettings?.senderColor || '#8b5cf6' } : {}}
                                        >
                                          {/* Render Image Collection if present in imageUrl property */}
                                          {hasImageColumn && m.imageUrl && m.imageUrl.length > 0 && (
                                            <div className="relative mb-3 flex justify-center">
                                              <div className="relative w-48 h-48 sm:w-56 sm:h-56">
                                                {/* Shadow stack (Only one image behind) */}
                                                {m.imageUrl.length >= 2 && (
                                                  <div className="absolute top-2.5 left-2.5 w-full h-full rounded-2xl bg-gray-200 dark:bg-zinc-800 z-0 overflow-hidden border border-white/10 shadow-lg transform -rotate-6 scale-[0.98] opacity-80">
                                                    <img src={m.imageUrl[1]} className="w-full h-full object-cover grayscale-[15%]" alt="" />
                                                  </div>
                                                )}
                                                
                                                {/* Main image */}
                                                <div 
                                                  className="relative w-full h-full rounded-2xl overflow-hidden border border-white/20 dark:border-zinc-800/50 shadow-xl cursor-pointer hover:scale-[1.02] transition-transform duration-300 group/deck z-10"
                                                  onClick={() => setSelectedImageGallery({ urls: m.imageUrl!, index: 0 })}
                                                >
                                                  <img src={m.imageUrl[0]} className="w-full h-full object-cover" alt="" />
                                                  <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md px-2.5 py-1.5 rounded-xl flex items-center space-x-1.5 border border-white/10 opacity-0 group-hover/deck:opacity-100 transition-opacity">
                                                    <ImageIcon size={14} className="text-white" />
                                                    <span className="text-white text-xs font-black">1/{m.imageUrl.length}</span>
                                                  </div>
                                                  {m.imageUrl.length > 1 && (
                                                    <div className="absolute inset-0 bg-black/0 group-hover/deck:bg-black/5 transition-colors" />
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          )}

                                          {/* Legacy image rendering (single URL in text) */}
                                          {isImage && !hasImageColumn && (
                                            <div className="relative mb-2 -mx-1 first:-mt-1 rounded-xl overflow-hidden group/img cursor-pointer" onClick={() => setSelectedImageGallery({ urls: [trimmedText], index: 0 })}>
                                              <img
                                                src={trimmedText}
                                                className="max-w-full max-h-[300px] object-contain bg-black/5 dark:bg-white/5 transition-transform group-hover/img:scale-[1.02]"
                                                alt=""
                                              />
                                            </div>
                                          )}
                                          {hasImageInText && !isImage && !hasImageColumn && (
                                            <div className="relative mb-3 -mx-1 first:-mt-1 rounded-xl overflow-hidden group/img cursor-pointer" onClick={() => setSelectedImageGallery({ urls: [extractedImageUrl!], index: 0 })}>
                                              <img
                                                src={extractedImageUrl!}
                                                className="max-w-full max-h-[250px] object-contain bg-black/5 dark:bg-white/5 transition-transform group-hover/img:scale-[1.02]"
                                                alt=""
                                              />
                                            </div>
                                          )}

                                          {/* Text content */}
                                          {m.text && !hasPreview && (
                                            <div className={`relative break-words linkify whitespace-pre-wrap ${hasImageColumn ? 'mt-2 px-4 py-2.5 rounded-2xl' : ''}`}
                                              style={(m.senderId === user.id && hasImageColumn) ? { backgroundColor: user.chatSettings?.senderColor || '#8b5cf6', color: 'white' } : (m.senderId !== user.id && hasImageColumn ? { backgroundColor: 'white', color: '#1f2937' } : {})}
                                            >
                                            {editingMessageId === m.id ? (
                                              <div ref={editContainerRef} className="flex flex-col gap-2 min-w-[200px]">
                                                <textarea
                                                  value={editingText}
                                                  onChange={(e) => setEditingText(e.target.value)}
                                                  className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-sm text-white outline-none focus:ring-1 focus:ring-white/50 resize-none"
                                                  rows={2}
                                                  autoFocus
                                                  onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                      e.preventDefault();
                                                      handleEditSubmit(m.id);
                                                    } else if (e.key === 'Escape') {
                                                      setEditingMessageId(null);
                                                    }
                                                  }}
                                                />
                                                <div className="flex justify-end gap-2">
                                                  <button
                                                    onClick={() => setEditingMessageId(null)}
                                                    className="px-2 py-1 text-[10px] uppercase font-bold text-white/70 hover:text-white transition-colors"
                                                  >
                                                    {t('cancel')}
                                                  </button>
                                                  <button
                                                    onClick={() => handleEditSubmit(m.id)}
                                                    className="px-3 py-1 bg-white text-blue-600 rounded-lg text-[10px] uppercase font-black hover:bg-white/90 transition-colors"
                                                  >
                                                    {t('edit')}
                                                  </button>
                                                </div>
                                              </div>
                                            ) : (
                                              renderContent(m.text, isOwnMessage, m.imageUrl || (hasPreview ? [firstUrl!] : []))
                                            )}
                                          </div>
                                        )}

                                        {hasPreview && (
                                          <div
                                            className={`pt-2 px-2 pb-0 rounded-2xl overflow-hidden max-w-[280px] sm:max-w-[420px] ${isOwnMessage ? (isFirstInGroup ? 'rounded-tr-none' : '') : 'bg-gray-200 dark:bg-zinc-700 rounded-tl-none'}`}
                                            style={isOwnMessage ? { backgroundColor: user.chatSettings?.senderColor || '#8b5cf6' } : {}}
                                          >
                                            <LinkPreview url={firstUrl!} language={language} />
                                            <div className={`flex items-center gap-1 justify-end px-1 py-1.5 -mt-1 text-[9px] font-medium ${isOwnMessage ? 'text-white/70' : 'text-gray-500 dark:text-zinc-400'}`}>
                                              {(() => {
                                                const showEdited = m.updated_at && (new Date(m.updated_at).getTime() - new Date(m.timestamp).getTime() > 3000);
                                                return showEdited && <span className="font-bold uppercase tracking-widest">{t('editado') || 'Editado'}</span>;
                                              })()}
                                              <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                          </div>
                                        )}

                                        {/* Internal profile preview */}
                                        {internalProfile && (
                                          <div
                                            className={`mt-1 p-0.5 rounded-2xl overflow-hidden cursor-pointer transition-all ${isOwnMessage ? 'rounded-tr-none' : 'bg-gray-100 dark:bg-zinc-800 rounded-tl-none border-[0.5px] border-gray-200 dark:border-zinc-700'}`}
                                            style={isOwnMessage ? { backgroundColor: user.chatSettings?.senderColor || '#8b5cf6' } : {}}
                                            onClick={() => onNavigateToProfile?.(internalProfile.id)}
                                          >
                                            <div className="p-4 bg-white dark:bg-[#111] border-[0.5px] border-gray-100 dark:border-zinc-800 rounded-xl flex items-center space-x-3">
                                              <img src={getSafeAvatar(internalProfile.avatar)} className="w-12 h-12 rounded-xl object-cover shadow-sm shrink-0" alt="" />
                                              <div className="min-w-0 flex-1">
                                                <p className="text-sm font-black text-gray-900 dark:text-white truncate">{internalProfile.name} {internalProfile.lastName || ''}</p>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase truncate tracking-wide">{internalProfile.position}</p>
                                                <p className="text-[10px] text-blue-600 font-black mt-1 uppercase tracking-widest">{language === 'es' ? 'Ver perfil' : 'View profile'}</p>
                                              </div>
                                            </div>
                                            <div className="flex justify-end px-3 py-1.5">
                                              <span className="text-[9px] font-medium opacity-70">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                          </div>
                                        )}

                                        {/* Internal post/news preview */}
                                        {internalPost && (
                                          <div
                                            className={`mt-1 p-0.5 rounded-2xl overflow-hidden cursor-pointer transition-all ${isOwnMessage ? 'rounded-tr-none' : 'bg-gray-100 dark:bg-zinc-800 rounded-tl-none border-[0.5px] border-gray-200 dark:border-zinc-700'}`}
                                            style={isOwnMessage ? { backgroundColor: user.chatSettings?.senderColor || '#8b5cf6' } : {}}
                                            onClick={() => onViewPost?.(internalPost.id, internalPost.type as 'post' | 'news')}
                                          >
                                            <div className="p-3 bg-white dark:bg-[#111] border-[0.5px] border-gray-100 dark:border-zinc-800 rounded-xl flex flex-col gap-2">
                                              <div className="flex items-center space-x-2">
                                                <img src={getSafeAvatar(internalPost.authorAvatar)} className="w-8 h-8 rounded-lg object-cover shrink-0" alt="" />
                                                <div className="min-w-0">
                                                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{internalPost.authorName}</p>
                                                  {!internalPost.authorIsOrganization && !users?.find(u => u.id === internalPost.authorId)?.isOrganization && <p className={`text-[9px] font-black uppercase tracking-widest ${internalPost.type === 'news' ? 'text-orange-600' : 'text-blue-600'}`}>{internalPost.authorPosition}</p>}
                                                </div>
                                              </div>
                                              {internalPost.title && <p className="text-sm font-black text-slate-900 dark:text-white leading-tight">{internalPost.title}</p>}
                                              <p className="text-xs text-slate-600 dark:text-gray-400 line-clamp-2">{internalPost.content}</p>
                                              <div className="flex justify-end">
                                                <span className="text-[9px] font-medium text-slate-400">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                              </div>
                                            </div>
                                          </div>
                                        )}

                                        {/* Timestamp — only shown for plain text / image / link messages (not for structured previews above) */}
                                        {!internalProfile && !internalPost && !hasPreview && (
                                          <div className={`flex items-center gap-1 justify-end mt-1 text-[9px] font-medium ${isOwnMessage && !hasImageColumn ? 'text-white/60' : 'text-gray-400 dark:text-zinc-500'}`}>
                                            {(() => {
                                              const isDeleted = m.is_deleted || (m.text?.includes('eliminado por el administrador') ?? false);
                                              const showEdited = !isDeleted && m.updated_at && (new Date(m.updated_at).getTime() - new Date(m.timestamp).getTime() > 3000);
                                              return showEdited && <span className="font-bold uppercase tracking-widest">{t('editado') || 'Editado'}</span>;
                                            })()}
                                            <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })()
                              )}

                              {(index === lastReadIndex || index === lastSentIndex) && (
                                <div className="flex items-center justify-end space-x-2 mt-1 px-1">
                                  {m.senderId === user.id ? (
                                    <>
                                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                        {index === lastReadIndex ? t('visto') : t('enviado')}
                                      </span>
                                    </>
                                  ) : null}
                                </div>
                              )}
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    });
                })()}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="p-2 bg-white dark:bg-[#111] border-t border-gray-100 dark:border-zinc-900 shrink-0 relative">
              {scheduledCount > 0 && (
                <div 
                  onClick={() => setShowScheduledList(true)}
                  className="flex items-center mb-3 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 rounded-2xl w-fit animate-in fade-in slide-in-from-bottom-2 duration-500 border border-purple-100/50 dark:border-purple-500/20 shadow-sm cursor-pointer hover:opacity-80 active:scale-95 transition-all"
                >
                  <span className="text-[9px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-widest">
                    {scheduledCount === 1 ? `1 ${t('scheduled_message')}` : `${scheduledCount} ${t('scheduled_messages')}`}
                  </span>
                </div>
              )}

              {pendingImages.length > 0 && (
                <div className="flex flex-nowrap gap-2 mb-2 px-2 pt-2 pb-1 max-h-48 overflow-x-auto overflow-y-hidden scrollbar-hide animate-in fade-in slide-in-from-bottom-2 duration-200">
                  {pendingImages.map((url, i) => (
                    <div key={i} className="relative group w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border border-gray-200 dark:border-zinc-800 shadow-sm shrink-0">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setPendingImages(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 p-1 bg-black/50 hover:bg-red-500 text-white rounded-full transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 shadow-sm"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  {pendingImages.length < 10 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-16 h-16 md:w-20 md:h-20 rounded-xl border-2 border-dashed border-gray-200 dark:border-zinc-800 flex items-center justify-center text-gray-400 hover:text-blue-500 hover:border-blue-500 transition-all bg-gray-50/50 dark:bg-zinc-900/50 shrink-0"
                    >
                      <ImageIcon size={20} />
                    </button>
                  )}
                </div>
              )}
              <form onSubmit={handleSend} className="flex items-center space-x-2 bg-gray-50 dark:bg-zinc-900 rounded-2xl p-1 border border-gray-100 dark:border-zinc-800 shadow-sm relative">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="p-2 text-slate-400 hover:text-blue-600 transition-colors disabled:opacity-50"
                >
                  {isUploading ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={20} />}
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  className="hidden"
                  accept="image/*"
                  multiple
                />
                
                <textarea
                  value={msg}
                  onChange={(e) => {
                    setMsg(e.target.value);
                    // Simple auto-height adjustment
                    e.target.style.height = 'auto';
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e as any);
                    }
                  }}
                  placeholder={t('write_private_message')}
                  className="flex-1 bg-transparent border-none px-3 py-2 text-base font-medium outline-none focus:ring-0 dark:text-white resize-none max-h-[120px] min-h-[40px] leading-normal"
                  rows={1}
                />
                
                <div className="relative flex items-center pr-1">
                  <button
                    type="submit"
                    disabled={!msg.trim() && pendingImages.length === 0}
                    onContextMenu={handleSendButtonContextMenu}
                    onTouchStart={handleSendButtonTouchStart}
                    onTouchEnd={handleSendButtonTouchEnd}
                    className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 transform active:scale-95 transition-all shadow-md shadow-blue-500/10"
                  >
                    <Send size={20} />
                  </button>

                    {sendButtonContextMenu && (
                      <div
                        ref={sendButtonContextMenuRef}
                        className="fixed z-[70] bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-xl shadow-xl py-1 px-1 min-w-[200px] animate-in fade-in zoom-in-95 duration-200"
                        style={{ 
                          bottom: window.innerHeight - sendButtonContextMenu.y + 10, 
                          left: Math.min(sendButtonContextMenu.x, window.innerWidth - 220) 
                        }}
                      >
                        <button
                          onClick={() => {
                            const now = new Date();
                            const offset = now.getTimezoneOffset() * 60000;
                            const localISOTime = new Date(now.getTime() - offset).toISOString().slice(0, 16);
                            setScheduledAt(localISOTime);
                            setSendButtonContextMenu(null);
                            setShowScheduler(true);
                          }}
                          className="w-full text-left px-4 py-3 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center shadow-md transition-all active:scale-95"
                        >
                          <Clock size={16} className="mr-3" />
                          <span className="font-semibold">{t('schedule_message') || 'Programar mensaje'}</span>
                        </button>
                      </div>
                    )}
                </div>
              </form>
            </div>

            {showScheduler && (
              <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="bg-white dark:bg-[#111] w-full max-w-sm rounded-[2rem] overflow-hidden border border-white/20 dark:border-zinc-800 animate-in zoom-in-95 duration-300 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">
                      {t('schedule_message') || 'Programar mensaje'}
                    </h3>
                    <button
                      onClick={() => setShowScheduler(false)}
                      className="p-2 bg-gray-50 dark:bg-zinc-800 rounded-xl text-gray-400 hover:text-red-500 transition-all"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 px-1">
                        {t('select_date_time') || 'Selecciona fecha y hora'}
                      </label>
                      <input
                        type="datetime-local"
                        value={scheduledAt}
                        onChange={(e) => setScheduledAt(e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                        max={new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)}
                        className="w-full p-4 bg-gray-100 dark:bg-zinc-900 dark:text-white border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                      />
                    </div>

                    <button
                      onClick={(e) => handleSend(e as any, true)}
                      disabled={!scheduledAt || new Date(scheduledAt) <= new Date()}
                      className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all transform active:scale-[0.98] shadow-lg shadow-purple-500/20"
                    >
                      {t('confirm_schedule') || 'Confirmar programación'}
                    </button>
                  </div>
                </div>
              </div>
            )}
            {showScheduledList && (
              <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="bg-white dark:bg-[#111] w-full max-w-md rounded-[2.5rem] overflow-hidden border border-white/20 dark:border-zinc-800 animate-in zoom-in-95 duration-300 flex flex-col max-h-[80vh]">
                  <div className="p-6 border-b border-gray-50 dark:border-zinc-900 flex items-center justify-between">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight font-bold">
                      {t('scheduled_messages_list')}
                    </h3>
                    <button
                      onClick={() => setShowScheduledList(false)}
                      className="p-2 bg-gray-50 dark:bg-zinc-800 rounded-xl text-gray-400 hover:text-red-500 transition-all"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-4 mb-2">
                    {scheduledMessages.length > 0 ? scheduledMessages.map((sm) => (
                      <div key={sm.id} className="p-4 bg-gray-50 dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 group relative shadow-sm hover:border-purple-500/50 transition-all">
                        {sm.image_url && sm.image_url.length > 0 && (
                          <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
                            {sm.image_url.map((url: string, i: number) => (
                              <img 
                                key={i} 
                                src={url} 
                                className="w-12 h-12 object-cover rounded-lg border border-gray-200 dark:border-zinc-700 cursor-pointer hover:opacity-80 transition-opacity" 
                                alt="" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedImageGallery({ urls: sm.image_url, index: i });
                                }}
                              />
                            ))}
                          </div>
                        )}
                        <p className="text-sm text-gray-900 dark:text-gray-100 mb-3 font-medium line-clamp-3 whitespace-pre-wrap">{sm.text}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-purple-600 dark:text-purple-400">
                            <Clock size={12} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">
                              {t('scheduled_at_time', { time: new Date(sm.deliver_at).toLocaleString([], { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) })}
                            </span>
                          </div>
                          <button
                            onClick={async () => {
                              const { error } = await supabase.from('scheduled_messages').delete().eq('id', sm.id);
                              if (!error) {
                                fetchScheduledCount();
                              }
                            }}
                            className="p-2 text-gray-400 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                            title={t('cancel_schedule')}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-10">
                        <p className="text-sm text-gray-400 font-medium italic">{t('no_conversations')}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">{t('select_chat')}</h3>
            <p className="text-slate-400 max-w-xs font-medium">{t('select_chat_description')}</p>
          </div>
        )
        }
      </div >

      {
        isInfoOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pb-20 md:pb-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-[#111] w-full max-w-md rounded-[2rem] overflow-hidden border border-white/20 dark:border-zinc-800 animate-in zoom-in-95 duration-300 flex flex-col max-h-[80vh]">
              <div className="px-5 py-3 border-b border-gray-50 dark:border-zinc-900 flex items-center justify-between">
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">{t('chat_info')}</h3>
                <button
                  onClick={() => { setIsInfoOpen(false); setInfoSearch(''); }}
                  className="p-1.5 bg-gray-50 dark:bg-zinc-800 rounded-xl text-gray-400 hover:text-red-500 transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="px-5 py-3 border-b border-gray-50 dark:border-zinc-900">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={15} />
                  <input
                    type="text"
                    placeholder={t('search_messages')}
                    value={infoSearch}
                    onChange={(e) => setInfoSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-zinc-900 dark:text-white border-none rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2 mb-2 scrollbar-hide">
                {infoSearch.trim() ? (
                  <div className="p-3 space-y-3">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">{t('search_messages')}</h4>
                    {chatInfoData.searchResults.length > 0 ? chatInfoData.searchResults.map((m, i) => (
                      <button
                        key={i}
                        onClick={() => m.id && scrollToMessage(m.id)}
                        className="w-full p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-800 hover:border-blue-500 transition-all text-left group"
                      >
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 group-hover:text-blue-600 transition-colors">{m.text}</p>
                        <span className="text-[9px] font-black text-blue-600 uppercase italic">{new Date(m.timestamp).toLocaleDateString()}</span>
                      </button>
                    )) : (
                      <p className="text-center py-8 text-xs text-slate-400 font-bold italic">{t('no_users_found')}</p>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col h-full">
                    <div className="flex p-1.5 gap-1.5 mb-3 bg-gray-50 dark:bg-zinc-900/50 rounded-xl mx-3">
                      <button
                        onClick={() => setInfoTab('multimedia')}
                        className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${infoTab === 'multimedia' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-blue-600'}`}
                      >
                        {t('multimedia')}
                      </button>
                      <button
                        onClick={() => setInfoTab('enlaces')}
                        className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${infoTab === 'enlaces' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-blue-600'}`}
                      >
                        {t('links')}
                      </button>
                    </div>

                    <div className="px-3 flex-1">
                      {infoTab === 'multimedia' ? (
                        <div className="grid grid-cols-3 gap-2 pb-6">
                          {chatInfoData.media.length > 0 ? chatInfoData.media.map((item, i) => (
                            <div key={i} className="aspect-square rounded-xl overflow-hidden border border-slate-100 dark:border-zinc-800 group relative cursor-pointer" onClick={() => setSelectedImageGallery({ urls: chatInfoData.media.map(m => m.url), index: i })}>
                              <img src={item.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" loading="lazy" />
                            </div>
                          )) : (
                            <div className="col-span-3 text-center py-20">
                              <p className="text-xs text-slate-400 font-bold italic">{t('no_media')}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-4 pb-6">
                          {chatInfoData.sharedItems.length > 0 ? chatInfoData.sharedItems.map((item) => {
                            if (item.type === 'post') {
                              const sharedPost = item.data as Post;
                              return (
                                <div
                                  key={item.id}
                                  onClick={() => onViewPost?.(sharedPost.id)}
                                  className="p-0.5 rounded-2xl overflow-hidden cursor-pointer transition-all bg-gray-100 dark:bg-zinc-800 border-[0.5px] border-gray-200 dark:border-zinc-700 mb-4 last:mb-0"
                                >
                                  <div className="p-3 bg-white dark:bg-[#111] border-[0.5px] border-gray-100 dark:border-zinc-800 rounded-xl">
                                    {sharedPost.type === 'news' ? (
                                      <div className="flex flex-col gap-2">
                                        <div className="flex items-start justify-between gap-x-4">
                                          <div className="flex items-center space-x-2 min-w-0 flex-1">
                                            <img src={getSafeAvatar(sharedPost.authorAvatar)} className="w-6 h-6 rounded-lg object-cover shrink-0 shadow-sm" alt="" />
                                            <div className="min-w-0">
                                              <span className="font-bold text-slate-900 dark:text-white text-[10px] truncate">{sharedPost.authorName}</span>
                                              {!sharedPost.authorIsOrganization && !users?.find(u => u.id === sharedPost.authorId)?.isOrganization && <p className="text-[7px] font-black text-orange-600 uppercase tracking-widest leading-none mt-0.5">{sharedPost.authorPosition}</p>}
                                            </div>
                                          </div>
                                          <span className="text-slate-400 text-[8px] font-bold whitespace-nowrap">{new Date(item.timestamp).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex gap-2 items-start">
                                          <div className="flex-1 min-w-0">
                                            <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight truncate">{sharedPost.title}</h4>
                                            <p className="text-slate-600 dark:text-gray-400 text-[10px] line-clamp-2">{sharedPost.content}</p>
                                          </div>
                                          {sharedPost.imageUrl && sharedPost.imageUrl.length > 0 && (
                                            <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden border border-gray-100 dark:border-zinc-800">
                                              <img src={Array.isArray(sharedPost.imageUrl) ? sharedPost.imageUrl[0] : sharedPost.imageUrl} className="w-full h-full object-cover" alt="" />
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex flex-col gap-2">
                                        <div className="flex items-start justify-between gap-x-4">
                                          <div className="flex items-center space-x-2 min-w-0 flex-1">
                                            <img src={getSafeAvatar(sharedPost.authorAvatar)} className="w-6 h-6 rounded-lg object-cover shrink-0 shadow-sm" alt="" />
                                            <div className="min-w-0">
                                              <span className="font-bold text-slate-900 dark:text-white text-[10px] truncate">{sharedPost.authorName}</span>
                                              {!sharedPost.authorIsOrganization && !users?.find(u => u.id === sharedPost.authorId)?.isOrganization && <p className="text-[7px] font-black text-blue-700 dark:text-blue-500 uppercase tracking-widest leading-none mt-0.5">{sharedPost.authorPosition}</p>}
                                            </div>
                                          </div>
                                          <span className="text-slate-400 text-[8px] font-bold whitespace-nowrap">{new Date(item.timestamp).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-slate-800 dark:text-gray-200 text-[10px] line-clamp-3">{sharedPost.content}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            } else if (item.type === 'profile') {
                              const profile = item.data as User;
                              return (
                                <div
                                  key={item.id}
                                  onClick={() => profile.id && onNavigateToProfile?.(profile.id)}
                                  className="p-0.5 rounded-2xl overflow-hidden cursor-pointer transition-all bg-gray-100 dark:bg-zinc-800 border-[0.5px] border-gray-200 dark:border-zinc-700 mb-4 last:mb-0"
                                >
                                  <div className="p-3 bg-white dark:bg-[#111] border-[0.5px] border-gray-100 dark:border-zinc-800 rounded-xl flex items-center space-x-3">
                                    <img src={getSafeAvatar(profile.avatar)} className="w-10 h-10 rounded-xl object-cover" alt="" />
                                    <div className="min-w-0 flex-1">
                                      <div className="flex justify-between items-start">
                                        <p className="text-xs font-black text-gray-900 dark:text-white truncate">{getDisplayName(profile.name, profile.username, profile.lastName)}</p>
                                        <span className="text-slate-400 text-[8px] font-bold whitespace-nowrap">{new Date(item.timestamp).toLocaleDateString()}</span>
                                      </div>
                                      <p className="text-[9px] text-blue-600 font-bold uppercase truncate">@{profile.username || 'usuario'}</p>
                                      <p className="text-[9px] text-slate-500 font-bold uppercase truncate opacity-70">{profile.position}</p>
                                    </div>
                                  </div>
                                </div>
                              );
                            } else if (item.type === 'event') {
                              const event = item.data as CalendarEvent;
                              const creatorId = event.creator_id || globalEvents.find(e => e.id === event.id)?.creator_id || '';
                              return (
                                <div
                                  key={item.id}
                                  onClick={() => creatorId && onNavigateToEvent?.(creatorId, event.id)}
                                  className="p-0.5 rounded-2xl overflow-hidden cursor-pointer transition-all bg-gray-100 dark:bg-zinc-800 border-[0.5px] border-gray-200 dark:border-zinc-700 mb-4 last:mb-0"
                                >
                                  <div className="p-0 bg-white dark:bg-[#111] border-[0.5px] border-gray-100 dark:border-zinc-800 rounded-xl flex flex-col shadow-sm overflow-hidden min-h-[100px]">
                                    <div className="relative h-20 w-full shrink-0">
                                      <img src={event.image_url || '/img/novagob.brand_isotipo_black.svg'} className="w-full h-full object-cover" alt="" />
                                      <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white dark:from-[#111] to-transparent"></div>
                                    </div>
                                    <div className="p-3 pt-0">
                                      <div className="flex justify-between items-start mb-1">
                                        <h4 className="text-xs font-black text-gray-900 dark:text-white truncate pr-2">{event.title}</h4>
                                        <span className="text-slate-400 text-[8px] font-bold whitespace-nowrap shrink-0">{new Date(item.timestamp).toLocaleDateString()}</span>
                                      </div>
                                      <div className="flex items-center text-[8px] text-blue-600 font-bold uppercase">
                                        <Calendar size={8} className="mr-1" />
                                        <span>{new Date(event.event_date).toLocaleDateString()}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            } else if (item.type === 'link') {
                              const link = item.data as { url: string, text: string };
                              return (
                                <div key={item.id} className="relative group/link [&>a]:mb-0">
                                  <LinkPreview url={link.url} language={language} />
                                  <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/50 backdrop-blur-sm rounded-full text-[9px] text-white font-bold pointer-events-none">
                                    {new Date(item.timestamp).toLocaleDateString()}
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }) : (
                            <div className="text-center py-20">
                              <p className="text-xs text-slate-400 font-bold italic">{t('no_links')}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      }

      {selectedImageGallery && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-300 overflow-hidden"
          onClick={() => {
            setSelectedImageGallery(null);
            setIsZoomed(false);
          }}
          onTouchStart={handleTouchStartGallery}
          onTouchEnd={handleTouchEndGallery}
        >
          {/* Close button */}
          <button
            onClick={() => {
              setSelectedImageGallery(null);
              setIsZoomed(false);
            }}
            className="absolute top-6 right-6 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all hover:rotate-90 z-[160] shadow-xl border border-white/10"
          >
            <X size={24} strokeWidth={3} />
          </button>

          {/* Navigation Arrows */}
          {selectedImageGallery.urls.length > 1 && !isZoomed && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); navigateGallery(-1); }}
                className="absolute left-6 p-5 bg-white/5 hover:bg-white/15 text-white rounded-full transition-all transform hover:scale-110 active:scale-90 z-[160] shadow-2xl border border-white/5 group"
              >
                <ChevronLeft size={36} className="group-hover:-translate-x-1 transition-transform" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); navigateGallery(1); }}
                className="absolute right-6 p-5 bg-white/5 hover:bg-white/15 text-white rounded-full transition-all transform hover:scale-110 active:scale-90 z-[160] shadow-2xl border border-white/5 group"
              >
                <ChevronRight size={36} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </>
          )}

          {/* Image Counter */}
          {selectedImageGallery.urls.length > 1 && !isZoomed && (
            <div className="absolute top-8 left-1/2 -translate-x-1/2 px-5 py-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-white font-black text-xs tracking-[0.2em] uppercase z-[160] shadow-xl">
              <div className="flex items-center space-x-3">
                <span className="text-white">{selectedImageGallery.index + 1}</span>
                <span className="opacity-30">/</span>
                <span>{selectedImageGallery.urls.length}</span>
              </div>
            </div>
          )}

          {/* Main Image Container */}
          <div
            className={`relative transition-all duration-500 flex items-center justify-center ${isZoomed ? 'w-full h-full overflow-auto' : 'max-w-[95vw] max-h-[85vh] w-full h-full'}`}
          >
            <img
              key={selectedImageGallery.urls[selectedImageGallery.index]}
              src={selectedImageGallery.urls[selectedImageGallery.index]}
              alt="Preview"
              className={`transition-all duration-500 rounded-xl shadow-[0_0_80px_rgba(0,0,0,0.8)] cursor-pointer ${isZoomed ? 'max-w-none max-h-none scale-150 transform-gpu cursor-zoom-out' : 'max-w-full max-h-full object-contain cursor-zoom-in shadow-2xl'}`}
              onClick={(e) => {
                e.stopPropagation();
                setIsZoomed(!isZoomed);
              }}
            />
          </div>
        </div>
      )}


      {contextMenu && (() => {
        const isOptimistic = contextMenu.messageId?.startsWith('optimistic-') ?? false;
        const msg = chats.find(c => c.id === selectedId)?.messages.find(m => m.id === contextMenu.messageId);
        const trimmedText = msg?.text.trim() || '';
        const isImage = trimmedText.includes('data:image') ||
          trimmedText.includes(';base64,') ||
          !!trimmedText.match(/^https?:\/\/[^\s]+?\.(?:jpg|jpeg|png|gif|webp|svg)(?:\?.*)?$/i);
        const isDeleted = trimmedText === 'Eliminaste este mensaje.' ||
          trimmedText === 'Este mensaje fue eliminado.' ||
          trimmedText.includes('eliminado por el administrador');

        // Only allow editing if sent within the last 15 minutes and it's not a deleted message
        const canEditTime = msg ? (Date.now() - new Date(msg.timestamp).getTime() <= 15 * 60 * 1000) : false;
        const showEdit = !isImage && !msg?.is_deleted && canEditTime && !isOptimistic;
        const showDelete = !isOptimistic;
        if (!showEdit && !showDelete) return null;

        return (
          <div
            ref={contextMenuRef}
            className="fixed z-[60] bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-xl shadow-xl py-1 min-w-[150px] animate-in fade-in zoom-in-95 duration-200"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            {showEdit && (
              <button
                onClick={() => {
                  if (msg) {
                    setEditingMessageId(msg.id);
                    setEditingText(msg.text);
                  }
                  setContextMenu(null);
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-zinc-700/50 flex items-center space-x-2 transition-colors border-b border-gray-50 dark:border-zinc-700/50 mb-1 pb-2"
              >
                <Pencil size={14} className="text-blue-500" />
                <span>{t('edit') || 'Editar'}</span>
              </button>
            )}
            {showDelete && (
              <button
                onClick={() => {
                  if (contextMenu.messageId && selectedId) {
                    onDeleteMessage(selectedId, contextMenu.messageId);
                  }
                  setContextMenu(null);
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 flex items-center space-x-2 transition-colors"
              >
                <Ban size={14} />
                <span>Eliminar</span>
              </button>
            )}
          </div>
        );
      })()}
    </div >
  );
};
