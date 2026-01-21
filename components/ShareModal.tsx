
import React, { useState } from 'react';
import { X, Copy, Check, Send, Search, MessageSquare, Users, Link as LinkIcon, User as UserIcon } from 'lucide-react';
import { Post, User } from '../types';

interface ShareModalProps {
  post?: Post;
  user?: User;
  onClose: () => void;
  onShare?: (id: string, participant: any) => void;
}

const MOCK_CONTACTS = [
  { id: 'u2', name: 'Carlos Ruiz', avatar: 'https://i.pravatar.cc/150?u=carlos', position: 'Analista de Datos', department: 'Ayuntamiento Central', type: 'recent' },
  { id: 'u3', name: 'Elena Belmonte', avatar: 'https://i.pravatar.cc/150?u=elena', position: 'Gestora de Proyectos', department: 'Agencia Digital', type: 'recent' },
  { id: 'u4', name: 'Roberto Sánchez', avatar: 'https://i.pravatar.cc/150?u=roberto', position: 'Recursos Humanos', department: 'Ministerio de Trabajo', type: 'follower' },
];

export const ShareModal: React.FC<ShareModalProps> = ({ post, user, onClose, onShare }) => {
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sentTo, setSentTo] = useState<string[]>([]);

  const shareUrl = user 
    ? `https://novasocial.app/u/${user.username || user.id}`
    : `https://novasocial.app/p/${post?.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = (contact: any) => {
    if (onShare) {
      onShare(user ? user.id : post!.id, contact);
    }
    setSentTo([...sentTo, contact.id]);
  };

  const filteredContacts = MOCK_CONTACTS.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div 
      className="fixed inset-0 z-[170] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-white">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-xl ${user ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'}`}>
              {user ? <UserIcon size={20} /> : <Send size={20} />}
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              {user ? 'Compartir Perfil' : 'Compartir Publicación'}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Visual Preview */}
          {user && (
            <div className="flex items-center space-x-4 p-4 bg-indigo-50/30 border border-indigo-50 rounded-2xl">
              <img src={user.avatar} className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-sm" alt="" />
              <div>
                <p className="text-sm font-bold text-slate-900">{user.name}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase">{user.position}</p>
              </div>
            </div>
          )}

          {/* Copy Link Section */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Enlace directo</label>
            <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-2xl border border-slate-100">
              <div className="flex-1 px-3 py-2 text-sm text-slate-500 font-medium truncate">
                {shareUrl}
              </div>
              <button 
                onClick={handleCopy}
                className={`p-3 rounded-xl transition-all flex items-center space-x-2 ${
                  copied ? 'bg-green-500 text-white' : 'bg-white text-blue-600 hover:bg-blue-50 shadow-sm'
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
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="space-y-1 max-h-48 overflow-y-auto pr-1 scrollbar-hide">
              {filteredContacts.map(contact => (
                <div key={contact.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-all group">
                  <div className="flex items-center space-x-3">
                    <img src={contact.avatar} className="w-9 h-9 rounded-lg object-cover" alt="" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">{contact.name}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">{contact.type === 'recent' ? 'Reciente' : 'Seguidor'}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleSend(contact)}
                    disabled={sentTo.includes(contact.id)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${
                      sentTo.includes(contact.id) 
                      ? 'bg-slate-100 text-slate-400' 
                      : 'bg-blue-600 text-white shadow-md hover:bg-blue-700 active:scale-95'
                    }`}
                  >
                    {sentTo.includes(contact.id) ? 'Enviado' : 'Enviar'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50/50 border-t border-slate-50 flex items-center justify-center space-x-2">
          <LinkIcon size={12} className="text-slate-300" />
          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">NovaSocial Secure Link</span>
        </div>
      </div>
    </div>
  );
};
