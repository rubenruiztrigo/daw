import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProfileView } from './ProfileView';
import { User, Post, Chat, CalendarEvent, Notification } from '../types';
import { Language } from '../utils/translations';

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
    onAddPost: (content: string, type: 'post' | 'news', tags: string[], imageUrl?: string, docUrl?: string, docName?: string, linkedEventId?: string) => void;
    onPromoteEvent: (ev: CalendarEvent) => void;
    onShareViaChat: (recipientId: string, text: string, postId?: string, profileId?: string) => void;
    focusedEventId: string | null;
    onClearFocusedEvent: () => void;
    onSearchHashtag: (tag: string) => void;
    onNavigateToPost: (postId: string) => void;
    onNavigateToProfile: (userId: string) => void;
    onLike: (id: string) => void; // Added missing prop
    onVote: (id: string, dir: 'up' | 'down') => void; // Added missing prop
    onAddComment: (postId: string, text: string) => void; // Added missing prop
    onPreviewImage?: (url: string) => void; // Added missing prop
    globalEvents?: any[];
    language: Language;
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
    onPreviewImage,
    globalEvents = [],
    language
}) => {
    const { username } = useParams<{ username: string }>();
    const navigate = useNavigate();

    // Find user by username or ID
    const targetUser = users.find(u => u.username === username || u.id === username) ||
        (currentUserData?.username === username || currentUserData?.id === username ? currentUserData : null) ||
        (!username && currentUserData ? currentUserData : null);

    // Fallback if user not found (e.g. invalid URL)
    if (!targetUser) {
        return <div className="p-10 text-center text-slate-500 dark:text-zinc-400">{language === 'es' ? 'Usuario no encontrado' : 'User not found'}</div>;
    }

    const targetUserId = targetUser.id;

    // Derived state
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
            focusedEventId={focusedEventId}
            onClearFocusedEvent={onClearFocusedEvent}
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
            onPreviewImage={onPreviewImage}
            globalEvents={globalEvents}
            language={language}
        />
    );
};
