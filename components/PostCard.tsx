
import React, { useState } from 'react';
import { Post, User } from '../types';
import { MessageSquare, Heart, Share2, MoreHorizontal, Trash2 } from 'lucide-react';
import { PostDetailsModal } from './PostDetailsModal';
import { UserInfoDropdown } from './UserInfoDropdown';
import { timeAgo } from '../utils/stringUtils';

interface PostCardProps {
  post: Post;
  onLike: (id: string) => void;
  onVote?: (id: string, direction: 'up' | 'down') => void;
  onAddComment: (postId: string, text: string) => void;
  onDeletePost?: (id: string) => void;
  onSearchHashtag?: (tag: string) => void;
  onSharePost?: (postId: string, participant: any) => void;
  onNavigateToProfile?: (userId: string) => void;
  onOpenShare: (post: Post) => void;
  currentUser: User;
  followedUserIds: Set<string>;
  followerUserIds: Set<string>;
  onToggleFollow?: (userId: string) => void;
  users: User[];
}

export const PostCard: React.FC<PostCardProps> = ({ 
  post, onLike, onVote, onAddComment, onDeletePost, onSearchHashtag, 
  onSharePost, onNavigateToProfile, onOpenShare, currentUser, 
  followedUserIds, followerUserIds, onToggleFollow, users 
}) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isNews = post.type === 'news';

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (post.authorId === currentUser.id) {
      onNavigateToProfile?.(post.authorId);
    } else {
      setShowUserInfo(!showUserInfo);
    }
  };

  return (
    <>
      <div 
        className={`bg-white dark:bg-[#111] p-5 rounded-2xl border transition-all cursor-pointer group flex space-x-3 shadow-sm ${isNews ? 'border-orange-100/50 dark:border-orange-900/20' : 'border-gray-100 dark:border-zinc-800'}`}
        onClick={() => setIsDetailsOpen(true)}
      >
        <div className="relative flex-shrink-0">
          <img 
            src={post.authorAvatar} 
            className="w-10 h-10 rounded-full object-cover cursor-pointer" 
            onClick={handleAuthorClick}
            alt="" 
          />
          {showUserInfo && (
            <UserInfoDropdown 
              userId={post.authorId} 
              onClose={() => setShowUserInfo(false)} 
              onNavigate={(id) => onNavigateToProfile?.(id)} 
              isFollowed={followedUserIds.has(post.authorId)}
              isFollower={followerUserIds.has(post.authorId)}
              onToggleFollow={onToggleFollow}
              users={users}
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2 truncate">
              <span 
                className="font-bold text-gray-900 dark:text-white hover:underline text-[15px] cursor-pointer"
                onClick={handleAuthorClick}
              >
                {post.authorName}
              </span>
              <span className="text-blue-500 dark:text-blue-400 text-sm font-bold truncate">@{post.authorUsername}</span>
            </div>
            <span className="text-gray-400 dark:text-zinc-600 text-[11px] font-bold whitespace-nowrap ml-4">
              {timeAgo(post.timestamp)}
            </span>
          </div>
          
          <p className={`text-[11px] font-bold mb-1 uppercase tracking-tight ${isNews ? 'text-orange-500' : 'text-blue-500'}`}>{post.authorPosition}</p>
          
          <div className="text-gray-900 dark:text-gray-200 text-[15px] leading-relaxed py-2 whitespace-pre-wrap">{post.content}</div>

          {post.imageUrl && (
            <div className="mb-3 rounded-xl overflow-hidden border border-gray-100 dark:border-zinc-800">
              <img src={post.imageUrl} alt="Content" className="w-full h-auto max-h-[500px] object-cover" />
            </div>
          )}

          <div className="flex items-center justify-between max-w-md text-gray-500 mt-2">
            <button 
              onClick={(e) => { e.stopPropagation(); onLike(post.id); }} 
              className={`flex items-center space-x-2 transition-colors group/btn ${post.userLiked ? 'text-pink-600' : 'hover:text-pink-600'}`}
            >
              <div className={`p-2 rounded-full transition-all ${post.userLiked ? 'bg-pink-50 dark:bg-pink-900/20' : 'group-hover/btn:bg-pink-50 dark:group-hover/btn:bg-pink-900/20'}`}><Heart size={18} fill={post.userLiked ? "currentColor" : "none"} /></div>
              <span className="text-sm font-medium">{post.likes}</span>
            </button>
            
            <button 
              onClick={(e) => { e.stopPropagation(); setIsDetailsOpen(true); }}
              className="flex items-center space-x-2 hover:text-blue-500 transition-colors group/btn"
            >
              <div className="p-2 group-hover/btn:bg-blue-50 dark:group-hover/btn:bg-zinc-800 rounded-full transition-all"><MessageSquare size={18} /></div>
              <span className="text-sm font-medium">{post.comments}</span>
            </button>
            
            <button 
              onClick={(e) => { e.stopPropagation(); onOpenShare(post); }}
              className="flex items-center space-x-2 hover:text-blue-500 transition-colors group/btn"
            >
              <div className="p-2 group-hover/btn:bg-blue-50 dark:group-hover/btn:bg-zinc-800 rounded-full transition-all"><Share2 size={18} /></div>
            </button>
          </div>
        </div>
      </div>
      {isDetailsOpen && <PostDetailsModal post={post} onClose={() => setIsDetailsOpen(false)} onAddComment={onAddComment} onLike={onLike} onVote={onVote} onSearchHashtag={onSearchHashtag} />}
    </>
  );
};
