
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Post, User, CalendarEvent } from '../types';
import { ImageIcon, Clapperboard, Smile, X, Users, Sparkles, Plus, AtSign, Calendar, MapPin } from 'lucide-react';
import { ShareModal } from './ShareModal';
import { PostCard } from './PostCard';
import { supabase } from '../supabaseClient';

interface SocialFeedProps {
  posts: Post[];
  user: User;
  onLike: (id: string) => void;
  onVote?: (id: string, direction: 'up' | 'down') => void;
  onRepost: (id: string) => void;
  onAddPost: (content: string, type: 'post' | 'news', tags: string[], imageUrl?: string, docUrl?: string, docName?: string, linkedEventId?: string) => void;
  onAddComment: (postId: string, text: string) => void;
  onDeletePost?: (postId: string) => void;
  onSearchHashtag?: (tag: string) => void;
  onSharePost?: (postId: string, participant: any) => void;
  onNavigateToProfile?: (userId: string) => void;
  onNavigateToPost?: (postId: string) => void;
  followedUserIds?: Set<string>;
  followerUserIds?: Set<string>;
  onToggleFollow?: (userId: string) => void;
  users?: User[];
  initialContent?: string | null;
  prefilledEvent?: CalendarEvent | null;
  onClearInitialContent?: () => void;
  onViewCalendar?: () => void;
  onNavigateToEvent?: (userId: string, eventId: string) => void;
  onShareViaChat?: (recipientId: string, text: string, postId?: string, profileId?: string) => void;
}

type FeedTab = 'for-you' | 'following';

export const SocialFeed: React.FC<SocialFeedProps> = ({
  // ... (keep existing props destructuring)
  posts, user, onLike, onVote, onRepost, onAddPost, onAddComment, onDeletePost, onSearchHashtag, onSharePost, onNavigateToProfile, onNavigateToPost, followedUserIds = new Set(), followerUserIds = new Set(), onToggleFollow, users = [], initialContent, prefilledEvent, onClearInitialContent, onViewCalendar, onNavigateToEvent, onShareViaChat
}) => {
  const [activeTab, setActiveTab] = useState<FeedTab>('for-you');
  const [content, setContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<{ name: string, url: string } | null>(null);
  const [sharingPost, setSharingPost] = useState<Post | null>(null);
  const [linkedEvent, setLinkedEvent] = useState<CalendarEvent | null>(null);

  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStartIndex, setMentionStartIndex] = useState<number>(-1);

  const [userEvents, setUserEvents] = useState<CalendarEvent[]>([]);
  const [showEventDropdown, setShowEventDropdown] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUserEvents = async () => {
      const { data } = await supabase
        .from('user_events')
        .select('*')
        .eq('creator_id', user.id)
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
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowEventDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // ... (keep existing useEffects and handlers until return)

  useEffect(() => {
    if (initialContent) {
      setContent(initialContent);
    }
    if (prefilledEvent) {
      setLinkedEvent(prefilledEvent);
    }
    if (initialContent || prefilledEvent) {
      if (onClearInitialContent) onClearInitialContent();
      setTimeout(() => {
        textareaRef.current?.focus();
        textareaRef.current?.setSelectionRange(content.length, content.length);
      }, 100);
    }
  }, [initialContent, prefilledEvent]);

  const filteredPosts = useMemo(() => {
    if (activeTab === 'following') return posts.filter(post => followedUserIds.has(post.authorId));
    const myInterests = user.interests || [];
    return posts.filter(post => {
      if (post.authorId === user.id) return true;
      const author = users.find(u => u.id === post.authorId);
      if (!author) return false;
      const authorInterests = author.interests || [];
      return authorInterests.some(interest => myInterests.includes(interest));
    });
  }, [posts, activeTab, followedUserIds, users, user]);

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
    setContent(value);

    const textBeforeCursor = value.slice(0, selectionStart);
    // Regex to find @ preceded by start-of-line or whitespace
    const match = textBeforeCursor.match(/(?:^|\s)@(\S*)$/);

    if (match) {
      const query = match[1]; // The text after @
      // Calculate the start index of the @ symbol
      // match.index is the start of the match (including the space if present)
      // We want the index of @.
      // If match starts with space, add 1.
      const matchText = match[0];
      const atIndex = selectionStart - matchText.length + (matchText.startsWith('@') ? 0 : 1);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !selectedImage && !selectedDoc && !linkedEvent) return;
    const tags = content.match(/#[\wáéíóúÁÉÍÓÚñÑ]+/g)?.map(t => t.slice(1)) || [];
    onAddPost(content, 'post', tags, selectedImage || undefined, selectedDoc?.url, selectedDoc?.name, linkedEvent?.id);
    setContent(''); setSelectedImage(null); setSelectedDoc(null); setLinkedEvent(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-20">
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md border-b border-gray-100 dark:border-zinc-900 flex items-center justify-center gap-x-16 px-4 rounded-b-2xl mb-2 h-14">
        <button onClick={() => setActiveTab('for-you')} className="px-4 py-4 text-sm font-bold relative group transition-all"><span className={activeTab === 'for-you' ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-zinc-600'}>Para ti</span>{activeTab === 'for-you' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full" />}</button>
        <button onClick={() => setActiveTab('following')} className="px-4 py-4 text-sm font-bold relative group transition-all"><span className={activeTab === 'following' ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-zinc-600'}>Siguiendo</span>{activeTab === 'following' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full" />}</button>
      </div>

      <div className="bg-white dark:bg-[#111] rounded-[2rem] border border-slate-300 dark:border-slate-700 relative">
        <div className="flex space-x-4 p-5">
          <img src={user.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
          <form onSubmit={handleSubmit} className="flex-1">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder="¿Qué ocurre?"
              className="w-full bg-transparent border-none text-xl dark:text-white placeholder-gray-400 focus:ring-0 resize-none min-h-[80px] mt-1 p-2"
            />

            {linkedEvent && (
              <div className="mt-2 mb-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 border border-blue-100 dark:border-blue-800/50 relative group/event">
                <button type="button" onClick={() => setLinkedEvent(null)} className="absolute top-2 right-2 p-1.5 bg-white dark:bg-zinc-800 text-slate-400 hover:text-red-500 rounded-full"><X size={14} /></button>
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-blue-600 text-white rounded-xl"><Calendar size={18} /></div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-widest mb-1">Evento vinculado</p>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">{linkedEvent.title}</h4>
                    <div className="flex items-center space-x-2 mt-1 text-[10px] text-slate-500 font-bold">
                      <MapPin size={10} /> <span>{linkedEvent.location}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {mentionQuery !== null && mentionSuggestions.length > 0 && (
              <div className="absolute left-16 mt-0 w-64 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-zinc-800 z-[60] overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-2 bg-gray-50 dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mencionar a...</span>
                </div>
                {mentionSuggestions.map(u => (
                  <button key={u.id} type="button" onClick={() => selectMention(u)} className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors text-left"><img src={u.avatar} className="w-8 h-8 rounded-lg object-cover" alt="" /><div className="min-w-0"><p className="text-sm font-bold text-gray-900 dark:text-white truncate">{u.name} {u.lastName}</p><p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold truncate">@{u.username}</p></div></button>
                ))}
              </div>
            )}

            {/* Event Selection Dropdown */}
            {showEventDropdown && (
              <div ref={dropdownRef} className="absolute bottom-16 left-20 w-72 bg-white dark:bg-[#111] rounded-2xl border border-gray-100 dark:border-zinc-800 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between bg-gray-50 dark:bg-zinc-900/50">
                  <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Tus Eventos</span>
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
                      <p className="text-xs text-gray-400 italic">No tienes eventos publicados.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedImage && <div className="relative mt-3 rounded-xl overflow-hidden border border-gray-100 dark:border-zinc-800"><img src={selectedImage} alt="Preview" className="w-full h-auto max-h-80 object-cover" /><button type="button" onClick={() => setSelectedImage(null)} className="absolute top-2 right-2 p-1.5 bg-gray-900/60 text-white rounded-full hover:bg-gray-900"><X size={14} /></button></div>}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-zinc-800">
              <div className="flex items-center space-x-1">
                <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onloadend = () => setSelectedImage(r.result as string); r.readAsDataURL(f); } }} />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-zinc-800 rounded-full transition-colors"><ImageIcon size={20} /></button>
                <button type="button" onClick={() => setShowEventDropdown(!showEventDropdown)} className={`p-2 rounded-full transition-colors ${showEventDropdown || linkedEvent ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' : 'text-blue-500 hover:bg-blue-50 dark:hover:bg-zinc-800'}`}><Calendar size={20} /></button>
              </div>
              <button type="submit" disabled={!content.trim() && !selectedImage && !selectedDoc && !linkedEvent} className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold text-sm disabled:opacity-50 transition-all hover:bg-blue-700">Publicar</button>
            </div>
          </form>
        </div>
      </div>

      <div className="space-y-4">
        {filteredPosts.length > 0 ? (
          filteredPosts.map(post => <PostCard key={post.id} post={post} onLike={onLike} onVote={onVote} onRepost={onRepost} onAddComment={onAddComment} onDeletePost={onDeletePost} onSearchHashtag={onSearchHashtag} onSharePost={onSharePost} onNavigateToProfile={onNavigateToProfile} onNavigateToPost={onNavigateToPost} onOpenShare={setSharingPost} currentUser={user} followedUserIds={followedUserIds} followerUserIds={followerUserIds} onToggleFollow={onToggleFollow} users={users} onViewCalendar={onViewCalendar} onNavigateToEvent={onNavigateToEvent} />)
        ) : (
          <div className="text-center py-20 bg-white dark:bg-[#111] rounded-[2.5rem] border border-dashed border-slate-200 dark:border-zinc-800 px-10">
            <div className="mx-auto w-16 h-16 bg-slate-50 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-4">
              {activeTab === 'for-you' ? <Sparkles className="text-blue-500" size={32} /> : <Users className="text-slate-200 dark:text-zinc-800" size={32} />}
            </div>
            <h4 className="text-slate-900 dark:text-white font-black mb-2">
              {activeTab === 'for-you' ? "Sin coincidencias de interés" : "Aún no sigues a nadie"}
            </h4>
            <p className="text-slate-400 font-medium text-sm italic mb-6">
              {activeTab === 'for-you'
                ? "Añade más intereses a tu perfil para conectar con colegas de tu especialidad."
                : "Sigue a tus colegas para ver sus actualizaciones aquí."}
            </p>
          </div>
        )}
      </div>
      {sharingPost && <ShareModal post={sharingPost} onClose={() => setSharingPost(null)} onShare={onShareViaChat} currentUser={user} users={users} followedUserIds={followedUserIds} followerUserIds={followerUserIds} />}
    </div>
  );
};
