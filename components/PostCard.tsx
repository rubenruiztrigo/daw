import React, { useState } from 'react';
import { Post, User } from '../types';
import { MessageSquare, Heart, Share2, MoreHorizontal, Trash2, Repeat, Calendar, MapPin, ChevronRight, Clock, Link as LinkIcon } from 'lucide-react';
import { UserInfoDropdown } from './UserInfoDropdown';
import { timeAgo } from '../utils/stringUtils';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { Language, useTranslation } from '../utils/translations';

interface PostCardProps {
  post: Post;
  onLike: (id: string) => void;
  onVote?: (id: string, direction: 'up' | 'down') => void;
  onRepost: (id: string) => void;
  onAddComment: (postId: string, text: string) => void;
  onDeletePost?: (id: string) => void;
  onSearchHashtag?: (tag: string) => void;
  onSharePost?: (postId: string, participant: any) => void;
  onNavigateToProfile?: (userId: string) => void;
  onNavigateToPost?: (postId: string) => void;
  onOpenShare: (post: Post) => void;
  currentUser: User;
  followedUserIds: Set<string>;
  followerUserIds: Set<string>;
  onToggleFollow?: (userId: string) => void;
  users: User[];
  onPreviewImage?: (url: string) => void;
  onViewCalendar?: () => void;
  onNavigateToEvent?: (userId: string, eventId: string) => void;
  showMenu?: boolean;
  globalEvents?: any[];
  language: Language;
}

export const PostCard: React.FC<PostCardProps> = ({
  post, onLike, onVote, onRepost, onAddComment, onDeletePost, onSearchHashtag,
  onSharePost, onNavigateToProfile, onNavigateToPost, onOpenShare, currentUser,
  followedUserIds, followerUserIds, onToggleFollow, users, onPreviewImage, onViewCalendar, onNavigateToEvent,
  showMenu, globalEvents = [], language
}) => {
  const isNews = post.type === 'news';
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const t = useTranslation(language);

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNavigateToProfile?.(post.authorId);
  };

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPreviewImage) {
      onPreviewImage(post.authorAvatar);
    } else {
      onNavigateToProfile?.(post.authorId);
    }
  };

  const handlePostClick = () => {
    onNavigateToPost?.(post.id);
  };

  const renderContent = (content: string) => {
    if (!content) return null;
    const parts = content.split(/(#[\wáéíóúÁÉÍÓÚñÑ]+|@[\w.]+|https?:\/\/[^\s]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('#')) {
        return (
          <button
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              onSearchHashtag?.(part.slice(1));
            }}
            className="text-blue-600 dark:text-blue-400 font-black hover:underline transition-all"
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
            className="text-blue-600 dark:text-blue-400 font-black hover:underline transition-all"
          >
            {part}
          </button>
        );
      } else if (part.startsWith('http')) {
        const profileEventMatch = part.match(/\/u\/([^/]+)\/e\/([^/?\s]+)/);

        if (profileEventMatch && onNavigateToEvent) {
          const [, userId, eventId] = profileEventMatch;
          const eventOwner = users.find(u => u.id === userId);
          const foundEvent = globalEvents?.find(ev => ev.id === eventId);
          const label = foundEvent ? foundEvent.title : (eventOwner ? t('view_event_of', { name: eventOwner.name }) : t('view_event'));

          return (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                onNavigateToEvent(userId, eventId);
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
              if (part.includes('/event/')) {
                onViewCalendar?.();
              } else {
                window.open(part, '_blank');
              }
            }}
            className="text-blue-600 dark:text-blue-400 hover:underline transition-all font-medium"
          >
            {part}
          </button>
        );
      }
      return part;
    });
  };

  return (
    <>
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => onDeletePost?.(post.id)}
      />

      <div
        className={`bg-white dark:bg-[#111] sm:p-5 p-3 rounded-2xl border transition-all cursor-pointer group flex space-x-3 hover:border-gray-300 dark:hover:border-zinc-700 ${isNews ? 'border-orange-100/50 dark:border-orange-900/20' : 'border-gray-100 dark:border-zinc-800'}`}
        onClick={handlePostClick}
      >
        <div className="relative flex-shrink-0">
          <img
            src={post.authorAvatar}
            className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover cursor-pointer"
            onClick={handleAvatarClick}
            alt=""
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2 truncate">
              <span
                className="font-bold text-gray-900 dark:text-white hover:underline text-[13px] md:text-[15px] cursor-pointer"
                onClick={handleAuthorClick}
              >
                {post.authorName}
              </span>
              <span className="text-blue-500 dark:text-blue-400 text-[11px] md:text-sm font-bold truncate">@{post.authorUsername}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-400 dark:text-zinc-600 text-[11px] font-bold whitespace-nowrap">
                {timeAgo(post.timestamp, language)}
              </span>
              {showMenu && post.authorId === currentUser.id && (
                <div className="relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-900 rounded-full text-gray-400 transition-colors"
                  >
                    <MoreHorizontal size={16} />
                  </button>
                  {isMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl z-10 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-200 shadow-xl">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsDeleteModalOpen(true);
                          setIsMenuOpen(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center space-x-2 transition-colors"
                      >
                        <Trash2 size={14} />
                        <span className="whitespace-nowrap">{t('delete_post')}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <p className={`text-[10px] md:text-[11px] font-bold mb-1 uppercase tracking-tight ${isNews ? 'text-orange-500' : 'text-blue-500'}`}>{post.authorPosition}</p>

          <div className="text-gray-900 dark:text-gray-200 text-[13px] md:text-[15px] leading-relaxed py-1.5 md:py-2 whitespace-pre-wrap font-medium break-words">
            {renderContent(post.content)}
          </div>

          {post.linkedEvent && (
            <div className="bg-white dark:bg-[#0a0a0a] rounded-3xl border border-slate-100 dark:border-zinc-900 overflow-hidden hover:border-slate-200 dark:hover:border-zinc-800 transition-all duration-200">
              <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-blue-600 text-white rounded-xl">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 dark:text-white text-[15px] group-hover/event:text-blue-600 transition-colors">{post.linkedEvent.title}</h4>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-zinc-800 px-2.5 py-1 rounded-full border border-gray-100 dark:border-zinc-700 flex items-center space-x-1.5">
                    <Clock size={10} className="text-blue-500" />
                    <span className="text-[10px] font-black text-slate-600 dark:text-slate-300">{post.linkedEvent.event_time.substring(0, 5)}h</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div className="flex items-center text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                    <Calendar size={14} className="mr-2 text-slate-300" />
                    <span>{new Date(post.linkedEvent.event_date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'long' })}</span>
                  </div>
                  <div className="flex items-center text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                    <MapPin size={14} className="mr-2 text-slate-300" />
                    <span className="truncate">{post.linkedEvent.location}</span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onNavigateToEvent) {
                      onNavigateToEvent(post.authorId, post.linkedEvent!.id);
                    } else {
                      onViewCalendar?.();
                    }
                  }}
                  className="w-full flex items-center justify-center space-x-2 py-3 bg-white dark:bg-zinc-800 border-2 border-blue-50 dark:border-zinc-700 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-black hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all"
                >
                  <span>{t('view_details_on_profile')}</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

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
              onClick={(e) => { e.stopPropagation(); handlePostClick(); }}
              className="flex items-center space-x-2 hover:text-blue-500 transition-colors group/btn"
            >
              <div className="p-2 group-hover/btn:bg-blue-50 dark:group-hover/btn:bg-zinc-800 rounded-full transition-all"><MessageSquare size={18} /></div>
              <span className="text-sm font-medium">{post.comments}</span>
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); onRepost(post.id); }}
              className={`flex items-center space-x-2 transition-all group/btn ${post.userReposted ? 'text-emerald-500' : 'hover:text-emerald-500'}`}
            >
              <div className={`p-2 rounded-full transition-all ${post.userReposted ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'group-hover/btn:bg-emerald-50 dark:group-hover/btn:bg-emerald-900/20'}`}>
                <Repeat size={18} className={post.userReposted ? 'scale-110' : ''} />
              </div>
              <span className={`text-sm font-medium ${post.userReposted ? 'font-black' : ''}`}>{post.reposts}</span>
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
    </>
  );
};
