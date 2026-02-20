import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Post, User } from '../types';
import { supabase } from '../supabaseClient';
import { Search, ArrowLeft, Users, Zap, Clock, Filter, Check, X, Loader2, UserPlus, UserMinus, ChevronDown } from 'lucide-react';
import { PostCard } from './PostCard';
import { NewsCard } from './NewsCard';
import { normalizeString } from '../utils/stringUtils';
import { Language, useTranslation } from '../utils/translations';

interface SearchResultsViewProps {
  query: string;
  posts: Post[];
  users: User[];
  onLike: (id: string) => void;
  onVote: (id: string, dir: 'up' | 'down') => void;
  onRepost: (id: string) => void;
  onAddComment: (postId: string, text: string) => void;
  onDeletePost?: (id: string) => void;
  onViewChange: (view: any) => void;
  onSearchHashtag?: (tag: string) => void;
  onShareViaChat?: (recipientId: string, text: string, sharedPostId?: string, sharedProfileId?: string) => void;
  onNavigateToProfile?: (userId: string) => void;
  onNavigateToPost?: (postId: string) => void;
  onPreviewImage?: (url: string) => void;
  currentUser: User;
  followedUserIds?: Set<string>;
  followerUserIds?: Set<string>;
  onToggleFollow?: (userId: string) => void;
  onNavigateToEvent?: (userId: string, eventId: string) => void;
  globalEvents?: any[];
  language: Language;
}

export const SearchResultsView: React.FC<SearchResultsViewProps> = ({
  query, posts, users, onLike, onVote, onRepost, onAddComment, onDeletePost, onViewChange, onSearchHashtag, onShareViaChat, onNavigateToProfile, onNavigateToPost, onPreviewImage, currentUser, followedUserIds = new Set(), followerUserIds = new Set(), onToggleFollow, onNavigateToEvent, globalEvents = [], language
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'featured' | 'latest' | 'people'>('featured');
  const [localQuery, setLocalQuery] = useState(query);
  const [filterType, setFilterType] = useState<'all' | 'post' | 'news'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const type = params.get('type');
      return (type === 'post' || type === 'news') ? type : 'all';
    }
    return 'all';
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const t = useTranslation(language);

  // Search State
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  const [searchOffset, setSearchOffset] = useState(0);
  const [hasMoreResults, setHasMoreResults] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const normalizedQuery = useMemo(() => normalizeString(query), [query]);

  // Sync localQuery
  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  // Sync filterType to URL
  useEffect(() => {
    const url = new URL(window.location.href);
    if (filterType !== 'all') {
      url.searchParams.set('type', filterType);
    } else {
      url.searchParams.delete('type');
    }
    window.history.replaceState({}, '', url.toString());
  }, [filterType]);

  // Fetch Logic
  const fetchSearchResults = useCallback(async (offset: number, limit: number, isLoadMore: boolean) => {
    if (isLoadMore) {
      setIsLoadingMore(true);
    } else {
      setIsSearching(true);
    }

    try {
      const searchTerm = `%${normalizedQuery}%`;

      let postsQuery = supabase.from('posts').select('*').or(`content.ilike.${searchTerm}`);
      let newsQuery = supabase.from('news').select('*').or(`content.ilike.${searchTerm}`);

      if (filterType === 'post') {
        newsQuery = newsQuery.eq('id', '00000000-0000-0000-0000-000000000000');
      } else if (filterType === 'news') {
        postsQuery = postsQuery.eq('id', '00000000-0000-0000-0000-000000000000');
      }

      postsQuery = postsQuery.order('created_at', { ascending: false });
      newsQuery = newsQuery.order('created_at', { ascending: false });

      const [postsRes, newsRes] = await Promise.all([
        (filterType !== 'news') ? postsQuery.range(offset, offset + limit - 1) : Promise.resolve({ data: [] }),
        (filterType !== 'post') ? newsQuery.range(offset, offset + limit - 1) : Promise.resolve({ data: [] })
      ]);

      const newPosts = (postsRes.data || []).map((p: any) => ({ ...p, type: 'post' as const }));
      const newNews = (newsRes.data || []).map((n: any) => ({ ...n, type: 'news' as const }));

      const usersMap = new Map<string, User>(users.map(u => [u.id, u]));

      const enrich = (item: any): Post => {
        const author = usersMap.get(item.author_id);
        const enrichedAuthor = {
          authorName: author ? `${author.name} ${author.lastName || ''}`.trim() : 'Usuario',
          authorUsername: author?.username,
          authorAvatar: author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.author_id}`,
          authorPosition: author?.position || '',
        };

        return {
          ...item,
          ...enrichedAuthor,
          likes: item.likes_count || 0,
          comments: item.comments_count || 0,
          reposts: item.reposts_count || 0,
          userLiked: false,
          userReposted: false,
          commentsList: [],
          tags: item.tags || [],
          timestamp: item.created_at,
        };
      };

      const combined = [...newPosts, ...newNews].map(enrich);

      if (activeTab === 'featured') {
        combined.sort((a, b) => ((b.likes || 0) + (b.comments || 0)) - ((a.likes || 0) + (a.comments || 0)));
      } else {
        combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      }

      if (offset === 0) {
        setSearchResults(combined);
      } else {
        setSearchResults(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const filtered = combined.filter(p => !existingIds.has(p.id));
          return [...prev, ...filtered];
        });
      }

      if (combined.length < limit) {
        setHasMoreResults(false);
      } else {
        setHasMoreResults(true);
      }

    } catch (err) {
      console.error("Search fetch error:", err);
    } finally {
      setIsSearching(false);
      setIsLoadingMore(false);
    }
  }, [normalizedQuery, filterType, activeTab, users]);

  useEffect(() => {
    const trimmedQuery = normalizedQuery.trim();
    if (trimmedQuery.length < 3) {
      setSearchResults([]);
      setHasMoreResults(false);
      return;
    }

    setSearchOffset(0);
    setHasMoreResults(true);
    setSearchResults([]);
    fetchSearchResults(0, 30, false);
  }, [normalizedQuery, filterType, activeTab, fetchSearchResults]);

  const loadMoreResults = useCallback(() => {
    if (!hasMoreResults || isSearching || isLoadingMore) return;
    const newOffset = searchOffset + (searchOffset === 0 ? 30 : 15);
    setSearchOffset(newOffset);
    fetchSearchResults(newOffset, 15, true);
  }, [hasMoreResults, isSearching, isLoadingMore, searchOffset, fetchSearchResults]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 400) {
        loadMoreResults();
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMoreResults]);


  const peopleResults = useMemo(() => {
    if (!normalizedQuery) return users;
    return users.filter(user =>
      normalizeString(user.name).includes(normalizedQuery) ||
      (user.lastName && normalizeString(user.lastName).includes(normalizedQuery)) ||
      (user.username && normalizeString(user.username).includes(normalizedQuery)) ||
      (user.position && normalizeString(user.position).includes(normalizedQuery)) ||
      (user.department && normalizeString(user.department).includes(normalizedQuery))
    );
  }, [users, normalizedQuery]);

  const handleLocalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (localQuery.trim().length < 3) return;

    const url = new URL(window.location.href);
    url.searchParams.set('q', localQuery);
    navigate(`/search${url.search}`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 px-4 md:px-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center space-x-4">
          <button onClick={() => onViewChange('feed')} className="p-3 bg-white dark:bg-[#111] border border-gray-100 dark:border-zinc-800 rounded-2xl text-slate-400 hover:text-blue-600 transition-all"><ArrowLeft size={20} /></button>
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">{t('search')}</h2>
          </div>
        </div>
        <form onSubmit={handleLocalSearch} className="relative flex-1 max-w-md z-50 hidden md:block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            placeholder={t('new_search')}
            className="w-full pl-12 pr-12 py-3 bg-white dark:bg-[#111] border border-gray-100 dark:border-zinc-800 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-inset focus:ring-blue-500 outline-none transition-all dark:text-white"
          />
          {localQuery && (
            <button
              type="button"
              onClick={() => {
                setLocalQuery('');
                setFilterType('all');
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 z-50"
            >
              <X size={16} />
            </button>
          )}
        </form>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex bg-gray-100 dark:bg-zinc-900 p-1 rounded-2xl border border-gray-200 dark:border-zinc-800 w-full md:w-fit overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveTab('featured')} className={`flex-1 md:flex-none flex items-center justify-center space-x-2 px-3 md:px-6 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${activeTab === 'featured' ? 'bg-white dark:bg-[#111] text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}><Zap size={14} /><span>{t('featured')}</span></button>
          <button onClick={() => setActiveTab('latest')} className={`flex-1 md:flex-none flex items-center justify-center space-x-2 px-3 md:px-6 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${activeTab === 'latest' ? 'bg-white dark:bg-[#111] text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}><Clock size={14} /><span>{t('latest')}</span></button>
          <button onClick={() => setActiveTab('people')} className={`flex-1 md:flex-none flex items-center justify-center space-x-2 px-3 md:px-6 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${activeTab === 'people' ? 'bg-white dark:bg-[#111] text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}><Users size={14} /><span>{t('people')}</span></button>
        </div>

        {(activeTab === 'featured' || activeTab === 'latest') && (
          <div className="relative z-10 ml-auto">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center space-x-2 px-4 py-2.5 bg-white dark:bg-[#111] border border-gray-200 dark:border-zinc-800 rounded-xl text-xs font-black text-gray-500 hover:text-blue-600 hover:border-blue-200 transition-all"
            >
              <Filter size={14} />
              <span>{t('filter')}: {filterType === 'all' ? t('all') : filterType === 'post' ? t('posts') : t('news')}</span>
              <ChevronDown size={14} className={`transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`} />
            </button>

            {isFilterOpen && (
              <>
                <div className="fixed inset-0 z-0" onClick={() => setIsFilterOpen(false)}></div>
                <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-[#111] border border-gray-100 dark:border-zinc-800 rounded-xl z-20 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                  <button onClick={() => { setFilterType('all'); setIsFilterOpen(false); }} className={`w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-gray-50 dark:hover:bg-zinc-900 flex items-center justify-between transition-colors ${filterType === 'all' ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400'}`}>
                    <span>{t('all')}</span>
                    {filterType === 'all' && <Check size={14} />}
                  </button>
                  <button onClick={() => { setFilterType('post'); setIsFilterOpen(false); }} className={`w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-gray-50 dark:hover:bg-zinc-900 flex items-center justify-between transition-colors ${filterType === 'post' ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400'}`}>
                    <span>{t('posts')}</span>
                    {filterType === 'post' && <Check size={14} />}
                  </button>
                  <button onClick={() => { setFilterType('news'); setIsFilterOpen(false); }} className={`w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-gray-50 dark:hover:bg-zinc-900 flex items-center justify-between transition-colors ${filterType === 'news' ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400'}`}>
                    <span>{t('news')}</span>
                    {filterType === 'news' && <Check size={14} />}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {(activeTab === 'featured' || activeTab === 'latest') && (
          <>
            {searchResults.length === 0 && !isSearching ? (
              <div className="text-center py-20 bg-white dark:bg-[#111] rounded-[32px] border border-dashed border-gray-200 dark:border-zinc-800">
                <Zap className="mx-auto text-gray-200 dark:text-zinc-800 mb-4" size={48} />
                <p className="text-gray-400 dark:text-zinc-600 font-bold italic">{t('no_posts_found')}</p>
              </div>
            ) : (
              searchResults.map(post => {
                if (post.type === 'news') {
                  return (
                    <NewsCard
                      key={post.id}
                      post={post}
                      onVote={onVote}
                      onRepost={onRepost}
                      onAddComment={onAddComment}
                      currentUser={currentUser}
                      followedUserIds={followedUserIds}
                      users={users}
                      onNavigateToProfile={onNavigateToProfile}
                      onNavigateToPost={onNavigateToPost}
                      onSearchHashtag={onSearchHashtag}
                      onPreviewImage={onPreviewImage}
                      language={language}
                    />
                  );
                }
                return (
                  <PostCard
                    key={post.id}
                    post={post}
                    onLike={onLike}
                    onVote={onVote}
                    onRepost={onRepost}
                    onAddComment={onAddComment}
                    onDeletePost={onDeletePost}
                    onSearchHashtag={onSearchHashtag}
                    onSharePost={(pid) => onShareViaChat?.('', '', pid)}
                    onNavigateToProfile={onNavigateToProfile}
                    onNavigateToPost={onNavigateToPost}
                    onOpenShare={(p) => onShareViaChat?.('', '', p.id)}
                    currentUser={currentUser}
                    followedUserIds={followedUserIds}
                    followerUserIds={followerUserIds}
                    onToggleFollow={onToggleFollow}
                    users={users}
                    onNavigateToEvent={onNavigateToEvent}
                    globalEvents={globalEvents}
                    language={language}
                  />
                );
              })
            )}

            {(isSearching || isLoadingMore) && (
              <div className="py-6 flex justify-center">
                <Loader2 className="animate-spin text-blue-600" size={24} />
              </div>
            )}

            {!hasMoreResults && searchResults.length > 0 && (
              <div className="py-8 text-center text-gray-400 text-xs font-semibold uppercase tracking-widest opacity-50">
                {t('end_of_results')}
              </div>
            )}
          </>
        )}

        {activeTab === 'people' && (peopleResults.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-[#111] rounded-[32px] border border-dashed border-gray-200 dark:border-zinc-800">
            <Users className="mx-auto text-gray-200 dark:text-zinc-800 mb-4" size={48} />
            <p className="text-gray-400 dark:text-zinc-600 font-bold italic">{t('no_colleagues_found')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {peopleResults.map(person => {
              const isMutual = followedUserIds.has(person.id!) && followerUserIds.has(person.id!);
              return (
                <div key={person.id} className="bg-white dark:bg-[#111] p-6 rounded-[2rem] border border-gray-100 dark:border-zinc-800 flex items-center justify-between transition-all cursor-pointer group" onClick={() => onNavigateToProfile?.(person.id!)}>
                  <div className="flex items-center space-x-4">
                    <img src={person.avatar} className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-50 dark:border-zinc-800 cursor-pointer hover:opacity-80 transition-opacity" alt="" onClick={(e) => { e.stopPropagation(); onPreviewImage?.(person.avatar || ''); }} />
                    <div className="min-w-0">
                      <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors truncate">{person.name} {person.lastName || ''}</h4>
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-bold truncate">{person.position}</p>
                      <p className="text-[10px] text-gray-400 dark:text-zinc-500 font-black uppercase tracking-widest mt-1 truncate">{person.department}</p>
                    </div>
                  </div>
                  {person.id !== currentUser.id && (
                    <button onClick={(e) => { e.stopPropagation(); onToggleFollow?.(person.id!); }} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shrink-0 ${isMutual ? 'bg-green-50 dark:bg-green-900/20 text-green-600' : followedUserIds.has(person.id!) ? 'bg-slate-100 dark:bg-zinc-800 text-slate-400' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-600 hover:text-white'}`}>
                      {isMutual ? (
                        <span>{t('friends')}</span>
                      ) : followedUserIds.has(person.id!) ? (
                        <>
                          <UserMinus size={14} />
                          <span>{t('following_label')}</span>
                        </>
                      ) : followerUserIds.has(person.id!) ? (
                        <>
                          <UserPlus size={14} />
                          <span>{t('follow_also')}</span>
                        </>
                      ) : (
                        <>
                          <UserPlus size={14} />
                          <span>{t('follow')}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
