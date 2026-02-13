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
    const query = searchParams.get('q') || '';

    // We can pass the query to SearchResultsView. 
    // Note: SearchResultsView maintains its own 'localQuery' state initialized from 'query' prop.
    // We should ensure that if 'query' prop changes (from URL), it updates internal state if needed,
    // or we can let SearchResultsView handle it (it already does via useEffect or useMemo? Let's check).
    // Checking SearchResultsView: "const [localQuery, setLocalQuery] = useState(query);"
    // It doesn't seem to update localQuery when query prop changes in the current code unless I missed a useEffect.
    // Wait, I should double check SearchResultsView logic.
    // "const [localQuery, setLocalQuery] = useState(query);" initializes it. 
    // If the user navigates /search?q=foo, then /search?q=bar, does it update?
    // Use `key={query}` on SearchResultsView or add a useEffect there?
    // Let's force a key for now to reset internal state if the URL query actually changes, 
    // BUT we don't want to reset it on App render.
    // The 'query' comes from useSearchParams, which is stable across App renders unless URL changes.

    return (
        <SearchResultsView
            key={query} /* Optional: resets view if query parameter changes, ensuring new search is populated */
            query={query}
            posts={posts}
            users={users}
            onLike={onLike}
            onVote={onVote}
            onRepost={onRepost}
            onAddComment={onAddComment}
            onDeletePost={onDeletePost}
            onViewChange={onViewChange}
            currentUser={currentUser}
            followedUserIds={followedUserIds}
            followerUserIds={followerUserIds}
            onToggleFollow={onToggleFollow}
            onNavigateToProfile={onNavigateToProfile}
            onNavigateToPost={onNavigateToPost}
            onSearchHashtag={onSearchHashtag}
            onNavigateToEvent={onNavigateToEvent}
            chats={chats}
            onShareViaChat={onShareViaChat}
            language={language}
        />
    );
};
