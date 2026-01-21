
import React, { useState, useMemo } from 'react';
import { Post, User } from '../types';
import { Search, ArrowLeft, Users, Zap, Hash, MessageSquare, Heart, ChevronUp, ChevronDown, TrendingUp, Share2, Filter, Check, Newspaper, FileText, UserPlus, UserMinus, MoreHorizontal, Trash2 } from 'lucide-react';
import { ShareModal } from './ShareModal';
import { PostDetailsModal } from './PostDetailsModal';
import { UserInfoDropdown } from './UserInfoDropdown';
import { normalizeString } from '../utils/stringUtils';

interface SearchResultsViewProps {
  query: string;
  posts: Post[];
  // Added missing users prop to support UserInfoDropdown
  users: User[];
  onLike: (id: string) => void;
  onVote: (id: string, dir: 'up' | 'down') => void;
  onAddComment: (postId: string, text: string) => void;
  onDeletePost?: (id: string) => void;
  onViewChange: (view: any) => void;
  onSearchHashtag?: (tag: string) => void;
  onSharePost?: (postId: string, participant: any) => void;
  onNavigateToProfile?: (userId: string) => void;
  currentUser: User;
  followedUserIds?: Set<string>;
  followerUserIds?: Set<string>;
  onToggleFollow?: (userId: string) => void;
}

type SearchTab = 'featured' | 'people' | 'hashtags';
type ContentTypeFilter = 'all' | 'post' | 'news';

export const SearchResultsView: React.FC<SearchResultsViewProps> = ({ 
  query, 
  posts, 
  users, // Destructured added users prop
  onLike, 
  onVote, 
  onAddComment,
  onDeletePost,
  onViewChange,
  onSearchHashtag,
  onSharePost,
  onNavigateToProfile,
  currentUser,
  followedUserIds = new Set(),
  followerUserIds = new Set(),
  onToggleFollow
}) => {
  const [activeTab, setActiveTab] = useState<SearchTab>('featured');
  const [contentTypeFilter, setContentTypeFilter] = useState<ContentTypeFilter>('all');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  const normalizedQuery = useMemo(() => normalizeString(query), [query]);

  const resultsPosts = useMemo(() => {
    let filtered = posts.filter(post => 
      normalizeString(post.content).includes(normalizedQuery) ||
      post.tags.some(tag => normalizeString(tag).includes(normalizedQuery))
    );
    
    if (contentTypeFilter !== 'all') {
      filtered = filtered.filter(post => post.type === contentTypeFilter);
    }

    return [...filtered].sort((a, b) => {
      const scoreA = (a.likes || 0) + (a.comments || 0);
      const scoreB = (b.likes || 0) + (b.comments || 0);
      return scoreB - scoreA;
    });
  }, [posts, normalizedQuery, contentTypeFilter]);

  const mockPeople: Partial<User>[] = useMemo(() => [
    { id: 'u1', name: 'Ana García', position: 'Directora de Innovación', avatar: 'https://i.pravatar.cc/150?u=ana', department: 'Diputación General' },
    { id: 'u2', name: 'Carlos Ruiz', position: 'Analista de Datos', avatar: 'https://i.pravatar.cc/150?u=carlos', department: 'Ayuntamiento Central' },
    { id: 'u3', name: 'Elena Belmonte', position: 'Gestora de Proyectos', avatar: 'https://i.pravatar.cc/150?u=elena', department: 'Agencia Digital' },
    { id: 'u4', name: 'Roberto Sánchez', position: 'Recursos Humanos', avatar: 'https://i.pravatar.cc/150?u=roberto', department: 'Ministerio de Trabajo' },
  ].filter(p => 
    normalizeString(p.name || '').includes(normalizedQuery) || 
    normalizeString(p.position || '').includes(normalizedQuery)
  ), [normalizedQuery]);

  const uniqueHashtags = useMemo(() => {
    const tags = new Set<string>();
    posts.forEach(post => {
      post.tags.forEach(tag => {
        const cleanTag = tag.replace(/\s+/g, '');
        if (normalizeString(cleanTag).includes(normalizedQuery.replace(/\s+/g, ''))) {
          tags.add(cleanTag);
        }
      });
    });
    return Array.from(tags);
  }, [posts, normalizedQuery]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4 mb-8">
        <button 
          onClick={() => onViewChange('feed')}
          className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-blue-600 transition-all shadow-sm"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-2xl font-black text-gray-900">Resultados para "{query}"</h2>
          <p className="text-gray-500 text-sm font-medium">Explorando contenido institucional y red de contactos.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200 w-fit">
          <button onClick={() => setActiveTab('featured')} className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'featured' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
            <Zap size={14} /><span>Destacado</span>
          </button>
          <button onClick={() => setActiveTab('people')} className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'people' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
            <Users size={14} /><span>Personas</span>
          </button>
          <button onClick={() => setActiveTab('hashtags')} className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'hashtags' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
            <Hash size={14} /><span>Hashtags</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {activeTab === 'featured' && (
          resultsPosts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[32px] border border-dashed border-gray-200">
              <Zap className="mx-auto text-gray-200 mb-4" size={48} /><p className="text-gray-400 font-bold italic">No hay contenido destacado para este filtro.</p>
            </div>
          ) : (
            resultsPosts.map(post => (
              <SimpleResultCard 
                key={post.id} 
                post={post} 
                onLike={onLike} 
                onVote={onVote} 
                onAddComment={onAddComment} 
                onDeletePost={onDeletePost}
                onSearchHashtag={onSearchHashtag} 
                onSharePost={onSharePost} 
                onNavigateToProfile={onNavigateToProfile} 
                currentUser={currentUser}
                followedUserIds={followedUserIds}
                followerUserIds={followerUserIds}
                onToggleFollow={onToggleFollow}
                // Pass users prop down to SimpleResultCard
                users={users}
              />
            ))
          )
        )}

        {activeTab === 'people' && (
          mockPeople.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[32px] border border-dashed border-gray-200">
              <Users className="mx-auto text-gray-200 mb-4" size={48} /><p className="text-gray-400 font-bold italic">No hay personas encontradas.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockPeople.map(person => {
                const isFollowed = followedUserIds.has(person.id!);
                const isFollower = followerUserIds.has(person.id!);
                const isMutual = isFollowed && isFollower;
                return (
                  <div key={person.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 flex items-center justify-between hover:shadow-lg transition-all cursor-pointer group" onClick={() => onNavigateToProfile && person.id && onNavigateToProfile(person.id)}>
                    <div className="flex items-center space-x-4">
                      <img src={person.avatar} className="w-16 h-16 rounded-2xl object-cover" alt="" />
                      <div>
                        <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{person.name}</h4>
                        <p className="text-xs text-blue-600 font-bold">{person.position}</p>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">{person.department}</p>
                      </div>
                    </div>
                    {person.id !== currentUser.id && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); onToggleFollow?.(person.id!); }}
                        className={`p-3 rounded-xl transition-all ${
                          isMutual 
                            ? 'bg-green-50 text-green-600 shadow-sm' 
                            : isFollowed 
                              ? 'bg-slate-100 text-slate-400' 
                              : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'
                        }`}
                        title={isMutual ? 'Amigos' : isFollowed ? 'Siguiendo' : 'Seguir'}
                      >
                        {isMutual ? <Check size={18} /> : isFollowed ? <UserMinus size={18} /> : <UserPlus size={18} />}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}

        {activeTab === 'hashtags' && (
          uniqueHashtags.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[32px] border border-dashed border-gray-200">
              <Hash className="mx-auto text-gray-200 mb-4" size={48} /><p className="text-gray-400 font-bold italic">No hay hashtags.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {uniqueHashtags.map(tag => (
                <button key={tag} onClick={() => onSearchHashtag && onSearchHashtag(tag)} className="bg-white p-4 rounded-2xl border border-gray-100 flex flex-col items-center justify-center space-y-2 hover:border-blue-500 hover:shadow-lg transition-all group">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all"><TrendingUp size={20} /></div>
                  <span className="text-sm font-black text-gray-900">#{tag}</span>
                </button>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

// Added users to SimpleResultCard prop types and arguments
const SimpleResultCard: React.FC<{ post: Post, onLike: (id: string) => void, onVote: (id: string, dir: 'up' | 'down') => void, onAddComment: (postId: string, text: string) => void, onDeletePost?: (id: string) => void, onSearchHashtag?: (tag: string) => void, onSharePost?: (postId: string, participant: any) => void, onNavigateToProfile?: (userId: string) => void, currentUser: User, followedUserIds: Set<string>, followerUserIds: Set<string>, onToggleFollow?: (userId: string) => void, users: User[] }> = ({ post, onLike, onVote, onAddComment, onDeletePost, onSearchHashtag, onSharePost, onNavigateToProfile, currentUser, followedUserIds, followerUserIds, onToggleFollow, users }) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (post.authorId === currentUser.id) {
      onNavigateToProfile && onNavigateToProfile(post.authorId);
    } else {
      setShowUserInfo(!showUserInfo);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    onDeletePost?.(post.id);
  };

  const isNews = post.type === 'news';

  return (
    <div 
      className={`bg-white rounded-[2rem] p-6 border transition-all cursor-pointer hover:border-gray-200 ${isNews ? 'border-orange-100' : 'border-gray-50'}`}
      onClick={() => setIsDetailsOpen(true)}
    >
      <div className="flex items-center justify-between mb-4 relative">
        <div className="flex items-center space-x-3">
          <img src={post.authorAvatar} className="w-10 h-10 rounded-xl object-cover cursor-pointer" alt="" onClick={handleAuthorClick} />
          {showUserInfo && (
            <UserInfoDropdown 
              userId={post.authorId} 
              onClose={() => setShowUserInfo(false)} 
              onNavigate={onNavigateToProfile!} 
              isFollowed={followedUserIds.has(post.authorId)}
              isFollower={followerUserIds.has(post.authorId)}
              onToggleFollow={onToggleFollow}
              // Fixed: Pass users prop to UserInfoDropdown to satisfy its required type
              users={users}
            />
          )}
          <div className="pt-0.5">
            <h4 className={`text-sm font-black cursor-pointer transition-colors inline-block mr-2 ${isNews ? 'text-gray-900 hover:text-orange-600' : 'text-gray-900 hover:text-blue-600'}`} onClick={handleAuthorClick}>
              {post.authorName}
            </h4>
            <p className={`text-[10px] font-bold uppercase tracking-tight inline-block ${isNews ? 'text-orange-500/80' : 'text-blue-500/80'}`}>{post.authorPosition}</p>
          </div>
        </div>

        {post.authorId === currentUser.id && (
          <div className="relative">
            <button 
              onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
              className={`p-1 rounded-full transition-all ${isMenuOpen ? (isNews ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600') : 'text-gray-300 hover:text-gray-500'}`}
            >
              <MoreHorizontal size={18} />
            </button>
            
            {isMenuOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); }}></div>
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-30 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                  <button 
                    onClick={handleDelete}
                    className="w-full text-left px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 flex items-center space-x-2 transition-colors"
                  >
                    <Trash2 size={16} />
                    <span>{isNews ? 'Eliminar noticia' : 'Eliminar post'}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
      <p className="text-gray-800 text-[15px] leading-relaxed mb-4 line-clamp-4 font-medium">{post.content}</p>
      
      {post.imageUrl && (
        <div className={`mb-4 rounded-xl overflow-hidden max-h-40 border ${isNews ? 'border-orange-50' : 'border-gray-50'}`}>
          <img src={post.imageUrl} className="w-full h-full object-cover" alt="" />
        </div>
      )}

      {post.tags && post.tags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {post.tags.map(tag => (
            <span key={tag} onClick={(e) => { e.stopPropagation(); onSearchHashtag && onSearchHashtag(tag); }} className={`text-[11px] font-black px-2 py-0.5 rounded cursor-pointer transition-colors ${isNews ? 'text-orange-600 bg-orange-50 hover:bg-orange-100' : 'text-blue-600 bg-blue-50 hover:bg-blue-100'}`}>
              #{tag.replace(/\s+/g, '')}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-50 max-w-lg">
          {!isNews ? (
            <button onClick={(e) => { e.stopPropagation(); onLike(post.id); }} className={`flex items-center space-x-2 text-[13px] font-black ${post.userLiked ? 'text-red-500' : 'text-gray-400'}`}>
              <Heart size={18} fill={post.userLiked ? 'currentColor' : 'none'} />
              <span>{post.likes}</span>
            </button>
          ) : (
            <div className="flex items-center space-x-2 bg-orange-50/50 px-2 py-0.5 rounded-lg border border-orange-50" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => onVote(post.id, 'up')} className={post.userLiked ? 'text-green-600' : 'text-gray-400'}><ChevronUp size={18}/></button>
              <span className="text-[13px] font-black text-orange-700">{post.likes}</span>
              <button onClick={() => onVote(post.id, 'down')} className={post.userDownvoted ? 'text-orange-500' : 'text-gray-400'}><ChevronDown size={18}/></button>
            </div>
          )}
          
          <div className="flex items-center space-x-2 text-[13px] text-gray-400 font-black">
            <MessageSquare size={18} />
            <span>{post.comments}</span>
          </div>
          
          <button onClick={(e) => { e.stopPropagation(); setIsShareModalOpen(true); }} className="text-gray-300 hover:text-gray-500 p-1 rounded-lg transition-all">
            <Share2 size={18} />
          </button>
      </div>
      {isDetailsOpen && <PostDetailsModal post={post} onClose={() => setIsDetailsOpen(false)} onAddComment={onAddComment} onLike={onLike} onVote={onVote} onSearchHashtag={onSearchHashtag} />}
      {isShareModalOpen && <ShareModal post={post} onClose={() => setIsShareModalOpen(false)} onShare={onSharePost} />}
    </div>
  );
};
