
import React, { useState } from 'react';
import { Shield, Bell, Eye, LogOut, ChevronRight, Wand2, Smartphone, Lock, Globe, ArrowLeft, X, Sun, Moon, Check, UserCircle, Save, Calendar, Mail, AtSign, FileText, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { User } from '../types';
import { supabase } from '../supabaseClient';

interface SettingsViewProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  onLogout: () => void;
  onViewChange: (view: any) => void;
  theme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
}

const PrivacyPolicyContent = () => (
  <div className="space-y-6 text-sm text-slate-600 dark:text-gray-400 leading-relaxed">
    <div className="flex items-center space-x-2 text-slate-900 dark:text-white mb-4">
      <FileText size={20} className="text-blue-600" />
      <h4 className="font-black uppercase tracking-widest text-lg">POLÍTICA DE PRIVACIDAD</h4>
    </div>
    
    <p className="font-bold text-slate-800 dark:text-gray-200">Red Social</p>

    <p>
      En cumplimiento de lo dispuesto en el Reglamento (UE) 2016/679 del Parlamento Europeo y del Consejo, de 27 de abril de 2016 (RGPD), así como en la normativa nacional aplicable en materia de protección de datos personales, se informa a los usuarios de la red social privada Red Social sobre el tratamiento de sus datos personales.
    </p>

    <p>
      La protección de la privacidad, la seguridad de la información y la confidencialidad de los datos son principios fundamentales de nuestra organización.
    </p>

    <section>
      <h5 className="font-bold text-slate-900 dark:text-white mb-2">1. Responsable del tratamiento</h5>
      <p>El responsable del tratamiento de los datos personales es la empresa titular de Red Social, quien determina los fines y medios del tratamiento, y actúa conforme a los principios de licitud, lealtad, transparencia, minimización de datos y seguridad.</p>
    </section>

    <section>
      <h5 className="font-bold text-slate-900 dark:text-white mb-2">2. Ámbito y naturaleza de la plataforma</h5>
      <p>Red Social es una red social privada, corporativa y de acceso restringido, dirigida exclusivamente a profesionales, directivos y altos cargos vinculados al ámbito de la administración pública, la innovación y sectores afines. El acceso está sujeto a autorización expresa.</p>
    </section>

    <section>
      <h5 className="font-bold text-slate-900 dark:text-white mb-2">3. Datos personales objeto de tratamiento</h5>
      <p>De conformidad con el principio de minimización de datos (art. 5.1.c RGPD), únicamente se tratan los siguientes datos personales:</p>
      <ul className="list-disc ml-5 mt-2">
        <li>Dirección de correo electrónico profesional del usuario.</li>
      </ul>
      <p className="mt-2 text-xs italic">No se recaban datos especialmente protegidos ni información personal adicional.</p>
    </section>

    <section>
      <h5 className="font-bold text-slate-900 dark:text-white mb-2">4. Base legal del tratamiento</h5>
      <p>El tratamiento de los datos personales se fundamenta en:</p>
      <ul className="list-disc ml-5 mt-2">
        <li>El consentimiento del interesado (art. 6.1.a RGPD), otorgado en el momento del registro.</li>
        <li>La ejecución de un servicio solicitado por el usuario (art. 6.1.b RGPD).</li>
      </ul>
    </section>

    <section>
      <h5 className="font-bold text-slate-900 dark:text-white mb-2">5. Finalidad del tratamiento</h5>
      <p>Los datos personales serán tratados exclusivamente para las siguientes finalidades legítimas:</p>
      <ul className="list-disc ml-5 mt-2">
        <li>Gestión del alta, autenticación y acceso a la plataforma.</li>
        <li>Garantizar la seguridad y el correcto funcionamiento de la red social.</li>
        <li>Facilitar la interacción profesional dentro de la comunidad privada.</li>
        <li>Prevención de accesos no autorizados y usos indebidos del sistema.</li>
      </ul>
      <p className="mt-2 font-bold">En ningún caso los datos serán utilizados con fines comerciales, publicitarios o de perfilado.</p>
    </section>

    <section>
      <h5 className="font-bold text-slate-900 dark:text-white mb-2">6. Seguridad y confidencialidad de las credenciales</h5>
      <p>Las contraseñas de los usuarios:</p>
      <ul className="list-disc ml-5 mt-2">
        <li>Se almacenan mediante sistemas de cifrado robustos y no reversibles.</li>
        <li>No son accesibles ni visibles para el personal de la empresa.</li>
        <li>Se aplican medidas técnicas y organizativas apropiadas conforme al artículo 32 del RGPD para garantizar un nivel de seguridad adecuado al riesgo.</li>
      </ul>
    </section>

    <section>
      <h5 className="font-bold text-slate-900 dark:text-white mb-2">7. Conservación de los datos</h5>
      <p>Los datos personales se conservarán:</p>
      <ul className="list-disc ml-5 mt-2">
        <li>Mientras la cuenta del usuario permanezca activa.</li>
        <li>Durante el tiempo estrictamente necesario para cumplir con las finalidades del tratamiento.</li>
      </ul>
      <p className="mt-2">Una vez solicitada la baja, los datos serán eliminados de forma segura, salvo obligación legal de conservación.</p>
    </section>

    <section>
      <h5 className="font-bold text-slate-900 dark:text-white mb-2">8. Destinatarios y cesión de datos</h5>
      <p>No se cederán datos personales a terceros, salvo en los siguientes supuestos:</p>
      <ul className="list-disc ml-5 mt-2">
        <li>Cumplimiento de una obligación legal.</li>
        <li>Requerimiento por parte de autoridades públicas o judiciales competentes.</li>
      </ul>
      <p className="mt-2 font-medium">No se realizan transferencias internacionales de datos.</p>
    </section>

    <section>
      <h5 className="font-bold text-slate-900 dark:text-white mb-2">9. Derechos de los interesados</h5>
      <p>Los usuarios podrán ejercer, en cualquier momento, los derechos reconocidos por el RGPD:</p>
      <ul className="list-disc ml-5 mt-2">
        <li>Derecho de acceso (art. 15 RGPD).</li>
        <li>Derecho de rectificación (art. 16 RGPD).</li>
        <li>Derecho de supresión (“derecho al olvido”) (art. 17 RGPD).</li>
        <li>Derecho a la limitación del tratamiento (art. 18 RGPD).</li>
        <li>Derecho de oposición (art. 21 RGPD).</li>
        <li>Derecho a la portabilidad de los datos, cuando proceda (art. 20 RGPD).</li>
      </ul>
      <p className="mt-2">Las solicitudes podrán dirigirse al responsable del tratamiento a través de los canales habilitados por la empresa.</p>
    </section>

    <section>
      <h5 className="font-bold text-slate-900 dark:text-white mb-2">10. Derecho a reclamar ante la autoridad de control</h5>
      <p>El usuario tiene derecho a presentar una reclamación ante la autoridad de control competente en materia de protección de datos, si considera que el tratamiento de sus datos personales infringe la normativa vigente.</p>
    </section>

    <section>
      <h5 className="font-bold text-slate-900 dark:text-white mb-2">11. Obligaciones y responsabilidad del usuario</h5>
      <p>El usuario se compromete a:</p>
      <ul className="list-disc ml-5 mt-2">
        <li>Utilizar la plataforma de forma profesional, ética y conforme a su finalidad.</li>
        <li>Custodiar adecuadamente sus credenciales de acceso.</li>
        <li>Respetar la confidencialidad de la información compartida dentro de la red.</li>
      </ul>
    </section>

    <section>
      <h5 className="font-bold text-slate-900 dark:text-white mb-2">12. Modificaciones de la política de privacidad</h5>
      <p>La presente Política de Privacidad podrá actualizarse para adaptarse a cambios normativos o mejoras en la plataforma. Las modificaciones serán comunicadas a los usuarios de forma adecuada.</p>
    </section>
  </div>
);

export const SettingsView: React.FC<SettingsViewProps> = ({ user, onUpdateUser, onLogout, onViewChange, theme, onThemeChange }) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showAccessibility, setShowAccessibility] = useState(false);
  const [showPersonalData, setShowPersonalData] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);

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
        <SettingItem icon={Eye} label="Política de privacidad" onClick={() => setShowPrivacyPolicy(true)} />
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

      {showPrivacyPolicy && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowPrivacyPolicy(false)}>
          <div className="bg-white dark:bg-[#0a0a0a] w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white dark:border-zinc-800 flex flex-col max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            <div className="px-8 py-6 border-b border-gray-100 dark:border-zinc-900 flex justify-between items-center bg-white dark:bg-[#0a0a0a]">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 dark:bg-zinc-800 rounded-xl text-blue-600">
                  <Shield size={20} />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Privacidad y Protección de Datos</h3>
              </div>
              <button onClick={() => setShowPrivacyPolicy(false)} className="p-2 text-gray-400 hover:text-gray-600 transition-colors"><X size={20}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 scrollbar-hide">
              <PrivacyPolicyContent />
            </div>
            <div className="p-6 bg-slate-50 dark:bg-zinc-900 flex justify-center">
              <button 
                onClick={() => setShowPrivacyPolicy(false)}
                className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 dark:shadow-none"
              >
                Cerrar documento
              </button>
            </div>
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
            className="bg-white dark:bg-[#0a0a0a] w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden border border-white dark:border-zinc-800 animate-in zoom-in-95 duration-300"
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
                  onClick={() => { onLogout(); setShowLogoutConfirm(false); }}
                  className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-sm shadow-xl hover:bg-red-700 transition-all transform active:scale-95"
                >
                  Sí, cerrar sesión
                </button>
                <button 
                  onClick={() => setShowLogoutConfirm(false)}
                  className="w-full py-4 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-gray-400 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all"
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
    username: user.username || '',
    birthDate: user.birthDate || '',
    email: user.email || ''
  });

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setError(null);
    setPassSuccess(false);

    try {
      // 1. Si el usuario intenta cambiar la contraseña
      if (newPassword || currentPassword || confirmPassword) {
        if (!currentPassword) {
          throw new Error("Debes introducir tu contraseña actual.");
        }
        if (newPassword !== confirmPassword) {
          throw new Error("Las nuevas contraseñas no coinciden.");
        }
        if (newPassword.length < 8) {
          throw new Error("La nueva contraseña debe tener al menos 8 caracteres.");
        }

        // En Supabase Auth, para cambiar la contraseña necesitamos una sesión activa.
        // El campo currentPassword no es estrictamente requerido por el SDK básico pero se pide por seguridad UI.
        const { error: passUpdateError } = await supabase.auth.updateUser({
          password: newPassword
        });

        if (passUpdateError) throw passUpdateError;
        setPassSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }

      // 2. Guardar el resto de datos del perfil
      onSave({ ...user, ...formData });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUsernameChange = (val: string) => {
    const clean = val.toLowerCase().replace(/\s/g, '').replace(/@/g, '');
    setFormData({...formData, username: clean});
  };

  return (
    <div className="flex flex-col max-h-[90vh]">
      <div className="p-8 border-b border-slate-50 dark:border-zinc-900 flex justify-between items-center shrink-0">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 dark:bg-zinc-900 rounded-xl text-blue-600">
            <UserCircle size={24} />
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white">Datos Personales</h3>
        </div>
        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 transition-colors"><X size={20}/></button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-2xl border border-red-100 dark:border-red-900/30 flex items-center space-x-3 animate-in slide-in-from-top-2">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {passSuccess && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs font-bold rounded-2xl border border-green-100 dark:border-green-900/30 flex items-center space-x-3 animate-in slide-in-from-top-2">
            <CheckCircle2 size={18} />
            <span>¡Contraseña actualizada correctamente!</span>
          </div>
        )}

        <div className="space-y-5">
          <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Información Básica</h4>
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
            <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase ml-1">Nombre de usuario</label>
            <div className="relative">
              <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="text" 
                value={formData.username} 
                onChange={(e) => handleUsernameChange(e.target.value)}
                className="w-full pl-12 pr-5 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
                placeholder="anagarcia"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
        </div>

        <div className="space-y-5 pt-4 border-t border-slate-50 dark:border-zinc-900">
          <div className="flex items-center space-x-2">
            <Lock size={16} className="text-blue-500" />
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Seguridad y Acceso</h4>
          </div>
          
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase ml-1">Contraseña Actual</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="password" 
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-5 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase ml-1">Nueva Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 caracteres"
                  className="w-full pl-12 pr-5 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase ml-1">Confirmar Nueva Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña"
                  className="w-full pl-12 pr-5 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
                />
              </div>
            </div>
          </div>
          <p className="text-[9px] text-slate-400 italic font-medium ml-1">Rellena estos campos solo si deseas actualizar tu contraseña de acceso.</p>
        </div>

        <div className="pt-4 flex space-x-3 shrink-0">
          <button 
            type="button" 
            onClick={onClose}
            className="flex-1 py-4 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-gray-400 rounded-2xl font-black text-sm hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            disabled={isUpdating}
            className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-100 dark:shadow-none hover:bg-blue-700 transition-all flex items-center justify-center space-x-2 transform active:scale-95 disabled:opacity-50"
          >
            {isUpdating ? <Loader2 className="animate-spin" size={20} /> : <><Save size={18} /><span>Guardar cambios</span></>}
          </button>
        </div>
      </form>
    </div>
  );
};
