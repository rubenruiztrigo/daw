
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { User, Post } from '../types';
import { Briefcase, MapPin, Share2, Edit3, Calendar, LayoutGrid, Newspaper, UserPlus, UserMinus, Camera, MessageCircle, Plus, Award, Maximize2, X, Check, Palette, Repeat } from 'lucide-react';
import { EditProfileModal } from './EditProfileModal';
import { PreferencesModal } from './PreferencesModal';
import { ShareModal } from './ShareModal';
import { UsersListModal } from './UsersListModal';
import { PostCard } from './PostCard';
import { NewsCard } from './NewsCard';
import { ImageCropModal } from './ImageCropModal';
import { supabase } from '../supabaseClient';

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
  onNavigateToPost?: (postId: string) => void;
  onPreviewImage?: (url: string) => void;
  currentUser: User;
  onLike?: (id: string) => void;
  onVote?: (id: string, dir: 'up' | 'down') => void;
  onRepost: (id: string) => void;
  onAddComment?: (postId: string, text: string) => void;
  users: User[];
  onSearchHashtag?: (tag: string) => void;
}

type ProfileTab = 'posts' | 'news' | 'reposts' | 'badges';

const BANNER_PALETTE = [
  { name: 'Indigo Real', value: 'linear-gradient(to right, #4f46e5, #3730a3)' },
  { name: 'Océano Público', value: 'linear-gradient(to right, #0891b2, #155e75)' },
  { name: 'Innovación Slate', value: 'linear-gradient(to right, #475569, #1e293b)' },
  { name: 'Administración Teal', value: 'linear-gradient(to right, #0d9488, #115e59)' },
  { name: 'Ciudadanía Rose', value: 'linear-gradient(to right, #e11d48, #9f1239)' },
  { name: 'Datos Ambar', value: 'linear-gradient(to right, #d97706, #92400e)' },
  { name: 'Digital Violet', value: 'linear-gradient(to right, #8b5cf6, #5b21b6)' },
  { name: 'Gobernanza Emerald', value: 'linear-gradient(to right, #059669, #065f46)' },
  { name: 'Estructura Gray', value: 'linear-gradient(to right, #1f2937, #111827)' },
  { name: 'Transparencia Blue', value: 'linear-gradient(to right, #2563eb, #1e40af)' },
];

export const ProfileView: React.FC<ProfileViewProps> = ({ 
  user, isCurrentUser, isFollowed, isFollower, onToggleFollow, onStartChat, posts, 
  onUpdateUser, onDeletePost, onNavigateToProfile, onNavigateToPost, onPreviewImage, currentUser, onLike, onVote, onRepost, onAddComment, users, onSearchHashtag
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPreferencesModalOpen, setIsPreferencesModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [viewingUsersList, setViewingUsersList] = useState<'followers' | 'following' | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [repostedPostIds, setRepostedPostIds] = useState<string[]>([]);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchUserReposts = async () => {
      const { data, error } = await supabase
        .from('post_reposts')
        .select('post_id')
        .eq('user_id', user.id);
      
      if (!error && data) {
        setRepostedPostIds(data.map(r => r.post_id));
      }
    };

    fetchUserReposts();
  }, [user.id, posts]);

  const joinedDateFormatted = useMemo(() => {
    const rawDate = user.joinedDate || new Date().toISOString();
    const date = new Date(rawDate);
    const month = date.toLocaleString('es-ES', { month: 'long' });
    return `Se unió en ${month} de ${date.getFullYear()}`;
  }, [user.joinedDate]);

  const userPosts = useMemo(() => posts.filter(p => p.authorId === user.id && p.type === 'post'), [posts, user.id]);
  const userNews = useMemo(() => posts.filter(p => p.authorId === user.id && p.type === 'news'), [posts, user.id]);
  const userReposts = useMemo(() => posts.filter(p => repostedPostIds.includes(p.id)), [posts, repostedPostIds]);

  const handlePhotoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPhotoOptions(!showPhotoOptions);
    setIsPaletteOpen(false);
  };

  const handleBannerClick = (e: React.MouseEvent) => {
    if (!isCurrentUser) return;
    e.stopPropagation();
    setIsPaletteOpen(!isPaletteOpen);
    setShowPhotoOptions(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setImageToCrop(result); // Abrir el modal de recorte en lugar de actualizar directamente
        setShowPhotoOptions(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedImage: string) => {
    onUpdateUser({ ...user, avatar: croppedImage });
    setImageToCrop(null);
  };

  const handleColorSelect = (colorValue: string) => {
    onUpdateUser({ ...user, bannerColor: colorValue });
    setIsPaletteOpen(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500" onClick={() => { setShowPhotoOptions(false); setIsPaletteOpen(false); }}>
      {/* Profile Header */}
      <div className="bg-white dark:bg-[#111] rounded-[2.5rem] overflow-hidden border border-gray-100 dark:border-zinc-800 shadow-sm">
        {/* Banner Section with Color */}
        <div 
          className="h-48 relative overflow-hidden group/banner cursor-pointer transition-all active:brightness-90"
          style={{ background: user.bannerColor || 'linear-gradient(to right, #4f46e5, #3730a3)' }}
          onClick={handleBannerClick}
        >
          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover/banner:opacity-100 transition-opacity"></div>
          {isCurrentUser && (
            <div className="absolute bottom-4 right-6 p-2.5 bg-white/20 backdrop-blur-md text-white rounded-xl border border-white/20 shadow-lg">
              <Palette size={20} />
            </div>
          )}

          {/* Color Palette UI Popover */}
          {isCurrentUser && isPaletteOpen && (
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 bg-white dark:bg-[#0a0a0a] rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-2xl z-[130] animate-in zoom-in-95 duration-200 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-gray-50 dark:border-zinc-900">
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                  <Palette size={14} className="text-blue-600" />
                  Paleta de Banner
                </h3>
              </div>
              <div className="p-4 grid grid-cols-5 gap-3">
                {BANNER_PALETTE.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => handleColorSelect(color.value)}
                    className="group relative aspect-square rounded-full border-2 border-transparent hover:border-blue-500 transition-all overflow-hidden"
                    title={color.name}
                  >
                    <div 
                      className="w-full h-full" 
                      style={{ background: color.value }}
                    />
                    {user.bannerColor === color.value && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <Check size={14} className="text-white drop-shadow-md" strokeWidth={4} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <div className="p-4 bg-gray-50 dark:bg-zinc-900/50 flex justify-center">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Colores Institucionales</p>
              </div>
            </div>
          )}
        </div>

        <div className="px-10 pb-10">
          <div className="relative flex flex-col md:flex-row justify-between items-start md:items-end -mt-12 mb-8 gap-6">
            <div className="relative flex-shrink-0">
              <div className="group relative">
                <img 
                  src={user.avatar} 
                  className="w-44 h-44 rounded-[2.5rem] border-8 border-white dark:border-zinc-800 object-cover transition-all cursor-pointer hover:opacity-95 active:scale-95 shadow-xl" 
                  alt="" 
                  onClick={handlePhotoClick}
                />
                {isCurrentUser && (
                  <div className="absolute inset-2 rounded-[2rem] bg-black/20 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity flex items-center justify-center">
                    <Camera className="text-white" size={24} />
                  </div>
                )}
              </div>

              {/* Avatar Options Menu */}
              {showPhotoOptions && (
                <>
                  <div 
                    className="absolute top-full left-0 mt-3 w-64 bg-white dark:bg-[#111] rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-2xl z-[130] animate-in slide-in-from-top-2 duration-200 overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button 
                      onClick={() => {
                        setFullScreenImage(user.avatar);
                        setShowPhotoOptions(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-5 py-4 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-all ${isCurrentUser ? 'border-b border-gray-50 dark:border-zinc-900' : ''}`}
                    >
                      <Maximize2 size={18} className="text-blue-600" />
                      <span>Ver imagen completa</span>
                    </button>
                    
                    {isCurrentUser && (
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center space-x-3 px-5 py-4 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-all"
                      >
                        <Camera size={18} className="text-indigo-600" />
                        <span>Cambiar foto de perfil</span>
                      </button>
                    )}
                  </div>
                  {isCurrentUser && <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />}
                </>
              )}
            </div>
            
            <div className="flex-1 pt-6 md:pt-0">
              <div className="flex wrap items-center gap-3 mb-2">
                <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">{user.name} {user.lastName}</h1>
              </div>
              <div className="flex flex-col space-y-1.5">
                <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 font-bold">
                  <Briefcase size={16} />
                  <span>{user.position} en {user.department}</span>
                </div>
                <div className="flex wrap items-center gap-x-4 gap-y-1 text-gray-400 dark:text-zinc-500 font-medium text-sm">
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
                    <button onClick={() => setIsEditModalOpen(true)} className="bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 dark:shadow-none transform active:scale-95 flex items-center space-x-2"><Edit3 size={18}/><span>Editar Perfil</span></button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setIsShareModalOpen(true)} className="p-3 bg-slate-50 dark:bg-zinc-900 text-slate-400 hover:text-blue-600 rounded-2xl border border-slate-100 dark:border-zinc-800 transition-all shadow-sm"><Share2 size={20}/></button>
                    <button onClick={() => onStartChat?.(user)} className="p-3 bg-slate-50 dark:bg-zinc-900 text-slate-400 hover:text-blue-600 rounded-2xl border border-slate-100 dark:border-zinc-800 transition-all shadow-sm"><MessageCircle size={20}/></button>
                    <button 
                      onClick={() => onToggleFollow?.(user.id)}
                      className={`px-8 py-3.5 rounded-2xl font-black text-sm transition-all transform active:scale-95 flex items-center space-x-2 ${isFollowed ? 'bg-slate-100 dark:bg-zinc-800 text-slate-500' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-100 dark:shadow-none'}`}
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
              <div className="flex wrap gap-2 items-center">
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
                    className="p-2 bg-slate-50 dark:bg-zinc-900 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all border border-dashed border-blue-200 dark:border-blue-800"
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
        <div className="flex space-x-10 border-b border-gray-100 dark:border-zinc-900 px-6 overflow-x-auto scrollbar-hide">
          <button 
            onClick={() => setActiveTab('posts')} 
            className={`pb-4 flex items-center space-x-2 transition-all relative whitespace-nowrap ${activeTab === 'posts' ? 'text-blue-600 font-black' : 'text-gray-400 font-bold hover:text-gray-600'}`}
          >
            <LayoutGrid size={18} />
            <span>Posts ({userPosts.length})</span>
            {activeTab === 'posts' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full animate-in slide-in-from-left-2 duration-300"></div>}
          </button>
          <button 
            onClick={() => setActiveTab('news')} 
            className={`pb-4 flex items-center space-x-2 transition-all relative whitespace-nowrap ${activeTab === 'news' ? 'text-orange-500 font-black' : 'text-gray-400 font-bold hover:text-gray-600'}`}
          >
            <Newspaper size={18} />
            <span>Noticias ({userNews.length})</span>
            {activeTab === 'news' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-500 rounded-full animate-in slide-in-from-left-2 duration-300"></div>}
          </button>
          <button 
            onClick={() => setActiveTab('reposts')} 
            className={`pb-4 flex items-center space-x-2 transition-all relative whitespace-nowrap ${activeTab === 'reposts' ? 'text-emerald-500 font-black' : 'text-gray-400 font-bold hover:text-gray-600'}`}
          >
            <Repeat size={18} />
            <span>Reposts ({userReposts.length})</span>
            {activeTab === 'reposts' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500 rounded-full animate-in slide-in-from-left-2 duration-300"></div>}
          </button>
          <button 
            onClick={() => setActiveTab('badges')} 
            className={`pb-4 flex items-center space-x-2 transition-all relative whitespace-nowrap ${activeTab === 'badges' ? 'text-purple-600 font-black' : 'text-gray-400 font-bold hover:text-gray-600'}`}
          >
            <Award size={18} />
            <span>Insignias ({user.badges?.length || 0})</span>
            {activeTab === 'badges' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-600 rounded-full animate-in slide-in-from-left-2 duration-300"></div>}
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
                onRepost={onRepost}
                onAddComment={onAddComment!} 
                onDeletePost={onDeletePost}
                onNavigateToProfile={onNavigateToProfile}
                onNavigateToPost={onNavigateToPost}
                onPreviewImage={onPreviewImage}
                onOpenShare={() => {}}
                currentUser={currentUser}
                followedUserIds={new Set(isFollowed ? [user.id] : [])}
                followerUserIds={new Set(isFollower ? [user.id] : [])}
                onToggleFollow={onToggleFollow}
                users={users}
                onSearchHashtag={onSearchHashtag}
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
                onNavigateToPost={onNavigateToPost}
                onPreviewImage={onPreviewImage}
                onSearchHashtag={onSearchHashtag}
              />
            ))
          )}

          {activeTab === 'reposts' && (
            userReposts.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-[#111] rounded-[2.5rem] border border-dashed border-slate-200 dark:border-zinc-800">
                <Repeat className="mx-auto text-slate-100 dark:text-zinc-900 mb-4" size={48}/>
                <p className="text-slate-400 font-bold italic">No hay republicaciones aún.</p>
              </div>
            ) : userReposts.map(post => (
              <PostCard 
                key={`repost-${post.id}`} 
                post={post} 
                onLike={onLike!} 
                onVote={onVote} 
                onRepost={onRepost}
                onAddComment={onAddComment!} 
                onDeletePost={onDeletePost}
                onNavigateToProfile={onNavigateToProfile}
                onNavigateToPost={onNavigateToPost}
                onPreviewImage={onPreviewImage}
                onOpenShare={() => {}}
                currentUser={currentUser}
                followedUserIds={new Set(isFollowed ? [user.id] : [])}
                followerUserIds={new Set(isFollower ? [user.id] : [])}
                onToggleFollow={onToggleFollow}
                users={users}
                onSearchHashtag={onSearchHashtag}
              />
            ))
          )}

          {activeTab === 'badges' && (
            <div className="grid cols-1 sm:cols-2 gap-4">
              {(!user.badges || user.badges.length === 0) ? (
                <div className="col-span-full text-center py-20 bg-white dark:bg-[#111] rounded-[2.5rem] border border-dashed border-slate-200 dark:border-zinc-800">
                  <Award className="mx-auto text-slate-100 dark:text-zinc-900 mb-4" size={48}/>
                  <p className="text-slate-400 font-bold italic">Aún no has conseguido insignias.</p>
                  <p className="text-xs text-slate-400 mt-2">Participa en la comunidad para desbloquear reconocimientos.</p>
                </div>
              ) : (
                user.badges.map(badge => (
                  <div key={badge.id} className="bg-white dark:bg-[#111] p-6 rounded-[2rem] border border-gray-100 dark:border-zinc-800 flex items-center space-x-4">
                    <div className={`p-4 rounded-2xl ${badge.color || 'bg-purple-50 text-purple-600'} dark:bg-opacity-10`}>
                      <Award size={32} />
                    </div>
                    <div>
                      <h4 className="font-black text-gray-900 dark:text-white">{badge.label}</h4>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Logro verificado</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {isEditModalOpen && <EditProfileModal user={user} onClose={() => setIsEditModalOpen(false)} onSave={onUpdateUser} />}
      {isPreferencesModalOpen && <PreferencesModal user={user} onClose={() => setIsPreferencesModalOpen(false)} onSave={onUpdateUser} />}
      {isShareModalOpen && <ShareModal user={user} onClose={() => setIsShareModalOpen(false)} />}
      {viewingUsersList && <UsersListModal type={viewingUsersList} userId={user.id} onClose={() => setViewingUsersList(null)} onNavigate={(id) => onNavigateToProfile?.(id)} />}
      
      {/* Image Full Screen Viewer Overlay */}
      {fullScreenImage && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300 cursor-pointer"
          onClick={() => setFullScreenImage(null)}
        >
          <button 
            onClick={() => setFullScreenImage(null)}
            className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all border border-white/10 z-10"
          >
            <X size={24} />
          </button>
          
          <img 
            src={fullScreenImage} 
            className="max-w-full max-h-[90vh] rounded-[3rem] object-contain shadow-2xl animate-in zoom-in-95 duration-300 border-4 border-white/5"
            alt="Profile Preview"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Image Adjustment/Crop Modal */}
      {imageToCrop && (
        <ImageCropModal 
          image={imageToCrop} 
          onClose={() => setImageToCrop(null)} 
          onSave={handleCropComplete} 
        />
      )}
    </div>
  );
};
