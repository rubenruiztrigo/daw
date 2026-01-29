
import React from 'react';
import { Post, User } from '../types';
import { MessageSquare, ChevronUp, ChevronDown } from 'lucide-react';
import { timeAgo } from '../utils/stringUtils';

interface NewsCardProps {
  post: Post;
  onVote: (id: string, dir: 'up' | 'down') => void;
  onRepost: (id: string) => void;
  onAddComment: (postId: string, text: string) => void;
  currentUser: User;
  followedUserIds: Set<string>;
  users: User[];
  onNavigateToProfile?: (id: string) => void;
  onNavigateToPost?: (postId: string) => void;
  onSearchHashtag?: (tag: string) => void;
  onPreviewImage?: (url: string) => void;
}

export const NewsCard: React.FC<NewsCardProps> = ({ 
  post, onVote, onRepost, onAddComment, currentUser, followedUserIds, users, onNavigateToProfile, onNavigateToPost, onSearchHashtag, onPreviewImage
}) => {
  const handleNewsClick = () => {
    onNavigateToPost?.(post.id);
  };

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPreviewImage) {
      onPreviewImage(post.authorAvatar);
    } else {
      onNavigateToProfile?.(post.authorId);
    }
  };

  const renderContent = (content: string) => {
    if (!content) return null;
    const parts = content.split(/(#[\wáéíóúÁÉÍÓÚñÑ]+|@[\w.]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('#')) {
        return (
          <button
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              onSearchHashtag?.(part.slice(1));
            }}
            className="text-orange-600 dark:text-orange-400 font-black hover:underline transition-all"
          >
            {part}
          </button>
        );
      } else if (part.startsWith('@')) {
        const username = part.slice(1).toLowerCase();
        const mentionedUser = users.find(u => u.username?.toLowerCase() === username);
        return (
          <button
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              if (mentionedUser) onNavigateToProfile?.(mentionedUser.id);
            }}
            className="text-orange-600 dark:text-orange-400 font-black hover:underline transition-all"
          >
            {part}
          </button>
        );
      }
      return part;
    });
  };

  return (
    <div className="bg-white dark:bg-[#111] p-5 rounded-3xl border border-gray-100 dark:border-zinc-800 hover:bg-slate-50/50 hover:border-orange-200 dark:hover:border-orange-900/30 transition-all cursor-pointer shadow-sm" onClick={handleNewsClick}>
      <div className="flex space-x-4">
        <img src={post.authorAvatar} className="w-12 h-12 rounded-2xl object-cover cursor-pointer hover:ring-2 hover:ring-orange-50 transition-all" alt="" onClick={handleAvatarClick} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              <span className="font-black text-slate-900 dark:text-white text-[15px] cursor-pointer hover:text-orange-600 transition-colors" onClick={(e) => { e.stopPropagation(); onNavigateToProfile?.(post.authorId); }}>{post.authorName}</span>
              <span className="text-orange-600 text-[12px] font-bold">@{post.authorUsername}</span>
            </div>
            <span className="text-slate-400 text-[10px] uppercase font-bold text-right leading-tight">
              {timeAgo(post.timestamp)}
            </span>
          </div>
          <p className="text-[10px] font-black mb-2 text-orange-600 uppercase tracking-widest">{post.authorPosition}</p>
          <div className="text-slate-800 dark:text-gray-200 text-[15px] font-medium leading-relaxed mb-4">
            {renderContent(post.content)}
          </div>

          {post.imageUrl && (
            <div className="mb-4 rounded-2xl overflow-hidden border border-gray-100 dark:border-zinc-800">
              <img src={post.imageUrl} className="w-full h-auto object-cover max-h-80" alt="" />
            </div>
          )}

          <div className="flex items-center justify-between text-slate-500" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center space-x-4">
              <button 
                className="flex items-center space-x-2 hover:text-blue-600 transition-colors p-2" 
                onClick={handleNewsClick}
              >
                <MessageSquare size={18} />
                <span className="text-sm font-black">{post.comments}</span>
              </button>
            </div>

            <div className="flex items-center bg-slate-50 dark:bg-zinc-900 rounded-2xl p-1 border border-slate-100 dark:border-zinc-800 ml-auto">
              <button onClick={(e) => { e.stopPropagation(); onVote(post.id, 'up'); }} className={`p-2 rounded-xl transition-all ${post.userLiked ? 'bg-emerald-100 text-emerald-600 shadow-sm' : 'hover:bg-emerald-50 dark:hover:bg-zinc-800 text-gray-400'}`}>
                <ChevronUp size={22} strokeWidth={3} />
              </button>
              <span className={`px-2 font-black text-sm min-w-[2rem] text-center ${post.likes > 0 ? 'text-emerald-600' : post.likes < 0 ? 'text-orange-600' : 'text-slate-900 dark:text-white'}`}>
                {post.likes}
              </span>
              <button onClick={(e) => { e.stopPropagation(); onVote(post.id, 'down'); }} className={`p-2 rounded-xl transition-all ${post.userDownvoted ? 'bg-orange-100 text-orange-600 shadow-sm' : 'hover:bg-orange-50 dark:hover:bg-zinc-800 text-gray-400'}`}>
                <ChevronDown size={22} strokeWidth={3} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
