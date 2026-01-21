
import React, { useState } from 'react';
import { Home, User, MessageCircle, Newspaper, Bell, Search, LogOut, Settings, ChevronDown, ChevronUp, X as XIcon } from 'lucide-react';
import { User as UserType, Notification } from '../types';
import { NotificationsDropdown } from './NotificationsDropdown';

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
}

const Logo = () => (
  <div className="w-10 h-10 flex items-center justify-center">
    <svg viewBox="0 0 256 256" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Barra sólida (diagonal ascendente /) */}
      <path 
        d="M50 206L206 50" 
        stroke="#9362e3" 
        strokeWidth="48" 
        strokeLinecap="butt" 
      />
      {/* Barra hueca (diagonal descendente \) */}
      {/* Primero dibujamos el borde grueso */}
      <path 
        d="M50 50L206 206" 
        stroke="#9362e3" 
        strokeWidth="48" 
        strokeLinecap="butt" 
      />
      {/* Luego "vaciamos" el centro con el color de fondo (o blanco) para el efecto hueco */}
      <path 
        d="M50 50L206 206" 
        stroke="white" 
        strokeWidth="24" 
        strokeLinecap="butt" 
      />
      {/* Pequeño parche para asegurar que la intersección se vea como en la imagen */}
      <path 
        d="M110 110L146 146" 
        stroke="white" 
        strokeWidth="24" 
        strokeLinecap="butt" 
      />
      <path 
        d="M114 142L142 114" 
        stroke="#9362e3" 
        strokeWidth="24" 
        strokeLinecap="butt" 
      />
    </svg>
  </div>
);

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  currentView, 
  onViewChange, 
  user,
  notifications = [],
  onMarkNotificationsRead,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onUpdateUser,
  isViewingOwnProfile = true
}) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const NavItem = ({ view, icon: Icon, label }: { view: string, icon: any, label: string }) => {
    const isActive = currentView === view && (view !== 'profile' || isViewingOwnProfile);
    
    return (
      <button
        onClick={() => onViewChange(view)}
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
          isActive 
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
            : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600'
        }`}
      >
        <Icon size={20} />
        <span className="font-semibold text-sm">{label}</span>
      </button>
    );
  };

  const handleSearchFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && onSearchSubmit) {
      onSearchSubmit(searchQuery);
    }
  };

  const toggleNotifications = () => {
    if (!isNotificationsOpen && onMarkNotificationsRead) {
      onMarkNotificationsRead();
    }
    setIsNotificationsOpen(!isNotificationsOpen);
  };

  // Solo mostrar la barra de búsqueda en Para ti (feed) y Noticias (ranking)
  const showSearchBar = currentView === 'feed' || currentView === 'ranking';

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex transition-colors duration-200 font-sans">
      {/* Sidebar Nav - Fixed */}
      <aside className="w-64 fixed inset-y-0 left-0 bg-white border-r hidden md:flex flex-col p-6 z-30">
        <div className="flex items-center space-x-3 mb-10 px-2 cursor-pointer" onClick={() => onViewChange('feed')}>
          <Logo />
          <span className="text-xl font-bold text-gray-900 tracking-tight">Red Social</span>
        </div>

        <nav className="flex-1 space-y-1">
          <NavItem view="feed" icon={Home} label="Para ti" />
          <NavItem view="ranking" icon={Newspaper} label="Noticias" />
          <NavItem view="messages" icon={MessageCircle} label="Mensajes" />
          <NavItem view="profile" icon={User} label="Mi Perfil" />
          <NavItem view="settings" icon={Settings} label="Configuración" />
        </nav>

        {/* User Profile Section (Bottom Left) */}
        <div className="mt-auto pt-6 border-t border-gray-100 relative">
          <div className="w-full flex items-center space-x-3 p-2 rounded-2xl transition-all">
            <div className="relative">
              <img 
                src={user.avatar} 
                className="w-10 h-10 rounded-xl object-cover border-2 border-transparent" 
                alt="Avatar" 
              />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-xs font-bold text-gray-900 truncate leading-none mb-1">{user.name}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase truncate">{user.department}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Container - No header fix here to let it scroll */}
      <div className="flex-1 md:ml-64">
        {/* Header Bar - Removed fixed/sticky classes */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <div className="md:hidden flex items-center space-x-2 cursor-pointer" onClick={() => onViewChange('feed')}>
              <Logo />
            </div>
          </div>

          <div className="flex-1 max-w-xl mx-4">
            {showSearchBar && (
              <form onSubmit={handleSearchFormSubmit} className="relative w-full hidden sm:block">
                <button 
                  type="submit" 
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
                >
                  <Search size={18} />
                </button>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Buscar colegas, proyectos o licitaciones..." 
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all focus:bg-white focus:shadow-sm"
                />
              </form>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative">
              <button 
                onClick={toggleNotifications}
                className={`relative p-2.5 rounded-xl transition-all ${isNotificationsOpen ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                <Bell size={22} />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 rounded-full border-2 border-white text-[9px] text-white flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>

              {isNotificationsOpen && (
                <NotificationsDropdown 
                  notifications={notifications} 
                  onClose={() => setIsNotificationsOpen(false)} 
                />
              )}
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8">
          {children}
        </main>
      </div>

      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t flex justify-around p-3 z-30 shadow-up">
        <button onClick={() => onViewChange('feed')} className={currentView === 'feed' ? 'text-blue-600' : 'text-gray-400'} title="Para ti"><Home /></button>
        <button onClick={() => onViewChange('ranking')} className={currentView === 'ranking' ? 'text-blue-600' : 'text-gray-400'} title="Noticias"><Newspaper /></button>
        <button onClick={() => onViewChange('messages')} className={currentView === 'messages' ? 'text-blue-600' : 'text-gray-400'} title="Mensajes"><MessageCircle /></button>
        <button onClick={() => onViewChange('profile')} className={currentView === 'profile' && isViewingOwnProfile ? 'text-blue-600' : 'text-gray-400'} title="Mi Perfil"><User /></button>
      </nav>
    </div>
  );
};
