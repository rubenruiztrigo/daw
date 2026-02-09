
import React, { useState, useMemo, useEffect } from 'react';
import { Post, User } from '../types';
import { Search, ArrowLeft, Users, Zap, Hash, MessageSquare, Heart, ChevronUp, ChevronDown, TrendingUp, Share2, Filter, Check, Newspaper, FileText, UserPlus, UserMinus, MoreHorizontal, Trash2, X, MessageCircle, Repeat, Calendar, MapPin, ChevronRight, Clock, Link as LinkIcon } from 'lucide-react';
import { ShareModal } from './ShareModal';
import { UserInfoDropdown } from './UserInfoDropdown';
import { PostCard } from './PostCard';
import { NewsCard } from './NewsCard';

import { normalizeString } from '../utils/stringUtils';

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
}

export const SearchResultsView: React.FC<SearchResultsViewProps> = ({
  query, posts, users, onLike, onVote, onRepost, onAddComment, onDeletePost, onViewChange, onSearchHashtag, onShareViaChat, onNavigateToProfile, onNavigateToPost, onPreviewImage, currentUser, followedUserIds = new Set(), followerUserIds = new Set(), onToggleFollow, onNavigateToEvent, globalEvents = []
}) => {
  const [activeTab, setActiveTab] = useState<'featured' | 'latest' | 'people'>('featured');
  const [localQuery, setLocalQuery] = useState(query);
  const [filterType, setFilterType] = useState<'all' | 'post' | 'news'>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Sync localQuery if the prop 'query' changes (e.g. navigation)
  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  const normalizedQuery = useMemo(() => normalizeString(localQuery), [localQuery]);

  const resultsPosts = useMemo(() => {
    let filtered = posts.filter(post => normalizeString(post.content).includes(normalizedQuery) || post.tags.some(tag => normalizeString(tag).includes(normalizedQuery)));

    if (filterType === 'post') {
      filtered = filtered.filter(p => p.type === 'post');
    } else if (filterType === 'news') {
      filtered = filtered.filter(p => p.type === 'news');
    }

    if (activeTab === 'latest') {
      return [...filtered].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }

    // Sort by engagement (likes/upvotes + comments) descending
    return [...filtered].sort((a, b) => {
      const aScore = (a.type === 'news' ? (a.upvotes || 0) : (a.likes || 0)) + (a.comments || 0);
      const bScore = (b.type === 'news' ? (b.upvotes || 0) : (b.likes || 0)) + (b.comments || 0);
      return bScore - aScore;
    });
  }, [posts, normalizedQuery, filterType, activeTab]);

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
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* ... (header and search form unchanged) ... */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center space-x-4">
          <button onClick={() => onViewChange('feed')} className="p-3 bg-white dark:bg-[#111] border border-gray-100 dark:border-zinc-800 rounded-2xl text-slate-400 hover:text-blue-600 transition-all shadow-sm"><ArrowLeft size={20} /></button>
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">Búsqueda</h2>
            <p className="text-gray-500 dark:text-zinc-500 text-sm font-medium">Explorando la red institucional.</p>
          </div>
        </div>
        <form onSubmit={handleLocalSearch} className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" value={localQuery} onChange={(e) => setLocalQuery(e.target.value)} placeholder="Nueva búsqueda..." className="w-full pl-12 pr-12 py-3 bg-white dark:bg-[#111] border border-gray-100 dark:border-zinc-800 rounded-2xl text-sm font-bold shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white" />
          {localQuery && <button type="button" onClick={() => setLocalQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"><X size={16} /></button>}
        </form>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex bg-gray-100 dark:bg-zinc-900 p-1 rounded-2xl border border-gray-200 dark:border-zinc-800 w-fit">
          <button onClick={() => setActiveTab('featured')} className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'featured' ? 'bg-white dark:bg-[#111] shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}><Zap size={14} /><span>Destacado</span></button>
          <button onClick={() => setActiveTab('latest')} className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'latest' ? 'bg-white dark:bg-[#111] shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}><Clock size={14} /><span>Más reciente</span></button>
          <button onClick={() => setActiveTab('people')} className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'people' ? 'bg-white dark:bg-[#111] shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}><Users size={14} /><span>Personas</span></button>
        </div>

        {(activeTab === 'featured' || activeTab === 'latest') && (
          <div className="relative z-10">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center space-x-2 px-4 py-2.5 bg-white dark:bg-[#111] border border-gray-200 dark:border-zinc-800 rounded-xl text-xs font-black text-gray-500 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
            >
              <Filter size={14} />
              <span>Filtro: {filterType === 'all' ? 'Todo' : filterType === 'post' ? 'Posts' : 'Noticias'}</span>
              <ChevronDown size={14} className={`transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`} />
            </button>

            {isFilterOpen && (
              <>
                <div className="fixed inset-0 z-0" onClick={() => setIsFilterOpen(false)}></div>
                <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-[#111] border border-gray-100 dark:border-zinc-800 rounded-xl shadow-xl z-20 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                  <button onClick={() => { setFilterType('all'); setIsFilterOpen(false); }} className={`w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-gray-50 dark:hover:bg-zinc-900 flex items-center justify-between transition-colors ${filterType === 'all' ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400'}`}>
                    <span>Todo</span>
                    {filterType === 'all' && <Check size={14} />}
                  </button>
                  <button onClick={() => { setFilterType('post'); setIsFilterOpen(false); }} className={`w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-gray-50 dark:hover:bg-zinc-900 flex items-center justify-between transition-colors ${filterType === 'post' ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400'}`}>
                    <span>Posts</span>
                    {filterType === 'post' && <Check size={14} />}
                  </button>
                  <button onClick={() => { setFilterType('news'); setIsFilterOpen(false); }} className={`w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-gray-50 dark:hover:bg-zinc-900 flex items-center justify-between transition-colors ${filterType === 'news' ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400'}`}>
                    <span>Noticias</span>
                    {filterType === 'news' && <Check size={14} />}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {(activeTab === 'featured' || activeTab === 'latest') && (resultsPosts.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-[#111] rounded-[32px] border border-dashed border-gray-200 dark:border-zinc-800"><Zap className="mx-auto text-gray-200 dark:text-zinc-800 mb-4" size={48} /><p className="text-gray-400 dark:text-zinc-600 font-bold italic">No hay publicaciones para esta búsqueda.</p></div>
        ) : (
          resultsPosts.map(post => {
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
                />
              );
            }
            return (
              <PostCard globalEvents={globalEvents}
                key={post.id}
                post={post}
                onLike={onLike}
                onVote={onVote}
                onRepost={onRepost}
                onAddComment={onAddComment}
                onDeletePost={onDeletePost}
                onSearchHashtag={onSearchHashtag}
                onSharePost={(pid) => onShareViaChat?.('', '', pid)} // Adapter for existing prop mapping
                onNavigateToProfile={onNavigateToProfile}
                onNavigateToPost={onNavigateToPost}
                onOpenShare={(p) => onShareViaChat?.('', '', p.id)} // Adapter
                currentUser={currentUser}
                followedUserIds={followedUserIds}
                followerUserIds={followerUserIds}
                onToggleFollow={onToggleFollow}
                users={users}
                onNavigateToEvent={onNavigateToEvent}
              />
            );
          })
        ))}
        {activeTab === 'people' && (peopleResults.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-[#111] rounded-[32px] border border-dashed border-gray-200 dark:border-zinc-800"><Users className="mx-auto text-gray-200 dark:text-zinc-800 mb-4" size={48} /><p className="text-gray-400 dark:text-zinc-600 font-bold italic">No se han encontrado colegas.</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {peopleResults.map(person => {
              const isMutual = followedUserIds.has(person.id!) && followerUserIds.has(person.id!);
              return (
                <div key={person.id} className="bg-white dark:bg-[#111] p-6 rounded-[2rem] border border-gray-100 dark:border-zinc-800 flex items-center justify-between hover:shadow-lg transition-all cursor-pointer group" onClick={() => onNavigateToProfile?.(person.id!)}>
                  <div className="flex items-center space-x-4"><img src={person.avatar} className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-50 dark:border-zinc-800 cursor-pointer hover:opacity-80 transition-opacity" alt="" onClick={(e) => { e.stopPropagation(); onPreviewImage?.(person.avatar || ''); }} /><div><h4 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">{person.name} {person.lastName || ''}</h4><p className="text-xs text-blue-600 dark:text-blue-400 font-bold">{person.position}</p><p className="text-[10px] text-gray-400 dark:text-zinc-500 font-black uppercase tracking-widest mt-1">{person.department}</p></div></div>
                  {person.id !== currentUser.id && (
                    <button onClick={(e) => { e.stopPropagation(); onToggleFollow?.(person.id!); }} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${isMutual ? 'bg-green-50 dark:bg-green-900/20 text-green-600' : followedUserIds.has(person.id!) ? 'bg-slate-100 dark:bg-zinc-800 text-slate-400' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-600 hover:text-white'}`}>
                      {isMutual ? (
                        <span>Amigos</span>
                      ) : followedUserIds.has(person.id!) ? (
                        <>
                          <UserMinus size={14} />
                          <span>Siguiendo</span>
                        </>
                      ) : followerUserIds.has(person.id!) ? (
                        <>
                          <UserPlus size={14} />
                          <span>Seguir también</span>
                        </>
                      ) : (
                        <>
                          <UserPlus size={14} />
                          <span>Seguir</span>
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




