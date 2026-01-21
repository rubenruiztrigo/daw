
import React, { useState, useRef, useMemo } from 'react';
import { Post, User } from '../types';
import { MessageSquare, Share2, Image as ImageIcon, X, MoreHorizontal, ChevronUp, ChevronDown, Newspaper, FileText, Smile, Trash2, Trophy, Heart } from 'lucide-react';
import { PostDetailsModal } from './PostDetailsModal';
import { ShareModal } from './ShareModal';
import { UserInfoDropdown } from './UserInfoDropdown';

interface NewsHubViewProps {
  posts: Post[];
  user: User;
  onVote: (id: string, direction: 'up' | 'down') => void;
  onAddPost: (content: string, type: 'post' | 'news', tags: string[], imageUrl?: string) => void;
  onAddComment: (postId: string, text: string) => void;
  onDeletePost?: (postId: string) => void;
  onSearchHashtag?: (tag: string) => void;
  onSharePost?: (postId: string, participant: any) => void;
  onNavigateToProfile?: (userId: string) => void;
  currentUser: User;
  followedUserIds?: Set<string>;
  followerUserIds?: Set<string>;
  onToggleFollow?: (userId: string) => void;
  users?: User[];
}

type NewsTab = 'latest' | 'popular' | 'ranking';

export const NewsHubView: React.FC<NewsHubViewProps> = ({ 
  posts, 
  user, 
  onVote, 
  onAddPost, 
  onAddComment, 
  onDeletePost,
  onSearchHashtag, 
  onSharePost, 
  onNavigateToProfile, 
  currentUser,
  followedUserIds = new Set(),
  followerUserIds = new Set(),
  onToggleFollow,
  users = []
}) => {
  const [activeTab, setActiveTab] = useState<NewsTab>('latest');
  const [newsContent, setNewsContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [sharingPost, setSharingPost] = useState<Post | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitNews = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsContent.trim() && !selectedImage) return;
    const tags = newsContent.match(/#[\wáéíóúÁÉÍÓÚñÑ]+/g)?.map(t => t.slice(1)) || [];
    onAddPost(newsContent, 'news', tags, selectedImage || undefined);
    setNewsContent('');
    setSelectedImage(null);
  };

  const sortedNews = useMemo(() => {
    let filtered = [...posts];
    
    if (activeTab === 'ranking') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      // Filtrar noticias de los últimos 7 días
      filtered = filtered.filter(p => new Date(p.timestamp) >= sevenDaysAgo);
      
      // Ordenar por puntuación NETA (likes_count en DB), pero mostraremos upvotes en la UI
      return filtered
        .sort((a, b) => (b.likes || 0) - (a.likes || 0))
        .slice(0, 10);
    }

    if (activeTab === 'popular') {
      return filtered.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    }

    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [posts, activeTab]);

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-20">
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex rounded-b-2xl shadow-sm mb-2">
        <button onClick={() => setActiveTab('latest')} className="flex-1 py-4 text-sm font-bold relative group">
          <span className={activeTab === 'latest' ? 'text-gray-900' : 'text-gray-400'}>Recientes</span>
          {activeTab === 'latest' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-orange-500 rounded-full" />}
        </button>
        <button onClick={() => setActiveTab('popular')} className="flex-1 py-4 text-sm font-bold relative group">
          <span className={activeTab === 'popular' ? 'text-gray-900' : 'text-gray-400'}>Relevantes</span>
          {activeTab === 'popular' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-1 bg-orange-500 rounded-full" />}
        </button>
        <button onClick={() => setActiveTab('ranking')} className="flex-1 py-4 text-sm font-bold relative group">
          <span className={activeTab === 'ranking' ? 'text-gray-900' : 'text-gray-400'}>Ranking Semanal</span>
          {activeTab === 'ranking' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-1 bg-orange-500 rounded-full" />}
        </button>
      </div>

      {activeTab !== 'ranking' && (
        <div className="bg-white p-5 rounded-2xl border border-orange-50 shadow-sm animate-in fade-in duration-300">
          <div className="flex space-x-4">
            <img src={user.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
            <form onSubmit={handleSubmitNews} className="flex-1">
              <textarea 
                value={newsContent}
                onChange={(e) => setNewsContent(e.target.value)}
                placeholder="¿Qué novedad institucional deseas compartir?"
                className="w-full bg-transparent border-none text-xl placeholder-gray-500 focus:ring-0 resize-none min-h-[60px] mt-1"
              />
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                <div className="flex items-center space-x-1">
                  <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageUpload} />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-orange-500 hover:bg-orange-50 rounded-full transition-colors"><ImageIcon size={20} /></button>
                </div>
                <button 
                  type="submit" 
                  disabled={!newsContent.trim() && !selectedImage}
                  className="bg-orange-600 text-white px-6 py-2 rounded-full font-bold text-sm hover:bg-orange-700 transition-all shadow-md shadow-orange-100"
                >
                  Publicar Noticia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {activeTab === 'ranking' && sortedNews.length > 0 && (
          <div className="flex items-center space-x-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-xl w-fit mx-auto mb-4 border border-orange-100 animate-pulse">
            <Trophy size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Top 10 de la última semana</span>
          </div>
        )}
        
        {sortedNews.map((post, index) => (
          activeTab === 'ranking' ? (
            <RankingCard 
              key={post.id} 
              post={post} 
              rank={index + 1}
              onVote={onVote}
              onAddComment={onAddComment}
              currentUser={currentUser}
              onNavigateToProfile={onNavigateToProfile}
            />
          ) : (
            <NewsCard 
              key={post.id} 
              post={post} 
              onVote={onVote} 
              onAddComment={onAddComment} 
              onDeletePost={onDeletePost}
              onSearchHashtag={onSearchHashtag} 
              onSharePost={onSharePost} 
              onNavigateToProfile={onNavigateToProfile} 
              onOpenShare={setSharingPost}
              currentUser={currentUser}
              followedUserIds={followedUserIds}
              followerUserIds={followerUserIds}
              onToggleFollow={onToggleFollow}
              users={users}
            />
          )
        ))}
      </div>

      {sharingPost && (
        <ShareModal 
          post={sharingPost} 
          onClose={() => setSharingPost(null)} 
          onShare={onSharePost}
        />
      )}
    </div>
  );
};

const RankingCard: React.FC<{ post: Post, rank: number, onVote: (id: string, dir: 'up' | 'down') => void, onAddComment: (id: string, text: string) => void, currentUser: User, onNavigateToProfile?: (id: string) => void }> = ({ post, rank, onVote, onAddComment, currentUser, onNavigateToProfile }) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  return (
    <div 
      className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center space-x-6 cursor-pointer hover:shadow-md transition-all group animate-in slide-in-from-bottom-4"
      onClick={() => setIsDetailsOpen(true)}
    >
      <div className={`text-4xl font-black w-14 text-center italic ${rank <= 3 ? 'text-orange-500 scale-110' : 'text-slate-300'}`}>
        #{rank}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-3 mb-2">
          <img src={post.authorAvatar} className="w-8 h-8 rounded-xl object-cover" alt="" />
          <span className="font-bold text-gray-400 text-[10px] uppercase tracking-widest truncate">{post.authorName}</span>
        </div>
        <p className="text-gray-900 font-bold text-lg leading-snug line-clamp-2">{post.content}</p>
        
        <div className="flex items-center space-x-4 mt-3">
          <div className="flex items-center space-x-1.5 bg-green-50 text-green-600 px-3 py-1 rounded-xl border border-green-100">
             <ChevronUp size={16} strokeWidth={3} />
             <span className="text-xs font-black">{post.upvotes || 0}</span>
          </div>
          <div className="flex items-center space-x-1.5 bg-blue-50 text-blue-600 px-3 py-1 rounded-xl border border-blue-100">
             <MessageSquare size={16} strokeWidth={3} />
             <span className="text-xs font-black">{post.comments}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center p-2 rounded-3xl bg-slate-50 border border-slate-100 min-w-[64px]" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => onVote(post.id, 'up')} className={`p-1.5 rounded-xl transition-all ${post.userLiked ? 'text-green-600 bg-green-200' : 'text-slate-400 hover:text-green-600'}`}>
          <ChevronUp size={28} strokeWidth={3} />
        </button>
        <button onClick={() => onVote(post.id, 'down')} className={`p-1.5 rounded-xl transition-all ${post.userDownvoted ? 'text-red-500 bg-red-100' : 'text-slate-400 hover:text-red-500'}`}>
          <ChevronDown size={28} strokeWidth={3} />
        </button>
      </div>

      {isDetailsOpen && <PostDetailsModal post={post} onClose={() => setIsDetailsOpen(false)} onAddComment={onAddComment} onVote={onVote} />}
    </div>
  );
};

const NewsCard: React.FC<{ post: Post, onVote: (id: string, dir: 'up' | 'down') => void, onAddComment: (postId: string, text: string) => void, onDeletePost?: (id: string) => void, onSearchHashtag?: (tag: string) => void, onSharePost?: (postId: string, participant: any) => void, onNavigateToProfile?: (userId: string) => void, onOpenShare: (post: Post) => void, currentUser: User, followedUserIds: Set<string>, followerUserIds: Set<string>, onToggleFollow?: (userId: string) => void, users: User[] }> = ({ post, onVote, onAddComment, onDeletePost, onSearchHashtag, onSharePost, onNavigateToProfile, onOpenShare, currentUser, followedUserIds, followerUserIds, onToggleFollow, users }) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  return (
    <div className="bg-white p-5 rounded-2xl border border-orange-50 hover:bg-gray-50/50 transition-all cursor-pointer flex space-x-3 shadow-sm" onClick={() => setIsDetailsOpen(true)}>
      <img src={post.authorAvatar} className="w-10 h-10 rounded-full object-cover flex-shrink-0" alt="" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-1 truncate">
            <span className="font-bold text-gray-900 text-[15px]">{post.authorName}</span>
            <span className="text-gray-300">·</span>
            <span className="text-gray-500 text-sm">{new Date(post.timestamp).toLocaleDateString()}</span>
          </div>
        </div>
        <p className="text-[11px] font-bold mb-1 text-orange-500 uppercase tracking-tight">{post.authorPosition}</p>
        <div className="text-gray-900 text-[15px] leading-relaxed py-2 whitespace-pre-wrap line-clamp-3">{post.content}</div>

        <div className="flex items-center space-x-8 text-gray-500 mt-2" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center space-x-1.5 group cursor-pointer" onClick={() => onVote(post.id, 'up')}>
            <div className={`p-1.5 rounded-full transition-all ${post.userLiked ? 'text-green-600 bg-green-50' : 'group-hover:text-green-600'}`}>
              <ChevronUp size={24} strokeWidth={3} />
            </div>
            <span className="text-sm font-black text-gray-900">{post.upvotes || 0}</span>
          </div>

          <div className="flex items-center space-x-1.5 group cursor-pointer" onClick={() => onVote(post.id, 'down')}>
            <div className={`p-1.5 rounded-full transition-all ${post.userDownvoted ? 'text-red-500 bg-red-50' : 'group-hover:text-red-500'}`}>
              <ChevronDown size={24} strokeWidth={3} />
            </div>
          </div>

          <button onClick={() => setIsDetailsOpen(true)} className="flex items-center space-x-2 hover:text-blue-500 transition-colors">
            <MessageSquare size={18} strokeWidth={3} />
            <span className="text-sm font-black text-gray-900">{post.comments}</span>
          </button>
        </div>
      </div>
      {isDetailsOpen && <PostDetailsModal post={post} onClose={() => setIsDetailsOpen(false)} onAddComment={onAddComment} onVote={onVote} onSearchHashtag={onSearchHashtag} />}
    </div>
  );
};
