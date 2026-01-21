
import React, { useState, useRef } from 'react';
import { Post, User } from '../types';
import { MessageSquare, Heart, Share2, Image as ImageIcon, Paperclip, Clapperboard, Smile, X, Send, MoreHorizontal, FileText, Trash2 } from 'lucide-react';
import { PostDetailsModal } from './PostDetailsModal';
import { QuickCommentModal } from './QuickCommentModal';
import { ShareModal } from './ShareModal';
import { UserInfoDropdown } from './UserInfoDropdown';

interface SocialFeedProps {
  posts: Post[];
  user: User;
  onLike: (id: string) => void;
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

export const SocialFeed: React.FC<SocialFeedProps> = ({ 
  posts, 
  user, 
  onLike, 
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
  const [content, setContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<{name: string, url: string} | null>(null);
  const [sharingPost, setSharingPost] = useState<Post | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

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
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex space-x-4">
          <img src={user.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
          <form onSubmit={handleSubmit} className="flex-1">
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="¿Qué está pasando?"
              className="w-full bg-transparent border-none text-xl placeholder-gray-500 focus:ring-0 resize-none min-h-[60px] mt-1"
            />
            
            {selectedImage && (
              <div className="relative mt-3 rounded-xl overflow-hidden border border-gray-100">
                <img src={selectedImage} alt="Preview" className="w-full h-auto max-h-80 object-cover" />
                <button type="button" onClick={() => setSelectedImage(null)} className="absolute top-2 right-2 p-1.5 bg-gray-900/60 text-white rounded-full hover:bg-gray-900"><X size={14} /></button>
              </div>
            )}

            {selectedDoc && (
              <div className="mt-3 flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-xl">
                <div className="flex items-center space-x-2">
                  <FileText className="text-blue-600" size={18} />
                  <span className="text-xs font-bold text-blue-800 truncate max-w-[200px]">{selectedDoc.name}</span>
                </div>
                <button type="button" onClick={() => setSelectedDoc(null)} className="text-blue-400 hover:text-blue-600"><X size={16} /></button>
              </div>
            )}

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
              <div className="flex items-center space-x-1">
                <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageUpload} />
                <input type="file" ref={docInputRef} hidden accept=".pdf,.doc,.docx" onChange={handleDocUpload} />
                
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors" title="Imagen"><ImageIcon size={20} /></button>
                <button type="button" className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors opacity-50 cursor-not-allowed" title="Video (Proximamente)"><Clapperboard size={20} /></button>
                <button type="button" onClick={insertEmoji} className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors" title="Emoji"><Smile size={20} /></button>
                <button type="button" onClick={() => docInputRef.current?.click()} className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors" title="Adjuntar Documento"><Paperclip size={20} /></button>
              </div>
              <button 
                type="submit" 
                disabled={!content.trim() && !selectedImage && !selectedDoc}
                className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold text-sm disabled:opacity-50 transition-all hover:bg-blue-700 shadow-md shadow-blue-100"
              >
                Publicar
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="space-y-4">
        {posts.map(post => (
          <PostCard 
            key={post.id} 
            post={post} 
            onLike={onLike} 
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

const PostCard: React.FC<{ post: Post, onLike: (id: string) => void, onAddComment: (postId: string, text: string) => void, onDeletePost?: (id: string) => void, onSearchHashtag?: (tag: string) => void, onSharePost?: (postId: string, participant: any) => void, onNavigateToProfile?: (userId: string) => void, onOpenShare: (post: Post) => void, currentUser: User, followedUserIds: Set<string>, followerUserIds: Set<string>, onToggleFollow?: (userId: string) => void, users: User[] }> = ({ post, onLike, onAddComment, onDeletePost, onSearchHashtag, onSharePost, onNavigateToProfile, onOpenShare, currentUser, followedUserIds, followerUserIds, onToggleFollow, users }) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isNews = post.type === 'news';

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (post.authorId === currentUser.id) {
      onNavigateToProfile?.(post.authorId);
    } else {
      setShowUserInfo(!showUserInfo);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    onDeletePost?.(post.id);
  };

  return (
    <div 
      className="bg-white p-5 rounded-2xl border border-gray-100 hover:bg-gray-50/50 transition-all cursor-pointer group flex space-x-3 shadow-sm"
      onClick={() => setIsDetailsOpen(true)}
    >
      <div className="relative flex-shrink-0">
        <img 
          src={post.authorAvatar} 
          className="w-10 h-10 rounded-full object-cover cursor-pointer" 
          onClick={handleAuthorClick}
          alt="" 
        />
        {showUserInfo && (
          <UserInfoDropdown 
            userId={post.authorId} 
            onClose={() => setShowUserInfo(false)} 
            onNavigate={(id) => onNavigateToProfile?.(id)} 
            isFollowed={followedUserIds.has(post.authorId)}
            isFollower={followerUserIds.has(post.authorId)}
            onToggleFollow={onToggleFollow}
            users={users}
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 truncate">
            <span 
              className="font-bold text-gray-900 hover:underline text-[15px] cursor-pointer"
              onClick={handleAuthorClick}
            >
              {post.authorName}
            </span>
            <span className="text-gray-500 text-sm font-medium">@{post.authorName.toLowerCase().replace(/\s/g, '')}</span>
            <span className="text-gray-300">·</span>
            <span className="text-gray-500 text-sm">{new Date(post.timestamp).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
          </div>
          
          {post.authorId === currentUser.id && (
            <div className="relative">
              <button 
                onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                className={`p-1 rounded-full transition-all ${isMenuOpen ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-blue-500'}`}
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
        
        <p className={`text-[11px] font-bold mb-1 uppercase tracking-tight ${isNews ? 'text-orange-500' : 'text-blue-500'}`}>{post.authorPosition}</p>
        
        <div className="text-gray-900 text-[15px] leading-relaxed py-2 whitespace-pre-wrap">{post.content}</div>

        {post.imageUrl && (
          <div className="mb-3 rounded-xl overflow-hidden border border-gray-100">
            <img src={post.imageUrl} alt="Content" className="w-full h-auto max-h-[500px] object-cover" />
          </div>
        )}

        {post.docUrl && (
          <div className="mb-3 flex items-center space-x-3 p-3 bg-gray-50 border border-gray-100 rounded-xl">
            <FileText className="text-gray-400" size={20} />
            <span className="text-xs font-bold text-gray-600 truncate">{post.docName || 'Documento adjunto'}</span>
          </div>
        )}

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {post.tags.map(tag => (
              <span 
                key={tag} 
                onClick={(e) => { e.stopPropagation(); onSearchHashtag?.(tag); }}
                className={`text-sm font-medium ${isNews ? 'text-orange-500' : 'text-blue-500'} hover:underline cursor-pointer`}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between max-w-md text-gray-500 mt-2">
          <button 
            onClick={(e) => { e.stopPropagation(); onLike(post.id); }} 
            className={`flex items-center space-x-2 transition-colors group/btn ${post.userLiked ? 'text-pink-600' : 'hover:text-pink-600'}`}
          >
            <div className={`p-2 rounded-full transition-all ${post.userLiked ? 'bg-pink-50' : 'group-hover/btn:bg-pink-50'}`}><Heart size={18} fill={post.userLiked ? "currentColor" : "none"} /></div>
            <span className="text-sm font-medium">{post.likes}</span>
          </button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); setIsDetailsOpen(true); }}
            className="flex items-center space-x-2 hover:text-blue-500 transition-colors group/btn"
          >
            <div className="p-2 group-hover/btn:bg-blue-50 rounded-full transition-all"><MessageSquare size={18} /></div>
            <span className="text-sm font-medium">{post.comments}</span>
          </button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); onOpenShare(post); }}
            className="flex items-center space-x-2 hover:text-blue-500 transition-colors group/btn"
          >
            <div className="p-2 group-hover/btn:bg-blue-50 rounded-full transition-all"><Share2 size={18} /></div>
          </button>
        </div>
      </div>
      {isDetailsOpen && <PostDetailsModal post={post} onClose={() => setIsDetailsOpen(false)} onAddComment={onAddComment} onLike={onLike} onSearchHashtag={onSearchHashtag} />}
    </div>
  );
};
