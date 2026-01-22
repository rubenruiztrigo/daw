
import React, { useState } from 'react';
import { Home, User, MessageCircle, Newspaper, Bell, Search, Settings, LogOut, MoreVertical, X } from 'lucide-react';
import { User as UserType, Notification } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onViewChange: (view: any) => void;
  user: UserType;
  notifications?: Notification[];
  onMarkNotificationsRead?: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit?: (query: string) => void;
  onUpdateUser?: (user: UserType) => void;
  isViewingOwnProfile?: boolean;
  onLogout?: () => void;
}

const Logo = () => (
  <div className="w-10 h-10 flex items-center justify-center overflow-hidden rounded-lg bg-brand/10 p-1">
    <img 
      src="https://novagob.org/wp-content/uploads/2022/02/TRANPARENTE-BLANCO-1.png" 
      alt="Red Social Logo" 
      className="w-full h-full object-contain brightness-0 dark:brightness-100 invert-0 dark:invert"
    />
  </div>
);

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  currentView, 
  onViewChange, 
  user,
  notifications = [],
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  isViewingOwnProfile = true,
  onLogout
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const NavItem = ({ view, icon: Icon, label, badge }: { view: string, icon: any, label: string, badge?: number }) => {
    const isActive = view === 'profile' 
      ? (currentView === 'profile' && isViewingOwnProfile)
      : currentView === view;

    return (
      <button
        onClick={() => onViewChange(view)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
          isActive 
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-900 hover:text-blue-600'
        }`}
      >
        <div className="flex items-center space-x-3">
          <Icon size={20} />
          <span className="font-semibold text-sm">{label}</span>
        </div>
        {badge !== undefined && badge > 0 && (
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isActive ? 'bg-white text-blue-600' : 'bg-red-50 text-white'}`}>
            {badge}
          </span>
        )}
      </button>
    );
  };

  const handleSearchFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && onSearchSubmit) onSearchSubmit(searchQuery);
  };

  const showSearchBar = currentView !== 'search' && currentView !== 'messages' && currentView !== 'settings';

  return (
    <div className="min-h-screen bg-[#F3F4F6] dark:bg-black flex transition-colors duration-200 font-sans">
      <aside className="w-64 fixed inset-y-0 left-0 bg-white dark:bg-[#0a0a0a] border-r border-gray-100 dark:border-zinc-900 hidden md:flex flex-col p-6 z-30">
        <div className="flex items-center space-x-3 mb-10 px-2 cursor-pointer" onClick={() => onViewChange('feed')}>
          <Logo />
          <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Red Social</span>
        </div>
        <nav className="flex-1 space-y-1">
          <NavItem view="feed" icon={Home} label="Inicio" />
          <NavItem view="news" icon={Newspaper} label="Noticias" />
          <NavItem view="messages" icon={MessageCircle} label="Mensajes" />
          <NavItem view="notifications" icon={Bell} label="Notificaciones" badge={unreadCount} />
          <NavItem view="profile" icon={User} label="Mi Perfil" />
          <NavItem view="settings" icon={Settings} label="Configuración" />
        </nav>
        
        <div className="mt-auto pt-6 border-t border-gray-100 dark:border-zinc-900 relative">
          {isProfileMenuOpen && (
            <div className="absolute bottom-full left-0 w-full mb-2 bg-white dark:bg-[#111] border border-gray-100 dark:border-zinc-800 rounded-2xl shadow-xl p-2 animate-in slide-in-from-bottom-2 duration-200 z-50">
              <button 
                onClick={() => { setShowLogoutConfirm(true); setIsProfileMenuOpen(false); }}
                className="w-full flex items-center space-x-3 p-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 rounded-xl transition-all"
              >
                <LogOut size={18} />
                <span className="font-bold text-sm">Cerrar sesión</span>
              </button>
            </div>
          )}
          
          <button 
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className={`w-full flex items-center space-x-3 p-2 rounded-2xl transition-all hover:bg-gray-50 dark:hover:bg-zinc-900 ${isProfileMenuOpen ? 'bg-gray-50 dark:bg-zinc-900' : ''}`}
          >
            <div className="relative flex-shrink-0">
              <img src={user.avatar} className="w-10 h-10 rounded-xl object-cover border-2 border-transparent" alt="Avatar" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-zinc-900 rounded-full"></div>
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-xs font-bold text-gray-900 dark:text-white truncate leading-none mb-1">{user.name}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase truncate">{user.department}</p>
            </div>
            <MoreVertical size={16} className="text-gray-400" />
          </button>
        </div>
      </aside>
      
      <div className="flex-1 md:ml-64">
        <header className="bg-white dark:bg-[#0a0a0a] border-b border-gray-100 dark:border-zinc-900 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center"><div className="md:hidden flex items-center space-x-2 cursor-pointer" onClick={() => onViewChange('feed')}><Logo /></div></div>
          <div className="flex-1 max-w-xl mx-4">
            {showSearchBar && (
              <form onSubmit={handleSearchFormSubmit} className="relative w-full hidden sm:block">
                <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"><Search size={18} /></button>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Buscar colegas, proyectos..." 
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-zinc-900 dark:text-white border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all focus:bg-white dark:focus:bg-[#111] focus:shadow-sm"
                />
              </form>
            )}
          </div>
          <div className="flex items-center space-x-2">
          </div>
        </header>
        <main className="p-4 md:p-8">{children}</main>
      </div>
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white dark:bg-[#0a0a0a] border-t border-gray-100 dark:border-zinc-900 flex justify-around p-3 z-30 shadow-up">
        <button onClick={() => onViewChange('feed')} className={currentView === 'feed' ? 'text-blue-600' : 'text-gray-400'}><Home /></button>
        <button onClick={() => onViewChange('news')} className={currentView === 'news' ? 'text-blue-600' : 'text-gray-400'}><Newspaper /></button>
        <button onClick={() => onViewChange('messages')} className={currentView === 'messages' ? 'text-blue-600' : 'text-gray-400'}><MessageCircle /></button>
        <button onClick={() => onViewChange('notifications')} className={currentView === 'notifications' ? 'text-blue-600' : 'text-gray-400'}><Bell /></button>
        <button onClick={() => onViewChange('profile')} className={currentView === 'profile' && isViewingOwnProfile ? 'text-blue-600' : 'text-gray-400'}><User /></button>
      </nav>

      {/* Modal de Confirmación de Cierre de Sesión */}
      {showLogoutConfirm && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div 
            className="bg-white dark:bg-[#0a0a0a] w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white dark:border-zinc-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8 text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center">
                <LogOut size={32} />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">¿Cerrar sesión?</h3>
                <p className="text-sm text-slate-500 dark:text-gray-400 font-medium">¿Confirmas que deseas salir de tu cuenta institucional?</p>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => { onLogout?.(); setShowLogoutConfirm(false); }}
                  className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-red-100 hover:bg-red-700 transition-all transform active:scale-95"
                >
                  Sí, cerrar sesión
                </button>
                <button 
                  onClick={() => setShowLogoutConfirm(false)}
                  className="w-full py-4 bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-gray-400 rounded-2xl font-black text-sm hover:bg-slate-200 dark:hover:bg-zinc-800 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
