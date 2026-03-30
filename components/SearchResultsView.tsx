import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Post, User } from '../types';
import { sortUsersByRelevance } from '../utils/mentionUtils';
import { supabase } from '../supabaseClient';
import { Search, ArrowLeft, Users, Zap, Clock, Filter, Check, X, Loader2, UserPlus, UserMinus, ChevronDown, Sparkles } from 'lucide-react';
import { PostCard } from './PostCard';
import { NewsCard } from './NewsCard';
import { normalizeString } from '../utils/stringUtils';
import { Language, useTranslation } from '../utils/translations';
import { getSafeAvatar } from '../utils/avatarUtils';
import { ShareModal } from './ShareModal';

interface SearchResultsViewProps {
  query: string;
  posts: Post[];
  users: User[];
  onLike: (id: string) => void;
  onVote: (id: string, dir: 'up' | 'down') => void;
  onRepost: (id: string) => void;
  onAddComment: (postId: string, text: string) => void;
  onLikeComment?: (commentId: string) => void;
  onLikeReply?: (replyId: string) => void;
  onDeletePost?: (id: string) => void;
  onViewChange: (view: any) => void;
  onSearchHashtag?: (tag: string) => void;
  onShareViaChat?: (recipientId: string, text: string, sharedPostId?: string, sharedProfileId?: string, sharedEventId?: string, imageUrls?: string[], newsId?: string, scheduledAt?: Date) => Promise<void>;
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
  chats?: any[];
}

export const SearchResultsView: React.FC<SearchResultsViewProps> = ({
  query, posts, users, onLike, onVote, onRepost, onAddComment, onLikeComment, onLikeReply, onDeletePost, onViewChange, onSearchHashtag, onShareViaChat, onNavigateToProfile, onNavigateToPost, onPreviewImage, currentUser, followedUserIds = new Set(), followerUserIds = new Set(), onToggleFollow, onNavigateToEvent, globalEvents = [], language, chats = []
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'featured' | 'latest' | 'people'>(() => {
    const cached = sessionStorage.getItem('last_search_tab');
    return (cached === 'featured' || cached === 'latest' || cached === 'people') ? cached : 'featured';
  });
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

  // Search State with Cache Support
  const [searchResults, setSearchResults] = useState<Post[]>(() => {
    const cached = sessionStorage.getItem('last_search_results');
    const cachedQuery = sessionStorage.getItem('last_search_query');
    const cachedFilter = sessionStorage.getItem('last_search_filter');
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type') || 'all';
    
    if (cached && cachedQuery === query && cachedFilter === type) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [searchOffset, setSearchOffset] = useState(() => {
    const cachedQuery = sessionStorage.getItem('last_search_query');
    if (cachedQuery === query) {
      return Number(sessionStorage.getItem('last_search_offset')) || 0;
    }
    return 0;
  });

  const [hasMoreResults, setHasMoreResults] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [visiblePeopleLimit, setVisiblePeopleLimit] = useState(10);
  const [sharingPost, setSharingPost] = useState<Post | null>(null);
  const [sharingEvent, setSharingEvent] = useState<any | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const normalizedQuery = useMemo(() => normalizeString(query), [query]);

  const peopleResults = useMemo(() => {
    if (!normalizedQuery) return users;
    const filtered = users.filter(user =>
      normalizeString(user.name).includes(normalizedQuery) ||
      (user.lastName && normalizeString(user.lastName).includes(normalizedQuery)) ||
      (user.username && normalizeString(user.username).includes(normalizedQuery)) ||
      (user.position && normalizeString(user.position).includes(normalizedQuery)) ||
      (user.department && normalizeString(user.department).includes(normalizedQuery))
    );
    return sortUsersByRelevance(filtered, query);
  }, [users, normalizedQuery, query]);

  // Sync localQuery
  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  // Safety blur on mount for mobile to ensure keyboard is closed
  useEffect(() => {
    if (window.innerWidth < 768) {
      setTimeout(() => {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      }, 150);
    }
  }, []);

  // Sync filterType and Tab to URL and Cache
  useEffect(() => {
    const url = new URL(window.location.href);
    if (filterType !== 'all') {
      url.searchParams.set('type', filterType);
    } else {
      url.searchParams.delete('type');
    }
    window.history.replaceState({}, '', url.toString());
    sessionStorage.setItem('last_search_filter', filterType);
    sessionStorage.setItem('last_search_tab', activeTab);
  }, [filterType, activeTab]);

  // Fetch Logic
  const fetchSearchResults = useCallback(async (offset: number, limit: number, isLoadMore: boolean) => {
    // If we have cached results for this query/offset and it's not a load more, 
    // we already rendered them from state initializer. We still search to refresh.
    if (!isLoadMore && searchResults.length > 0) {
      // Don't set isSearching(true) to avoid clearing UI
    } else if (isLoadMore) {
      setIsLoadingMore(true);
    } else {
      setIsSearching(true);
    }

    try {
      const isHashtagSearch = query.trim().startsWith('#');
      const searchTerm = normalizedQuery.trim();

      if (!searchTerm && !isHashtagSearch) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      let postsQuery = supabase.from('posts').select('*');
      let newsQuery = supabase.from('news').select('*');

      if (isHashtagSearch) {
        // Búsqueda explícita de hashtag: usar ilike normal
        const likeTerm = `%${searchTerm}%`;
        postsQuery = postsQuery.or(`content.ilike.${likeTerm}`);
        newsQuery = newsQuery.or(`content.ilike.${likeTerm}`);
      } else {
        // Búsqueda de texto plano: excluir si está precedido por #
        // Usamos regex POSIX de Postgres: (^|[^#]) para asegurar que no hay un # justo antes
        // Nota: usamos imatch (~) para case-insensitive regex
        const regexTerm = `(^|[^#])${searchTerm}`;
        postsQuery = postsQuery.filter('content', 'imatch', regexTerm);
        newsQuery = newsQuery.filter('content', 'imatch', regexTerm);
      }

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
          authorAvatar: getSafeAvatar(author?.avatar),
          authorPosition: author?.position || '',
        };

        return {
          ...item,
          ...enrichedAuthor,
          title: item.title || item.titulo,
          imageUrl: item.imageUrl || item.image_url || [],
          likes: item.likes_count || 0,
          comments: item.comments_count || 0,
          reposts: item.reposts_count || 0,
          userLiked: false,
          userDownvoted: false,
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
        sessionStorage.setItem('last_search_results', JSON.stringify(combined));
        sessionStorage.setItem('last_search_query', query);
        sessionStorage.setItem('last_search_offset', '0');
      } else {
        setSearchResults(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const filtered = combined.filter(p => !existingIds.has(p.id));
          const updated = [...prev, ...filtered];
          sessionStorage.setItem('last_search_results', JSON.stringify(updated));
          sessionStorage.setItem('last_search_offset', offset.toString());
          return updated;
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

  const isInitialMount = useRef(true);
  const lastSearchKey = useRef("");

  useEffect(() => {
    const trimmedQuery = normalizedQuery.trim();
    if (trimmedQuery.length < 3) {
      setSearchResults([]);
      setHasMoreResults(false);
      lastSearchKey.current = "";
      return;
    }

    const currentSearchKey = `${normalizedQuery}-${filterType}-${activeTab}`;

    // Si acabamos de montar y ya tenemos resultados restaurados de cache,
    // o si el "key" de la búsqueda no ha cambiado realmente (evitar re-fetch por actualización de 'users'),
    // no limpiamos ni volvemos a buscar.
    if (searchResults.length > 0 && (isInitialMount.current || currentSearchKey === lastSearchKey.current)) {
      isInitialMount.current = false;
      lastSearchKey.current = currentSearchKey;
      return;
    }

    lastSearchKey.current = currentSearchKey;
    setSearchOffset(0);
    setHasMoreResults(true);
    setSearchResults([]);
    setVisiblePeopleLimit(10);
    fetchSearchResults(0, 10, false);
    isInitialMount.current = false;
  }, [normalizedQuery, filterType, activeTab, fetchSearchResults, searchResults.length]);

  const handleLocalVote = useCallback((id: string, dir: 'up' | 'down') => {
    setSearchResults(prev => prev.map(p => {
      if (p.id === id) {
        const currentVote = p.userLiked ? 'up' : (p.userDownvoted ? 'down' : null);
        let newLikes = p.likes || 0;
        let newUpvotes = p.upvotes !== undefined ? p.upvotes : p.likes;

        if (currentVote === dir) {
          // Remover voto actual
          if (dir === 'up') {
            newLikes -= 1;
            newUpvotes -= 1;
          }
          return { ...p, likes: newLikes, upvotes: newUpvotes, userLiked: false, userDownvoted: false };
        } else {
          // Cambiar o añadir voto
          // Si estamos quitando un UP, restamos
          if (currentVote === 'up') { newLikes -= 1; newUpvotes -= 1; }
          
          // Si estamos poniendo un UP, sumamos
          if (dir === 'up') {
            newLikes += 1;
            newUpvotes += 1;
          }
          // El DOWN no suma ni resta al contador público

          return { ...p, likes: newLikes, upvotes: newUpvotes, userLiked: dir === 'up', userDownvoted: dir === 'down' };
        }
      }
      return p;
    }));
    onVote(id, dir);
  }, [onVote]);

  const handleLocalLike = useCallback((id: string) => {
    setSearchResults(prev => prev.map(p => {
      if (p.id === id) {
        const isLiked = !p.userLiked;
        return { ...p, likes: p.likes + (isLiked ? 1 : -1), userLiked: isLiked };
      }
      return p;
    }));
    onLike(id);
  }, [onLike]);

  const handleLocalRepost = useCallback((id: string) => {
    setSearchResults(prev => prev.map(p => {
      if (p.id === id) {
        const isReposted = !p.userReposted;
        return { ...p, reposts: p.reposts + (isReposted ? 1 : -1), userReposted: isReposted };
      }
      return p;
    }));
    onRepost(id);
  }, [onRepost]);

  const loadMoreResults = useCallback(() => {
    if (activeTab === 'people') {
      if (visiblePeopleLimit < peopleResults.length) {
        setVisiblePeopleLimit(prev => prev + 10);
      }
      return;
    }

    if (!hasMoreResults || isSearching || isLoadingMore) return;
    const newOffset = searchOffset + 10;
    setSearchOffset(newOffset);
    fetchSearchResults(newOffset, 10, true);
  }, [hasMoreResults, isSearching, isLoadingMore, searchOffset, fetchSearchResults, activeTab, visiblePeopleLimit, peopleResults.length]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 400) {
        loadMoreResults();
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMoreResults]);


  const handleLocalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localQuery.trim()) return;

    const url = new URL(window.location.href);
    url.searchParams.set('q', localQuery);
    searchInputRef.current?.blur();
    navigate(`/buscar${url.search}`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-6 md:pt-8 pb-20 px-4 md:px-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center space-x-4">
          <button onClick={() => onViewChange('feed')} className="p-3 bg-white dark:bg-[#111] border border-gray-100 dark:border-zinc-800 rounded-2xl text-slate-400 hover:text-blue-600 transition-all"><ArrowLeft size={20} /></button>
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">{t('search')}</h2>
          </div>
        </div>
        <form onSubmit={handleLocalSearch} className="relative w-full md:max-w-md z-50">
          <input
            ref={searchInputRef}
            type="text"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            placeholder={t('new_search')}
            inputMode="search"
            enterKeyHint="search"
            className="w-full pl-6 pr-20 py-3 bg-white dark:bg-[#111] border border-gray-100 dark:border-zinc-800 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-inset focus:ring-blue-500 outline-none transition-all dark:text-white"
          />
          <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors">
            <Search size={18} />
          </button>
          {localQuery && (
            <button
              type="button"
              onClick={() => {
                setLocalQuery('');
                setFilterType('all');
              }}
              className="absolute right-12 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 z-50"
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

      <div className="space-y-3">
        {(activeTab === 'featured' || activeTab === 'latest') && (
          <>
            {searchResults.length === 0 && !isSearching ? (
              <div className="text-center py-20 bg-white dark:bg-[#111] rounded-[32px] border border-dashed border-gray-200 dark:border-zinc-800 w-full">
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
                      onVote={handleLocalVote}
                      onRepost={handleLocalRepost}
                      onAddComment={onAddComment}
                      currentUser={currentUser}
                      followedUserIds={followedUserIds}
                      users={users}
                      onNavigateToProfile={onNavigateToProfile}
                      onNavigateToPost={onNavigateToPost}
                      onSearchHashtag={onSearchHashtag}
                      onPreviewImage={onPreviewImage}
                      onOpenShare={(p) => setSharingPost(p)}
                      language={language}
                    />
                  );
                }
                return (
                  <PostCard
                    key={post.id}
                    post={post}
                    onLike={handleLocalLike}
                    onLikeComment={onLikeComment}
                    onLikeReply={onLikeReply}
                    onVote={handleLocalVote}
                    onRepost={handleLocalRepost}
                    onAddComment={onAddComment}
                    onDeletePost={onDeletePost}
                    onSearchHashtag={onSearchHashtag}
                    onSharePost={(pid) => {
                      const p = searchResults.find(post => post.id === pid);
                      if (p) setSharingPost(p);
                    }}
                    onNavigateToProfile={onNavigateToProfile}
                    onNavigateToPost={onNavigateToPost}
                    onOpenShare={(p) => setSharingPost(p)}
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

            {!hasMoreResults && searchResults.length > 0 && !isLoadingMore && (
              <div className="py-6 flex flex-col items-center justify-center space-y-3">
                <div className="h-px w-12 bg-gray-100 dark:bg-zinc-800" />
                <p className="text-[10px] font-black text-gray-400 dark:text-zinc-600 uppercase tracking-[0.2em]">
                  {t('end_of_results')}
                </p>
                <Sparkles size={16} className="text-gray-200 dark:text-zinc-800" />
              </div>
            )}
          </>
        )}

        {activeTab === 'people' && (peopleResults.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-[#111] rounded-[32px] border border-dashed border-gray-200 dark:border-zinc-800 w-full">
            <Users className="mx-auto text-gray-200 dark:text-zinc-800 mb-4" size={48} />
            <p className="text-gray-400 dark:text-zinc-600 font-bold italic">{t('no_colleagues_found')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {peopleResults.slice(0, visiblePeopleLimit).map(person => {
              const isMutual = followedUserIds.has(person.id!) && followerUserIds.has(person.id!);
              return (
                <div key={person.id} className="bg-white dark:bg-[#111] p-6 rounded-[2rem] border border-gray-100 dark:border-zinc-800 flex items-center justify-between transition-all cursor-pointer group" onClick={() => onNavigateToProfile?.(person.id!)}>
                  <div className="flex items-center space-x-4">
                    <img src={getSafeAvatar(person.avatar)} className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-50 dark:border-zinc-800 cursor-pointer hover:opacity-80 transition-opacity" alt="" onClick={(e) => { e.stopPropagation(); onPreviewImage?.(getSafeAvatar(person.avatar)); }} />
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

        {activeTab === 'people' && visiblePeopleLimit < peopleResults.length && (
          <div className="py-6 flex justify-center">
            <Loader2 className="animate-spin text-blue-600" size={24} />
          </div>
        )}
      </div>

      {sharingPost && (
        <ShareModal 
          isOpen={sharingPost !== null} 
          onClose={() => setSharingPost(null)} 
          onShare={onShareViaChat} 
          post={sharingPost} 
          chats={chats}
          language={language}
          currentUser={currentUser}
          users={users}
          followedUserIds={followedUserIds}
          followerUserIds={followerUserIds}
        />
      )}

      {sharingEvent && (
        <ShareModal 
          isOpen={sharingEvent !== null} 
          onClose={() => setSharingEvent(null)} 
          onShare={onShareViaChat} 
          event={sharingEvent} 
          chats={chats}
          language={language}
          currentUser={currentUser}
          users={users}
          followedUserIds={followedUserIds}
          followerUserIds={followerUserIds}
        />
      )}
    </div>
  );
};
