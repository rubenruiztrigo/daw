
import React from 'react';
import { User, Post } from '../types';
import { Briefcase, MapPin, Users, Heart, Share2, Edit3 } from 'lucide-react';

export const ProfileView: React.FC<{ user: User, posts: Post[] }> = ({ user, posts }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
        <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700"></div>
        <div className="px-8 pb-8">
          <div className="relative flex justify-between items-end -mt-12 mb-6">
            <img 
              src={user.avatar} 
              className="w-32 h-32 rounded-3xl border-4 border-white object-cover shadow-lg" 
              alt={user.name} 
            />
            <div className="flex space-x-3 mb-2">
              <button className="p-3 bg-gray-100 text-gray-600 rounded-2xl hover:bg-gray-200 transition-all"><Share2 size={20}/></button>
              <button className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                <Edit3 size={18}/>
                <span>Editar Perfil</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-black text-gray-900">{user.name}</h1>
              <p className="text-blue-600 font-bold">{user.position} en {user.department}</p>
            </div>

            <p className="text-gray-600 max-w-2xl leading-relaxed">{user.bio}</p>

            <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2">
              <div className="flex items-center space-x-2 text-gray-500 font-medium">
                <Briefcase size={18} />
                <span>Sector Público</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-500 font-medium">
                <MapPin size={18} />
                <span>Madrid, España</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-gray-900 font-black">{user.followers} <span className="text-gray-400 font-bold">Seguidores</span></span>
                <span className="text-gray-900 font-black">{user.following} <span className="text-gray-400 font-bold">Siguiendo</span></span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-4">
              {user.interests.map(i => (
                <span key={i} className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">#{i}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Activity Tabs */}
      <div className="space-y-4">
        <div className="flex space-x-8 border-b border-gray-100 px-2">
          <button className="pb-4 border-b-4 border-blue-600 text-blue-600 font-black">Publicaciones ({posts.length})</button>
          <button className="pb-4 text-gray-400 font-bold hover:text-gray-600 transition-colors">Actividad</button>
          <button className="pb-4 text-gray-400 font-bold hover:text-gray-600 transition-colors">Logros</button>
        </div>

        <div className="grid gap-4">
          {posts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
              <p className="text-gray-400 font-bold">Aún no has compartido ninguna publicación.</p>
            </div>
          ) : (
            posts.map(post => (
              <div key={post.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                 <div className="text-[10px] text-gray-400 mb-2 uppercase font-black tracking-widest">{new Date(post.timestamp).toLocaleDateString()}</div>
                 <p className="text-gray-800 leading-relaxed mb-4">{post.content}</p>
                 <div className="flex items-center space-x-6 text-gray-400">
                    <div className="flex items-center space-x-1"><Heart size={16}/> <span className="text-sm font-bold">{post.upvotes}</span></div>
                    <div className="flex items-center space-x-1"><Users size={16}/> <span className="text-sm font-bold">{post.comments}</span></div>
                 </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
