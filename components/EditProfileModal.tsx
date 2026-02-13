
import React, { useState } from 'react';
import { X, Save, Briefcase, Building, Globe, Pencil, AlignLeft, AtSign, BookOpen } from 'lucide-react';
import { User } from '../types';
import { COUNTRIES, COUNTRIES_DATA, PUBLIC_INTERESTS } from '../constants';

interface EditProfileModalProps {
  user: User;
  onClose: () => void;
  onSave: (updatedUser: User) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, onClose, onSave }) => {
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const jobCategories = ['Presidente', 'Directivo', 'Técnico', 'Administrativo'];
  const adminTypes = [
    'Administración central',
    'Administración regional',
    'Administración local / municipal',
    'Empresa pública',
    'Organismo autónomo'
  ];

  const [formData, setFormData] = useState<User>({ ...user });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customJobInput, setCustomJobInput] = useState(
    !jobCategories.includes(user.jobCategory || '') ? user.jobCategory || '' : ''
  );
  const [customAdminInput, setCustomAdminInput] = useState(
    !adminTypes.includes(user.administrationType || '') ? user.administrationType || '' : ''
  );

  const isCustomJob = !!formData.jobCategory && !jobCategories.includes(formData.jobCategory);
  const isCustomAdmin = !!formData.administrationType && !adminTypes.includes(formData.administrationType);

  const jobSelectValue = isCustomJob ? 'Otro' : (formData.jobCategory || '');
  const adminSelectValue = isCustomAdmin ? 'Otra' : (formData.administrationType || '');

  const handleChange = (field: keyof User, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleUsernameChange = (val: string) => {
    const cleanUsername = val.toLowerCase().replace(/\s/g, '').replace(/@/g, '');
    handleChange('username', cleanUsername);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    const finalJobCategory = formData.jobCategory === 'Otro' ? customJobInput : formData.jobCategory;
    const finalAdminType = formData.administrationType === 'Otra' ? customAdminInput : formData.administrationType;

    if (!formData.username || formData.username.length < 3) newErrors.username = "Mínimo 3 caracteres";
    if (!finalJobCategory) newErrors.jobCategory = "El cargo es obligatorio";
    if (!finalAdminType) newErrors.administrationType = "El tipo de administración es obligatorio";
    if (!formData.position?.trim()) newErrors.position = "La especialización es obligatoria";
    if (!formData.department?.trim()) newErrors.department = "La organización es obligatoria";
    if (!formData.country) newErrors.country = "El país es obligatorio";
    if (!formData.region) newErrors.region = "La región es obligatoria";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      ...formData,
      jobCategory: finalJobCategory,
      administrationType: finalAdminType
    });
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

          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-2">
              <AtSign size={14} className="text-blue-500" />
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Identidad y Datos Personales</h4>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Nombre de usuario</label>
                <div className="relative">
                  <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input
                    type="text"
                    value={formData.username || ''}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    placeholder="anagarcia"
                    className={`w-full pl-12 pr-5 py-3 bg-white dark:bg-zinc-900 border ${errors.username ? 'border-red-500' : 'border-slate-100 dark:border-zinc-800'} rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50 dark:text-white transition-all`}
                  />
                </div>
                {errors.username && <p className="text-red-500 text-[10px] font-bold ml-1">{errors.username}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Cargo</label>
                <select
                  value={jobSelectValue}
                  onChange={(e) => handleChange('jobCategory', e.target.value)}
                  className={`w-full px-5 py-3 bg-white dark:bg-zinc-900 border ${errors.jobCategory ? 'border-red-500' : 'border-slate-100 dark:border-zinc-800'} rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50 dark:text-white appearance-none`}
                >
                  <option value="">Seleccionar...</option>
                  {jobCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  <option value="Otro">Otro</option>
                </select>
                {jobSelectValue === 'Otro' && (
                  <input
                    type="text"
                    value={customJobInput}
                    onChange={(e) => setCustomJobInput(e.target.value)}
                    placeholder="Especifica tu cargo..."
                    className="w-full mt-2 px-5 py-2 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
                  />
                )}
                {errors.jobCategory && <p className="text-red-500 text-[10px] font-bold ml-1">{errors.jobCategory}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Tipo de Administración</label>
                <select
                  value={adminSelectValue}
                  onChange={(e) => handleChange('administrationType', e.target.value)}
                  className={`w-full px-5 py-3 bg-white dark:bg-zinc-900 border ${errors.administrationType ? 'border-red-500' : 'border-slate-100 dark:border-zinc-800'} rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50 dark:text-white appearance-none`}
                >
                  <option value="">Seleccionar...</option>
                  {adminTypes.map(type => <option key={type} value={type}>{type}</option>)}
                  <option value="Otra">Otra</option>
                </select>
                {adminSelectValue === 'Otra' && (
                  <input
                    type="text"
                    value={customAdminInput}
                    onChange={(e) => setCustomAdminInput(e.target.value)}
                    placeholder="Especifica el tipo..."
                    className="w-full mt-2 px-5 py-2 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
                  />
                )}
                {errors.administrationType && <p className="text-red-500 text-[10px] font-bold ml-1">{errors.administrationType}</p>}
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
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Especialización</label>
                <input type="text" value={formData.position} onChange={(e) => handleChange('position', e.target.value)} placeholder="Ej. Responsable de Innovación" className={`w-full px-5 py-3 bg-white dark:bg-zinc-900 border ${errors.position ? 'border-red-500' : 'border-slate-100 dark:border-zinc-800'} rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50 dark:text-white`} />
                {errors.position && <p className="text-red-500 text-[10px] font-bold ml-1">{errors.position}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Organización / Departamento</label>
                <input type="text" value={formData.department} onChange={(e) => handleChange('department', e.target.value)} placeholder="Ej. Ayuntamiento de Barcelona" className={`w-full px-5 py-3 bg-white dark:bg-zinc-900 border ${errors.department ? 'border-red-500' : 'border-slate-100 dark:border-zinc-800'} rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50 dark:text-white`} />
                {errors.department && <p className="text-red-500 text-[10px] font-bold ml-1">{errors.department}</p>}
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
                <select value={formData.country || ''} onChange={(e) => handleChange('country', e.target.value)} className={`w-full px-5 py-3 bg-white dark:bg-zinc-900 border ${errors.country ? 'border-red-500' : 'border-slate-100 dark:border-zinc-800'} rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50 dark:text-white appearance-none`}>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.country && <p className="text-red-500 text-[10px] font-bold ml-1">{errors.country}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Región / Comunidad</label>
                <select value={formData.region || ''} onChange={(e) => handleChange('region', e.target.value)} className={`w-full px-5 py-3 bg-white dark:bg-zinc-900 border ${errors.region ? 'border-red-500' : 'border-slate-100 dark:border-zinc-800'} rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50 dark:text-white appearance-none`}>
                  <option value="">Seleccionar región...</option>
                  {formData.country && COUNTRIES_DATA[formData.country]?.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                {errors.region && <p className="text-red-500 text-[10px] font-bold ml-1">{errors.region}</p>}
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
