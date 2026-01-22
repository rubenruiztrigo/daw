
import React, { useState, useEffect } from 'react';
import { X, Save, User as UserIcon, Briefcase, Info, Mail, Calendar, Globe, Building, MapPin, Users, Pencil } from 'lucide-react';
import { User } from '../types';
import { COUNTRIES, COUNTRIES_DATA } from '../constants';

interface EditProfileModalProps {
  user: User;
  onClose: () => void;
  onSave: (updatedUser: User) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, onClose, onSave }) => {
  const jobCategories = ['Directivo', 'Técnico', 'Administrativo', 'Consultor'];
  const adminTypes = [
    'Administración Pública central',
    'Administración Pública regional',
    'Administración Pública local/municipal',
    'Empresa privada',
    'Organización del tercer sector'
  ];

  const initialJobIsCustom = user.jobCategory && !jobCategories.includes(user.jobCategory);
  const initialAdminIsCustom = user.administrationType && !adminTypes.includes(user.administrationType);

  const [formData, setFormData] = useState<User>({ ...user });
  const [selectedJob, setSelectedJob] = useState(initialJobIsCustom ? 'Otro' : (user.jobCategory || ''));
  const [customJob, setCustomJob] = useState(initialJobIsCustom ? user.jobCategory : '');
  
  const [selectedAdmin, setSelectedAdmin] = useState(initialAdminIsCustom ? 'Otra' : (user.administrationType || ''));
  const [customAdmin, setCustomAdmin] = useState(initialAdminIsCustom ? user.administrationType : '');

  const handleChange = (field: keyof User, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalData = {
      ...formData,
      jobCategory: selectedJob === 'Otro' ? customJob : selectedJob,
      administrationType: selectedAdmin === 'Otra' ? customAdmin : selectedAdmin
    };
    onSave(finalData as User);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-[#0a0a0a] w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 border border-white dark:border-zinc-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-50 dark:border-zinc-900 flex justify-between items-center bg-white dark:bg-[#0a0a0a] sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-100 dark:shadow-none">
              <UserIcon size={20} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Configurar mi Perfil</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Actualiza tu identidad en la red institucional</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-50 dark:hover:bg-zinc-900 rounded-full text-slate-400 hover:text-slate-600 transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide bg-slate-50/30 dark:bg-black/20">
          
          {/* SECCIÓN 1: DATOS PERSONALES */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-2">
              <UserIcon size={14} className="text-blue-500" />
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Datos Personales</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase ml-1">Nombre</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full px-5 py-3 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/20 dark:text-white transition-all"
                  placeholder="Tu nombre"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase ml-1">Apellido</label>
                <input 
                  type="text" 
                  value={formData.lastName || ''}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  className="w-full px-5 py-3 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/20 dark:text-white transition-all"
                  placeholder="Tu apellido"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase ml-1">Fecha de Nacimiento</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input 
                    type="date" 
                    value={formData.birthDate || ''}
                    onChange={(e) => handleChange('birthDate', e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/20 dark:text-white transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase ml-1">Género</label>
                <select 
                  value={formData.gender || ''}
                  onChange={(e) => handleChange('gender', e.target.value)}
                  className="w-full px-5 py-3 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/20 dark:text-white transition-all appearance-none"
                >
                  <option value="">Seleccionar...</option>
                  <option value="Hombre">Hombre</option>
                  <option value="Mujer">Mujer</option>
                  <option value="Prefiero no decirlo">Prefiero no decirlo</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase ml-1">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input 
                  type="email" 
                  value={formData.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/20 dark:text-white transition-all"
                  placeholder="nombre@institucion.es"
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: PERFIL PROFESIONAL */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-zinc-900">
            <div className="flex items-center space-x-2 mb-2">
              <Briefcase size={14} className="text-blue-500" />
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Perfil Profesional</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase ml-1">Tu Rol</label>
                <select 
                  value={selectedJob}
                  onChange={(e) => setSelectedJob(e.target.value)}
                  className="w-full px-5 py-3 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/20 dark:text-white transition-all appearance-none"
                >
                  <option value="">Seleccionar rol...</option>
                  {jobCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="Otro">Otro</option>
                </select>
                {selectedJob === 'Otro' && (
                  <div className="animate-in slide-in-from-top-2 duration-200 mt-2 relative">
                    <Pencil className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                    <input 
                      type="text"
                      value={customJob}
                      onChange={(e) => setCustomJob(e.target.value)}
                      placeholder="Especifica tu rol..."
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
                    />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase ml-1">Tipo de Organización</label>
                <select 
                  value={selectedAdmin}
                  onChange={(e) => setSelectedAdmin(e.target.value)}
                  className="w-full px-5 py-3 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/20 dark:text-white transition-all appearance-none"
                >
                  <option value="">Seleccionar tipo...</option>
                  {adminTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                  <option value="Otra">Otra</option>
                </select>
                {selectedAdmin === 'Otra' && (
                  <div className="animate-in slide-in-from-top-2 duration-200 mt-2 relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                    <input 
                      type="text"
                      value={customAdmin}
                      onChange={(e) => setCustomAdmin(e.target.value)}
                      placeholder="Especifica el tipo de organización..."
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase ml-1">Cargo Actual</label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input 
                    type="text" 
                    value={formData.position}
                    onChange={(e) => handleChange('position', e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/20 dark:text-white transition-all"
                    placeholder="Ej. Jefe de Sección"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase ml-1">Nombre de tu Organización</label>
                <div className="relative">
                  <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input 
                    type="text" 
                    value={formData.department}
                    onChange={(e) => handleChange('department', e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/20 dark:text-white transition-all"
                    placeholder="Ej. Ministerio de Hacienda"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: UBICACIÓN Y BIO */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-zinc-900">
            <div className="flex items-center space-x-2 mb-2">
              <Globe size={14} className="text-blue-500" />
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Ubicación y Bio</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase ml-1">País</label>
                <select 
                  value={formData.country || ''}
                  onChange={(e) => {
                    handleChange('country', e.target.value);
                    handleChange('region', '');
                  }}
                  className="w-full px-5 py-3 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/20 dark:text-white transition-all appearance-none"
                >
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase ml-1">Región</label>
                <select 
                  value={formData.region || ''}
                  onChange={(e) => handleChange('region', e.target.value)}
                  className="w-full px-5 py-3 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/20 dark:text-white transition-all appearance-none"
                >
                  <option value="">Seleccionar región...</option>
                  {formData.country && COUNTRIES_DATA[formData.country]?.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase ml-1">Biografía Profesional</label>
              <textarea 
                value={formData.bio}
                onChange={(e) => handleChange('bio', e.target.value)}
                className="w-full p-5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-[1.5rem] text-sm font-medium outline-none focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/20 dark:text-white transition-all min-h-[100px] resize-none leading-relaxed"
                placeholder="Escribe algo sobre ti..."
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div className="pt-8 flex space-x-4 sticky bottom-0 bg-transparent">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-gray-400 rounded-2xl font-black text-sm hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all transform active:scale-95"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-100 dark:shadow-none hover:bg-blue-700 transition-all flex items-center justify-center space-x-2 transform active:scale-95"
            >
              <Save size={18} />
              <span>Guardar Cambios</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
