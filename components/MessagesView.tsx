
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Send, Info, MessageSquare, Check, CheckCheck, Sparkles, X, Link as LinkIcon, Image as ImageIcon, Loader2, Calendar } from 'lucide-react';
import { User, Chat, Message, Post, CalendarEvent } from '../types';
import { normalizeString } from '../utils/stringUtils';
import { supabase } from '../supabaseClient';

interface MessagesViewProps {
  user: User;
  chats: Chat[];
  posts: Post[];
  onSendMessage: (recipientId: string, text: string) => void;
  onViewPost?: (postId: string) => void;
  onLike?: (id: string) => void;
  onVote?: (id: string, dir: 'up' | 'down') => void;
  onAddComment?: (postId: string, text: string) => void;
  onNavigateToProfile?: (userId: string) => void;
  onMarkChatAsRead?: (chatId: string) => void;
  externalActiveId?: string | null;
  onNavigateToEvent?: (userId: string, eventId: string) => void;
  globalEvents: CalendarEvent[];
}

export const MessagesView: React.FC<MessagesViewProps> = ({
  user, chats, posts, onSendMessage, onViewPost, onLike, onVote, onAddComment, onNavigateToProfile, onMarkChatAsRead, externalActiveId, onNavigateToEvent, globalEvents
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(externalActiveId || chats[0]?.id || null);
  const [msg, setMsg] = useState('');
  const [chatSearchTerm, setChatSearchTerm] = useState('');
  const [temporaryParticipant, setTemporaryParticipant] = useState<User | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !selectedId) return;
    const file = e.target.files[0];

    // Limit size if needed, e.g. 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert("La imagen es demasiado grande (max 5MB)");
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

  useEffect(() => {
    if (externalActiveId) {
      const existingChat = chats.find(c => c.id === externalActiveId);
      if (existingChat) {
        setSelectedId(externalActiveId);
        setTemporaryParticipant(null);
      } else {
        // Si el chat no existe en la lista, buscar el perfil para mostrarlo como "Chat Nuevo"
        fetchParticipantProfile(externalActiveId);
      }
    }
  }, [externalActiveId, chats]);

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
        interests: data.interests || []
      });
      setSelectedId(uid);
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
    if (shouldAutoScrollRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    if (selectedId) {
      onMarkChatAsRead?.(selectedId);
    }
  }, [selectedId, chats, onMarkChatAsRead]);

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
    shouldAutoScrollRef.current = true; // Forzar scroll al enviar mensaje propio
    onSendMessage(selectedId, msg);
    setMsg('');
  };

  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [infoSearch, setInfoSearch] = useState('');
  const [infoTab, setInfoTab] = useState<'multimedia' | 'enlaces'>('multimedia');

  const chatInfoData = useMemo(() => {
    if (!selectedChat) return { media: [], links: [], sharedPosts: [], sharedProfiles: [], sharedEvents: [], searchResults: [] };

    const media: string[] = [];
    const links: { text: string, url: string }[] = [];
    const sharedPosts: Post[] = [];
    const sharedProfiles: User[] = [];
    const sharedEvents: CalendarEvent[] = [];

    const searchResults = infoSearch.trim()
      ? selectedChat.messages.filter(m => normalizeString(m.text).includes(normalizeString(infoSearch)))
      : [];

    selectedChat.messages.forEach(m => {
      // Extract images from text
      const imgRegex = /(https?:\/\/[^\s]+?\.(?:jpg|jpeg|png|gif|svg|webp))/gi;
      let match;
      while ((match = imgRegex.exec(m.text)) !== null) {
        media.push(match[0]);
      }

      // Extract general links from text
      const linkRegex = /(https?:\/\/[^\s]+)/gi;
      let lMatch;
      while ((lMatch = linkRegex.exec(m.text)) !== null) {
        if (!lMatch[0].match(/\.(?:jpg|jpeg|png|gif|svg|webp)$/i)) {
          links.push({ text: m.text, url: lMatch[0] });
        }
      }

      // Extract shared objects
      if (m.postId) {
        const post = posts.find(p => p.id === m.postId);
        if (post) sharedPosts.push(post);
      }
      if (m.sharedProfile) {
        sharedProfiles.push(m.sharedProfile);
      }
      if (m.sharedEvent || m.sharedEventId) {
        const event = m.sharedEvent || globalEvents.find(e => e.id === m.sharedEventId);
        if (event) sharedEvents.push(event);
      }
    });

    return { media, links, sharedPosts, sharedProfiles, sharedEvents, searchResults };
  }, [selectedChat, infoSearch, posts, globalEvents]);

  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  const scrollToMessage = (msgId: string) => {
    setIsInfoOpen(false);
    setInfoSearch('');

    // Give time for modal to close if needed, then scroll
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
    <div className="h-[calc(100vh-120px)] sm:h-[calc(100vh-180px)] bg-white dark:bg-[#111] rounded-3xl border border-gray-100 dark:border-zinc-800 overflow-hidden flex flex-col md:flex-row">
      <div className={`w-full md:w-80 border-r border-gray-100 dark:border-zinc-900 flex flex-col ${selectedId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b border-gray-50 dark:border-zinc-900">
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4">Mensajes</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input
              type="text"
              placeholder="Buscar colega..."
              value={chatSearchTerm}
              onChange={(e) => setChatSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-zinc-900 dark:text-white border-none rounded-xl text-sm outline-none font-medium"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {temporaryParticipant && !chats.find(c => c.id === temporaryParticipant.id) && (
            <button
              onClick={() => setSelectedId(temporaryParticipant.id)}
              className={`w-full p-4 flex items-center space-x-3 bg-blue-50/30 dark:bg-zinc-800/30 border-r-4 border-blue-600`}
            >
              <img src={temporaryParticipant.avatar} className="w-12 h-12 rounded-2xl object-cover" alt="" />
              <div className="flex-1 text-left min-w-0">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="font-bold text-gray-900 dark:text-white text-sm truncate">{temporaryParticipant.name}</span>
                  <span className="text-[8px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full font-black uppercase">Nuevo</span>
                </div>
                <p className="text-xs text-blue-600 font-bold italic truncate">Escribe el primer mensaje...</p>
              </div>
            </button>
          )}
          {filteredChats.map(chat => (
            <button
              key={chat.id}
              onClick={() => { setSelectedId(chat.id); setTemporaryParticipant(null); }}
              className={`w-full p-4 flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-all ${selectedId === chat.id ? 'bg-blue-50/50 dark:bg-zinc-800/50 border-r-4 border-blue-600' : ''}`}
            >
              <img src={chat.participant.avatar} className="w-12 h-12 rounded-2xl object-cover" alt="" />
              <div className="flex-1 text-left min-w-0">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="font-bold text-gray-900 dark:text-white text-sm truncate">{chat.participant.name} {chat.participant.lastName}</span>
                  <span className="text-[9px] text-gray-400 font-black uppercase ml-2 whitespace-nowrap">
                    {new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate font-medium">{chat.lastMessage}</p>
              </div>
            </button>
          ))}
          {chats.length === 0 && !temporaryParticipant && (
            <div className="p-8 text-center">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Sin conversaciones</p>
            </div>
          )}
        </div>
      </div>

      <div className={`flex-1 flex flex-col bg-slate-50/30 dark:bg-black/20 ${!selectedId ? 'hidden md:flex' : 'flex'}`}>
        {participant ? (
          <>
            <div className="p-4 bg-white dark:bg-[#111] border-b border-gray-50 dark:border-zinc-900 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setSelectedId(null)}
                  className="p-2 -ml-2 text-slate-400 hover:text-blue-600 md:hidden"
                >
                  <X size={20} />
                </button>
                <img
                  src={participant.avatar}
                  className="w-10 h-10 rounded-xl object-cover cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                  alt=""
                  onClick={() => participant.id && onNavigateToProfile?.(participant.id)}
                />
                <div
                  className="cursor-pointer group"
                  onClick={() => participant.id && onNavigateToProfile?.(participant.id)}
                >
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm group-hover:text-blue-600 transition-colors">
                    {participant.name} {participant.lastName || ''}
                  </h3>
                  <div className="flex items-center text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
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

            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
            >
              {selectedChat ? selectedChat.messages.map((m, idx) => (
                <div
                  key={m.id || idx}
                  id={`msg-${m.id}`}
                  className={`flex ${m.senderId === user.id ? 'justify-end' : 'justify-start'} transition-all duration-500 ${highlightedMessageId === m.id ? 'scale-105 brightness-110' : ''}`}
                >
                  <div className={`max-w-[85%] md:max-w-[75%] space-y-1 ${m.senderId === user.id ? 'items-end' : 'items-start'}`}>
                    {m.postId ? (
                      (() => {
                        const sharedPost = posts.find(p => p.id === m.postId);
                        if (!sharedPost) return (
                          <div className={`p-4 rounded-2xl text-sm font-medium italic text-slate-500 bg-slate-100 dark:bg-zinc-800 ${m.senderId === user.id ? 'rounded-tr-none' : 'rounded-tl-none'}`}>
                            Publicación no disponible
                          </div>
                        );
                        return (
                          <div
                            className={`p-1 rounded-2xl overflow-hidden cursor-pointer transition-all hover:ring-2 hover:ring-blue-500/50 ${m.senderId === user.id ? 'bg-blue-50 dark:bg-blue-900/10 rounded-tr-none' : 'bg-white dark:bg-zinc-900 rounded-tl-none border border-slate-100 dark:border-zinc-800'}`}
                            onClick={() => onViewPost?.(sharedPost.id)}
                          >
                            <div className="p-3 bg-white dark:bg-[#111] border border-gray-100 dark:border-zinc-800 rounded-xl m-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <img src={sharedPost.authorAvatar} className="w-6 h-6 rounded-lg object-cover" alt="" />
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{sharedPost.authorName}</p>
                                  <p className="text-[9px] text-gray-400 font-bold uppercase truncate">{sharedPost.authorPosition}</p>
                                </div>
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mb-2 font-medium">{sharedPost.content}</p>
                              {sharedPost.imageUrl && (
                                <div className="rounded-lg overflow-hidden h-24 mb-2">
                                  <img src={sharedPost.imageUrl} className="w-full h-full object-cover" alt="" />
                                </div>
                              )}
                              <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase tracking-widest bg-gray-50 dark:bg-zinc-900 p-2 rounded-lg">
                                <span>Publicación</span>
                                <span className="text-blue-600">Ver más</span>
                              </div>
                            </div>
                            {m.text && <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 font-medium">{m.text}</div>}
                          </div>
                        );
                      })()
                    ) : m.sharedProfile ? (
                      <div
                        className={`p-1 rounded-2xl overflow-hidden cursor-pointer transition-all hover:ring-2 hover:ring-blue-500/50 ${m.senderId === user.id ? 'bg-blue-50 dark:bg-blue-900/10 rounded-tr-none' : 'bg-white dark:bg-zinc-900 rounded-tl-none border border-slate-100 dark:border-zinc-800'}`}
                        onClick={() => m.sharedProfile?.id && onNavigateToProfile?.(m.sharedProfile.id)}
                      >
                        <div className="p-4 bg-white dark:bg-[#111] border border-gray-100 dark:border-zinc-800 rounded-xl m-1 flex items-center space-x-3">
                          <img src={m.sharedProfile.avatar} className="w-12 h-12 rounded-xl object-cover" alt="" />
                          <div className="min-w-0">
                            <p className="text-sm font-black text-gray-900 dark:text-white truncate">{m.sharedProfile.name} {m.sharedProfile.lastName}</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase truncate">{m.sharedProfile.position}</p>
                            <p className="text-[9px] text-blue-600 font-bold mt-1">Ver Perfil</p>
                          </div>
                        </div>
                        {m.text && <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 font-medium">{m.text}</div>}
                      </div>
                    ) : (m.sharedEvent || (m.sharedEventId && globalEvents.find(e => e.id === m.sharedEventId))) ? (
                      (() => {
                        const event = m.sharedEvent || globalEvents.find(e => e.id === m.sharedEventId);
                        if (!event) return <div className="p-4 bg-slate-100 dark:bg-zinc-800 rounded-2xl text-xs text-slate-500 italic">Evento no disponible</div>;
                        return (
                          <div
                            className={`p-1 rounded-2xl overflow-hidden cursor-pointer transition-all hover:ring-2 hover:ring-blue-500/50 ${m.senderId === user.id ? 'bg-blue-50 dark:bg-blue-900/10 rounded-tr-none' : 'bg-white dark:bg-zinc-900 rounded-tl-none border border-slate-100 dark:border-zinc-800'}`}
                            onClick={() => onNavigateToEvent?.(event.creator_id, event.id)}
                          >
                            <div className="p-4 bg-white dark:bg-[#111] border border-gray-100 dark:border-zinc-800 rounded-xl m-1 flex items-center space-x-3">
                              <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl text-blue-600 dark:text-blue-400">
                                <Calendar size={20} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-black text-gray-900 dark:text-white truncate">{event.title}</p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase truncate">{event.location} • {new Date(event.event_date).toLocaleDateString()}</p>
                                <p className="text-[9px] text-blue-600 font-bold mt-1">Ver Evento</p>
                              </div>
                            </div>
                            {m.text && <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 font-medium">{m.text}</div>}
                          </div>
                        );
                      })()
                    ) : (
                      <div className={`p-4 rounded-2xl text-sm font-medium transition-all duration-500 ${m.senderId === user.id ? (highlightedMessageId === m.id ? 'bg-blue-400 ring-4 ring-blue-200' : 'bg-blue-600') + ' text-white rounded-tr-none' : (highlightedMessageId === m.id ? 'bg-blue-50 dark:bg-blue-900/20 ring-4 ring-blue-100 dark:ring-blue-900/30' : 'bg-white dark:bg-zinc-900') + ' text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-zinc-800'}`}>
                        {m.text.startsWith('data:image') || m.text.match(/\.(jpg|jpeg|png|gif|webp)$/i) || (m.text.startsWith('http') && m.text.match(/(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp))/i)) ? (
                          <div className="rounded-lg overflow-hidden">
                            <img src={m.text} alt="Shared image" className="max-w-full max-h-60 object-cover cursor-pointer" onClick={() => { const w = window.open(""); w?.document.write(`<img src="${m.text}" />`); }} />
                          </div>
                        ) : (
                          m.text
                        )}
                      </div>
                    )}
                    <div className="flex items-center space-x-2 px-1">
                      <span className="text-[9px] text-slate-400 font-black uppercase">
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {m.senderId === user.id && (
                        m.isRead ? (
                          <CheckCheck size={12} className="text-blue-500" />
                        ) : (
                          <Check size={12} className="text-blue-500" />
                        )
                      )}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="p-6 bg-blue-50 dark:bg-zinc-800 rounded-full text-blue-600">
                    <Sparkles size={40} />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-gray-900 dark:text-white">Nueva Conversación</h4>
                    <p className="text-sm text-gray-400 font-medium">Estás iniciando un chat con {participant.name}.</p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
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
                <input
                  type="text"
                  value={msg}
                  onChange={(e) => setMsg(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e as any);
                    }
                  }}
                  placeholder="Escribe un mensaje privado..."
                  className="flex-1 bg-transparent border-none px-4 py-2 text-sm font-medium outline-none focus:ring-0 dark:text-white"
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
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Selecciona un chat</h3>
            <p className="text-slate-400 max-w-xs font-medium">Elige una conversación de la izquierda o inicia una nueva desde el perfil de un/a colega.</p>
          </div>
        )}
      </div>

      {isInfoOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#111] w-full max-w-md rounded-[2.5rem] overflow-hidden border border-white/20 dark:border-zinc-800 animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-gray-50 dark:border-zinc-900 flex items-center justify-between">
              <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Info del chat</h3>
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
                  placeholder="Buscar mensaje..."
                  value={infoSearch}
                  onChange={(e) => setInfoSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-100 dark:bg-zinc-900 dark:text-white border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
              {infoSearch.trim() ? (
                <div className="p-4 space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Resultados de búsqueda</h4>
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
                    <p className="text-center py-8 text-xs text-slate-400 font-bold italic">No se encontraron mensajes</p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  <div className="flex p-2 gap-2 mb-4 bg-gray-50 dark:bg-zinc-900/50 rounded-2xl mx-4 mt-4">
                    <button
                      onClick={() => setInfoTab('multimedia')}
                      className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${infoTab === 'multimedia' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-blue-600'}`}
                    >
                      Multimedia
                    </button>
                    <button
                      onClick={() => setInfoTab('enlaces')}
                      className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${infoTab === 'enlaces' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-blue-600'}`}
                    >
                      Enlaces
                    </button>
                  </div>

                  <div className="px-6 flex-1">
                    {infoTab === 'multimedia' ? (
                      <div className="grid grid-cols-3 gap-2 pb-6">
                        {chatInfoData.media.length > 0 ? chatInfoData.media.map((url, i) => (
                          <div key={i} className="aspect-square rounded-xl overflow-hidden border border-slate-100 dark:border-zinc-800 group relative cursor-pointer" onClick={() => window.open(url, '_blank')}>
                            <img src={url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                          </div>
                        )) : (
                          <div className="col-span-3 text-center py-20">
                            <p className="text-xs text-slate-400 font-bold italic">No hay archivos multimedia</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4 pb-6">
                        {chatInfoData.sharedPosts.map((post, i) => (
                          <div
                            key={`post-${i}`}
                            onClick={() => onViewPost?.(post.id)}
                            className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-gray-100 dark:border-zinc-800 cursor-pointer hover:border-blue-500 transition-all"
                          >
                            <div className="flex items-center space-x-2 mb-2">
                              <img src={post.authorAvatar} className="w-6 h-6 rounded-lg object-cover" alt="" />
                              <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{post.authorName}</p>
                            </div>
                            <p className="text-[11px] text-gray-600 dark:text-gray-300 line-clamp-2 mb-2 font-medium">{post.content}</p>
                            <p className="text-[9px] text-blue-600 font-bold uppercase tracking-widest">Ver Publicación</p>
                          </div>
                        ))}

                        {chatInfoData.sharedProfiles.map((profile, i) => (
                          <div
                            key={`profile-${i}`}
                            onClick={() => profile.id && onNavigateToProfile?.(profile.id)}
                            className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-gray-100 dark:border-zinc-800 cursor-pointer hover:border-blue-500 transition-all flex items-center space-x-3"
                          >
                            <img src={profile.avatar} className="w-10 h-10 rounded-xl object-cover" alt="" />
                            <div className="min-w-0">
                              <p className="text-xs font-black text-gray-900 dark:text-white truncate">{profile.name} {profile.lastName}</p>
                              <p className="text-[9px] text-slate-500 font-bold uppercase truncate">{profile.position}</p>
                            </div>
                          </div>
                        ))}

                        {chatInfoData.sharedEvents.map((event, i) => (
                          <div
                            key={`event-${i}`}
                            onClick={() => onNavigateToEvent?.(event.creator_id, event.id)}
                            className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-gray-100 dark:border-zinc-800 cursor-pointer hover:border-blue-500 transition-all"
                          >
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-400">
                                <Calendar size={14} />
                              </div>
                              <p className="text-xs font-black text-gray-900 dark:text-white truncate">{event.title}</p>
                            </div>
                            <p className="text-[9px] text-blue-600 font-bold">Ver Detalles</p>
                          </div>
                        ))}

                        {chatInfoData.links.length > 0 ? chatInfoData.links.map((link, i) => (
                          <button
                            key={i}
                            onClick={() => window.open(link.url, '_blank')}
                            className="w-full p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 text-left hover:border-blue-500 transition-all group"
                          >
                            <div className="flex items-center space-x-3 mb-1">
                              <div className="p-2 bg-blue-50 dark:bg-blue-900/10 rounded-lg text-blue-600"><LinkIcon size={14} /></div>
                              <p className="text-[10px] font-black text-blue-600 uppercase tracking-tight truncate flex-1">Enlace compartido</p>
                            </div>
                            <p className="text-xs font-bold text-gray-900 dark:text-white truncate group-hover:text-blue-600">{link.url}</p>
                          </button>
                        )) : (
                          chatInfoData.sharedPosts.length === 0 && chatInfoData.sharedProfiles.length === 0 && chatInfoData.sharedEvents.length === 0 && (
                            <div className="text-center py-20">
                              <p className="text-xs text-slate-400 font-bold italic">No hay enlaces compartidos</p>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
