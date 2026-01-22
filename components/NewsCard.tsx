
import React, { useState } from 'react';
import { Post, User } from '../types';
import { MessageSquare, ChevronUp, ChevronDown } from 'lucide-react';
import { PostDetailsModal } from './PostDetailsModal';
import { timeAgo } from '../utils/stringUtils';

interface NewsCardProps {
  post: Post;
  onVote: (id: string, dir: 'up' | 'down') => void;
  onAddComment: (postId: string, text: string) => void;
  currentUser: User;
  followedUserIds: Set<string>;
  users: User[];
  onNavigateToProfile?: (id: string) => void;
}

export const NewsCard: React.FC<NewsCardProps> = ({ 
  post, onVote, onAddComment, currentUser, followedUserIds, users, onNavigateToProfile 
}) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  return (
    <>
      <div className="bg-white dark:bg-[#111] p-5 rounded-3xl border border-gray-100 dark:border-zinc-800 hover:bg-slate-50/50 transition-all cursor-pointer shadow-sm" onClick={() => setIsDetailsOpen(true)}>
        <div className="flex space-x-4">
          <img src={post.authorAvatar} className="w-12 h-12 rounded-2xl object-cover" alt="" onClick={(e) => { e.stopPropagation(); onNavigateToProfile?.(post.authorId); }} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2">
                <span className="font-black text-slate-900 dark:text-white text-[15px]">{post.authorName}</span>
                <span className="text-orange-600 text-[12px] font-bold">@{post.authorUsername}</span>
              </div>
              <span className="text-slate-400 text-[10px] uppercase font-bold text-right leading-tight">
                {timeAgo(post.timestamp)}
              </span>
            </div>
            <p className="text-[10px] font-black mb-2 text-orange-600 uppercase tracking-widest">{post.authorPosition}</p>
            <div className="text-slate-800 dark:text-gray-200 text-[15px] font-medium leading-relaxed mb-4">{post.content}</div>

            {post.imageUrl && (
              <div className="mb-4 rounded-2xl overflow-hidden border border-gray-100 dark:border-zinc-800">
                <img src={post.imageUrl} className="w-full h-auto object-cover max-h-80" alt="" />
              </div>
            )}

            <div className="flex items-center space-x-6 text-slate-500" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center space-x-1 bg-slate-50 dark:bg-zinc-900 rounded-xl p-1 border border-slate-100 dark:border-zinc-800">
                <button 
                  onClick={(e) => { e.stopPropagation(); onVote(post.id, 'up'); }} 
                  className={`p-2 rounded-xl transition-all flex items-center space-x-2 ${post.userLiked ? 'bg-emerald-100 text-emerald-600' : 'hover:bg-emerald-50 dark:hover:bg-zinc-800 text-gray-400'}`}
                >
                  <ChevronUp size={20} strokeWidth={3} />
                  <span className="font-black text-slate-900 dark:text-white">{post.likes}</span>
                </button>
                <div className="w-px h-6 bg-slate-200 dark:bg-zinc-800 mx-1"></div>
                <button 
                  onClick={(e) => { e.stopPropagation(); onVote(post.id, 'down'); }} 
                  className={`p-2 rounded-xl transition-all ${post.userDownvoted ? 'bg-orange-100 text-orange-600' : 'hover:bg-orange-50 dark:hover:bg-zinc-800 text-gray-400'}`}
                >
                  <ChevronDown size={20} strokeWidth={3} />
                </button>
              </div>
              <button className="flex items-center space-x-2 hover:text-blue-600" onClick={() => setIsDetailsOpen(true)}>
                <MessageSquare size={18} />
                <span className="text-sm font-black">{post.comments}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      {isDetailsOpen && <PostDetailsModal post={post} onClose={() => setIsDetailsOpen(false)} onAddComment={onAddComment} onLike={() => onVote(post.id, 'up')} onVote={onVote} />}
    </>
  );
};
