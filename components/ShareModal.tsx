
import React, { useState, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { useScrollLock } from '../hooks/useScrollLock';
import { X, Copy, Check, Send, Search, MessageSquare, Users, Link as LinkIcon, User as UserIcon, Calendar, Newspaper, Clock } from 'lucide-react';
import { Post, User, Chat } from '../types';
import { getSafeAvatar } from '../utils/avatarUtils';

interface ShareModalProps {
  isOpen: boolean;
  post?: Post;
  event?: any; // Start with any to avoid import loop if types not ready, or use CalendarEvent
  user?: User; // The user profile being shared (if applicable)
  onClose: () => void;
  onShare?: (recipientId: string, text: string, sharedPostId?: string, sharedProfileId?: string, sharedEventId?: string, imageUrls?: string[], newsId?: string, scheduledAt?: Date) => Promise<void>;
  currentUser?: User; // Add currentUser to identify "me"
  users?: User[]; // All users to search/filter from
  followedUserIds?: Set<string>;
  followerUserIds?: Set<string>;
  chats?: Chat[];
}

const ContactItem: React.FC<{ contact: any, onSend: (u: User) => void, isSent: boolean }> = ({ contact, onSend, isSent }) => (
  <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-all group border border-transparent hover:border-slate-200/50 dark:hover:border-zinc-800 shadow-sm hover:shadow-md bg-white dark:bg-[#151515]/30">
    <div className="flex items-center space-x-3">
      <div className="relative">
        <img src={getSafeAvatar(contact.avatar)} className="w-10 h-10 rounded-xl object-cover border-2 border-white dark:border-zinc-800 shadow-sm group-hover:scale-105 transition-transform" alt="" />
      </div>
      <div>
        <p className="text-xs font-black text-slate-900 dark:text-white leading-tight">{contact.name} {contact.lastName}</p>
      </div>
    </div>
    <button
      onClick={() => onSend(contact)}
      disabled={isSent}
      className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all transform active:scale-95 shadow-sm ${isSent
        ? 'bg-slate-100 dark:bg-zinc-800 text-slate-400 cursor-not-allowed opacity-60'
        : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-600/30'
        }`}
    >
      {isSent ? (
        <div className="flex items-center space-x-1.5 px-1">
          <Check size={12} strokeWidth={3} />
          <span>Enviado</span>
        </div>
      ) : 'Enviar'}
    </button>
  </div>
);

const EmptySearch: React.FC<{ term: string }> = ({ term }) => (
  <div className="text-center py-10 bg-slate-50/50 dark:bg-zinc-900/30 rounded-[2rem] border border-dashed border-slate-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-300">
    <div className="mx-auto w-12 h-12 bg-white dark:bg-zinc-800 rounded-2xl flex items-center justify-center mb-3 shadow-md border border-slate-100 dark:border-zinc-700">
      <Search className="text-slate-300" size={24} />
    </div>
    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-4">
      Sin resultados
    </h4>
    <p className="text-[10px] text-slate-400 mt-1 px-8 opacity-70">
      No encontramos a "{term}" en la red.
    </p>
  </div>
);

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  post,
  event,
  user: sharedUser,
  onClose,
  onShare,
  currentUser,
  users = [],
  followedUserIds = new Set(),
  followerUserIds = new Set(),
  chats = []
}) => {
  if (!isOpen) return null;

  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sentTo, setSentTo] = useState<string[]>([]);

  useScrollLock();

  const getPostBaseUrl = (postType?: string) => {
    return postType === 'news' ? 'noticias' : 'inicio';
  };

  const shareUrl = sharedUser
    ? `https://red.novagob.org/@${sharedUser.username || sharedUser.id}`
    : event
      ? `https://red.novagob.org/@${event.creator_username || event.creator_id}/evento/${event.id}`
      : `https://red.novagob.org/${getPostBaseUrl(post?.type)}/${post?.id}`;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        // Fallback for non-secure contexts
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
        } catch (err) {
          console.error('Fallback: Oops, unable to copy', err);
        }
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy!', err);
    }
  };

  const handleSend = (contact: User) => {
    if (onShare) {
      const message = ""; // Send empty text so only the card is shown
      const isNews = post?.type === 'news';
      onShare(
        contact.id, 
        message, 
        isNews ? undefined : post?.id, 
        sharedUser?.id, 
        event?.id, 
        undefined, // imageUrls
        isNews ? post?.id : undefined, // newsId
        undefined // scheduledAt
      );
    }
    setSentTo([...sentTo, contact.id]);
  };

  // Unified logic for contacts: 5 Recent Chats + Friends -> Max 20 total
  const { orderedContacts, searchResults } = useMemo(() => {
    if (searchTerm.trim()) {
      // Global search across all users when searching
      const filtered = users
        .filter(u => u.id !== currentUser?.id)
        .filter(u =>
          u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.username?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .slice(0, 20);
      
      return { orderedContacts: [], searchResults: filtered };
    }

    // 1. Get top 5 unique recent chats
    const seenRecent = new Set<string>();
    const recents: User[] = [];
    for (const chat of chats) {
      if (recents.length >= 5) break;
      const pid = chat.participant.id;
      if (pid && !seenRecent.has(pid) && pid !== currentUser?.id) {
        seenRecent.add(pid);
        const u = users.find(user => user.id === pid);
        if (u) {
          recents.push(u);
        }
      }
    }

    // 2. Fill the rest (up to 20 total) with friends (mutuals) that aren't already in recents
    const remainingSlots = 20 - recents.length;
    const friendIds = Array.from(followedUserIds as Set<string>).filter(id => (followerUserIds as Set<string>).has(id));
    const friends: User[] = [];
    for (const id of friendIds) {
      if (friends.length >= remainingSlots) break;
      if (id === currentUser?.id || seenRecent.has(id)) continue;
      const u = users.find(user => user.id === id);
      if (u) {
        friends.push(u);
      }
    }

    return { orderedContacts: [...recents, ...friends], searchResults: [] };
  }, [searchTerm, users, chats, followedUserIds, followerUserIds, currentUser?.id]);

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-6 md:p-16 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#111] w-full max-w-md max-h-[90vh] rounded-[3rem] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-white dark:border-zinc-800 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-8 py-5 border-b border-slate-50 dark:border-zinc-900 flex justify-between items-center bg-white dark:bg-[#0a0a0a]">
          <div className="flex items-center space-x-4">
            <div className={`p-2 rounded-2xl ${sharedUser ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'}`}>
              {sharedUser ? <UserIcon size={18} /> : event ? <Calendar size={18} /> : <Send size={18} />}
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
              {sharedUser ? 'Compartir Perfil' : event ? 'Compartir Evento' : post?.type === 'news' ? 'Compartir Noticia' : 'Compartir Post'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-full text-slate-400 transition-all border border-transparent hover:border-slate-100 dark:hover:border-zinc-700"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5 flex flex-col min-h-0">

          {/* Copy Link Section */}
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Enlace directo</label>
            <div className="flex items-center space-x-2 bg-slate-50 dark:bg-zinc-900/50 p-2 rounded-2xl border border-slate-100 dark:border-zinc-800 group focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
              <div className="flex-1 px-3 py-1.5 text-xs text-slate-500 dark:text-slate-400 font-bold truncate">
                {shareUrl}
              </div>
              <button
                onClick={handleCopy}
                className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 shadow-sm ${copied ? 'bg-green-600 text-white scale-95' : 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 hover:bg-white dark:hover:bg-zinc-700 hover:shadow-md'
                  }`}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span className="text-[10px] font-black">{copied ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          {/* Contacts Section */}
          <div className="space-y-4 flex flex-col min-h-0">
            <div className="flex items-center justify-between px-1 gap-4">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Enviar por Chat</label>
              <div className="relative flex-1 max-w-[180px] group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={14} />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-[10px] font-bold outline-none focus:ring-4 focus:ring-blue-500/10 dark:text-white transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="space-y-6 overflow-y-auto scrollbar-hide py-1 pr-1 max-h-[320px]">
              {searchTerm.trim() ? (
                // Search Results
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-3 ml-1">Resultados de búsqueda</p>
                  {searchResults.length > 0 ? searchResults.map(contact => (
                    <ContactItem key={contact.id} contact={contact} onSend={handleSend} isSent={sentTo.includes(contact.id)} />
                  )) : (
                    <EmptySearch term={searchTerm} />
                  )}
                </div>
              ) : (
                <>
                  {orderedContacts.length > 0 ? (
                    orderedContacts.map(contact => (
                      <ContactItem key={contact.id} contact={contact} onSend={handleSend} isSent={sentTo.includes(contact.id)} />
                    ))
                  ) : (
                    <div className="text-center py-8 bg-slate-50/50 dark:bg-zinc-900/30 rounded-[1.5rem] border border-dashed border-slate-200 dark:border-zinc-800">
                      <div className="mx-auto w-10 h-10 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center mb-2 shadow-sm">
                        <Users className="text-slate-200" size={20} />
                      </div>
                      <p className="text-slate-400 font-bold italic text-[11px] px-8">
                        No hay contactos frecuentes disponibles. Usa el buscador para encontrar a alguien.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
