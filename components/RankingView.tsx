
import React from 'react';
import { Post } from '../types';
import { Trophy, Heart } from 'lucide-react';

export const RankingView: React.FC<{ posts: Post[], onLike: (id: string) => void }> = ({ posts, onLike }) => {
  const ranking = [...posts]
    .filter(p => p.type === 'news')
    .sort((a, b) => b.likes - a.likes)
    .slice(0, 10);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center space-x-4">
        <div className="p-3 bg-yellow-400 rounded-2xl text-white shadow-lg shadow-yellow-100">
          <Trophy size={28} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-gray-900">Ranking Semanal</h2>
          <p className="text-gray-500">Las noticias que más interés han despertado en la administración.</p>
        </div>
      </div>

      <div className="grid gap-4">
        {ranking.map((post, idx) => (
          <div key={post.id} className="bg-white rounded-2xl p-5 border border-gray-100 flex items-center space-x-6 hover:shadow-lg transition-all">
            <div className={`text-3xl font-black ${idx < 3 ? 'text-blue-600' : 'text-gray-200'} w-8`}>
              {idx + 1}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <img src={post.authorAvatar} className="w-6 h-6 rounded-full" alt="" />
                <span className="text-xs font-bold text-gray-500 uppercase">{post.authorName}</span>
              </div>
              <p className="text-gray-900 font-bold line-clamp-2">{post.content}</p>
            </div>

            <button 
              onClick={() => onLike(post.id)}
              className={`flex flex-col items-center justify-center p-3 rounded-xl min-w-[70px] transition-all ${post.userLiked ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
            >
              <Heart size={20} fill={post.userLiked ? "currentColor" : "none"} />
              <span className="font-black text-xs mt-1">{post.likes}</span>
            </button>
          </div>
        ))}
        {ranking.length === 0 && (
          <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
            <p className="text-gray-400 font-bold italic">Aún no hay noticias destacadas esta semana.</p>
          </div>
        )}
      </div>
    </div>
  );
};
