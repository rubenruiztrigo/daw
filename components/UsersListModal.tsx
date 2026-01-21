
import React from 'react';
import { X, Users, ArrowRight } from 'lucide-react';
import { MOCK_USERS_LIST } from '../constants';

interface UsersListModalProps {
  type: 'followers' | 'following';
  onClose: () => void;
  onNavigate: (userId: string) => void;
}

export const UsersListModal: React.FC<UsersListModalProps> = ({ type, onClose, onNavigate }) => {
  // Para el mock, mostraremos una lista aleatoria de los usuarios existentes
  const displayUsers = MOCK_USERS_LIST.filter((_, i) => i !== 0); // No mostrar al usuario actual

  return (
    <div 
      className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-300 border border-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
              <Users size={20} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              {type === 'followers' ? 'Seguidores' : 'Siguiendo'}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
          {displayUsers.map((person) => (
            <div 
              key={person.id} 
              className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-all group cursor-pointer"
              onClick={() => onNavigate(person.id)}
            >
              <div className="flex items-center space-x-3">
                <img src={person.avatar} className="w-12 h-12 rounded-xl object-cover shadow-sm" alt="" />
                <div>
                  <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{person.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase truncate max-w-[180px]">{person.position}</p>
                </div>
              </div>
              <button 
                className="p-2 bg-white border border-slate-100 text-slate-400 rounded-xl group-hover:text-blue-600 group-hover:border-blue-100 transition-all"
              >
                <ArrowRight size={18} />
              </button>
            </div>
          ))}

          {displayUsers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-300 italic font-bold">No hay usuarios en esta lista.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
