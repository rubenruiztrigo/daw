
import React, { useMemo } from 'react';
import { User, MapPin, UserPlus, UserMinus, ArrowRight, Check } from 'lucide-react';
import { User as UserType } from '../types';

interface UserInfoDropdownProps {
  userId: string;
  onClose: () => void;
  onNavigate: (userId: string) => void;
  isFollowed?: boolean;
  isFollower?: boolean;
  onToggleFollow?: (userId: string) => void;
  users: UserType[];
}

export const UserInfoDropdown: React.FC<UserInfoDropdownProps> = ({ 
  userId, 
  onClose, 
  onNavigate,
  isFollowed,
  isFollower,
  onToggleFollow,
  users
}) => {
  const userInfo = users.find(u => u.id === userId);

  const isMutual = useMemo(() => !!isFollowed && !!isFollower, [isFollowed, isFollower]);

  if (!userInfo) return null;

  return (
    <div 
      className="absolute top-0 -translate-y-[calc(100%-40px)] left-0 w-72 bg-white rounded-[2rem] shadow-2xl border border-slate-100 z-[120] animate-in fade-in zoom-in-95 duration-200 overflow-hidden origin-bottom-left"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="h-16 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
      <div className="px-6 pb-6">
        <div className="relative -mt-8 mb-3">
          <img 
            src={userInfo.avatar} 
            className="w-16 h-16 rounded-2xl border-4 border-white object-cover shadow-md" 
            alt="" 
          />
        </div>
        
        <div className="space-y-1 mb-4">
          <h4 className="font-black text-slate-900 leading-tight">{userInfo.name} {userInfo.lastName || ''}</h4>
          <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest">{userInfo.position}</p>
          <p className="text-[10px] text-slate-400 font-bold truncate">{userInfo.department}</p>
        </div>

        <p className="text-xs text-slate-500 line-clamp-2 mb-4 font-medium leading-relaxed">
          {userInfo.bio}
        </p>

        <div className="flex items-center space-x-4 mb-5 pb-4 border-b border-slate-50">
          <div className="flex flex-col">
            <span className="text-xs font-black text-slate-900">{userInfo.followers}</span>
            <span className="text-[8px] text-slate-400 font-black uppercase tracking-tighter">Seguidores</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-black text-slate-900">{userInfo.following}</span>
            <span className="text-[8px] text-slate-400 font-black uppercase tracking-tighter">Siguiendo</span>
          </div>
          <div className="flex items-center text-[10px] text-slate-400 font-bold ml-auto">
            <MapPin size={10} className="mr-1" />
            <span>{userInfo.country || 'España'}</span>
          </div>
        </div>

        <div className="flex space-x-2">
          <button 
            onClick={() => onToggleFollow?.(userId)}
            className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center space-x-1 ${
              isMutual
                ? 'bg-green-50 text-green-600'
                : isFollowed 
                  ? 'bg-slate-100 text-slate-500' 
                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
            }`}
          >
            {isMutual ? <Check size={12}/> : isFollowed ? <UserMinus size={12}/> : <UserPlus size={12}/>}
            <span>{isMutual ? 'Amigos' : isFollowed ? 'Siguiendo' : 'Seguir'}</span>
          </button>
          <button 
            onClick={() => {
              onNavigate(userId);
              onClose();
            }}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-blue-700 transition-all flex items-center justify-center space-x-1"
          >
            <span>Ver Perfil</span>
            <ArrowRight size={10} />
          </button>
        </div>
      </div>
    </div>
  );
};
