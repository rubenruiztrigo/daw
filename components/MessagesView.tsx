
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Send, Info, MessageSquare, Check, Sparkles } from 'lucide-react';
import { User, Chat, Message, Post } from '../types';
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
  externalActiveId?: string | null;
}

export const MessagesView: React.FC<MessagesViewProps> = ({ 
  user, chats, posts, onSendMessage, onLike, onVote, onAddComment, onNavigateToProfile, externalActiveId
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(externalActiveId || chats[0]?.id || null);
  const [msg, setMsg] = useState('');
  const [chatSearchTerm, setChatSearchTerm] = useState('');
  const [temporaryParticipant, setTemporaryParticipant] = useState<User | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedId, chats]);

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
    onSendMessage(selectedId, msg);
    setMsg('');
  };

  const participant = selectedChat?.participant || temporaryParticipant;

  return (
    <div className="h-[calc(100vh-180px)] bg-white dark:bg-[#111] rounded-3xl shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden flex">
      <div className="w-80 border-r border-gray-100 dark:border-zinc-900 flex flex-col hidden lg:flex">
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
              <img src={temporaryParticipant.avatar} className="w-12 h-12 rounded-2xl object-cover shadow-sm" alt="" />
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
              <img src={chat.participant.avatar} className="w-12 h-12 rounded-2xl object-cover shadow-sm" alt="" />
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

      <div className="flex-1 flex flex-col bg-slate-50/30 dark:bg-black/20">
        {participant ? (
          <>
            <div className="p-4 bg-white dark:bg-[#111] border-b border-gray-50 dark:border-zinc-900 flex items-center justify-between shadow-sm">
              <div className="flex items-center space-x-3">
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
              <button className="p-2 text-slate-300 hover:text-slate-500"><Info size={20}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {selectedChat ? selectedChat.messages.map((m, idx) => (
                <div key={m.id || idx} className={`flex ${m.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] space-y-1 ${m.senderId === user.id ? 'items-end' : 'items-start'}`}>
                    <div className={`p-4 rounded-2xl text-sm font-medium shadow-sm ${m.senderId === user.id ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white dark:bg-zinc-900 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-zinc-800'}`}>
                      {m.text}
                    </div>
                    <div className="flex items-center space-x-2 px-1">
                      <span className="text-[9px] text-slate-400 font-black uppercase">
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {m.senderId === user.id && <Check size={12} className="text-blue-500" />}
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
                <input 
                  type="text" 
                  value={msg} 
                  onChange={(e) => setMsg(e.target.value)} 
                  placeholder="Escribe un mensaje privado..." 
                  className="flex-1 bg-transparent border-none px-4 py-2 text-sm font-medium outline-none focus:ring-0 dark:text-white" 
                />
                <button 
                  type="submit" 
                  disabled={!msg.trim()} 
                  className="bg-blue-600 text-white p-3 rounded-xl shadow-lg hover:bg-blue-700 disabled:opacity-50 transform active:scale-90 transition-all"
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
    </div>
  );
};
