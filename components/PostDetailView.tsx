import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { sortComments } from '../utils/sortUtils';
import { ArrowLeft, Send, MessageSquare, Heart, ChevronUp, ChevronDown, Reply, Loader2, Trash2, Calendar, Clock, MapPin, Share2, Repeat } from 'lucide-react';
import { Post, Comment, User, CommentReply, Chat } from '../types';
import { ImageLightbox } from './ImageLightbox';
import { ShareModal } from './ShareModal';
import { extractAllExternalUrls, isExternalUrl, timeAgo } from '../utils/stringUtils';
import { RENDER_REGEX, getMentionSuggestions, getUserByMention } from '../utils/mentionUtils';
import { Language, useTranslation } from '../utils/translations';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { EventPreview } from './EventPreview';
import { LinkPreview } from './LinkPreview';
import { getSafeAvatar } from '../utils/avatarUtils';
import { supabase } from '../supabaseClient';

interface PostDetailViewProps {
    posts: Post[];
    user: User;
    onAddComment: (postId: string, text: string) => void;
    onAddReply: (commentId: string, text: string, parentReplyId?: string) => Promise<string | null> | void;
    onLike?: (id: string) => void;
    onLikeComment?: (id: string) => void;
    onLikeReply?: (id: string) => void;
    onVote?: (id: string, dir: 'up' | 'down') => void;
    onRepost?: (id: string) => void;
    onDeletePost?: (postId: string) => void;
    onSearchHashtag?: (tag: string) => void;
    onNavigateToProfile?: (id: string) => void;
    onNavigateToEvent?: (userId: string, eventId: string) => void;
    users?: User[];
    chats?: Chat[];
    onShareViaChat?: (recipientId: string, text: string, postId?: string, sharedProfileId?: string, sharedEventId?: string, imageUrls?: string[], newsId?: string, scheduledAt?: Date) => Promise<void>;
    followedUserIds?: Set<string>;
    followerUserIds?: Set<string>;
    language: Language;
    likedIds?: Set<string>;
    votedUpIds?: Set<string>;
    votedDownIds?: Set<string>;
    repostedIds?: Set<string>;
}

export const PostDetailView: React.FC<PostDetailViewProps> = ({
    posts, user, onAddComment, onAddReply, onLike, onLikeComment, onLikeReply, onVote, onRepost, onDeletePost, onSearchHashtag, onNavigateToProfile, onNavigateToEvent, users = [], chats = [], onShareViaChat, followedUserIds = new Set(), followerUserIds = new Set(), language,
    likedIds = new Set(), votedUpIds = new Set(), votedDownIds = new Set(), repostedIds = new Set()
}) => {
    const { postId } = useParams<{ postId: string }>();
    const navigate = useNavigate();
    const t = useTranslation(language);

    const [localPost, setLocalPost] = useState<Post | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCommentsLoading, setIsCommentsLoading] = useState(true);

    const handleLikeLocal = () => {
        if (!post) return;
        const isCurrentlyLiked = post.userLiked;
        setLocalPost(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                likes: Math.max(0, (prev.likes || 0) + (isCurrentlyLiked ? -1 : 1))
            };
        });
        onLike?.(post.id);
    };

    const handleRepostLocal = () => {
        if (!post) return;
        const isCurrentlyReposted = post.userReposted;
        setLocalPost(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                reposts: Math.max(0, (prev.reposts || 0) + (isCurrentlyReposted ? -1 : 1))
            };
        });
        onRepost?.(post.id);
    };

    const handleVoteLocal = (dir: 'up' | 'down') => {
        if (!post) return;
        const isCurrentlyUp = post.userLiked;
        const isCurrentlyDown = post.userDownvoted;
        
        setLocalPost(prev => {
            if (!prev) return prev;
            const togglingOff = (dir === 'up' && isCurrentlyUp) || (dir === 'down' && isCurrentlyDown);
            let upDelta = 0;
            let downDelta = 0;
            
            if (togglingOff) {
                if (dir === 'up') upDelta = -1;
                else downDelta = -1;
            } else {
                if (isCurrentlyUp) upDelta = -1;
                if (isCurrentlyDown) downDelta = -1;
                if (dir === 'up') upDelta += 1;
                else downDelta += 1;
            }

            return {
                ...prev,
                upvotes: Math.max(0, (prev.upvotes ?? 0) + upDelta),
                downvotes: Math.max(0, (prev.downvotes ?? 0) + downDelta),
            };
        });
        onVote?.(post.id, dir);
    };

    const handleLikeCommentLocal = (commentId: string) => {
        setLocalPost(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                commentsList: (prev.commentsList || []).map(c => {
                    if (c.id !== commentId) return c;
                    const newLiked = !c.userLiked;
                    return { ...c, userLiked: newLiked, likes: (c.likes || 0) + (newLiked ? 1 : -1) };
                })
            };
        });
        onLikeComment?.(commentId);
    };

    const handleLikeReplyLocal = (replyId: string) => {
        if (!replyId || replyId.startsWith('temp-')) return;
        const updateInTree = (replies: CommentReply[]): CommentReply[] =>
            replies.map(r => {
                if (r.id === replyId) {
                    const newLiked = !r.userLiked;
                    return { ...r, userLiked: newLiked, likes: (r.likes || 0) + (newLiked ? 1 : -1) };
                }
                if (r.replies && r.replies.length > 0) return { ...r, replies: updateInTree(r.replies) };
                return r;
            });
        setLocalPost(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                commentsList: (prev.commentsList || []).map(c => ({
                    ...c,
                    replies: updateInTree(c.replies || [])
                }))
            };
        });
        onLikeReply?.(replyId);
    };

    // Prefer localPost (has full comments from Supabase), fall back to feed post as placeholder.
    // Always recompute userLiked/userDownvoted/userReposted from current props so they stay
    // correct on refresh (likedIds etc. may load after the Supabase fetch completes).
    const post = useMemo(() => {
        const globalPost = posts.find(p => p.id === postId) || null;
        const base = localPost || globalPost;
        if (!base) return null;

        return {
            ...base,
            // Sync counters from global state if available (optimistic updates from feed)
            likes: globalPost ? globalPost.likes : (base.likes || 0),
            upvotes: globalPost ? (globalPost.upvotes ?? globalPost.likes) : (base.upvotes || 0),
            downvotes: globalPost ? globalPost.downvotes : (base.downvotes || 0),
            comments: globalPost ? globalPost.comments : (base.comments || 0),
            reposts: globalPost ? globalPost.reposts : (base.reposts || 0),
            
            // Sync user interaction states
            userLiked: likedIds.has(base.id) || votedUpIds.has(base.id),
            userDownvoted: votedDownIds.has(base.id),
            userReposted: repostedIds.has(base.id),
        };
    }, [localPost, posts, postId, likedIds, votedUpIds, votedDownIds, repostedIds]);
    const isNews = window.location.pathname.includes('/noticias');

    const [text, setText] = useState('');
    const [replyingTo, setReplyingTo] = useState<string | null>(null); // commentId
    const [replyingToParentReplyId, setReplyingToParentReplyId] = useState<string | undefined>(undefined); // replyId if replying to a reply
    const [replyText, setReplyText] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [currentImgIndex, setCurrentImgIndex] = useState(0);
    const [visibleCommentsCount, setVisibleCommentsCount] = useState(10);
    const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});

    const [sharingPost, setSharingPost] = useState<Post | null>(null);

    const [mentionQuery, setMentionQuery] = useState<string | null>(null);
    const [mentionTarget, setMentionTarget] = useState<'main' | 'reply' | null>(null);
    const [mentionStartIndex, setMentionStartIndex] = useState(-1);
    const mainInputRef = useRef<HTMLInputElement>(null);
    const replyInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        if (!postId) {
            setIsLoading(false);
            setIsCommentsLoading(false);
            return;
        }

        let cancelled = false;

        const fetchPost = async () => {
            setIsLoading(true);
            setIsCommentsLoading(true);
            try {
                const table = isNews ? 'news' : 'posts';
                const selectStr = isNews
                    ? 'id, author_id, content, titulo, created_at, likes_count, up_votes_count, down_votes_count, comments_count, reposts_count, image_url, tags, linked_event_id, is_pinned, pinned_at, show_link_preview, link_preview_url, author:profiles!author_id(id, name, last_name, username, avatar, position, is_organization)'
                    : 'id, author_id, content, created_at, likes_count, comments_count, reposts_count, image_url, tags, event_id, is_pinned, pinned_at, show_link_preview, link_preview_url, doc_url, doc_name, author:profiles!author_id(id, name, last_name, username, avatar, position, is_organization), linked_event:user_events!event_id(id, title, event_date, event_time, type, creator_id, attendees_count, image_url, description, location)';

                // Fetch itemData and counts in parallel to be as fast as possible!
                const [itemRes, countsRes, commentCountRes, repostsRes] = await Promise.all([
                    supabase.from(table).select(selectStr).eq('id', postId).single() as any,
                    (isNews 
                        ? supabase.from('news_votes').select('vote_type').eq('news_id', postId)
                        : supabase.from('post_likes').select('*', { count: 'exact', head: true }).eq('post_id', postId)) as any,
                    supabase.from(isNews ? 'news_comments' : 'post_comments').select('*', { count: 'exact', head: true }).eq(isNews ? 'news_id' : 'post_id', postId) as any,
                    supabase.from('reposts').select('id').eq(isNews ? 'news_id' : 'post_id', postId) as any
                ]);

                const itemData = itemRes.data;
                const itemError = itemRes.error;

                if (itemError) {
                    console.error("Error fetching post data in PostDetailView:", itemError);
                    if (!cancelled) {
                        setIsLoading(false);
                        setIsCommentsLoading(false);
                    }
                    return;
                }

                if (itemData) {
                    // Update counts in itemData from resolved parallel queries
                    if (isNews && countsRes.data) {
                        itemData.up_votes_count = (countsRes.data as any[]).filter((v: any) => v.vote_type === 'up').length;
                        itemData.down_votes_count = (countsRes.data as any[]).filter((v: any) => v.vote_type === 'down').length;
                    } else if (!isNews && countsRes.count !== null) {
                        itemData.likes_count = countsRes.count;
                    }
                    if (commentCountRes.count !== null) {
                        itemData.comments_count = commentCountRes.count;
                    }
                    if (repostsRes.data) {
                        itemData.reposts_count = repostsRes.data.length;
                    }

                    // Mapper definition for post formatting
                    const mapper = (p: any, type: 'post' | 'news', commentsList: any[]) => {
                        const name = p.author?.name || 'Usuario';
                        const lastName = p.author?.last_name || p.author?.lastName || p.author?.surname || p.author?.apellidos || '';
                        const rawName = (lastName.length > 0 && name.toLowerCase().includes(lastName.toLowerCase())) ? name : `${name} ${lastName}`.trim();
                        const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str || '');
                        const username = p.author?.username;
                        const safeUsername = (username && !isUUID(username)) ? username : (isUUID(rawName) ? '' : (rawName.toLowerCase().replace(/\s/g, '') || ''));

                        return {
                            id: p.id,
                            authorId: p.author_id,
                            authorName: rawName,
                            authorUsername: safeUsername,
                            authorPosition: p.author?.position,
                            authorAvatar: getSafeAvatar(p.author?.avatar),
                            title: p.titulo,
                            content: p.content,
                            imageUrl: p.image_url || [],
                            docUrl: p.doc_url,
                            docName: p.doc_name,
                            timestamp: p.created_at,
                            type: type,
                            tags: p.tags || [],
                            likes: p.likes_count || 0,
                            upvotes: p.up_votes_count ?? 0,
                            downvotes: p.down_votes_count ?? 0,
                            comments: p.comments_count || 0,
                            reposts: p.reposts_count || 0,
                            commentsList: commentsList,
                            userLiked: likedIds.has(p.id) || votedUpIds.has(p.id),
                            userDownvoted: votedDownIds.has(p.id),
                            userReposted: repostedIds.has(p.id),
                            isPinned: p.is_pinned,
                            pinnedAt: p.pinned_at,
                            linkedEventId: p.event_id,
                            linkedEvent: p.linked_event,
                            showLinkPreview: p.show_link_preview !== false,
                            linkPreviewUrl: p.link_preview_url ?? null,
                            authorIsOrganization: !!(p.author?.is_organization || p.author?.isOrganization)
                        };
                    };

                    // Instantly set the post so the main card is fully visible!
                    if (!cancelled) {
                        setLocalPost(mapper(itemData, isNews ? 'news' : 'post', []));
                        setIsLoading(false); // Spinner for post disappears instantly!
                    }

                    // Now load comments & replies in the background!
                    const { data: commentsData, error: commentsError } = await supabase
                        .from(isNews ? 'news_comments' : 'post_comments')
                        .select('id, author_id, text, created_at, likes, author:profiles!author_id(id, name, last_name, username, avatar)')
                        .eq(isNews ? 'news_id' : 'post_id', postId);

                    if (commentsError) console.error('Error fetching comments:', commentsError);

                    const commentIds = commentsData?.map(c => c.id) || [];

                    // Fetch replies in parallel with comment/reply likes to be super fast!
                    const [repliesRes, commentsLikesRes] = await Promise.all([
                        (commentIds.length > 0
                            ? supabase.from('comment_replies').select('id, comment_id, parent_reply_id, author_id, text, created_at, likes, author:profiles!author_id(id, name, last_name, username, avatar)').in('comment_id', commentIds)
                            : Promise.resolve({ data: [] as any[] })) as any,
                        (commentIds.length > 0
                            ? supabase.from('comment_likes').select('comment_id').eq('user_id', user.id).in('comment_id', commentIds)
                            : Promise.resolve({ data: [] as any[] })) as any,
                    ]);

                    const repliesData = repliesRes.data || [];
                    const replyIds = repliesData.map((r: any) => r.id) || [];

                    // Fetch reply likes
                    const replyLikesRes = replyIds.length > 0
                        ? await supabase.from('comment_likes').select('reply_id').eq('user_id', user.id).in('reply_id', replyIds)
                        : { data: [] };

                    const likedCommentIds = new Set((commentsLikesRes.data || []).map((l: any) => l.comment_id).filter(Boolean));
                    const likedReplyIds = new Set((replyLikesRes.data || []).map((l: any) => l.reply_id).filter(Boolean));

                    const commentsMap = new Map<string, any[]>();
                    const repliesMap = new Map<string, any[]>();

                    // Build a flat map of all reply objects by id first
                    const replyById = new Map<string, any>();
                    repliesData?.forEach(r => {
                        const rAuthor: any = Array.isArray(r.author) ? r.author[0] : r.author;
                        const name = rAuthor?.name || 'Usuario';
                        const lastName = rAuthor?.last_name || '';
                        const replyObj = {
                            id: r.id,
                            commentId: r.comment_id,
                            parentReplyId: r.parent_reply_id,
                            authorId: r.author_id,
                            authorName: `${name} ${lastName}`.trim(),
                            authorUsername: rAuthor?.username,
                            authorAvatar: getSafeAvatar(rAuthor?.avatar),
                            text: r.text,
                            timestamp: r.created_at,
                            likes: r.likes || 0,
                            userLiked: likedReplyIds.has(r.id),
                            replies: [] as any[]
                        };
                        replyById.set(r.id, replyObj);
                    });

                    // Now wire up the tree: attach child replies to their parent
                    replyById.forEach((replyObj, _id) => {
                        if (replyObj.parentReplyId) {
                            const parent = replyById.get(replyObj.parentReplyId);
                            if (parent) {
                                parent.replies.push(replyObj);
                            } else {
                                const list = repliesMap.get(replyObj.commentId) || [];
                                list.push(replyObj);
                                repliesMap.set(replyObj.commentId, list);
                            }
                        } else {
                            const list = repliesMap.get(replyObj.commentId) || [];
                            list.push(replyObj);
                            repliesMap.set(replyObj.commentId, list);
                        }
                    });

                    commentsData?.forEach(c => {
                        const cAuthor: any = Array.isArray(c.author) ? c.author[0] : c.author;
                        const name = cAuthor?.name || 'Usuario';
                        const lastName = cAuthor?.last_name || '';
                        const list = commentsMap.get(postId) || [];
                        list.push({
                            id: c.id,
                            authorId: c.author_id,
                            authorName: `${name} ${lastName}`.trim(),
                            authorUsername: cAuthor?.username,
                            authorAvatar: getSafeAvatar(cAuthor?.avatar),
                            text: c.text,
                            timestamp: c.created_at,
                            likes: c.likes || 0,
                            userLiked: likedCommentIds.has(c.id),
                            replies: repliesMap.get(c.id) || []
                        });
                        const uniqueComments = Array.from(new Set(list.map(c => c.id)))
                            .map(id => list.find(c => c.id === id))
                            .filter(Boolean);
                        commentsMap.set(postId, uniqueComments);
                    });

                    if (!cancelled) {
                        // Auto-expand all comments that have replies
                        if (repliesMap.size > 0) {
                            const initialExpanded: Record<string, boolean> = {};
                            repliesMap.forEach((_, commentId) => { initialExpanded[commentId] = true; });
                            setExpandedReplies(initialExpanded);
                        }
                        setLocalPost(prev => {
                            if (!prev) return prev;
                            return {
                                ...prev,
                                commentsList: commentsMap.get(postId) || []
                            };
                        });
                    }
                }
            } catch (err) {
                console.error("Error fetching local post in PostDetailView:", err);
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                    setIsCommentsLoading(false);
                }
            }
        };

        fetchPost();
        return () => { cancelled = true; };
    }, [postId, isNews]);

    const mentionSuggestions = useMemo(() => {
        if (mentionQuery === null) return [];
        return getMentionSuggestions(mentionQuery, users);
    }, [mentionQuery, users]);

    // Must be before the conditional return to avoid Rules of Hooks violation
    const externalUrls = useMemo(() => {
        return extractAllExternalUrls(post?.content ?? '', isExternalUrl);
    }, [post?.content]);

    if (!post && isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#111] rounded-3xl border border-dashed border-slate-200 dark:border-zinc-800">
                <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
                <p className="text-slate-400 font-bold tracking-tight">Cargando publicación...</p>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#111] rounded-3xl border border-dashed border-slate-200 dark:border-zinc-800">
                <p className="text-slate-400 font-bold tracking-tight mb-4">Publicación no encontrada</p>
                <button
                    onClick={() => navigate(-1)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all"
                >
                    ← Volver
                </button>
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
        const newComment: Comment = {
            id: `temp-${Date.now()}`,
            authorId: user.id,
            authorName: `${user.name} ${user.lastName || ''}`.trim(),
            authorUsername: user.username,
            authorAvatar: getSafeAvatar(user.avatar),
            text: text.trim(),
            timestamp: new Date().toISOString(),
            likes: 0,
            userLiked: false,
            replies: [],
        };
        setLocalPost(prev => prev ? { ...prev, commentsList: [...(prev.commentsList || []), newComment] } : prev);
        onAddComment(post.id, text);
        setMentionQuery(null);
        setText('');
    };

    const handleReplySubmit = async (e: React.FormEvent, commentId: string) => {
        e.preventDefault();
        if (!replyText.trim() || !onAddReply) {
            console.warn("🚫 Cannot submit reply:", { textEmpty: !replyText.trim(), onAddReplyMissing: !onAddReply });
            return;
        }
        const tempId = `temp-${Date.now()}`;
        const newReply: CommentReply = {
            id: tempId,
            commentId,
            parentReplyId: replyingToParentReplyId,
            authorId: user.id,
            authorName: `${user.name} ${user.lastName || ''}`.trim(),
            authorUsername: user.username,
            authorAvatar: getSafeAvatar(user.avatar),
            text: replyText.trim(),
            timestamp: new Date().toISOString(),
            likes: 0,
            userLiked: false,
            replies: [],
        };
        setLocalPost(prev => {
            if (!prev) return prev;
            const addReplyToTree = (replies: CommentReply[]): CommentReply[] =>
                replies.map(r => {
                    if (r.id === replyingToParentReplyId) {
                        return { ...r, replies: [...(r.replies || []), newReply] };
                    }
                    if (r.replies && r.replies.length > 0) {
                        return { ...r, replies: addReplyToTree(r.replies) };
                    }
                    return r;
                });
            return {
                ...prev,
                commentsList: (prev.commentsList || []).map(c => {
                    if (c.id !== commentId) return c;
                    if (!replyingToParentReplyId) {
                        // Direct reply to comment
                        return { ...c, replies: [...(c.replies || []), newReply] };
                    }
                    // Reply to a reply — find it in the tree
                    return { ...c, replies: addReplyToTree(c.replies || []) };
                })
            };
        });
        // Auto-expand so the new reply is visible
        if (replyingToParentReplyId) {
            setExpandedReplies(prev => ({ ...prev, [replyingToParentReplyId]: true }));
        } else {
            setExpandedReplies(prev => ({ ...prev, [commentId]: true }));
        }
        const savedParentReplyId = replyingToParentReplyId;
        if (commentId.startsWith('temp-') || savedParentReplyId?.startsWith('temp-')) {
            alert('Espera a que el comentario o respuesta anterior se guarde antes de responder.');
            return;
        }
        setMentionQuery(null);
        setReplyText('');
        setReplyingTo(null);
        setReplyingToParentReplyId(undefined);
        const realId = await onAddReply(commentId, newReply.text, savedParentReplyId);
        if (realId) {
            setLocalPost(prev => {
                if (!prev) return prev;
                const replaceId = (replies: CommentReply[]): CommentReply[] =>
                    replies.map(r => {
                        if (r.id === tempId) return { ...r, id: realId };
                        if (r.replies && r.replies.length > 0) return { ...r, replies: replaceId(r.replies) };
                        return r;
                    });
                return {
                    ...prev,
                    commentsList: (prev.commentsList || []).map(c => ({
                        ...c,
                        replies: replaceId(c.replies || [])
                    }))
                };
            });
        }
    };

    const toggleReplies = (commentId: string) => {
        setExpandedReplies(prev => ({ ...prev, [commentId]: !prev[commentId] }));
    };

    const countAllComments = (comments: Comment[]): number => {
        const countReplies = (replies: CommentReply[]): number =>
            replies.reduce((acc, r) => acc + 1 + countReplies(r.replies || []), 0);
        return comments.reduce((acc, c) => acc + 1 + countReplies(c.replies || []), 0);
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
            } else if (trimmedPart.startsWith('@') && trimmedPart.length > 1) {
                const mentionedUser = getUserByMention(trimmedPart, users);
                return (
                    <button key={i} onClick={(e) => { e.stopPropagation(); if (mentionedUser) { onNavigateToProfile?.(mentionedUser.id); } }} className="text-purple-600 dark:text-purple-400 font-bold hover:underline">
                        {part}
                    </button>
                );
            } else if (part.startsWith('http')) {
                const profileEventMatch = part.match(/(?:\/u\/|\/@)([^\/]+)\/(?:e|evento)\/([^\/\?\s]+)/);
                if (profileEventMatch && onNavigateToEvent) {
                    const [, identifier, eventId] = profileEventMatch;
                    const cleanIdentifier = identifier.startsWith('@') ? identifier.slice(1) : identifier;
                    const eventOwner = users.find(u => u.username === cleanIdentifier || u.id === cleanIdentifier);
                    const foundEvent = (window as any).globalEvents?.find((ev: any) => ev.id === eventId);
                    const label = foundEvent ? foundEvent.title : (eventOwner ? t('view_event_of', { name: eventOwner.name }) : t('view_event'));
                    return (
                        <button
                            key={i}
                            onClick={(e) => {
                                e.stopPropagation();
                                onNavigateToEvent(cleanIdentifier, eventId);
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
                                navigate('/calendario');
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

        const maxDepth = 3; // Limit nesting depth for UI
        const currentPadding = Math.min(depth * 1.5, maxDepth * 1.5); // Max 4.5rem padding

        return (
            <div className={`mt-4 space-y-4 ${depth > 0 ? `ml-${currentPadding * 4} border-l-2 border-slate-50 dark:border-zinc-900 pl-6` : ''}`}>
                {sortComments(replies).map(reply => (
                    <div key={reply.id} className="animate-in fade-in slide-in-from-left-2 duration-500">
                        <div className="flex space-x-4 group/reply">
                            <img
                                src={getSafeAvatar(reply.authorAvatar)}
                                className="w-8 h-8 rounded-lg object-cover ring-2 ring-slate-50 dark:ring-zinc-800 cursor-pointer"
                                alt=""
                                onClick={() => onNavigateToProfile?.(reply.authorId)}
                            />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span
                                        className="text-sm font-bold text-slate-800 dark:text-white cursor-pointer hover:text-blue-600 transition-colors"
                                        onClick={() => onNavigateToProfile?.(reply.authorId)}
                                    >
                                        {reply.authorName}
                                    </span>
                                    {reply.authorUsername && (
                                        <span className="text-[11px] text-purple-500 font-medium">@{reply.authorUsername}</span>
                                    )}
                                    <span className="text-[11px] text-slate-400 font-bold tracking-tighter ml-auto">{timeAgo(reply.timestamp, language)}</span>
                                </div>
                                <div className="text-xs md:text-sm text-slate-600 dark:text-gray-400 font-medium bg-white dark:bg-zinc-900/30 p-4 rounded-2xl rounded-tl-none border border-slate-50 dark:border-zinc-800 shadow-sm">
                                    {renderContentWithHashtags(reply.text)}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    {depth < maxDepth && (
                                        <button
                                            onClick={() => {
                                                setReplyingTo(commentId);
                                                setReplyingToParentReplyId(reply.id);
                                                setReplyText(`@${reply.authorUsername || 'usuario'} `);
                                                setTimeout(() => replyInputRef.current?.focus(), 100);
                                            }}
                                            className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-2 px-2"
                                        >
                                            <Reply size={14} /><span>Responder</span>
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleLikeReplyLocal(reply.id)}
                                        disabled={reply.id.startsWith('temp-')}
                                        className={`text-[10px] font-black uppercase flex items-center space-x-2 px-2 transition-colors ${reply.userLiked ? 'text-red-500' : 'text-slate-400'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        <Heart size={14} fill={reply.userLiked ? "currentColor" : "none"} />
                                        <span className="text-[9px] font-black">{reply.likes || 0}</span>
                                    </button>
                                    {reply.replies && reply.replies.length > 0 && (
                                        <button
                                            onClick={() => setExpandedReplies(prev => ({ ...prev, [reply.id]: !prev[reply.id] }))}
                                            className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400 hover:underline flex items-center space-x-1 px-2"
                                        >
                                            <span>{expandedReplies[reply.id] ? 'Ocultar respuestas' : 'Ver respuestas'}</span>
                                        </button>
                                    )}
                                </div>

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
                                            <button type="submit" disabled={!replyText.trim()} className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all">
                                                <Send size={16} />
                                            </button>
                                        </form>
                                        {mentionTarget === 'reply' && mentionQuery !== null && (
                                            <div className="absolute left-0 top-full mt-2 w-64 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-slate-100 dark:border-zinc-800 z-[10] overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-2">
                                                {mentionSuggestions.length > 0 ? mentionSuggestions.map(u => (
                                                    <button key={u.id} type="button" onClick={() => selectMention(u)} className="w-full flex items-center space-x-4 px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-left border-b border-slate-50 dark:border-zinc-900 last:border-0">
                                                        <img src={getSafeAvatar(u.avatar)} className="w-8 h-8 rounded-lg object-cover" alt="" />
                                                        <div className="min-w-0"><p className="text-xs font-black text-gray-900 dark:text-white truncate">{u.name}</p><p className="text-[10px] text-purple-600 font-bold">@{u.username}</p></div>
                                                    </button>
                                                )) : (
                                                    <div className="px-4 py-3 text-[10px] text-gray-400 italic">No hay resultados</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {reply.replies && reply.replies.length > 0 && expandedReplies[reply.id] && (
                                    renderRepliesList(reply.replies, commentId, depth + 1)
                                )}
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
            <div className="mb-8">
                {post.imageUrl.length === 1 && (
                    <div className="block w-fit mx-auto max-w-full rounded-[2rem] overflow-hidden border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50">
                        <img
                            src={post.imageUrl[0]}
                            className="max-h-[420px] max-w-full h-auto w-auto transition-all hover:scale-[1.01] cursor-zoom-in"
                            alt=""
                            onClick={() => { setCurrentImgIndex(0); setIsLightboxOpen(true); }}
                        />
                    </div>
                )}

                {post.imageUrl.length === 2 && (
                    <div className="grid grid-cols-2 gap-2 w-full max-h-[420px] aspect-[2/1] rounded-[2rem] overflow-hidden border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50">
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
                    <div className="grid grid-cols-2 grid-rows-2 gap-2 w-full max-h-[420px] aspect-[2/1] rounded-[2rem] overflow-hidden border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50">
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
                    <div className="grid grid-cols-2 grid-rows-2 gap-2 w-full max-h-[420px] aspect-[2/1] rounded-[2rem] overflow-hidden border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50">
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

    return (
        <div className="pt-16 md:pt-0 min-h-screen">
            {/* Header Sticky — full width, no side margin */}
            <div
                className="sticky top-16 md:top-0 z-40 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md border-b border-gray-100 dark:border-zinc-900 px-8 py-3 transition-all"
            >
                <div className="max-w-4xl mx-auto w-full flex items-center space-x-2">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center justify-center text-slate-500 hover:text-blue-600 transition-colors p-2 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-xl"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div
                        className="flex-1 cursor-pointer group flex items-center gap-2 h-full"
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    >
                        <h1 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                            {post.type === 'news' ? 'Noticia' : 'Post'}
                        </h1>
                    </div>
                </div>
            </div>

            {/* Contenido con margen lateral */}
            <div className="px-3 sm:px-4 md:px-6">
            <div className="max-w-4xl mx-auto bg-white dark:bg-[#111] border-x border-slate-100 dark:border-zinc-900">
            <div className="bg-white dark:bg-[#111] min-h-screen">
                <div className="px-8 py-5">
                    <div className="flex items-center space-x-3 mb-4">
                        <img
                            src={getSafeAvatar(post.authorAvatar)}
                            className="w-10 h-10 rounded-xl object-cover cursor-pointer hover:ring-4 hover:ring-blue-50 dark:hover:ring-blue-900/20 transition-all"
                            alt=""
                            onClick={() => onNavigateToProfile?.(post.authorId)}
                        />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                                <div className="cursor-pointer group flex-1 min-w-0" onClick={() => onNavigateToProfile?.(post.authorId)}>
                                    <h4 className="font-black text-slate-900 dark:text-white text-sm group-hover:text-blue-600 transition-colors whitespace-nowrap overflow-visible">
                                        {post.authorName}
                                    </h4>
                                    {!post.authorIsOrganization && !users.find(u => u.id === post.authorId)?.isOrganization && <p className={`text-[10px] font-bold uppercase tracking-wider ${post.type === 'news' ? 'text-orange-500' : 'text-blue-500'}`}>{post.authorPosition}</p>}
                                </div>
                                <div className="flex flex-col items-end">
                                    <p className="text-[11px] text-gray-400 font-bold mb-2">{timeAgo(post.timestamp, language)}</p>
                                    {post.authorId === user.id && onDeletePost && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsDeleteModalOpen(true);
                                            }}
                                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                                            title="Eliminar post"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {post.type === 'news' && post.title && (
                        <h2 className="text-lg font-black text-slate-900 dark:text-white mb-3 leading-tight">
                            {post.title}
                        </h2>
                    )}

                    {post.type === 'news' && renderImages()}

                    <div className="text-gray-800 dark:text-gray-200 leading-relaxed text-sm font-medium mb-4 whitespace-pre-wrap">
                        {renderContentWithHashtags(post.content)}
                    </div>

                    {post.linkedEvent && (
                        <EventPreview
                            event={post.linkedEvent}
                            language={language}
                            onNavigateToEvent={onNavigateToEvent}
                            onNavigateToProfile={onNavigateToProfile}
                        />
                    )}

                    {post.showLinkPreview !== false && (!post.imageUrl || post.imageUrl.length === 0) && (() => {
                        const chosen = post.linkPreviewUrl && externalUrls.includes(post.linkPreviewUrl) ? post.linkPreviewUrl : externalUrls[0];
                        return chosen ? (
                            <div className="mt-4 mb-6">
                                <LinkPreview url={chosen} language={language} />
                            </div>
                        ) : null;
                    })()}

                    {post.type !== 'news' && renderImages()}

                    <div className="flex items-center justify-between py-3 border-y border-slate-50 dark:border-zinc-900 mb-4 text-slate-500">
                        {post.type === 'post' ? (
                            <>
                                <button onClick={handleLikeLocal} className={`flex items-center space-x-2 transition-all ${post.userLiked ? 'text-pink-500' : 'text-slate-500'}`}>
                                    <Heart
                                        size={18}
                                        className={post.userLiked ? 'text-pink-500' : 'text-slate-500'}
                                        fill={post.userLiked ? "currentColor" : "none"}
                                    />
                                    <span className="font-black text-sm">{post.likes}</span>
                                </button>
                                <div className="flex items-center space-x-2 text-slate-500">
                                    <MessageSquare size={18} />
                                    <span className="font-black text-sm">{countAllComments(post.commentsList ?? [])}</span>
                                </div>
                                <button
                                    onClick={handleRepostLocal}
                                    className={`flex items-center space-x-2 transition-all ${post.userReposted ? 'text-emerald-500' : 'text-slate-500'}`}
                                    title="Republicar"
                                >
                                    <Repeat
                                        size={18}
                                        className={post.userReposted ? "text-emerald-500" : "text-slate-500"}
                                    />
                                    <span className="font-black text-sm">{post.reposts || 0}</span>
                                </button>
                                <button
                                    onClick={() => setSharingPost(post)}
                                    className="p-1 text-slate-500 hover:text-blue-500 transition-all"
                                    title="Compartir por chat"
                                >
                                    <Share2 size={18} />
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center space-x-4 ml-1">
                                    <button
                                        className="flex items-center space-x-2 text-slate-500 hover:text-blue-500 transition-colors"
                                        onClick={() => mainInputRef.current?.focus()}
                                    >
                                        <MessageSquare size={18} />
                                        <span className="text-sm font-black">{countAllComments(post.commentsList ?? [])}</span>
                                    </button>
                                    <button
                                        onClick={() => setSharingPost(post)}
                                        className="p-1 text-slate-500 hover:text-blue-500 transition-all"
                                        title="Compartir por chat"
                                    >
                                        <Share2 size={18} />
                                    </button>
                                </div>
                                <div className="flex items-center bg-slate-50 dark:bg-zinc-900 p-1 rounded-xl border border-slate-100 dark:border-zinc-800">
                                    <button
                                        onClick={() => handleVoteLocal('up')}
                                        className={`p-1.5 rounded-lg transition-all ${post.userLiked ? 'bg-emerald-500 text-white' : 'hover:bg-slate-100 dark:hover:bg-zinc-800 text-emerald-500'}`}
                                    >
                                        <ChevronUp size={16} strokeWidth={3} />
                                    </button>
                                    <span className={`px-3 font-black text-sm min-w-[2.5rem] text-center ${post.userLiked ? 'text-emerald-500' : post.userDownvoted ? 'text-red-500' : 'text-slate-500'}`}>
                                        {post.upvotes ?? post.likes ?? 0}
                                    </span>
                                    <button
                                        onClick={() => handleVoteLocal('down')}
                                        className={`p-1.5 rounded-lg transition-all ${post.userDownvoted ? 'bg-red-500 text-white' : 'hover:bg-slate-100 dark:hover:bg-zinc-800 text-red-500'}`}
                                    >
                                        <ChevronDown size={16} strokeWidth={3} />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {sharingPost && (
                        <ShareModal
                            isOpen={sharingPost !== null}
                            onClose={() => setSharingPost(null)}
                            onShare={onShareViaChat}
                            post={sharingPost}
                            chats={chats}
                            language={language}
                            currentUser={user}
                            users={users}
                            followedUserIds={followedUserIds}
                            followerUserIds={followerUserIds}
                        />
                    )}

                    <div className="py-3 border-b border-slate-50 dark:border-zinc-900 bg-white dark:bg-[#111]">
                        <form onSubmit={handleSubmit} className="flex items-center space-x-3 bg-slate-50 dark:bg-zinc-900/50 rounded-2xl p-2 border border-slate-100 dark:border-zinc-800 shadow-sm">
                            <input
                                ref={mainInputRef}
                                type="text"
                                value={text}
                                onChange={(e) => handleInputChange(e.target.value, 'main')}
                                onKeyDown={(e) => { if (e.key === 'Escape') setMentionQuery(null); }}
                                placeholder="Escribe tu aportación aquí..."
                                className="flex-1 bg-transparent border-none px-3 py-1.5 text-sm font-medium outline-none focus:ring-0 dark:text-white"
                            />
                            <button type="submit" disabled={!text.trim()} className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center">
                                <Send size={16} />
                            </button>
                        </form>
                        {mentionTarget === 'main' && mentionQuery !== null && (
                            <div className="absolute left-10 md:left-14 mt-4 w-72 bg-white dark:bg-[#1a1a1a] rounded-3xl border border-gray-100 dark:border-zinc-800 z-[20] overflow-hidden animate-in slide-in-from-top-4 shadow-2xl">
                                <div className="p-4 border-b border-slate-50 dark:border-zinc-900 bg-slate-50/50 dark:bg-zinc-900/50">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mencionar a...</p>
                                </div>
                                {mentionSuggestions.length > 0 ? mentionSuggestions.map(u => (
                                    <button key={u.id} type="button" onClick={() => selectMention(u)} className="w-full flex items-center space-x-4 px-5 py-4 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-left border-b border-slate-50 dark:border-zinc-900 last:border-0 transition-colors">
                                        <img src={getSafeAvatar(u.avatar)} className="w-10 h-10 rounded-xl object-cover" alt="" />
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

                    <div className="mt-4 pt-2">
                        <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 pb-4 border-b border-slate-100 dark:border-zinc-800 px-2">
                            Comentarios ({isCommentsLoading ? (post.comments || 0) : countAllComments(post.commentsList ?? [])})
                        </h5>
                        <div className="space-y-4 pr-1 max-h-[500px] overflow-y-auto scrollbar-modal">
                            {isCommentsLoading ? (
                                <div className="flex flex-col items-center justify-center py-10 bg-slate-50/50 dark:bg-zinc-900/10 rounded-2xl border border-dashed border-slate-100 dark:border-zinc-800/80">
                                    <Loader2 className="animate-spin text-blue-600 mb-3" size={24} />
                                    <p className="text-slate-400 text-xs font-bold tracking-tight">Cargando comentarios...</p>
                                </div>
                            ) : (
                                sortComments(post.commentsList ?? []).slice(0, visibleCommentsCount).map((comment) => (
                                <div key={comment.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex space-x-3">
                                        <img
                                            src={getSafeAvatar(comment.authorAvatar)}
                                            className="w-8 h-8 rounded-xl object-cover cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                                            alt=""
                                            onClick={() => onNavigateToProfile?.(comment.authorId)}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center space-x-2">
                                                    <span
                                                        className="font-bold text-slate-900 dark:text-white cursor-pointer hover:text-blue-600 transition-colors"
                                                        onClick={() => onNavigateToProfile?.(comment.authorId)}
                                                    >
                                                        {comment.authorName}
                                                    </span>
                                                    {comment.authorUsername && (
                                                        <span className={`text-xs font-medium ${post.type === 'news' ? 'text-orange-500' : 'text-purple-500'}`}>
                                                            @{comment.authorUsername}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-[11px] text-slate-400 font-bold tracking-tighter">{timeAgo(comment.timestamp, language)}</span>
                                            </div>
                                            <div className="text-sm md:text-base text-slate-700 dark:text-gray-300 font-medium bg-slate-50 dark:bg-zinc-900 p-5 rounded-3xl rounded-tl-none border border-slate-100 dark:border-zinc-800 mb-3 shadow-sm">
                                                {renderContentWithHashtags(comment.text)}
                                            </div>
                                            <div className="flex items-center space-x-6 px-2">
                                                <button
                                                    onClick={() => { setReplyingTo(comment.id); setReplyingToParentReplyId(undefined); setReplyText(`@${comment.authorUsername || 'usuario'} `); setTimeout(() => replyInputRef.current?.focus(), 100); }}
                                                    className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-2"
                                                >
                                                    <Reply size={14} /><span>Responder</span>
                                                </button>

                                                {comment.replies && comment.replies.length > 0 && (
                                                    <button
                                                        onClick={() => toggleReplies(comment.id)}
                                                        className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400 hover:underline flex items-center space-x-1"
                                                    >
                                                        {expandedReplies[comment.id] ? 'Ocultar respuestas' : 'Ver respuestas'}
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => handleLikeCommentLocal(comment.id)}
                                                    className={`text-[10px] font-black uppercase flex items-center space-x-2 transition-colors ${comment.userLiked ? 'text-red-500' : 'text-slate-400'}`}
                                                >
                                                    <Heart size={14} fill={comment.userLiked ? "currentColor" : "none"} />
                                                    <span className="text-[9px] font-black">{comment.likes || 0}</span>
                                                </button>
                                            </div>

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
                                                        <button type="submit" disabled={!replyText.trim()} className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all">
                                                            <Send size={16} />
                                                        </button>
                                                    </form>
                                                    {mentionTarget === 'reply' && mentionQuery !== null && (
                                                        <div className="absolute left-0 top-full mt-2 w-72 bg-white dark:bg-[#1a1a1a] rounded-3xl border border-blue-100 dark:border-blue-900/30 z-[10] overflow-hidden shadow-2xl animate-in slide-in-from-top-4">
                                                            {mentionSuggestions.length > 0 ? mentionSuggestions.map(u => (
                                                                <button key={u.id} type="button" onClick={() => selectMention(u)} className="w-full flex items-center space-x-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-zinc-900/50 text-left border-b border-slate-50 dark:border-zinc-900 last:border-0">
                                                                    <img src={getSafeAvatar(u.avatar)} className="w-10 h-10 rounded-xl object-cover shadow-sm" alt="" />
                                                                    <div className="min-w-0"><p className="text-sm font-black text-slate-800 dark:text-white truncate">{u.name}</p><p className="text-xs text-purple-600 font-bold">@{u.username}</p></div>
                                                                </button>
                                                            )) : (
                                                                <div className="px-5 py-4 text-xs font-medium text-slate-400 italic">No hay resultados</div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Recursively render replies */}
                                            {comment.replies && comment.replies.length > 0 && expandedReplies[comment.id] && (
                                                <div className="mt-4 ml-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                                    {renderRepliesList(comment.replies, comment.id, 0)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )))}
                            {visibleCommentsCount < (post.commentsList?.length ?? 0) && (
                                <div className="flex justify-center mt-6 pb-2">
                                    <button
                                        onClick={() => setVisibleCommentsCount(prev => prev + 10)}
                                        className="px-6 py-2.5 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-2xl font-bold text-sm hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                                    >
                                        Cargar más comentarios
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
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
        </div>
        </div>
    );
};
