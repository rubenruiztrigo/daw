
import React, { useState } from 'react';
import { X, Save, Briefcase, Building, Globe, Pencil, AlignLeft, AtSign } from 'lucide-react';
import { User } from '../types';
import { COUNTRIES, COUNTRIES_DATA } from '../constants';

interface EditProfileModalProps {
  user: User;
  onClose: () => void;
  onSave: (updatedUser: User) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, onClose, onSave }) => {
  const jobCategories = ['Personal directivo', 'Personal técnico', 'Personal administrativo', 'Consultoría'];
  const adminTypes = [
    'Administración central',
    'Administración regional',
    'Administración local / municipal',
    'Empresa pública',
    'Organismo autónomo'
  ];

  const [formData, setFormData] = useState<User>({ ...user });
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof User, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleUsernameChange = (val: string) => {
    const cleanUsername = val.toLowerCase().replace(/\s/g, '').replace(/@/g, '');
    handleChange('username', cleanUsername);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.username || formData.username.length < 3) {
      setError("El nombre de usuario debe tener al menos 3 caracteres.");
      return;
    }

    onSave(formData);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-[#0a0a0a] w-full max-w-2xl rounded-[2.5rem] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 border border-white dark:border-zinc-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-8 py-6 border-b border-slate-50 dark:border-zinc-900 flex justify-between items-center bg-white dark:bg-[#0a0a0a] sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-2xl">
              <Pencil size={20} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Editar Perfil</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Actualiza tu información pública</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 dark:hover:bg-zinc-900 rounded-full text-slate-400 transition-all"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide bg-slate-50/30 dark:bg-black/20">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-2xl border border-red-100 dark:border-red-900/30 flex items-center space-x-2 animate-in slide-in-from-top-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-2">
              <AtSign size={14} className="text-blue-500" />
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Identidad en Red Social</h4>
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Nombre de usuario</label>
              <div className="relative">
                <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type="text" 
                  value={formData.username || ''} 
                  onChange={(e) => handleUsernameChange(e.target.value)} 
                  placeholder="anagarcia" 
                  className="w-full pl-12 pr-5 py-3 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50 dark:text-white transition-all" 
                />
              </div>
              <p className="text-[9px] text-slate-400 font-medium ml-1">Este identificador permite que otros colegas te encuentren fácilmente.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Perfil / Categoría</label>
                <select value={formData.jobCategory} onChange={(e) => handleChange('jobCategory', e.target.value)} className="w-full px-5 py-3 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50 dark:text-white appearance-none">
                  <option value="">Seleccionar...</option>
                  {jobCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Tipo de Administración</label>
                <select value={formData.administrationType} onChange={(e) => handleChange('administrationType', e.target.value)} className="w-full px-5 py-3 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50 dark:text-white appearance-none">
                  <option value="">Seleccionar...</option>
                  {adminTypes.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-zinc-900">
            <div className="flex items-center space-x-2 mb-2">
              <Building size={14} className="text-blue-500" />
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Cargo Actual</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Denominación del Puesto</label>
                <input type="text" value={formData.position} onChange={(e) => handleChange('position', e.target.value)} placeholder="Ej. Responsable de Innovación" className="w-full px-5 py-3 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50 dark:text-white" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Organización / Departamento</label>
                <input type="text" value={formData.department} onChange={(e) => handleChange('department', e.target.value)} placeholder="Ej. Ayuntamiento de Barcelona" className="w-full px-5 py-3 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50 dark:text-white" />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-zinc-900">
            <div className="flex items-center space-x-2 mb-2">
              <Globe size={14} className="text-blue-500" />
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Ubicación</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">País</label>
                <select value={formData.country || ''} onChange={(e) => handleChange('country', e.target.value)} className="w-full px-5 py-3 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50 dark:text-white appearance-none">
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Región / Comunidad</label>
                <select value={formData.region || ''} onChange={(e) => handleChange('region', e.target.value)} className="w-full px-5 py-3 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50 dark:text-white appearance-none">
                  <option value="">Seleccionar región...</option>
                  {formData.country && COUNTRIES_DATA[formData.country]?.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-zinc-900">
            <div className="flex items-center space-x-2 mb-2">
              <AlignLeft size={14} className="text-blue-500" />
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Biografía</h4>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Sobre ti</label>
              <textarea value={formData.bio} onChange={(e) => handleChange('bio', e.target.value)} className="w-full p-5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-[1.5rem] text-sm font-medium outline-none focus:ring-4 focus:ring-blue-50 dark:text-white min-h-[120px] resize-none leading-relaxed" placeholder="Describe tu trayectoria, áreas de especialización o proyectos en los que estás trabajando..." />
            </div>
          </div>

          <div className="pt-4 flex space-x-4 sticky bottom-0 bg-transparent">
            <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-gray-400 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all">Cancelar</button>
            <button type="submit" className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all flex items-center justify-center space-x-2 transform active:scale-95"><Save size={18} /><span>Guardar Cambios</span></button>
          </div>
        </form>
      </div>
    </div>
  );
};
