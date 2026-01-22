
import React, { useState } from 'react';
import { X, Send, MessageCircle, Heart, ChevronUp, ChevronDown, Download, FileText, Share2 } from 'lucide-react';
import { Post, Comment } from '../types';
import { timeAgo } from '../utils/stringUtils';

interface PostDetailsModalProps {
  post: Post;
  onClose: () => void;
  onAddComment: (postId: string, text: string) => void;
  onLike?: (id: string) => void;
  onVote?: (id: string, dir: 'up' | 'down') => void;
  onSearchHashtag?: (tag: string) => void;
  onLikeComment?: (postId: string, commentId: string) => void;
}

export const PostDetailsModal: React.FC<PostDetailsModalProps> = ({ 
  post, 
  onClose, 
  onAddComment, 
  onLike, 
  onVote,
  onSearchHashtag,
  onLikeComment
}) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAddComment(post.id, text);
    setText('');
  };

  const handleHashtagClick = (tag: string) => {
    if (onSearchHashtag) {
      onSearchHashtag(tag);
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-[#0a0a0a] w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 border border-white dark:border-zinc-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-8 py-4 border-b border-slate-50 dark:border-zinc-900 flex justify-between items-center bg-white dark:bg-[#0a0a0a] sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-xl ${post.type === 'news' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
              <MessageCircle size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Detalle</h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-50 dark:hover:bg-zinc-900 rounded-full text-slate-300 hover:text-slate-600 transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {/* Main Post Content */}
          <div className="p-8 pb-4">
            <div className="flex items-center space-x-4 mb-6">
              <img src={post.authorAvatar} className="w-14 h-14 rounded-2xl object-cover shadow-sm" alt="" />
              <div>
                <h4 className="font-black text-slate-900 dark:text-white leading-tight text-lg">{post.authorName}</h4>
                <p className={`text-xs font-bold uppercase tracking-wider ${post.type === 'news' ? 'text-orange-500' : 'text-blue-600'}`}>
                  {post.authorPosition}
                </p>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">
                  Publicado {timeAgo(post.timestamp)}
                </p>
              </div>
            </div>

            <div className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap text-base font-medium mb-6">
              {post.content}
            </div>

            {post.imageUrl && (
              <div className="mb-6 rounded-3xl overflow-hidden border border-slate-100 dark:border-zinc-800 shadow-sm bg-slate-50 dark:bg-zinc-900">
                <img src={post.imageUrl} className="w-full h-auto object-cover max-h-[600px]" alt="Contenido" />
              </div>
            )}

            {post.docUrl && (
              <div className="mb-6 flex items-center justify-between p-5 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 rounded-3xl">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-indigo-600 text-white rounded-2xl"><FileText size={24} /></div>
                  <div>
                    <p className="text-sm font-bold text-indigo-900 dark:text-indigo-300">{post.docName || 'Documento adjunto'}</p>
                    <p className="text-[10px] text-indigo-400 font-black uppercase">Recurso institucional</p>
                  </div>
                </div>
                <a href={post.docUrl} download className="p-3 text-indigo-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-zinc-800 rounded-2xl transition-all"><Download size={20} /></a>
              </div>
            )}

            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {post.tags.map(tag => (
                  <button 
                    key={tag} 
                    onClick={() => handleHashtagClick(tag)}
                    className={`text-xs font-black px-3 py-1.5 rounded-xl border transition-all hover:scale-105 active:scale-95 ${
                      post.type === 'news' 
                        ? 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/20 dark:border-orange-800' 
                        : 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between py-4 border-y border-slate-50 dark:border-zinc-900">
              <div className="flex items-center space-x-6">
                {post.type === 'post' ? (
                  <button onClick={() => onLike && onLike(post.id)} className={`flex items-center space-x-2 transition-all ${post.userLiked ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`}>
                    <Heart size={24} fill={post.userLiked ? 'currentColor' : 'none'} />
                    <span className="font-black dark:text-white">{post.likes}</span>
                  </button>
                ) : (
                  <div className="flex items-center bg-slate-50 dark:bg-zinc-900 p-1 rounded-2xl border border-slate-100 dark:border-zinc-800">
                    <button 
                      onClick={() => onVote && onVote(post.id, 'up')} 
                      className={`p-2 rounded-xl transition-all flex items-center space-x-2 ${post.userLiked ? 'bg-emerald-100 text-emerald-600' : 'text-slate-400 hover:text-emerald-500'}`}
                    >
                      <ChevronUp size={24} strokeWidth={3} />
                      <span className="font-black">{post.upvotes || 0}</span>
                    </button>
                    <div className="w-px h-6 bg-slate-200 dark:bg-zinc-800 mx-2"></div>
                    <button 
                      onClick={() => onVote && onVote(post.id, 'down')} 
                      className={`p-2 rounded-xl transition-all ${post.userDownvoted ? 'bg-red-100 text-red-500' : 'text-slate-400 hover:text-red-500'}`}
                    >
                      <ChevronDown size={24} strokeWidth={3} />
                    </button>
                  </div>
                )}
                <div className="flex items-center space-x-2 text-slate-400">
                  <MessageCircle size={24} />
                  <span className="font-black dark:text-white">{post.comments}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="px-8 pb-20">
            <h5 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 px-1">Comentarios y Aportaciones</h5>
            {post.commentsList.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-slate-300 font-bold italic">No hay comentarios todavía. ¡Sé el primero en participar!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {post.commentsList.map((comment, idx) => (
                  <div key={comment.id} className="flex space-x-4 animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                    <img src={comment.authorAvatar} className="w-10 h-10 rounded-xl object-cover shadow-sm" alt="" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{comment.authorName}</span>
                        <div className="flex items-center space-x-3">
                           <button 
                            className={`flex items-center space-x-1 transition-all ${comment.userLiked ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`}
                           >
                            <Heart size={14} fill={comment.userLiked ? 'currentColor' : 'none'} />
                            <span className="text-[10px] font-black">{comment.likes || 0}</span>
                           </button>
                           <span className="text-[10px] text-slate-400 font-bold">
                            {timeAgo(comment.timestamp)}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-slate-600 dark:text-gray-400 font-medium bg-slate-50 dark:bg-zinc-900 p-4 rounded-2xl rounded-tl-none border border-slate-100 dark:border-zinc-800">
                        {comment.text}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Fixed Footer Input */}
        <div className="p-6 bg-white dark:bg-[#0a0a0a] border-t border-slate-50 dark:border-zinc-900">
          <form 
            onSubmit={handleSubmit} 
            className="flex items-center space-x-3 bg-slate-50 dark:bg-zinc-900 rounded-2xl p-2 border border-slate-100 dark:border-zinc-800 focus-within:ring-4 focus-within:ring-blue-50 dark:focus-within:ring-blue-900/20 transition-all"
          >
            <input 
              type="text" 
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escribe tu aportación técnica..." 
              className="flex-1 bg-transparent border-none px-4 py-2 text-sm font-medium outline-none focus:ring-0 placeholder-slate-400 dark:text-white"
            />
            <button 
              type="submit"
              disabled={!text.trim()}
              className="bg-blue-600 text-white p-3 rounded-xl shadow-lg hover:bg-blue-700 disabled:opacity-30 transition-all transform active:scale-90"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
