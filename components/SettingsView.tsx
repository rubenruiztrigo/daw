
import React, { useState } from 'react';
import { Shield, Bell, Eye, LogOut, ChevronRight, Wand2, Smartphone, Lock, ArrowLeft, X, Sun, Moon, Check, UserCircle, Save, Calendar, Mail, AtSign, FileText, AlertCircle, CheckCircle2, Loader2, Medal, GraduationCap, Star, Trophy } from 'lucide-react';
import { User, BADGE_CATALOG } from '../types';
import { supabase } from '../supabaseClient';
import { HelpChatBot } from './HelpChatBot';
import { Language, useTranslation } from '../utils/translations';

interface SettingsViewProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  onLogout: () => void;
  onViewChange: (view: any) => void;
  theme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
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

const BadgesList: React.FC<{ user: User, t: any, onClose: () => void }> = ({ user, t, onClose }) => {
  // Static definition of available badges for now
  // Centralized badge catalog is used here via import
  const allBadges = BADGE_CATALOG;

  const categories = [
    { id: 'general', label: t('cat_general'), icon: UserCircle },
    { id: 'novas', label: t('cat_novas'), icon: Star },
    { id: 'congresos', label: t('cat_congresos'), icon: Calendar },
    { id: 'premios', label: t('cat_premios'), icon: Medal },
    { id: 'eventos', label: t('cat_eventos'), icon: GraduationCap },
    { id: 'formacion', label: t('cat_formacion'), icon: FileText },
    { id: 'ranking', label: t('cat_ranking'), icon: Trophy }
  ];

  // Check if user has badges (mapping by ID or checking if object exists)
  const userBadgeIds = new Set(user.badges?.map(b => b.id) || []);

  return (
    <div className="flex flex-col h-full max-h-[85vh]">
      <div className="p-8 border-b border-slate-50 dark:border-zinc-900 flex justify-between items-center bg-white dark:bg-[#0a0a0a]">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-amber-600">
            <Medal size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">{t('badges_title')}</h3>
            <p className="text-xs text-slate-500 font-medium">{t('badges_desc')}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 scrollbar-hide bg-slate-50 dark:bg-black/20 space-y-8">
        {categories.map(cat => {
          const catBadges = allBadges.filter(b => b.category === cat.id);
          if (catBadges.length === 0) return null;

          return (
            <div key={cat.id} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center space-x-2 text-slate-400 dark:text-zinc-500 uppercase tracking-widest text-[10px] font-black pl-1">
                <cat.icon size={14} />
                <span>{cat.label}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {catBadges.map(badge => {
                  const isUnlocked = userBadgeIds.has(badge.id);
                  return (
                    <div key={badge.id} className={`p-5 rounded-3xl border transition-all relative ${isUnlocked ? 'bg-white dark:bg-[#111] border-slate-100 dark:border-zinc-800' : 'bg-slate-100/50 dark:bg-zinc-900/50 border-transparent opacity-60 grayscale'}`}>
                      <div className="flex items-start space-x-4">
                        <div className={`p-3 rounded-2xl ${isUnlocked ? badge.color : 'bg-gray-200 text-gray-400 dark:bg-zinc-800 dark:text-gray-600'}`}>
                          <Medal size={24} />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <h4 className="font-bold text-slate-900 dark:text-white">{badge.label}</h4>
                            {isUnlocked && <CheckCircle2 size={16} className="text-blue-500" />}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-gray-400 font-medium leading-relaxed">{badge.description}</p>
                        </div>
                      </div>

                      {badge.value !== undefined && (
                        <div className="absolute bottom-4 right-4 bg-slate-50 dark:bg-zinc-900/50 px-2 py-1 rounded-lg border border-slate-100 dark:border-zinc-800 flex items-center space-x-1.5">
                          <span className="text-[11px] font-black text-blue-600 leading-none">{badge.value}</span>
                          <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-tighter">Novas</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const SettingsView: React.FC<SettingsViewProps> = ({ user, onUpdateUser, onLogout, onViewChange, theme, onThemeChange, language, onLanguageChange }) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showAccessibility, setShowAccessibility] = useState(false);
  const [showPersonalData, setShowPersonalData] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showBadges, setShowBadges] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelpChat, setShowHelpChat] = useState(false);
  const t = useTranslation(language);

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
        {/* Back button removed as requested */}
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">{t('settings')}</h2>
        </div>
      </div>

      <div className="border border-slate-100 dark:border-zinc-800 rounded-[2rem] overflow-hidden">
        <SettingItem icon={UserCircle} label={t('personal_data')} onClick={() => setShowPersonalData(true)} />
        <SettingItem icon={Medal} label={t('badges')} onClick={() => setShowBadges(true)} />
        <SettingItem icon={Wand2} label={t('accessibility')} onClick={() => setShowAccessibility(true)} />
        <SettingItem icon={Bell} label={t('notifications')} onClick={() => setShowNotifications(true)} />
        <SettingItem icon={Lock} label={t('privacy_security')} />
        <SettingItem icon={Smartphone} label={t('devices')} />
      </div>

      {showBadges && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowBadges(false)}>
          <div className="bg-white dark:bg-[#0a0a0a] w-full max-w-2xl rounded-[2.5rem] overflow-hidden animate-in zoom-in-95 duration-300 border border-white dark:border-zinc-800 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <BadgesList user={user} t={t} onClose={() => setShowBadges(false)} />
          </div>
        </div>
      )}

      {showNotifications && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowNotifications(false)}>
          <div className="bg-white dark:bg-[#0a0a0a] w-full max-w-lg rounded-[2.5rem] overflow-hidden animate-in zoom-in-95 duration-300 border border-white dark:border-zinc-800 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <NotificationSettingsForm user={user} t={t} onSave={(updated) => { onUpdateUser(updated); setShowNotifications(false); }} onClose={() => setShowNotifications(false)} />
          </div>
        </div>
      )}

      <div className="border border-slate-100 dark:border-zinc-800 rounded-[2rem] overflow-hidden">
        <SettingItem icon={Shield} label={t('help_center')} onClick={() => setShowHelpChat(true)} />
        <SettingItem icon={Eye} label={t('privacy_policy')} onClick={() => setShowPrivacyPolicy(true)} />
        <SettingItem
          icon={LogOut}
          label={t('logout')}
          color="text-red-500"
          onClick={() => setShowLogoutConfirm(true)}
        />
      </div>

      <div className="text-center pt-8">
        <p className="text-[10px] text-slate-300 dark:text-zinc-700 font-black uppercase tracking-[0.3em]">v2.5.0 build-2024</p>
      </div>

      {showPersonalData && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowPersonalData(false)}>
          <div className="bg-white dark:bg-[#0a0a0a] w-full max-w-lg rounded-[2.5rem] overflow-hidden animate-in zoom-in-95 duration-300 border border-white dark:border-zinc-800 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <PersonalDataForm user={user} t={t} onSave={(updated) => { onUpdateUser(updated); setShowPersonalData(false); }} onClose={() => setShowPersonalData(false)} />
          </div>
        </div>
      )}

      {showPrivacyPolicy && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowPrivacyPolicy(false)}>
          <div className="bg-white dark:bg-[#0a0a0a] w-full max-w-3xl rounded-[2.5rem] overflow-hidden animate-in zoom-in-95 duration-300 border border-white dark:border-zinc-800 flex flex-col max-h-[85vh] shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="px-8 py-6 border-b border-gray-100 dark:border-zinc-900 flex justify-between items-center bg-white dark:bg-[#0a0a0a]">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 dark:bg-zinc-800 rounded-xl text-blue-600">
                  <Shield size={20} />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">{t('privacy_policy_title')}</h3>
              </div>
              <button onClick={() => setShowPrivacyPolicy(false)} className="p-2 text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 scrollbar-hide">
              <PrivacyPolicyContent />
            </div>
            <div className="p-6 bg-slate-50 dark:bg-zinc-900 flex justify-center">
              <button
                onClick={() => setShowPrivacyPolicy(false)}
                className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all"
              >
                {t('close_document')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAccessibility && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowAccessibility(false)}>
          <div className="bg-white dark:bg-[#0a0a0a] w-full max-w-sm rounded-[2.5rem] overflow-hidden animate-in zoom-in-95 duration-300 border border-white dark:border-zinc-800 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">{t('accessibility')}</h3>
                <button onClick={() => setShowAccessibility(false)} className="p-2 text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-4">{t('select_theme')}</p>

                <button
                  onClick={() => onThemeChange('light')}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${theme === 'light' ? 'border-blue-600 bg-blue-50/50 dark:bg-zinc-900/50' : 'border-slate-100 dark:border-zinc-800 hover:border-blue-200'}`}
                >
                  <div className="flex items-center space-x-3">
                    <Sun className={theme === 'light' ? 'text-blue-600' : 'text-gray-400'} size={20} />
                    <span className={`font-bold ${theme === 'light' ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400'}`}>{t('theme_light')}</span>
                  </div>
                  {theme === 'light' && <Check size={18} className="text-blue-600" />}
                </button>

                <button
                  onClick={() => onThemeChange('dark')}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${theme === 'dark' ? 'border-blue-600 bg-blue-50/50 dark:bg-zinc-900/50' : 'border-slate-100 dark:border-zinc-800 hover:border-blue-200'}`}
                >
                  <div className="flex items-center space-x-3">
                    <Moon className={theme === 'dark' ? 'text-blue-600' : 'text-gray-400'} size={20} />
                    <span className={`font-bold ${theme === 'dark' ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400'}`}>{t('theme_dark')}</span>
                  </div>
                  {theme === 'dark' && <Check size={18} className="text-blue-600" />}
                </button>
              </div>

              <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-zinc-900">
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-4">{t('select_language')}</p>

                <button
                  onClick={() => onLanguageChange('es')}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${language === 'es' ? 'border-blue-600 bg-blue-50/50 dark:bg-zinc-900/50' : 'border-slate-100 dark:border-zinc-800 hover:border-blue-200'}`}
                >
                  <div className="flex items-center space-x-3">
                    <span className={`font-bold ${language === 'es' ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400'}`}>Español</span>
                  </div>
                  {language === 'es' && <Check size={18} className="text-blue-600" />}
                </button>

                <button
                  onClick={() => onLanguageChange('en')}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${language === 'en' ? 'border-blue-600 bg-blue-50/50 dark:bg-zinc-900/50' : 'border-slate-100 dark:border-zinc-800 hover:border-blue-200'}`}
                >
                  <div className="flex items-center space-x-3">
                    <span className={`font-bold ${language === 'en' ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400'}`}>English</span>
                  </div>
                  {language === 'en' && <Check size={18} className="text-blue-600" />}
                </button>
              </div>

              <button
                onClick={() => setShowAccessibility(false)}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all transform active:scale-95 mt-4"
              >
                {t('done')}
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
            className="bg-white dark:bg-[#0a0a0a] w-full max-w-sm rounded-[2.5rem] overflow-hidden border border-white dark:border-zinc-800 animate-in zoom-in-95 duration-300 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8 text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center">
                <LogOut size={32} />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">{t('logout_confirm_title')}</h3>
                <p className="text-sm text-slate-500 dark:text-gray-400 font-medium">{t('logout_confirm_desc')}</p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => { onLogout(); setShowLogoutConfirm(false); }}
                  className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-sm hover:bg-red-700 transition-all transform active:scale-95"
                >
                  {t('yes_logout')}
                </button>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="w-full py-4 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-gray-400 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showHelpChat && (
        <HelpChatBot
          userName={user.name}
          onClose={() => setShowHelpChat(false)}
        />
      )}
    </div>
  );
};

const PersonalDataForm: React.FC<{ user: User, t: any, onSave: (updatedUser: User) => void, onClose: () => void }> = ({ user, t, onSave, onClose }) => {
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
          throw new Error(t('enter_current_password'));
        }
        if (newPassword !== confirmPassword) {
          throw new Error(t('passwords_dont_match'));
        }
        if (newPassword.length < 8) {
          throw new Error(t('password_min_length'));
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


  return (
    <div className="flex flex-col max-h-[90vh]">
      <div className="p-8 border-b border-slate-50 dark:border-zinc-900 flex justify-between items-center shrink-0">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 dark:bg-zinc-900 rounded-xl text-blue-600">
            <UserCircle size={24} />
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white">{t('personal_data')}</h3>
        </div>
        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
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
            <span>{t('password_updated_success')}</span>
          </div>
        )}

        <div className="space-y-5">
          <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">{t('basic_info')}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase ml-1">{t('name_label')}</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-5 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase ml-1">{t('last_name_label')}</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-5 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
              />
            </div>
          </div>


          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase ml-1">{t('birth_date_label')}</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  className="w-full pl-12 pr-5 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase ml-1">{t('institutional_email')}</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-12 pr-5 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5 pt-4 border-t border-slate-50 dark:border-zinc-900">
          <div className="flex items-center space-x-2">
            <Lock size={16} className="text-blue-500" />
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t('security_access')}</h4>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase ml-1">{t('current_password_label')}</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={t('current_password_placeholder')}
                className="w-full pl-12 pr-5 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase ml-1">{t('new_password_label')}</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t('new_password_placeholder')}
                  className="w-full pl-12 pr-5 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase ml-1">{t('confirm_new_password_label')}</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('confirm_password_placeholder')}
                  className="w-full pl-12 pr-5 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
                />
              </div>
            </div>
          </div>
          <p className="text-[9px] text-slate-400 italic font-medium ml-1">{t('password_change_hint')}</p>
        </div>

        <div className="pt-4 flex space-x-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-4 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-gray-400 rounded-2xl font-black text-sm hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all"
          >
            {t('cancel')}
          </button>
          <button
            type="submit"
            disabled={isUpdating}
            className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all flex items-center justify-center space-x-2 transform active:scale-95 disabled:opacity-50"
          >
            {isUpdating ? <Loader2 className="animate-spin" size={20} /> : <><Save size={18} /><span>{t('save_changes')}</span></>}
          </button>
        </div>
      </form>
    </div>
  );
};

const NotificationSettingsForm: React.FC<{ user: User, t: any, onSave: (updatedUser: User) => void, onClose: () => void }> = ({ user, t, onSave, onClose }) => {
  const [settings, setSettings] = useState(user.notificationSettings || {
    likes_post: true,
    likes_news: true,
    likes_comment: true,
    comments_post: true,
    comments_news: true,
    replies: true,
    follows: true,
    event_supports: true,
    reposts: true,
    read_receipts: true
  });

  const [isSaving, setIsSaving] = useState(false);

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulating save delay for UX
    await new Promise(resolve => setTimeout(resolve, 500));
    onSave({ ...user, notificationSettings: settings });
    setIsSaving(false);
  };

  const ToggleItem = ({ id, label, checked, onChange }: { id: string, label: string, checked: boolean, onChange: () => void }) => (
    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-zinc-900/50 rounded-2xl border border-slate-100 dark:border-zinc-800 transition-all">
      <span className="text-sm font-bold text-slate-700 dark:text-gray-300">{label}</span>
      <button
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${checked ? 'bg-blue-600' : 'bg-slate-200 dark:bg-zinc-700'}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );

  return (
    <div className="flex flex-col h-full max-h-[85vh]">
      <div className="p-8 border-b border-slate-50 dark:border-zinc-900 flex justify-between items-center bg-white dark:bg-[#0a0a0a]">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600">
            <Bell size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">{t('notification_settings')}</h3>
            <p className="text-xs text-slate-500 font-medium">{t('notification_settings_desc')}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 scrollbar-hide space-y-8">
        {/* Sección Posts */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{t('notif_cat_posts')}</h4>
          <ToggleItem id="likes_post" label={t('notif_likes_post')} checked={settings.likes_post} onChange={() => toggleSetting('likes_post')} />
          <ToggleItem id="comments_post" label={t('notif_comments_post')} checked={settings.comments_post} onChange={() => toggleSetting('comments_post')} />
          <ToggleItem id="reposts" label={t('notif_reposts')} checked={settings.reposts} onChange={() => toggleSetting('reposts')} />
        </div>

        {/* Sección Noticias */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{t('notif_cat_news')}</h4>
          <ToggleItem id="likes_news" label={t('notif_likes_news')} checked={settings.likes_news} onChange={() => toggleSetting('likes_news')} />
          <ToggleItem id="comments_news" label={t('notif_comments_news')} checked={settings.comments_news} onChange={() => toggleSetting('comments_news')} />
        </div>

        {/* Sección Interacciones */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{t('notif_cat_interactions')}</h4>
          <ToggleItem id="replies" label={t('notif_replies')} checked={settings.replies} onChange={() => toggleSetting('replies')} />
          <ToggleItem id="likes_comment" label={t('notif_likes_comment')} checked={settings.likes_comment} onChange={() => toggleSetting('likes_comment')} />
          <ToggleItem id="event_supports" label={t('notif_event_supports')} checked={settings.event_supports} onChange={() => toggleSetting('event_supports')} />
          <ToggleItem id="read_receipts" label={t('notif_read_receipts')} checked={settings.read_receipts} onChange={() => toggleSetting('read_receipts')} />
        </div>

        {/* Sección Seguidores */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{t('notif_cat_followers')}</h4>
          <ToggleItem id="follows" label={t('notif_follows')} checked={settings.follows} onChange={() => toggleSetting('follows')} />
        </div>
      </div>

      <div className="p-8 bg-slate-50 dark:bg-zinc-900 border-t border-slate-100 dark:border-zinc-800 flex space-x-3">
        <button
          onClick={onClose}
          className="flex-1 py-4 bg-white dark:bg-zinc-800 text-slate-600 dark:text-gray-400 rounded-2xl font-black text-sm border border-slate-100 dark:border-zinc-700 hover:bg-slate-50 transition-all"
        >
          {t('cancel')}
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all flex items-center justify-center space-x-2 transform active:scale-95 disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="animate-spin" size={20} /> : <><Save size={18} /><span>{t('save_changes')}</span></>}
        </button>
      </div>
    </div>
  );
};
