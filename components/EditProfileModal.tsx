
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useScrollLock } from '../hooks/useScrollLock';
import { X, Save, Briefcase, Building, Globe, Pencil, AlignLeft, AtSign, BookOpen, ChevronDown, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { User } from '../types';
import { COUNTRIES, COUNTRIES_DATA, PUBLIC_INTERESTS } from '../constants';

interface EditProfileModalProps {
  user: User;
  onClose: () => void;
  onSave: (updatedUser: User) => void;
}

const SelectDrop: React.FC<{
  label: string,
  value: string,
  options: string[],
  onChange: (val: string) => void,
  placeholder: string,
  disabled?: boolean
}> = ({ label, value, options, onChange, placeholder, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="space-y-1 relative">
      <label className="text-[9px] font-black text-slate-500 dark:text-gray-400 uppercase ml-1 tracking-wider">{label}</label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl font-bold dark:text-white text-[11px] outline-none focus:ring-4 focus:ring-blue-50 transition-all flex items-center justify-between ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span className={!value ? 'text-slate-400' : ''}>{value || placeholder}</span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && !disabled && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl shadow-xl z-[101] max-h-48 overflow-y-auto animate-in fade-in zoom-in-95 duration-200 scrollbar-hide">
            {options.map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => { onChange(opt); setIsOpen(false); }}
                className={`w-full text-left px-4 py-2 text-[11px] font-bold hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors ${value === opt ? 'text-blue-600 bg-blue-50/50 dark:bg-blue-900/20' : 'text-slate-600 dark:text-gray-300'}`}
              >
                {opt}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, onClose, onSave }) => {
  useScrollLock();

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

  // Organization Autocomplete State
  const [orgResults, setOrgResults] = useState<{ id: string, name: string }[]>([]);
  const [isSearchingOrgs, setIsSearchingOrgs] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(user.linkedOrganizationId || null);

  const searchOrganizations = async (query: string) => {
    if (query.length < 2) {
      setOrgResults([]);
      return;
    }
    setIsSearchingOrgs(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('is_organization', true)
        .ilike('name', `%${query}%`)
        .limit(5);

      if (error) throw error;
      setOrgResults(data || []);
    } catch (err) {
      console.error("Error searching organizations:", err);
    } finally {
      setIsSearchingOrgs(false);
    }
  };

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

    if (!user.isOrganization) {
      if (!finalJobCategory) newErrors.jobCategory = "El cargo es obligatorio";
      if (!finalAdminType) newErrors.administrationType = "El tipo de administración es obligatorio";
      if (!formData.position?.trim()) newErrors.position = "La especialización es obligatoria";
      if (!formData.department?.trim()) newErrors.department = "La organización es obligatoria";
    }

    if (!formData.country) newErrors.country = "El país es obligatorio";
    if (!formData.region) newErrors.region = "La región es obligatoria";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      ...formData,
      jobCategory: finalJobCategory,
      administrationType: finalAdminType,
      linkedOrganizationId: selectedOrgId
    });
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
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
              {!user.isOrganization && (
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Actualiza tu información pública</p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 dark:hover:bg-zinc-900 rounded-full text-slate-400 transition-all"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 pb-32 space-y-8 scrollbar-hide bg-slate-50/30 dark:bg-black/20">

          <div className="space-y-4">
            {!user.isOrganization && (
              <div className="flex items-center space-x-2 mb-2">
                <AtSign size={14} className="text-blue-500" />
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Identidad y Datos Personales</h4>
              </div>
            )}

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

          </div>

          {!user.isOrganization && (
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
          )}


          {!user.isOrganization && (
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
                <div className="space-y-1 relative">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Organización / Departamento</label>
                  <div className="relative">
                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => {
                        handleChange('department', e.target.value);
                        searchOrganizations(e.target.value);
                        setSelectedOrgId(null); // Clear link if manually editing
                      }}
                      placeholder="Ej. Ayuntamiento de Barcelona"
                      className={`w-full pl-12 pr-10 py-3 bg-white dark:bg-zinc-900 border ${errors.department ? 'border-red-500' : 'border-slate-100 dark:border-zinc-800'} rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50 dark:text-white transition-all`}
                    />
                    {isSearchingOrgs && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 size={16} className="animate-spin text-blue-500" />
                      </div>
                    )}
                  </div>

                  {orgResults.length > 0 && (
                    <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl shadow-xl z-[150] overflow-hidden animate-in fade-in slide-in-from-top-2">
                      {orgResults.map(org => (
                        <button
                          key={org.id}
                          type="button"
                          onClick={() => {
                            handleChange('department', org.name);
                            setSelectedOrgId(org.id);
                            setOrgResults([]);
                          }}
                          className="w-full text-left px-5 py-3 text-sm font-bold hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center space-x-3 transition-colors text-slate-700 dark:text-slate-200"
                        >
                          <Building size={16} className="text-blue-500" />
                          <span>{org.name}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedOrgId && (
                    <div className="mt-2 flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-2xl animate-in zoom-in-95">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 size={16} className="text-blue-600" />
                        <span className="text-[10px] md:text-sm font-bold text-blue-700 dark:text-blue-400 truncate max-w-[200px] md:max-w-none">Cuenta oficial vinculada: {formData.department}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedOrgId(null)}
                        className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-full text-blue-500 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                  {errors.department && <p className="text-red-500 text-[10px] font-bold ml-1">{errors.department}</p>}
                </div>
              </div>
            </div>
          )}

          {!user.isOrganization && (
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-zinc-900">
              <div className="flex items-center space-x-2 mb-2">
                <Globe size={14} className="text-blue-500" />
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Ubicación</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
                <SelectDrop
                  label="País"
                  value={formData.country || ''}
                  options={COUNTRIES}
                  onChange={(val) => handleChange('country', val)}
                  placeholder="Seleccionar..."
                />
                <SelectDrop
                  label="Región / Comunidad"
                  value={formData.region || ''}
                  options={formData.country ? COUNTRIES_DATA[formData.country] || [] : []}
                  onChange={(val) => handleChange('region', val)}
                  placeholder="Seleccionar..."
                  disabled={!formData.country}
                />
              </div>
            </div>
          )}


          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-zinc-900">
            <div className="flex items-center space-x-2 mb-2">
              <AlignLeft size={14} className="text-blue-500" />
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Biografía</h4>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-1">{user.isOrganization ? "Biografía" : "Sobre ti"}</label>
              <textarea
                value={formData.bio || ''}
                onChange={(e) => handleChange('bio', e.target.value)}
                className="w-full p-5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-[1.5rem] text-sm font-medium outline-none focus:ring-4 focus:ring-blue-50 dark:text-white min-h-[120px] resize-none leading-relaxed"
                placeholder={user.isOrganization ? "Describe la organización..." : "Describe tu trayectoria, áreas de especialización o proyectos en los que estás trabajando..."}
              />
            </div>
          </div>

          <div className="pt-4 flex space-x-4 sticky bottom-0 bg-transparent">
            <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-gray-400 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all">Cancelar</button>
            <button type="submit" className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all flex items-center justify-center space-x-2 transform active:scale-95"><Save size={18} /><span>Guardar Cambios</span></button>
          </div>
        </form>
      </div >
    </div>,
    document.body
  );
};
