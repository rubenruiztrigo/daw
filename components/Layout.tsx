
import React from 'react';
import { Home, User, MessageCircle, Trophy, Bell, Search, LogOut } from 'lucide-react';
import { User as UserType } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onViewChange: (view: any) => void;
  user: UserType;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onViewChange, user }) => {
  const NavItem = ({ view, icon: Icon, label }: { view: string, icon: any, label: string }) => (
    <button
      onClick={() => onViewChange(view)}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
        currentView === view 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
          : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600'
      }`}
    >
      <Icon size={22} />
      <span className="font-semibold">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex transition-colors duration-200">
      {/* Sidebar Nav */}
      <aside className="w-64 fixed inset-y-0 left-0 bg-white border-r hidden md:flex flex-col p-6 z-30">
        <div className="flex items-center space-x-2 mb-10 px-2">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-xl">N</div>
          <span className="text-xl font-bold text-gray-900">NovaSocial</span>
        </div>

        <nav className="flex-1 space-y-2">
          <NavItem view="feed" icon={Home} label="Muro Social" />
          <NavItem view="ranking" icon={Trophy} label="Ranking Noticias" />
          <NavItem view="messages" icon={MessageCircle} label="Mensajes" />
          <NavItem view="profile" icon={User} label="Mi Perfil" />
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-100">
          <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all">
            <LogOut size={22} />
            <span className="font-semibold">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 md:ml-64">
        {/* Header Bar */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex justify-between items-center">
          <div className="relative max-w-md w-full hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar colegas o temas..." 
              className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-full text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-all">
              <Bell size={22} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.position}</p>
              </div>
              <img src={user.avatar} className="w-10 h-10 rounded-full object-cover border-2 border-blue-500" alt="Avatar" />
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8">
          {children}
        </main>
      </div>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t flex justify-around p-3 z-30">
        <button onClick={() => onViewChange('feed')} className={currentView === 'feed' ? 'text-blue-600' : 'text-gray-400'}><Home /></button>
        <button onClick={() => onViewChange('ranking')} className={currentView === 'ranking' ? 'text-blue-600' : 'text-gray-400'}><Trophy /></button>
        <button onClick={() => onViewChange('messages')} className={currentView === 'messages' ? 'text-blue-600' : 'text-gray-400'}><MessageCircle /></button>
        <button onClick={() => onViewChange('profile')} className={currentView === 'profile' ? 'text-blue-600' : 'text-gray-400'}><User /></button>
      </nav>
    </div>
  );
};
