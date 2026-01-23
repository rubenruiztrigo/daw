
import React, { useState } from 'react';
import { Shield, Bell, Eye, LogOut, ChevronRight, Wand2, Smartphone, Lock, Globe, ArrowLeft, X, AlertCircle, Sun, Moon, Check, UserCircle, Save, Calendar, Mail } from 'lucide-react';
import { User } from '../types';

interface SettingsViewProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  onLogout: () => void;
  onViewChange: (view: any) => void;
  theme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ user, onUpdateUser, onLogout, onViewChange, theme, onThemeChange }) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showAccessibility, setShowAccessibility] = useState(false);
  const [showPersonalData, setShowPersonalData] = useState(false);

  const SettingItem = ({ icon: Icon, label, color = "text-slate-600 dark:text-gray-400", onClick }: { icon: any, label: string, color?: string, onClick?: () => void }) => (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between p-5 bg-white dark:bg-[#111] hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all border-b border-slate-50 dark:border-zinc-800 last:border-0 first:rounded-t-[2rem] last:rounded-b-[2rem]"
    >
      <div className="flex items-center space-x-4">
        <div className={`p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 ${color}`}>
          <Icon size={20} />
        </div>
        <span className="font-bold text-slate-900 dark:text-white">{label}</span>
      </div>
      <ChevronRight size={18} className="text-slate-300 dark:text-zinc-600" />
    </button>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center space-x-4 mb-4">
        <button 
          onClick={() => onViewChange('feed')}
          className="p-3 bg-white dark:bg-[#111] border border-slate-100 dark:border-zinc-800 rounded-2xl text-slate-400 hover:text-blue-600 transition-all shadow-sm"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Configuración</h2>
          <p className="text-slate-500 dark:text-gray-400 text-sm font-medium">Gestiona tu experiencia en la plataforma.</p>
        </div>
      </div>

      <div className="shadow-sm border border-slate-100 dark:border-zinc-800 rounded-[2rem] overflow-hidden">
        <SettingItem icon={UserCircle} label="Datos Personales" onClick={() => setShowPersonalData(true)} />
        <SettingItem icon={Wand2} label="Accesibilidad" onClick={() => setShowAccessibility(true)} />
        <SettingItem icon={Bell} label="Notificaciones" />
        <SettingItem icon={Lock} label="Privacidad y seguridad" />
        <SettingItem icon={Globe} label="Idioma y región" />
        <SettingItem icon={Smartphone} label="Dispositivos" />
      </div>

      <div className="shadow-sm border border-slate-100 dark:border-zinc-800 rounded-[2rem] overflow-hidden">
        <SettingItem icon={Shield} label="Centro de ayuda" />
        <SettingItem icon={Eye} label="Términos de servicio" />
        <SettingItem 
          icon={LogOut} 
          label="Cerrar sesión" 
          color="text-red-500" 
          onClick={() => setShowLogoutConfirm(true)}
        />
      </div>

      <div className="text-center pt-8">
        <p className="text-[10px] text-slate-300 dark:text-zinc-700 font-black uppercase tracking-[0.3em]">v2.5.0 build-2024</p>
      </div>

      {showPersonalData && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowPersonalData(false)}>
          <div className="bg-white dark:bg-[#0a0a0a] w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white dark:border-zinc-800" onClick={(e) => e.stopPropagation()}>
            <PersonalDataForm user={user} onSave={(updated) => { onUpdateUser(updated); setShowPersonalData(false); }} onClose={() => setShowPersonalData(false)} />
          </div>
        </div>
      )}

      {showAccessibility && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowAccessibility(false)}>
          <div className="bg-white dark:bg-[#0a0a0a] w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white dark:border-zinc-800" onClick={(e) => e.stopPropagation()}>
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Accesibilidad</h3>
                <button onClick={() => setShowAccessibility(false)} className="p-2 text-gray-400 hover:text-gray-600 transition-colors"><X size={20}/></button>
              </div>
              
              <div className="space-y-3">
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-4">Selecciona el tema visual de la plataforma:</p>
                
                <button 
                  onClick={() => onThemeChange('light')}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${theme === 'light' ? 'border-blue-600 bg-blue-50/50 dark:bg-zinc-900/50' : 'border-slate-100 dark:border-zinc-800 hover:border-blue-200'}`}
                >
                  <div className="flex items-center space-x-3">
                    <Sun className={theme === 'light' ? 'text-blue-600' : 'text-gray-400'} size={20} />
                    <span className={`font-bold ${theme === 'light' ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400'}`}>Modo claro</span>
                  </div>
                  {theme === 'light' && <Check size={18} className="text-blue-600" />}
                </button>

                <button 
                  onClick={() => onThemeChange('dark')}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${theme === 'dark' ? 'border-blue-600 bg-blue-50/50 dark:bg-zinc-900/50' : 'border-slate-100 dark:border-zinc-800 hover:border-blue-200'}`}
                >
                  <div className="flex items-center space-x-3">
                    <Moon className={theme === 'dark' ? 'text-blue-600' : 'text-gray-400'} size={20} />
                    <span className={`font-bold ${theme === 'dark' ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400'}`}>Modo oscuro</span>
                  </div>
                  {theme === 'dark' && <Check size={18} className="text-blue-600" />}
                </button>
              </div>

              <button 
                onClick={() => setShowAccessibility(false)}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all transform active:scale-95 mt-4"
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}

      {showLogoutConfirm && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div 
            className="bg-white dark:bg-[#0a0a0a] w-full max-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white dark:border-zinc-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8 text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center">
                <LogOut size={32} />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">¿Cerrar sesión?</h3>
                <p className="text-sm text-slate-500 dark:text-gray-400 font-medium">¿Confirmas que deseas salir de tu cuenta institucional?</p>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={onLogout}
                  className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-red-100 hover:bg-red-700 transition-all transform active:scale-95"
                >
                  Cerrar sesión
                </button>
                <button 
                  onClick={() => setShowLogoutConfirm(false)}
                  className="w-full py-4 bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-gray-400 rounded-2xl font-black text-sm hover:bg-slate-200 dark:hover:bg-zinc-800 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PersonalDataForm: React.FC<{ user: User, onSave: (updatedUser: User) => void, onClose: () => void }> = ({ user, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: user.name || '',
    lastName: user.lastName || '',
    gender: user.gender || 'Prefiero no decirlo',
    birthDate: user.birthDate || '',
    email: user.email || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...user, ...formData });
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 dark:bg-zinc-900 rounded-xl text-blue-600">
            <UserCircle size={24} />
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white">Datos Personales</h3>
        </div>
        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 transition-colors"><X size={20}/></button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase ml-1">Nombre</label>
            <input 
              type="text" 
              value={formData.name} 
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-5 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase ml-1">Apellidos</label>
            <input 
              type="text" 
              value={formData.lastName} 
              onChange={(e) => setFormData({...formData, lastName: e.target.value})}
              className="w-full px-5 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase ml-1">Género</label>
          <select 
            value={formData.gender} 
            onChange={(e) => setFormData({...formData, gender: e.target.value as any})}
            className="w-full px-5 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all appearance-none"
          >
            <option value="Hombre">Hombre</option>
            <option value="Mujer">Mujer</option>
            <option value="Prefiero no decirlo">Prefiero no decirlo</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase ml-1">Fecha de nacimiento</label>
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input 
              type="date" 
              value={formData.birthDate} 
              onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
              className="w-full pl-12 pr-5 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase ml-1">Correo Institucional</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input 
              type="email" 
              value={formData.email} 
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full pl-12 pr-5 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
            />
          </div>
        </div>

        <div className="pt-4 flex space-x-3">
          <button 
            type="button" 
            onClick={onClose}
            className="flex-1 py-4 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-gray-400 rounded-2xl font-black text-sm hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-100 dark:shadow-none hover:bg-blue-700 transition-all flex items-center justify-center space-x-2 transform active:scale-95"
          >
            <Save size={18} />
            <span>Guardar cambios</span>
          </button>
        </div>
      </form>
    </div>
  );
};
