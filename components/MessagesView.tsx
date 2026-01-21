
import React, { useState, useEffect, useMemo } from 'react';
import { Search, Send, Info, MessageSquare, Check, X, Users } from 'lucide-react';
import { User, Chat, Message, Post } from '../types';
import { PostDetailsModal } from './PostDetailsModal';
import { normalizeString } from '../utils/stringUtils';

interface MessagesViewProps {
  user: User;
  chats: Chat[];
  posts: Post[];
  onSendMessage: (chatId: string, text: string) => void;
  onViewPost?: (postId: string) => void;
  onLike?: (id: string) => void;
  onVote?: (id: string, dir: 'up' | 'down') => void;
  onAddComment?: (postId: string, text: string) => void;
}

export const MessagesView: React.FC<MessagesViewProps> = ({ 
  user, 
  chats, 
  posts, 
  onSendMessage, 
  onViewPost,
  onLike,
  onVote,
  onAddComment
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(chats[0]?.id || null);
  const [msg, setMsg] = useState('');
  const [chatSearchTerm, setChatSearchTerm] = useState('');
  const [viewingPost, setViewingPost] = useState<Post | null>(null);

  // Filtrar chats por nombre de participante o contenido de mensajes
  const filteredChats = useMemo(() => {
    const query = normalizeString(chatSearchTerm);
    if (!query) return chats;

    return chats.filter(chat => {
      const nameMatch = normalizeString(chat.participant.name || '').includes(query);
      const messageMatch = chat.messages.some(m => normalizeString(m.text).includes(query));
      return nameMatch || messageMatch;
    });
  }, [chats, chatSearchTerm]);

  const selectedChat = useMemo(() => {
    return chats.find(c => c.id === selectedId) || filteredChats[0] || chats[0];
  }, [chats, selectedId, filteredChats]);

  useEffect(() => {
    if (!selectedId && filteredChats.length > 0) {
      setSelectedId(filteredChats[0].id);
    }
  }, [filteredChats, selectedId]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msg.trim() || !selectedChat) return;
    onSendMessage(selectedChat.id, msg);
    setMsg('');
  };

  const handleOpenPost = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (post) {
      setViewingPost(post);
    }
  };

  if (chats.length === 0) {
    return (
      <div className="h-[calc(100vh-180px)] bg-white rounded-3xl shadow-sm border border-gray-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="p-6 bg-slate-50 rounded-full inline-block text-slate-300">
            <MessageSquare size={48} />
          </div>
          <p className="text-slate-400 font-bold">No tienes conversaciones activas todavía.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-180px)] bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex">
      {/* Sidebar Chats */}
      <div className="w-80 border-r border-gray-100 flex flex-col hidden lg:flex">
        <div className="p-6 border-b border-gray-50">
          <h2 className="text-xl font-black text-gray-900 mb-4">Mensajes</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input 
              type="text" 
              placeholder="Buscar mensajes o contactos..." 
              value={chatSearchTerm}
              onChange={(e) => setChatSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm outline-none font-medium focus:ring-2 focus:ring-blue-500/10"
            />
            {chatSearchTerm && (
              <button 
                onClick={() => setChatSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredChats.length > 0 ? (
            filteredChats.map(chat => (
              <button
                key={chat.id}
                onClick={() => setSelectedId(chat.id)}
                className={`w-full p-4 flex items-center space-x-3 hover:bg-gray-50 transition-all ${selectedChat?.id === chat.id ? 'bg-blue-50/50 border-r-4 border-blue-600' : ''}`}
              >
                <img src={chat.participant.avatar} className="w-12 h-12 rounded-2xl object-cover shadow-sm" alt="" />
                <div className="flex-1 text-left min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="font-bold text-gray-900 text-sm truncate">{chat.participant.name}</span>
                    <span className="text-[9px] text-gray-400 font-black uppercase ml-2 whitespace-nowrap">
                      {new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate font-medium">{chat.lastMessage}</p>
                </div>
              </button>
            ))
          ) : (
            <div className="p-8 text-center">
              <p className="text-xs text-slate-400 font-bold italic">No se han encontrado resultados para "{chatSearchTerm}"</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50/30">
        {selectedChat && (filteredChats.includes(selectedChat) || !chatSearchTerm) ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-100 bg-white flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <img src={selectedChat.participant.avatar} className="w-10 h-10 rounded-xl object-cover" alt="" />
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">{selectedChat.participant.name}</h4>
                  <p className="text-[10px] text-gray-400 font-bold truncate">{selectedChat.participant.position}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-gray-400">
                <button className="p-2 hover:bg-gray-50 rounded-lg transition-all" title="Información del contacto">
                  <Info size={20}/>
                </button>
              </div>
            </div>

            {/* Messages Content */}
            <div className="flex-1 p-6 space-y-4 overflow-y-auto flex flex-col scrollbar-hide">
              <div className="flex-1" />
              {selectedChat.messages.map((m) => (
                <div key={m.id} className={`flex ${m.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`relative group/msg max-w-md p-4 rounded-2xl shadow-sm border ${
                    m.senderId === user.id 
                      ? 'bg-blue-600 text-white rounded-tr-none border-blue-500' 
                      : 'bg-white text-gray-800 rounded-tl-none border-gray-100'
                  }`}>
                    {m.isPostShare && m.postId ? (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 opacity-80 mb-1">
                          <MessageSquare size={12} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Publicación compartida</span>
                        </div>
                        
                        {(() => {
                          const sharedPost = posts.find(p => p.id === m.postId);
                          if (!sharedPost) return <p className="text-sm font-medium">{m.text}</p>;
                          
                          return (
                            <div className={`rounded-xl border overflow-hidden transition-all ${
                              m.senderId === user.id ? 'bg-white/10 border-white/20' : 'bg-gray-50 border-gray-100'
                            }`}>
                              <div className="p-3">
                                <div className="flex items-center space-x-2 mb-2">
                                  <img src={sharedPost.authorAvatar} className="w-6 h-6 rounded-lg object-cover" alt="" />
                                  <span className="text-[11px] font-black">{sharedPost.authorName}</span>
                                </div>
                                <p className="text-xs line-clamp-2 font-medium opacity-90 leading-relaxed mb-2">
                                  {sharedPost.content}
                                </p>
                                {sharedPost.imageUrl && (
                                  <div className="rounded-lg overflow-hidden border border-black/5 mb-1 h-24">
                                    <img src={sharedPost.imageUrl} className="w-full h-full object-cover" alt="" />
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()}

                        <button 
                          onClick={() => handleOpenPost(m.postId!)}
                          className={`w-full py-2 px-3 rounded-lg text-[10px] font-black uppercase transition-all shadow-sm ${
                            m.senderId === user.id ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                          }`}
                        >
                          Ver publicación completa
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm font-medium leading-relaxed">{m.text}</p>
                    )}
                    <span className={`text-[9px] mt-1.5 block font-bold ${m.senderId === user.id ? 'text-blue-200' : 'text-gray-400'}`}>
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <div className="p-4 bg-white border-t border-gray-100">
              <form onSubmit={handleSend} className="flex items-center space-x-3 bg-gray-50 p-2 rounded-2xl focus-within:ring-2 ring-blue-500/10 transition-all">
                <input 
                  type="text" 
                  value={msg}
                  onChange={(e) => setMsg(e.target.value)}
                  placeholder="Escribe un mensaje colaborativo..." 
                  className="flex-1 bg-transparent border-none px-4 text-sm font-medium focus:ring-0 outline-none placeholder-slate-400"
                />
                <button 
                  type="submit"
                  disabled={!msg.trim()}
                  className="bg-blue-600 text-white p-3 rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 disabled:opacity-30 transition-all transform active:scale-95"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-4">
            <div className="p-6 bg-white rounded-full shadow-sm border border-slate-100">
              <MessageSquare size={48} className="text-slate-100" />
            </div>
            <p className="font-bold italic">
              {chatSearchTerm 
                ? "Selecciona una conversación que coincida con tu búsqueda" 
                : "Selecciona una conversación para empezar"}
            </p>
          </div>
        )}
      </div>

      {/* Modal de Detalle de Publicación */}
      {viewingPost && onAddComment && (
        <PostDetailsModal 
          post={viewingPost} 
          onClose={() => setViewingPost(null)} 
          onAddComment={onAddComment}
          onLike={onLike}
          onVote={onVote}
        />
      )}
    </div>
  );
};
