
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { User, Post } from '../types';
import { Briefcase, MapPin, Share2, Edit3, Calendar, LayoutGrid, Newspaper, UserPlus, UserMinus, Camera, MessageCircle, Plus } from 'lucide-react';
import { EditProfileModal } from './EditProfileModal';
import { PreferencesModal } from './PreferencesModal';
import { ShareModal } from './ShareModal';
import { UsersListModal } from './UsersListModal';
import { PostCard } from './PostCard';
import { NewsCard } from './NewsCard';

interface ProfileViewProps {
  user: User;
  isCurrentUser: boolean;
  isFollowed?: boolean;
  isFollower?: boolean;
  onToggleFollow?: (userId: string) => void;
  onStartChat?: (user: User) => void;
  posts: Post[];
  onUpdateUser: (updatedUser: User) => void;
  onDeletePost?: (postId: string) => void;
  onNavigateToProfile?: (userId: string) => void;
  onShareProfile?: (userId: string, contact: any, isProfile: boolean) => void;
  onSharePost?: (postId: string, participant: any) => void;
  currentUser: User;
  onLike?: (id: string) => void;
  onVote?: (id: string, dir: 'up' | 'down') => void;
  onAddComment?: (postId: string, text: string) => void;
  users: User[];
}

type ProfileTab = 'posts' | 'news';

export const ProfileView: React.FC<ProfileViewProps> = ({ 
  user, isCurrentUser, isFollowed, isFollower, onToggleFollow, onStartChat, posts, 
  onUpdateUser, onDeletePost, onNavigateToProfile, currentUser, onLike, onVote, onAddComment, users
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPreferencesModalOpen, setIsPreferencesModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [viewingUsersList, setViewingUsersList] = useState<'followers' | 'following' | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');

  const joinedDateFormatted = useMemo(() => {
    const rawDate = user.joinedDate || new Date().toISOString();
    const date = new Date(rawDate);
    const month = date.toLocaleString('es-ES', { month: 'long' });
    return `Se unió en ${month} de ${date.getFullYear()}`;
  }, [user.joinedDate]);

  const userPosts = useMemo(() => posts.filter(p => p.authorId === user.id && p.type === 'post'), [posts, user.id]);
  const userNews = useMemo(() => posts.filter(p => p.authorId === user.id && p.type === 'news'), [posts, user.id]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Profile Header */}
      <div className="bg-white dark:bg-[#111] rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100 dark:border-zinc-800">
        <div 
          className="h-48 relative overflow-hidden bg-slate-200 dark:bg-zinc-800"
          style={{ backgroundImage: `url(${user.avatar})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
          <div className="absolute inset-0 bg-black/10 transition-opacity opacity-0 group-hover/banner:opacity-100"></div>
          {isCurrentUser && (
            <button className="absolute bottom-4 right-6 p-2.5 bg-white/20 backdrop-blur-md text-white rounded-xl hover:bg-white/30 transition-all border border-white/20 shadow-lg">
              <Camera size={20} />
            </button>
          )}
        </div>
        <div className="px-10 pb-10">
          <div className="relative flex flex-col md:flex-row justify-between items-start md:items-end -mt-12 mb-8 gap-6">
            <div className="relative flex-shrink-0">
              <img 
                src={user.avatar} 
                className="w-44 h-44 rounded-[2.5rem] border-8 border-white dark:border-zinc-800 object-cover shadow-2xl transition-all" 
                alt="" 
              />
            </div>
            
            <div className="flex-1 pt-6 md:pt-0">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">{user.name} {user.lastName}</h1>
              </div>
              <div className="flex flex-col space-y-1.5">
                <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 font-bold">
                  <Briefcase size={16} />
                  <span>{user.position} en {user.department}</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-gray-400 dark:text-zinc-500 font-medium text-sm">
                  <div className="flex items-center space-x-1.5"><MapPin size={14} /><span>{user.region}, {user.country}</span></div>
                  <div className="flex items-center space-x-1.5"><Calendar size={14} /><span>{joinedDateFormatted}</span></div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end space-y-4">
              <div className="flex items-center space-x-6 mr-2">
                <button onClick={() => setViewingUsersList('followers')} className="text-right group">
                  <p className="text-xl font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">{user.followers}</p>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Seguidores</p>
                </button>
                <button onClick={() => setViewingUsersList('following')} className="text-right group">
                  <p className="text-xl font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">{user.following}</p>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Siguiendo</p>
                </button>
              </div>

              <div className="flex items-center space-x-3">
                {isCurrentUser ? (
                  <>
                    <button onClick={() => setIsShareModalOpen(true)} className="p-3 bg-slate-50 dark:bg-zinc-900 text-slate-400 hover:text-blue-600 rounded-2xl border border-slate-100 dark:border-zinc-800 transition-all shadow-sm"><Share2 size={20}/></button>
                    <button onClick={() => setIsEditModalOpen(true)} className="bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-black text-sm shadow-xl shadow-blue-100 dark:shadow-none hover:bg-blue-700 transition-all transform active:scale-95 flex items-center space-x-2"><Edit3 size={18}/><span>Editar Perfil</span></button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setIsShareModalOpen(true)} className="p-3 bg-slate-50 dark:bg-zinc-900 text-slate-400 hover:text-blue-600 rounded-2xl border border-slate-100 dark:border-zinc-800 transition-all shadow-sm"><Share2 size={20}/></button>
                    <button onClick={() => onStartChat?.(user)} className="p-3 bg-slate-50 dark:bg-zinc-900 text-slate-400 hover:text-blue-600 rounded-2xl border border-slate-100 dark:border-zinc-800 transition-all shadow-sm"><MessageCircle size={20}/></button>
                    <button 
                      onClick={() => onToggleFollow?.(user.id)}
                      className={`px-8 py-3.5 rounded-2xl font-black text-sm transition-all transform active:scale-95 flex items-center space-x-2 ${isFollowed ? 'bg-slate-100 dark:bg-zinc-800 text-slate-500' : 'bg-blue-600 text-white shadow-xl shadow-blue-100 hover:bg-blue-700'}`}
                    >
                      {isFollowed ? <UserMinus size={18}/> : <UserPlus size={18}/>}
                      <span>{isFollowed ? 'Siguiendo' : 'Seguir'}</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-8 mt-4">
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-gray-400 dark:text-zinc-600 uppercase tracking-widest px-1">Biografía profesional</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed font-medium text-lg max-w-3xl">{user.bio || "Sin biografía todavía."}</p>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-gray-400 dark:text-zinc-600 uppercase tracking-widest px-1">Intereses</h3>
              <div className="flex flex-wrap gap-2 items-center">
                {user.interests && user.interests.length > 0 ? (
                  user.interests.map(interest => (
                    <span key={interest} className="px-4 py-2 bg-blue-50/50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-black border border-blue-100 dark:border-blue-900/20">{interest}</span>
                  ))
                ) : (
                  <span className="text-gray-400 italic text-sm font-medium">No hay intereses seleccionados.</span>
                )}
                {isCurrentUser && (
                  <button 
                    onClick={() => setIsPreferencesModalOpen(true)}
                    className="p-2 bg-slate-50 dark:bg-zinc-900 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-dashed border-blue-200 dark:border-blue-800"
                    title="Añadir o cambiar intereses"
                  >
                    <Plus size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="space-y-6">
        <div className="flex space-x-12 border-b border-gray-100 dark:border-zinc-900 px-6">
          <button 
            onClick={() => setActiveTab('posts')} 
            className={`pb-4 flex items-center space-x-2 transition-all relative ${activeTab === 'posts' ? 'text-blue-600 font-black' : 'text-gray-400 font-bold hover:text-gray-600'}`}
          >
            <LayoutGrid size={18} />
            <span>Posts ({userPosts.length})</span>
            {activeTab === 'posts' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full animate-in slide-in-from-left-2 duration-300"></div>}
          </button>
          <button 
            onClick={() => setActiveTab('news')} 
            className={`pb-4 flex items-center space-x-2 transition-all relative ${activeTab === 'news' ? 'text-orange-500 font-black' : 'text-gray-400 font-bold hover:text-gray-600'}`}
          >
            <Newspaper size={18} />
            <span>Noticias ({userNews.length})</span>
            {activeTab === 'news' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-500 rounded-full animate-in slide-in-from-left-2 duration-300"></div>}
          </button>
        </div>
        
        <div className="grid gap-6">
          {activeTab === 'posts' && (
            userPosts.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-[#111] rounded-[2.5rem] border border-dashed border-slate-200 dark:border-zinc-800">
                <LayoutGrid className="mx-auto text-slate-100 dark:text-zinc-900 mb-4" size={48}/>
                <p className="text-slate-400 font-bold italic">No hay posts disponibles.</p>
              </div>
            ) : userPosts.map(post => (
              <PostCard 
                key={post.id} 
                post={post} 
                onLike={onLike!} 
                onVote={onVote} 
                onAddComment={onAddComment!} 
                onDeletePost={onDeletePost}
                onNavigateToProfile={onNavigateToProfile}
                onOpenShare={() => {}}
                currentUser={currentUser}
                followedUserIds={new Set(isFollowed ? [user.id] : [])}
                followerUserIds={new Set(isFollower ? [user.id] : [])}
                onToggleFollow={onToggleFollow}
                users={users}
              />
            ))
          )}
          
          {activeTab === 'news' && (
            userNews.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-[#111] rounded-[2.5rem] border border-dashed border-slate-200 dark:border-zinc-800">
                <Newspaper className="mx-auto text-slate-100 dark:text-zinc-900 mb-4" size={48}/>
                <p className="text-slate-400 font-bold italic">No hay noticias registradas.</p>
              </div>
            ) : userNews.map(news => (
              <NewsCard 
                key={news.id} 
                post={news} 
                onVote={onVote!} 
                onAddComment={onAddComment!} 
                currentUser={currentUser}
                followedUserIds={new Set(isFollowed ? [user.id] : [])}
                users={users}
                onNavigateToProfile={onNavigateToProfile}
              />
            ))
          )}
        </div>
      </div>

      {isEditModalOpen && <EditProfileModal user={user} onClose={() => setIsEditModalOpen(false)} onSave={onUpdateUser} />}
      {isPreferencesModalOpen && <PreferencesModal user={user} onClose={() => setIsPreferencesModalOpen(false)} onSave={onUpdateUser} />}
      {isShareModalOpen && <ShareModal user={user} onClose={() => setIsShareModalOpen(false)} />}
      {viewingUsersList && <UsersListModal type={viewingUsersList} userId={user.id} onClose={() => setViewingUsersList(null)} onNavigate={(id) => onNavigateToProfile?.(id)} />}
    </div>
  );
};
