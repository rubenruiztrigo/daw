
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { User, Post, Badge } from '../types';
import { Briefcase, MapPin, Users, Heart, Share2, Edit3, Calendar, Award, LayoutGrid, Newspaper, UserPlus, UserMinus, Camera, Eye, Trash, X, Upload, Map, Check, Plus, ImagePlus } from 'lucide-react';
import { EditProfileModal } from './EditProfileModal';
import { PreferencesModal } from './PreferencesModal';
import { ShareModal } from './ShareModal';
import { UsersListModal } from './UsersListModal';

interface ProfileViewProps {
  user: User;
  isCurrentUser: boolean;
  isFollowed?: boolean;
  isFollower?: boolean;
  onToggleFollow?: (userId: string) => void;
  posts: Post[];
  onUpdateUser: (updatedUser: User) => void;
  onDeletePost?: (postId: string) => void;
  onNavigateToProfile?: (userId: string) => void;
  onShareProfile?: (userId: string, contact: any, isProfile: boolean) => void;
  currentUser: User;
}

type ProfileTab = 'posts' | 'news' | 'badges';
type PhotoAction = 'none' | 'menu' | 'view' | 'adjust';

export const ProfileView: React.FC<ProfileViewProps> = ({ 
  user, 
  isCurrentUser, 
  isFollowed,
  isFollower,
  onToggleFollow,
  posts, 
  onUpdateUser,
  onDeletePost,
  onNavigateToProfile,
  onShareProfile,
  currentUser
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPreferencesModalOpen, setIsPreferencesModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
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

  const handleActionStart = (e: React.MouseEvent, type: 'move' | string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialBox({ ...cropBox });
    if (type === 'move') setIsDragging(true);
    else setResizingCorner(type);
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
          if (resizingCorner.includes('w')) {
            const maxW = initialBox.x + initialBox.w;
            next.x = Math.max(0, Math.min(maxW - 10, initialBox.x + deltaX));
            next.w = maxW - next.x;
          }
          if (resizingCorner.includes('s')) next.h = Math.max(10, Math.min(100 - initialBox.y, initialBox.h + deltaY));
          if (resizingCorner.includes('n')) {
            const maxH = initialBox.y + initialBox.h;
            next.y = Math.max(0, Math.min(maxH - 10, initialBox.y + deltaY));
            next.h = maxH - next.y;
          }
        }
        return next;
      });
    };
    const handleGlobalUp = () => {
      setIsDragging(false);
      setResizingCorner(null);
    };
    if (isDragging || resizingCorner) {
      window.addEventListener('mousemove', handleGlobalMove);
      window.addEventListener('mouseup', handleGlobalUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('mouseup', handleGlobalUp);
    };
  }, [isDragging, resizingCorner, dragStart, initialBox]);

  const confirmCrop = () => {
    if (!tempPhotoUrl || !imageRef.current) return;
    const canvas = document.createElement('canvas');
    const img = imageRef.current;
    const naturalW = img.naturalWidth;
    const naturalH = img.naturalHeight;
    const finalX = (cropBox.x / 100) * naturalW;
    const finalY = (cropBox.y / 100) * naturalH;
    const finalW = (cropBox.w / 100) * naturalW;
    const finalH = (cropBox.h / 100) * naturalH;
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, finalX, finalY, finalW, finalH, 0, 0, 512, 512);
      const result = canvas.toDataURL('image/jpeg', 0.9);
      onUpdateUser({ ...user, avatar: result });
      setPhotoAction('none');
      setTempPhotoUrl(null);
    }
  };

  const deletePhoto = () => {
    if (confirm('¿Eliminar tu foto de perfil actual?')) {
      // Usamos ui-avatars con nombre vacío y fondo gris para simular un avatar neutro
      onUpdateUser({ ...user, avatar: `https://ui-avatars.com/api/?name=%20&background=CBD5E1&size=512` });
      setPhotoAction('none');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Perfil Header Card */}
      <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100">
        <div className="h-40 bg-gradient-to-r from-blue-600 to-indigo-700 relative">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
        </div>
        
        <div className="px-10 pb-10">
          <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center -mt-16 mb-8 gap-6">
            <div className="relative group/avatar flex-shrink-0">
              <img 
                src={user.avatar} 
                onClick={() => isCurrentUser && setPhotoAction('menu')}
                className={`w-40 h-40 rounded-[2.5rem] border-8 border-white object-cover shadow-2xl transition-all ${isCurrentUser ? 'cursor-pointer hover:brightness-90 ring-blue-500/10 group-hover/avatar:ring-8' : ''}`} 
                alt={user.name} 
              />
              {isCurrentUser && (
                <div onClick={() => setPhotoAction('menu')} className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover/avatar:opacity-100 transition-opacity rounded-[2.5rem] pointer-events-none">
                  <ImagePlus className="text-white" size={32} />
                </div>
              )}

              {photoAction === 'menu' && (
                <>
                  <div className="fixed inset-0 z-[150]" onClick={() => setPhotoAction('none')}></div>
                  <div className="absolute top-full left-0 mt-4 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-[160] animate-in fade-in zoom-in-95 duration-150 origin-top-left">
                    <button onClick={() => setPhotoAction('view')} className="w-full flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gray-50 transition-colors">
                      <Eye size={18} /><span className="font-bold text-sm">Ver foto de perfil</span>
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gray-50 transition-colors">
                      <ImagePlus size={18} /><span className="font-bold text-sm">Cambiar foto de perfil</span>
                    </button>
                    <div className="h-px bg-gray-100 my-1 mx-2"></div>
                    <button onClick={deletePhoto} className="w-full flex items-center space-x-3 px-4 py-3 text-red-500 hover:bg-red-50 transition-colors">
                      <Trash size={18} /><span className="font-bold text-sm">Eliminar foto de perfil</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileChange} />

            {/* Información alineada con la foto y por debajo del banner */}
            <div className="flex-1 pt-12 md:pt-16 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">
                  {user.name} {user.lastName}
                </h1>
                {user.badges && user.badges.length > 0 && (
                  <div className="flex -space-x-1">
                    {user.badges.slice(0, 3).map(b => (
                      <div key={b.id} className="w-6 h-6 rounded-full bg-yellow-400 border-2 border-white flex items-center justify-center text-white" title={b.label}>
                        <Award size={12} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex flex-col space-y-1.5">
                <div className="flex items-center space-x-2 text-blue-600 font-bold">
                  <Briefcase size={16} />
                  <span>{user.position} en {user.department}</span>
                </div>
                
                <div className="flex items-center space-x-4 text-sm font-medium">
                   <button onClick={() => setViewingUsersList('followers')} className="hover:underline transition-all">
                      <span className="font-black text-gray-900">{user.followers}</span> <span className="text-gray-500">seguidores</span>
                   </button>
                   <button onClick={() => setViewingUsersList('following')} className="hover:underline transition-all">
                      <span className="font-black text-gray-900">{user.following}</span> <span className="text-gray-500">siguiendo</span>
                   </button>
                </div>

                <div className="flex flex-col space-y-1 pt-1">
                  <div className="flex items-center space-x-2 text-gray-400 font-bold text-xs uppercase tracking-wider">
                    <Calendar size={14} />
                    <span>{joinedDateFormatted}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-400 font-bold text-xs uppercase tracking-wider">
                    <MapPin size={14} />
                    <span>{user.country || 'España'}{user.region ? `, ${user.region}` : ''}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 self-end md:self-center pt-12 md:pt-16">
              <button onClick={() => setIsShareModalOpen(true)} className="p-3.5 bg-gray-50 text-gray-400 rounded-2xl hover:bg-gray-100 transition-all border border-gray-100"><Share2 size={20}/></button>
              {isCurrentUser ? (
                <button onClick={() => setIsEditModalOpen(true)} className="flex items-center space-x-2 px-8 py-3.5 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all transform active:scale-95 text-sm uppercase tracking-widest"><Edit3 size={18}/><span>Editar Perfil</span></button>
              ) : (
                <button onClick={() => onToggleFollow?.(user.id)} className={`flex items-center space-x-2 px-8 py-3.5 rounded-2xl font-black transition-all shadow-lg text-sm uppercase tracking-widest ${isMutual ? 'bg-green-600 text-white shadow-green-100' : isFollowed ? 'bg-white text-gray-600 border border-gray-200 shadow-gray-100' : 'bg-blue-600 text-white shadow-blue-100'}`}>
                  {isMutual ? <Check size={18}/> : isFollowed ? <UserMinus size={18}/> : <UserPlus size={18}/>}
                  <span>{isMutual ? 'Amigos' : isFollowed ? 'Siguiendo' : 'Seguir'}</span>
                </button>
              )}
            </div>
          </div>

          <div className="max-w-3xl space-y-8 pt-4">
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Acerca de mí</h3>
              <p className="text-gray-600 leading-relaxed font-medium text-lg">
                {user.bio || "Este usuario aún no ha redactado su biografía profesional."}
              </p>
            </div>

            {isCurrentUser && (
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Intereses</h3>
                <div className="flex flex-wrap gap-2">
                  {user.interests && user.interests.map(interest => (
                    <span key={interest} className="px-4 py-2 bg-slate-50 text-slate-500 font-bold text-xs rounded-xl border border-slate-100">
                      #{interest}
                    </span>
                  ))}
                  <button 
                    onClick={() => setIsPreferencesModalOpen(true)}
                    className="w-9 h-9 flex items-center justify-center bg-blue-50 text-blue-600 rounded-xl border border-blue-100 hover:bg-blue-600 hover:text-white transition-all transform active:scale-90"
                    title="Agregar intereses"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="space-y-6">
        <div className="flex space-x-12 border-b border-gray-100 px-6">
          <button 
            onClick={() => setActiveTab('posts')} 
            className={`pb-4 flex items-center space-x-2 transition-all relative ${activeTab === 'posts' ? 'text-blue-600 font-black' : 'text-gray-400 font-bold hover:text-gray-600'}`}
          >
            <LayoutGrid size={18} />
            <span>Posts ({userPosts.length})</span>
            {activeTab === 'posts' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full animate-in slide-in-from-bottom-2 duration-300"></div>}
          </button>
          <button 
            onClick={() => setActiveTab('news')} 
            className={`pb-4 flex items-center space-x-2 transition-all relative ${activeTab === 'news' ? 'text-orange-500 font-black' : 'text-gray-400 font-bold hover:text-gray-600'}`}
          >
            <Newspaper size={18} />
            <span>Noticias ({userNews.length})</span>
            {activeTab === 'news' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-500 rounded-full animate-in slide-in-from-bottom-2 duration-300"></div>}
          </button>
          <button 
            onClick={() => setActiveTab('badges')} 
            className={`pb-4 flex items-center space-x-2 transition-all relative ${activeTab === 'badges' ? 'text-yellow-600 font-black' : 'text-gray-400 font-bold hover:text-gray-600'}`}
          >
            <Award size={18} />
            <span>Insignias</span>
            {activeTab === 'badges' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-600 rounded-full animate-in slide-in-from-bottom-2 duration-300"></div>}
          </button>
        </div>

        <div className="grid gap-6">
          {activeTab === 'posts' && (
            userPosts.length > 0 ? (
              userPosts.map(post => (
                <div key={post.id} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                   <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-3 text-xs text-gray-400 font-bold uppercase tracking-widest">
                        <Calendar size={14} />
                        <span>{new Date(post.timestamp).toLocaleDateString()}</span>
                      </div>
                   </div>
                   <p className="text-gray-800 font-medium leading-relaxed text-lg">{post.content}</p>
                   {post.imageUrl && (
                      <div className="mt-6 rounded-2xl overflow-hidden border border-slate-50">
                        <img src={post.imageUrl} className="w-full h-auto object-cover max-h-96" alt="" />
                      </div>
                   )}
                </div>
              ))
            ) : (
              <div className="py-24 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                <LayoutGrid className="mx-auto text-slate-200 mb-4" size={48} />
                <p className="text-slate-400 font-bold">No hay posts compartidos todavía.</p>
              </div>
            )
          )}

          {activeTab === 'news' && (
            userNews.length > 0 ? (
              userNews.map(post => (
                <div key={post.id} className="bg-white p-8 rounded-3xl border border-orange-100 shadow-sm transition-all hover:shadow-md">
                   <div className="flex items-center space-x-2 mb-4">
                      <div className="px-2 py-0.5 bg-orange-50 text-orange-600 text-[10px] font-black rounded uppercase tracking-tighter border border-orange-100">Institucional</div>
                      <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">· {new Date(post.timestamp).toLocaleDateString()}</span>
                   </div>
                   <p className="text-gray-800 font-medium leading-relaxed text-lg">{post.content}</p>
                </div>
              ))
            ) : (
              <div className="py-24 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                <Newspaper className="mx-auto text-slate-200 mb-4" size={48} />
                <p className="text-slate-400 font-bold">No hay noticias institucionales publicadas.</p>
              </div>
            )
          )}

          {activeTab === 'badges' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {user.badges && user.badges.length > 0 ? (
                user.badges.map(badge => (
                  <div key={badge.id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col items-center text-center space-y-4 hover:shadow-lg transition-all transform hover:-translate-y-1">
                    <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center text-yellow-500 shadow-inner">
                      <Award size={40} />
                    </div>
                    <div>
                      <h4 className="font-black text-gray-900">{badge.label}</h4>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Reconocimiento Institucional</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-24 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                  <Award className="mx-auto text-slate-200 mb-4" size={48} />
                  <p className="text-slate-400 font-bold">Aún no se han obtenido insignias de reconocimiento.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODALES */}
      {photoAction === 'view' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setPhotoAction('none')}>
          <button className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"><X size={40} /></button>
          <img src={user.avatar} className="max-w-full max-h-[85vh] rounded-3xl shadow-2xl animate-in zoom-in-95 duration-300" alt="" onClick={(e) => e.stopPropagation()}/>
        </div>
      )}

      {photoAction === 'adjust' && tempPhotoUrl && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in" onClick={() => setPhotoAction('none')}>
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
            <div className="p-8 space-y-6">
              <div className="text-center">
                <h3 className="text-2xl font-black text-slate-900">Ajustar encuadre</h3>
                <p className="text-sm text-slate-500 mt-1 font-medium">Arrastra para redimensionar el área de tu foto</p>
              </div>
              <div className="relative mx-auto w-full aspect-square bg-slate-100 rounded-2xl overflow-hidden border-2 border-slate-200 select-none shadow-inner" ref={containerRef}>
                <img src={tempPhotoUrl} ref={imageRef} className="w-full h-full object-contain pointer-events-none" alt="Preview" />
                <div className="absolute inset-0 bg-black/50 pointer-events-none"></div>
                <div 
                  className="absolute border-2 border-white shadow-[0_0_0_1000px_rgba(0,0,0,0.5)] cursor-move ring-1 ring-black/10"
                  style={{ left: `${cropBox.x}%`, top: `${cropBox.y}%`, width: `${cropBox.w}%`, height: `${cropBox.h}%` }}
                  onMouseDown={(e) => handleActionStart(e, 'move')}
                >
                  <div className="absolute -top-3 -left-3 w-7 h-7 bg-white rounded-full border-4 border-blue-600 cursor-nw-resize shadow-lg z-10" onMouseDown={(e) => handleActionStart(e, 'nw')}></div>
                  <div className="absolute -top-3 -right-3 w-7 h-7 bg-white rounded-full border-4 border-blue-600 cursor-ne-resize shadow-lg z-10" onMouseDown={(e) => handleActionStart(e, 'ne')}></div>
                  <div className="absolute -bottom-3 -left-3 w-7 h-7 bg-white rounded-full border-4 border-blue-600 cursor-sw-resize shadow-lg z-10" onMouseDown={(e) => handleActionStart(e, 'sw')}></div>
                  <div className="absolute -bottom-3 -right-3 w-7 h-7 bg-white rounded-full border-4 border-blue-600 cursor-se-resize shadow-lg z-10" onMouseDown={(e) => handleActionStart(e, 'se')}></div>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => setPhotoAction('none')} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all">Cancelar</button>
                <button onClick={confirmCrop} className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-100 hover:bg-blue-700 transform active:scale-95 transition-all">Confirmar Recorte</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && <EditProfileModal user={user} onClose={() => setIsEditModalOpen(false)} onSave={onUpdateUser} />}
      {isPreferencesModalOpen && <PreferencesModal user={user} onClose={() => setIsPreferencesModalOpen(false)} onSave={onUpdateUser} />}
      {isShareModalOpen && <ShareModal user={user} onClose={() => setIsShareModalOpen(false)} onShare={(id, contact) => onShareProfile?.(id, contact, true)} />}
      {viewingUsersList && <UsersListModal type={viewingUsersList} onClose={() => setViewingUsersList(null)} onNavigate={(id) => onNavigateToProfile?.(id)} />}
    </div>
  );
};
