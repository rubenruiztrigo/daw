
import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import { Post } from '../types';

interface QuickCommentModalProps {
  post: Post;
  onClose: () => void;
  onAddComment: (postId: string, text: string) => void;
}

export const QuickCommentModal: React.FC<QuickCommentModalProps> = ({ post, onClose, onAddComment }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAddComment(post.id, text);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Minimal */}
        <div className="px-6 py-4 flex justify-between items-center">
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Respuesta rápida</span>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-slate-50 rounded-full text-slate-300 hover:text-slate-600 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-8 pb-8 space-y-4">
          {/* Post Context Sutil - Ahora con texto más grande */}
          <div className="border-l-4 border-slate-100 pl-4 py-1">
            <p className="text-slate-500 text-sm md:text-base leading-relaxed line-clamp-3">
              <span className="font-black text-slate-700">{post.authorName}:</span> {post.content}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <textarea 
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escribe tu comentario aquí..."
              className="w-full p-0 bg-transparent border-none text-lg font-medium outline-none focus:ring-0 resize-none min-h-[120px] leading-relaxed text-slate-800 placeholder-slate-300"
            />

            <div className="flex items-center justify-end space-x-3 pt-4">
              <button 
                type="button"
                onClick={onClose}
                className="px-5 py-2 text-slate-400 hover:text-slate-600 font-bold text-sm transition-all"
              >
                Cerrar
              </button>
              <button 
                type="submit"
                disabled={!text.trim()}
                className={`flex items-center space-x-2 px-8 py-3 rounded-full text-white font-black text-sm transition-all transform active:scale-95 ${
                  post.type === 'news' 
                    ? 'bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-100' 
                    : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100'
                } disabled:opacity-20 disabled:shadow-none`}
              >
                <span>Enviar</span>
                <Send size={16} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
