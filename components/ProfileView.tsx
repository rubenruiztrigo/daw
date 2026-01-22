
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { User, Post } from '../types';
import { Briefcase, MapPin, Share2, Edit3, Calendar, LayoutGrid, Newspaper, UserPlus, UserMinus, Eye, Trash, X, Plus, ImagePlus, MessageCircle, Camera } from 'lucide-react';
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
type PhotoAction = 'none' | 'menu' | 'view' | 'adjust';

export const ProfileView: React.FC<ProfileViewProps> = ({ 
  // Fix: Added missing onDeletePost to destructured props
  user, isCurrentUser, isFollowed, isFollower, onToggleFollow, onStartChat, posts, 
  onUpdateUser, onDeletePost, onNavigateToProfile, onShareProfile, onSharePost, currentUser, onLike, onVote, onAddComment, users
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPreferencesModalOpen, setIsPreferencesModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sharingPost, setSharingPost] = useState<Post | null>(null);
  const [viewingUsersList, setViewingUsersList] = useState<'followers' | 'following' | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');
  
  const [photoAction, setPhotoAction] = useState<PhotoAction>('none');
  const [tempPhotoUrl, setTempPhotoUrl] = useState<string | null>(null);
  const [cropBox, setCropBox] = useState({ x: 10, y: 10, w: 80, h: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [resizingCorner, setResizingCorner] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialBox, setInitialBox] = useState({ x: 0, y: 0, w: 0, h: 0 });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const isMutual = useMemo(() => !!isFollowed && !!isFollower, [isFollowed, isFollower]);

  const joinedDateFormatted = useMemo(() => {
    if (!user.joinedDate) return 'Fecha no disponible';
    const date = new Date(user.joinedDate);
    const month = date.toLocaleString('es-ES', { month: 'long' });
    const year = date.getFullYear();
    return `Se unió en ${month} de ${year}`;
  }, [user.joinedDate]);

  const userPosts = useMemo(() => posts.filter(p => p.authorId === user.id && p.type === 'post'), [posts, user.id]);
  const userNews = useMemo(() => posts.filter(p => p.authorId === user.id && p.type === 'news'), [posts, user.id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { 
        setTempPhotoUrl(reader.result as string); 
        setPhotoAction('adjust'); 
        setCropBox({ x: 25, y: 25, w: 50, h: 50 }); 
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeletePhoto = () => {
    if (confirm('¿Estás seguro de que quieres eliminar tu foto de perfil?')) {
      const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}${user.id}`;
      onUpdateUser({ ...user, avatar: defaultAvatar });
      setPhotoAction('none');
    }
  };

  const handleActionStart = (e: React.MouseEvent, type: 'move' | string) => {
    e.preventDefault(); e.stopPropagation();
    setDragStart({ x: e.clientX, y: e.clientY }); setInitialBox({ ...cropBox });
    if (type === 'move') setIsDragging(true); else setResizingCorner(type);
  };

  useEffect(() => {
    const handleGlobalMove = (e: MouseEvent) => {
      if (!isDragging && !resizingCorner) return;
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const deltaX = ((e.clientX - dragStart.x) / rect.width) * 100;
      const deltaY = ((e.clientY - dragStart.y) / rect.height) * 100;
      setCropBox(prev => {
        let next = { ...prev };
        if (isDragging) {
          next.x = Math.max(0, Math.min(100 - initialBox.w, initialBox.x + deltaX));
          next.y = Math.max(0, Math.min(100 - initialBox.h, initialBox.y + deltaY));
        } else if (resizingCorner) {
          if (resizingCorner.includes('e')) next.w = Math.max(10, Math.min(100 - initialBox.x, initialBox.w + deltaX));
          if (resizingCorner.includes('w')) { const maxW = initialBox.x + initialBox.w; next.x = Math.max(0, Math.min(maxW - 10, initialBox.x + deltaX)); next.w = maxW - next.x; }
          if (resizingCorner.includes('s')) next.h = Math.max(10, Math.min(100 - initialBox.y, initialBox.h + deltaY));
          if (resizingCorner.includes('n')) { const maxH = initialBox.y + initialBox.h; next.y = Math.max(0, Math.min(maxH - 10, initialBox.y + deltaY)); next.h = maxH - next.y; }
        }
        return next;
      });
    };
    const handleGlobalUp = () => { setIsDragging(false); setResizingCorner(null); };
    if (isDragging || resizingCorner) { window.addEventListener('mousemove', handleGlobalMove); window.addEventListener('mouseup', handleGlobalUp); }
    return () => { window.removeEventListener('mousemove', handleGlobalMove); window.removeEventListener('mouseup', handleGlobalUp); };
  }, [isDragging, resizingCorner, dragStart, initialBox]);

  const confirmCrop = () => {
    if (!tempPhotoUrl || !imageRef.current) return;
    const canvas = document.createElement('canvas'); const img = imageRef.current;
    const naturalW = img.naturalWidth; const naturalH = img.naturalHeight;
    const finalX = (cropBox.x / 100) * naturalW; const finalY = (cropBox.y / 100) * naturalH;
    const finalW = (cropBox.w / 100) * naturalW; const finalH = (cropBox.h / 100) * naturalH;
    canvas.width = 512; canvas.height = 512; const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, finalX, finalY, finalW, finalH, 0, 0, 512, 512);
      const result = canvas.toDataURL('image/jpeg', 0.9); 
      onUpdateUser({ ...user, avatar: result });
      setPhotoAction('none'); setTempPhotoUrl(null);
    }
  };

  const followedIdsSet = useMemo(() => {
    const set = new Set<string>();
    users.forEach(u => {
      // Logic for building the followed set could be complex, assuming App handles it but
      // we need a set for the PostCard
    });
    return set;
  }, [users]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Photo Modals */}
      {photoAction === 'menu' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setPhotoAction('none')}>
          <div className="bg-white dark:bg-[#0a0a0a] w-full max-w-xs rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-2 space-y-1">
              <button onClick={() => setPhotoAction('view')} className="w-full flex items-center space-x-3 p-4 hover:bg-slate-50 dark:hover:bg-zinc-900 rounded-2xl text-slate-700 dark:text-gray-200 font-bold transition-colors"><Eye size={20} /><span>Ver foto</span></button>
              <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center space-x-3 p-4 hover:bg-slate-50 dark:hover:bg-zinc-900 rounded-2xl text-blue-600 font-bold transition-colors"><ImagePlus size={20} /><span>Cambiar foto</span></button>
              <button onClick={handleDeletePhoto} className="w-full flex items-center space-x-3 p-4 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl text-red-600 font-bold transition-colors"><Trash size={20} /><span>Eliminar foto</span></button>
            </div>
          </div>
        </div>
      )}

      {photoAction === 'view' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={() => setPhotoAction('none')}>
          <div className="relative max-w-2xl w-full flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPhotoAction('none')} className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white transition-colors bg-white/10 rounded-full"><X size={24}/></button>
            <img src={user.avatar} className="w-full h-auto aspect-square object-cover rounded-[2rem] shadow-2xl border-4 border-white/10" alt="" />
          </div>
        </div>
      )}

      {photoAction === 'adjust' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-white dark:bg-[#0a0a0a] w-full max-lg rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Ajustar foto</h3>
              <button onClick={() => setPhotoAction('none')} className="p-2 text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            <div className="p-6 flex flex-col items-center">
              <div ref={containerRef} className="relative w-full aspect-square bg-slate-100 dark:bg-zinc-900 rounded-2xl overflow-hidden cursor-crosshair select-none">
                <img ref={imageRef} src={tempPhotoUrl!} className="w-full h-full object-contain pointer-events-none" alt="" />
                <div className="absolute inset-0 bg-black/40"></div>
                <div 
                  className="absolute border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] cursor-move flex items-center justify-center group"
                  style={{ left: `${cropBox.x}%`, top: `${cropBox.y}%`, width: `${cropBox.w}%`, height: `${cropBox.h}%` }}
                  onMouseDown={(e) => handleActionStart(e, 'move')}
                >
                  <div className="w-6 h-6 border-2 border-white/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  {['nw', 'ne', 'sw', 'se'].map(pos => (
                    <div 
                      key={pos} 
                      className={`absolute w-4 h-4 bg-white border border-blue-500 z-10 ${pos === 'nw' ? '-top-2 -left-2 cursor-nw-resize' : pos === 'ne' ? '-top-2 -right-2 cursor-ne-resize' : pos === 'sw' ? '-bottom-2 -left-2 cursor-sw-resize' : '-bottom-2 -right-2 cursor-se-resize'}`}
                      onMouseDown={(e) => handleActionStart(e, pos)}
                    ></div>
                  ))}
                </div>
              </div>
              <p className="mt-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Arrastra para mover · Esquinas para redimensionar</p>
            </div>
            <div className="p-6 bg-gray-50 dark:bg-zinc-900/50 flex space-x-3">
              <button onClick={() => setPhotoAction('none')} className="flex-1 py-3 bg-white dark:bg-zinc-800 text-slate-600 dark:text-gray-300 rounded-xl font-bold">Cancelar</button>
              <button onClick={confirmCrop} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 dark:shadow-none">Aplicar cambios</button>
            </div>
          </div>
        </div>
      )}

      <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileChange} />

      {/* Profile Header */}
      <div className="bg-white dark:bg-[#111] rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100 dark:border-zinc-800">
        <div 
          className={`h-48 relative overflow-hidden ${isCurrentUser ? 'cursor-pointer group/banner transition-all hover:brightness-95' : ''}`}
          style={{ 
            backgroundImage: `url(${user.avatar})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
          onClick={() => isCurrentUser && setPhotoAction('menu')}
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
            <div className="relative group/avatar flex-shrink-0">
              <img 
                src={user.avatar} 
                onClick={() => isCurrentUser && setPhotoAction('menu')} 
                className={`w-44 h-44 rounded-[2.5rem] border-8 border-white dark:border-zinc-800 object-cover shadow-2xl transition-all ${isCurrentUser ? 'cursor-pointer hover:brightness-90' : ''}`} 
                alt="" 
              />
              {isCurrentUser && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-black/40 backdrop-blur-sm p-3 rounded-2xl text-white"><Camera size={24} /></div>
                </div>
              )}
            </div>
            
            <div className="flex-1 pt-6 md:pt-0">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">{user.name} {user.lastName}</h1>
                {isMutual && <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-black rounded-full border border-blue-100 dark:border-blue-800 uppercase tracking-widest">Amigos</span>}
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

            <div className="flex items-center space-x-3 pb-2">
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
                    className={`px-8 py-3.5 rounded-2xl font-black text-sm transition-all transform active:scale-95 flex items-center space-x-2 ${isFollowed ? 'bg-slate-100 dark:bg-zinc-800 text-slate-500' : 'bg-blue-600 text-white shadow-xl shadow-blue-100 dark:shadow-none hover:bg-blue-700'}`}
                  >
                    {isFollowed ? <UserMinus size={18}/> : <UserPlus size={18}/>}
                    <span>{isFollowed ? 'Dejar de seguir' : 'Seguir'}</span>
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="md:col-span-2 space-y-8">
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-gray-400 dark:text-zinc-600 uppercase tracking-widest px-1">Biografía profesional</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed font-medium text-lg">{user.bio || "Sin biografía todavía."}</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-[10px] font-black text-gray-400 dark:text-zinc-600 uppercase tracking-widest">Intereses</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {user.interests && user.interests.length > 0 ? user.interests.map(interest => (
                    <span key={interest} className="px-4 py-2 bg-blue-50/50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-black border border-blue-100 dark:border-blue-900/20">{interest}</span>
                  )) : (
                    <span className="text-gray-400 italic text-sm font-medium">No se han seleccionado áreas de interés.</span>
                  )}
                  {isCurrentUser && (
                    <button 
                      onClick={() => setIsPreferencesModalOpen(true)}
                      className="px-3 py-2 bg-slate-50 dark:bg-zinc-900 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm flex items-center justify-center border border-dashed border-blue-200 dark:border-blue-900/50"
                      title="Añadir intereses"
                    >
                      <Plus size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-white dark:bg-zinc-900/40 rounded-[2.5rem] p-6 border border-slate-100 dark:border-zinc-800 shadow-sm">
                <div className="flex items-center justify-around gap-2">
                  <button onClick={() => setViewingUsersList('followers')} className="flex-1 text-center py-2 px-1 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-2xl transition-all group">
                    <p className="text-2xl font-black text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">{user.followers}</p>
                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mt-1">Seguidores</p>
                  </button>
                  <div className="w-px h-10 bg-slate-100 dark:bg-zinc-800"></div>
                  <button onClick={() => setViewingUsersList('following')} className="flex-1 text-center py-2 px-1 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-2xl transition-all group">
                    <p className="text-2xl font-black text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">{user.following}</p>
                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mt-1">Siguiendo</p>
                  </button>
                </div>
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
                onOpenShare={setSharingPost}
                currentUser={currentUser}
                followedUserIds={new Set(isFollowed ? [user.id] : [])} // Simplified for profile context
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

      {sharingPost && (
        <ShareModal 
          post={sharingPost} 
          onClose={() => setSharingPost(null)} 
          onShare={onSharePost}
        />
      )}
      
      {isEditModalOpen && <EditProfileModal user={user} onClose={() => setIsEditModalOpen(false)} onSave={onUpdateUser} />}
      {isPreferencesModalOpen && <PreferencesModal user={user} onClose={() => setIsPreferencesModalOpen(false)} onSave={onUpdateUser} />}
      {isShareModalOpen && <ShareModal user={user} onClose={() => setIsShareModalOpen(false)} onShare={(id, contact) => onShareProfile?.(id, contact, true)} />}
      {viewingUsersList && <UsersListModal type={viewingUsersList} userId={user.id} onClose={() => setViewingUsersList(null)} onNavigate={(id) => onNavigateToProfile?.(id)} />}
    </div>
  );
};
