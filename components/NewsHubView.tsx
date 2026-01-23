
import React, { useState, useRef, useMemo } from 'react';
import { Post, User } from '../types';
import { ImageIcon, ChevronUp, Trophy, Sparkles } from 'lucide-react';
import { NewsCard } from './NewsCard';

interface NewsHubViewProps {
  posts: Post[];
  user: User;
  onVote: (id: string, direction: 'up' | 'down') => void;
  onAddPost: (content: string, type: 'post' | 'news', tags: string[], imageUrl?: string) => void;
  onAddComment: (postId: string, text: string) => void;
  onDeletePost?: (postId: string) => void;
  onNavigateToProfile?: (userId: string) => void;
  onSearchHashtag?: (tag: string) => void;
  currentUser: User;
  followedUserIds?: Set<string>;
  users?: User[];
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onSearchSubmit?: (query: string) => void;
}

type NewsTab = 'latest' | 'popular' | 'ranking';

export const NewsHubView: React.FC<NewsHubViewProps> = ({ 
  posts, user, onVote, onAddPost, onAddComment, onNavigateToProfile, onSearchHashtag, currentUser, followedUserIds = new Set(), users = []
}) => {
  const [activeTab, setActiveTab] = useState<NewsTab>('latest');
  const [newsContent, setNewsContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sortedNews = useMemo(() => {
    let filtered = [...posts];
    if (activeTab === 'ranking') return filtered.sort((a, b) => (b.likes || 0) - (a.likes || 0)).slice(0, 10);
    if (activeTab === 'popular') return filtered.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [posts, activeTab]);

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-20">
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md border-b border-gray-100 dark:border-zinc-900 flex items-center justify-center gap-x-10 px-4 rounded-b-2xl shadow-sm mb-2 h-14">
        <button onClick={() => setActiveTab('latest')} className="px-4 py-4 text-sm font-bold relative group">
          <span className={activeTab === 'latest' ? 'text-gray-900 dark:text-white' : 'text-gray-400'}>Última hora</span>
          {activeTab === 'latest' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-500 rounded-full" />}
        </button>
        <button onClick={() => setActiveTab('popular')} className="px-4 py-4 text-sm font-bold relative group">
          <span className={activeTab === 'popular' ? 'text-gray-900 dark:text-white' : 'text-gray-400'}>Más relevante</span>
          {activeTab === 'popular' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-500 rounded-full" />}
        </button>
        <button onClick={() => setActiveTab('ranking')} className="px-4 py-4 text-sm font-bold relative group">
          <span className={activeTab === 'ranking' ? 'text-gray-900 dark:text-white' : 'text-gray-400'}>Top ranking</span>
          {activeTab === 'ranking' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-500 rounded-full" />}
        </button>
      </div>

      {activeTab !== 'ranking' ? (
        <>
          <div className="bg-white dark:bg-[#111] p-5 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
            <div className="flex space-x-4">
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
                  placeholder="Comparte una primicia institucional..."
                  className="w-full bg-transparent border-none text-xl dark:text-white placeholder-gray-500 focus:ring-0 resize-none min-h-[60px]"
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
                  <button type="submit" className="bg-orange-600 text-white px-6 py-2 rounded-full font-bold text-sm shadow-lg">Publicar</button>
                </div>
              </form>
            </div>
          </div>
          <div className="space-y-4">
            {sortedNews.map(post => (
              <NewsCard 
                key={post.id} 
                post={post} 
                onVote={onVote} 
                onAddComment={onAddComment} 
                currentUser={currentUser} 
                followedUserIds={followedUserIds} 
                users={users} 
                onNavigateToProfile={onNavigateToProfile} 
                onSearchHashtag={onSearchHashtag} 
              />
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-4 animate-in fade-in duration-500">
          <div className="flex items-center space-x-3 px-4 mb-2">
            <Trophy className="text-orange-500" size={24} />
            <h3 className="text-xl font-black text-gray-900 dark:text-white">Líderes de opinión</h3>
          </div>
          {sortedNews.map((post, index) => (
            <div 
              key={post.id} 
              className="bg-white dark:bg-[#111] p-6 rounded-[2rem] border border-gray-50 dark:border-zinc-900 flex items-center shadow-sm hover:shadow-md transition-all group"
              onClick={() => onNavigateToProfile?.(post.authorId)}
            >
              <div className="w-16 flex-shrink-0">
                <span className="text-5xl font-black text-blue-600 dark:text-blue-500 italic">
                  {index + 1}
                </span>
              </div>
              <div className="flex-1 flex items-center space-x-4 min-w-0">
                <img src={post.authorAvatar} className="w-12 h-12 rounded-xl object-cover shadow-sm" alt="" />
                <div className="flex-1 min-w-0 pr-4">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">{post.authorName}</span>
                  <h4 className="text-gray-900 dark:text-white font-bold leading-snug line-clamp-2">{post.content}</h4>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center min-w-[70px] h-[84px] rounded-3xl bg-orange-50 dark:bg-orange-900/20 text-orange-500 border border-orange-100 dark:border-orange-900/30">
                <ChevronUp size={24} strokeWidth={4} />
                <span className="text-lg font-black mt-1 leading-none">{post.likes}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
