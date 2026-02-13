import React from 'react';
import { User, MapPin, UserPlus, UserMinus, ArrowRight } from 'lucide-react';
import { User as UserType } from '../types';
import { Language, useTranslation } from '../utils/translations';

interface UserInfoDropdownProps {
  userId: string;
  onClose: () => void;
  onNavigate: (userId: string) => void;
  isFollowed?: boolean;
  isFollower?: boolean;
  onToggleFollow?: (userId: string) => void;
  users: UserType[];
  currentUserId?: string;
  language: Language;
}

export const UserInfoDropdown: React.FC<UserInfoDropdownProps> = ({
  userId,
  onClose,
  onNavigate,
  isFollowed,
  isFollower,
  onToggleFollow,
  users,
  currentUserId,
  language
}) => {
  const userInfo = users.find(u => u.id === userId);
  const t = useTranslation(language);

  if (!userInfo) return null;

  return (
    <div
      className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-[#111] rounded-[2rem] border border-slate-100 dark:border-zinc-800 z-[120] animate-in fade-in zoom-in-95 duration-200 overflow-hidden origin-top-left"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="h-16 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
      <div className="px-6 pb-6">
        <div className="relative -mt-8 mb-3">
          <img
            src={userInfo.avatar}
            className="w-16 h-16 rounded-2xl border-4 border-white dark:border-zinc-800 object-cover"
            alt=""
          />
        </div>

        <div className="space-y-1 mb-4">
          <h4 className="font-black text-slate-900 dark:text-white leading-tight">{userInfo.name} {userInfo.lastName || ''}</h4>
          <p className="text-[10px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-widest">{userInfo.position}</p>
          <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold truncate">{userInfo.department}</p>
        </div>

        <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2 mb-4 font-medium leading-relaxed">
          {userInfo.bio || t('no_bio')}
        </p>

        <div className="flex items-center space-x-4 mb-5 pb-4 border-b border-slate-50 dark:border-zinc-900">
          <div className="flex flex-col">
            <span className="text-xs font-black text-slate-900 dark:text-white">{userInfo.followers}</span>
            <span className="text-[8px] text-slate-400 dark:text-zinc-600 font-black uppercase tracking-tighter">{t('followers')}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-black text-slate-900 dark:text-white">{userInfo.following}</span>
            <span className="text-[8px] text-slate-400 dark:text-zinc-600 font-black uppercase tracking-tighter">{t('following_label')}</span>
          </div>
          <div className="flex items-center text-[10px] text-slate-400 dark:text-zinc-600 font-bold ml-auto">
            <MapPin size={10} className="mr-1" />
            <span>{userInfo.country || (language === 'es' ? 'España' : 'Spain')}</span>
          </div>
        </div>

        <div className="flex space-x-2">
          {userId !== currentUserId && (
            <button
              onClick={() => onToggleFollow?.(userId)}
              className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center space-x-1 ${isFollowed
                ? 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'
                : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-zinc-800'
                }`}
            >
              {isFollowed ? <UserMinus size={12} /> : <UserPlus size={12} />}
              <span>
                {isFollowed && isFollower ? t('friends') :
                  isFollowed ? t('following_label') :
                    isFollower ? t('follow_also') : t('follow')}
              </span>
            </button>
          )}
          <button
            onClick={() => {
              onNavigate(userId);
              onClose();
            }}
            className={`${userId === currentUserId ? 'w-full' : 'flex-1'} py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-blue-700 transition-all flex items-center justify-center space-x-1`}
          >
            <span>{t('view_profile')}</span>
            <ArrowRight size={10} />
          </button>
        </div>
      </div>
    </div>
  );
};
