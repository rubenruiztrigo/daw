
import React, { useState } from 'react';
import { ArrowLeft, Send, MessageCircle, Heart, ChevronUp, ChevronDown, Download, FileText, Share2, Repeat } from 'lucide-react';
import { Post, Comment } from '../types';
import { timeAgo } from '../utils/stringUtils';

interface FullPostViewProps {
  post: Post;
  onAddComment: (postId: string, text: string) => void;
  onLike?: (id: string) => void;
  onVote?: (id: string, dir: 'up' | 'down') => void;
  onRepost: (id: string) => void;
  onSearchHashtag?: (tag: string) => void;
  onNavigateToProfile?: (id: string) => void;
  onBack: () => void;
}

export const FullPostView: React.FC<FullPostViewProps> = ({ 
  post, onAddComment, onLike, onVote, onRepost, onSearchHashtag, onNavigateToProfile, onBack 
}) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAddComment(post.id, text);
    setText('');
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
    <div className="max-w-3xl mx-auto bg-white dark:bg-[#111] rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden animate-in fade-in duration-500">
      <div className="px-8 py-6 border-b border-gray-50 dark:border-zinc-900 flex items-center space-x-4 bg-white dark:bg-[#111] sticky top-0 z-10">
        <button onClick={onBack} className="p-3 bg-gray-50 dark:bg-zinc-800 rounded-2xl text-slate-400 hover:text-blue-600 transition-all">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white">
            {post.type === 'news' ? 'Noticia' : 'Post'}
          </h3>
        </div>
      </div>

      <div className="p-8">
        <div className="flex items-center space-x-4 mb-8">
          <img src={post.authorAvatar} className="w-14 h-14 rounded-2xl object-cover cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all" alt="" onClick={() => onNavigateToProfile?.(post.authorId)} />
          <div className="cursor-pointer group" onClick={() => onNavigateToProfile?.(post.authorId)}>
            <h4 className="font-black text-slate-900 dark:text-white leading-tight text-lg group-hover:text-blue-600 transition-colors">{post.authorName}</h4>
            <p className={`text-xs font-bold uppercase tracking-wider ${post.type === 'news' ? 'text-orange-500' : 'text-blue-500'}`}>{post.authorPosition}</p>
            <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Publicado {timeAgo(post.timestamp)}</p>
          </div>
        </div>

        <div className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap text-lg font-medium mb-8">
          {renderContentWithHashtags(post.content)}
        </div>

        {post.imageUrl && (
          <div className="mb-8 rounded-3xl overflow-hidden border border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900">
            <img src={post.imageUrl} className="w-full h-auto object-cover max-h-[700px]" alt="" />
          </div>
        )}

        {post.docUrl && (
          <div className="mb-8 flex items-center justify-between p-6 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 rounded-3xl">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-indigo-600 text-white rounded-2xl"><FileText size={24} /></div>
              <div><p className="text-sm font-bold text-indigo-900 dark:text-indigo-300">{post.docName || 'Documento adjunto'}</p><p className="text-[10px] text-indigo-400 font-black uppercase">Recurso institucional</p></div>
            </div>
            <a href={post.docUrl} download className="p-3 text-indigo-400 hover:text-indigo-600 transition-all"><Download size={20} /></a>
          </div>
        )}

        <div className="flex items-center justify-between py-6 border-y border-slate-50 dark:border-zinc-900 mb-8">
          <div className="flex items-center space-x-8">
            {post.type === 'post' ? (
              <>
                <button onClick={() => onLike && onLike(post.id)} className={`flex items-center space-x-2 transition-all ${post.userLiked ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`}>
                  <Heart size={24} fill={post.userLiked ? "currentColor" : "none"} /><span className="font-black dark:text-white text-lg">{post.likes}</span>
                </button>
                <div className="flex items-center space-x-2 text-slate-400"><MessageCircle size={24} /><span className="font-black dark:text-white text-lg">{post.comments}</span></div>
                <button onClick={() => onRepost(post.id)} className={`flex items-center space-x-2 transition-all ${post.userReposted ? 'text-emerald-500' : 'text-slate-400 hover:text-emerald-500'}`}>
                  <Repeat size={24} /><span className="font-black dark:text-white text-lg">{post.reposts}</span>
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center bg-slate-50 dark:bg-zinc-900 p-1.5 rounded-2xl border border-slate-100 dark:border-zinc-800">
                  <button onClick={() => onVote && onVote(post.id, 'up')} className={`p-2 rounded-xl transition-all ${post.userLiked ? 'text-emerald-500' : 'text-slate-400 hover:text-emerald-500'}`}><ChevronUp size={24} strokeWidth={3} /></button>
                  <span className={`px-4 font-black text-xl min-w-[3rem] text-center ${post.likes > 0 ? 'text-emerald-600' : post.likes < 0 ? 'text-orange-600' : 'text-slate-900 dark:text-white'}`}>{post.likes}</span>
                  <button onClick={() => onVote && onVote(post.id, 'down')} className={`p-2 rounded-xl transition-all ${post.userDownvoted ? 'text-orange-500' : 'text-slate-400 hover:text-orange-500'}`}><ChevronDown size={24} strokeWidth={3} /></button>
                </div>
                <div className="flex items-center space-x-2 text-slate-400"><MessageCircle size={24} /><span className="font-black dark:text-white text-lg">{post.comments}</span></div>
              </>
            )}
          </div>
          <button className="p-3 text-slate-300 hover:text-blue-600 transition-all"><Share2 size={24}/></button>
        </div>

        <div className="space-y-8">
          <h5 className="text-sm font-black text-slate-400 uppercase tracking-widest px-1">Aportaciones técnicas ({post.commentsList.length})</h5>
          <form onSubmit={handleSubmit} className="mb-10 flex items-center space-x-3 bg-slate-50 dark:bg-zinc-900 rounded-[1.5rem] p-3 border border-slate-100 dark:border-zinc-800 focus-within:ring-4 focus-within:ring-blue-50 transition-all">
            <input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Escribe un comentario o propuesta..." className="flex-1 bg-transparent border-none px-4 py-2 text-sm font-medium outline-none focus:ring-0 dark:text-white" />
            <button type="submit" disabled={!text.trim()} className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 disabled:opacity-30 transform active:scale-90 shadow-md"><Send size={20} /></button>
          </form>

          {post.commentsList.length === 0 ? (
            <p className="text-slate-300 italic font-bold text-center py-12">No hay comentarios aún. ¡Sé el primero en participar!</p>
          ) : (
            <div className="space-y-8 pb-10">
              {post.commentsList.map((comment) => (
                <div key={comment.id} className="flex space-x-4 animate-in fade-in slide-in-from-bottom-2">
                  <img src={comment.authorAvatar} className="w-11 h-11 rounded-xl object-cover cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all" alt="" onClick={() => onNavigateToProfile?.(comment.authorId || '')} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-black text-slate-900 dark:text-white cursor-pointer hover:text-blue-600 transition-colors" onClick={() => onNavigateToProfile?.(comment.authorId || '')}>{comment.authorName}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{timeAgo(comment.timestamp)}</span>
                    </div>
                    <div className="text-sm text-slate-700 dark:text-gray-300 font-medium bg-slate-50 dark:bg-zinc-900 p-5 rounded-[1.5rem] rounded-tl-none border border-slate-100 dark:border-zinc-800 shadow-sm leading-relaxed">{comment.text}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
