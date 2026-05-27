import React, { useState } from 'react';
import { Post, User } from '../types';
import { MessageSquare, Heart, Share2, MoreHorizontal, Trash2, Repeat, Calendar, MapPin, Clock, Pin, ExternalLink, ChevronUp, ChevronDown } from 'lucide-react';
import { UserInfoDropdown } from './UserInfoDropdown';
import { EventPreview } from './EventPreview';
import { timeAgo, extractFirstUrl, extractAllExternalUrls, isExternalUrl } from '../utils/stringUtils';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { Language, useTranslation } from '../utils/translations';
import { LinkPreview } from './LinkPreview';
import { RENDER_REGEX, getUserByMention } from '../utils/mentionUtils';
import { getSafeAvatar } from '../utils/avatarUtils';

interface PostCardProps {
  post: Post;
  onLike: (id: string) => void;
  onVote?: (id: string, direction: 'up' | 'down') => void;
  onRepost: (id: string) => void;
  onAddComment: (postId: string, text: string) => void;
  onDeletePost?: (id: string) => void;
  onSearchHashtag?: (tag: string) => void;
  onSharePost?: (postId: string, participant: any) => void;
  onLikeComment?: (commentId: string) => void;
  onLikeReply?: (replyId: string) => void;
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
  isPinned?: boolean;
  onTogglePin?: (postId: string) => void;
  likedIds?: Set<string>;
  votedUpIds?: Set<string>;
  votedDownIds?: Set<string>;
  repostedIds?: Set<string>;
  chats?: any[];
}

export const PostCard: React.FC<PostCardProps> = ({
  post, onLike, onVote, onRepost, onAddComment, onDeletePost, onSearchHashtag,
  onSharePost,
  onLikeComment,
  onLikeReply,
  onNavigateToProfile,
  onNavigateToPost, onOpenShare, currentUser,
  followedUserIds, followerUserIds, onToggleFollow, users, onPreviewImage, onViewCalendar, onNavigateToEvent,
  showMenu, globalEvents = [], language, isPinned, onTogglePin,
  likedIds = new Set(), votedUpIds = new Set(), votedDownIds = new Set(), repostedIds = new Set()
}) => {
  const isNews = post.type === 'news';
  const authorUser = users.find(u => u.id === post.authorId);
  const authorIsOrganization = authorUser?.isOrganization === true || post.authorIsOrganization === true;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const t = useTranslation(language);

  const isLiked = likedIds.has(post.id);
  const isUpvoted = votedUpIds.has(post.id);
  const isDownvoted = votedDownIds.has(post.id);
  const isReposted = repostedIds.has(post.id);

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNavigateToProfile?.(post.authorId);
  };

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNavigateToProfile?.(post.authorId);
  };

  const handlePostClick = (e: React.MouseEvent) => {
    // Si el clic es en un área interactiva de EventPreview, no navegar al post
    const target = e.target as HTMLElement;
    if (target.closest('.event-preview-container')) {
      return;
    }
    onNavigateToPost?.(post.id);
  };

  const renderContent = (content: string, urlToHide?: string | string[]) => {
    if (!content) return null;
    const hideSet = new Set(Array.isArray(urlToHide) ? urlToHide : urlToHide ? [urlToHide] : []);
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
            className="text-blue-600 dark:text-blue-400 font-black hover:underline transition-all"
          >
            {part}
          </button>
        );
      } else if (trimmedPart.startsWith('@') && trimmedPart.length > 1) {
        const mentionedUser = getUserByMention(trimmedPart, users);
        if (!mentionedUser) return part;
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
      else if (part.startsWith('http')) {
        if (hideSet.has(part)) return null;
        const profileEventMatch = part.match(/(?:\/u\/|\/@)([^\/]+)\/(?:e|evento)\/([^\/\?\s]+)/);
        if (profileEventMatch && onNavigateToEvent) {
          const [, identifier, eventId] = profileEventMatch;
          // Clean the identifier (remove @ if present)
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

  return (
    <>
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => onDeletePost?.(post.id)}
        language={language}
      />

      <div
        className={`bg-white dark:bg-[#111] w-full max-w-full overflow-hidden sm:p-5 px-3 py-3 rounded-[1.5rem] md:rounded-[2rem] border transition-all cursor-pointer group flex flex-col hover:border-gray-300 dark:hover:border-zinc-700 ${isNews ? 'border-orange-100/50 dark:border-orange-900/20' : 'border-gray-100 dark:border-zinc-800'} ${isPinned ? 'border-l-4 border-l-blue-500 hover:border-l-blue-500' : ''}`}
        onClick={handlePostClick}
      >
        <div className="flex items-center space-x-3 w-full">
          <div className="relative flex-shrink-0">
            <img
              src={getSafeAvatar(post.authorAvatar)}
              className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover cursor-pointer"
              onClick={handleAvatarClick}
              alt=""
            />
          </div>
          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center justify-between mb-0.5">
              <div className="flex items-center space-x-2 min-w-0 flex-1">
                <span
                  className="font-black text-gray-900 dark:text-white hover:underline text-[14px] md:text-[15px] cursor-pointer whitespace-nowrap shrink-0"
                  onClick={handleAuthorClick}
                >
                  {post.authorName}
                </span>
                <span className="text-blue-500 dark:text-blue-400 text-[11px] md:text-sm font-medium truncate opacity-70">@{post.authorUsername}</span>
              </div>
              <div className="flex items-center space-x-2">
                {isPinned && <Pin size={14} className="text-blue-500 fill-blue-500 transform rotate-45" />}
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
                        {onTogglePin && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onTogglePin(post.id);
                              setIsMenuOpen(false);
                            }}
                            className={`w-full px-4 py-2.5 text-left text-xs font-bold flex items-center space-x-2 transition-colors ${isPinned ? 'text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800'
                              }`}
                          >
                            <Pin size={14} className={isPinned ? "fill-current" : ""} />
                            <span className="whitespace-nowrap">{isPinned ? t('unpin_post') : t('pin_post')}</span>
                          </button>
                        )}
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
            {!authorIsOrganization && <p className={`text-[10px] md:text-[11px] font-bold mb-1 uppercase tracking-tight ${isNews ? 'text-orange-500' : 'text-blue-500'}`}>{post.authorPosition}</p>}
          </div>
        </div>

        <div className="mt-2 flex-1 min-w-0 px-2 sm:px-6">
          {post.content && post.content.trim() && (
            <div className="text-gray-900 dark:text-gray-200 text-[13px] md:text-[15px] leading-relaxed py-1 md:py-1.5 whitespace-pre-wrap font-medium break-words">
              {renderContent(post.content)}
            </div>
          )}

          {/* Preview: sólo UNA. Prioridad: linkPreviewUrl guardado, luego primera URL externa. */}
          {post.showLinkPreview !== false && (!post.imageUrl || post.imageUrl.length === 0) && (() => {
            const urls = extractAllExternalUrls(post.content, isExternalUrl);
            const chosen = post.linkPreviewUrl && urls.includes(post.linkPreviewUrl) ? post.linkPreviewUrl : urls[0];
            return chosen ? <LinkPreview url={chosen} language={language} /> : null;
          })()}

          {post.linkedEvent && (
            <EventPreview
              event={post.linkedEvent}
              language={language}
              onNavigateToEvent={onNavigateToEvent}
              onViewCalendar={onViewCalendar}
              onNavigateToProfile={onNavigateToProfile}
            />
          )}

          {post.imageUrl && post.imageUrl.length > 0 && (
            <div className="mb-3">
              {post.imageUrl.length === 1 && (
                <div className="relative w-full aspect-[2/1] rounded-2xl overflow-hidden border border-gray-100 dark:border-zinc-800">
                  <img
                    src={post.imageUrl[0]}
                    alt="Content"
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-all hover:scale-[1.02]"
                  />
                </div>
              )}

              {post.imageUrl.length === 2 && (
                <div className="grid grid-cols-2 gap-1 w-full aspect-[2/1] rounded-2xl overflow-hidden border border-gray-100 dark:border-zinc-800">
                  {post.imageUrl.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                    />
                  ))}
                </div>
              )}

              {post.imageUrl.length === 3 && (
                <div className="grid grid-cols-2 grid-rows-2 gap-1 w-full aspect-[2/1] rounded-2xl overflow-hidden border border-gray-100 dark:border-zinc-800">
                  <div className="relative row-span-2">
                    <img src={post.imageUrl[0]} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover hover:opacity-90 transition-opacity" />
                  </div>
                  <div className="relative h-full">
                    <img src={post.imageUrl[1]} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover hover:opacity-90 transition-opacity" />
                  </div>
                  <div className="relative h-full">
                    <img src={post.imageUrl[2]} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover hover:opacity-90 transition-opacity" />
                  </div>
                </div>
              )}

              {post.imageUrl.length >= 4 && (
                <div className="grid grid-cols-2 grid-rows-2 gap-1 w-full aspect-[2/1] rounded-2xl overflow-hidden border border-gray-100 dark:border-zinc-800">
                  {post.imageUrl.slice(0, 4).map((url, i) => (
                    <div key={i} className="relative h-full">
                      <img src={url} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover hover:opacity-90 transition-opacity" />
                      {i === 3 && post.imageUrl.length > 4 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none">
                          <span className="text-white font-black text-xl">+{post.imageUrl.length - 4}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between w-full text-slate-500 mt-2">
            {onVote && isNews ? (
              <div className="flex items-center space-x-1 bg-slate-50 dark:bg-zinc-900/50 p-0.5 rounded-lg border border-slate-100 dark:border-zinc-800" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => onVote(post.id, 'up')}
                  className="p-1 rounded transition-colors hover:bg-white dark:hover:bg-zinc-800"
                >
                  <ChevronUp size={18} strokeWidth={3} className={isUpvoted ? 'text-emerald-500' : 'text-slate-400'} />
                </button>
                <span className={`px-2 font-black text-[10px] min-w-[2rem] text-center ${isUpvoted ? 'text-emerald-500' : isDownvoted ? 'text-red-500' : 'text-slate-500'}`}>
                  {Math.max(0, post.upvotes ?? 0)}
                </span>
                <button
                  onClick={() => onVote(post.id, 'down')}
                  className="p-1 rounded transition-colors hover:bg-white dark:hover:bg-zinc-800"
                >
                  <ChevronDown size={18} strokeWidth={3} className={isDownvoted ? 'text-red-500' : 'text-slate-400'} />
                </button>
              </div>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); onLike(post.id); }}
                className={`flex items-center space-x-2 transition-all p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800 ${isLiked ? 'text-pink-500' : 'text-slate-500'}`}
              >
                <Heart 
                  size={18} 
                  className={isLiked ? 'text-pink-500' : 'text-slate-500'} 
                  fill={isLiked ? "currentColor" : "none"} 
                />
                <span className={`text-sm font-black ${isLiked ? 'text-pink-500' : 'text-slate-500'}`}>{post.likes}</span>
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); handlePostClick(e); }}
              className="flex items-center space-x-2 text-slate-500 hover:text-blue-500 transition-colors p-1.5"
            >
              <MessageSquare size={18} />
              <span className="text-sm font-black">{post.comments}</span>
            </button>
            {!isNews && (
              <button
                onClick={(e) => { e.stopPropagation(); onRepost(post.id); }}
                className={`flex items-center space-x-2 transition-all p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800 ${isReposted ? 'text-emerald-500' : 'text-slate-500'}`}
              >
                <Repeat 
                  size={18} 
                  className={isReposted ? 'text-emerald-500 scale-110' : 'text-slate-500'} 
                />
                <span className={`text-sm font-black ${isReposted ? 'text-emerald-500' : 'text-slate-500'}`}>{post.reposts}</span>
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onOpenShare(post); }}
              className="flex items-center space-x-2 text-slate-500 hover:text-blue-500 transition-colors p-1.5"
            >
              <Share2 size={18} />
            </button>
          </div>

        </div>
      </div>
    </>
  );
};
