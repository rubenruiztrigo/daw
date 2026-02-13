import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Post, User } from '../types';
import { Newspaper, TrendingUp, History, Filter, ChevronRight, MessageSquare, ThumbsUp, MapPin, Calendar, Clock, Trophy, ImageIcon, ChevronUp, Sparkles, Loader2, RefreshCw, Plus } from 'lucide-react';
import { NewsCard } from './NewsCard';
import { RankingHistoryModal } from './RankingHistoryModal';
import { CreatePostModal } from './CreatePostModal';
import { Language, useTranslation } from '../utils/translations';

interface NewsHubViewProps {
  posts: Post[];
  user: User;
  onVote: (id: string, direction: 'up' | 'down') => void;
  onRepost: (id: string) => void;
  onAddPost: (content: string, type: 'post' | 'news', tags: string[], imageUrl?: string) => void;
  onAddComment: (postId: string, text: string) => void;
  onDeletePost?: (postId: string) => void;
  onNavigateToProfile?: (userId: string) => void;
  onNavigateToPost?: (postId: string) => void;
  onSearchHashtag?: (tag: string) => void;
  currentUser: User;
  followedUserIds?: Set<string>;
  users?: User[];
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  chats?: any[];
  onShareViaChat?: (recipientId: string, text: string, postId?: string, profileId?: string) => void;
  followerUserIds?: Set<string>;
  language: Language;
  hasNewContent?: boolean;
  onRefresh?: () => void;
}

type NewsTab = 'latest' | 'popular' | 'ranking';

export const NewsHubView: React.FC<NewsHubViewProps> = ({
  posts, user, onVote, onRepost, onAddPost, onAddComment, onNavigateToProfile, onNavigateToPost, onSearchHashtag, currentUser, followedUserIds = new Set(), users = [],
  onLoadMore, hasMore = false, isLoadingMore = false, chats, onShareViaChat, followerUserIds, language, hasNewContent = false, onRefresh
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<NewsTab>('latest');
  const t = useTranslation(language);

  useEffect(() => {
    if (!onLoadMore) return;
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 1000 && !isLoadingMore && hasMore) {
        onLoadMore();
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [onLoadMore, isLoadingMore, hasMore]);

  const [newsContent, setNewsContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    const savedTab = sessionStorage.getItem('news_hub_tab') as NewsTab;
    if (savedTab) setActiveTab(savedTab);
  }, []);

  useEffect(() => {
    sessionStorage.setItem('news_hub_tab', activeTab);
  }, [activeTab]);

  const sortedNews = useMemo(() => {
    let filtered = [...posts];
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);

    if (activeTab === 'latest') {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const startOfDay = now.getTime();
      const recent = filtered.filter(n => new Date(n.timestamp).getTime() >= startOfDay);
      return recent.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }

    const getUpvotes = (n: Post) => {
      if (n.upvotes !== undefined) return n.upvotes;
      return n.likes > 0 ? n.likes : 0;
    };

    if (activeTab === 'ranking') {
      const now = new Date();
      const day = now.getDay();
      const daysSinceMonday = (day + 6) % 7;
      const mondayStart = new Date(now);
      mondayStart.setDate(now.getDate() - daysSinceMonday);
      mondayStart.setHours(0, 0, 0, 0);
      const fridayEnd = new Date(mondayStart);
      fridayEnd.setDate(mondayStart.getDate() + 4);
      fridayEnd.setHours(23, 59, 59, 999);

      return filtered
        .filter(n => {
          const t = new Date(n.timestamp).getTime();
          return t >= mondayStart.getTime() && t <= fridayEnd.getTime();
        })
        .sort((a, b) => getUpvotes(b) - getUpvotes(a))
        .slice(0, 5);
    }

    if (activeTab === 'popular') {
      return filtered
        .filter(n => new Date(n.timestamp).getTime() > twentyFourHoursAgo)
        .sort((a, b) => (getUpvotes(b) + b.comments) - (getUpvotes(a) + a.comments));
    }

    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [posts, activeTab]);

  return (
    <div className="pb-20">
      <div className="sticky top-0 z-20 bg-white dark:bg-[#0a0a0a] border-gray-100 dark:border-zinc-900 flex items-center justify-between px-0 mb-4 h-16 -mx-3 sm:-mx-4 md:-mx-8 -mt-3 sm:-mt-4 md:-mt-8 transition-all duration-300 relative">
        <button onClick={() => setActiveTab('latest')} className="flex-1 h-full text-[12px] md:text-sm font-bold relative group transition-all focus:outline-none">
          <span className={activeTab === 'latest' ? 'text-gray-900 dark:text-white' : 'text-gray-400'}>{t('latest_news')}</span>
          {activeTab === 'latest' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 bg-orange-500 w-1/2 rounded-t-lg" />}
        </button>
        <div className="w-px h-6 bg-gray-100 dark:bg-zinc-800" />
        <button onClick={() => setActiveTab('popular')} className="flex-1 h-full text-[12px] md:text-sm font-bold relative group transition-all focus:outline-none">
          <span className={activeTab === 'popular' ? 'text-gray-900 dark:text-white' : 'text-gray-400'}>{t('most_relevant')}</span>
          {activeTab === 'popular' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 bg-orange-500 w-1/2 rounded-t-lg" />}
        </button>
        <div className="w-px h-6 bg-gray-100 dark:bg-zinc-800" />
        <button onClick={() => setActiveTab('ranking')} className="flex-1 h-full text-[12px] md:text-sm font-bold relative group transition-all focus:outline-none">
          <span className={activeTab === 'ranking' ? 'text-gray-900 dark:text-white' : 'text-gray-400'}>{t('top_ranking')}</span>
          {activeTab === 'ranking' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 bg-orange-500 w-1/2 rounded-t-lg" />}
        </button>

        <div className="w-px h-6 bg-gray-100 dark:bg-zinc-800" />

        <div className="px-2 flex items-center justify-center">
          <button
            onClick={() => setShowHistory(true)}
            className="p-2 text-orange-600 bg-orange-50/80 dark:bg-orange-900/20 backdrop-blur-sm rounded-xl transition-transform group hover:bg-orange-500 hover:text-white dark:hover:bg-orange-500 border border-orange-100 dark:border-orange-900/30 hover:border-orange-400 active:scale-90"
          >
            <Trophy size={16} className="transition-transform group-hover:rotate-12" />
          </button>
        </div>
      </div>

      {showHistory && (
        <RankingHistoryModal
          badges={currentUser.badges || []}
          onClose={() => setShowHistory(false)}
          mode="global_only"
          onNavigateToProfile={() => {
            setShowHistory(false);
            navigate('/profile', { state: { tab: 'news', openRanking: true } });
          }}
        />
      )}

      {hasNewContent && onRefresh && (
        <div className="flex justify-center my-4">
          <button
            onClick={onRefresh}
            className="bg-orange-600 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg shadow-orange-600/20 hover:bg-orange-700 transition-all flex items-center space-x-2 cursor-pointer"
          >
            <RefreshCw size={14} className="animate-spin-slow" />
            <span>{t('update_available')}</span>
          </button>
        </div>
      )}

      <div className="max-w-2xl mx-auto space-y-4">
        {activeTab !== 'ranking' ? (
          <>
            <div className="hidden md:block bg-white dark:bg-[#111] rounded-[2rem] border border-slate-300 dark:border-zinc-800 overflow-hidden">
              <div className="flex space-x-4 p-3 md:p-5">
                <img src={user.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (!newsContent.trim()) return;
                  onAddPost(newsContent, 'news', [], selectedImage || undefined);
                  setNewsContent('');
                  setSelectedImage(null);
                }} className="flex-1">
                  <textarea
                    value={newsContent}
                    onChange={(e) => setNewsContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (!newsContent.trim()) return;
                        onAddPost(newsContent, 'news', [], selectedImage || undefined);
                        setNewsContent('');
                        setSelectedImage(null);
                      }
                    }}
                    placeholder={t('share_your_news')}
                    className="w-full bg-transparent border-none text-base md:text-xl dark:text-white placeholder-gray-400 focus:ring-0 resize-none min-h-[60px] md:min-h-[80px] p-2"
                  />
                  <div className="flex items-center justify-between mt-4">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-orange-500 hover:bg-orange-50 rounded-full"><ImageIcon size={20} /></button>
                    <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setSelectedImage(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }} />
                    <button type="submit" className="bg-orange-600 text-white px-6 py-2 rounded-full font-bold text-sm">{t('publish')}</button>
                  </div>
                </form>
              </div>
            </div>
            <div className="space-y-4">
              {sortedNews.length > 0 ? (
                sortedNews.map(post => <NewsCard key={post.id} post={post} onVote={onVote} onRepost={onRepost} onAddComment={onAddComment} currentUser={currentUser} followedUserIds={followedUserIds} users={users} onNavigateToProfile={onNavigateToProfile} onNavigateToPost={onNavigateToPost} onSearchHashtag={onSearchHashtag} />)
              ) : (
                <div className="text-center py-20 bg-white dark:bg-[#111] rounded-[2.5rem] border border-dashed border-gray-200 dark:border-zinc-800 px-10">
                  <div className="mx-auto w-16 h-16 bg-orange-50 dark:bg-orange-900/20 rounded-full flex items-center justify-center mb-4">
                    <Clock className="text-orange-500" size={32} />
                  </div>
                  <h4 className="text-slate-900 dark:text-white font-black mb-2">
                    {activeTab === 'latest' ? t('no_news_today') : t('no_relevant_news_today')}
                  </h4>
                  <p className="text-slate-400 font-medium text-sm italic mb-6">
                    {activeTab === 'latest'
                      ? t('no_news_today_description')
                      : t('no_relevant_news_today_description')}
                  </p>
                  {activeTab === 'latest' && (
                    <button
                      onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className="inline-flex items-center space-x-2 px-6 py-3 bg-orange-600 text-white rounded-2xl font-black text-xs hover:bg-orange-700 transition-all"
                    >
                      <Sparkles size={16} />
                      <span>{t('publish_scoop')}</span>
                    </button>
                  )}
                </div>
              )}

              {isLoadingMore && (
                <div className="py-6 flex justify-center">
                  <Loader2 className="animate-spin text-orange-600" size={24} />
                </div>
              )}
              {!hasMore && sortedNews.length > 0 && (
                <div className="py-8 text-center text-gray-400 text-xs font-semibold uppercase tracking-widest opacity-50">
                  {language === 'es' ? 'Has llegado al final' : "You've reached the end"}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-4 animate-in fade-in duration-500">
            <div className="flex items-center space-x-3 px-4 mb-2">
              <Trophy className="text-orange-500" size={24} />
              <h3 className="text-xl font-black text-gray-900 dark:text-white">{t('top_ranking')}</h3>
            </div>
            {sortedNews.map((post, index) => (
              <div key={post.id} className="bg-white dark:bg-[#111] p-6 rounded-[2rem] border border-gray-50 dark:border-zinc-900 flex items-center transition-all group cursor-pointer" onClick={() => onNavigateToPost?.(post.id)}>
                <div className="w-16 flex-shrink-0"><span className="text-5xl font-black text-blue-600 dark:text-blue-500 italic">{index + 1}</span></div>
                <div className="flex-1 flex items-center space-x-4 min-w-0"><img src={post.authorAvatar} className="w-12 h-12 rounded-xl object-cover" alt="" /><div className="flex-1 min-w-0 pr-4"><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">{post.authorName}</span><h4 className="text-gray-900 dark:text-white font-bold leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">{post.content}</h4></div></div>
                <div className="flex flex-col items-center justify-center min-w-[70px] h-[84px] rounded-3xl bg-orange-50 dark:bg-orange-900/20 text-orange-500 border border-orange-100 dark:border-orange-900/30"><ChevronUp size={24} strokeWidth={4} /><span className="text-lg font-black mt-1 leading-none">{post.upvotes !== undefined ? post.upvotes : post.likes}</span></div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!showHistory && (
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="md:hidden fixed bottom-24 right-4 p-4 bg-orange-600 text-white rounded-full shadow-lg hover:bg-orange-700 transition-all z-40"
        >
          <Plus size={24} />
        </button>
      )}

      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onPost={(content, type, tags, imageUrl) => onAddPost(content, type, tags, imageUrl)}
        user={user}
        type="news"
        language={language}
      />
    </div>
  );
};
