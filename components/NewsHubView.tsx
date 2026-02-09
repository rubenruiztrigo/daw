import React, { useState, useRef, useMemo } from 'react';
import { Post, User } from '../types';
import { ImageIcon, ChevronUp, Trophy, Clock, Sparkles } from 'lucide-react';
import { NewsCard } from './NewsCard';
import { RankingHistoryModal } from './RankingHistoryModal';

interface NewsHubViewProps {
  posts: Post[];
  user: User;
  onVote: (id: string, direction: 'up' | 'down') => void;
  onRepost: (id: string) => void;
  onAddPost: (content: string, type: 'post' | 'news', tags: string[], imageUrl?: string) => void;
  onAddComment: (postId: string, text: string) => void;
  onDeletePost?: (postId: string) => void;
  onNavigateToProfile?: (userId: string) => void;
  // Fix: Removed duplicate onNavigateToPost identifiers
  onNavigateToPost?: (postId: string) => void;
  onSearchHashtag?: (tag: string) => void;
  currentUser: User;
  followedUserIds?: Set<string>;
  users?: User[];
}

type NewsTab = 'latest' | 'popular' | 'ranking';

export const NewsHubView: React.FC<NewsHubViewProps> = ({
  posts, user, onVote, onRepost, onAddPost, onAddComment, onNavigateToProfile, onNavigateToPost, onSearchHashtag, currentUser, followedUserIds = new Set(), users = []
}) => {
  // State for history modal
  const [activeTab, setActiveTab] = useState<NewsTab>('latest');
  const [newsContent, setNewsContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showHistory, setShowHistory] = useState(false);

  const sortedNews = useMemo(() => {
    // ... (existing logic)
    let filtered = [...posts];
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);

    if (activeTab === 'latest') {
      return filtered
        .filter(n => new Date(n.timestamp).getTime() > twentyFourHoursAgo)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }

    const getScore = (n: Post) => {
      const up = n.upvotes !== undefined ? n.upvotes : 0;
      const down = n.downvotes !== undefined ? n.downvotes : 0;
      // Fallback to 'likes' if up/down are 0/undefined (legacy compatibility)
      if (n.upvotes === undefined && n.downvotes === undefined) return n.likes || 0;
      return up - down;
    };

    if (activeTab === 'ranking') {
      const now = new Date();
      const day = now.getDay(); // 0 (Sun) - 6 (Sat)
      const daysSinceMonday = (day + 6) % 7; // Mon=0, Tue=1, ..., Sun=6

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
        .sort((a, b) => getScore(b) - getScore(a))
        .slice(0, 5);
    }

    if (activeTab === 'popular') {
      // Filtrar para mostrar solo noticias relevantes (por votos) publicadas en las últimas 24h
      return filtered
        .filter(n => new Date(n.timestamp).getTime() > twentyFourHoursAgo)
        .sort((a, b) => getScore(b) - getScore(a));
    }

    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [posts, activeTab]);

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-20">
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md border-b border-gray-100 dark:border-zinc-900 flex items-center justify-between px-4 rounded-b-2xl mb-2 h-14">
        <div className="flex items-center gap-x-6 flex-1 justify-center">
          <button onClick={() => setActiveTab('latest')} className="px-4 py-4 text-sm font-bold relative group">
            <span className={activeTab === 'latest' ? 'text-gray-900 dark:text-white' : 'text-gray-400'}>Última hora</span>
            {activeTab === 'latest' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-500 rounded-full" />}
          </button>
          <button onClick={() => setActiveTab('popular')} className="px-4 py-4 text-sm font-bold relative group">
            <span className={activeTab === 'popular' ? 'text-gray-900 dark:text-white' : 'text-gray-400'}>Más relevante (24h)</span>
            {activeTab === 'popular' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-500 rounded-full" />}
          </button>
          <button onClick={() => setActiveTab('ranking')} className="px-4 py-4 text-sm font-bold relative group">
            <span className={activeTab === 'ranking' ? 'text-gray-900 dark:text-white' : 'text-gray-400'}>Top ranking</span>
            {activeTab === 'ranking' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-500 rounded-full" />}
          </button>
        </div>
        {activeTab === 'ranking' && (
          <button
            onClick={() => setShowHistory(true)}
            className="p-2 text-gray-500 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-zinc-800 rounded-full transition-colors absolute right-4"
            title="Ver historial de ranking"
          >
            <Trophy size={20} />
          </button>
        )}
      </div>

      {showHistory && (
        <RankingHistoryModal
          badges={currentUser.badges || []}
          onClose={() => setShowHistory(false)}
        />
      )}

      {activeTab !== 'ranking' ? (
        <>
          <div className="bg-white dark:bg-[#111] rounded-[2rem] border border-slate-300 dark:border-slate-700 overflow-hidden">
            <div className="flex space-x-4 p-5">
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
                  placeholder="Comparte tu noticia"
                  className="w-full bg-transparent border-none text-xl dark:text-white placeholder-gray-400 focus:ring-0 resize-none min-h-[80px] p-2"
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
                  <button type="submit" className="bg-orange-600 text-white px-6 py-2 rounded-full font-bold text-sm">Publicar</button>
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
                  {activeTab === 'latest' ? "Sin noticias en las últimas 24h" : "No hay noticias relevantes hoy"}
                </h4>
                <p className="text-slate-400 font-medium text-sm italic mb-6">
                  {activeTab === 'latest'
                    ? "Parece que hoy está todo tranquilo. ¡Sé el primero en informar a tus colegas!"
                    : "Parece que no hay noticias destacadas en las últimas 24 horas. ¡Sube tu aportación!"}
                </p>
                {activeTab === 'latest' && (
                  <button
                    onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-orange-600 text-white rounded-2xl font-black text-xs hover:bg-orange-700 transition-all"
                  >
                    {/* Fix: Changed invalid 'padding' tag to 'Sparkles' icon */}
                    <Sparkles size={16} />
                    <span>Publicar primicia</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="space-y-4 animate-in fade-in duration-500">
          <div className="flex items-center space-x-3 px-4 mb-2">
            <Trophy className="text-orange-500" size={24} />
            <h3 className="text-xl font-black text-gray-900 dark:text-white">Líderes de opinión</h3>
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
  );
};
