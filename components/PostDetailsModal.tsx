import React, { useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useScrollLock } from '../hooks/useScrollLock';
import { X, Send, MessageCircle, Heart, ChevronUp, ChevronDown, Reply } from 'lucide-react';
import { Post, Comment, User, CommentReply } from '../types';
import { timeAgo } from '../utils/stringUtils';
import { RENDER_REGEX, getMentionSuggestions, getUserByMention } from '../utils/mentionUtils';
import { ImageLightbox } from './ImageLightbox';
import { useTranslation } from '../utils/translations';
import { Language } from '../utils/translations';

interface PostDetailsModalProps {
  post: Post;
  onClose: () => void;
  onAddComment: (postId: string, text: string) => void;
  onAddReply: (commentId: string, text: string, parentReplyId?: string) => void;
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
  useScrollLock();

  const [text, setText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null); // commentId
  const [replyingToParentReplyId, setReplyingToParentReplyId] = useState<string | undefined>(undefined); // replyId
  const [replyText, setReplyText] = useState('');
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionTarget, setMentionTarget] = useState<'main' | 'reply' | null>(null);
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const mainInputRef = useRef<HTMLInputElement>(null);
  const replyInputRef = useRef<HTMLInputElement>(null);

  const mentionSuggestions = useMemo(() => {
    if (mentionQuery === null) return [];
    return getMentionSuggestions(mentionQuery, users);
  }, [mentionQuery, users]);

  const handleInputChange = (val: string, target: 'main' | 'reply') => {
    if (target === 'main') setText(val); else setReplyText(val);

    const match = val.match(/(?:^|\s)@(\S*)$/);

    if (match && match[1].length >= 2) {
      const query = match[1];
      const atIndex = val.lastIndexOf('@');
      setMentionQuery(query);
      setMentionStartIndex(atIndex);
      setMentionTarget(target);
      return;
    }
    setMentionQuery(null);
  };

  const selectMention = (selectedUser: User) => {
    const isMain = mentionTarget === 'main';
    const currentVal = isMain ? text : replyText;
    if (mentionStartIndex === -1) return;
    const before = currentVal.slice(0, mentionStartIndex);
    const newVal = `${before}@${selectedUser.username} `;

    if (isMain) setText(newVal); else setReplyText(newVal);
    setMentionQuery(null);
    setMentionTarget(null);
    setMentionStartIndex(-1);
    (isMain ? mainInputRef : replyInputRef).current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAddComment(post.id, text);
    setMentionQuery(null);
    setText('');
  };

  const handleReplySubmit = (e: React.FormEvent, commentId: string) => {
    e.preventDefault();
    console.log("📤 Submitting reply from Modal:", { commentId, replyText, parentReplyId: replyingToParentReplyId });
    if (!replyText.trim() || !onAddReply) {
      console.warn("🚫 Cannot submit reply from Modal:", { textEmpty: !replyText.trim(), onAddReplyMissing: !onAddReply });
      return;
    }
    onAddReply(commentId, replyText, replyingToParentReplyId);
    setMentionQuery(null);
    setReplyText('');
    setReplyingTo(null);
    setReplyingToParentReplyId(undefined);
  };

  const renderContentWithHashtags = (content: string) => {
    if (!content) return null;
    const parts = content.split(RENDER_REGEX);
    return parts.map((part, i) => {
      const trimmedPart = part.trim();
      if (part.startsWith('#')) {
        return (
          <button key={i} onClick={(e) => { e.stopPropagation(); onSearchHashtag?.(part.slice(1)); onClose(); }} className="font-black text-blue-600 dark:text-blue-400 hover:underline">
            {part}
          </button>
        );
      } else if (trimmedPart.startsWith('@')) {
        const mentionedUser = getUserByMention(trimmedPart, users);
        return (
          <button key={i} onClick={(e) => { e.stopPropagation(); if (mentionedUser) { onNavigateToProfile?.(mentionedUser.id); onClose(); } }} className="text-purple-600 dark:text-purple-400 font-bold hover:underline">
            {part}
          </button>
        );
      }
      return part;
    });
  };

  const renderRepliesList = (replies: CommentReply[], commentId: string, depth: number) => {
    if (!replies || replies.length === 0) return null;

    const maxDepth = 2; // Slightly lower depth for modal
    return (
      <div className={`mt-3 space-y-3 ${depth > 0 ? 'ml-6 border-l border-slate-100 dark:border-zinc-800 pl-4' : ''}`}>
        {replies.map(reply => (
          <div key={reply.id} className="animate-in fade-in slide-in-from-left-1 duration-300">
            <div className="flex space-x-3 group/reply">
              <img
                src={reply.authorAvatar}
                className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-100 dark:ring-zinc-800 cursor-pointer"
                alt=""
                onClick={() => onNavigateToProfile?.(reply.authorId)}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span
                    className="text-[11px] font-bold text-slate-900 dark:text-white cursor-pointer hover:text-blue-600"
                    onClick={() => onNavigateToProfile?.(reply.authorId)}
                  >
                    {reply.authorName}
                  </span>
                  <span className="text-[8px] text-slate-400 font-bold">{timeAgo(reply.timestamp)}</span>
                </div>
                <div className="text-[12px] text-slate-600 dark:text-gray-400 font-medium bg-slate-50 dark:bg-zinc-900/50 p-3 rounded-xl rounded-tl-none border border-slate-50 dark:border-zinc-800">
                  {renderContentWithHashtags(reply.text)}
                </div>
                {depth < maxDepth && (
                  <button
                    onClick={() => {
                      setReplyingTo(commentId);
                      setReplyingToParentReplyId(reply.id);
                      setReplyText(`@${reply.authorUsername || 'usuario'} `);
                      setTimeout(() => replyInputRef.current?.focus(), 100);
                    }}
                    className="text-[9px] font-black uppercase text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1 mt-1 px-1"
                  >
                    <Reply size={10} /><span>Responder</span>
                  </button>
                )}

                {replyingTo === commentId && replyingToParentReplyId === reply.id && (
                  <div className="relative mt-2">
                    <form onSubmit={(e) => handleReplySubmit(e, commentId)} className="flex items-center space-x-2 animate-in slide-in-from-top-1">
                      <input ref={replyInputRef} type="text" value={replyText} onChange={(e) => handleInputChange(e.target.value, 'reply')} onKeyDown={(e) => { if (e.key === 'Escape') setMentionQuery(null); }} placeholder="Responder..." className="flex-1 px-3 py-1.5 bg-slate-100 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none dark:text-white" />
                      <button type="submit" disabled={!replyText.trim()} className="p-1.5 bg-blue-600 text-white rounded-lg"><Send size={14} /></button>
                    </form>
                    {mentionTarget === 'reply' && mentionQuery !== null && (
                      <div className="absolute left-0 top-full mt-2 w-56 bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-100 dark:border-zinc-800 z-[170] overflow-hidden shadow-2xl">
                        {mentionSuggestions.length > 0 ? mentionSuggestions.map(u => (
                          <button key={u.id} type="button" onClick={() => selectMention(u)} className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/10 text-left border-b border-gray-50 dark:border-zinc-800 last:border-0">
                            <img src={u.avatar} className="w-6 h-6 rounded-md object-cover" alt="" />
                            <div className="min-w-0"><p className="text-xs font-bold text-gray-900 dark:text-white truncate">{u.name}</p><p className="text-[9px] text-purple-600">@{u.username}</p></div>
                          </button>
                        )) : (
                          <div className="px-3 py-2 text-[10px] text-gray-400 italic">No hay resultados</div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {reply.replies && reply.replies.length > 0 && renderRepliesList(reply.replies, commentId, depth + 1)}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
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

            {post.imageUrl && post.imageUrl.length > 0 && (
              <div className={`mb-6 rounded-3xl overflow-hidden border border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 ${post.imageUrl.length === 1 ? '' : 'grid gap-1'
                } ${post.imageUrl.length === 2 ? 'grid-cols-2 h-[250px]' :
                  post.imageUrl.length === 3 ? 'grid-cols-2 grid-rows-2 h-[400px]' :
                    post.imageUrl.length === 4 ? 'grid-cols-2 h-[400px]' : 'h-[400px]'
                }`}>
                {post.imageUrl.length === 1 ? (
                  <img
                    src={post.imageUrl[0]}
                    className="w-full h-[400px] object-cover transition-all hover:scale-[1.01] rounded-3xl cursor-zoom-in"
                    alt=""
                    onClick={() => { setCurrentImgIndex(0); setIsLightboxOpen(true); }}
                  />
                ) : post.imageUrl.length === 2 ? (
                  post.imageUrl.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt=""
                      className="w-full h-full object-cover hover:opacity-90 transition-opacity cursor-zoom-in"
                      onClick={() => { setCurrentImgIndex(i); setIsLightboxOpen(true); }}
                    />
                  ))
                ) : post.imageUrl.length === 3 ? (
                  <>
                    <img
                      src={post.imageUrl[0]}
                      alt=""
                      className="w-full h-full object-cover hover:opacity-90 transition-opacity cursor-zoom-in"
                      onClick={() => { setCurrentImgIndex(0); setIsLightboxOpen(true); }}
                    />
                    <img
                      src={post.imageUrl[1]}
                      alt=""
                      className="w-full h-full object-cover hover:opacity-90 transition-opacity cursor-zoom-in"
                      onClick={() => { setCurrentImgIndex(1); setIsLightboxOpen(true); }}
                    />
                    <img
                      src={post.imageUrl[2]}
                      alt=""
                      className="w-full h-full object-cover col-span-2 hover:opacity-90 transition-opacity cursor-zoom-in"
                      onClick={() => { setCurrentImgIndex(2); setIsLightboxOpen(true); }}
                    />
                  </>
                ) : post.imageUrl.length === 4 ? (
                  post.imageUrl.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt=""
                      className="w-full h-[200px] object-cover hover:opacity-90 transition-opacity cursor-zoom-in"
                      onClick={() => { setCurrentImgIndex(i); setIsLightboxOpen(true); }}
                    />
                  ))
                ) : null}
              </div>
            )}

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
                      <button onClick={() => { setReplyingTo(comment.id); setReplyingToParentReplyId(undefined); setReplyText(`@${comment.authorUsername || 'usuario'} `); setTimeout(() => replyInputRef.current?.focus(), 100); }} className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1">
                        <Reply size={12} /><span>Responder</span>
                      </button>

                      {replyingTo === comment.id && replyingToParentReplyId === undefined && (
                        <div className="relative mt-2">
                          <form onSubmit={(e) => handleReplySubmit(e, comment.id)} className="flex items-center space-x-2 animate-in slide-in-from-top-1">
                            <input ref={replyInputRef} type="text" value={replyText} onChange={(e) => handleInputChange(e.target.value, 'reply')} onKeyDown={(e) => { if (e.key === 'Escape') setMentionQuery(null); }} placeholder="Responder..." className="flex-1 px-3 py-1.5 bg-slate-100 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none dark:text-white" />
                            <button type="submit" disabled={!replyText.trim()} className="p-1.5 bg-blue-600 text-white rounded-lg"><Send size={14} /></button>
                          </form>
                          {mentionTarget === 'reply' && mentionQuery !== null && (
                            <div className="absolute left-0 top-full mt-2 w-56 bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-100 dark:border-zinc-800 z-[170] overflow-hidden shadow-2xl">
                              {mentionSuggestions.length > 0 ? mentionSuggestions.map(u => (
                                <button key={u.id} type="button" onClick={() => selectMention(u)} className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/10 text-left border-b border-gray-50 dark:border-zinc-800 last:border-0">
                                  <img src={u.avatar} className="w-6 h-6 rounded-md object-cover" alt="" />
                                  <div className="min-w-0"><p className="text-xs font-black text-gray-900 dark:text-white truncate">{u.name}</p><p className="text-[9px] text-purple-600">@{u.username}</p></div>
                                </button>
                              )) : (
                                <div className="px-3 py-2 text-[10px] text-gray-400 italic">No hay resultados</div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {comment.replies && comment.replies.length > 0 && renderRepliesList(comment.replies, comment.id, 0)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-[#0a0a0a] border-t border-slate-50 dark:border-zinc-900 relative">
          <form onSubmit={handleSubmit} className="flex items-center space-x-3 bg-slate-50 dark:bg-zinc-900 rounded-2xl p-2 border border-slate-100 dark:border-zinc-800">
            <input ref={mainInputRef} type="text" value={text} onChange={(e) => handleInputChange(e.target.value, 'main')} onKeyDown={(e) => { if (e.key === 'Escape') setMentionQuery(null); }} placeholder="Escribe tu aportación..." className="flex-1 bg-transparent border-none px-4 py-2 text-sm font-medium outline-none focus:ring-0 dark:text-white" />
            <button type="submit" disabled={!text.trim()} className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700"><Send size={18} /></button>
          </form>
          {mentionTarget === 'main' && mentionQuery !== null && (
            <div className="absolute left-6 top-full mt-2 w-72 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-zinc-800 z-[160] overflow-hidden animate-in slide-in-from-top-2 shadow-2xl">
              {mentionSuggestions.length > 0 ? mentionSuggestions.map(u => (
                <button key={u.id} type="button" onClick={() => selectMention(u)} className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-purple-50 dark:hover:bg-purple-900/10 text-left border-b border-gray-50 dark:border-zinc-800 last:border-0">
                  <img src={u.avatar} className="w-8 h-8 rounded-lg object-cover" alt="" />
                  <div className="min-w-0"><p className="text-sm font-bold text-gray-900 dark:text-white truncate">{u.name} {u.lastName}</p><p className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">@{u.username}</p></div>
                </button>
              )) : (
                <div className="px-4 py-3 text-xs text-gray-400 italic">No hay resultados</div>
              )}
            </div>
          )}
        </div>

        <ImageLightbox
          images={post.imageUrl || []}
          initialIndex={currentImgIndex}
          isOpen={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
        />
      </div>
    </div>,
    document.body
  );
};
