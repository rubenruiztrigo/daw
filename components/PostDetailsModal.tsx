import React, { useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useScrollLock } from '../hooks/useScrollLock';
import { X, Send, MessageCircle, Heart, ChevronUp, ChevronDown, Reply, Calendar, Clock, MapPin } from 'lucide-react';
import { Post, Comment, User, CommentReply } from '../types';
import { timeAgo } from '../utils/stringUtils';
import { RENDER_REGEX, getMentionSuggestions, getUserByMention } from '../utils/mentionUtils';
import { ImageLightbox } from './ImageLightbox';
import { useTranslation } from '../utils/translations';
import { Language } from '../utils/translations';
import { EventPreview } from './EventPreview';
import { getSafeAvatar } from '../utils/avatarUtils';
import { Link } from 'react-router-dom';
import { sortComments } from '../utils/sortUtils';

interface PostDetailsModalProps {
  post: Post;
  onClose: () => void;
  onAddComment: (postId: string, text: string) => void;
  onAddReply: (commentId: string, text: string, parentReplyId?: string) => void;
  onLike: (id: string) => void;
  onVote: (id: string, dir: 'up' | 'down') => void;
  onRepost: (id: string) => void;
  onSearchHashtag?: (tag: string) => void;
  onLikeComment?: (commentId: string) => void;
  onLikeReply?: (replyId: string) => void;
  onNavigateToProfile?: (id: string) => void;
  onNavigateToEvent?: (userId: string, eventId: string) => void;
  users?: User[];
  language?: Language;
}

export const PostDetailsModal: React.FC<PostDetailsModalProps> = ({
  post, onClose, onAddComment, onAddReply, onLike, onLikeComment, onLikeReply, onVote, onRepost, onSearchHashtag, onNavigateToProfile, onNavigateToEvent, users = [], language = 'es'
}) => {
  useScrollLock();

  const [text, setText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null); // commentId
  const [replyingToParentReplyId, setReplyingToParentReplyId] = useState<string | undefined>(undefined); // replyId
  const [replyText, setReplyText] = useState('');
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [visibleCommentsCount, setVisibleCommentsCount] = useState(10);
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});

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

  const toggleReplies = (commentId: string) => {
    setExpandedReplies(prev => ({ ...prev, [commentId]: !prev[commentId] }));
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
          <button
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              if (mentionedUser) {
                onNavigateToProfile?.(mentionedUser.id);
                onClose();
              }
            }}
            className="text-purple-600 dark:text-purple-400 font-bold hover:underline"
          >
            {part}
          </button>
        );
      } else if (part.startsWith('http')) {
        const profileEventMatch = part.match(/(?:\/u\/|\/@)([^\/]+)\/(?:e|evento)\/([^\/\?\s]+)/);
        if (profileEventMatch && onNavigateToEvent) {
          const [, identifier, eventId] = profileEventMatch;
          const cleanIdentifier = identifier.startsWith('@') ? identifier.slice(1) : identifier;
          const eventOwner = users.find(u => u.username === cleanIdentifier || u.id === cleanIdentifier);
          const label = eventOwner ? `Ver evento de ${eventOwner.name}` : 'Ver evento';
          return (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                onNavigateToEvent(cleanIdentifier, eventId);
                onClose();
              }}
              className="text-blue-600 dark:text-blue-400 hover:underline transition-all font-black inline-flex items-center space-x-1"
            >
              <Calendar size={14} className="mr-1" />
              <span>{label}</span>
            </button>
          );
        }
        return (
          <button
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              if (part.includes('/event/') || part.includes('/calendario/') || part.includes('/evento/')) {
                onClose();
                window.location.hash = '/calendario';
              } else {
                window.open(part, '_blank');
              }
            }}
            className="text-blue-600 dark:text-blue-400 hover:underline transition-all font-medium break-all text-left"
          >
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
        {sortComments(replies).map(reply => (
          <div key={reply.id} className="animate-in fade-in slide-in-from-left-1 duration-300">
            <div className="flex space-x-3 group/reply">
              <img
                src={getSafeAvatar(reply.authorAvatar)}
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
                  <span className="text-[8px] text-slate-400 font-bold">{timeAgo(reply.timestamp, language as 'es' | 'en')}</span>
                </div>
                <div className="text-[12px] text-slate-600 dark:text-gray-400 font-medium bg-slate-50 dark:bg-zinc-900 p-3 rounded-xl rounded-tl-none border border-slate-50 dark:border-zinc-800">
                  {renderContentWithHashtags(reply.text)}
                </div>
                <div className="flex items-center space-x-4 mt-1 px-1">
                  {depth < maxDepth && (
                    <button
                      onClick={() => {
                        setReplyingTo(commentId);
                        setReplyingToParentReplyId(reply.id);
                        setReplyText(`@${reply.authorUsername || 'usuario'} `);
                        setTimeout(() => replyInputRef.current?.focus(), 100);
                      }}
                      className="text-[9px] font-black uppercase text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
                    >
                      <Reply size={10} /><span>Responder</span>
                    </button>
                  )}

                  <button
                    onClick={() => onLikeReply?.(reply.id)}
                    className={`text-[9px] font-black uppercase flex items-center space-x-1 transition-colors ${reply.userLiked ? 'text-red-500' : 'text-slate-400'}`}
                  >
                    <Heart size={10} fill={reply.userLiked ? "currentColor" : "none"} />
                    <span>{reply.likes || 0}</span>
                  </button>
                </div>

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
                            <img src={getSafeAvatar(u.avatar)} className="w-6 h-6 rounded-md object-cover" alt="" />
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

  const renderImages = () => {
    if (!post?.imageUrl || post.imageUrl.length === 0) return null;
    return (
      <div className="mb-6">
        {post.imageUrl.length === 1 && (
          <div className="relative w-full aspect-[2/1] rounded-3xl overflow-hidden border border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50">
            <img
              src={post.imageUrl[0]}
              className="w-full h-full object-cover transition-all hover:scale-[1.01] cursor-zoom-in"
              alt=""
              onClick={() => { setCurrentImgIndex(0); setIsLightboxOpen(true); }}
            />
          </div>
        )}

        {post.imageUrl.length === 2 && (
          <div className="grid grid-cols-2 gap-2 w-full aspect-[2/1] rounded-3xl overflow-hidden border border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50">
            {post.imageUrl.map((url, i) => (
              <img
                key={i}
                src={url}
                alt=""
                className="w-full h-full object-cover hover:opacity-90 transition-opacity cursor-zoom-in"
                onClick={() => { setCurrentImgIndex(i); setIsLightboxOpen(true); }}
              />
            ))}
          </div>
        )}

        {post.imageUrl.length === 3 && (
          <div className="grid grid-cols-2 grid-rows-2 gap-2 w-full aspect-[2/1] rounded-3xl overflow-hidden border border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50">
            <div className="relative row-span-2">
              <img
                src={post.imageUrl[0]}
                alt=""
                className="w-full h-full object-cover hover:opacity-90 transition-opacity cursor-zoom-in"
                onClick={() => { setCurrentImgIndex(0); setIsLightboxOpen(true); }}
              />
            </div>
            <div className="relative h-full">
              <img
                src={post.imageUrl[1]}
                alt=""
                className="w-full h-full object-cover hover:opacity-90 transition-opacity cursor-zoom-in"
                onClick={() => { setCurrentImgIndex(1); setIsLightboxOpen(true); }}
              />
            </div>
            <div className="relative h-full">
              <img
                src={post.imageUrl[2]}
                alt=""
                className="w-full h-full object-cover hover:opacity-90 transition-opacity cursor-zoom-in"
                onClick={() => { setCurrentImgIndex(2); setIsLightboxOpen(true); }}
              />
            </div>
          </div>
        )}

        {post.imageUrl.length >= 4 && (
          <div className="grid grid-cols-2 grid-rows-2 gap-2 w-full aspect-[2/1] rounded-3xl overflow-hidden border border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50">
            {post.imageUrl.slice(0, 4).map((url, i) => (
              <div key={i} className="relative h-full">
                <img
                  src={url}
                  alt=""
                  className="w-full h-full object-cover hover:opacity-90 transition-opacity cursor-zoom-in"
                  onClick={() => { setCurrentImgIndex(i); setIsLightboxOpen(true); }}
                />
                {i === 3 && post.imageUrl.length > 4 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none">
                    <span className="text-white font-black text-2xl">+{post.imageUrl.length - 4}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
      <div className="bg-white dark:bg-[#0a0a0a] w-full max-w-3xl rounded-[2.5rem] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 border border-white dark:border-zinc-800" onClick={(e) => e.stopPropagation()}>
        <div className="px-4 md:px-8 py-4 border-b border-slate-50 dark:border-zinc-900 flex justify-between items-center bg-white dark:bg-[#0a0a0a] sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="text-slate-400 group-hover:text-blue-500 transition-colors"><MessageCircle size={20} /></div>
            <div><h3 className="text-lg font-bold text-slate-900 dark:text-white">Detalle</h3></div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 dark:hover:bg-zinc-900 rounded-full text-slate-300 transition-all"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="p-4 md:p-8 pb-2 md:pb-4">
            <div className="flex items-center space-x-4 mb-6">
              <img src={getSafeAvatar(post.authorAvatar)} className="w-14 h-14 rounded-2xl object-cover cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all" alt="" onClick={() => { onNavigateToProfile?.(post.authorId); onClose(); }} />
              <div className="flex-1 min-w-0 flex items-start justify-between">
                <div className="cursor-pointer group" onClick={() => { onNavigateToProfile?.(post.authorId); onClose(); }}>
                  <h4 className="font-black text-slate-900 dark:text-white text-lg group-hover:text-blue-600 transition-colors">{post.authorName}</h4>
                  <p className={`text-xs font-bold uppercase tracking-wider ${post.type === 'news' ? 'text-orange-500' : 'text-blue-500'}`}>{post.authorPosition}</p>
                  {post.type !== 'news' && (
                    <p className="text-[10px] text-gray-400 font-bold mt-1">Publicado {timeAgo(post.timestamp, language as 'es' | 'en')}</p>
                  )}
                </div>
                {post.type === 'news' && (
                  <div className="flex flex-col items-end pt-1">
                    <p className="text-[10px] text-gray-400 font-bold">{timeAgo(post.timestamp, language as 'es' | 'en').toUpperCase()}</p>
                  </div>
                )}
              </div>
            </div>
            {post.type === 'news' && post.title && (
              <h2 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white mb-5 leading-tight">
                {post.title}
              </h2>
            )}

            {post.type === 'news' && renderImages()}

            <div className="text-gray-800 dark:text-gray-200 leading-relaxed text-base font-medium mb-6">
              {renderContentWithHashtags(post.content)}
            </div>

            {post.linkedEvent && (
              <EventPreview
                event={post.linkedEvent}
                language={language as Language}
                onNavigateToEvent={onNavigateToEvent}
              />
            )}

            {post.type !== 'news' && renderImages()}

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

          <div className="px-4 md:px-8 pb-4 md:pb-6">
            <h5 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 pb-6 border-b border-slate-100 dark:border-zinc-800 px-1">Comentarios ({post.commentsList.length})</h5>
            <div className="space-y-6 max-h-[550px] overflow-y-auto pr-2">
              {sortComments(post.commentsList).slice(0, visibleCommentsCount).map((comment) => (
                <div key={comment.id} className="animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex space-x-4">
                    <img src={getSafeAvatar(comment.authorAvatar)} className="w-10 h-10 rounded-xl object-cover cursor-pointer hover:ring-2 hover:ring-blue-500" alt="" onClick={() => { if (comment.authorId) { onNavigateToProfile?.(comment.authorId); onClose(); } }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-bold text-slate-900 dark:text-white cursor-pointer hover:text-blue-600" onClick={() => { if (comment.authorId) { onNavigateToProfile?.(comment.authorId); onClose(); } }}>{comment.authorName}</span>
                          {comment.authorUsername && (
                            <span className={`text-[10px] font-medium ${post.type === 'news' ? 'text-orange-500' : 'text-purple-500'}`}>
                              @{comment.authorUsername}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold">{timeAgo(comment.timestamp, language as 'es' | 'en')}</span>
                      </div>
                      <div className="text-sm text-slate-600 dark:text-gray-400 font-medium bg-slate-50 dark:bg-zinc-900 p-4 rounded-2xl rounded-tl-none border border-slate-100 dark:border-zinc-800 mb-2">
                        {renderContentWithHashtags(comment.text)}
                      </div>
                      <div className="flex items-center space-x-6">
                        <button onClick={() => { setReplyingTo(comment.id); setReplyingToParentReplyId(undefined); setReplyText(`@${comment.authorUsername || 'usuario'} `); setTimeout(() => replyInputRef.current?.focus(), 100); }} className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1">
                          <Reply size={12} /><span>Responder</span>
                        </button>

                        <button
                          onClick={() => onLikeComment?.(comment.id)}
                          className={`text-[10px] font-black uppercase flex items-center space-x-1 transition-colors ${comment.userLiked ? 'text-red-500' : 'text-slate-400'}`}
                        >
                          <Heart size={12} fill={comment.userLiked ? "currentColor" : "none"} />
                          <span>{comment.likes || 0}</span>
                        </button>

                        {comment.replies && comment.replies.length > 0 && (
                          <button
                            onClick={() => toggleReplies(comment.id)}
                            className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400 hover:underline flex items-center space-x-1"
                          >
                            {expandedReplies[comment.id] ? 'Ocultar respuestas' : `Ver ${comment.replies.length} respuestas`}
                          </button>
                        )}
                      </div>

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
                                  <img src={getSafeAvatar(u.avatar)} className="w-6 h-6 rounded-md object-cover" alt="" />
                                  <div className="min-w-0"><p className="text-xs font-black text-gray-900 dark:text-white truncate">{u.name}</p><p className="text-[9px] text-purple-600">@{u.username}</p></div>
                                </button>
                              )) : (
                                <div className="px-3 py-2 text-[10px] text-gray-400 italic">No hay resultados</div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {comment.replies && comment.replies.length > 0 && expandedReplies[comment.id] && (
                        <div className="mt-3 ml-2 animate-in fade-in slide-in-from-top-2 duration-300">
                          {renderRepliesList(comment.replies, comment.id, 0)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {visibleCommentsCount < post.commentsList.length && (
                <div className="flex justify-center mt-4 pb-2">
                  <button
                    onClick={() => setVisibleCommentsCount(prev => prev + 10)}
                    className="px-5 py-2 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-xl font-bold text-xs hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                  >
                    Cargar más comentarios
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6 pt-0 md:pt-0 bg-white dark:bg-[#0a0a0a] border-t-0 relative">
          <form onSubmit={handleSubmit} className="flex items-center space-x-3 bg-slate-50 dark:bg-zinc-900 rounded-2xl p-2 border border-slate-100 dark:border-zinc-800">
            <input ref={mainInputRef} type="text" value={text} onChange={(e) => handleInputChange(e.target.value, 'main')} onKeyDown={(e) => { if (e.key === 'Escape') setMentionQuery(null); }} placeholder="Escribe tu aportación..." className="flex-1 bg-transparent border-none px-4 py-2 text-sm font-medium outline-none focus:ring-0 dark:text-white" />
            <button type="submit" disabled={!text.trim()} className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700"><Send size={18} /></button>
          </form>
          {mentionTarget === 'main' && mentionQuery !== null && (
            <div className="absolute left-6 top-full mt-2 w-72 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-zinc-800 z-[160] overflow-hidden animate-in slide-in-from-top-2 shadow-2xl">
              {mentionSuggestions.length > 0 ? mentionSuggestions.map(u => (
                <button key={u.id} type="button" onClick={() => selectMention(u)} className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-purple-50 dark:hover:bg-purple-900/10 text-left border-b border-gray-50 dark:border-zinc-800 last:border-0">
                  <img src={getSafeAvatar(u.avatar)} className="w-8 h-8 rounded-lg object-cover" alt="" />
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
