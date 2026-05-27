
import React from 'react';
import { Post, User } from '../types';
import { MessageSquare, ChevronUp, ChevronDown, Share2, Calendar, MapPin, Clock, ExternalLink } from 'lucide-react';
import { timeAgo, extractFirstUrl, isExternalUrl } from '../utils/stringUtils';
import { Language, useTranslation } from '../utils/translations';
import { RENDER_REGEX, getUserByMention } from '../utils/mentionUtils';
import { getSafeAvatar } from '../utils/avatarUtils';
import { LinkPreview } from './LinkPreview';
import { EventPreview } from './EventPreview';

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
  onNavigateToEvent?: (userId: string, eventId: string) => void;
  onViewCalendar?: () => void;
  globalEvents?: any[];
  language: Language;
  likedIds?: Set<string>;
  votedUpIds?: Set<string>;
  votedDownIds?: Set<string>;
  repostedIds?: Set<string>;
}

export const NewsCard: React.FC<NewsCardProps> = ({
  post, onVote, onRepost, onAddComment, onLikeComment, onLikeReply, currentUser, followedUserIds, users, onNavigateToProfile, onNavigateToPost, onSearchHashtag, onPreviewImage, onOpenShare, onNavigateToEvent, onViewCalendar, globalEvents = [], language,
  likedIds = new Set(), votedUpIds = new Set(), votedDownIds = new Set(), repostedIds = new Set()
}) => {
  const t = useTranslation(language);
  
  const isUpvoted = votedUpIds.has(post.id);
  const isDownvoted = votedDownIds.has(post.id);
  const isReposted = repostedIds.has(post.id);

  const handleNewsClick = () => {
    onNavigateToPost?.(post.id);
  };

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNavigateToProfile?.(post.authorId);
  };

  const renderContent = (content: string, urlToHide?: string) => {
    if (!content) return null;
    const parts = content.split(RENDER_REGEX);
    let hiddenOnce = false;
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
      } else if (trimmedPart.startsWith('@') && trimmedPart.length > 1) {
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
      } else if (part.startsWith('http')) {
        if (part === urlToHide && !hiddenOnce) {
          hiddenOnce = true;
          return null;
        }
        const profileEventMatch = part.match(/(?:\/u\/|\/@)([^\/]+)\/(?:e|evento)\/([^\/\?\s]+)/);
        if (profileEventMatch && onNavigateToEvent) {
          const [, identifier, eventId] = profileEventMatch;
          const cleanIdentifier = identifier.startsWith('@') ? identifier.slice(1) : identifier;
          const eventOwner = users.find(u => u.username === cleanIdentifier || u.id === cleanIdentifier);
          const foundEvent = globalEvents?.find(ev => ev.id === eventId);
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

  const images = Array.isArray(post.imageUrl) ? post.imageUrl : (post.imageUrl ? [post.imageUrl] : []);
  // Preview: única, priorizando la URL guardada en linkPreviewUrl si es válida.
  const previewUrl = (() => {
    const first = extractFirstUrl(post.content);
    if (post.linkPreviewUrl && isExternalUrl(post.linkPreviewUrl)) return post.linkPreviewUrl;
    return first && isExternalUrl(first) ? first : null;
  })();
  const showLinkPreview = post.showLinkPreview !== false && images.length === 0 && !!previewUrl;

  return (
    <div className="bg-white dark:bg-[#111] w-full max-w-full overflow-hidden sm:p-5 px-3 py-3 rounded-[1.5rem] md:rounded-[2rem] border border-gray-100 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 transition-all cursor-pointer shadow-sm hover:shadow-md group flex flex-col" onClick={handleNewsClick}>
      <div className="flex items-center space-x-3 w-full">
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
          
          {!post.authorIsOrganization && !users.find(u => u.id === post.authorId)?.isOrganization && <p className="text-[10px] md:text-[11px] font-bold mb-1 uppercase tracking-tight text-orange-500">{post.authorPosition}</p>}
        </div>
      </div>

      <div className="mt-2 flex-1 min-w-0 px-2 sm:px-6">
        <div className="flex gap-4 items-start justify-between">
          <div className="flex-1 min-w-0">
            {post.title && (
              <h3 className="text-base md:text-lg lg:text-xl font-black text-slate-900 dark:text-white mb-0.5 leading-snug tracking-tight">
                {post.title}
              </h3>
            )}

            <div className="text-gray-600 dark:text-gray-400 text-[12px] md:text-[13px] leading-relaxed whitespace-pre-wrap font-normal break-words py-1 line-clamp-4 overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' }}>
              {renderContent(post.content)}
            </div>

            {showLinkPreview && previewUrl && (
              <div className="mt-2">
                <LinkPreview url={previewUrl} language={language} />
              </div>
            )}
          </div>

          {images.length > 0 && !post.linkedEvent && (
            <div className="w-24 h-24 md:w-32 md:h-32 shrink-0 rounded-[1.5rem] overflow-hidden border border-gray-100 dark:border-zinc-800 shadow-sm mt-1">
              <img src={images[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="" loading="lazy" decoding="async" />
            </div>
          )}
        </div>

        {post.linkedEvent && (
          <div className="mt-2 event-preview-container">
            <EventPreview
              event={post.linkedEvent}
              language={language}
              onNavigateToEvent={onNavigateToEvent}
              onViewCalendar={onViewCalendar}
              onNavigateToProfile={onNavigateToProfile}
              isCompact={false}
            />
          </div>
        )}

        <div className="flex items-center justify-between mt-4 text-slate-500" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center space-x-6">
            <button
              className="flex items-center space-x-2 hover:text-blue-500 transition-colors"
              onClick={handleNewsClick}
            >
              <MessageSquare size={18} />
              <span className="text-sm font-black">{post.comments || 0}</span>
            </button>
            
            <button
              className="flex items-center space-x-2 hover:text-blue-500 transition-colors"
              onClick={(e) => { e.stopPropagation(); onOpenShare(post); }}
            >
              <Share2 size={18} />
            </button>
          </div>

          <div className="flex items-center bg-slate-50 dark:bg-zinc-900/50 rounded-xl p-0.5 border border-slate-100 dark:border-zinc-800">
            <button 
              onClick={(e) => { e.stopPropagation(); onVote(post.id, 'up'); }} 
              className={`p-1.5 rounded-lg transition-all ${isUpvoted ? 'bg-emerald-500 text-white' : 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-500'}`}
            >
              <ChevronUp size={20} strokeWidth={3} />
            </button>
            <span className={`px-3 font-black text-xs min-w-[2.5rem] text-center ${
              isUpvoted ? 'text-emerald-500' : isDownvoted ? 'text-red-500' : 'text-slate-500'
            }`}>
              {Math.max(0, post.upvotes ?? 0)}
            </span>
            <button 
              onClick={(e) => { e.stopPropagation(); onVote(post.id, 'down'); }} 
              className={`p-1.5 rounded-lg transition-all ${isDownvoted ? 'bg-red-500 text-white' : 'hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500'}`}
            >
              <ChevronDown size={20} strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
