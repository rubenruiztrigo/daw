
import React, { useState, useRef, useMemo } from 'react';
import { Post, User } from '../types';
import { ImageIcon, Paperclip, Clapperboard, Smile, X, FileText, Users, Sparkles } from 'lucide-react';
import { ShareModal } from './ShareModal';
import { PostCard } from './PostCard';

interface SocialFeedProps {
  posts: Post[];
  user: User;
  onLike: (id: string) => void;
  onVote?: (id: string, direction: 'up' | 'down') => void;
  onAddPost: (content: string, type: 'post' | 'news', tags: string[], imageUrl?: string, docUrl?: string, docName?: string) => void;
  onAddComment: (postId: string, text: string) => void;
  onDeletePost?: (postId: string) => void;
  onSearchHashtag?: (tag: string) => void;
  onSharePost?: (postId: string, participant: any) => void;
  onNavigateToProfile?: (userId: string) => void;
  followedUserIds?: Set<string>;
  followerUserIds?: Set<string>;
  onToggleFollow?: (userId: string) => void;
  users?: User[];
}

type FeedTab = 'for-you' | 'following';

export const SocialFeed: React.FC<SocialFeedProps> = ({ 
  posts, 
  user, 
  onLike, 
  onVote,
  onAddPost, 
  onAddComment, 
  onDeletePost,
  onSearchHashtag, 
  onSharePost, 
  onNavigateToProfile,
  followedUserIds = new Set(),
  followerUserIds = new Set(),
  onToggleFollow,
  users = []
}) => {
  const [activeTab, setActiveTab] = useState<FeedTab>('for-you');
  const [content, setContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<{name: string, url: string} | null>(null);
  const [sharingPost, setSharingPost] = useState<Post | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const filteredPosts = useMemo(() => {
    if (activeTab === 'following') {
      return posts.filter(post => followedUserIds.has(post.authorId));
    }
    
    const myInterests = user.interests || [];
    
    return posts.filter(post => {
      if (post.authorId === user.id) return true;
      const author = users.find(u => u.id === post.authorId);
      if (!author) return false;
      const authorInterests = author.interests || [];
      return authorInterests.some(interest => myInterests.includes(interest));
    });
  }, [posts, activeTab, followedUserIds, users, user]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedDoc({
        name: file.name,
        url: URL.createObjectURL(file)
      });
    }
  };

  const insertEmoji = () => {
    setContent(prev => prev + " 😊");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !selectedImage && !selectedDoc) return;
    const tags = content.match(/#[\wáéíóúÁÉÍÓÚñÑ]+/g)?.map(t => t.slice(1)) || [];
    onAddPost(
      content, 
      'post', 
      tags, 
      selectedImage || undefined, 
      selectedDoc?.url, 
      selectedDoc?.name
    );
    setContent('');
    setSelectedImage(null);
    setSelectedDoc(null);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-20">
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md border-b border-gray-100 dark:border-zinc-900 flex rounded-b-2xl shadow-sm mb-2">
        <button 
          onClick={() => setActiveTab('for-you')} 
          className="flex-1 py-4 text-sm font-bold relative group transition-all"
        >
          <span className={activeTab === 'for-you' ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-zinc-600'}>Para ti</span>
          {activeTab === 'for-you' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-blue-600 rounded-full" />}
        </button>
        <button 
          onClick={() => setActiveTab('following')} 
          className="flex-1 py-4 text-sm font-bold relative group transition-all"
        >
          <span className={activeTab === 'following' ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-zinc-600'}>Siguiendo</span>
          {activeTab === 'following' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-blue-600 rounded-full" />}
        </button>
      </div>

      <div className="bg-white dark:bg-[#111] p-5 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
        <div className="flex space-x-4">
          <img src={user.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
          <form onSubmit={handleSubmit} className="flex-1">
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="¿Qué está pasando?"
              className="w-full bg-transparent border-none text-xl dark:text-white placeholder-gray-500 focus:ring-0 resize-none min-h-[60px] mt-1"
            />
            
            {selectedImage && (
              <div className="relative mt-3 rounded-xl overflow-hidden border border-gray-100 dark:border-zinc-800">
                <img src={selectedImage} alt="Preview" className="w-full h-auto max-h-80 object-cover" />
                <button type="button" onClick={() => setSelectedImage(null)} className="absolute top-2 right-2 p-1.5 bg-gray-900/60 text-white rounded-full hover:bg-gray-900"><X size={14} /></button>
              </div>
            )}

            {selectedDoc && (
              <div className="mt-3 flex items-center justify-between p-3 bg-blue-50 dark:bg-zinc-900 border border-blue-100 dark:border-zinc-800 rounded-xl">
                <div className="flex items-center space-x-2">
                  <FileText className="text-blue-600" size={18} />
                  <span className="text-xs font-bold text-blue-800 dark:text-blue-300 truncate max-w-[200px]">{selectedDoc.name}</span>
                </div>
                <button type="button" onClick={() => setSelectedDoc(null)} className="text-blue-400 hover:text-blue-600"><X size={16} /></button>
              </div>
            )}

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50 dark:border-zinc-800">
              <div className="flex items-center space-x-1">
                <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageUpload} />
                <input type="file" ref={docInputRef} hidden accept=".pdf,.doc,.docx" onChange={handleDocUpload} />
                
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-zinc-800 rounded-full transition-colors" title="Imagen"><ImageIcon size={20} /></button>
                <button type="button" className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-zinc-800 rounded-full transition-colors opacity-50 cursor-not-allowed" title="Video (Proximamente)"><Clapperboard size={20} /></button>
                <button type="button" onClick={insertEmoji} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-zinc-800 rounded-full transition-colors" title="Emoji"><Smile size={20} /></button>
                <button type="button" onClick={() => docInputRef.current?.click()} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-zinc-800 rounded-full transition-colors" title="Adjuntar Documento"><Paperclip size={20} /></button>
              </div>
              <button 
                type="submit" 
                disabled={!content.trim() && !selectedImage && !selectedDoc}
                className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold text-sm disabled:opacity-50 transition-all hover:bg-blue-700 shadow-md shadow-blue-100 dark:shadow-none"
              >
                Publicar
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="space-y-4">
        {filteredPosts.length > 0 ? (
          filteredPosts.map(post => (
            <PostCard 
              key={post.id} 
              post={post} 
              onLike={onLike}
              onVote={onVote}
              onAddComment={onAddComment} 
              onDeletePost={onDeletePost}
              onSearchHashtag={onSearchHashtag} 
              onSharePost={onSharePost} 
              onNavigateToProfile={onNavigateToProfile}
              onOpenShare={setSharingPost}
              currentUser={user}
              followedUserIds={followedUserIds}
              followerUserIds={followerUserIds}
              onToggleFollow={onToggleFollow}
              users={users}
            />
          ))
        ) : (
          <div className="text-center py-20 bg-white dark:bg-[#111] rounded-[2.5rem] border border-dashed border-slate-200 dark:border-zinc-800 px-10">
            <div className="mx-auto w-16 h-16 bg-slate-50 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-4">
              {activeTab === 'for-you' ? <Sparkles className="text-blue-500" size={32} /> : <Users className="text-slate-200 dark:text-zinc-800" size={32} />}
            </div>
            <h4 className="text-slate-900 dark:text-white font-black mb-2">
              {activeTab === 'for-you' ? "Feed personalizado vacío" : "Aún no sigues a nadie"}
            </h4>
            <p className="text-slate-400 font-medium text-sm italic">
              {activeTab === 'for-you' 
                ? "No hemos encontrado posts de usuarios con intereses similares a los tuyos. ¡Prueba a añadir más intereses en tu perfil!" 
                : "Sigue a tus colegas para ver sus actualizaciones aquí."}
            </p>
          </div>
        )}
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
