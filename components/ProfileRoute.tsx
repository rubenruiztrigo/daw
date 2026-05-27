import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProfileView } from './ProfileView';
import { User, Post, Chat, CalendarEvent, Notification } from '../types';
import { Language } from '../utils/translations';
import { supabase } from '../supabaseClient';
import { Loader2, User as UserIcon } from 'lucide-react';
import { getSafeAvatar } from '../utils/avatarUtils';

interface ProfileRouteProps {
    users: User[];
    currentUserData: User | null;
    posts: Post[];
    chats: Chat[];
    followerUserIds: Set<string>;
    followedUserIds: Set<string>;
    onUpdateUser: (updatedUser: User) => void;
    onRepost: (id: string) => void;
    onToggleFollow: (userId: string) => void;
    onDeletePost: (id: string) => void;
    onNavigateToEvent: (userId: string, eventId: string) => void;
    onStartChat: (user: User) => void;
    onAddPost: (content: string, type: 'post' | 'news', tags: string[], imageUrls?: string[], docUrl?: string, docName?: string, eventId?: string, title?: string) => Promise<void>;
    onPromoteEvent: (ev: CalendarEvent) => void;
    onShareViaChat: (recipientId: string, text: string, postId?: string, sharedProfileId?: string, sharedEventId?: string, imageUrls?: string[], newsId?: string, scheduledAt?: Date) => Promise<void>;
    focusedEventId: string | null;
    onClearFocusedEvent: () => void;
    onSearchHashtag: (tag: string) => void;
    onNavigateToPost: (postId: string) => void;
    onNavigateToProfile: (userId: string) => void;
    onLike: (id: string) => void;
    onVote: (id: string, dir: 'up' | 'down') => void;
    onAddComment: (postId: string, text: string) => void;
    onAddReply: (commentId: string, text: string, parentReplyId?: string) => void;
    onLikeComment?: (commentId: string) => void;
    onLikeReply?: (replyId: string) => void;
    onVoteComment: (commentId: string) => void;
    onPreviewImage?: (url: string) => void;
    globalEvents?: any[];
    language: Language;
    pinnedPosts?: Set<string>;
    onTogglePin?: (postId: string) => void;
    onSupportEvent?: (event: CalendarEvent) => void;
    targetEventId: string | null;
    onClearTargetEvent: () => void;
    likedIds?: Set<string>;
    votedUpIds?: Set<string>;
    votedDownIds?: Set<string>;
    repostedIds?: Set<string>;
    onLoadMore?: (authorId: string) => void;
    hasMore?: boolean;
    isLoadingMore?: boolean;
    hasMoreNews?: boolean;
    isLoadingMoreNews?: boolean;
    isLoadingProfileFeed?: boolean;
    onFetchProfileContent?: (authorId: string) => void;
}

export const ProfileRoute: React.FC<ProfileRouteProps> = ({
    users,
    currentUserData,
    posts,
    chats,
    followerUserIds,
    followedUserIds,
    onUpdateUser,
    onRepost,
    onToggleFollow,
    onDeletePost,
    onNavigateToEvent,
    onStartChat,
    onAddPost,
    onPromoteEvent,
    onShareViaChat,
    focusedEventId,
    onClearFocusedEvent,
    onSearchHashtag,
    onNavigateToPost,
    onNavigateToProfile,
    onLike,
    onVote,
    onAddComment,
    onAddReply,
    onLikeComment,
    onLikeReply,
    onVoteComment,
    onPreviewImage,
    globalEvents = [],
    language,
    pinnedPosts = new Set(),
    onTogglePin,
    onSupportEvent,
    targetEventId,
    onClearTargetEvent,
    likedIds = new Set(),
    votedUpIds = new Set(),
    votedDownIds = new Set(),
    repostedIds = new Set(),
    onFetchProfileContent,
    onLoadMore,
    hasMore = false,
    isLoadingMore = false,
    hasMoreNews = false,
    isLoadingMoreNews = false,
    isLoadingProfileFeed = false
}) => {
    const { identifier, eventId } = useParams<{ identifier: string; eventId?: string }>();
    const navigate = useNavigate();
    // Sanitize identifier (remove @ if present)
    const cleanIdentifier = identifier?.startsWith('@') ? identifier.slice(1) : identifier;

    // 1. Try to find in local state: prioritize currentUserData, then the general users array
    const localUser = useMemo(() => {
        if (!cleanIdentifier) return currentUserData;
        const lowId = cleanIdentifier.toLowerCase();
        if (currentUserData?.username?.toLowerCase() === lowId || currentUserData?.id === cleanIdentifier) {
            return currentUserData;
        }
        return users.find(u => u.username?.toLowerCase() === lowId || u.id === cleanIdentifier) || null;
    }, [users, currentUserData, cleanIdentifier]);

    const [fetchedUser, setFetchedUser] = useState<User | null>(() => {
        if (!cleanIdentifier) return null;
        try {
            const key = `profile_cache_${cleanIdentifier.toLowerCase()}`;
            const r = localStorage.getItem(key);
            if (r) return JSON.parse(r);
        } catch {}
        return null;
    });

    const [loading, setLoading] = useState(() => {
        const hasLocal = localUser && localUser.username?.toLowerCase() === cleanIdentifier?.toLowerCase();
        return !hasLocal && !!cleanIdentifier;
    });

    // Reset loading state when identifier changes and we don't have a local match
    const [lastIdentifier, setLastIdentifier] = useState(cleanIdentifier);
    if (cleanIdentifier !== lastIdentifier) {
        setLastIdentifier(cleanIdentifier);
        const hasLocal = localUser && localUser.username?.toLowerCase() === cleanIdentifier?.toLowerCase();
        if (!hasLocal) {
            setLoading(true);
        }
    }

    const targetUser = localUser || fetchedUser;

    useEffect(() => {
        const fetchUser = async () => {
            // 1. If we have it locally and it matches, we are done.
            if (localUser && localUser.username?.toLowerCase() === cleanIdentifier?.toLowerCase()) {
                setFetchedUser(null);
                setLoading(false);
                return;
            }
            
            if (!cleanIdentifier) {
                setFetchedUser(null);
                setLoading(false);
                return;
            }

            // 2. Only show loader if we have absolutely no data for this user yet (no cache, no local match)
            const hasCachedData = !!(targetUser && targetUser.username?.toLowerCase() === cleanIdentifier.toLowerCase());
            if (!hasCachedData) {
                setLoading(true);
            }

            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanIdentifier || '');
            try {
                let query = supabase.from('profiles').select('id, name, last_name, username, position, institution, avatar, bio, interests, followers_count, following_count, country, region, created_at, updated_at, first_time, novas, is_admin, is_organization, administration_type, status, chat_settings, notification_settings, linked_organization_id, job_category, level_name, birth_date');
                
                if (isUUID) {
                    query = query.or(`username.eq.${cleanIdentifier},id.eq.${cleanIdentifier}`);
                } else {
                    query = query.eq('username', cleanIdentifier);
                }
                
                const { data, error } = await query.maybeSingle();

                if (error) {
                    console.error("Supabase error:", error.message);
                } else if (data) {
                    const formattedUser: User = {
                        id: data.id,
                        name: data.name,
                        lastName: data.last_name,
                        username: data.username,
                        position: data.position,
                        institution: data.institution,
                        avatar: getSafeAvatar(data.avatar),
                        bio: data.bio || '',
                        interests: data.interests || [],
                        followers: data.followers_count || 0,
                        following: data.following_count || 0,
                        joinedDate: data.created_at,
                        isOrganization: data.is_organization,
                        status: data.status,
                        jobCategory: data.job_category,
                        administrationType: data.administration_type,
                        country: data.country,
                        region: data.region,
                        level_name: data.level_name,
                        novas: data.novas,
                        birthDate: data.birth_date,
                        notificationSettings: data.notification_settings,
                        linkedOrganizationId: data.linked_organization_id || null
                    };
                    setFetchedUser(formattedUser);
                    try {
                        const key = `profile_cache_${data.username?.toLowerCase()}`;
                        localStorage.setItem(key, JSON.stringify(formattedUser));
                    } catch {}
                }
            } catch (err) {
                console.error("Unexpected fetch error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [cleanIdentifier, localUser]); // NOW it reacts if the local cache (users list) updates! 

    useEffect(() => {
        if (targetUser?.id && onFetchProfileContent) {
            onFetchProfileContent(targetUser.id);
        }
    }, [targetUser?.id, onFetchProfileContent]);

    // Redirection to username-based URL if common identifier is ID
    useEffect(() => {
        const user = localUser || fetchedUser;
        if (user && user.username && cleanIdentifier === user.id) {
            navigate(`/${user.username}${eventId ? `/${eventId}` : ''}`, { replace: true });
        }
    }, [localUser, fetchedUser, cleanIdentifier, navigate, eventId]);

    if (loading) {
        return (
            <div className="mx-3 sm:mx-4 rounded-[2rem] overflow-hidden min-h-[60vh] flex flex-col items-center justify-center space-y-4 bg-white dark:bg-[#0a0a0a]">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin flex-shrink-0" />
                <p className="text-slate-500 font-bold animate-pulse text-sm text-center px-4">Cargando perfil...</p>
            </div>
        );
    }

    if (!targetUser) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-10 bg-white dark:bg-[#0a0a0a]">
                <div className="w-20 h-20 bg-slate-50 dark:bg-zinc-900 rounded-[2rem] flex items-center justify-center mb-6">
                    <UserIcon className="text-slate-300 dark:text-zinc-700" size={32} />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">
                    {language === 'es' ? 'Usuario no encontrado' : 'User not found'}
                </h3>
                <p className="text-slate-500 dark:text-zinc-500 font-medium text-sm text-center max-w-xs mb-8">
                    El perfil que buscas no existe o el enlace es incorrecto.
                </p>
                <button
                    onClick={() => navigate('/inicio')}
                    className="px-8 py-4 bg-blue-600 text-white rounded-[1.5rem] font-black text-sm hover:bg-blue-700 transition-all transform active:scale-95 shadow-xl shadow-blue-500/20"
                >
                    Volver al Inicio
                </button>
            </div>
        );
    }

    const targetUserId = targetUser.id;
    const isCurrentUser = targetUserId === currentUserData?.id;
    const isFollowed = followedUserIds.has(targetUserId);
    const isFollower = followerUserIds.has(targetUserId);

    return (
        <ProfileView
            user={targetUser}
            isCurrentUser={isCurrentUser}
            posts={posts}
            onUpdateUser={onUpdateUser}
            currentUser={currentUserData!}
            onRepost={onRepost}
            onNavigateToProfile={onNavigateToProfile}
            onToggleFollow={onToggleFollow}
            isFollowed={isFollowed}
            isFollower={isFollower}
            users={users}
            onNavigateToPost={onNavigateToPost}
            onSearchHashtag={onSearchHashtag}
            onDeletePost={onDeletePost}
            onNavigateToEvent={onNavigateToEvent}
            focusedEventId={focusedEventId || targetEventId || eventId}
            onClearFocusedEvent={() => {
                // IMPORTANT: When clearing the focused event, we MUST remove it from the URL
                // to prevent the infinite re-open loop in ProfileView's useEffect.
                const user = localUser || fetchedUser;
                if (user && user.username) {
                    navigate(`/${user.username}`, { replace: true });
                }
                if (onClearFocusedEvent) onClearFocusedEvent();
                if (onClearTargetEvent) onClearTargetEvent();
            }}
            onStartChat={onStartChat}
            onAddPost={onAddPost}
            onPromoteEvent={onPromoteEvent}
            chats={chats}
            followerUserIds={followerUserIds}
            followedUserIds={followedUserIds}
            onShareViaChat={onShareViaChat}
            onLike={onLike}
            onVote={onVote}
            onAddComment={onAddComment}
            onAddReply={onAddReply}
            onLikeComment={onLikeComment}
            onLikeReply={onLikeReply}
            onVoteComment={onVoteComment}
            onPreviewImage={onPreviewImage}
            globalEvents={globalEvents}
            language={language}
            pinnedPosts={pinnedPosts}
            onTogglePin={onTogglePin}
            onSupportEvent={onSupportEvent}
            likedIds={likedIds}
            votedUpIds={votedUpIds}
            votedDownIds={votedDownIds}
            repostedIds={repostedIds}
            onLoadMore={onLoadMore}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            hasMoreNews={hasMoreNews}
            isLoadingMoreNews={isLoadingMoreNews}
            isLoadingProfileFeed={isLoadingProfileFeed}
        />
    );
};
