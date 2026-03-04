import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ArrowLeft, Send, MessageCircle, Heart, ChevronUp, ChevronDown, Share2, Repeat, Reply, ChevronRight, Calendar, Clock, MapPin, Trash2 } from 'lucide-react';
import { Post, Comment, User, CommentReply } from '../types';
import { timeAgo } from '../utils/stringUtils';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { Language, useTranslation } from '../utils/translations';
import { RENDER_REGEX, getMentionSuggestions, getUserByMention } from '../utils/mentionUtils';

interface FullPostViewProps {
  post: Post;
  currentUser?: User;
  onAddComment: (postId: string, text: string) => void;
  onAddReply?: (commentId: string, text: string, parentReplyId?: string) => void;
  onVoteComment?: (commentId: string) => void;
  onLike?: (id: string) => void;
  onVote?: (id: string, dir: 'up' | 'down') => void;
  onRepost: (id: string) => void;
  onSearchHashtag?: (tag: string) => void;
  onNavigateToProfile?: (id: string) => void;
  onDeletePost?: (id: string) => void;
  onBack: () => void;
  users?: User[];
  onNavigateToEvent?: (userId: string, eventId: string) => void;
  globalEvents?: any[];
  language: Language;
}

const NestedReply: React.FC<{
  reply: CommentReply,
  onReply: (r: CommentReply) => void,
  onNavigateToProfile?: (id: string) => void,
  renderContent: (c: string) => React.ReactNode,
  level?: number,
  language: Language
}> = ({ reply, onReply, onNavigateToProfile, renderContent, level = 0, language }) => {
  const t = useTranslation(language);
  return (
    <div className={`group/reply animate-in fade-in slide-in-from-left-1 duration-300 ${level > 0 ? 'mt-3 border-l-2 border-slate-100 dark:border-zinc-800 pl-4' : 'mt-4'}`}>
      <div className="flex space-x-3">
        <img src={reply.authorAvatar} className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-100 dark:ring-zinc-800 cursor-pointer" alt="" onClick={() => onNavigateToProfile?.(reply.authorId)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[12px] font-black text-slate-900 dark:text-white cursor-pointer hover:text-blue-600" onClick={() => onNavigateToProfile?.(reply.authorId)}>{reply.authorName}</span>
            <span className="text-[9px] text-slate-400 font-bold">{timeAgo(reply.timestamp, language)}</span>
          </div>
          <div className="text-[13px] text-slate-600 dark:text-gray-400 font-medium bg-white dark:bg-zinc-900/50 p-3 rounded-xl rounded-tl-none border border-slate-50 dark:border-zinc-800/50 leading-snug">
            {renderContent(reply.text)}
          </div>
          <button
            onClick={() => onReply(reply)}
            className="text-[9px] font-black uppercase text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline flex items-center space-x-1 mt-1"
          >
            <Reply size={10} />
            <span>{t('reply')}</span>
          </button>

          {reply.replies && reply.replies.length > 0 && (
            <div className="space-y-2">
              {reply.replies.map(subReply => (
                <NestedReply
                  key={subReply.id}
                  reply={subReply}
                  onReply={onReply}
                  onNavigateToProfile={onNavigateToProfile}
                  renderContent={renderContent}
                  level={level + 1}
                  language={language}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const FullPostView: React.FC<FullPostViewProps> = ({
  post, currentUser, onAddComment, onAddReply, onVoteComment, onLike, onVote, onRepost, onSearchHashtag, onNavigateToProfile, onDeletePost, onBack, users = [], onNavigateToEvent, globalEvents = [], language
}) => {
  const [text, setText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ commentId: string, parentReplyId?: string } | null>(null);
  const [replyText, setReplyText] = useState('');
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionTarget, setMentionTarget] = useState<'main' | 'reply' | null>(null);
  const mainInputRef = useRef<HTMLTextAreaElement>(null);
  const replyInputRef = useRef<HTMLTextAreaElement>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const t = useTranslation(language);

  const mentionSuggestions = useMemo(() => {
    if (mentionQuery === null) return [];
    return getMentionSuggestions(mentionQuery, users);
  }, [mentionQuery, users]);


  const toggleReplies = (commentId: string) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) newSet.delete(commentId);
      else newSet.add(commentId);
      return newSet;
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>, target: 'main' | 'reply') => {
    const val = e.target.value;
    const selectionStart = e.target.selectionStart;

    if (target === 'main') setText(val); else setReplyText(val);

    const textBeforeCursor = val.slice(0, selectionStart);
    const match = textBeforeCursor.match(/(?:^|\s)@([\w.]*)$/);

    if (match) {
      setMentionQuery(match[1]);
      setMentionTarget(target);
    } else {
      setMentionQuery(null);
    }
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

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !onAddReply || !replyingTo) return;
    onAddReply(replyingTo.commentId, replyText, replyingTo.parentReplyId);
    setReplyText('');
    setReplyingTo(null);
    setExpandedComments(prev => {
      const next = new Set(prev);
      next.add(replyingTo.commentId);
      return next;
    });
  };

  const handleStartReplyToComment = (comment: Comment) => {
    setReplyingTo({ commentId: comment.id, parentReplyId: undefined });
    const mention = comment.authorUsername ? `@${comment.authorUsername} ` : '';
    setReplyText(mention);
    if (!expandedComments.has(comment.id)) {
      toggleReplies(comment.id);
    }
    setTimeout(() => {
      if (replyInputRef.current) {
        replyInputRef.current.focus();
        replyInputRef.current.setSelectionRange(mention.length, mention.length);
      }
    }, 100);
  };

  const handleStartReplyToReply = (commentId: string, reply: CommentReply) => {
    setReplyingTo({ commentId: commentId, parentReplyId: reply.id });
    const mention = reply.authorUsername ? `@${reply.authorUsername} ` : '';
    setReplyText(mention);
    setTimeout(() => {
      if (replyInputRef.current) {
        replyInputRef.current.focus();
        replyInputRef.current.setSelectionRange(mention.length, mention.length);
      }
    }, 100);
  };

  const renderContentWithHashtags = (content: string) => {
    if (!content) return null;
    const parts = content.split(RENDER_REGEX);
    return parts.map((part, i) => {
      const trimmedPart = part.trim();
      if (trimmedPart.startsWith('#')) {
        return (
          <button
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              onSearchHashtag?.(trimmedPart);
            }}
            className={`font-black hover:underline transition-all ${post.type === 'news' ? 'text-orange-600 dark:text-orange-400' : 'text-blue-600 dark:text-blue-400'}`}
          >
            {part}
          </button>
        );
      } else if (trimmedPart.startsWith('@')) {
        const mentionedUser = getUserByMention(trimmedPart, users);

        if (!mentionedUser) return part;

        return (
          <button
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              onNavigateToProfile?.(mentionedUser.id);
            }}
            className="text-purple-600 dark:text-purple-400 font-bold hover:underline transition-all"
          >
            @{mentionedUser.username}
          </button>
        );
      }
      else if (part.startsWith('http')) {
        const profileEventMatch = part.match(/\/u\/([^/]+)\/e\/([^/]+)/);
        if (profileEventMatch && onNavigateToEvent) {
          const [, userId, eventId] = profileEventMatch;
          const eventOwner = users.find(u => u.id === userId);
          const foundEvent = globalEvents?.find(ev => ev.id === eventId);
          const label = foundEvent ? foundEvent.title : (eventOwner ? t('view_event_of', { name: eventOwner.name }) : t('view_event'));
          return (
            <button key={i} onClick={(e) => { e.stopPropagation(); onNavigateToEvent(userId, eventId); }} className="text-blue-600 dark:text-blue-400 hover:underline transition-all font-black inline-flex items-center space-x-1">
              <Calendar size={14} className="mr-1" /><span className="truncate max-w-[150px]">{label}</span>
            </button>
          );
        }
        return (
          <button key={i} onClick={(e) => { e.stopPropagation(); window.open(part, '_blank'); }} className="text-blue-600 dark:text-blue-400 hover:underline transition-all font-medium">
            {part}
          </button>
        );
      }
      return part;
    });
  };

  const isOwner = currentUser?.id === post.authorId;

  return (
    <>
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
          onDeletePost?.(post.id);
          onBack();
        }}
        language={language}
      />
      <div className="max-w-3xl mx-auto bg-white dark:bg-[#111] rounded-[2rem] md:rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 animate-in fade-in duration-500 overflow-hidden">
        <div className="px-5 sm:px-8 py-4 md:py-6 border-b border-gray-50 dark:border-zinc-900 flex items-center justify-between bg-white dark:bg-[#111] sticky top-0 z-10 rounded-t-[2rem] md:rounded-t-[2.5rem]">
          <div className="flex items-center space-x-4">
            <button onClick={onBack} className="p-3 bg-gray-50 dark:bg-zinc-800 rounded-2xl text-slate-400 hover:text-blue-600 transition-all">
              <ArrowLeft size={20} />
            </button>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              {post.type === 'news' ? 'Noticia' : 'Post'}
            </h3>
          </div>

          {isOwner && onDeletePost && (
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="p-3 bg-red-50 dark:bg-red-900/20 rounded-2xl text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all"
              title={t('delete_post')}
            >
              <Trash2 size={20} />
            </button>
          )}
        </div>

        <div className="p-8">
          <div className="flex items-center space-x-4 mb-8">
            <img src={post.authorAvatar} className="w-14 h-14 rounded-2xl object-cover cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all" alt="" onClick={() => onNavigateToProfile?.(post.authorId)} />
            <div className="cursor-pointer group" onClick={() => onNavigateToProfile?.(post.authorId)}>
              <h4 className="font-black text-slate-900 dark:text-white leading-tight text-lg group-hover:text-blue-600 transition-colors">{post.authorName}</h4>
              <p className={`text-xs font-bold uppercase tracking-wider ${post.type === 'news' ? 'text-orange-500' : 'text-blue-500'}`}>{post.authorPosition}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">{t('published_on', { date: timeAgo(post.timestamp, language) })}</p>
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
                    <span className={`px-4 font-black text-xl min-w-[3rem] text-center ${post.likes > 0 ? 'text-emerald-600' : post.likes < 0 ? 'text-orange-600' : 'text-slate-900 dark:text-white'}`}>{post.upvotes !== undefined ? post.upvotes : post.likes}</span>
                    <button onClick={() => onVote && onVote(post.id, 'down')} className={`p-2 rounded-xl transition-all ${post.userDownvoted ? 'text-orange-500' : 'text-slate-400 hover:text-orange-500'}`}><ChevronDown size={24} strokeWidth={3} /></button>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-400"><MessageCircle size={24} /><span className="font-black dark:text-white text-lg">{post.comments}</span></div>
                </>
              )}
            </div>
            <button className="p-3 text-slate-300 hover:text-blue-600 transition-all"><Share2 size={24} /></button>
          </div>

          <div className="space-y-8">
            <h5 className="text-sm font-black text-slate-400 uppercase tracking-widest px-1">{t('comments_count', { count: post.commentsList.length })}</h5>

            <div className="relative">
              <form onSubmit={handleSubmit} className="mb-10 flex items-center space-x-3 bg-slate-50 dark:bg-zinc-900 rounded-[1.5rem] p-3 border border-slate-200 dark:border-zinc-800 focus-within:ring-4 focus-within:ring-blue-50 transition-all">
                <textarea
                  ref={mainInputRef as any}
                  value={text}
                  onChange={(e) => handleInputChange(e, 'main')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (!text.trim()) return;
                      onAddComment(post.id, text);
                      setText('');
                    }
                  }}
                  placeholder={t('write_comment')}
                  className="flex-1 bg-transparent border-none px-4 py-2 text-sm font-medium outline-none focus:ring-0 dark:text-white resize-none h-[42px] content-center scrollbar-hide"
                />
                <button type="submit" disabled={!text.trim()} className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 disabled:opacity-30 transform active:scale-90"><Send size={20} /></button>
              </form>

              {mentionTarget === 'main' && mentionSuggestions.length > 0 && (
                <div className="absolute left-0 bottom-full mb-2 w-72 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-zinc-800 z-[60] overflow-hidden animate-in slide-in-from-bottom-2 duration-100">
                  {mentionSuggestions.map(u => (
                    <button key={u.id} type="button" onClick={() => selectMention(u)} className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors text-left border-b border-gray-50 dark:border-zinc-800 last:border-0">
                      <img src={u.avatar} className="w-8 h-8 rounded-lg object-cover" alt="" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{u.name} {u.lastName}</p>
                        <p className="text-[10px] text-purple-600 font-bold">@{u.username}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {post.commentsList.length === 0 ? (
              <p className="text-slate-300 italic font-bold text-center py-12">{t('no_comments')}</p>
            ) : (
              <div className="space-y-8 pb-10">
                {post.commentsList.map((comment) => {
                  const isExpanded = expandedComments.has(comment.id);
                  const hasReplies = comment.replies && comment.replies.length > 0;

                  return (
                    <div key={comment.id} className="group/comment animate-in fade-in slide-in-from-bottom-2">
                      <div className="flex space-x-4">
                        <div className="flex flex-col items-center shrink-0">
                          <img src={comment.authorAvatar} className="w-11 h-11 rounded-xl object-cover cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all" alt="" onClick={() => onNavigateToProfile?.(comment.authorId || '')} />
                          {(hasReplies && isExpanded) || (replyingTo?.commentId === comment.id) ? (
                            <div className="w-0.5 flex-1 bg-slate-100 dark:bg-zinc-800 mt-2 mb-1"></div>
                          ) : null}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm font-black text-slate-900 dark:text-white cursor-pointer hover:text-blue-600 transition-colors" onClick={() => onNavigateToProfile?.(comment.authorId || '')}>{comment.authorName}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{timeAgo(comment.timestamp, language)}</span>
                          </div>
                          <div className="text-sm text-slate-700 dark:text-gray-300 font-medium bg-slate-50 dark:bg-zinc-900 p-5 rounded-[1.5rem] rounded-tl-none border border-slate-100 dark:border-zinc-800 leading-relaxed mb-2">
                            {renderContentWithHashtags(comment.text)}
                          </div>

                          <div className="flex items-center space-x-6 px-1">
                            <button
                              onClick={() => onVoteComment?.(comment.id)}
                              className={`text-[10px] font-black uppercase flex items-center space-x-1 transition-colors ${comment.userLiked ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`}
                            >
                              <Heart size={12} fill={comment.userLiked ? "currentColor" : "none"} />
                              <span>{comment.likes || 0}</span>
                            </button>

                            <button
                              onClick={() => handleStartReplyToComment(comment)}
                              className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline flex items-center space-x-1 transition-colors"
                            >
                              <Reply size={12} />
                              <span>{t('reply')}</span>
                            </button>

                            {hasReplies && (
                              <button
                                onClick={() => toggleReplies(comment.id)}
                                className={`text-[10px] font-black uppercase flex items-center space-x-1 transition-all ${isExpanded ? 'text-slate-400' : 'text-blue-600 dark:text-blue-400 hover:underline'}`}
                              >
                                <ChevronRight size={12} className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                                <span>{isExpanded ? t('hide_replies') : t('view_replies', { count: comment.replies?.length })}</span>
                              </button>
                            )}
                          </div>

                          {replyingTo?.commentId === comment.id && (
                            <div className="relative mt-3 mb-4">
                              <form onSubmit={handleReplySubmit} className="flex items-center space-x-2 animate-in slide-in-from-top-1 duration-200">
                                <textarea
                                  ref={replyInputRef as any}
                                  value={replyText}
                                  onChange={(e) => handleInputChange(e, 'reply')}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      if (!replyText.trim() || !onAddReply || !replyingTo) return;
                                      onAddReply(replyingTo.commentId, replyText, replyingTo.parentReplyId);
                                      setReplyText('');
                                      setReplyingTo(null);
                                      setExpandedComments(prev => {
                                        const next = new Set(prev);
                                        next.add(replyingTo.commentId);
                                        return next;
                                      });
                                    }
                                  }}
                                  placeholder={t('write_reply')}
                                  className="flex-1 px-4 py-2.5 bg-white dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none dark:text-white resize-none h-[40px] content-center scrollbar-hide"
                                />
                                <button type="submit" disabled={!replyText.trim()} className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-30"><Send size={14} /></button>
                              </form>

                              {mentionTarget === 'reply' && mentionSuggestions.length > 0 && (
                                <div className="absolute left-0 bottom-full mb-2 w-64 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-zinc-800 z-[60] overflow-hidden animate-in slide-in-from-bottom-2 duration-100">
                                  {mentionSuggestions.map(u => (
                                    <button key={u.id} type="button" onClick={() => selectMention(u)} className="w-full flex items-center space-x-3 px-3 py-2.5 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors text-left border-b border-gray-50 dark:border-zinc-800 last:border-0">
                                      <img src={u.avatar} className="w-7 h-7 rounded-lg object-cover" alt="" />
                                      <div className="min-w-0">
                                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{u.name} {u.lastName}</p>
                                        <p className="text-[9px] text-purple-600 dark:text-purple-400 font-bold">@{u.username}</p>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {hasReplies && isExpanded && (
                            <div className="mt-3 space-y-4 animate-in slide-in-from-top-2 duration-300">
                              {comment.replies!.map(reply => (
                                <NestedReply
                                  key={reply.id}
                                  reply={reply}
                                  onReply={(r) => handleStartReplyToReply(comment.id, r)}
                                  onNavigateToProfile={onNavigateToProfile}
                                  renderContent={renderContentWithHashtags}
                                  language={language}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
