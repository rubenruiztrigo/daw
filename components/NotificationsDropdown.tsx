
import React from 'react';
import { Heart, UserPlus, MessageSquare, Bell, X, ChevronUp, Repeat, ShieldCheck, Gift } from 'lucide-react';
import { Notification } from '../types';

interface NotificationsDropdownProps {
  notifications: Notification[];
  onClose: () => void;
}

export const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({ notifications, onClose }) => {
  const getIcon = (type: string, content: string = "") => {
    const isNews = content.toLowerCase().includes('noticia');
    switch (type) {
      case 'like':
        if (isNews) {
          return <ChevronUp size={14} className="text-orange-500" strokeWidth={3} />;
        }
        return <Heart size={14} className="text-pink-500" fill="currentColor" />;
      case 'follow': return <UserPlus size={14} className="text-blue-500" />;
      case 'comment': return <MessageSquare size={14} className={isNews ? "text-orange-500" : "text-green-500"} />;
      case 'repost': return <Repeat size={14} className="text-emerald-500" strokeWidth={3} />;
      case 'event_support': return <Heart size={14} className="text-pink-500" />;
      case 'registration_request': return <ShieldCheck size={14} className="text-blue-500" />;
      case 'system':
        if (content.includes('TOP 1') || content.includes('Ranking Semanal')) {
          return <Gift size={14} className="text-purple-600" />;
        }
        return <ShieldCheck size={14} className="text-blue-500" />;
      default: return <Bell size={14} className="text-gray-400" />;
    }
  };

  const getBgColor = (type: string, content: string = "") => {
    const isNews = content.toLowerCase().includes('noticia');
    switch (type) {
      case 'like': return isNews ? 'bg-orange-50' : 'bg-pink-50';
      case 'follow': return 'bg-blue-50';
      case 'comment': return isNews ? 'bg-orange-50' : 'bg-green-50';
      case 'repost': return 'bg-emerald-50';
      case 'event_support': return 'bg-pink-50';
      case 'registration_request': return 'bg-blue-50';
      case 'system':
        if (content.includes('TOP 1') || content.includes('Ranking Semanal')) {
          return 'bg-purple-50';
        }
        return 'bg-blue-50';
      default: return 'bg-gray-50';
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose}></div>
      <div className="absolute right-0 mt-3 w-80 bg-white rounded-3xl border border-gray-100 py-4 z-50 animate-in fade-in zoom-in-95 duration-150 origin-top-right overflow-hidden flex flex-col max-h-[480px]">
        <div className="px-6 pb-3 border-b border-gray-50 flex justify-between items-center">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Notificaciones</h3>
          <span className="bg-blue-100 text-blue-600 text-[10px] font-black px-2 py-0.5 rounded-full">
            {notifications.length}
          </span>
        </div>

        <div className="overflow-y-auto flex-1 scrollbar-hide">
          {notifications.length === 0 ? (
            <div className="py-12 text-center">
              <Bell className="mx-auto text-gray-100 mb-2" size={40} />
              <p className="text-xs text-gray-400 font-bold italic">No tienes notificaciones aún.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`px-6 py-4 flex space-x-3 hover:bg-gray-50 transition-all cursor-pointer relative group ${!n.isRead ? 'bg-blue-50/20' : ''}`}
              >
                {!n.isRead && (
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                )}
                <div className="relative flex-shrink-0">
                  <img src={n.senderAvatar} className="w-10 h-10 rounded-xl object-cover" alt="" />
                  <div className={`absolute -bottom-1 -right-1 p-1 rounded-full border-2 border-white ${getBgColor(n.type, n.content)}`}>
                    {getIcon(n.type, n.content)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-800 leading-snug">
                    <span className="font-black text-gray-900">{n.senderName}</span> {n.content}
                  </p>
                  <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase">
                    {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="px-6 pt-3 border-t border-gray-50">
          <button
            className="w-full py-2 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:bg-blue-50 rounded-xl transition-all"
            onClick={onClose}
          >
            Cerrar panel
          </button>
        </div>
      </div>
    </>
  );
};
