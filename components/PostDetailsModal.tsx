
import React, { useState, useMemo, useRef } from 'react';
import { X, Send, MessageCircle, Heart, ChevronUp, ChevronDown, Download, FileText, Reply } from 'lucide-react';
import { Post, Comment, User } from '../types';
import { timeAgo } from '../utils/stringUtils';

interface PostDetailsModalProps {
  post: Post;
  onClose: () => void;
  onAddComment: (postId: string, text: string) => void;
  onAddReply?: (commentId: string, text: string) => void;
  onLike?: (id: string) => void;
  onVote?: (id: string, dir: 'up' | 'down') => void;
  onSearchHashtag?: (tag: string) => void;
  onLikeComment?: (postId: string, commentId: string) => void;
  onNavigateToProfile?: (id: string) => void;
  users?: User[];
}

export const PostDetailsModal: React.FC<PostDetailsModalProps> = ({
  post, onClose, onAddComment, onAddReply, onLike, onVote, onSearchHashtag, onNavigateToProfile, users = []
}) => {
  const [text, setText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionTarget, setMentionTarget] = useState<'main' | 'reply' | null>(null);
  const mainInputRef = useRef<HTMLInputElement>(null);
  const replyInputRef = useRef<HTMLInputElement>(null);

  const mentionSuggestions = useMemo(() => {
    if (mentionQuery === null) return [];
    const query = mentionQuery.toLowerCase();
    return users.filter(u =>
      u.name.toLowerCase().includes(query) ||
      u.username?.toLowerCase().includes(query)
    ).slice(0, 5);
  }, [mentionQuery, users]);

  const handleInputChange = (val: string, target: 'main' | 'reply') => {
    if (target === 'main') setText(val); else setReplyText(val);

    const lastAt = val.lastIndexOf('@');
    if (lastAt !== -1 && (lastAt === 0 || /\s/.test(val[lastAt - 1]))) {
      const query = val.slice(lastAt + 1);
      if (!/\s/.test(query)) {
        setMentionQuery(query);
        setMentionTarget(target);
        return;
      }
    }
    setMentionQuery(null);
  };

  const selectMention = (selectedUser: User) => {
    const isMain = mentionTarget === 'main';
    const currentVal = isMain ? text : replyText;
    const lastAt = currentVal.lastIndexOf('@');
    const before = currentVal.slice(0, lastAt);
    const newVal = `${before}@${selectedUser.username} `;

    if (isMain) setText(newVal); else setReplyText(newVal);
    setMentionQuery(null);
    setMentionTarget(null);
    (isMain ? mainInputRef : replyInputRef).current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAddComment(post.id, text);
    setText('');
  };

  const handleReplySubmit = (e: React.FormEvent, commentId: string) => {
    e.preventDefault();
    if (!replyText.trim() || !onAddReply) return;
    onAddReply(commentId, replyText);
    setReplyText('');
    setReplyingTo(null);
  };

  const renderContentWithHashtags = (content: string) => {
    if (!content) return null;
    const parts = content.split(/(#[\wáéíóúÁÉÍÓÚñÑ]+|@[\w.]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('#')) {
        return (
          <button key={i} onClick={(e) => { e.stopPropagation(); onSearchHashtag?.(part.slice(1)); onClose(); }} className="font-black text-blue-600 dark:text-blue-400 hover:underline">
            {part}
          </button>
        );
      } else if (part.startsWith('@')) {
        const username = part.slice(1).toLowerCase();
        const mentionedUser = users.find(u => u.username?.toLowerCase() === username);
        return (
          <button key={i} onClick={(e) => { e.stopPropagation(); if (mentionedUser) { onNavigateToProfile?.(mentionedUser.id); onClose(); } }} className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
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
              <img src={post.authorAvatar} className="w-14 h-14 rounded-2xl object-cover cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all" alt="" onClick={() => { onNavigateToProfile?.(post.authorId); onClose(); }} />
              <div className="cursor-pointer group" onClick={() => { onNavigateToProfile?.(post.authorId); onClose(); }}>
                <h4 className="font-black text-slate-900 dark:text-white text-lg group-hover:text-blue-600 transition-colors">{post.authorName}</h4>
                <p className={`text-xs font-bold uppercase tracking-wider ${post.type === 'news' ? 'text-orange-500' : 'text-blue-500'}`}>{post.authorPosition}</p>
                <p className="text-[10px] text-gray-400 font-bold mt-1">Publicado {timeAgo(post.timestamp)}</p>
              </div>
            </div>
            <div className="text-gray-800 dark:text-gray-200 leading-relaxed text-base font-medium mb-6">
              {renderContentWithHashtags(post.content)}
            </div>

            {post.imageUrl && <div className="mb-6 rounded-3xl overflow-hidden border border-slate-100 dark:border-zinc-800"><img src={post.imageUrl} className="w-full h-auto object-cover max-h-[600px]" alt="" /></div>}

            <div className="flex items-center justify-between py-4 border-y border-slate-50 dark:border-zinc-900">
              <div className="flex items-center space-x-6">
                {post.type === 'post' ? (
                  <button onClick={() => onLike?.(post.id)} className={`flex items-center space-x-2 ${post.userLiked ? 'text-red-500' : 'text-slate-400'}`}>
                    <Heart size={24} fill={post.userLiked ? "currentColor" : "none"} /><span className="font-black dark:text-white">{post.likes}</span>
                  </button>
                ) : (
                  <div className="flex items-center bg-slate-50 dark:bg-zinc-900 p-1 rounded-2xl border border-slate-100 dark:border-zinc-800">
                    <button onClick={() => onVote?.(post.id, 'up')} className={post.userLiked ? 'text-emerald-500' : 'text-slate-400'}><ChevronUp size={24} /></button>
                    <span className="px-3 font-black text-lg min-w-[2.5rem] text-center dark:text-white">{post.likes}</span>
                    <button onClick={() => onVote?.(post.id, 'down')} className={post.userDownvoted ? 'text-orange-500' : 'text-slate-400'}><ChevronDown size={24} /></button>
                  </div>
                )}
                <div className="flex items-center space-x-2 text-slate-400"><MessageCircle size={24} /><span className="font-black dark:text-white">{post.comments}</span></div>
              </div>
            </div>
          </div>

          <div className="px-8 pb-20">
            <h5 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 px-1">Comentarios ({post.commentsList.length})</h5>
            <div className="space-y-6">
              {post.commentsList.map((comment) => (
                <div key={comment.id} className="animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex space-x-4">
                    <img src={comment.authorAvatar} className="w-10 h-10 rounded-xl object-cover cursor-pointer hover:ring-2 hover:ring-blue-500" alt="" onClick={() => { if (comment.authorId) { onNavigateToProfile?.(comment.authorId); onClose(); } }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-slate-900 dark:text-white cursor-pointer hover:text-blue-600" onClick={() => { if (comment.authorId) { onNavigateToProfile?.(comment.authorId); onClose(); } }}>{comment.authorName}</span>
                        <span className="text-[10px] text-slate-400 font-bold">{timeAgo(comment.timestamp)}</span>
                      </div>
                      <div className="text-sm text-slate-600 dark:text-gray-400 font-medium bg-slate-50 dark:bg-zinc-900 p-4 rounded-2xl rounded-tl-none border border-slate-100 dark:border-zinc-800 mb-2">
                        {renderContentWithHashtags(comment.text)}
                      </div>
                      <button onClick={() => { setReplyingTo(comment.id); setReplyText(`@${comment.authorUsername} `); setTimeout(() => replyInputRef.current?.focus(), 100); }} className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1">
                        <Reply size={12} /><span>Responder</span>
                      </button>

                      {replyingTo === comment.id && (
                        <div className="relative mt-2">
                          <form onSubmit={(e) => handleReplySubmit(e, comment.id)} className="flex items-center space-x-2 animate-in slide-in-from-top-1">
                            <input ref={replyInputRef} type="text" value={replyText} onChange={(e) => handleInputChange(e.target.value, 'reply')} placeholder="Responder..." className="flex-1 px-3 py-1.5 bg-slate-100 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none dark:text-white" />
                            <button type="submit" disabled={!replyText.trim()} className="p-1.5 bg-blue-600 text-white rounded-lg"><Send size={14} /></button>
                          </form>
                          {mentionTarget === 'reply' && mentionSuggestions.length > 0 && (
                            <div className="absolute left-0 bottom-full mb-2 w-56 bg-white dark:bg-[#1a1a1a] rounded-xl shadow-2xl border border-gray-100 dark:border-zinc-800 z-[170] overflow-hidden">
                              {mentionSuggestions.map(u => (
                                <button key={u.id} type="button" onClick={() => selectMention(u)} className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/10 text-left border-b border-gray-50 dark:border-zinc-800 last:border-0">
                                  <img src={u.avatar} className="w-6 h-6 rounded-md object-cover" alt="" />
                                  <div className="min-w-0"><p className="text-xs font-bold text-gray-900 dark:text-white truncate">{u.name}</p><p className="text-[9px] text-blue-600">@{u.username}</p></div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-3 space-y-3">
                          {comment.replies.map(reply => (
                            <div key={reply.id} className="flex space-x-3 group/reply animate-in fade-in slide-in-from-left-1 duration-300">
                              <img src={reply.authorAvatar} className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-100 dark:ring-zinc-800" alt="" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                  <span className="text-[11px] font-bold text-slate-900 dark:text-white">{reply.authorName}</span>
                                  <span className="text-[8px] text-slate-400 font-bold">{timeAgo(reply.timestamp)}</span>
                                </div>
                                <div className="text-[12px] text-slate-600 dark:text-gray-400 font-medium bg-slate-50 dark:bg-zinc-900/50 p-3 rounded-xl rounded-tl-none border border-slate-50 dark:border-zinc-800">{renderContentWithHashtags(reply.text)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-[#0a0a0a] border-t border-slate-50 dark:border-zinc-900 relative">
          <form onSubmit={handleSubmit} className="flex items-center space-x-3 bg-slate-50 dark:bg-zinc-900 rounded-2xl p-2 border border-slate-100 dark:border-zinc-800">
            <input ref={mainInputRef} type="text" value={text} onChange={(e) => handleInputChange(e.target.value, 'main')} placeholder="Escribe tu aportación..." className="flex-1 bg-transparent border-none px-4 py-2 text-sm font-medium outline-none focus:ring-0 dark:text-white" />
            <button type="submit" disabled={!text.trim()} className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700"><Send size={18} /></button>
          </form>
          {mentionTarget === 'main' && mentionSuggestions.length > 0 && (
            <div className="absolute left-6 bottom-full mb-4 w-72 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-zinc-800 z-[60] overflow-hidden animate-in slide-in-from-bottom-2">
              {mentionSuggestions.map(u => (
                <button key={u.id} type="button" onClick={() => selectMention(u)} className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/10 text-left border-b border-gray-50 dark:border-zinc-800 last:border-0">
                  <img src={u.avatar} className="w-8 h-8 rounded-lg object-cover" alt="" />
                  <div className="min-w-0"><p className="text-sm font-bold text-gray-900 dark:text-white truncate">{u.name} {u.lastName}</p><p className="text-[10px] text-blue-600 font-bold">@{u.username}</p></div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
