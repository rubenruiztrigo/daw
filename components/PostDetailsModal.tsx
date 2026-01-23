
import React, { useState } from 'react';
import { X, Send, MessageCircle, Heart, ChevronUp, ChevronDown, Download, FileText } from 'lucide-react';
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
  onNavigateToProfile?: (id: string) => void;
}

export const PostDetailsModal: React.FC<PostDetailsModalProps> = ({ 
  post, 
  onClose, 
  onAddComment, 
  onLike, 
  onVote,
  onSearchHashtag,
  onNavigateToProfile,
}) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAddComment(post.id, text);
    setText('');
  };

  const handleAuthorClick = () => {
    if (onNavigateToProfile) {
      onNavigateToProfile(post.authorId);
      onClose();
    }
  };

  const renderContentWithHashtags = (content: string) => {
    if (!content) return null;
    const parts = content.split(/(#[\wáéíóúÁÉÍÓÚñÑ]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('#')) {
        return (
          <button
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              onSearchHashtag?.(part.slice(1));
              onClose();
            }}
            className={`font-black hover:underline transition-all ${post.type === 'news' ? 'text-orange-600 dark:text-orange-400' : 'text-blue-600 dark:text-blue-400'}`}
          >
            {part}
          </button>
        );
      }
      return part;
    });
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
      <div className="bg-white dark:bg-[#0a0a0a] w-full max-w-3xl rounded-[2.5rem] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 border border-white dark:border-zinc-800" onClick={(e) => e.stopPropagation()}>
        <div className="px-8 py-4 border-b border-slate-50 dark:border-zinc-900 flex justify-between items-center bg-white dark:bg-[#0a0a0a] sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-xl ${post.type === 'news' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}><MessageCircle size={20} /></div>
            <div><h3 className="text-lg font-bold text-slate-900 dark:text-white">Detalle</h3></div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 dark:hover:bg-zinc-900 rounded-full text-slate-300 transition-all"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="p-8 pb-4">
            <div className="flex items-center space-x-4 mb-6">
              <img src={post.authorAvatar} className="w-14 h-14 rounded-2xl object-cover cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all" alt="" onClick={handleAuthorClick} />
              <div className="cursor-pointer group" onClick={handleAuthorClick}>
                <h4 className="font-black text-slate-900 dark:text-white leading-tight text-lg group-hover:text-blue-600 transition-colors">{post.authorName}</h4>
                <p className={`text-xs font-bold uppercase tracking-wider ${post.type === 'news' ? 'text-orange-500' : 'text-blue-500'}`}>{post.authorPosition}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Publicado {timeAgo(post.timestamp)}</p>
              </div>
            </div>

            <div className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap text-base font-medium mb-6">
              {renderContentWithHashtags(post.content)}
            </div>

            {post.imageUrl && (
              <div className="mb-6 rounded-3xl overflow-hidden border border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900"><img src={post.imageUrl} className="w-full h-auto object-cover max-h-[600px]" alt="" /></div>
            )}

            {post.docUrl && (
              <div className="mb-6 flex items-center justify-between p-5 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 rounded-3xl">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-indigo-600 text-white rounded-2xl"><FileText size={24} /></div>
                  <div><p className="text-sm font-bold text-indigo-900 dark:text-indigo-300">{post.docName || 'Documento adjunto'}</p><p className="text-[10px] text-indigo-400 font-black uppercase">Recurso institucional</p></div>
                </div>
                <a href={post.docUrl} download className="p-3 text-indigo-400 hover:text-indigo-600 transition-all"><Download size={20} /></a>
              </div>
            )}

            <div className="flex items-center justify-between py-4 border-y border-slate-50 dark:border-zinc-900">
              <div className="flex items-center space-x-6">
                {post.type === 'post' ? (
                  <button onClick={() => onLike && onLike(post.id)} className={`flex items-center space-x-2 transition-all ${post.userLiked ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`}>
                    <Heart size={24} fill={post.userLiked ? 'currentColor' : 'none'} /><span className="font-black dark:text-white">{post.likes}</span>
                  </button>
                ) : (
                  <div className="flex items-center bg-slate-50 dark:bg-zinc-900 p-1 rounded-2xl border border-slate-100 dark:border-zinc-800">
                    <button onClick={() => onVote && onVote(post.id, 'up')} className={`p-2 rounded-xl transition-all ${post.userLiked ? 'text-emerald-500' : 'text-slate-400 hover:text-emerald-500'}`}><ChevronUp size={24} strokeWidth={3} /></button>
                    <span className={`px-3 font-black text-lg min-w-[2.5rem] text-center ${post.likes > 0 ? 'text-emerald-600' : post.likes < 0 ? 'text-orange-600' : 'text-slate-900 dark:text-white'}`}>{post.likes}</span>
                    <button onClick={() => onVote && onVote(post.id, 'down')} className={`p-2 rounded-xl transition-all ${post.userDownvoted ? 'text-orange-500' : 'text-slate-400 hover:text-orange-500'}`}><ChevronDown size={24} strokeWidth={3} /></button>
                  </div>
                )}
                <div className="flex items-center space-x-2 text-slate-400"><MessageCircle size={24} /><span className="font-black dark:text-white">{post.comments}</span></div>
              </div>
            </div>
          </div>

          <div className="px-8 pb-20">
            <h5 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 px-1">Comentarios</h5>
            {post.commentsList.length === 0 ? <p className="text-slate-300 italic font-bold text-center py-10">No hay comentarios aún.</p> : (
              <div className="space-y-6">
                {post.commentsList.map((comment) => (
                  <div key={comment.id} className="flex space-x-4 animate-in fade-in slide-in-from-bottom-2">
                    <img src={comment.authorAvatar} className="w-10 h-10 rounded-xl object-cover cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all" alt="" onClick={() => { if (onNavigateToProfile && comment.authorId) { onNavigateToProfile(comment.authorId); onClose(); } }} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-slate-900 dark:text-white cursor-pointer hover:text-blue-600 transition-colors" onClick={() => { if (onNavigateToProfile && comment.authorId) { onNavigateToProfile(comment.authorId); onClose(); } }}>{comment.authorName}</span>
                        <span className="text-[10px] text-slate-400 font-bold">{timeAgo(comment.timestamp)}</span>
                      </div>
                      <div className="text-sm text-slate-600 dark:text-gray-400 font-medium bg-slate-50 dark:bg-zinc-900 p-4 rounded-2xl rounded-tl-none border border-slate-100 dark:border-zinc-800">{comment.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-[#0a0a0a] border-t border-slate-50 dark:border-zinc-900">
          <form onSubmit={handleSubmit} className="flex items-center space-x-3 bg-slate-50 dark:bg-zinc-900 rounded-2xl p-2 border border-slate-100 dark:border-zinc-800 focus-within:ring-4 focus-within:ring-blue-50 transition-all">
            <input type="text" autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="Escribe tu aportación técnica..." className="flex-1 bg-transparent border-none px-4 py-2 text-sm font-medium outline-none focus:ring-0 dark:text-white" />
            <button type="submit" disabled={!text.trim()} className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 disabled:opacity-30 transform active:scale-90"><Send size={18} /></button>
          </form>
        </div>
      </div>
    </div>
  );
};
