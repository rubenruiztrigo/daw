
import React, { useState, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useScrollLock } from '../hooks/useScrollLock';
import { X, Send, AtSign } from 'lucide-react';
import { Post, User } from '../types';
import { getMentionSuggestions } from '../utils/mentionUtils';

interface QuickCommentModalProps {
  post: Post;
  onClose: () => void;
  onAddComment: (postId: string, text: string) => void;
  users: User[];
}

export const QuickCommentModal: React.FC<QuickCommentModalProps> = ({ post, onClose, onAddComment, users }) => {
  useScrollLock();

  const [text, setText] = useState('');
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStartIndex, setMentionStartIndex] = useState<number>(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const mentionSuggestions = useMemo(() => {
    if (mentionQuery === null) return [];
    return getMentionSuggestions(mentionQuery, users);
  }, [mentionQuery, users]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const selectionStart = e.target.selectionStart;
    setText(value);

    const textBeforeCursor = value.slice(0, selectionStart);
    const match = textBeforeCursor.match(/(?:^|\s)@(\S*)$/);

    if (match && match[1].length >= 2) {
      const query = match[1];
      const atIndex = textBeforeCursor.lastIndexOf('@');
      setMentionQuery(query);
      setMentionStartIndex(atIndex);
    } else {
      setMentionQuery(null);
    }
  };

  const selectMention = (selectedUser: User) => {
    if (mentionStartIndex === -1) return;
    const before = text.slice(0, mentionStartIndex);
    const after = text.slice(textareaRef.current?.selectionStart || 0);
    const newText = `${before}@${selectedUser.username} ${after}`;
    setText(newText);
    setMentionQuery(null);
    textareaRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAddComment(post.id, text);
    setMentionQuery(null);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
      <div className="bg-white dark:bg-[#111] w-full max-w-lg rounded-[2rem] flex flex-col animate-in zoom-in-95 duration-200 border border-white dark:border-zinc-800" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 flex justify-between items-center">
          <span className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.2em]">Respuesta rápida</span>
          <button onClick={onClose} className="p-1 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-full text-slate-300 hover:text-slate-600 transition-all"><X size={20} /></button>
        </div>

        <div className="px-8 pb-8 space-y-4 relative">
          <div className="border-l-4 border-slate-100 dark:border-zinc-800 pl-4 py-1">
            <p className="text-slate-500 text-sm md:text-base leading-relaxed line-clamp-3">
              <span className="font-black text-slate-700 dark:text-slate-300">{post.authorName}:</span> {post.content}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <textarea
                ref={textareaRef}
                autoFocus
                value={text}
                onChange={handleTextChange}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setMentionQuery(null);
                  }
                }}
                placeholder="Escribe tu comentario aquí..."
                className="w-full p-0 bg-transparent border-none text-lg font-medium outline-none focus:ring-0 resize-none min-h-[120px] leading-relaxed text-slate-800 dark:text-white placeholder-slate-300"
              />

              {/* Sugerencias de mención */}
              {mentionQuery !== null && (
                <div className="absolute left-0 top-full mt-2 w-full bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-zinc-800 z-[170] overflow-hidden animate-in slide-in-from-top-2 duration-100 shadow-2xl">
                  {mentionSuggestions.length > 0 ? mentionSuggestions.map(u => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => selectMention(u)}
                      className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors text-left border-b border-gray-50 dark:border-zinc-800 last:border-0"
                    >
                      <img src={u.avatar} className="w-8 h-8 rounded-lg object-cover" alt="" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{u.name} {u.lastName}</p>
                        <p className="text-[10px] text-purple-600 dark:text-purple-400 font-bold truncate">@{u.username}</p>
                      </div>
                    </button>
                  )) : (
                    <div className="px-4 py-3 text-xs text-gray-400 italic font-bold">No hay resultados</div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4">
              <button type="button" onClick={onClose} className="px-5 py-2 text-slate-400 hover:text-slate-600 font-bold text-sm transition-all">Cancelar</button>
              <button type="submit" disabled={!text.trim()} className={`flex items-center space-x-2 px-8 py-3 rounded-full text-white font-black text-sm transition-all transform active:scale-95 ${post.type === 'news' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'} disabled:opacity-20`}><span>Enviar</span><Send size={16} /></button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
};
