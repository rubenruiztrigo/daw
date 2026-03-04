import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { SearchResultsView } from './SearchResultsView';
import { Post, User, Chat } from '../types';
import { Language } from '../utils/translations';

interface SearchRouteProps {
    posts: Post[];
    users: User[];
    onLike: (id: string) => void;
    onVote: (id: string, dir: 'up' | 'down') => void;
    onRepost: (id: string) => void;
    onAddComment: (postId: string, text: string) => void;
    onDeletePost: (id: string) => void;
    onViewChange: (view: any) => void;
    onToggleFollow: (userId: string) => void;
    onNavigateToProfile: (userId: string) => void;
    onNavigateToPost: (postId: string) => void;
    onSearchHashtag: (tag: string) => void;
    onNavigateToEvent: (userId: string, eventId: string) => void;
    currentUser: User;
    followedUserIds: Set<string>;
    followerUserIds: Set<string>;
    chats: Chat[];
    onShareViaChat: (recipientId: string, text: string, sharedPostId?: string, sharedProfileId?: string) => void;
    language: Language;
}

export const SearchRoute: React.FC<SearchRouteProps> = ({
    posts,
    users,
    onLike,
    onVote,
    onRepost,
    onAddComment,
    onDeletePost,
    onViewChange,
    onToggleFollow,
    onNavigateToProfile,
    onNavigateToPost,
    onSearchHashtag,
    onNavigateToEvent,
    currentUser,
    followedUserIds,
    followerUserIds,
    chats,
    onShareViaChat,
    language
}) => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const query = searchParams.get('q') || '';

    return (
        <SearchResultsView
            key={query}
            query={query}
            posts={posts}
            users={users}
            onLike={onLike}
            onVote={onVote}
            onRepost={onRepost}
            onAddComment={onAddComment}
            onDeletePost={onDeletePost}
            onViewChange={(view) => {
                if (view === 'feed') navigate('/feed');
                else onViewChange(view);
            }}
            currentUser={currentUser}
            followedUserIds={followedUserIds}
            followerUserIds={followerUserIds}
            onToggleFollow={onToggleFollow}
            onNavigateToProfile={onNavigateToProfile}
            onNavigateToPost={onNavigateToPost}
            onSearchHashtag={onSearchHashtag}
            onNavigateToEvent={onNavigateToEvent}
            language={language}
            onShareViaChat={onShareViaChat}
        />
    );
};
