
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useScrollLock } from '../hooks/useScrollLock';
import { X, Check, Save, Heart } from 'lucide-react';
import { User } from '../types';
import { PUBLIC_INTERESTS } from '../constants';

interface PreferencesModalProps {
  user: User;
  onClose: () => void;
  onSave: (updatedUser: User) => void;
}

export const PreferencesModal: React.FC<PreferencesModalProps> = ({ user, onClose, onSave }) => {
  useScrollLock();
  const [selectedInterests, setSelectedInterests] = useState<string[]>(user.interests || []);

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSave = () => {
    onSave({ ...user, interests: selectedInterests });
    onClose();
  };


  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-2xl rounded-[2.5rem] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 border border-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
              <Heart size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Intereses</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Personaliza tu feed y conexiones</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-all"
          >
            <X size={20} />
          </button>
        </div>


        <div className="flex-1 overflow-y-auto p-8 pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PUBLIC_INTERESTS.map(interest => {
              const isSelected = selectedInterests.includes(interest);
              return (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all group ${isSelected
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-slate-100 text-slate-600 hover:border-blue-200'
                    }`}
                >
                  <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-slate-700'}`}>
                    {interest}
                  </span>
                  {isSelected ? (
                    <Check size={18} className="text-white" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-slate-100 group-hover:border-blue-200" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-8 border-t border-slate-50 flex space-x-3 bg-white">
          <button
            onClick={onClose}
            className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all flex items-center justify-center space-x-2 transform active:scale-95"
          >
            <Save size={18} />
            <span>Guardar Preferencias</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
