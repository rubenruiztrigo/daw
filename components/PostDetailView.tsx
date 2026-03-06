import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, MessageCircle, Heart, ChevronUp, ChevronDown, Reply, Loader2, Trash2 } from 'lucide-react';
import { Post, Comment, User, CommentReply } from '../types';
import { ImageLightbox } from './ImageLightbox';
import { timeAgo } from '../utils/stringUtils';
import { RENDER_REGEX, getMentionSuggestions, getUserByMention } from '../utils/mentionUtils';
import { Language, useTranslation } from '../utils/translations';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

interface PostDetailViewProps {
    posts: Post[];
    user: User;
    onAddComment: (postId: string, text: string) => void;
    onAddReply: (commentId: string, text: string, parentReplyId?: string) => void;
    onLike?: (id: string) => void;
    onVote?: (id: string, dir: 'up' | 'down') => void;
    onRepost?: (id: string) => void;
    onDeletePost?: (postId: string) => void;
    onSearchHashtag?: (tag: string) => void;
    onNavigateToProfile?: (id: string) => void;
    users?: User[];
    language: Language;
}

export const PostDetailView: React.FC<PostDetailViewProps> = ({
    posts, user, onAddComment, onAddReply, onLike, onVote, onRepost, onDeletePost, onSearchHashtag, onNavigateToProfile, users = [], language
}) => {
    const { postId } = useParams<{ postId: string }>();
    const navigate = useNavigate();
    const t = useTranslation(language);

    const post = useMemo(() => posts.find(p => p.id === postId), [posts, postId]);

    const [text, setText] = useState('');
    const [replyingTo, setReplyingTo] = useState<string | null>(null); // commentId
    const [replyingToParentReplyId, setReplyingToParentReplyId] = useState<string | undefined>(undefined); // replyId if replying to a reply
    const [replyText, setReplyText] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [currentImgIndex, setCurrentImgIndex] = useState(0);

    const [mentionQuery, setMentionQuery] = useState<string | null>(null);
    const [mentionTarget, setMentionTarget] = useState<'main' | 'reply' | null>(null);
    const [mentionStartIndex, setMentionStartIndex] = useState(-1);
    const mainInputRef = useRef<HTMLInputElement>(null);
    const replyInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const mentionSuggestions = useMemo(() => {
        if (mentionQuery === null) return [];
        return getMentionSuggestions(mentionQuery, users);
    }, [mentionQuery, users]);

    if (!post) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#111] rounded-[2.5rem] border border-dashed border-slate-200 dark:border-zinc-800">
                <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
                <p className="text-slate-400 font-bold tracking-tight">Cargando publicación...</p>
            </div>
        );
    }

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
        console.log("📤 Submitting reply from View:", { commentId, replyText, parentReplyId: replyingToParentReplyId });
        if (!replyText.trim() || !onAddReply) {
            console.warn("🚫 Cannot submit reply:", { textEmpty: !replyText.trim(), onAddReplyMissing: !onAddReply });
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
                    <button key={i} onClick={(e) => { e.stopPropagation(); onSearchHashtag?.(part.slice(1)); }} className="font-black text-blue-600 dark:text-blue-400 hover:underline">
                        {part}
                    </button>
                );
            } else if (trimmedPart.startsWith('@')) {
                const mentionedUser = getUserByMention(trimmedPart, users);
                return (
                    <button key={i} onClick={(e) => { e.stopPropagation(); if (mentionedUser) { onNavigateToProfile?.(mentionedUser.id); } }} className="text-purple-600 dark:text-purple-400 font-bold hover:underline">
                        {part}
                    </button>
                );
            }
            return part;
        });
    };

    const renderRepliesList = (replies: CommentReply[], commentId: string, depth: number) => {
        if (!replies || replies.length === 0) return null;

        const maxDepth = 3; // Limit nesting depth for UI
        const currentPadding = Math.min(depth * 1.5, maxDepth * 1.5); // Max 4.5rem padding

        return (
            <div className={`mt-4 space-y-4 ${depth > 0 ? `ml-${currentPadding * 4} border-l-2 border-slate-50 dark:border-zinc-900 pl-6` : ''}`}>
                {replies.map(reply => (
                    <div key={reply.id} className="animate-in fade-in slide-in-from-left-2 duration-500">
                        <div className="flex space-x-4 group/reply">
                            <img
                                src={reply.authorAvatar}
                                className="w-8 h-8 rounded-lg object-cover ring-2 ring-slate-50 dark:ring-zinc-800 cursor-pointer"
                                alt=""
                                onClick={() => onNavigateToProfile?.(reply.authorId)}
                            />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <span
                                        className="text-xs font-bold text-slate-800 dark:text-white cursor-pointer hover:text-blue-600 transition-colors"
                                        onClick={() => onNavigateToProfile?.(reply.authorId)}
                                    >
                                        {reply.authorName}
                                    </span>
                                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">{timeAgo(reply.timestamp, language)}</span>
                                </div>
                                <div className="text-xs md:text-sm text-slate-600 dark:text-gray-400 font-medium bg-white dark:bg-zinc-900/30 p-4 rounded-2xl rounded-tl-none border border-slate-50 dark:border-zinc-800 shadow-sm">
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
                                        className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-2 px-2 mt-1"
                                    >
                                        <Reply size={14} /><span>Responder</span>
                                    </button>
                                )}

                                {replyingTo === commentId && replyingToParentReplyId === reply.id && (
                                    <div className="relative mt-4 ml-2">
                                        <form onSubmit={(e) => handleReplySubmit(e, commentId)} className="flex items-center space-x-3 bg-white dark:bg-[#0a0a0a] p-2 rounded-2xl border border-blue-100 dark:border-blue-900/30 animate-in slide-in-from-top-2">
                                            <input
                                                ref={replyInputRef}
                                                type="text"
                                                value={replyText}
                                                onChange={(e) => handleInputChange(e.target.value, 'reply')}
                                                onKeyDown={(e) => { if (e.key === 'Escape') setMentionQuery(null); }}
                                                placeholder="Escribiendo respuesta..."
                                                className="flex-1 px-4 py-2 bg-transparent text-sm font-bold outline-none dark:text-white"
                                            />
                                            <button type="submit" disabled={!replyText.trim()} className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-600/20">
                                                <Send size={16} />
                                            </button>
                                        </form>
                                        {mentionTarget === 'reply' && mentionQuery !== null && (
                                            <div className="absolute left-0 top-full mt-2 w-64 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-slate-100 dark:border-zinc-800 z-[10] overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-2">
                                                {mentionSuggestions.length > 0 ? mentionSuggestions.map(u => (
                                                    <button key={u.id} type="button" onClick={() => selectMention(u)} className="w-full flex items-center space-x-4 px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-left border-b border-slate-50 dark:border-zinc-900 last:border-0">
                                                        <img src={u.avatar} className="w-8 h-8 rounded-lg object-cover" alt="" />
                                                        <div className="min-w-0"><p className="text-xs font-black text-gray-900 dark:text-white truncate">{u.name}</p><p className="text-[10px] text-purple-600 font-bold">@{u.username}</p></div>
                                                    </button>
                                                )) : (
                                                    <div className="px-4 py-3 text-[10px] text-gray-400 italic">No hay resultados</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {reply.replies && reply.replies.length > 0 && (
                                    renderRepliesList(reply.replies, commentId, depth + 1)
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center space-x-2 text-slate-500 hover:text-blue-600 transition-colors font-black text-xs uppercase tracking-widest mb-2"
            >
                <ArrowLeft size={16} />
                <span>Volver atrás</span>
            </button>

            <div className="bg-white dark:bg-[#111] rounded-[2.5rem] overflow-hidden border border-gray-100 dark:border-zinc-800 shadow-sm">
                <div className="p-6 md:p-10">
                    <div className="flex items-center space-x-4 mb-8">
                        <img
                            src={post.authorAvatar}
                            className="w-16 h-16 rounded-2xl object-cover cursor-pointer hover:ring-4 hover:ring-blue-50 dark:hover:ring-blue-900/20 transition-all"
                            alt=""
                            onClick={() => onNavigateToProfile?.(post.authorId)}
                        />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                                <div className="cursor-pointer group" onClick={() => onNavigateToProfile?.(post.authorId)}>
                                    <h4 className="font-black text-slate-900 dark:text-white text-xl group-hover:text-blue-600 transition-colors">{post.authorName}</h4>
                                    <p className={`text-xs font-bold uppercase tracking-wider ${post.type === 'news' ? 'text-orange-500' : 'text-blue-500'}`}>{post.authorPosition}</p>
                                    <p className="text-[10px] text-gray-400 font-bold mt-1">Publicado {timeAgo(post.timestamp, language)}</p>
                                </div>
                                {post.authorId === user.id && onDeletePost && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsDeleteModalOpen(true);
                                        }}
                                        className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-all"
                                        title="Eliminar post"
                                    >
                                        <Trash2 size={24} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {post.type === 'news' && post.title && (
                        <h2 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white mb-6 leading-tight">
                            {post.title}
                        </h2>
                    )}

                    {post.imageUrl && post.imageUrl.length > 0 && (
                        <div className={`mb-8 rounded-[2rem] overflow-hidden border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 ${post.imageUrl.length === 1 ? '' : 'grid gap-2'
                            } ${post.imageUrl.length === 2 ? 'grid-cols-2 h-[300px]' :
                                post.imageUrl.length === 3 ? 'grid-cols-2 grid-rows-2 h-[450px]' :
                                    post.imageUrl.length === 4 ? 'grid-cols-2 h-[450px]' : 'h-[450px]'
                            }`}>
                            {post.imageUrl.length === 1 ? (
                                <img
                                    src={post.imageUrl[0]}
                                    className="w-full h-[450px] object-cover transition-all hover:scale-[1.01] rounded-[2rem] cursor-zoom-in"
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
                                        className="w-full h-[225px] object-cover hover:opacity-90 transition-opacity cursor-zoom-in"
                                        onClick={() => { setCurrentImgIndex(i); setIsLightboxOpen(true); }}
                                    />
                                ))
                            ) : null}
                        </div>
                    )}

                    <div className="text-gray-800 dark:text-gray-200 leading-relaxed text-lg md:text-xl font-medium mb-8 whitespace-pre-wrap">
                        {renderContentWithHashtags(post.content)}
                    </div>

                    <div className="flex items-center justify-between py-6 border-y border-slate-50 dark:border-zinc-900">
                        <div className="flex items-center space-x-8">
                            {post.type === 'post' ? (
                                <button onClick={() => onLike?.(post.id)} className={`flex items-center space-x-3 group ${post.userLiked ? 'text-red-500' : 'text-slate-400'}`}>
                                    <div className={`p-3 rounded-2xl transition-all ${post.userLiked ? 'bg-red-50 dark:bg-red-900/20' : 'group-hover:bg-red-50 dark:group-hover:bg-zinc-800'}`}>
                                        <Heart size={28} fill={post.userLiked ? "currentColor" : "none"} />
                                    </div>
                                    <span className="font-black text-xl dark:text-white">{post.likes}</span>
                                </button>
                            ) : (
                                <div className="flex items-center bg-slate-50 dark:bg-zinc-900 p-1.5 rounded-2xl border border-slate-100 dark:border-zinc-800">
                                    <button onClick={() => onVote?.(post.id, 'up')} className={`p-2 rounded-xl transition-all ${post.userLiked ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'text-slate-400'}`}>
                                        <ChevronUp size={28} strokeWidth={3} />
                                    </button>
                                    <span className="px-5 font-black text-xl min-w-[3rem] text-center dark:text-white">{post.likes}</span>
                                    <button onClick={() => onVote?.(post.id, 'down')} className={`p-2 rounded-xl transition-all ${post.userDownvoted ? 'text-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'text-slate-400'}`}>
                                        <ChevronDown size={28} strokeWidth={3} />
                                    </button>
                                </div>
                            )}
                            <div className="flex items-center space-x-3 text-slate-400">
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl">
                                    <MessageCircle size={28} />
                                </div>
                                <span className="font-black text-xl dark:text-white">{post.comments}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10">
                        <h5 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-8 px-2">Comentarios ({post.commentsList.length})</h5>
                        <div className="space-y-8">
                            {post.commentsList.map((comment) => (
                                <div key={comment.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex space-x-5">
                                        <img
                                            src={comment.authorAvatar}
                                            className="w-12 h-12 rounded-xl object-cover cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                                            alt=""
                                            onClick={() => onNavigateToProfile?.(comment.authorId)}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-2">
                                                <span
                                                    className="font-bold text-slate-900 dark:text-white cursor-pointer hover:text-blue-600 transition-colors"
                                                    onClick={() => onNavigateToProfile?.(comment.authorId)}
                                                >
                                                    {comment.authorName}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{timeAgo(comment.timestamp, language)}</span>
                                            </div>
                                            <div className="text-sm md:text-base text-slate-700 dark:text-gray-300 font-medium bg-slate-50 dark:bg-zinc-900/50 p-5 rounded-3xl rounded-tl-none border border-slate-100 dark:border-zinc-800 mb-3 shadow-sm">
                                                {renderContentWithHashtags(comment.text)}
                                            </div>
                                            <button
                                                onClick={() => { setReplyingTo(comment.id); setReplyingToParentReplyId(undefined); setReplyText(`@${comment.authorUsername || 'usuario'} `); setTimeout(() => replyInputRef.current?.focus(), 100); }}
                                                className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-2 px-2"
                                            >
                                                <Reply size={14} /><span>Responder</span>
                                            </button>

                                            {replyingTo === comment.id && replyingToParentReplyId === undefined && (
                                                <div className="relative mt-4 ml-2">
                                                    <form onSubmit={(e) => handleReplySubmit(e, comment.id)} className="flex items-center space-x-3 bg-white dark:bg-[#0a0a0a] p-2 rounded-2xl border border-blue-100 dark:border-blue-900/30 animate-in slide-in-from-top-2">
                                                        <input
                                                            ref={replyInputRef}
                                                            type="text"
                                                            value={replyText}
                                                            onChange={(e) => handleInputChange(e.target.value, 'reply')}
                                                            onKeyDown={(e) => { if (e.key === 'Escape') setMentionQuery(null); }}
                                                            placeholder="Escribiendo respuesta..."
                                                            className="flex-1 px-4 py-2 bg-transparent text-sm font-bold outline-none dark:text-white"
                                                        />
                                                        <button type="submit" disabled={!replyText.trim()} className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-600/20">
                                                            <Send size={16} />
                                                        </button>
                                                    </form>
                                                    {mentionTarget === 'reply' && mentionQuery !== null && (
                                                        <div className="absolute left-0 top-full mt-2 w-64 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-slate-100 dark:border-zinc-800 z-[10] overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-2">
                                                            {mentionSuggestions.length > 0 ? mentionSuggestions.map(u => (
                                                                <button key={u.id} type="button" onClick={() => selectMention(u)} className="w-full flex items-center space-x-4 px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-left border-b border-slate-50 dark:border-zinc-900 last:border-0">
                                                                    <img src={u.avatar} className="w-8 h-8 rounded-lg object-cover" alt="" />
                                                                    <div className="min-w-0"><p className="text-xs font-black text-gray-900 dark:text-white truncate">{u.name}</p><p className="text-[10px] text-purple-600 font-bold">@{u.username}</p></div>
                                                                </button>
                                                            )) : (
                                                                <div className="px-4 py-3 text-[10px] text-gray-400 italic">No hay resultados</div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Recursively render replies */}
                                            {comment.replies && comment.replies.length > 0 && (
                                                <div className="mt-4 space-y-4">
                                                    {renderRepliesList(comment.replies, comment.id, 0)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-6 md:p-10 bg-slate-50/50 dark:bg-zinc-900/20 border-t border-slate-50 dark:border-zinc-900 sticky bottom-0 z-10 backdrop-blur-sm">
                    <form onSubmit={handleSubmit} className="flex items-center space-x-4 bg-white dark:bg-[#0a0a0a] rounded-[1.5rem] p-2 md:p-3 border border-slate-100 dark:border-zinc-800 shadow-lg shadow-black/5">
                        <input
                            ref={mainInputRef}
                            type="text"
                            value={text}
                            onChange={(e) => handleInputChange(e.target.value, 'main')}
                            onKeyDown={(e) => { if (e.key === 'Escape') setMentionQuery(null); }}
                            placeholder="Escribe tu aportación aquí..."
                            className="flex-1 bg-transparent border-none px-6 py-2 text-base md:text-lg font-medium outline-none focus:ring-0 dark:text-white"
                        />
                        <button type="submit" disabled={!text.trim()} className="bg-blue-600 text-white p-4 rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/30 disabled:opacity-50 active:scale-95 flex items-center justify-center">
                            <Send size={22} className="transform rotate-45 -translate-y-0.5 translate-x-0.5" />
                        </button>
                    </form>
                    {mentionTarget === 'main' && mentionQuery !== null && (
                        <div className="absolute left-10 md:left-14 bottom-full mb-4 w-72 bg-white dark:bg-[#1a1a1a] rounded-3xl border border-gray-100 dark:border-zinc-800 z-[20] overflow-hidden animate-in slide-in-from-bottom-4 shadow-2xl">
                            <div className="p-4 border-b border-slate-50 dark:border-zinc-900 bg-slate-50/50 dark:bg-zinc-900/50">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mencionar a...</p>
                            </div>
                            {mentionSuggestions.length > 0 ? mentionSuggestions.map(u => (
                                <button key={u.id} type="button" onClick={() => selectMention(u)} className="w-full flex items-center space-x-4 px-5 py-4 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-left border-b border-slate-50 dark:border-zinc-900 last:border-0 transition-colors">
                                    <img src={u.avatar} className="w-10 h-10 rounded-xl object-cover" alt="" />
                                    <div className="min-w-0">
                                        <p className="text-sm font-black text-gray-900 dark:text-white truncate">{u.name} {u.lastName}</p>
                                        <p className="text-[11px] text-purple-600 dark:text-purple-400 font-bold tracking-tight">@{u.username}</p>
                                    </div>
                                </button>
                            )) : (
                                <div className="px-5 py-6 text-center text-xs text-gray-400 italic font-medium">Buscando usuarios...</div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={() => onDeletePost?.(post.id)}
                language={language}
            />
            <ImageLightbox
                images={post.imageUrl || []}
                initialIndex={currentImgIndex}
                isOpen={isLightboxOpen}
                onClose={() => setIsLightboxOpen(false)}
            />
        </div>
    );
};
