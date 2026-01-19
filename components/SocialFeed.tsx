
import React, { useState } from 'react';
import { Post, User } from '../types';
import { Send, Newspaper, MessageSquare, Heart, Share2 } from 'lucide-react';

interface SocialFeedProps {
  posts: Post[];
  user: User;
  onLike: (id: string) => void;
  onAddPost: (content: string, type: 'post' | 'news', tags: string[]) => void;
}

export const SocialFeed: React.FC<SocialFeedProps> = ({ posts, user, onLike, onAddPost }) => {
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<'post' | 'news'>('post');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    const tags = content.match(/#\w+/g)?.map(t => t.slice(1)) || [];
    onAddPost(content, postType, tags);
    setContent('');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Create Post Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex space-x-4">
          <img src={user.avatar} className="w-12 h-12 rounded-full object-cover" alt="" />
          <form onSubmit={handleSubmit} className="flex-1 space-y-3">
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`¡Hola ${user.name.split(' ')[0]}! ¿Qué estás pensando?`}
              className="w-full bg-gray-50 border-none rounded-xl p-4 text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none resize-none min-h-[100px]"
            />
            <div className="flex items-center justify-between border-t border-gray-50 pt-3">
              <div className="flex space-x-1">
                <button 
                  type="button" 
                  onClick={() => setPostType('post')}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${postType === 'post' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  <MessageSquare size={16} />
                  <span>Post</span>
                </button>
                <button 
                  type="button" 
                  onClick={() => setPostType('news')}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${postType === 'news' ? 'bg-orange-100 text-orange-600' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  <Newspaper size={16} />
                  <span>Noticia</span>
                </button>
              </div>
              <button 
                type="submit" 
                disabled={!content.trim()}
                className="bg-blue-600 text-white px-5 py-2 rounded-full font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center space-x-2"
              >
                <span>Publicar</span>
                <Send size={16} />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {posts.map(post => (
          <PostCard key={post.id} post={post} onLike={onLike} />
        ))}
      </div>
    </div>
  );
};

const PostCard: React.FC<{ post: Post, onLike: (id: string) => void }> = ({ post, onLike }) => {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border ${post.type === 'news' ? 'border-orange-100' : 'border-gray-100'} p-6 transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <div className="flex space-x-3">
          <img src={post.authorAvatar} className="w-12 h-12 rounded-full object-cover" alt="" />
          <div>
            <h4 className="font-bold text-gray-900 leading-tight">{post.authorName}</h4>
            <p className="text-xs text-gray-500 font-medium">{post.authorPosition}</p>
            <p className="text-[10px] text-gray-400">{new Date(post.timestamp).toLocaleDateString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
        {post.type === 'news' && (
          <span className="bg-orange-50 text-orange-600 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">Noticia</span>
        )}
      </div>

      <div className="mt-4 text-gray-800 leading-relaxed whitespace-pre-wrap">
        {post.content}
      </div>

      {post.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {post.tags.map(tag => (
            <span key={tag} className="text-blue-600 text-sm font-semibold hover:underline cursor-pointer">#{tag}</span>
          ))}
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <button 
            onClick={() => onLike(post.id)}
            className={`flex items-center space-x-2 transition-all ${post.userLiked ? 'text-red-500 scale-110' : 'text-gray-400 hover:text-red-500'}`}
          >
            <Heart size={20} fill={post.userLiked ? "currentColor" : "none"} />
            <span className="text-sm font-bold">{post.likes}</span>
          </button>
          
          <button className="flex items-center space-x-2 text-gray-400 hover:text-blue-600 transition-all">
            <MessageSquare size={20} />
            <span className="text-sm font-medium">{post.comments}</span>
          </button>
        </div>
        
        <button className="text-gray-300 hover:text-gray-600 transition-all">
          <Share2 size={18} />
        </button>
      </div>
    </div>
  );
};
