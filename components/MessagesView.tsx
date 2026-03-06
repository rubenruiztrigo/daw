import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Send, Info, MessageSquare, Check, CheckCheck, Sparkles, X, ArrowLeft, Link as LinkIcon, Image as ImageIcon, Loader2, Calendar, Pencil, Ban, Trash2 } from 'lucide-react';
import { User, Chat, Message, Post, CalendarEvent } from '../types';
import { normalizeString, timeAgo, extractFirstUrl, isExternalUrl } from '../utils/stringUtils';
import { supabase } from '../supabaseClient';
import { Language, useTranslation } from '../utils/translations';
import { LinkPreview } from './LinkPreview';

interface MessagesViewProps {
  user: User;
  chats: Chat[];
  posts: Post[];
  users?: User[];
  onSendMessage: (recipientId: string, text: string) => void;
  onViewPost?: (postId: string) => void;
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
}

export const MessagesView: React.FC<MessagesViewProps> = ({
  user, chats, posts, users = [], onSendMessage, onViewPost, onLike, onVote, onAddComment, onNavigateToProfile, onMarkChatAsRead, externalActiveId, onNavigateToEvent, globalEvents, language, onEditMessage, onDeleteMessage
}) => {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const [resolvedId, setResolvedId] = useState<string | null>(null);

  useEffect(() => {
    if (!chatId) {
      setResolvedId(null);
      return;
    }

    // Priorizar búsqueda en chats existentes para resolución instantánea
    const existingChat = chats.find(c => c.participant.username === chatId || c.id === chatId);
    if (existingChat) {
      setResolvedId(existingChat.id);
      return;
    }

    // Si chatId coincide con algún username o ID en el listado global de usuarios
    const matchingUser = users.find(u => u.username === chatId || u.id === chatId);
    if (matchingUser) {
      setResolvedId(matchingUser.id);
    } else {
      // Intentar una busqueda en remoto asincrona si no lo tenemos (esto pasa en recargas F5)
      supabase.from('profiles').select('id').or(`username.eq.${chatId},id.eq.${chatId}`).maybeSingle()
        .then(({ data }) => {
          if (data) setResolvedId(data.id);
          else setResolvedId(chatId); // Fallback: asumimos que es un viejo ID
        });
    }
  }, [chatId, users, chats]);

  const selectedId = resolvedId || externalActiveId || null;
  const t = useTranslation(language);

  const [msg, setMsg] = useState('');
  const [chatSearchTerm, setChatSearchTerm] = useState('');
  const [temporaryParticipant, setTemporaryParticipant] = useState<User | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editContainerRef = useRef<HTMLDivElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFullImage, setSelectedFullImage] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, messageId: string | null } | null>(null);
  const longPressTimer = useRef<any>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !selectedId) return;
    const file = e.target.files[0];
    if (file.size > 5 * 1024 * 1024) {
      alert(t('image_too_large'));
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      onSendMessage(selectedId, base64);
      shouldAutoScrollRef.current = true;
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const fetchParticipantProfile = async (uid: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single();
    if (data) {
      setTemporaryParticipant({
        id: data.id,
        name: data.name,
        lastName: data.last_name,
        avatar: data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.id}`,
        position: data.position,
        department: data.department,
        followers: data.followers_count,
        following: data.following_count,
        bio: data.bio || '',
        interests: data.interests || [],
        username: data.username
      });
    }
  };

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      shouldAutoScrollRef.current = isAtBottom;
    }
  };

  useEffect(() => {
    if (selectedId) {
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

  useEffect(() => {
    if (shouldAutoScrollRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    if (selectedId) {
      const chat = chats.find(c => c.id === selectedId);
      const hasUnread = chat?.messages.some(m => m.senderId === selectedId && !m.isRead);
      if (hasUnread) {
        onMarkChatAsRead?.(selectedId);
      }
    }
  }, [selectedId, chats, onMarkChatAsRead]);

  const [hiddenMessageIds, setHiddenMessageIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (editContainerRef.current && !editContainerRef.current.contains(event.target as Node)) {
        setEditingMessageId(null);
      }
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(null);
      }
    };

    if (editingMessageId || contextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editingMessageId, contextMenu]);

  const filteredChats = useMemo(() => {
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

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msg.trim() || !selectedId) return;
    shouldAutoScrollRef.current = true;
    onSendMessage(selectedId, msg);
    setMsg('');
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

  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [infoSearch, setInfoSearch] = useState('');
  const [infoTab, setInfoTab] = useState<'multimedia' | 'enlaces'>('multimedia');

  const chatInfoData = useMemo(() => {
    if (!selectedChat) return { media: [], sharedItems: [], searchResults: [] };
    const media: string[] = [];
    const sharedItems: { type: 'post' | 'profile' | 'event' | 'link', data: any, timestamp: string, id: string }[] = [];
    const searchResults = infoSearch.trim()
      ? selectedChat.messages.filter(m => normalizeString(m.text).includes(normalizeString(infoSearch)))
      : [];

    selectedChat.messages.forEach(m => {
      const trimmedText = m.text.trim();
      const isImage = trimmedText.startsWith('data:image') ||
        !!trimmedText.match(/^https?:\/\/[^\s]+?\.(?:jpg|jpeg|png|gif|svg|webp)(?:\?.*)?$/i);

      if (isImage) {
        media.push(trimmedText);
      } else {
        const imgRegex = /https?:\/\/[^\s]+?\.(?:jpg|jpeg|png|gif|svg|webp)(?:\?.*)?/gi;
        let match;
        while ((match = imgRegex.exec(m.text)) !== null) {
          media.push(match[0]);
        }
      }

      let sharedUrl = '';
      if (m.postId) {
        const post = posts.find(p => p.id === m.postId);
        if (post) {
          sharedItems.push({ type: 'post', data: post, timestamp: m.timestamp, id: `post-${post.id}-${m.id}` });
        }
      }
      if (m.sharedProfile) {
        sharedItems.push({ type: 'profile', data: m.sharedProfile, timestamp: m.timestamp, id: `profile-${m.sharedProfile.id}-${m.id}` });
      }
      if (m.sharedEvent || m.sharedEventId) {
        const event = m.sharedEvent || globalEvents.find(e => e.id === m.sharedEventId);
        if (event) {
          sharedItems.push({ type: 'event', data: event, timestamp: m.timestamp, id: `event-${event.id}-${m.id}` });
        }
      }

      const linkRegex = /(https?:\/\/[^\s]+)/gi;
      let lMatch;
      while ((lMatch = linkRegex.exec(m.text)) !== null) {
        const foundUrl = lMatch[0];
        if (!foundUrl.match(/\.(?:jpg|jpeg|png|gif|svg|webp)$/i) &&
          !foundUrl.includes('redsocial.app') &&
          !foundUrl.includes('red.novagob.org')) {
          sharedItems.push({ type: 'link', data: { url: foundUrl, text: m.text }, timestamp: m.timestamp, id: `link-${m.id}-${lMatch.index}` });
        }
      }
    });
    sharedItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return { media, sharedItems, searchResults };
  }, [selectedChat, infoSearch, posts, globalEvents]);

  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  const scrollToMessage = (msgId: string) => {
    setIsInfoOpen(false);
    setInfoSearch('');
    setTimeout(() => {
      const element = document.getElementById(`msg-${msgId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setHighlightedMessageId(msgId);
        setTimeout(() => setHighlightedMessageId(null), 2000);
      }
    }, 100);
  };

  const participant = selectedChat?.participant || temporaryParticipant;

  return (
    <div className="h-full w-full bg-white dark:bg-black overflow-hidden flex flex-row border border-gray-100 dark:border-zinc-800 rounded-[2rem] shadow-sm">
      <div className="w-20 sm:w-72 md:w-80 border-r border-gray-100 dark:border-zinc-900 flex flex-col min-w-0 shrink-0">
        <div className="p-4 md:p-6 border-b border-gray-50 dark:border-zinc-900">
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4 hidden sm:block">{t('messages_title')}</h2>
          <div className="relative hidden sm:block">
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
        <div className="flex-1 overflow-y-auto">
          {temporaryParticipant && !chats.find(c => c.id === temporaryParticipant.id) && (
            <button
              onClick={() => navigate(`/messages/${temporaryParticipant.username || temporaryParticipant.id}`)}
              className={`w-full max-w-full p-4 flex items-center space-x-3 bg-blue-50/30 dark:bg-zinc-800/30 border-r-4 border-blue-600 transition-all overflow-hidden`}
            >
              <img src={temporaryParticipant.avatar} className="w-12 h-12 rounded-2xl object-cover shrink-0" alt="" />
              <div className="flex-1 text-left min-w-0 overflow-hidden">
                <div className="flex justify-between items-center mb-0.5 gap-2">
                  <span className="font-bold text-gray-900 dark:text-white text-sm truncate min-w-0 flex-1">{temporaryParticipant.name}</span>
                </div>
              </div>
            </button>
          )}
          {filteredChats.map(chat => {
            const lastMsg = chat.messages[chat.messages.length - 1];
            const isMe = lastMsg?.senderId === user.id;
            const isUnread = !isMe && !lastMsg?.isRead;

            return (
              <button
                key={chat.id}
                onClick={() => navigate(`/messages/${chat.participant.username || chat.id}`)}
                className={`w-full max-w-full p-4 flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-all overflow-hidden ${selectedId === chat.id ? 'bg-blue-50/50 dark:bg-zinc-800/50 border-r-4 border-blue-600' : ''}`}
              >
                <img src={chat.participant.avatar} className="w-12 h-12 rounded-2xl object-cover shrink-0" alt="" />
                <div className="flex-1 text-left min-w-0 overflow-hidden">
                  <div className="flex justify-between items-center mb-0.5 gap-2">
                    <span className="font-bold text-gray-900 dark:text-white text-sm truncate min-w-0 flex-1">{chat.participant.name} {chat.participant.lastName}</span>
                    <span className="text-[9px] text-gray-400 font-black uppercase whitespace-nowrap shrink-0">
                      {timeAgo(new Date(chat.timestamp).toISOString(), language)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className={`text-xs min-w-0 flex-1 flex items-center gap-1.5 ${(!isMe && isUnread && selectedId !== chat.id) ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-500 font-medium'}`}>
                      {isMe ? (
                        <span className="shrink-0 text-gray-500 font-medium lowercase first-letter:uppercase">
                          {lastMsg?.isRead && (chat.participant?.chatSettings?.readReceipts !== false) ? t('visto') : t('enviado')}
                        </span>
                      ) : (
                        <span className="truncate flex-1">{chat.lastMessage}</span>
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
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{t('no_conversations')}</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 bg-slate-50/30 dark:bg-black/20 h-full relative overflow-hidden">
        {participant ? (
          <>
            <div className="sticky top-0 z-20 p-4 bg-white dark:bg-[#111] border-b border-gray-50 dark:border-zinc-900 flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1 min-w-0 mr-2">
                <button
                  onClick={() => navigate('/messages')}
                  className="p-2 -ml-2 text-slate-400 hover:text-blue-600 md:hidden shrunk-0"
                >
                  <ArrowLeft size={20} />
                </button>
                <img
                  src={participant.avatar}
                  className="w-10 h-10 rounded-xl object-cover cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all shrink-0"
                  alt=""
                  onClick={() => participant.id && onNavigateToProfile?.(participant.id)}
                />
                <div
                  className="cursor-pointer group flex-1 min-w-0"
                  onClick={() => participant.id && onNavigateToProfile?.(participant.id)}
                >
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm group-hover:text-blue-600 transition-colors truncate">
                    {participant.name} {participant.lastName || ''}
                  </h3>
                  <div className="flex items-center text-[10px] text-gray-400 font-bold uppercase tracking-tighter truncate">
                    {participant.position}
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
              <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto min-h-0 p-4 md:p-6 scroll-smooth overscroll-contain relative"
                style={{ backgroundColor: user.chatSettings?.backgroundColor || undefined }}
              >
                {(() => {
                  const messagesArray = selectedChat?.messages || [];
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
                              {m.postId ? (
                                (() => {
                                  const sharedPost = posts.find(p => p.id === m.postId);
                                  if (!sharedPost) return null;
                                  return (
                                    <div
                                      className={`p-0.5 rounded-2xl overflow-hidden cursor-pointer transition-all hover:ring-2 hover:ring-purple-500/50 ${m.senderId === user.id ? 'rounded-tr-none' : 'bg-gray-100 dark:bg-zinc-800 rounded-tl-none border-[0.5px] border-gray-200 dark:border-zinc-700'}`}
                                      style={m.senderId === user.id ? { backgroundColor: user.chatSettings?.senderColor || '#8b5cf6' } : {}}
                                      onClick={() => onViewPost?.(sharedPost.id)}
                                    >
                                      <div className="p-3 bg-white dark:bg-[#111] border-[0.5px] border-gray-100 dark:border-zinc-800 rounded-xl">
                                        <div className="flex items-center space-x-2 mb-2">
                                          <img src={sharedPost.authorAvatar} className="w-6 h-6 rounded-lg object-cover" alt="" />
                                          <div className="min-w-0">
                                            <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{sharedPost.authorName}</p>
                                            <p className="text-[9px] text-gray-400 font-bold uppercase truncate">{sharedPost.authorPosition}</p>
                                          </div>
                                        </div>
                                        <div className="text-xs text-gray-800 dark:text-gray-200">
                                          <p className="line-clamp-3">{sharedPost.content}</p>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })()
                              ) : m.sharedProfile ? (
                                <div
                                  className={`p-0.5 rounded-2xl overflow-hidden cursor-pointer transition-all hover:ring-2 hover:ring-purple-500/50 ${m.senderId === user.id ? 'rounded-tr-none' : 'bg-gray-100 dark:bg-zinc-800 rounded-tl-none border-[0.5px] border-gray-200 dark:border-zinc-700'}`}
                                  style={m.senderId === user.id ? { backgroundColor: user.chatSettings?.senderColor || '#8b5cf6' } : {}}
                                  onClick={() => m.sharedProfile?.id && onNavigateToProfile?.(m.sharedProfile.id)}
                                >
                                  <div className="p-4 bg-white dark:bg-[#111] border-[0.5px] border-gray-100 dark:border-zinc-800 rounded-xl flex items-center space-x-3">
                                    <img src={m.sharedProfile.avatar} className="w-12 h-12 rounded-xl object-cover" alt="" />
                                    <div className="min-w-0">
                                      <p className="text-sm font-black text-gray-900 dark:text-white truncate">{m.sharedProfile.name} {m.sharedProfile.lastName}</p>
                                      <p className="text-[10px] text-slate-500 font-bold uppercase truncate">{m.sharedProfile.position}</p>
                                      <p className="text-[9px] text-blue-600 font-bold mt-1">{t('view_profile')}</p>
                                    </div>
                                  </div>
                                  {m.text && <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 font-medium">{m.text}</div>}
                                </div>
                              ) : (m.sharedEvent || (m.sharedEventId && globalEvents.find(e => e.id === m.sharedEventId))) ? (
                                (() => {
                                  const event = m.sharedEvent || globalEvents.find(e => e.id === m.sharedEventId);
                                  if (!event) return <div className="p-4 bg-slate-100 dark:bg-zinc-800 rounded-2xl text-xs text-slate-500 italic">{t('event_not_available')}</div>;
                                  return (
                                    <div
                                      className={`p-1 rounded-2xl overflow-hidden cursor-pointer transition-all ${m.senderId === user.id ? 'rounded-tr-none' : 'bg-gray-100 dark:bg-zinc-800 rounded-tl-none border-[0.5px] border-gray-200 dark:border-zinc-700'}`}
                                      style={m.senderId === user.id ? { backgroundColor: user.chatSettings?.senderColor || '#8b5cf6' } : {}}
                                      onClick={() => onNavigateToEvent?.(event.creator_id, event.id)}
                                    >
                                      <div className="p-4 bg-white dark:bg-[#111] border-[0.5px] border-gray-100 dark:border-zinc-800 rounded-xl flex items-center space-x-4 shadow-sm">
                                        <div className="p-3 bg-blue-50 dark:bg-zinc-800/50 rounded-2xl text-blue-500">
                                          <Calendar size={24} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-black text-gray-900 dark:text-white truncate mb-1">{event.title}</p>
                                          <div className="flex items-center text-[10px] text-slate-500 font-bold uppercase tracking-wide truncate mb-1.5 space-x-1.5">
                                            <span className="truncate">{event.location}</span>
                                            <span>•</span>
                                            <span>{new Date(event.event_date).toLocaleDateString()}</span>
                                          </div>
                                          <p className="text-[10px] text-blue-600 dark:text-blue-400 font-black uppercase inline-flex items-center hover:underline">{t('view_event')}</p>
                                        </div>
                                      </div>
                                      {m.text && <div className="px-4 py-2 text-sm text-gray-100 dark:text-gray-200 font-medium">{m.text}</div>}
                                    </div>
                                  );
                                })()
                              ) : (
                                (() => {
                                  const trimmedText = m.text.trim();

                                  const imageRegex = /https?:\/\/[^\s]+?\.(?:jpg|jpeg|png|gif|webp|svg)(?:\?.*)?/i;
                                  const isBase64 = trimmedText.includes('data:image') || trimmedText.includes(';base64,');
                                  const isDirectUrl = !!trimmedText.match(/^https?:\/\/[^\s]+?\.(?:jpg|jpeg|png|gif|webp|svg)(?:\?.*)?$/i);
                                  const extractedImageUrl = !isDirectUrl && !isBase64 ? m.text.match(imageRegex)?.[0] : null;

                                  const isImage = isBase64 || isDirectUrl;
                                  const hasImageInText = !!extractedImageUrl;

                                  const isProbablyData = !isImage && !hasImageInText &&
                                    !trimmedText.startsWith('http') &&
                                    (trimmedText.includes(';base64,') || (trimmedText.length > 60 && !trimmedText.includes(' ')));

                                  if (isProbablyData) {
                                    return <div className="p-3 text-xs italic text-slate-400 bg-slate-100 dark:bg-zinc-800 rounded-lg">Adjunto o dato de sistema</div>;
                                  }

                                  const firstUrl = extractFirstUrl(m.text);
                                  const hasPreview = firstUrl && isExternalUrl(firstUrl) && !isImage;
                                  const isOwnMessage = m.senderId === user.id;
                                  const canEdit = isOwnMessage && !isImage && !m.is_deleted && !hasPreview && !m.postId && !m.sharedProfile && !(m.sharedEvent || m.sharedEventId) &&
                                    (Date.now() - new Date(m.timestamp).getTime() < 15 * 60 * 1000);

                                  return (
                                    <div className="flex flex-col w-full">
                                      <div className="relative group">
                                        <div
                                          className={`relative ${isImage || hasPreview ? 'p-0.5' : 'pt-1.5 pb-2 px-3.5'} rounded-2xl text-sm font-medium transition-all duration-500 break-words w-fit ${m.senderId === user.id ? `text-white ml-auto` : `${isImage || hasPreview ? '' : 'border'} border-gray-200 dark:border-zinc-700 mr-auto`} ${contextMenu?.messageId === m.id ? 'z-[50] shadow-2xl scale-[1.05]' : 'z-auto'}`}
                                          onContextMenu={(e) => handleContextMenu(e, m.id, m.senderId === user.id)}
                                          onTouchStart={(e) => handleTouchStart(m.id, m.senderId === user.id, e)}
                                          onTouchEnd={handleTouchEnd}
                                          style={
                                            m.senderId === user.id
                                              ? { backgroundColor: user.chatSettings?.senderColor || '#8b5cf6' }
                                              : { backgroundColor: user.chatSettings?.receiverColor || (highlightedMessageId === m.id ? '#dbeafe' : '#f1f5f9'), color: user.chatSettings?.receiverColor === '#27272a' ? '#fff' : '#1f2937' }
                                          }
                                        >
                                          {isImage ? (
                                            <div className="rounded-2xl overflow-hidden border-[0.5px] border-black/10 dark:border-white/10 shadow-sm">
                                              <img
                                                src={trimmedText}
                                                alt="Shared image"
                                                className="max-w-full max-h-60 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                                onClick={() => setSelectedFullImage(trimmedText)}
                                              />
                                            </div>
                                          ) : editingMessageId === m.id ? (
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
                                                  {t('cancel') || 'Cancelar'}
                                                </button>
                                                <button
                                                  onClick={() => handleEditSubmit(m.id)}
                                                  className="px-3 py-1 bg-white text-blue-600 rounded-lg text-[10px] uppercase font-black hover:bg-white/90 transition-colors"
                                                >
                                                  {t('edit') || 'Editar'}
                                                </button>
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="relative">
                                              <div>
                                                {(() => {
                                                  if (hasPreview && firstUrl) {
                                                    const mainText = m.text.replace(firstUrl, '').trim();
                                                    return (
                                                      <>
                                                        {mainText && <span className="whitespace-pre-wrap break-words">{mainText}</span>}
                                                        <LinkPreview url={firstUrl} language={language} />
                                                      </>
                                                    );
                                                  }

                                                  if (hasImageInText && extractedImageUrl) {
                                                    const textWithoutUrl = m.text.replace(extractedImageUrl, '').trim();
                                                    return (
                                                      <>
                                                        {textWithoutUrl && <span className="whitespace-pre-wrap break-words">{textWithoutUrl}</span>}
                                                        <div className="rounded-2xl overflow-hidden mt-1 border-[0.5px] border-black/10 dark:border-white/10 shadow-sm">
                                                          <img
                                                            src={extractedImageUrl}
                                                            alt="Shared content"
                                                            className="max-w-full max-h-60 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                                            onClick={() => setSelectedFullImage(extractedImageUrl)}
                                                          />
                                                        </div>
                                                      </>
                                                    );
                                                  }

                                                  if (trimmedText.startsWith('http') && trimmedText.length > 50) {
                                                    return (
                                                      <a href={trimmedText} target="_blank" rel="noopener noreferrer" className="underline break-all block">
                                                        {trimmedText.substring(0, 30)}...{trimmedText.substring(trimmedText.length - 20)}
                                                      </a>
                                                    );
                                                  }

                                                  if (m.is_deleted) {
                                                    const deleteText = isOwnMessage ? "Eliminaste este mensaje" : "Este mensaje ha sido eliminado";
                                                    return (
                                                      <div className={`flex items-center space-x-2 ${isOwnMessage ? 'text-white/60' : 'text-slate-400'} italic py-1`}>
                                                        <Ban size={14} className="opacity-70" />
                                                        <span>{deleteText}</span>
                                                      </div>
                                                    );
                                                  }

                                                  if (trimmedText.includes('eliminado por el administrador')) {
                                                    return (
                                                      <div className={`flex items-center space-x-2 ${isOwnMessage ? 'text-white/60' : 'text-slate-400'} italic py-1`}>
                                                        <Ban size={14} className="opacity-70" />
                                                        <span>{trimmedText}</span>
                                                      </div>
                                                    );
                                                  }

                                                  return <span className="whitespace-pre-wrap break-words">{m.text}</span>;
                                                })()}

                                                {/* Spacer to prevent text overlap with the absolute status */}
                                                {(() => {
                                                  const isDeleted = m.is_deleted || trimmedText.includes('eliminado por el administrador');
                                                  const showEdited = !isDeleted && m.updated_at && (new Date(m.updated_at).getTime() - new Date(m.timestamp).getTime() > 3000);
                                                  return <span className={`inline-block ${showEdited ? 'w-[85px]' : 'w-[45px]'} h-2`}></span>;
                                                })()}
                                              </div>

                                              {/* Time and Edited status absolute positioned to the bottom right corner */}
                                              <div className="absolute bottom-[-5px] right-[-2px] flex items-center justify-end space-x-1 opacity-80 select-none text-[10px] min-w-max">
                                                {(() => {
                                                  const isDeleted = m.is_deleted || trimmedText.includes('eliminado por el administrador');
                                                  const showEdited = !isDeleted && m.updated_at && (new Date(m.updated_at).getTime() - new Date(m.timestamp).getTime() > 3000);

                                                  return showEdited && (
                                                    <span className="font-bold uppercase tracking-tighter">
                                                      {t('editado') || 'Editado'}
                                                    </span>
                                                  );
                                                })()}
                                                <span className="font-medium">
                                                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                              </div>
                                            </div>
                                          )}
                                        </div>
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

            <div className="p-4 bg-white dark:bg-[#111] border-t border-gray-100 dark:border-zinc-900">
              <form onSubmit={handleSend} className="flex items-center space-x-3 bg-gray-50 dark:bg-zinc-900 rounded-2xl p-2 border border-gray-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="p-3 text-slate-400 hover:text-blue-600 transition-colors disabled:opacity-50"
                >
                  {isUploading ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18} />}
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  className="hidden"
                  accept="image/*"
                />
                <textarea
                  value={msg}
                  onChange={(e) => {
                    setMsg(e.target.value);
                    // Simple auto-height adjustment
                    e.target.style.height = 'auto';
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e as any);
                    }
                  }}
                  placeholder={t('write_private_message')}
                  className="flex-1 bg-transparent border-none px-4 py-2 text-sm font-medium outline-none focus:ring-0 dark:text-white resize-none max-h-[150px] min-h-[40px] leading-relaxed"
                  rows={1}
                />
                <button
                  type="submit"
                  disabled={!msg.trim()}
                  className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 transform active:scale-90 transition-all"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-[#111] w-full max-w-md rounded-[2.5rem] overflow-hidden border border-white/20 dark:border-zinc-800 animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]">
              <div className="p-6 border-b border-gray-50 dark:border-zinc-900 flex items-center justify-between">
                <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">{t('chat_info')}</h3>
                <button
                  onClick={() => { setIsInfoOpen(false); setInfoSearch(''); }}
                  className="p-2 bg-gray-50 dark:bg-zinc-800 rounded-xl text-gray-400 hover:text-red-500 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 border-b border-gray-50 dark:border-zinc-900">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input
                    type="text"
                    placeholder={t('search_messages')}
                    value={infoSearch}
                    onChange={(e) => setInfoSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-gray-100 dark:bg-zinc-900 dark:text-white border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
                {infoSearch.trim() ? (
                  <div className="p-4 space-y-4">
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
                    <div className="flex p-2 gap-2 mb-4 bg-gray-50 dark:bg-zinc-900/50 rounded-2xl mx-4 mt-4">
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

                    <div className="px-6 flex-1">
                      {infoTab === 'multimedia' ? (
                        <div className="grid grid-cols-3 gap-2 pb-6">
                          {chatInfoData.media.length > 0 ? [...chatInfoData.media].reverse().map((url, i) => (
                            <div key={i} className="aspect-square rounded-xl overflow-hidden border border-slate-100 dark:border-zinc-800 group relative cursor-pointer" onClick={() => setSelectedFullImage(url)}>
                              <img src={url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
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
                              const post = item.data as Post;
                              return (
                                <div
                                  key={item.id}
                                  onClick={() => onViewPost?.(post.id)}
                                  className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-gray-100 dark:border-zinc-800 cursor-pointer hover:border-blue-500 transition-all"
                                >
                                  <div className="flex items-center space-x-2 mb-2">
                                    <img src={post.authorAvatar} className="w-6 h-6 rounded-lg object-cover" alt="" />
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{post.authorName}</p>
                                      <span className="text-[9px] text-gray-400 font-medium block">{new Date(item.timestamp).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                  <p className="text-[11px] text-gray-600 dark:text-gray-300 line-clamp-2 mb-2 font-medium">{post.content}</p>
                                  <p className="text-[9px] text-blue-600 font-bold uppercase tracking-widest">{t('view_post')}</p>
                                </div>
                              );
                            } else if (item.type === 'profile') {
                              const profile = item.data as User;
                              return (
                                <div
                                  key={item.id}
                                  onClick={() => profile.id && onNavigateToProfile?.(profile.id)}
                                  className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-gray-100 dark:border-zinc-800 cursor-pointer hover:border-blue-500 transition-all flex items-center space-x-3"
                                >
                                  <img src={profile.avatar} className="w-10 h-10 rounded-xl object-cover" alt="" />
                                  <div className="min-w-0">
                                    <p className="text-xs font-black text-gray-900 dark:text-white truncate">{profile.name} {profile.lastName}</p>
                                    <p className="text-[9px] text-slate-500 font-bold uppercase truncate">{profile.position}</p>
                                    <span className="text-[9px] text-gray-400 font-medium mt-1 block">{new Date(item.timestamp).toLocaleDateString()}</span>
                                  </div>
                                </div>
                              );
                            } else if (item.type === 'event') {
                              const event = item.data as CalendarEvent;
                              return (
                                <div
                                  key={item.id}
                                  onClick={() => onNavigateToEvent?.(event.creator_id, event.id)}
                                  className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-gray-100 dark:border-zinc-800 cursor-pointer hover:border-blue-500 transition-all"
                                >
                                  <div className="flex items-center space-x-3 mb-2">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-400">
                                      <Calendar size={14} />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-xs font-black text-gray-900 dark:text-white truncate">{event.title}</p>
                                      <span className="text-[9px] text-gray-400 font-medium block">{new Date(item.timestamp).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                  <p className="text-[9px] text-blue-600 font-bold">{t('view_details')}</p>
                                </div>
                              );
                            } else if (item.type === 'link') {
                              const link = item.data as { url: string, text: string };
                              return (
                                <div key={item.id} className="relative group/link bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-zinc-800">
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

      {
        selectedFullImage && (
          <div
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setSelectedFullImage(null)}
          >
            <button
              onClick={() => setSelectedFullImage(null)}
              className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all hover:rotate-90"
            >
              <X size={24} />
            </button>
            <div
              className="relative max-w-5xl max-h-[90vh] w-full flex items-center justify-center animate-in zoom-in-95 duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedFullImage}
                alt="Preview"
                className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        )
      }


      {contextMenu && (() => {
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
        const showEdit = !isImage && !msg?.is_deleted && canEditTime;

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
          </div>
        );
      })()}
    </div >
  );
};
