
import React, { useState } from 'react';
import { Home, User, MessageCircle, Newspaper, Bell, Search, Settings, LogOut, MoreVertical, Calendar } from 'lucide-react';
import { User as UserType, Notification, AppView } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  user: UserType;
  notifications?: Notification[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit?: (query: string) => void;
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
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const NavItem = ({ view, icon: Icon, label, badge }: { view: AppView, icon: any, label: string, badge?: number }) => {
    // Corregido: Solo marcar activo si es la vista actual y, si es perfil, solo si es el propio
    const isActive = view === 'profile' 
      ? (currentView === 'profile' && isViewingOwnProfile)
      : currentView === view;

    return (
      <button
        onClick={() => onViewChange(view)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
          isActive 
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-900 hover:text-blue-600'
        }`}
      >
        <div className="flex items-center space-x-3">
          <Icon size={20} />
          <span className="font-semibold text-sm">{label}</span>
        </div>
        {badge !== undefined && badge > 0 && (
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isActive ? 'bg-white text-blue-600' : 'bg-red-500 text-white'}`}>
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
          <NavItem view="calendar" icon={Calendar} label="Calendario" />
          <NavItem view="messages" icon={MessageCircle} label="Mensajes" />
          <NavItem view="notifications" icon={Bell} label="Notificaciones" badge={unreadCount} />
          <NavItem view="profile" icon={User} label="Mi Perfil" />
          <NavItem view="settings" icon={Settings} label="Configuración" />
        </nav>
        
        <div className="mt-auto pt-6 border-t border-gray-100 dark:border-zinc-900 relative">
          {isProfileMenuOpen && (
            <div className="absolute bottom-full left-0 mb-4 w-full bg-white dark:bg-[#111] rounded-2xl border border-gray-100 dark:border-zinc-800 py-1 animate-in fade-in slide-in-from-bottom-2 duration-200 z-50 shadow-2xl">
              <button 
                onClick={() => { onLogout?.(); setIsProfileMenuOpen(false); }}
                className="w-full flex items-center space-x-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all rounded-xl"
              >
                <LogOut size={16} />
                <span>Cerrar sesión</span>
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
              <p className="text-[10px] text-gray-400 font-bold uppercase truncate">{user.username ? `@${user.username}` : user.department}</p>
            </div>
            <MoreVertical size={16} className="text-gray-400" />
          </button>
        </div>
      </aside>
      
      <div className="flex-1 md:ml-64 lg:mr-80 min-h-screen">
        <header className="bg-white dark:bg-[#0a0a0a] border-b border-gray-100 dark:border-zinc-900 px-6 py-4 flex items-center justify-between sticky top-0 z-20 h-16 md:hidden">
          <div className="flex items-center space-x-3" onClick={() => onViewChange('feed')}>
            <Logo />
            <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Red Social</span>
          </div>
        </header>
        <main className="p-4 md:p-8">{children}</main>
      </div>

      <aside className="w-80 fixed inset-y-0 right-0 bg-white dark:bg-[#0a0a0a] border-l border-gray-100 dark:border-zinc-900 hidden lg:flex flex-col p-6 z-30">
        <div className="sticky top-6">
          <form onSubmit={handleSearchFormSubmit} className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Buscar en la red..." 
              className="w-full pl-12 pr-4 py-3 bg-gray-100 dark:bg-zinc-900 dark:text-white border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </form>
          <div className="mt-8 p-6 bg-gray-50 dark:bg-zinc-900/50 rounded-3xl border border-gray-100 dark:border-zinc-800">
            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-4">Tendencia</h3>
            <div className="space-y-4">
              <button 
                onClick={() => onSearchSubmit?.('IAAdministrativa')}
                className="w-full text-left cursor-pointer group"
              >
                <p className="text-[10px] text-gray-400 font-bold uppercase">Tendencia en Innovación</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">#IAAdministrativa</p>
                <p className="text-[10px] text-gray-400">1.240 posts</p>
              </button>
              <button 
                onClick={() => onSearchSubmit?.('ContrataciónPublica')}
                className="w-full text-left cursor-pointer group"
              >
                <p className="text-[10px] text-gray-400 font-bold uppercase">Tendencia en España</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">#ContrataciónPublica</p>
                <p className="text-[10px] text-gray-400">856 posts</p>
              </button>
            </div>
          </div>
        </div>
      </aside>
      
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white dark:bg-[#0a0a0a] border-t border-gray-100 dark:border-zinc-900 flex justify-around p-3 z-30">
        <button onClick={() => onViewChange('feed')} className={currentView === 'feed' ? 'text-blue-600' : 'text-gray-400'}><Home size={20}/></button>
        <button onClick={() => onViewChange('news')} className={currentView === 'news' ? 'text-blue-600' : 'text-gray-400'}><Newspaper size={20}/></button>
        <button onClick={() => onViewChange('profile')} className={currentView === 'profile' && isViewingOwnProfile ? 'text-blue-600' : 'text-gray-400'}><User size={20}/></button>
      </nav>
    </div>
  );
};
