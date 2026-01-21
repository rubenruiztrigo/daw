
import React from 'react';
import { Shield, Bell, Eye, LogOut, ChevronRight, Wand2, Smartphone, Lock, Globe, ArrowLeft } from 'lucide-react';
import { User } from '../types';

interface SettingsViewProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  onLogout: () => void;
  onViewChange: (view: any) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ user, onLogout, onViewChange }) => {
  const SettingItem = ({ icon: Icon, label, color = "text-slate-600", onClick }: { icon: any, label: string, color?: string, onClick?: () => void }) => (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between p-5 bg-white hover:bg-slate-50 transition-all border-b border-slate-50 last:border-0 first:rounded-t-[2rem] last:rounded-b-[2rem]"
    >
      <div className="flex items-center space-x-4">
        <div className={`p-2.5 rounded-xl bg-slate-50 ${color}`}>
          <Icon size={20} />
        </div>
        <span className="font-bold text-slate-900">{label}</span>
      </div>
      <ChevronRight size={18} className="text-slate-300" />
    </button>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center space-x-4 mb-4">
        <button 
          onClick={() => onViewChange('feed')}
          className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-blue-600 transition-all shadow-sm"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-2xl font-black text-slate-900">Configuración</h2>
          <p className="text-slate-500 text-sm font-medium">Gestiona tu experiencia en la plataforma.</p>
        </div>
      </div>

      <div className="shadow-sm border border-slate-100 rounded-[2rem] overflow-hidden">
        <SettingItem icon={Wand2} label="Accesibilidad" />
        <SettingItem icon={Bell} label="Notificaciones" />
        <SettingItem icon={Lock} label="Privacidad y Seguridad" />
        <SettingItem icon={Globe} label="Idioma y Región" />
        <SettingItem icon={Smartphone} label="Dispositivos" />
      </div>

      <div className="shadow-sm border border-slate-100 rounded-[2rem] overflow-hidden">
        <SettingItem icon={Shield} label="Centro de Ayuda" />
        <SettingItem icon={Eye} label="Términos de Servicio" />
        <SettingItem 
          icon={LogOut} 
          label="Cerrar Sesión" 
          color="text-red-500" 
          onClick={() => {
            if(confirm('¿Estás seguro de que deseas cerrar sesión?')) {
              onLogout();
              window.location.reload();
            }
          }}
        />
      </div>

      <div className="text-center pt-8">
        <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.3em]">v2.5.0 build-2024</p>
      </div>
    </div>
  );
};
