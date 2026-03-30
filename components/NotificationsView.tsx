import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Heart, UserPlus, MessageSquare, Bell, ChevronUp, Repeat, Star, ShieldCheck, Award, AtSign, FileText, CheckCircle2, Gift, Sparkles, Trash2 } from 'lucide-react';
import { Notification, User, Reward } from '../types';
import { Language, useTranslation } from '../utils/translations';

interface NotificationsViewProps {
  notifications: Notification[];
  onMarkAllRead: (tab?: string, adminSubTab?: string) => void;
  onNotificationClick?: (postId?: string, senderId?: string, type?: string, newsId?: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  language: Language;
  onApproveUser?: (userId: string, notificationId: string) => void;
  onRejectUser?: (userId: string, notificationId: string) => void;
  onApproveRedemption?: (userId: string, rewardId: string, notificationId: string) => void;
  currentUser?: User;
  onNavigateToProfile?: (userId: string) => void;
  onViewRegistrationData?: (userId: string) => void;
  users?: User[];
  rewards?: Reward[];
  onDeleteNotification?: (notificationId: string) => void;
}

type Tab = 'all' | 'mentions' | 'followers' | 'rewards' | 'admin';

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  notifications,
  onMarkAllRead,
  onNotificationClick,
  onLoadMore,
  hasMore,
  language,
  onApproveUser,
  onRejectUser,
  onApproveRedemption,
  currentUser,
  onNavigateToProfile,
  onViewRegistrationData,
  users,
  rewards,
  onDeleteNotification
}) => {
  const t = useTranslation(language);
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [adminTab, setAdminTab] = useState<'solicitudes' | 'recompensas'>('solicitudes');
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent, notifId: string) => {
    // If the touch ended inside the delete panel, let the button's onClick handle it
    const target = e.target as HTMLElement;
    if (target.closest('[data-delete-panel]')) return;

    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
    // Horizontal swipe left, not vertical scroll
    if (dx < -50 && dy < 40) {
      setRevealedId(prev => prev === notifId ? null : notifId);
    } else if (dx > 30) {
      setRevealedId(null);
    }
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent, notifId: string) => {
    e.preventDefault();
    setRevealedId(prev => prev === notifId ? null : notifId);
  }, []);

  // Close revealed item when clicking elsewhere (but not when clicking the delete button itself)
  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-delete-panel]')) return;
    setRevealedId(null);
  }, []);
  
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Calculate unread counts for each tab
  const getUnreadCounts = () => {
    const counts = {
      all: 0,
      mentions: 0,
      followers: 0,
      rewards: 0,
      admin: 0,
      solicitudes: 0,
      recompensas: 0
    };

    notifications.forEach(n => {
      if (n.isRead) return;

      const content = n.content || '';
      const isAdminMsg = n.type === 'registration_request' ||
        n.type === 'reward_request' ||
        (n.type === 'system' && (content.includes('aprobado en la red') ||
          content.includes('rechazado en la red') ||
          content.includes('Solicitud de') ||
          content.includes('Canje de')));

      if (isAdminMsg) {
        counts.admin++;
        const isSolicitud = n.type === 'registration_request' ||
          (n.type === 'system' && content.includes('Solicitud de') && !content.includes('Canje de')) ||
          (n.type === 'system' && (content.includes('aprobado en la red') || content.includes('rechazado en la red')));
        
        // Admin Recompensas only for REQUESTS to be approved
        const isRecompensa = (n.type === 'reward_request' || content.includes('Solicitud de canje')) && 
                            !content.includes('(aceptado)') && !content.includes('(rechazado)');

        if (isSolicitud) counts.solicitudes++;
        if (isRecompensa) counts.recompensas++;
      } else {
        if (n.type === 'mention') {
          counts.mentions++;
        } else if (n.type === 'follow') {
          counts.followers++;
        } else if (n.type === 'reward_accepted' || (n.type === 'system' && (content.includes('ha sido canjeada') || content.includes('canje aceptado')) || content.toLowerCase().includes('novas') || content.toLowerCase().includes('insignia'))) {
          // User Rewards tab only for acceptances and earned items
          counts.rewards++;
        } else if (n.type === 'like' || n.type === 'comment' || n.type === 'event_support' || n.type === 'repost' || n.type === 'system' || n.type === 'reward_request') {
          counts.all++;
        }
      }
    });

    return counts;
  };

  const unreadCounts = getUnreadCounts();

  useEffect(() => {
    // When the component mounts or activeTab changes, mark those specific notifications as read
    console.log(`[NotificationsView] useEffect triggering onMarkAllRead for activeTab: ${activeTab}, adminTab: ${adminTab}`);
    if (activeTab === 'admin') {
      onMarkAllRead(activeTab, adminTab);
    } else {
      onMarkAllRead(activeTab);
    }
  }, [activeTab, adminTab, onMarkAllRead]);

  useEffect(() => {
    if (!onLoadMore) return;
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 400 && hasMore) {
        onLoadMore();
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [onLoadMore, hasMore]);


  const getIcon = (type: string, origContent: string | null = '') => {
    const content = origContent || '';
    switch (type) {
      case 'follow':
        return <UserPlus size={12} className="text-blue-600 dark:text-blue-400" />;
      case 'like':
        if (content.includes('flecha arriba')) {
          return <ChevronUp size={12} className="text-emerald-600 dark:text-emerald-400" />;
        }
        return <Heart size={12} className="text-pink-600 dark:text-pink-400" />;
      case 'comment':
        const isNews = content.includes('noticia');
        return isNews ? <MessageSquare size={12} className="text-orange-600 dark:text-orange-400" /> : <MessageSquare size={12} className="text-emerald-600 dark:text-emerald-400" />;
      case 'repost':
        return <Repeat size={12} className="text-emerald-600 dark:text-emerald-400" />;
      case 'system':
        if (content.includes('TOP 1') || content.includes('Ranking Semanal')) {
          return <Gift size={12} className="text-purple-600" />;
        }
        return <ShieldCheck size={12} className="text-blue-500" />;
      case 'registration_request':
        return <ShieldCheck size={12} className="text-blue-600 dark:text-blue-400" />;
      case 'reward_request':
        return <Gift size={12} className="text-purple-600" />;
      case 'reward_accepted':
        return <CheckCircle2 size={12} className="text-emerald-600" />;
      case 'mention':
        return <AtSign size={12} className="text-purple-500" />;
      case 'event_support':
        return <Heart size={12} className="text-pink-600 dark:text-pink-400" />;
      default:
        return <Bell size={12} className="text-gray-400" />;
    }
  };

  const getBgColor = (type: string, origContent: string | null = '') => {
    const content = origContent || '';
    switch (type) {
      case 'follow':
        return 'bg-blue-50 dark:bg-blue-900/20';
      case 'like':
        if (content.includes('flecha arriba')) {
          return 'bg-emerald-50 dark:bg-emerald-900/20';
        }
        return 'bg-pink-50 dark:bg-pink-900/20';
      case 'comment':
        const isNews = content.includes('noticia');
        return isNews ? 'bg-orange-50 dark:bg-orange-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20';
      case 'registration_request':
        return 'bg-blue-50 dark:bg-blue-900/20';
      case 'repost':
        return 'bg-emerald-50 dark:bg-emerald-900/20';
      case 'system':
        if (content.includes('TOP 1') || content.includes('Ranking Semanal')) {
          return 'bg-purple-50 dark:bg-purple-900/20';
        }
        return 'bg-blue-50 dark:bg-blue-900/20';
      case 'reward_request':
        return 'bg-purple-50 dark:bg-purple-900/20';
      case 'reward_accepted':
        return 'bg-emerald-50 dark:bg-emerald-900/20';
      case 'mention':
        return 'bg-purple-50 dark:bg-purple-900/20';
      case 'event_support':
        return 'bg-pink-50 dark:bg-pink-900/20';
      default:
        return 'bg-gray-50 dark:bg-zinc-800';
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'all') {
      // Exclude admin-only tasks, reward notifications and mentions from "All" (Todo)
      const c = (n.content || '').toLowerCase();
      if (
        n.type === 'registration_request' || 
        n.type === 'reward_request' || 
        n.type === 'reward_accepted' || 
        n.type === 'mention' || 
        n.type === 'follow' || 
        c.includes('canje') ||
        c.includes('novas') ||
        c.includes('recompensa') ||
        c.includes('ganado')
      ) return false;

      // Included: likes, votes, comments, reposts, system messages, event support
      return true;
    } else if (activeTab === 'mentions') {
      return n.type === 'mention';
    } else if (activeTab === 'followers') {
      return n.type === 'follow';
    } else if (activeTab === 'rewards') {
      const c = (n.content || '').toLowerCase();
      const type = n.type;
      return type === 'reward_request' || 
             type === 'reward_accepted' || 
             c.includes('canje') || 
             c.includes('novas') || 
             c.includes('insignia') || 
             c.includes('enhorabuena') || 
             c.includes('earned') ||
             c.includes('has ganado');
    } else if (activeTab === 'admin') {
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const isWithin24Hours = (ts?: string) => {
        if (!ts) return false;
        return new Date(ts) > twentyFourHoursAgo;
      };
      const c = (n.content || '').toLowerCase();
      const sender = users?.find(u => u.id === n.senderId);
      
      // Resolution detection
      const isRegistrationResolved = (sender && (sender.status === 'active' || sender.status === 'rejected')) || 
                                    c.includes('(aceptado)') || c.includes('(rechazado)') || c.includes('bienvenido') || c.includes('aprobad') || c.includes('rechazad');
      
      const isRewardResolved = c.includes('(aceptado)') || c.includes('(rechazado)');

      if (adminTab === 'solicitudes') {
        const isRequest = n.type === 'registration_request' || (n.type === 'system' && (c.includes('solicitud') || c.includes('aprobado') || c.includes('rechazado'))) && !c.includes('canje');
        if (!isRequest) return false;
        
        if (isRegistrationResolved) {
          // Use the most recent timestamp available. Fallback to NOW if resolved but no timestamp to prevent instant disappearance
          const resolveTime = (sender && (sender.status === 'active' || sender.status === 'rejected') && sender.updatedAt) ? sender.updatedAt : (n.updatedAt || (n.content.includes('(') ? now.toISOString() : n.timestamp));
          
          if (!resolveTime) return false;
          const hoursDiff = (now.getTime() - new Date(resolveTime).getTime()) / (1000 * 60 * 60);
          return hoursDiff < 24;
        }
        return true;
      } else if (adminTab === 'recompensas') {
        const isRewardRequest = (n.type === 'reward_request' || c.includes('solicitud de canje'));
        if (!isRewardRequest) return false;

        if (isRewardResolved) {
          const resolveTime = n.updatedAt || (n.content.includes('(') ? now.toISOString() : n.timestamp);
          const hoursDiff = (now.getTime() - new Date(resolveTime).getTime()) / (1000 * 60 * 60);
          return hoursDiff < 24;
        }
        return true;
      }
    }
    return true;
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-x-hidden pt-20 md:pt-0 px-4">
      <div className="flex items-center mb-2 md:hidden">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">{t('notifications')}</h2>
      </div>

      <div className="w-full max-w-full flex space-x-2 md:space-x-1.5 pt-2 pb-2 overflow-x-auto md:overflow-x-visible scrollbar-hide">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-5 md:px-2 py-2.5 rounded-full text-sm font-bold transition-all flex items-center justify-center space-x-2 relative flex-shrink-0 md:flex-1 whitespace-nowrap ${activeTab === 'all' ? 'bg-purple-600 text-white' : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-zinc-800 border border-gray-100 dark:border-zinc-800'}`}
        >
          <Bell size={16} className={activeTab === 'all' ? 'fill-current' : ''} />
          <span>{t('notif_tab_all')}</span>
          {unreadCounts.all > 0 && (
            <span className={`absolute -top-1 -right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full ${activeTab === 'all' ? 'bg-white text-purple-600' : 'bg-purple-600 text-white'} px-1 text-[10px] font-bold ring-2 ring-white dark:ring-[#111] transition-colors`}>
              {unreadCounts.all}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('mentions')}
          className={`px-5 md:px-2 py-2.5 rounded-full text-sm font-bold transition-all flex items-center justify-center space-x-2 relative flex-shrink-0 md:flex-1 whitespace-nowrap ${activeTab === 'mentions' ? 'bg-purple-600 text-white' : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-zinc-800 border border-gray-100 dark:border-zinc-800'}`}
        >
          <AtSign size={16} />
          <span>{t('notif_tab_mentions')}</span>
          {unreadCounts.mentions > 0 && (
            <span className={`absolute -top-1 -right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full ${activeTab === 'mentions' ? 'bg-white text-purple-600' : 'bg-purple-600 text-white'} px-1 text-[10px] font-bold ring-2 ring-white dark:ring-[#111] transition-colors`}>
              {unreadCounts.mentions}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('followers')}
          className={`px-5 md:px-2 py-2.5 rounded-full text-sm font-bold transition-all flex items-center justify-center space-x-2 relative flex-shrink-0 md:flex-1 whitespace-nowrap ${activeTab === 'followers' ? 'bg-purple-600 text-white' : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-zinc-800 border border-gray-100 dark:border-zinc-800'}`}
        >
          <UserPlus size={16} />
          <span>{t('notif_tab_followers')}</span>
          {unreadCounts.followers > 0 && (
            <span className={`absolute -top-1 -right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full ${activeTab === 'followers' ? 'bg-white text-purple-600' : 'bg-purple-600 text-white'} px-1 text-[10px] font-bold ring-2 ring-white dark:ring-[#111] transition-colors`}>
              {unreadCounts.followers}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('rewards')}
          className={`px-5 md:px-2 py-2.5 rounded-full text-sm font-bold transition-all flex items-center justify-center space-x-2 relative flex-shrink-0 md:flex-1 whitespace-nowrap ${activeTab === 'rewards' ? 'bg-purple-600 text-white' : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-zinc-800 border border-gray-100 dark:border-zinc-800'}`}
        >
          <Gift size={16} />
          <span>{t('notif_tab_rewards')}</span>
          {unreadCounts.rewards > 0 && (
            <span className={`absolute -top-1 -right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full ${activeTab === 'rewards' ? 'bg-white text-purple-600' : 'bg-purple-600 text-white'} px-1 text-[10px] font-bold ring-2 ring-white dark:ring-[#111] transition-colors`}>
              {unreadCounts.rewards}
            </span>
          )}
        </button>
        {currentUser?.isAdmin && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-5 md:px-2 py-2.5 rounded-full text-sm font-bold transition-all flex items-center justify-center space-x-2 relative flex-shrink-0 md:flex-1 whitespace-nowrap ${activeTab === 'admin' ? 'bg-purple-600 text-white' : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-zinc-800 border border-gray-100 dark:border-zinc-800'}`}
          >
            <ShieldCheck size={16} />
            <span>{t('notif_tab_admin')}</span>
            {unreadCounts.admin > 0 && (
              <span className={`absolute -top-1 -right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full ${activeTab === 'admin' ? 'bg-white text-purple-600' : 'bg-purple-600 text-white'} px-1 text-[10px] font-bold ring-2 ring-white dark:ring-[#111] transition-colors`}>
                {unreadCounts.admin}
              </span>
            )}
          </button>
        )}
      </div>

      {activeTab === 'admin' && currentUser?.isAdmin && (
        <div className="flex space-x-2 px-1 pt-2 mb-2">
          <button
            onClick={() => setAdminTab('solicitudes')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all relative ${adminTab === 'solicitudes' ? 'bg-purple-600 shadow-md text-white' : 'bg-slate-50 dark:bg-zinc-800 text-slate-500'}`}
          >
            {language === 'es' ? 'Solicitudes' : 'Requests'}
            {unreadCounts.solicitudes > 0 && (
              <span className={`absolute -top-1 -right-1 flex h-3.5 min-w-[0.875rem] items-center justify-center rounded-full ${adminTab === 'solicitudes' ? 'bg-white text-purple-600' : 'bg-purple-600 text-white'} px-1 text-[8px] font-bold border border-white dark:border-zinc-800 transition-colors`}>
                {unreadCounts.solicitudes}
              </span>
            )}
          </button>
          <button
            onClick={() => setAdminTab('recompensas')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all relative ${adminTab === 'recompensas' ? 'bg-purple-600 shadow-md text-white' : 'bg-slate-50 dark:bg-zinc-800 text-slate-500'}`}
          >
            {language === 'es' ? 'Recompensas' : 'Rewards'}
            {unreadCounts.recompensas > 0 && (
              <span className={`absolute -top-1 -right-1 flex h-3.5 min-w-[0.875rem] items-center justify-center rounded-full ${adminTab === 'recompensas' ? 'bg-white text-purple-600' : 'bg-purple-600 text-white'} px-1 text-[8px] font-bold border border-white dark:border-zinc-800 transition-colors`}>
                {unreadCounts.recompensas}
              </span>
            )}
          </button>
        </div>
      )}

      <div className="w-full bg-white dark:bg-[#111] rounded-2xl md:rounded-[2rem] border border-gray-100 dark:border-zinc-800 overflow-hidden min-h-[400px]" onClick={(e) => handleContainerClick(e as any)}>
        {filteredNotifications.length === 0 ? (
          <div className="py-20 text-center">
            <Bell className="mx-auto text-gray-100 dark:text-zinc-900 mb-4" size={64} />
            <p className="text-gray-400 dark:text-zinc-700 font-bold italic">{t('no_notifications')}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-zinc-900">
            {filteredNotifications.map((n) => {
              const content = n.content || '';
              const isRevealed = revealedId === n.id;
              return (
                <div
                  key={n.id}
                  className="relative overflow-hidden"
                  onTouchStart={handleTouchStart}
                  onTouchEnd={(e) => handleTouchEnd(e, n.id)}
                  onContextMenu={(e) => handleContextMenu(e, n.id)}
                >
                  {/* Delete button revealed on swipe/right-click */}
                  <div
                    data-delete-panel="true"
                    className={`absolute inset-y-0 right-0 flex items-center justify-center bg-red-500 transition-all duration-300 ease-in-out z-20 ${
                      isRevealed ? 'w-20 opacity-100' : 'w-0 opacity-0 pointer-events-none'
                    }`}
                  >
                    <button
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onDeleteNotification?.(n.id);
                        setRevealedId(null);
                      }}
                      className="flex flex-col items-center justify-center w-full h-full text-white gap-1"
                      title="Eliminar notificación"
                    >
                      <Trash2 size={18} strokeWidth={2.5} />
                      <span className="text-[10px] font-black uppercase tracking-wider">Borrar</span>
                    </button>
                  </div>

                  {/* Notification content — slides left when revealed */}
                  <div
                    onClick={(e) => {
                      if (isRevealed) { setRevealedId(null); return; }
                      const target = e.target as HTMLElement;
                      if (target.closest('button')) return;
                      onNotificationClick?.(n.postId, n.senderId, n.type, n.newsId);
                    }}
                    style={{ transform: isRevealed ? 'translateX(-80px)' : 'translateX(0)', transition: 'transform 0.3s ease' }}
                    className={`px-3 md:px-8 py-5 flex space-x-3 hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer relative ${isRevealed ? 'pointer-events-none' : ''} ${!n.isRead ? 'bg-red-50/20 dark:bg-red-900/10' : 'bg-white dark:bg-[#111]'}`}
                  >
                  {!n.isRead && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-purple-600 rounded-full"></div>
                  )}
                  <div
                    className="relative w-12 h-12 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={(e) => {
                      if (n.senderId) {
                        e.stopPropagation();
                        if (n.type === 'registration_request' && onViewRegistrationData) {
                          onViewRegistrationData(n.senderId);
                        } else {
                          onNavigateToProfile?.(n.senderId);
                        }
                      }
                    }}
                  >
                    {n.senderId === '00000000-0000-0000-0000-000000000000' ? (
                      <img src="/img/insignias/novagob.brand_isotipo_black.svg" className="w-12 h-12 rounded-2xl object-contain p-2 bg-slate-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800" alt="" />
                    ) : (
                      <img src={n.senderAvatar} className="w-12 h-12 rounded-2xl object-cover border border-gray-100 dark:border-zinc-800" alt="" />
                    )}
                    <div className={`absolute -bottom-0.5 -right-0.5 p-1 rounded-full border-2 border-white dark:border-zinc-800 ${getBgColor(n.type, content)} shadow-sm`}>
                      {getIcon(n.type, content)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    {n.type === 'reward_request' ? (
                      <div className="flex items-start justify-between gap-4">
                        <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed break-words">
                          El usuario <span className="font-black text-gray-900 dark:text-white">{n.senderName}</span> reclama: <span className="font-bold text-gray-900 dark:text-white">{(n.content || '').replace(/.*Ha solicitado canjear la recompensa:|Canje de recompensa:/i, '').replace(/\(aceptado\)|\(rechazado\)/gi, '').trim()}</span>
                        </p>
                        <div className="flex-shrink-0 flex items-center gap-2">
                          {(n.content || '').includes('(aceptado)') ? (
                            <button className="px-4 py-1.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg cursor-default border border-emerald-200 transition-none whitespace-nowrap">
                              Aceptada
                            </button>
                          ) : !(n.content || '').includes('(rechazado)') && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onApproveRedemption?.(n.senderId || '', n.postId || '', n.id); }}
                              className="px-6 py-2 bg-purple-600 text-white text-sm font-bold rounded-lg hover:bg-purple-700 transition-colors shadow-sm whitespace-nowrap"
                            >
                              {t('accept_redemption')}
                            </button>
                          )}
                        </div>
                      </div>
                    ) : n.type === 'reward_accepted' ? (
                      <div className="flex items-start justify-between gap-4 w-full">
                        <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed break-words">
                          {(() => {
                            let displayName = n.content;
                            if (displayName === 'Tu solicitud de recompensa ha sido canjeada' && n.postId && rewards) {
                              const r = rewards.find(rw => rw.id === n.postId);
                              if (r) displayName = r.name;
                            }
                            return (
                              <>
                                La recompensa <span className="font-black text-gray-900 dark:text-white">"{displayName}"</span>
                              </>
                            );
                          })()}
                        </p>
                        <button className="flex-shrink-0 px-4 py-1.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg cursor-default border border-emerald-200 transition-none whitespace-nowrap">
                          Aceptada
                        </button>
                      </div>
                    ) : (n.type === 'system' && (n.content || '').includes('Canje de')) ? (
                      <div className="flex items-start justify-between gap-4">
                        <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed break-words">
                          {(n.content || '').replace(/\(aceptado\)|\(rechazado\)/gi, '').trim()}
                        </p>
                        {(n.content || '').includes('(aceptado)') && (
                          <button className="flex-shrink-0 px-4 py-1.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg cursor-default border border-emerald-200 transition-none whitespace-nowrap">
                            Aceptada
                          </button>
                        )}
                      </div>
                    ) : (n.type === 'system' && ((n.content || '').toLowerCase().includes('bienvenido') || (n.content || '').toLowerCase().includes('rechazada') || (n.content || '').toLowerCase().includes('tu solicitud de registro ha sido') || (n.content || '').toLowerCase().includes('formas parte de la red social'))) ? (
                      <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed break-words">
                        {content.replace(/¡Bienvenido\/a!\s*/gi, '').split(/(Red Social)/gi).map((part, i) => part.toLowerCase() === 'red social' ? <span key={i} className="font-bold">{part}</span> : part)}
                      </p>
                    ) : n.type === 'registration_request' || (n.type === 'system' && (n.content || '').toLowerCase().includes('solicitud')) ? (
                      <div className="flex items-start justify-between gap-4 w-full">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed break-words flex items-center gap-2">
                            <span className="text-slate-500 font-medium">Solicitud de</span>
                            <span className="font-black text-gray-900 dark:text-white">{n.senderName}</span>
                          </p>
                          {(() => {
                            const senderDetails = users?.find(u => u.id === n.senderId);
                            const isOrg = senderDetails?.isOrganization;
                            const c = (n.content || '').toLowerCase();
                            const isResolved = c.includes('(aceptado)') || c.includes('(rechazado)') || c.includes('bienvenido') || c.includes('aprobad') || c.includes('rechazad');
                            
                            if (isResolved) return null; // Keep it simple when resolved

                            return (
                              <div className="flex items-center gap-1.5 pt-0.5">
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${isOrg ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                                  {isOrg ? 'Organización' : 'Personal'}
                                </span>
                              </div>
                            );
                          })()}
                        </div>
                        {(() => {
                          const c = (n.content || '').toLowerCase();
                          const isAceptada = c.includes('aceptad') || c.includes('aprobad') || c.includes('bienvenido');
                          const isRechazada = c.includes('rechazad');
                          if (isAceptada) {
                            return (
                              <button className="flex-shrink-0 px-4 py-1.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg cursor-default border border-emerald-200 transition-none whitespace-nowrap">
                                Aceptada
                              </button>
                            );
                          }
                          if (isRechazada) {
                            return (
                              <button className="flex-shrink-0 px-4 py-1.5 bg-red-100 text-red-700 text-xs font-bold rounded-lg cursor-default border border-red-200 transition-none whitespace-nowrap">
                                Rechazada
                              </button>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed break-words">
                        {n.senderName && <span className="font-black text-gray-900 dark:text-white mr-1">{n.senderName}</span>}
                        {content.split(/(\*\*.*?\*\*)/).map((part, i) =>
                          part.startsWith('**') && part.endsWith('**')
                            ? <span key={i} className="font-black text-gray-900 dark:text-white">{part.slice(2, -2)}</span>
                            : part
                        )}
                      </p>
                    )}

                    {n.type === 'registration_request' &&
                      !(n.content || '').toLowerCase().includes('aceptada') &&
                      !(n.content || '').toLowerCase().includes('rechazada') &&
                      !(n.content || '').toLowerCase().includes('bienvenido') &&
                      !(n.content || '').toLowerCase().includes('aprobad') &&
                      !(n.content || '').includes('(aceptado)') &&
                      !(n.content || '').includes('(rechazado)') && (
                        <div className="flex flex-wrap gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => { e.stopPropagation(); onApproveUser?.(n.senderId || '', n.id); }}
                            className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                          >
                            Aceptar
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onRejectUser?.(n.senderId || '', n.id); }}
                            className="px-4 py-1.5 bg-white border border-gray-200 text-red-600 text-xs font-bold rounded-lg hover:bg-red-50 transition-colors shadow-sm"
                          >
                            Rechazar
                          </button>
                        </div>
                      )}

                    <p className="text-xs text-gray-400 dark:text-zinc-600 font-bold mt-1 uppercase">
                      {new Date(n.timestamp).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'long' })} {t('at_time')} {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {hasMore ? (
        <div className="flex justify-center pb-8">
          <div className="flex items-center space-x-2 text-slate-400 font-bold animate-pulse">
            <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></span>
            <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></span>
            <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></span>
          </div>
        </div>
      ) : filteredNotifications.length > 0 && (
        <div className="py-6 flex flex-col items-center justify-center space-y-3">
          <div className="h-px w-12 bg-gray-100 dark:bg-zinc-800" />
          <p className="text-[10px] font-black text-gray-400 dark:text-zinc-600 uppercase tracking-[0.2em]">
            {t('end_of_results')}
          </p>
          <Sparkles size={16} className="text-gray-200 dark:text-zinc-800" />
        </div>
      )}

    </div >
  );
};
