import React, { useEffect } from 'react';
import { Heart, UserPlus, MessageSquare, Bell, ChevronUp, Repeat, Star, ShieldCheck } from 'lucide-react';
import { Notification } from '../types';
import { Language, useTranslation } from '../utils/translations';

interface NotificationsViewProps {
  notifications: Notification[];
  onMarkAllRead: () => void;
  onNotificationClick?: (postId?: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  language: Language;
  onApproveUser?: (userId: string, notificationId: string) => void;
  onRejectUser?: (userId: string, notificationId: string) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  notifications,
  onMarkAllRead,
  onNotificationClick,
  onLoadMore,
  hasMore,
  language,
  onApproveUser,
  onRejectUser
}) => {
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const t = useTranslation(language);

  useEffect(() => {
    if (unreadCount > 0) {
      onMarkAllRead();
    }
  }, [unreadCount, onMarkAllRead]);

  const getIcon = (type: string, content: string = "") => {
    const isNews = content.toLowerCase().includes('noticia') || content.toLowerCase().includes('news');
    const isEvent = content.toLowerCase().includes('evento') || content.toLowerCase().includes('event');
    const isComment = content.toLowerCase().includes('comentario') || content.toLowerCase().includes('comment');

    switch (type) {
      case 'like':
        if (isNews) return <ChevronUp size={18} className="text-emerald-500" strokeWidth={3} />;
        if (isEvent) return <Star size={18} className="text-amber-500" fill="currentColor" />;
        if (isComment) return <Heart size={16} className="text-pink-400" fill="currentColor" />;
        return <Heart size={18} className="text-pink-500" fill="currentColor" />;
      case 'follow':
        return <UserPlus size={18} className="text-blue-500" />;
      case 'comment':
        return <MessageSquare size={18} className={isNews ? "text-orange-600" : "text-emerald-500"} />;
      case 'registration_request':
        return <UserPlus size={18} className="text-orange-500" />;
      case 'repost':
        return <Repeat size={18} className="text-emerald-500" strokeWidth={3} />;
      case 'system':
        return <ShieldCheck size={18} className="text-blue-500" />;
      default:
        return <Bell size={18} className="text-gray-400" />;
    }
  };

  const getBgColor = (type: string, content: string = "") => {
    const isNews = content.toLowerCase().includes('noticia') || content.toLowerCase().includes('news');
    const isEvent = content.toLowerCase().includes('evento') || content.toLowerCase().includes('event');
    const isComment = content.toLowerCase().includes('comentario') || content.toLowerCase().includes('comment');

    switch (type) {
      case 'like':
        if (isNews) return 'bg-emerald-50 dark:bg-emerald-900/20';
        if (isEvent) return 'bg-amber-50 dark:bg-amber-900/20';
        if (isComment) return 'bg-pink-50/50 dark:bg-pink-900/10';
        return 'bg-pink-50 dark:bg-pink-900/20';
      case 'follow':
        return 'bg-blue-50 dark:bg-blue-900/20';
      case 'comment':
        return isNews ? 'bg-orange-50 dark:bg-orange-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20';
      case 'registration_request':
        return 'bg-orange-50 dark:bg-orange-900/20';
      case 'repost':
        return 'bg-emerald-50 dark:bg-emerald-900/20';
      case 'system':
        return 'bg-blue-50 dark:bg-blue-900/20';
      default:
        return 'bg-gray-50 dark:bg-zinc-800';
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center mb-2">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">{t('notifications')}</h2>
      </div>
      <div className="bg-white dark:bg-[#111] rounded-[2rem] border border-gray-100 dark:border-zinc-800 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="py-20 text-center">
            <Bell className="mx-auto text-gray-100 dark:text-zinc-900 mb-4" size={64} />
            <p className="text-gray-400 dark:text-zinc-700 font-bold italic">{t('no_notifications')}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-zinc-900">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => onNotificationClick?.(n.postId)}
                className={`px-8 py-6 flex space-x-4 hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-all cursor-pointer relative ${!n.isRead ? 'bg-red-50/20 dark:bg-red-900/10' : ''}`}
              >
                {!n.isRead && (
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-red-600 rounded-full animate-pulse"></div>
                )}
                <div className="relative flex-shrink-0">
                  <img src={n.senderAvatar} className="w-12 h-12 rounded-2xl object-cover border border-gray-100 dark:border-zinc-800" alt="" />
                  <div className={`absolute -bottom-1 -right-1 p-1.5 rounded-full border-2 border-white dark:border-zinc-800 ${getBgColor(n.type, n.content)}`}>
                    {getIcon(n.type, n.content)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                    <span className="font-black text-gray-900 dark:text-white">{n.senderName}</span> {n.content}
                  </p>

                  {n.type === 'registration_request' && (
                    <div className="flex space-x-3 mt-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); onApproveUser?.(n.senderId || '', n.id); }} // Assuming senderId is the new user's ID (which it is in our implementation)
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
            ))}
          </div>
        )}
      </div>

      {hasMore && notifications.length > 0 && (
        <div className="flex justify-center pb-8">
          <button
            onClick={onLoadMore}
            className="px-6 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-full text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-900 transition-all"
          >
            {t('show_more')}
          </button>
        </div>
      )}
    </div>
  );
};
