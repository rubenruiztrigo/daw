import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useScrollLock } from '../hooks/useScrollLock';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, User, MessageCircle, Newspaper, Bell, Search, Settings, LogOut, MoreVertical, Calendar, Clock, Briefcase, TrendingUp, X, AlertCircle, ShoppingBag, Menu, ArrowLeft, Monitor, Pin, Loader2, ChevronRight } from 'lucide-react';
import { User as UserType, Notification, CalendarEvent, Post } from '../types';
import { supabase } from '../supabaseClient';
import { Language, useTranslation } from '../utils/translations';
import { useScrollDirection } from '../hooks/useScrollDirection';

interface LayoutProps {
  children: React.ReactNode;
  user: UserType;
  notifications?: Notification[];
  globalEvents?: CalendarEvent[];
  posts?: Post[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit?: (query: string) => void;
  onLogout: () => void;
  theme: 'light' | 'dark';
  language: Language;
  onThemeChange: (theme: 'light' | 'dark') => void;
  onRefresh?: () => void;
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
  user,
  notifications = [],
  globalEvents = [],
  posts = [],
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onLogout,
  theme,
  language,
  onThemeChange,
  onRefresh
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  useScrollLock(showLogoutConfirm);
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const location = useLocation();
  const navigate = useNavigate();
  const t = useTranslation(language);
  const scrollDirection = useScrollDirection();

  // Autocomplete State
  const [autocompleteResults, setAutocompleteResults] = useState<any[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteLoading, setAutocompleteLoading] = useState(false);

  const NavItem = ({ to, icon: Icon, label, badge }: { to: string, icon: any, label: string, badge?: number }) => {
    return (
      <NavLink
        to={to}
        onClick={(e) => {
          if (location.pathname === to) {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            if (onRefresh) onRefresh();
          }
        }}
        className={({ isActive }) => `w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${isActive
          ? 'bg-blue-600 text-white'
          : 'text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-zinc-900 hover:text-blue-600'
          }`}
      >
        <div className="flex items-center space-x-3">
          <Icon size={20} />
          <span className="font-bold text-sm">{label}</span>
        </div>
        {badge !== undefined && badge > 0 && (
          <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
            {badge}
          </span>
        )}
      </NavLink>
    );
  };

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const fifteenDaysFromNow = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);

    return globalEvents.filter(event => {
      // Parse YYYY-MM-DD manually to avoid UTC/Timezone issues
      const parts = event.event_date.split('-').map(Number);
      // Default to new Date(event.event_date) if format is unexpected
      let eventDate = new Date(event.event_date);

      if (parts.length === 3) {
        eventDate = new Date(parts[0], parts[1] - 1, parts[2]);
      }

      eventDate.setHours(0, 0, 0, 0);
      return eventDate >= now && eventDate <= fifteenDaysFromNow;
    }).sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
  }, [globalEvents]);

  const trendingTags = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const startOfDay = now.getTime();
    const relevantPosts = posts.filter(p => new Date(p.timestamp).getTime() >= startOfDay);

    const countTags = (text: string, counts: Record<string, number>) => {
      if (!text) return;
      const matches = text.match(/#[\wáéíóúÁÉÍÓÚñÑ]+/g);
      if (matches) {
        matches.forEach(t => {
          const cleanTag = t.slice(1);
          counts[cleanTag] = (counts[cleanTag] || 0) + 1;
        });
      }
    };

    const counts: Record<string, number> = {};
    relevantPosts.forEach(post => {
      post.tags?.forEach(tag => {
        const cleanTag = tag.trim();
        if (cleanTag) counts[cleanTag] = (counts[cleanTag] || 0) + 1;
      });

      post.commentsList?.forEach(comment => {
        countTags(comment.text, counts);
        comment.replies?.forEach(reply => {
          countTags(reply.text, counts);
        });
      });
    });

    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([tag, count]) => ({ tag, count }));
  }, [posts]);

  const getEventTimeLabel = (dateStr: string) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);

    const diffDays = Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return t('today');
    if (diffDays === 1) return t('tomorrow');
    return t('in_n_days', { count: diffDays });
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'physical': return 'bg-blue-500';
      case 'online':
      case 'online_course': return 'bg-emerald-500';
      case 'meeting': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const handleSearchFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && onSearchSubmit) {
      setShowAutocomplete(false);
      (document.activeElement as HTMLElement)?.blur();
      onSearchSubmit(searchQuery);
    }
  };

  const showSidebar = ['/feed', '/news'].includes(location.pathname) || location.pathname === '/';

  React.useEffect(() => {
    if (!searchQuery) {
      setAutocompleteResults([]);
      setShowAutocomplete(false);
    }
  }, [searchQuery]);



  return (
    <div className="min-h-screen bg-[#E2E8F0] dark:bg-[#0a0a0a] transition-colors duration-200 font-sans">
      <div className="w-full flex relative min-h-screen">
        {/* Sidebar Desktop */}
        <aside className="w-56 xl:w-64 2xl:w-72 sticky top-0 h-screen bg-white dark:bg-[#0a0a0a] border-r border-slate-100 dark:border-zinc-900 hidden md:flex flex-col p-4 z-30">
          <div className="flex items-center space-x-3 mb-10 px-2 cursor-pointer" onClick={() => {
            if (location.pathname === '/feed') {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              if (onRefresh) onRefresh();
            } else {
              navigate('/feed');
            }
          }}>
            <Logo />
            <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Red Social</span>
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto scrollbar-hide pr-2">
            <NavItem to="/feed" icon={Home} label={t('home')} />
            <NavItem to="/news" icon={Newspaper} label={t('news')} />
            <NavItem to="/calendar" icon={Calendar} label={t('nav_calendar')} />
            <NavItem to="/messages" icon={MessageCircle} label={t('messages')} />
            <NavItem to="/notifications" icon={Bell} label={t('notifications')} badge={unreadCount} />
            <NavItem to={`/${user.username || user.id}`} icon={User} label={t('profile')} />
            <NavItem to="/settings" icon={Settings} label={t('settings')} />
          </nav>

          <div className="mt-auto pt-6 border-t border-slate-50 dark:border-zinc-900 relative">
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

            {isProfileMenuOpen && (
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsProfileMenuOpen(false)}
              />
            )}

            <div
              className={`w-full flex items-center justify-between p-2 rounded-2xl transition-all hover:bg-slate-50 dark:hover:bg-zinc-900 ${isProfileMenuOpen ? 'bg-slate-50 dark:bg-zinc-900' : ''}`}
            >
              <Link
                to={`/${user.username || user.id}`}
                className="flex items-center space-x-3 flex-1 min-w-0 cursor-pointer group"
              >
                <div className="relative flex-shrink-0">
                  <img src={user.avatar} className="w-10 h-10 rounded-xl object-cover border-2 border-transparent group-hover:border-blue-200 transition-all" alt="Avatar" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-xs font-black text-slate-900 dark:text-white leading-tight mb-1 group-hover:text-blue-600 transition-colors">
                    {user.username === 'novagob' ? `${user.name} ${user.lastName || ''}` : user.name}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold truncate">{user.username ? `@${user.username.toLowerCase()}` : user.department}</p>
                </div>
              </Link>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setIsProfileMenuOpen(!isProfileMenuOpen);
                }}
                className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-slate-300 hover:text-slate-500 transition-colors"
              >
                <MoreVertical size={16} />
              </button>
            </div>
          </div>
        </aside>

        <div className="flex-1 min-w-0 flex flex-col transition-all duration-300">
          {/* Mobile Header */}
          <header className={`bg-white dark:bg-[#0a0a0a] border-b border-slate-100 dark:border-zinc-900 px-4 py-4 flex items-center fixed md:hidden top-0 left-0 right-0 z-[70] h-16 transition-transform duration-300 ${['/feed', '/news'].includes(location.pathname) && scrollDirection === 'down' ? '-translate-y-full' : 'translate-y-0'}`}>
            <div className="flex-shrink-0 cursor-pointer" onClick={() => {
              if (location.pathname === '/feed') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                if (onRefresh) onRefresh();
              } else {
                navigate('/feed');
              }
            }}>
              <Logo />
            </div>

            <div className="flex-1 flex justify-center px-4">
              <form onSubmit={handleSearchFormSubmit} className="relative w-full max-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    const query = e.target.value;
                    onSearchChange?.(query);

                    if (query.length >= 1) {
                      setAutocompleteLoading(true);
                      supabase
                        .from('profiles')
                        .select('id, name, last_name, username, avatar, position')
                        .or(`name.ilike.%${query}%,last_name.ilike.%${query}%,username.ilike.%${query}%`)
                        .limit(5)
                        .then(({ data }) => {
                          setAutocompleteResults(data || []);
                          setShowAutocomplete(true);
                          setAutocompleteLoading(false);
                        });
                    } else {
                      setAutocompleteResults([]);
                      setShowAutocomplete(false);
                    }
                  }}
                  onFocus={() => setShowAutocomplete(true)}
                  onBlur={() => setTimeout(() => setShowAutocomplete(false), 200)}
                  placeholder={t('search_placeholder')}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-zinc-900 dark:text-white border border-slate-100 dark:border-zinc-800 rounded-xl text-xs font-bold focus:ring-2 focus:ring-inset focus:ring-blue-500 outline-none transition-all"
                />
                {showAutocomplete && (
                  <div className="absolute top-[calc(100%+8px)] left-[-15%] right-[-15%] bg-white dark:bg-[#111] border border-slate-100 dark:border-zinc-800 rounded-xl overflow-hidden z-[80] animate-in fade-in slide-in-from-top-1 duration-200 shadow-xl">
                    {!searchQuery ? (
                      <div className="bg-white dark:bg-[#111]">
                        {trendingTags.length > 0 ? (
                          <div className="divide-y divide-slate-50 dark:divide-zinc-900">
                            {trendingTags.map(({ tag, count }) => (
                              <button
                                key={tag}
                                onClick={() => {
                                  onSearchSubmit?.(`#${tag}`);
                                  setShowAutocomplete(false);
                                }}
                                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors active:bg-slate-100 group"
                              >
                                <div className="flex items-center space-x-3">
                                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                                    <TrendingUp size={14} />
                                  </div>
                                  <div className="flex flex-col items-start leading-tight">
                                    <span className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[140px]">#{tag}</span>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{count} {count === 1 ? 'post' : 'posts'}</span>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="p-6 text-center">
                            <p className="text-[10px] text-slate-400 italic">{t('no_trends_today')}</p>
                          </div>
                        )}
                      </div>
                    ) : autocompleteLoading ? (
                      <div className="p-8 text-center text-slate-400 text-xs text-[10px]">
                        <Loader2 className="animate-spin mx-auto mb-2 text-blue-500" size={20} />
                        <p className="animate-pulse">{t('searching')}</p>
                      </div>
                    ) : autocompleteResults.length > 0 ? (
                      <div>
                        {autocompleteResults.map(u => (
                          <div
                            key={u.id}
                            onClick={() => {
                              navigate(`/${u.username || u.id}`);
                              setShowAutocomplete(false);
                              onSearchChange('');
                            }}
                            className="flex items-center px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/10 cursor-pointer transition-colors border-b border-slate-50 dark:border-zinc-900 last:border-0"
                          >
                            <img src={u.avatar} className="w-8 h-8 rounded-full object-cover mr-3" alt="" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{u.name} {u.last_name}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-slate-400 text-xs italic">
                        {t('no_users_found')}
                      </div>
                    )}
                  </div>
                )}
                {showAutocomplete && <div className="fixed inset-0 z-[60]" onClick={() => setShowAutocomplete(false)} />}
              </form>
            </div>

            {location.pathname === '/settings' ? (
              <button onClick={() => navigate(-1)} className="flex-shrink-0 p-2 text-slate-400">
                <ArrowLeft size={22} />
              </button>
            ) : location.pathname === `/${user.username || user.id}` ? (
              <Link to="/settings" className="flex-shrink-0 p-2 text-slate-400">
                <Menu size={22} />
              </Link>
            ) : (
              <NavLink
                to="/notifications"
                className={({ isActive }) => `flex-shrink-0 p-2 relative ${isActive ? 'text-blue-600' : 'text-slate-400'}`}
              >
                <Bell size={22} />
                {unreadCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-[#0a0a0a]">{unreadCount}</span>}
              </NavLink>
            )}
          </header>

          <main className={`p-4 md:p-8 md:pb-8 ${['/feed', '/news'].includes(location.pathname) ? 'pt-0 md:pt-0' : 'pt-20 md:pt-8'} w-full max-w-[100vw] overflow-x-hidden ${location.pathname.startsWith('/messages/') && location.pathname.split('/').length > 2 ? 'pb-0' : 'pb-20'}`}>
            {children}
          </main>
        </div>

        {showSidebar && (
          <aside className="w-64 sticky top-0 h-screen bg-white dark:bg-[#0a0a0a] border-l border-slate-100 dark:border-zinc-900 hidden lg:flex flex-col p-4 z-30 animate-in slide-in-from-right duration-300">
            <div className="mb-6">
              <form onSubmit={handleSearchFormSubmit} className="relative w-full z-50">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    const query = e.target.value;
                    onSearchChange?.(query);
                    if (query.length >= 1) {
                      setAutocompleteLoading(true);
                      supabase
                        .from('profiles')
                        .select('id, name, last_name, username, avatar, position')
                        .or(`name.ilike.%${query}%,last_name.ilike.%${query}%,username.ilike.%${query}%`)
                        .limit(10)
                        .then(({ data }) => {
                          setAutocompleteResults(data || []);
                          setShowAutocomplete(true);
                          setAutocompleteLoading(false);
                        });
                    } else {
                      setAutocompleteResults([]);
                      setShowAutocomplete(false);
                    }
                  }}
                  onFocus={() => { if (searchQuery.length >= 1) setShowAutocomplete(true); }}
                  placeholder={t('search_placeholder')}
                  className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-zinc-900 dark:text-white border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-inset focus:ring-blue-500 outline-none transition-all"
                />
                {showAutocomplete && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#111] rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden max-h-80 overflow-y-auto z-50 animate-in fade-in slide-in-from-top-2 duration-200 shadow-xl">
                    {autocompleteLoading ? (
                      <div className="p-4 text-center text-slate-400 text-xs">
                        <span className="animate-pulse">{language === 'es' ? 'Buscando...' : 'Searching...'}</span>
                      </div>
                    ) : autocompleteResults.length > 0 ? (
                      <div>
                        {autocompleteResults.map(u => (
                          <div
                            key={u.id}
                            onClick={() => {
                              navigate(`/${u.username || u.id}`);
                              setShowAutocomplete(false);
                              onSearchChange('');
                            }}
                            className="flex items-center px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/10 cursor-pointer transition-colors border-b border-slate-50 dark:border-zinc-900 last:border-0"
                          >
                            <img src={u.avatar} className="w-8 h-8 rounded-full object-cover mr-3" alt="" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{u.name} {u.last_name}</p>
                              <p className="text-xs text-slate-400 truncate">{u.username ? `@${u.username}` : u.position}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-slate-400 text-xs italic">
                        {t('no_users_found')}
                      </div>
                    )}
                  </div>
                )}
                {showAutocomplete && <div className="fixed inset-0 z-40" onClick={() => setShowAutocomplete(false)} />}
              </form>
            </div>

            <div className="space-y-8 overflow-y-auto scrollbar-hide flex-1">

              <div className="p-6 bg-slate-50 dark:bg-zinc-900/50 rounded-3xl border border-slate-100 dark:border-zinc-800">
                <div className="flex items-center space-x-2 mb-4">
                  <TrendingUp size={18} className="text-blue-500" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">{t('trending')}</h3>
                </div>
                <div className="space-y-4">
                  {trendingTags.length > 0 ? trendingTags.map(({ tag, count }) => (
                    <button
                      key={tag}
                      onClick={() => onSearchSubmit?.(`#${tag}`)}
                      className="w-full text-left cursor-pointer group"
                    >
                      <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">#{tag}</p>
                      <p className="text-[10px] text-slate-400 font-bold">{count} {count === 1 ? 'post' : 'posts'}</p>
                    </button>
                  )) : (
                    <div className="text-center py-4">
                      <p className="text-xs text-slate-300 italic">{t('no_trends_today')}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 bg-white dark:bg-zinc-900/30 rounded-3xl border border-slate-100 dark:border-zinc-800">
                <div className="mb-4">
                  <Link to="/calendar" className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    {t('upcoming_events')}
                  </Link>
                </div>
                <div className="space-y-4">
                  {upcomingEvents.length > 0 ? upcomingEvents.map(event => {
                    const now = new Date();
                    now.setHours(0, 0, 0, 0);
                    const target = new Date(event.event_date);
                    target.setHours(0, 0, 0, 0);
                    const diffDays = Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                    return (
                      <button
                        key={event.id}
                        onClick={() => navigate('/calendar', { state: { date: event.event_date } })}
                        className="w-full text-left cursor-pointer group p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-800 transition-all hover:border-blue-200 dark:hover:border-blue-900/50"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-black text-slate-800 dark:text-white group-hover:text-blue-600 transition-colors">
                            {event.title}
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="text-purple-600 dark:text-purple-400">
                              {event.type === 'physical' ? <Pin size={12} /> : <Monitor size={12} />}
                            </div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">
                              {t(`event_${event.type}` as any) || event.type}
                            </span>
                          </div>
                          <span className={`text-[9px] font-black uppercase whitespace-nowrap ml-2 ${diffDays <= 3 ? 'text-red-500' : 'text-slate-400'}`}>
                            {getEventTimeLabel(event.event_date)}
                          </span>
                        </div>
                      </button>
                    );
                  }) : (
                    <p className="text-xs text-slate-300 italic">{t('no_community_events')}</p>
                  )}
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Mobile Nav */}
      <nav className={`md:hidden fixed bottom-0 inset-x-0 bg-white dark:bg-[#0a0a0a] border-t border-slate-100 dark:border-zinc-900 flex justify-around pt-3 pb-[calc(1rem+env(safe-area-inset-bottom,20px))] px-3 z-50 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)] transition-transform duration-300 ${['/feed', '/news'].includes(location.pathname) && scrollDirection === 'down' ? 'translate-y-full' : 'translate-y-0'} ${location.pathname.startsWith('/messages/') && location.pathname.split('/').length > 2 ? 'hidden' : ''}`}>
        {[
          { to: '/feed', icon: Home },
          { to: '/news', icon: Newspaper },
          { to: '/calendar', icon: Calendar },
          { to: '/messages', icon: MessageCircle },
        ].map(({ to, icon: Icon }) => (
          <button
            key={to}
            onClick={() => {
              if (location.pathname === to) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                if (onRefresh) onRefresh();
              } else {
                navigate(to);
              }
            }}
            className={location.pathname === to ? 'text-blue-600' : 'text-slate-300'}
          >
            <Icon size={22} />
          </button>
        ))}
        <button onClick={() => navigate(`/${user?.username || user?.id}`)} className={`rounded-full p-0.5 border-2 transition-all ${location.pathname === `/${user?.username || user?.id}` ? 'border-blue-600' : 'border-transparent'}`}>
          <img src={user?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'} alt="Profile" className="w-6 h-6 rounded-full object-cover" />
        </button>
      </nav>



      {showLogoutConfirm && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowLogoutConfirm(false)}>
          <div className="bg-white dark:bg-[#0a0a0a] w-full max-w-sm rounded-[2.5rem] overflow-hidden border border-white dark:border-zinc-800 animate-in zoom-in-95 duration-300 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-8 text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center"><AlertCircle size={32} /></div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{language === 'es' ? '¿Cerrar sesión ahora?' : 'Logout now?'}</h3>
                <p className="text-sm text-slate-500 dark:text-gray-400 font-medium leading-relaxed">{language === 'es' ? 'Tendrás que volver a introducir tus credenciales.' : 'You will have to enter your credentials again.'}</p>
              </div>
              <div className="flex flex-col gap-3">
                <button onClick={onLogout} className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-sm hover:bg-red-700 transition-all">{language === 'es' ? 'Sí, cerrar sesión' : 'Yes, logout'}</button>
                <button onClick={() => setShowLogoutConfirm(false)} className="w-full py-4 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-gray-400 rounded-2xl font-black text-sm">{language === 'es' ? 'Cancelar' : 'Cancel'}</button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
