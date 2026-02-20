
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { useScrollLock } from '../hooks/useScrollLock';
import { X, Copy, Check, Send, Search, MessageSquare, Users, Link as LinkIcon, User as UserIcon, Calendar } from 'lucide-react';
import { Post, User } from '../types';

interface ShareModalProps {
  post?: Post;
  event?: any; // Start with any to avoid import loop if types not ready, or use CalendarEvent
  user?: User; // The user profile being shared (if applicable)
  onClose: () => void;
  onShare?: (recipientId: string, text: string, sharedPostId?: string, sharedProfileId?: string, sharedEventId?: string) => void;
  currentUser?: User; // Add currentUser to identify "me"
  users?: User[]; // All users to search/filter from
  followedUserIds?: Set<string>;
  followerUserIds?: Set<string>;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  post,
  event,
  user: sharedUser,
  onClose,
  onShare,
  currentUser,
  users = [],
  followedUserIds = new Set(),
  followerUserIds = new Set()
}) => {
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sentTo, setSentTo] = useState<string[]>([]);

  useScrollLock();

  const shareUrl = sharedUser
    ? `https://red.novagob.org/${sharedUser.username || sharedUser.id}`
    : event
      ? `https://red.novagob.org/u/${event.creator_id}/e/${event.id}`
      : `https://red.novagob.org/p/${post?.id}`;

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
      onShare(contact.id, message, post?.id, sharedUser?.id, event?.id);
    }
    setSentTo([...sentTo, contact.id]);
  };

  // Logic to filter and sort contacts
  const contacts = users
    .filter(u => u.id !== currentUser?.id) // Exclude self
    .map(u => {
      const isFollowing = followedUserIds.has(u.id);
      const isFollower = followerUserIds.has(u.id);
      const isFriend = isFollowing && isFollower; // Mutual follow = Friend

      return {
        ...u,
        isFriend,
        isFollowing
      };
    })
    .filter(u => u.isFollowing) // Only show people I follow (Friends included)
    .sort((a, b) => {
      // Prioritize Friends (Mutual) -> Then just Following
      if (a.isFriend && !b.isFriend) return -1;
      if (!a.isFriend && b.isFriend) return 1;
      return 0;
    });

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#111] w-full max-w-md rounded-[2.5rem] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-white dark:border-zinc-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-50 dark:border-zinc-900 flex justify-between items-center bg-white dark:bg-[#111]">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-xl ${sharedUser ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'}`}>
              {sharedUser ? <UserIcon size={20} /> : event ? <Calendar size={20} /> : <Send size={20} />}
            </div>
            <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white whitespace-nowrap">
              {sharedUser ? 'Compartir Perfil' : event ? 'Compartir Evento' : 'Compartir Publicación'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-full text-slate-400 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Visual Preview */}
          {sharedUser && (
            <div className="flex items-center space-x-4 p-4 bg-indigo-50/30 dark:bg-indigo-900/10 border border-indigo-50 dark:border-indigo-900/20 rounded-2xl">
              <img src={sharedUser.avatar} className="w-12 h-12 rounded-xl object-cover border-2 border-white dark:border-zinc-800" alt="" />
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{sharedUser.name} {sharedUser.lastName}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase">{sharedUser.position}</p>
              </div>
            </div>
          )}
          {event && (
            <div className="flex items-center space-x-4 p-4 bg-blue-50/30 dark:bg-blue-900/10 border border-blue-50 dark:border-blue-900/20 rounded-2xl">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl text-blue-600 dark:text-blue-400"><Calendar size={20} /></div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{event.title}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase">{event.location}</p>
              </div>
            </div>
          )}

          {/* Copy Link Section */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Enlace directo</label>
            <div className="flex items-center space-x-2 bg-slate-50 dark:bg-zinc-900 p-2 rounded-2xl border border-slate-100 dark:border-zinc-800">
              <div className="flex-1 px-3 py-2 text-sm text-slate-500 font-medium truncate">
                {shareUrl}
              </div>
              <button
                onClick={handleCopy}
                className={`p-3 rounded-xl transition-all flex items-center space-x-2 ${copied ? 'bg-green-500 text-white' : 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                  }`}
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                <span className="text-xs font-black">{copied ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          {/* Contacts Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Enviar por Chat</label>
              <div className="relative w-1/2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-zinc-900 border-none rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-1 max-h-48 overflow-y-auto pr-1 scrollbar-hide">
              {filteredContacts.length > 0 ? filteredContacts.map(contact => (
                <div key={contact.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all group">
                  <div className="flex items-center space-x-3">
                    <img src={contact.avatar} className="w-9 h-9 rounded-lg object-cover" alt="" />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{contact.name} {contact.lastName}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">{contact.isFriend ? 'Amigo' : 'Te sigue'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSend(contact)}
                    disabled={sentTo.includes(contact.id)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${sentTo.includes(contact.id)
                      ? 'bg-slate-100 dark:bg-zinc-800 text-slate-400'
                      : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
                      }`}
                  >
                    {sentTo.includes(contact.id) ? 'Enviado' : 'Enviar'}
                  </button>
                </div>
              )) : (
                <div className="text-center py-8 text-slate-400 text-xs italic">
                  No se encontraron usuarios a los que sigas.
                </div>
              )}
            </div>
          </div>
        </div>


      </div>
    </div>,
    document.body
  );
};
