
import React, { useState, useEffect } from 'react';
import { X, Save, User as UserIcon, Briefcase, Info, Mail, Calendar, Globe, Building, MapPin, Users } from 'lucide-react';
import { User } from '../types';
import { COUNTRIES, COUNTRIES_DATA } from '../constants';

interface EditProfileModalProps {
  user: User;
  onClose: () => void;
  onSave: (updatedUser: User) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState<User>({ ...user });

  const handleChange = (field: keyof User, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 border border-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-100">
              <UserIcon size={20} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">Configurar mi Perfil</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Actualiza tu identidad en la red institucional</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide bg-slate-50/30">
          
          {/* SECCIÓN 1: DATOS PERSONALES */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-2">
              <UserIcon size={14} className="text-blue-500" />
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Datos Personales</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Nombre</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full px-5 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50 transition-all"
                  placeholder="Tu nombre"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Apellido</label>
                <input 
                  type="text" 
                  value={formData.lastName || ''}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  className="w-full px-5 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50 transition-all"
                  placeholder="Tu apellido"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Fecha de Nacimiento</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input 
                    type="date" 
                    value={formData.birthDate || ''}
                    onChange={(e) => handleChange('birthDate', e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Género</label>
                <select 
                  value={formData.gender || ''}
                  onChange={(e) => handleChange('gender', e.target.value)}
                  className="w-full px-5 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50 transition-all appearance-none"
                >
                  <option value="">Seleccionar...</option>
                  <option value="Hombre">Hombre</option>
                  <option value="Mujer">Mujer</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input 
                  type="email" 
                  value={formData.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50 transition-all"
                  placeholder="nombre@institucion.es"
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: PERFIL PROFESIONAL */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center space-x-2 mb-2">
              <Briefcase size={14} className="text-blue-500" />
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Perfil Profesional</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Tu Rol</label>
                <select 
                  value={formData.jobCategory || ''}
                  onChange={(e) => handleChange('jobCategory', e.target.value)}
                  className="w-full px-5 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50 transition-all appearance-none"
                >
                  <option value="">Seleccionar rol...</option>
                  {['Directivo', 'Técnico', 'Administrativo', 'Consultor', 'Otro'].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Tipo de Organización</label>
                <select 
                  value={formData.administrationType || ''}
                  onChange={(e) => handleChange('administrationType', e.target.value)}
                  className="w-full px-5 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50 transition-all appearance-none"
                >
                  <option value="">Seleccionar tipo...</option>
                  {[
                    'Administración Pública central',
                    'Administración Pública regional',
                    'Administración Pública local/municipal',
                    'Empresa privada',
                    'Organización del tercer sector',
                    'Otra'
                  ].map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Cargo Actual</label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input 
                    type="text" 
                    value={formData.position}
                    onChange={(e) => handleChange('position', e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50 transition-all"
                    placeholder="Ej. Jefe de Sección"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Nombre de tu Organización</label>
                <div className="relative">
                  <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input 
                    type="text" 
                    value={formData.department}
                    onChange={(e) => handleChange('department', e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50 transition-all"
                    placeholder="Ej. Ministerio de Hacienda"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: UBICACIÓN Y BIO */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center space-x-2 mb-2">
              <Globe size={14} className="text-blue-500" />
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Ubicación y Bio</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">País</label>
                <select 
                  value={formData.country || ''}
                  onChange={(e) => {
                    handleChange('country', e.target.value);
                    handleChange('region', '');
                  }}
                  className="w-full px-5 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50 transition-all appearance-none"
                >
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Región</label>
                <select 
                  value={formData.region || ''}
                  onChange={(e) => handleChange('region', e.target.value)}
                  className="w-full px-5 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50 transition-all appearance-none"
                >
                  <option value="">Seleccionar región...</option>
                  {formData.country && COUNTRIES_DATA[formData.country]?.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Biografía Profesional</label>
              <textarea 
                value={formData.bio}
                onChange={(e) => handleChange('bio', e.target.value)}
                className="w-full p-5 bg-white border border-slate-100 rounded-[1.5rem] text-sm font-medium outline-none focus:ring-4 focus:ring-blue-50 transition-all min-h-[100px] resize-none leading-relaxed"
                placeholder="Escribe algo sobre ti..."
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Avatar (Seed URL)</label>
              <input 
                type="text" 
                value={formData.avatar}
                onChange={(e) => handleChange('avatar', e.target.value)}
                className="w-full px-5 py-3 bg-white border border-slate-100 rounded-2xl text-[10px] font-mono outline-none focus:ring-4 focus:ring-blue-50 transition-all text-slate-400"
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div className="pt-8 flex space-x-4 sticky bottom-0 bg-transparent">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all transform active:scale-95"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center space-x-2 transform active:scale-95"
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
