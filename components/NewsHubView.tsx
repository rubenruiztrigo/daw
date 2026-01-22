
import React, { useState, useRef, useMemo } from 'react';
import { Post, User } from '../types';
import { ImageIcon, ChevronUp, ChevronDown, Newspaper } from 'lucide-react';
import { PostDetailsModal } from './PostDetailsModal';
import { NewsCard } from './NewsCard';

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
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md border-b border-gray-100 dark:border-zinc-900 flex rounded-b-2xl shadow-sm mb-2">
        <button onClick={() => setActiveTab('latest')} className="flex-1 py-4 text-sm font-bold relative group">
          <span className={activeTab === 'latest' ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-zinc-600'}>Última hora</span>
          {activeTab === 'latest' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-orange-500 rounded-full" />}
        </button>
        <button onClick={() => setActiveTab('popular')} className="flex-1 py-4 text-sm font-bold relative group">
          <span className={activeTab === 'popular' ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-zinc-600'}>Más relevante</span>
          {activeTab === 'popular' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-1 bg-orange-500 rounded-full" />}
        </button>
        <button onClick={() => setActiveTab('ranking')} className="flex-1 py-4 text-sm font-bold relative group">
          <span className={activeTab === 'ranking' ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-zinc-600'}>Top ranking</span>
          {activeTab === 'ranking' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-1 bg-orange-500 rounded-full" />}
        </button>
      </div>

      {activeTab !== 'ranking' && (
        <div className="bg-white dark:bg-[#111] p-5 rounded-2xl border border-orange-50 dark:border-zinc-800 shadow-sm">
          <div className="flex space-x-4">
            <img src={user.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
            <form onSubmit={handleSubmitNews} className="flex-1">
              <textarea 
                value={newsContent}
                onChange={(e) => setNewsContent(e.target.value)}
                placeholder="Comparte una primicia o actualización institucional..."
                className="w-full bg-transparent border-none text-xl dark:text-white placeholder-gray-500 focus:ring-0 resize-none min-h-[60px] mt-1"
              />
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50 dark:border-zinc-800">
                <div className="flex items-center space-x-1">
                  <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageUpload} />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-full transition-colors"><ImageIcon size={20} /></button>
                </div>
                <button type="submit" className="bg-orange-600 text-white px-6 py-2 rounded-full font-bold text-sm hover:bg-orange-700">Lanzar Noticia</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {sortedNews.map((post) => (
          <NewsCard 
            key={post.id} 
            post={post} 
            onVote={onVote} 
            onAddComment={onAddComment} 
            currentUser={currentUser}
            followedUserIds={followedUserIds}
            users={users}
            onNavigateToProfile={onNavigateToProfile}
          />
        ))}
      </div>
    </div>
  );
};
