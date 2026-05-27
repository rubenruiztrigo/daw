import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useScrollLock } from '../hooks/useScrollLock';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, User, MessageCircle, Newspaper, Bell, Search, Settings, LogOut, MoreVertical, Calendar, Clock, Briefcase, TrendingUp, X, AlertCircle, ShoppingBag, Menu, ArrowLeft, Monitor, Pin, Loader2, ChevronRight } from 'lucide-react';
import { User as UserType, Notification, CalendarEvent, Post, Chat } from '../types';
import { supabase } from '../supabaseClient';
import { Language, useTranslation } from '../utils/translations';
import { useScrollDirection } from '../hooks/useScrollDirection';
import { sortUsersByRelevance } from '../utils/mentionUtils';
import { getSafeAvatar } from '../utils/avatarUtils';

interface LayoutProps {
  children: React.ReactNode;
  user: UserType;
  notifications?: Notification[];
  globalEvents?: CalendarEvent[];
  globalEventsLoading?: boolean;
  posts?: Post[];
  chats?: Chat[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit?: (query: string) => void;
  onLogout: () => void;
  theme: 'light' | 'dark';
  language: Language;
  onThemeChange: (theme: 'light' | 'dark') => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  trendingTags?: { tag: string, count: number }[] | null;
  activeTourStepId?: string | null;
  isTutorialActive?: boolean;
}

const Logo = () => (
  <div className="w-10 h-10 flex items-center justify-center overflow-hidden rounded-lg bg-blue-600 p-1">
    <img
      src="/img/novagob.brand_isotipo_blanco.svg"
      alt="Red Social Logo"
      className="w-full h-full object-contain"
    />
  </div>
);

export const Layout: React.FC<LayoutProps> = ({
  children,
  user,
  notifications = [],
  globalEvents = [],
  globalEventsLoading = false,
  posts = [],
  chats = [],
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onLogout,
  theme,
  language,
  onThemeChange,
  onRefresh,
  isLoading = false,
  trendingTags = null,
  activeTourStepId,
  isTutorialActive
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  
  useScrollLock(showLogoutConfirm);
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const unreadMessagesCount = chats.filter(c => {
    // Si tenemos mensajes cargados (abiertos), usamos el último mensaje real
    if (c.messages && c.messages.length > 0) {
      const lastMsg = c.messages[c.messages.length - 1];
      return lastMsg.senderId !== user?.id && !lastMsg.isRead;
    }
    // Si no hay mensajes cargados, usamos la metadata de fetchChats
    return c.lastMessageSenderId !== user?.id && !c.lastMessageIsRead;
  }).length;
  const location = useLocation();
  const navigate = useNavigate();
  const t = useTranslation(language);
  const scrollDirection = useScrollDirection();

  // Autocomplete State
  const [autocompleteResults, setAutocompleteResults] = useState<any[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteLoading, setAutocompleteLoading] = useState(false);

  // Keyboard/Focus detection to hide nav on mobile
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        if (timeoutId) clearTimeout(timeoutId);
        setIsInputFocused(true);
      }
    };
    const handleFocusOut = () => {
      timeoutId = setTimeout(() => {
        setIsInputFocused(false);
      }, 0); // Wait for keyboard to retract
    };

    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focusout', handleFocusOut);
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  // Profile Autocomplete logic
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!searchQuery.trim() || searchQuery.startsWith('#')) {
        setAutocompleteResults([]);
        return;
      }

      setAutocompleteLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, name, username, avatar')
          .or(`name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`)
          .limit(5);

        if (error) throw error;
        setAutocompleteResults(data || []);
      } catch (err) {
        console.error('Error fetching search suggestions:', err);
      } finally {
        setAutocompleteLoading(false);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  // Click outside profile menu detection
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileMenuOpen]);

  const NavItem = ({ to, icon: Icon, label, badge, id }: { to: string, icon: any, label: string, badge?: number, id?: string }) => {
    return (
      <NavLink
        id={id}
        to={to}
        onClick={(e) => {
          if (to === '/inicio' || to === '/noticias') {
            onSearchChange('');
          }
          if (location.pathname === to) {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            if (onRefresh) onRefresh();
          }
        }}
        className={({ isActive }) => {
          const isMyProfile = location.pathname === `/${user.username}` || location.pathname === `/${user.id}`;
          const isInicioActive = to === '/inicio' && location.pathname.startsWith('/inicio/');
          const isNoticiasActive = to === '/noticias' && location.pathname.startsWith('/noticias/');
          
          const isProfileNavItem = to === `/${user?.username || user?.id}` || to === `/${user?.id}` || to === `/${user?.username}`;
          const active = isActive || isInicioActive || isNoticiasActive || (isProfileNavItem && isMyProfile);
          
          const isEventFocused = isProfileNavItem && isMyProfile && location.state?.scrollToEventId;
          const isTourActive = id && id === activeTourStepId;

          if (isTourActive) return `w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all bg-purple-600 text-white shadow-lg shadow-purple-200 dark:shadow-none animate-in zoom-in-95 duration-200`;

          const shouldShowDefaultActive = active && !isTutorialActive;

          return `w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${shouldShowDefaultActive
            ? (isEventFocused ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'bg-blue-600 text-white')
            : 'text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-zinc-900 hover:text-blue-600'
            }`;
        }}
      >
        <div className="flex items-center space-x-3">
          <Icon size={20} />
          <span className="font-bold text-sm">{label}</span>
        </div>
        {badge !== undefined && badge > 0 && (() => {
          const isCurrentRoute = location.pathname === to || (to === '/inicio' && location.pathname.startsWith('/inicio/')) || (to === '/noticias' && location.pathname.startsWith('/noticias/'));
          const isTourStep = id && id === activeTourStepId;
          const badgeClass = (isCurrentRoute || isTourStep)
            ? 'bg-white text-purple-600'
            : 'bg-purple-600 text-white';
          return (
            <span className={`${badgeClass} text-[10px] font-black px-2 py-0.5 rounded-full transition-colors`}>
              {badge}
            </span>
          );
        })()}
      </NavLink>
    );
  };

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA');
    const currentTimeStr = now.toTimeString().substring(0, 5); // 'HH:MM'
    const fifteenDaysLimit = new Date();
    fifteenDaysLimit.setDate(fifteenDaysLimit.getDate() + 15);
    const limitStr = fifteenDaysLimit.toLocaleDateString('en-CA');

    return globalEvents.filter(event => {
      if ((event.attendees || 0) < 50) return false;
      const eventDateStr = event.event_date;
      if (eventDateStr < todayStr || eventDateStr > limitStr) return false;
      // If the event is today, only show it if its time hasn't passed yet
      if (eventDateStr === todayStr) {
        const eventTime = (event.event_time || '00:00').substring(0, 5);
        return eventTime >= currentTimeStr;
      }
      return true;
    })
      .sort((a, b) => {
        const dateCompare = a.event_date.localeCompare(b.event_date);
        if (dateCompare !== 0) return dateCompare;
        return (a.event_time || '00:00').localeCompare(b.event_time || '00:00');
      })
      .slice(0, 3);
  }, [globalEvents]);

  const getEventTimeLabel = (dateStr: string) => {
    const todayStr = new Date().toLocaleDateString('en-CA');
    if (dateStr === todayStr) return t('today');
    
    // Para mañana
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toLocaleDateString('en-CA');
    if (dateStr === tomorrowStr) return t('tomorrow');

    // Diferencia en días
    const parts = dateStr.split('-').map(Number);
    const targetDate = new Date(parts[0], parts[1] - 1, parts[2]);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.round((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return ''; // Pasado
    return t('in_n_days', { count: diffDays });
  };

  const handleSearchFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && onSearchSubmit) {
      setShowAutocomplete(false);
      setIsSearchFocused(false);
      searchInputRef.current?.blur();
      onSearchSubmit(searchQuery);
    }
  };

  const SearchDropdown = ({ hideTrends = false }: { hideTrends?: boolean }) => {
    const hasProfiles = autocompleteResults.length > 0;
    const hasTags = trendingTags && trendingTags.length > 0;

    if (!isSearchFocused) return null;
    if (!hasProfiles && (!hasTags || hideTrends)) return null;

    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-slate-100 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
        {/* Profile Suggestions */}
        {hasProfiles && (
          <>
            <div className="p-1">
              {autocompleteResults.slice(0, 5).map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    searchInputRef.current?.blur();
                    setIsSearchFocused(false);
                    navigate(`/${profile.username || profile.id}`);
                    onSearchChange('');
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all flex items-center space-x-3 group"
                >
                  <img 
                    src={getSafeAvatar(profile.avatar)} 
                    className="w-8 h-8 rounded-lg object-cover border border-slate-100 dark:border-zinc-800" 
                    alt={profile.name} 
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {profile.name} {profile.lastName || ''}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium truncate">
                      @{profile.username?.toLowerCase()}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Trending Tags (Only if no profile results or when searching for tags, and not hidden) */}
        {hasTags && !hideTrends && (!hasProfiles || searchQuery.startsWith('#')) && (
          <>
            <div className={`px-4 py-2 flex items-center space-x-2 bg-slate-50/50 dark:bg-zinc-800/20 ${hasProfiles ? 'border-t border-slate-50 dark:border-zinc-800/50' : ''}`}>
              <TrendingUp size={12} className="text-blue-500" />
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{t('trending')}</span>
            </div>
            <div className="p-1">
              {trendingTags.slice(0, 3).map(({ tag, count }) => (
                <button
                  key={tag}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    searchInputRef.current?.blur();
                    setIsSearchFocused(false);
                    onSearchChange(`#${tag}`);
                    setTimeout(() => {
                      onSearchSubmit?.(`#${tag}`);
                    }, 100);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-1.5">
                    <span className="text-sm font-bold text-slate-700 dark:text-gray-200 group-hover:text-blue-600 transition-colors tracking-tight">#{tag}</span>
                  </div>
                  <span className="text-[10px] font-black text-slate-300 dark:text-zinc-600 group-hover:text-blue-200 transition-colors">{count} posts</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  const showSidebar = location.pathname.startsWith('/inicio') || location.pathname.startsWith('/noticias') || location.pathname === '/';

  return (
    <div className="min-h-[100dvh] bg-[#E2E8F0] dark:bg-[#0a0a0a] transition-colors duration-200 font-sans">
      <div className={`w-full flex relative ${location.pathname.startsWith('/mensajes') ? 'h-screen md:h-screen sm:h-[100dvh] max-h-screen overflow-hidden' : 'min-h-[100dvh]'}`}>
        {/* Sidebar Desktop */}
        <aside id="tour-sidebar" className={`w-[18%] sticky top-0 h-[100dvh] bg-white dark:bg-[#0a0a0a] border-r border-slate-100 dark:border-zinc-900 hidden md:flex flex-col p-4 ${isTutorialActive && activeTourStepId === 'tour-sidebar-info' ? 'z-[1001]' : 'z-30'}`}>
          <div className="flex items-center space-x-3 mb-10 px-2 cursor-pointer" onClick={() => {
            onSearchChange('');
            if (location.pathname === '/inicio') {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              if (onRefresh) onRefresh();
            } else {
              navigate('/inicio');
            }
          }}>
            <Logo />
            <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Red Social</span>
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto scrollbar-hide pr-2">
            <NavItem id="tour-home" to="/inicio" icon={Home} label={t('home')} />
            <NavItem id="tour-news" to="/noticias" icon={Newspaper} label={t('news')} />
            <NavItem id="tour-calendar" to="/calendario" icon={Calendar} label={t('nav_calendar')} />
            <NavItem id="tour-messages" to="/mensajes" icon={MessageCircle} label={t('messages')} badge={unreadMessagesCount} />
            <NavItem id="tour-notifications" to="/notificaciones" icon={Bell} label={t('notifications')} badge={unreadCount} />
            <NavItem to={`/${user.username || user.id}`} icon={User} label={t('profile')} />
            <NavItem to="/configuracion" icon={Settings} label={t('settings')} />
          </nav>
          <div ref={profileMenuRef} className="mt-auto pt-6 border-t border-slate-50 dark:border-zinc-900 relative">
            {isProfileMenuOpen && (
              <div className="absolute bottom-full left-0 mb-1 w-full bg-white dark:bg-[#111] rounded-2xl border border-slate-100 dark:border-zinc-800 py-1 animate-in fade-in slide-in-from-bottom-2 duration-200 z-50 shadow-xl">
                <button
                  onClick={() => { setShowLogoutConfirm(true); setIsProfileMenuOpen(false); }}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all rounded-xl"
                >
                  <LogOut size={16} />
                  <span>{t('logout')}</span>
                </button>
              </div>
            )}
            <div
              id="tour-profile-menu"
              className={`w-full flex items-center justify-between p-2 rounded-2xl transition-all hover:bg-slate-50 dark:hover:bg-zinc-900 ${isProfileMenuOpen ? 'bg-slate-50 dark:bg-zinc-900' : ''}`}
            >
              <Link to={`/${user.username || user.id}`} className="flex items-center space-x-3 flex-1 min-w-0 cursor-pointer group">
                <img src={getSafeAvatar(user.avatar)} className="w-10 h-10 rounded-xl object-cover border-2 border-transparent group-hover:border-blue-200 transition-all" alt="Avatar" />
                <div className="flex-1 text-left min-w-0">
                  <p className="text-xs font-black text-slate-900 dark:text-white leading-tight mb-1 group-hover:text-blue-600 transition-colors">
                    {user?.username === 'novagob' ? `${user?.name} ${user?.lastName || ''}` : user?.name}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold truncate">{user?.username ? `@${user?.username.toLowerCase()}` : user?.institution}</p>
                </div>
              </Link>
              <button
                onClick={(e) => { e.stopPropagation(); setIsProfileMenuOpen(!isProfileMenuOpen); }}
                className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-slate-300 hover:text-slate-500 transition-colors"
              >
                <MoreVertical size={16} />
              </button>
            </div>
          </div>
        </aside>

        <div className="flex-1 min-w-0 flex flex-col relative min-h-0">
          <main id="tour-main" className={`flex-1 w-full ${(location.pathname.startsWith('/inicio/') || location.pathname.startsWith('/noticias/')) ? 'px-0' : 'px-4'} overscroll-y-none ${location.pathname.startsWith('/mensajes') ? (isInputFocused ? 'h-full pb-0' : 'h-full pb-[66px] md:pb-0') : (location.pathname.startsWith('/panel-control') || location.pathname.startsWith('/inicio/') || location.pathname.startsWith('/noticias/')) ? 'pb-0' : 'pb-16 md:pb-6'} ${location.pathname === '/' || location.pathname.startsWith('/inicio') || location.pathname.startsWith('/noticias') || location.pathname.startsWith('/buscar') || location.pathname.startsWith('/mensajes') || location.pathname.startsWith('/panel-control') ? 'md:px-0 md:pt-0' : 'max-w-[1200px] mx-auto md:p-6'} !px-0 min-h-0`}>
            {/* Mobile Header */}
            {!location.pathname.startsWith('/mensajes') && !location.pathname.startsWith('/buscar') && (
              <header className={`bg-white dark:bg-[#0a0a0a] border-b border-slate-100 dark:border-zinc-900 px-4 py-4 flex items-center fixed md:hidden top-0 left-0 right-0 z-[70] h-16 ${['/inicio', '/noticias', '/buscar'].includes(location.pathname) ? 'transition-transform duration-300' : ''} ${['/inicio', '/noticias', '/buscar'].includes(location.pathname) && scrollDirection === 'down' ? '-translate-y-full' : 'translate-y-0'}`}>
                <div className="flex-shrink-0 cursor-pointer" onClick={() => navigate('/inicio')}><Logo /></div>
                <div className="flex-1 flex justify-center px-4">
                  <form onSubmit={handleSearchFormSubmit} className="relative w-full max-w-[200px]">
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => onSearchChange(e.target.value)}
                      onFocus={() => setIsSearchFocused(true)}
                      onBlur={() => setIsSearchFocused(false)}
                      placeholder={t('search_placeholder')}
                      inputMode="search"
                      enterKeyHint="search"
                      className="w-full pl-3 pr-9 py-2 bg-slate-50 dark:bg-zinc-900 dark:text-white border border-slate-100 dark:border-zinc-800 rounded-xl text-xs font-bold font-sans outline-none transition-all"
                    />
                    <button type="submit" onClick={() => (document.activeElement as HTMLElement)?.blur()} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors">
                      <Search size={14} />
                    </button>
                    <SearchDropdown />
                  </form>
                </div>
                {user && (location.pathname === `/${user.username}` || location.pathname === `/${user.id}`) ? (
                  <NavLink to="/configuracion" className={({ isActive }) => `flex-shrink-0 p-2 relative ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                    <Menu size={22} />
                  </NavLink>
                ) : (
                  <NavLink to="/notificaciones" className={({ isActive }) => `flex-shrink-0 p-2 relative ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                    <Bell size={22} />
                    {unreadCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-purple-600 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white">{unreadCount}</span>}
                  </NavLink>
                )}
              </header>
            )}
            {children}
          </main>

          {/* Mobile Nav - Integrated into Content Wrapper for Stability */}
          <nav className={`md:hidden ${location.pathname.startsWith('/mensajes/') && location.pathname.split('/').length > 2 ? 'absolute' : 'fixed'} bottom-0 inset-x-0 bg-white dark:bg-[#0a0a0a] border-t border-slate-100 dark:border-zinc-900 flex justify-around items-center pt-2 pb-[calc(1.2rem+env(safe-area-inset-bottom,8px))] px-3 z-[100] transition-all ${isInputFocused ? 'duration-300 opacity-0 translate-y-full pointer-events-none' : 'duration-0 opacity-100 translate-y-0'} ${['/inicio', '/noticias'].includes(location.pathname) && scrollDirection === 'down' ? 'translate-y-full' : ''}`}>
            {[
              { to: '/inicio', icon: Home, id: 'tour-mobile-home' },
              { to: '/noticias', icon: Newspaper, id: 'tour-mobile-news' },
              { to: '/calendario', icon: Calendar, id: 'tour-mobile-calendar' },
              { to: '/mensajes', icon: MessageCircle, badge: unreadMessagesCount, id: 'tour-mobile-messages' },
            ].map(({ to, icon: Icon, badge, id }) => (
              <NavLink
                to={to}
                id={id}
                key={to}
                className={`relative transition-all ${isInputFocused ? 'duration-300' : 'duration-0'} w-10 h-10 flex items-center justify-center rounded-2xl ${location.pathname === to || (to !== '/' && location.pathname.startsWith(to)) ? 'text-blue-600' : 'text-slate-300'}`}
              >
                <Icon size={22} />
                {badge !== undefined && badge > 0 && (
                  <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-purple-600 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white">{badge}</span>
                )}
              </NavLink>
            ))}
            <button onClick={() => navigate(`/${user?.username || user?.id}`)} className="rounded-full w-10 h-10 flex items-center justify-center"><img src={getSafeAvatar(user?.avatar)} className="w-8 h-8 rounded-full object-cover" /></button>
          </nav>
        </div>

        {showSidebar && (
          <aside className="w-[18%] sticky top-0 h-[100dvh] bg-white dark:bg-[#0a0a0a] border-l border-slate-100 dark:border-zinc-900 hidden lg:flex flex-col p-4 z-30">
            {/* Search */}
            <form onSubmit={handleSearchFormSubmit} className="mb-3 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={t('search_placeholder')}
                  inputMode="search"
                  enterKeyHint="search"
                  className="w-full pl-4 pr-12 py-3 bg-slate-100 dark:bg-zinc-900 rounded-2xl text-sm font-bold outline-none"
                />
                <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors">
                  <Search size={18} />
                </button>
                <SearchDropdown hideTrends={true} />
            </form>
            {/* Trending & Events */}
            <div className="space-y-3 flex-1 flex flex-col min-h-0">
              {/* Tendencias — altura fija para evitar layout shift */}
              <div className="p-4 bg-slate-50 dark:bg-zinc-900/50 rounded-2xl border border-slate-100 dark:border-zinc-800 min-h-[132px]">
                <div className="flex items-center space-x-2 mb-3"><TrendingUp size={16} className="text-blue-500" /><h3 className="text-xs font-black uppercase tracking-widest">{t('trending')}</h3></div>
                <div className="space-y-2.5">
                  {trendingTags === null ? (
                    [0, 1, 2].map(i => (
                      <div key={i} className="animate-pulse space-y-1">
                        <div className="h-2.5 bg-slate-200 dark:bg-zinc-800 rounded w-3/4" />
                        <div className="h-2 bg-slate-200 dark:bg-zinc-800 rounded w-1/3" />
                      </div>
                    ))
                  ) : trendingTags.length > 0 ? trendingTags.slice(0, 3).map(({ tag, count }) => (
                    <button key={tag} onClick={() => {
                      onSearchChange(`#${tag}`);
                      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
                      onSearchSubmit?.(`#${tag}`);
                    }} className="w-full text-left group">
                      <p className="text-xs font-bold group-hover:text-blue-600 transition-colors">#{tag}</p>
                      <p className="text-[10px] text-slate-400 font-bold">{count} posts</p>
                    </button>
                  )) : (
                    <p className="text-xs text-slate-400 dark:text-zinc-600 font-medium">Sin tendencias esta semana</p>
                  )}
                </div>
              </div>

              {/* Próximos Eventos — sólo aparece si hay eventos. Durante la carga
                  la sección permanece oculta para no mostrar skeleton en vano. */}
              {upcomingEvents.length > 0 && (
              <div className="p-3 bg-white dark:bg-zinc-900/30 rounded-2xl border border-slate-100 dark:border-zinc-800 flex flex-col flex-1 min-h-0">
                <Link to="/calendario" className="flex items-center justify-center space-x-2 mb-3 group">
                  <Calendar size={16} className="text-blue-500" />
                  <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors whitespace-nowrap">
                    {t('upcoming_events')}
                  </h3>
                </Link>
                <div className="flex flex-col gap-2 flex-1">
                  {globalEventsLoading ? (
                    [0, 1, 2].map(i => (
                      <div key={i} className="flex items-stretch rounded-xl overflow-hidden animate-pulse h-[72px] flex-shrink-0">
                        <div className="w-14 bg-slate-200 dark:bg-zinc-800 flex-shrink-0" />
                        <div className="flex-1 p-2 space-y-2 flex flex-col justify-center">
                          <div className="h-2.5 bg-slate-200 dark:bg-zinc-800 rounded w-4/5" />
                          <div className="h-2 bg-slate-200 dark:bg-zinc-800 rounded w-2/5" />
                        </div>
                      </div>
                    ))
                  ) : upcomingEvents.length > 0 ? upcomingEvents.map(event => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const parts = event.event_date.split('-').map(Number);
                    const targetDate = new Date(parts[0], parts[1] - 1, parts[2]);
                    const diffDays = Math.round((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                    return (
                      <button
                        key={event.id}
                        onClick={() => navigate('/calendario', { state: { date: event.event_date } })}
                        className="w-full text-left cursor-pointer group bg-slate-50 dark:bg-zinc-900/50 rounded-xl border border-slate-100 dark:border-zinc-800 overflow-hidden transition-all hover:border-slate-200 dark:hover:border-zinc-700 flex flex-row items-stretch h-[72px] flex-shrink-0"
                      >
                        {/* Image flush left/top/bottom */}
                        <div className="relative w-16 flex-shrink-0 overflow-hidden">
                          <img
                            src={event.image_url || '/img/imagen-por-defecto.png'}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover transition-all group-hover:scale-[1.03]"
                            loading="lazy"
                            decoding="async"
                          />
                        </div>
                        {/* Content */}
                        <div className="flex-1 px-2 flex flex-col justify-center min-w-0">
                          <p className="text-[10px] font-black text-slate-800 dark:text-white group-hover:text-blue-600 transition-colors whitespace-nowrap overflow-hidden text-ellipsis">
                            {event.title}
                          </p>
                          <div className="flex gap-0.5 flex-nowrap overflow-hidden mt-1.5">
                            <span className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-white dark:bg-zinc-800 rounded-full border border-slate-100 dark:border-zinc-700 text-purple-600 dark:text-purple-400 text-[8px] font-black uppercase whitespace-nowrap shrink-0">
                              {event.type === 'physical' ? <Pin size={7} /> : <Monitor size={7} />}
                              {event.type === 'physical' ? 'Presencial' : 'Online'}
                            </span>
                            <span className={`inline-flex items-center px-1 py-0.5 bg-white dark:bg-zinc-800 rounded-full border border-slate-100 dark:border-zinc-700 text-[8px] font-black uppercase whitespace-nowrap shrink-0 ${diffDays <= 3 ? 'text-red-500' : 'text-blue-500'}`}>
                              {getEventTimeLabel(event.event_date)}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  }) : null}
                </div>
              </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {showLogoutConfirm && createPortal(
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="bg-white dark:bg-[#111] w-full max-w-sm rounded-[2.5rem] overflow-hidden border border-zinc-800 p-8 text-center">
            <AlertCircle size={40} className="text-red-500 mx-auto mb-6" />
            <h3 className="text-2xl font-black mb-3">{t('logout_confirm_title')}</h3>
            <p className="text-slate-500 text-sm mb-8">{t('logout_confirm_desc')}</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowLogoutConfirm(false)} className="py-4 bg-gray-50 dark:bg-zinc-800 rounded-2xl font-bold text-sm">{t('cancel')}</button>
              <button onClick={onLogout} className="py-4 bg-red-500 text-white rounded-2xl font-bold text-sm">{t('logout')}</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
