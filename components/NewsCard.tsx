
import React from 'react';
import { Post, User } from '../types';
import { MessageSquare, ChevronUp, ChevronDown, Share2 } from 'lucide-react';
import { timeAgo } from '../utils/stringUtils';
import { Language } from '../utils/translations';
import { RENDER_REGEX, getUserByMention } from '../utils/mentionUtils';
import { getSafeAvatar } from '../utils/avatarUtils';

interface NewsCardProps {
  post: Post;
  onVote: (id: string, dir: 'up' | 'down') => void;
  onRepost: (id: string) => void;
  onAddComment: (postId: string, text: string) => void;
  onLikeComment?: (commentId: string) => void;
  onLikeReply?: (replyId: string) => void;
  currentUser: User;
  followedUserIds: Set<string>;
  users: User[];
  onNavigateToProfile?: (id: string) => void;
  onNavigateToPost?: (postId: string) => void;
  onSearchHashtag?: (tag: string) => void;
  onPreviewImage?: (url: string) => void;
  onOpenShare: (post: Post) => void;
  language: Language;
}

export const NewsCard: React.FC<NewsCardProps> = ({
  post, onVote, onRepost, onAddComment, onLikeComment, onLikeReply, currentUser, followedUserIds, users, onNavigateToProfile, onNavigateToPost, onSearchHashtag, onPreviewImage, onOpenShare, language
}) => {
  const handleNewsClick = () => {
    onNavigateToPost?.(post.id);
  };

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPreviewImage) {
      onPreviewImage(getSafeAvatar(post.authorAvatar));
    } else {
      onNavigateToProfile?.(post.authorId);
    }
  };

  const renderContent = (content: string) => {
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
            className="text-orange-600 dark:text-orange-400 font-black hover:underline transition-all"
          >
            {part}
          </button>
        );
      } else if (trimmedPart.startsWith('@')) {
        const username = trimmedPart.slice(1).toLowerCase();
        const mentionedUser = users.find(u => {
          const uName = u.username?.toLowerCase();
          if (!uName) return false;
          if (uName === username) return true;
          const cleanPart = username.replace(/[.,!?;:]+$/, '');
          return uName === cleanPart;
        });

        if (mentionedUser) {
          return (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                onNavigateToProfile?.(mentionedUser.id);
              }}
              className="text-purple-600 dark:text-purple-400 font-black hover:underline transition-all"
            >
              @{mentionedUser.username}
            </button>
          );
        }
      }
      return part;
    });
  };

  return (
    <div className="bg-white dark:bg-[#111] w-full max-w-full overflow-hidden sm:p-5 px-3 py-3 rounded-[1.5rem] md:rounded-[2rem] border border-gray-100 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 transition-all cursor-pointer shadow-sm hover:shadow-md group flex flex-col" onClick={handleNewsClick}>
      <div className="flex items-start space-x-3 w-full">
        <div className="relative flex-shrink-0">
          <img src={getSafeAvatar(post.authorAvatar)} className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover cursor-pointer hover:ring-4 hover:ring-orange-50 transition-all shadow-sm" alt="" onClick={handleAvatarClick} />
        </div>
        
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center justify-between mb-0.5">
            <div className="flex items-center space-x-2 truncate">
              <span className="font-bold text-gray-900 dark:text-white hover:underline text-[13px] md:text-[15px] cursor-pointer" onClick={(e) => { e.stopPropagation(); onNavigateToProfile?.(post.authorId); }}>
                {post.authorName}
              </span>
              <span className="text-orange-500 text-[11px] md:text-sm font-bold truncate">@{post.authorUsername}</span>
            </div>
            <span className="text-gray-400 dark:text-zinc-600 text-[11px] font-bold whitespace-nowrap">
              {timeAgo(post.timestamp, language)}
            </span>
          </div>
          
          <p className="text-[10px] md:text-[11px] font-bold mb-1 uppercase tracking-tight text-orange-500">{post.authorPosition}</p>
        </div>
      </div>

      <div className="mt-2 flex-1 min-w-0 px-2 sm:px-6">
        {post.title && (
          <h3 className="text-base md:text-lg lg:text-xl font-black text-slate-900 dark:text-white mb-0.5 leading-snug tracking-tight">
            {post.title}
          </h3>
        )}

        <div className="flex gap-2.5 items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="text-gray-600 dark:text-gray-400 text-[12px] md:text-[13px] leading-relaxed whitespace-pre-wrap font-normal break-words line-clamp-3 overflow-hidden text-ellipsis">
              {renderContent(post.content)}
            </div>
          </div>

          {post.imageUrl && (Array.isArray(post.imageUrl) ? post.imageUrl.length > 0 : post.imageUrl.length > 10) && (
            <div className="w-20 h-20 md:w-28 md:h-28 shrink-0 rounded-[1.5rem] overflow-hidden border border-gray-100 dark:border-zinc-800 shadow-sm -mt-2 md:-mt-3">
              <img src={Array.isArray(post.imageUrl) ? post.imageUrl[0] : post.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="" />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-4 text-gray-500" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center space-x-6">
            <button
              className="flex items-center space-x-2 hover:text-blue-500 transition-colors group/btn"
              onClick={handleNewsClick}
            >
              <div className="p-2 group-hover/btn:bg-blue-50 dark:group-hover/btn:bg-zinc-800 rounded-full transition-all">
                <MessageSquare size={18} className="group-hover/btn:scale-110 transition-transform" />
              </div>
              <span className="text-sm font-medium">{post.comments}</span>
            </button>
            
            <button
              className="flex items-center space-x-2 hover:text-blue-500 transition-colors group/btn"
              onClick={(e) => { e.stopPropagation(); onOpenShare(post); }}
            >
              <div className="p-2 group-hover/btn:bg-blue-50 dark:group-hover/btn:bg-zinc-800 rounded-full transition-all">
                <Share2 size={18} className="group-hover/btn:scale-110 transition-transform" />
              </div>
            </button>
          </div>

          <div className="flex items-center bg-slate-50 dark:bg-zinc-900/50 rounded-xl p-0.5 border border-slate-100 dark:border-zinc-800">
            <button 
              onClick={(e) => { e.stopPropagation(); onVote(post.id, 'up'); }} 
              className={`p-1.5 rounded-lg transition-all ${post.userLiked ? 'bg-emerald-500 text-white' : 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-500'}`}
            >
              <ChevronUp size={20} strokeWidth={3} />
            </button>
            <span className={`px-3 font-black text-xs min-w-[2.5rem] text-center ${
              (post.upvotes || post.likes) > 0 ? 'text-emerald-600' : (post.upvotes || post.likes) < 0 ? 'text-red-600' : 'text-slate-900 dark:text-white'
            }`}>
              {post.upvotes !== undefined ? post.upvotes : post.likes}
            </span>
            <button 
              onClick={(e) => { e.stopPropagation(); onVote(post.id, 'down'); }} 
              className={`p-1.5 rounded-lg transition-all ${post.userDownvoted ? 'bg-red-500 text-white' : 'hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500'}`}
            >
              <ChevronDown size={20} strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
