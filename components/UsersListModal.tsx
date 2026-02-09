
import React, { useEffect, useState } from 'react';
import { X, Users, ArrowRight, Loader2, UserPlus, UserMinus, Check } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { User } from '../types';

interface UsersListModalProps {
  type: 'followers' | 'following' | 'event-supporters';
  userId: string; // Used as eventId when type is event-supporters
  onClose: () => void;
  onNavigate: (userId: string) => void;
  currentUserFollowedIds?: Set<string>;
  currentUserFollowerIds?: Set<string>;
  onToggleFollow?: (userId: string) => void;
  currentUserId?: string;
}

export const UsersListModal: React.FC<UsersListModalProps> = ({ type, userId, onClose, onNavigate, currentUserFollowedIds, currentUserFollowerIds, onToggleFollow, currentUserId }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, [type, userId]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let query;
      if (type === 'followers') {
        // Personas que siguen al usuario (userId). Buscamos donde él es el "seguido".
        query = supabase
          .from('follows')
          .select('profile:profiles!follower_id(*)')
          .eq('followed_id', userId);
      } else if (type === 'following') {
        // Personas a las que el usuario (userId) sigue. Buscamos donde él es el "seguidor".
        query = supabase
          .from('follows')
          .select('profile:profiles!followed_id(*)')
          .eq('follower_id', userId);
      } else {
        // Personas que apoyan un evento (userId es el eventId aquí)
        query = supabase
          .from('event_supports')
          .select('profile:profiles!user_id(*)')
          .eq('event_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const mappedUsers = data.map((item: any) => {
        const profile = item.profile;
        return {
          id: profile.id,
          name: profile.name,
          lastName: profile.last_name,
          position: profile.position || 'Personal Público',
          department: profile.department || 'Administración',
          avatar: profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`,
          bio: profile.bio || '',
          interests: profile.interests || [],
          followers: profile.followers_count || 0,
          following: profile.following_count || 0,
          joinedDate: profile.created_at,
          country: profile.country,
          region: profile.region
        };
      });

      // Sort: If viewing followers, put connections (users I follow) first
      if (type === 'followers' && currentUserFollowedIds) {
        mappedUsers.sort((a: User, b: User) => {
          const aIsFollowed = currentUserFollowedIds.has(a.id!) ? 1 : 0;
          const bIsFollowed = currentUserFollowedIds.has(b.id!) ? 1 : 0;
          return bIsFollowed - aIsFollowed;
        });
      }

      setUsers(mappedUsers);
    } catch (err) {
      console.error('Error fetching users for list:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#0a0a0a] w-full max-w-md rounded-[2.5rem] overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-300 border border-white dark:border-zinc-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-50 dark:border-zinc-900 flex justify-between items-center bg-white dark:bg-[#0a0a0a] sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 dark:bg-zinc-900 rounded-xl text-blue-600">
              <Users size={20} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {type === 'followers' ? 'Seguidores' : type === 'following' ? 'Siguiendo' : 'Apoyos del evento'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-50 dark:hover:bg-zinc-900 rounded-full text-slate-400 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <Loader2 className="animate-spin text-blue-600" size={32} />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sincronizando red...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-50 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="text-slate-200 dark:text-zinc-800" size={32} />
              </div>
              <p className="text-slate-300 dark:text-zinc-600 italic font-bold">No hay usuarios en esta lista aún.</p>
            </div>
          ) : (
            users.map((person) => {
              const isMutual = currentUserFollowedIds?.has(person.id!) && currentUserFollowerIds?.has(person.id!);
              const isFollowed = currentUserFollowedIds?.has(person.id!);
              const isFollower = currentUserFollowerIds?.has(person.id!);

              return (
                <div
                  key={person.id}
                  className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all group cursor-pointer"
                  onClick={() => {
                    onNavigate(person.id!);
                    onClose();
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <img src={person.avatar} className="w-12 h-12 rounded-xl object-cover" alt="" />
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">{person.name} {person.lastName || ''}</p>
                      <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase truncate max-w-[180px]">{person.position}</p>
                    </div>
                  </div>
                  {person.id !== currentUserId && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFollow?.(person.id!);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all flex items-center space-x-1 ${isMutual ? 'bg-green-50 dark:bg-green-900/20 text-green-600' : isFollowed ? 'bg-slate-100 dark:bg-zinc-800 text-slate-400' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-600 hover:text-white'}`}
                    >
                      {isMutual ? (
                        <span>Amigos</span>
                      ) : isFollowed ? (
                        <>
                          <UserMinus size={12} />
                          <span>Siguiendo</span>
                        </>
                      ) : isFollower ? (
                        <>
                          <UserPlus size={12} />
                          <span>Seguir también</span>
                        </>
                      ) : (
                        <>
                          <UserPlus size={12} />
                          <span>Seguir</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-zinc-900/50 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-center">
          <span className="text-[9px] font-black text-slate-300 dark:text-zinc-600 uppercase tracking-widest">Comunidad Profesional Red Social de NovaGob</span>
        </div>
      </div>
    </div>
  );
};
