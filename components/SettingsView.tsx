
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { useScrollLock } from '../hooks/useScrollLock';
import { Shield, Bell, Eye, LogOut, ChevronRight, Wand2, Megaphone, Lock, ArrowLeft, X, Sun, Moon, Check, UserCircle, Save, Calendar, Mail, AtSign, FileText, AlertCircle, CheckCircle2, Loader2, Medal, GraduationCap, Star, Trophy, MessageCircle, RefreshCw, Info, Heart, Globe, Settings, Briefcase, Building } from 'lucide-react';
import { User, BADGE_CATALOG } from '../types';
import { COUNTRIES, COUNTRIES_DATA } from '../constants';
import { supabase } from '../supabaseClient';
import { HelpChatBot } from './HelpChatBot';
import { PreferencesModal } from './PreferencesModal';
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

const AboutContent = ({ t }: { t: any }) => (
  <div className="space-y-6 text-sm text-slate-600 dark:text-gray-400 leading-relaxed">

    <p className="font-bold text-slate-800 dark:text-gray-200">Red Social NovaGob</p>

    <p>
      La Red Social NovaGob es la red social de la administración pública, un espacio de encuentro digital para profesionales del sector público que buscan innovar y mejorar los servicios públicos.
    </p>

    <section>
      <h5 className="font-bold text-slate-900 dark:text-white mb-2">Misión</h5>
      <p>Conectar a las personas que trabajan en el sector público para compartir conocimiento, experiencias y buenas prácticas, fomentando la colaboración y la innovación abierta.</p>
    </section>

    <section>
      <h5 className="font-bold text-slate-900 dark:text-white mb-2">Visión</h5>
      <p>Ser la plataforma de referencia para la transformación de la administración pública en Iberoamérica, impulsando una gestión más eficiente, transparente y cercana a la ciudadanía.</p>
    </section>

    <section>
      <h5 className="font-bold text-slate-900 dark:text-white mb-2">Valores</h5>
      <ul className="list-disc ml-5 mt-2">
        <li>Innovación pública</li>
        <li>Colaboración y co-creación</li>
        <li>Transparencia y apertura</li>
        <li>Ética pública</li>
        <li>Orientación a la ciudadanía</li>
      </ul>
    </section>

    <div className="pt-6 border-t border-slate-100 dark:border-zinc-800 text-center">
      <p className="text-xs text-slate-400">© {new Date().getFullYear()} Red Social NovaGob</p>
      <p className="text-[10px] text-slate-300 mt-1">Refactor resolve_registration_request to handle ambiguous column reference</p>
    </div>
  </div>
);

const CustomBadgeIcon = ({ className = "", size = 24 }: any) => (
  <img
    src="/img/novagob.brand_isotipo_black.svg"
    style={{ width: size, height: size }}
    className={`${className} dark:invert opacity-80`}
    alt=""
  />
);

const BadgesList: React.FC<{ user: User, t: any, onClose: () => void }> = ({ user, t, onClose }) => {
  useScrollLock();
  const [allBadges, setAllBadges] = useState<any[]>(BADGE_CATALOG);
  const [loading, setLoading] = useState(true);
  const [userBadgeIds, setUserBadgeIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch all available badges from 'badges' table
        const { data: dbBadges } = await supabase
          .from('badges')
          .select('*')
          .order('category');

        if (dbBadges && dbBadges.length > 0) {
          setAllBadges(dbBadges);
        } else {
          setAllBadges(BADGE_CATALOG);
        }

        // Fetch user's unlocked badges from 'user_badges' table
        const { data: unlocked } = await supabase
          .from('user_badges')
          .select('badge_id')
          .eq('user_id', user.id);

        if (unlocked) {
          setUserBadgeIds(new Set(unlocked.map(ub => ub.badge_id)));
        }
      } catch (error) {
        console.error("Error fetching badges in settings:", error);
        setAllBadges(BADGE_CATALOG);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user.id]);

  const categories = [
    { id: 'general', label: t('cat_general'), icon: UserCircle },
    { id: 'novas', label: t('cat_novas'), icon: Star },
    { id: 'congresos', label: t('cat_congresos'), icon: Calendar },
    { id: 'premios', label: t('cat_premios'), icon: () => <img src="/img/novagob.brand_isotipo_black.svg" className="w-3.5 h-3.5 dark:invert opacity-70" alt="" /> },
    { id: 'eventos', label: t('cat_eventos'), icon: GraduationCap },
    { id: 'formacion', label: t('cat_formacion'), icon: FileText },
    { id: 'ranking', label: t('cat_ranking'), icon: Trophy }
  ];

  return (
    <div className="flex flex-col h-full max-h-[85vh]">
      <div className="p-8 border-b border-slate-50 dark:border-zinc-900 flex justify-between items-center bg-white dark:bg-[#0a0a0a]">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-amber-600">
            <CustomBadgeIcon size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">{t('badges_title')}</h3>
            <p className="text-xs text-slate-500 font-medium">{t('badges_desc')}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 scrollbar-hide bg-slate-50 dark:bg-black/20 space-y-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="animate-spin text-blue-600" size={32} />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('loading') || 'Cargando insignias...'}</p>
          </div>
        ) : allBadges.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-[#111] rounded-[2.5rem] border border-dashed border-slate-200 dark:border-zinc-800">
            <CustomBadgeIcon className="mx-auto text-slate-100 dark:text-zinc-900 mb-4" size={48} />
            <p className="text-slate-400 font-bold italic">{t('no_badges_available') || 'No se encontraron insignias disponibles.'}</p>
          </div>
        ) : categories.map(cat => {
          const catBadges = allBadges.filter(b => b.category?.toLowerCase() === cat.id.toLowerCase());
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
                        <div className={`p-3 rounded-2xl ${isUnlocked ? (badge.color || 'bg-blue-100 text-blue-600') : 'bg-gray-200 text-gray-400 dark:bg-zinc-800 dark:text-gray-600'}`}>
                          <CustomBadgeIcon size={24} />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <h4 className="font-bold text-slate-900 dark:text-white">{badge.label}</h4>
                            {isUnlocked && <CheckCircle2 size={16} className="text-blue-500" />}
                          </div>
                        </div>
                      </div>

                      {badge.value !== undefined && badge.value !== null && (
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


const ChatSettingsForm: React.FC<{
  user: User,
  t: any,
  onSave: (updatedUser: User) => void,
  onClose: () => void,
  embedded?: boolean,
  mode?: 'all' | 'theme' | 'config',
  onReset?: () => void
}> = ({ user, t, onSave, onClose, embedded = false, mode = 'all', onReset }) => {
  const [settings, setSettings] = useState(user.chatSettings || {
    senderColor: '#8b5cf6', // Default Purple
    receiverColor: '#ede9fe', // Default Light Purple
    backgroundColor: '#f4f4f5', // Light Gray Background
    readReceipts: true
  });

  const [isSaving, setIsSaving] = useState(false);

  // Sender Colors (5 options: Default (Purple), Green, Blue, Red, Orange)
  const senderColors = [
    '#8b5cf6', // Default (Violet-500)
    '#10b981', // Emerald-500
    '#2563eb', // Blue-600
    '#ef4444', // Red-500
    '#f97316', // Orange-500
  ];

  // Receiver Colors (5 options: Default (Light Purple), Light Green, Light Blue, Light Red, Light Orange)
  const receiverColors = [
    '#ede9fe', // Default (Violet-100)
    '#d1fae5', // Emerald-100
    '#dbeafe', // Blue-100
    '#fee2e2', // Red-100
    '#ffedd5', // Orange-100
  ];

  const handleSave = async () => {
    setIsSaving(true);
    // Simulating save
    await new Promise(resolve => setTimeout(resolve, 500));
    const { error } = await supabase.from('profiles').update({ chat_settings: settings }).eq('id', user.id);

    if (!error) {
      onSave({ ...user, chatSettings: settings });
      onClose(); // Close the settings window
    }
    setIsSaving(false);
  };

  const handleReset = async () => {
    if (onReset) {
      onReset();
      // Also reset local state to defaults
      setSettings({
        senderColor: '#8b5cf6', // Default Purple
        receiverColor: '#ede9fe', // Default Light Purple
        backgroundColor: '#f4f4f5', // Light Gray Background
        readReceipts: true
      });
    }
  };

  const ColorPicker = ({ label, value, onChange, options }: { label: string, value: string, onChange: (c: string) => void, options: string[] }) => (
    <div className={embedded ? "space-y-2" : "space-y-3"}>
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{label}</label>
      <div className={`flex flex-wrap justify-center ${embedded ? 'gap-2' : 'gap-3'}`}>
        {options.map(color => (
          <button
            key={color}
            onClick={() => onChange(color)}
            className={`${embedded ? 'w-8 h-8' : 'w-10 h-10'} rounded-full border-2 transition-all ${value === color ? 'border-slate-900 dark:border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`}
            style={{ backgroundColor: color }}
          >
            {value === color && <Check size={14} className={`mx-auto ${['#f3f4f6', '#dbeafe', '#d1fae5', '#ede9fe', '#fee2e2', '#ffedd5'].includes(color) ? 'text-slate-900' : 'text-white'}`} />}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className={`flex flex-col ${embedded ? 'h-full min-h-0' : 'h-full max-h-[85vh]'}`}>
      {!embedded && (
        <div className="p-8 border-b border-slate-50 dark:border-zinc-900 flex justify-between items-center bg-white dark:bg-[#0a0a0a]">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600">
              <MessageCircle size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">{t('chats')}</h3>
              <p className="text-xs text-slate-500 font-medium">{t('chat_settings_desc') || "Personaliza tus chats"}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
        </div>
      )}

      <div className={`flex-1 overflow-y-auto scrollbar-hide ${embedded ? 'px-6 py-4 space-y-4' : 'space-y-8 p-8'}`}>

        {(mode === 'all' || mode === 'theme') && (
          <>
            <ColorPicker
              label={t('sender_color') || "Color de tus mensajes"}
              value={settings.senderColor}
              onChange={(c) => setSettings({ ...settings, senderColor: c })}
              options={senderColors}
            />

            <ColorPicker
              label={t('receiver_color') || "Color de mensajes recibidos"}
              value={settings.receiverColor}
              onChange={(c) => setSettings({ ...settings, receiverColor: c })}
              options={receiverColors}
            />
          </>
        )}

        {(mode === 'all' || mode === 'config') && (
          <div className={`${embedded ? 'pt-2' : 'pt-4'} ${mode === 'config' ? '' : 'border-t border-slate-50 dark:border-zinc-900'}`}>
            <div className={`flex items-center justify-between ${embedded ? 'p-3' : 'p-4'} bg-slate-50 dark:bg-zinc-900/50 rounded-2xl border border-slate-100 dark:border-zinc-800 transition-all`}>
              <span className="text-sm font-bold text-slate-700 dark:text-gray-300">{t('read_receipts') || "Confirmación de lectura"}</span>
              <button
                onClick={() => setSettings(prev => ({ ...prev, readReceipts: !prev.readReceipts }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${settings.readReceipts ? 'bg-blue-600' : 'bg-slate-200 dark:bg-zinc-700'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.readReceipts ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 px-2">
              {t('read_receipts_desc') || "Si desactivas esta opción, no verás la confirmación de lectura de otros usuarios ni ellos verán la tuya."}
            </p>
          </div>
        )}

        {/* Preview - Only show in theme mode or all */}
        {(mode === 'all' || mode === 'theme') && (
          <div className={`${embedded ? 'mt-4 p-3' : 'mt-8 p-4'} rounded-3xl border border-gray-100 dark:border-zinc-800`} style={{ backgroundColor: settings.backgroundColor }}>
            <p className="text-[10px] text-center text-slate-400 font-bold uppercase mb-4">VISTA PREVIA</p>
            <div className="space-y-3">
              <div className="flex justify-start">
                <div className="p-3 rounded-2xl rounded-tl-none max-w-[80%] text-sm font-medium" style={{ backgroundColor: settings.receiverColor, color: settings.receiverColor === '#27272a' ? 'white' : 'black' }}>
                  Hola, ¿qué tal todo?
                </div>
              </div>
              <div className="flex justify-end">
                <div className="p-3 rounded-2xl rounded-tr-none max-w-[80%] text-sm font-medium text-white" style={{ backgroundColor: settings.senderColor }}>
                  ¡Todo genial! Configurando mis chats 🎨
                </div>
              </div>
            </div>
          </div>
        )}

        <div className={`${embedded ? 'pt-6 space-y-3 flex flex-col items-center' : 'pt-8 border-t border-slate-50 dark:border-zinc-900 bg-white dark:bg-[#0a0a0a]'}`}>
          {mode === 'theme' && onReset && (
            <button
              onClick={handleReset}
              disabled={isSaving}
              className={`w-[60%] ${embedded ? 'py-2.5 text-xs' : 'py-4 text-sm'} bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-gray-400 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all`}
            >
              {t('reset') || "Restablecer"}
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`w-[60%] ${embedded ? 'py-2.5 text-xs' : 'py-4 text-sm'} bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700 transition-all flex items-center justify-center space-x-2 disabled:opacity-50`}
          >
            {isSaving ? <Loader2 className="animate-spin" size={16} /> : <span>{t('save_changes')}</span>}
          </button>
        </div>


      </div>
    </div>
  );
};


const NotificationSettingsForm: React.FC<{ user: User, t: any, onSave: (updatedUser: User) => void, onClose: () => void }> = ({ user, t, onSave, onClose }) => {
  useScrollLock();
  const [settings, setSettings] = useState({
    likes_post: true,
    likes_news: true,
    likes_comment: true,
    comments_post: true,
    comments_news: true,
    replies: true,
    follows: true,
    event_supports: true,
    reposts: true,
    mentions: true,
    ...user.notificationSettings
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
          <ToggleItem id="mentions" label={t('notif_mentions')} checked={settings.mentions} onChange={() => toggleSetting('mentions')} />
          <ToggleItem id="likes_comment" label={t('notif_likes_comment')} checked={settings.likes_comment} onChange={() => toggleSetting('likes_comment')} />
          <ToggleItem id="event_supports" label={t('notif_event_supports')} checked={settings.event_supports} onChange={() => toggleSetting('event_supports')} />

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


const ADMIN_TYPES = [
  'Administración Pública central',
  'Administración Pública regional',
  'Administración Pública local/municipal',
  'Empresa privada',
  'Organización del tercer sector'
];

const JOB_CATEGORIES = ['Directivo', 'Técnico', 'Administrativo'];

const PersonalDataForm: React.FC<{ user: User, t: any, onSave: (updatedUser: User) => void, onClose: () => void }> = ({ user, t, onSave, onClose }) => {
  useScrollLock();
  const [formData, setFormData] = useState({
    name: user.name || '',
    lastName: user.lastName || '',
    username: user.username || '',
    birthDate: user.birthDate || '',
    email: user.email || '',
    organizationName: user.organizationName || '',
    organizationObjective: user.organizationObjective || '',
    country: user.country || '',
    region: user.region || '',
    position: user.position || '',
    department: user.department || '',
    jobCategory: user.jobCategory && JOB_CATEGORIES.includes(user.jobCategory) ? user.jobCategory : (user.jobCategory ? 'Otro' : ''),
    customJobCategory: user.jobCategory && !JOB_CATEGORIES.includes(user.jobCategory) ? user.jobCategory : '',
    administrationType: user.administrationType && ADMIN_TYPES.includes(user.administrationType) ? user.administrationType : (user.administrationType ? 'Otra' : ''),
    customAdministrationType: user.administrationType && !ADMIN_TYPES.includes(user.administrationType) ? user.administrationType : '',
    bio: user.bio || ''
  });

  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'personal' | 'professional'>('professional');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setError(null);

    try {
      const finalAdministrationType = formData.administrationType === 'Otra'
        ? formData.customAdministrationType
        : formData.administrationType;

      const finalJobCategory = formData.jobCategory === 'Otro'
        ? formData.customJobCategory
        : formData.jobCategory;

      onSave({
        ...user,
        ...formData,
        administrationType: finalAdministrationType,
        jobCategory: finalJobCategory
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[85vh]">
      <div className="p-8 border-b border-slate-50 dark:border-zinc-900 flex justify-between items-center shrink-0">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 dark:bg-zinc-900 rounded-xl text-blue-600">
            <UserCircle size={24} />
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white">{t('personal_data')}</h3>
        </div>
        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-2xl border border-red-100 dark:border-red-900/30 flex items-center space-x-3 animate-in slide-in-from-top-2">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Top Fixed Section: Username and Bio */}
          <div className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase ml-1">{t('username_label')}</label>
              <div className="relative">
                <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
                  className="w-full pl-12 pr-5 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
                  placeholder="nombreusuario"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase ml-1">{t('professional_bio')}</label>
              <div className="relative">
                <FileText className="absolute left-4 top-4 text-slate-300" size={18} />
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={3}
                  className="w-full pl-12 pr-5 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all resize-none"
                  placeholder={user.isOrganization ? "Describe los objetivos de tu organización..." : "Cuéntanos algo sobre ti..."}
                />
              </div>
            </div>
          </div>

          {/* Tab Selection */}
          <div className="flex p-1.5 bg-slate-100 dark:bg-zinc-900 rounded-2xl border border-slate-200/50 dark:border-zinc-800/50">
            <button
              type="button"
              onClick={() => setActiveTab('professional')}
              className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'professional' ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-sm' : 'text-slate-400'}`}
            >
              {t('professional_data_tab')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('personal')}
              className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'personal' ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-sm' : 'text-slate-400'}`}
            >
              {t('personal_data_tab')}
            </button>
          </div>

          <div className="space-y-6">
            {activeTab === 'personal' ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-300">
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
                  {!user.isOrganization && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase ml-1">{t('last_name_label')}</label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full px-5 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
                      />
                    </div>
                  )}
                </div>

                {!user.isOrganization && (
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
                )}

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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase ml-1">País</label>
                    <select
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value, region: '' })}
                      className="w-full px-5 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all appearance-none"
                    >
                      <option value="">Selecciona...</option>
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase ml-1">Región</label>
                    <select
                      value={formData.region}
                      onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                      className="w-full px-5 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all appearance-none"
                      disabled={!formData.country}
                    >
                      <option value="">Selecciona...</option>
                      {formData.country && COUNTRIES_DATA[formData.country]?.map((r: string) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
                {!user.isOrganization ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase ml-1">Categoría profesional</label>
                        <select
                          value={formData.jobCategory}
                          onChange={(e) => setFormData({ ...formData, jobCategory: e.target.value })}
                          className="w-full px-5 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all appearance-none"
                        >
                          <option value="">Selecciona...</option>
                          {JOB_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                          <option value="Otro">Otro</option>
                        </select>

                        {formData.jobCategory === 'Otro' && (
                          <div className="mt-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                            <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase ml-1">Especifica tu categoría</label>
                            <input
                              type="text"
                              value={formData.customJobCategory}
                              onChange={(e) => setFormData({ ...formData, customJobCategory: e.target.value })}
                              className="w-full px-5 py-3 bg-blue-50/30 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
                              placeholder="Ej. Consultor, Auditor..."
                            />
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase ml-1">Tipo de administración</label>
                        <select
                          value={formData.administrationType}
                          onChange={(e) => setFormData({ ...formData, administrationType: e.target.value })}
                          className="w-full px-5 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all appearance-none"
                        >
                          <option value="">Selecciona...</option>
                          {ADMIN_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                          <option value="Otra">Otra</option>
                        </select>
                      </div>
                    </div>

                    {formData.administrationType === 'Otra' && (
                      <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase ml-1">Especifica el tipo de administración</label>
                        <input
                          type="text"
                          value={formData.customAdministrationType}
                          onChange={(e) => setFormData({ ...formData, customAdministrationType: e.target.value })}
                          className="w-full px-5 py-3 bg-blue-50/30 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
                          placeholder="Ej. Ayuntamiento de Madrid, Institución Educativa..."
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase ml-1">Especialización / Puesto</label>
                        <div className="relative">
                          <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                          <input
                            type="text"
                            value={formData.position}
                            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                            className="w-full pl-12 pr-5 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
                            placeholder="Ej. Responsable de Innovación"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase ml-1">Nombre de la organización</label>
                        <div className="relative">
                          <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                          <input
                            type="text"
                            value={formData.department}
                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                            className="w-full pl-12 pr-5 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
                            placeholder="Ej. Ayuntamiento de Madrid"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase ml-1">Nombre de la organización</label>
                      <input
                        type="text"
                        value={formData.organizationName}
                        onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                        className="w-full px-5 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase ml-1">Objetivo organizacional</label>
                      <div className="relative">
                        <FileText className="absolute left-4 top-4 text-slate-300" size={18} />
                        <textarea
                          value={formData.organizationObjective}
                          onChange={(e) => setFormData({ ...formData, organizationObjective: e.target.value })}
                          rows={4}
                          className="w-full pl-12 pr-5 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all resize-none"
                          placeholder="Objetivos de la organización..."
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="p-8 bg-white dark:bg-[#0a0a0a] border-t border-slate-50 dark:border-zinc-900 flex space-x-3 shrink-0">
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


const AccessibilityModal: React.FC<{
  t: any,
  onClose: () => void,
  theme: 'light' | 'dark',
  onThemeChange: (theme: 'light' | 'dark') => void,
  language: Language,
  onLanguageChange: (lang: Language) => void,
  user: User,
  onUpdateUser: (user: User) => void
}> = ({ t, onClose, theme, onThemeChange, language, onLanguageChange, user, onUpdateUser }) => {
  useScrollLock();
  const [view, setView] = useState<'menu' | 'theme' | 'language' | 'chats' | 'chat_theme' | 'chat_config'>('menu');

  const MenuOption = ({ label, icon: Icon, onClick, value }: { label: string, icon: any, onClick: () => void, value?: string }) => (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all rounded-2xl border border-slate-100 dark:border-zinc-800"
    >
      <div className="flex items-center space-x-4">
        <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 text-slate-600 dark:text-gray-400 border border-slate-100 dark:border-zinc-700">
          <Icon size={20} />
        </div>
        <div className="text-left">
          <span className="block font-bold text-slate-900 dark:text-white">{label}</span>
          {value && <span className="text-xs text-slate-500 font-medium">{value}</span>}
        </div>
      </div>
      <ChevronRight size={18} className="text-slate-300 dark:text-zinc-600" />
    </button>
  );

  const Header = ({ title, onBack }: { title: string, onBack?: () => void }) => (
    <div className="px-6 py-5 border-b border-gray-100 dark:border-zinc-900 flex justify-between items-center bg-white dark:bg-[#0a0a0a]">
      <div className="flex items-center space-x-3">
        {onBack && (
          <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft size={20} />
          </button>
        )}
        <div className="p-2 bg-blue-50 dark:bg-zinc-800 rounded-xl text-blue-600">
          {(view === 'chats' || view === 'chat_theme' || view === 'chat_config') ? <MessageCircle size={20} /> : view === 'theme' ? <Sun size={20} /> : view === 'language' ? <Globe size={20} /> : <Wand2 size={20} />}
        </div>
        <h3 className="text-xl font-black text-slate-900 dark:text-white">{title}</h3>
      </div>
      <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
      <div className="bg-white dark:bg-[#0a0a0a] w-full max-w-lg rounded-[2.5rem] overflow-hidden animate-in zoom-in-95 duration-300 border border-white dark:border-zinc-800 shadow-xl flex flex-col max-h-[85vh]" onClick={(e) => e.stopPropagation()}>

        {view === 'menu' && (
          <>
            <Header title={t('accessibility')} />
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide space-y-3">
              <MenuOption
                label={t('select_theme')}
                value={theme === 'light' ? t('theme_light') : t('theme_dark')}
                icon={theme === 'light' ? Sun : Moon}
                onClick={() => setView('theme')}
              />
              <MenuOption
                label={t('select_language')}
                value={language === 'es' ? '🇪🇸' : '🇺🇸'}
                icon={Globe}
                onClick={() => setView('language')}
              />
              <MenuOption
                label={t('chats')}
                value={t('chat_settings_desc')}
                icon={MessageCircle}
                onClick={() => setView('chats')}
              />
            </div>
          </>
        )}

        {view === 'theme' && (
          <>
            <Header title={t('select_theme')} onBack={() => setView('menu')} />
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide space-y-3">
              <button
                onClick={() => onThemeChange('light')}
                className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center space-x-4 ${theme === 'light' ? 'border-slate-900 bg-slate-50 dark:border-white dark:bg-zinc-900' : 'border-transparent hover:bg-slate-50 dark:hover:bg-zinc-900'}`}
              >
                <div className={`p-2.5 rounded-xl ${theme === 'light' ? 'bg-white shadow-sm' : 'bg-slate-100'}`}>
                  <Sun size={20} className="text-orange-500" />
                </div>
                <div className="text-left flex-1">
                  <span className="block font-bold text-slate-900 dark:text-white">{t('theme_light')}</span>
                </div>
                {theme === 'light' && <CheckCircle2 size={24} className="text-slate-900 dark:text-white" />}
              </button>

              <button
                onClick={() => onThemeChange('dark')}
                className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center space-x-4 ${theme === 'dark' ? 'border-slate-900 bg-slate-50 dark:border-white dark:bg-zinc-900' : 'border-transparent hover:bg-slate-50 dark:hover:bg-zinc-900'}`}
              >
                <div className={`p-2.5 rounded-xl ${theme === 'dark' ? 'bg-zinc-800 shadow-sm' : 'bg-slate-100'}`}>
                  <Moon size={20} className="text-indigo-500" />
                </div>
                <div className="text-left flex-1">
                  <span className="block font-bold text-slate-900 dark:text-white">{t('theme_dark')}</span>
                </div>
                {theme === 'dark' && <CheckCircle2 size={24} className="text-slate-900 dark:text-white" />}
              </button>
            </div>
          </>
        )}

        {view === 'language' && (
          <>
            <Header title={t('select_language')} onBack={() => setView('menu')} />
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide space-y-3">
              <button
                onClick={() => onLanguageChange('es')}
                className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center space-x-4 ${language === 'es' ? 'border-slate-900 bg-slate-50 dark:border-white dark:bg-zinc-900' : 'border-transparent hover:bg-slate-50 dark:hover:bg-zinc-900'}`}
              >
                <div className="text-2xl">🇪🇸</div>
                <div className="text-left flex-1">
                  <span className="block font-bold text-slate-900 dark:text-white">Español</span>
                </div>
                {language === 'es' && <CheckCircle2 size={24} className="text-slate-900 dark:text-white" />}
              </button>

              <button
                onClick={() => onLanguageChange('en')}
                className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center space-x-4 ${language === 'en' ? 'border-slate-900 bg-slate-50 dark:border-white dark:bg-zinc-900' : 'border-transparent hover:bg-slate-50 dark:hover:bg-zinc-900'}`}
              >
                <div className="text-2xl">🇺🇸</div>
                <div className="text-left flex-1">
                  <span className="block font-bold text-slate-900 dark:text-white">English</span>
                </div>
                {language === 'en' && <CheckCircle2 size={24} className="text-slate-900 dark:text-white" />}
              </button>
            </div>
          </>
        )}

        {view === 'chats' && (
          <>
            <Header title={t('chats')} onBack={() => setView('menu')} />
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide space-y-3">
              <MenuOption
                label={t('chat_theme') || "Tema"}
                value=""
                icon={Wand2}
                onClick={() => setView('chat_theme')}
              />
              <div className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all rounded-2xl border border-slate-100 dark:border-zinc-800">
                <div className="flex items-center space-x-4">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 text-slate-600 dark:text-gray-400 border border-slate-100 dark:border-zinc-700">
                    <Eye size={20} />
                  </div>
                  <div className="text-left">
                    <span className="block font-bold text-slate-900 dark:text-white">{t('read_receipts') || "Confirmación de lectura"}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const current = user.chatSettings?.readReceipts !== false;
                    onUpdateUser({
                      ...user,
                      chatSettings: {
                        ...user.chatSettings,
                        readReceipts: !current
                      }
                    });
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${user.chatSettings?.readReceipts !== false ? 'bg-blue-600' : 'bg-slate-200 dark:bg-zinc-700'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${user.chatSettings?.readReceipts !== false ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          </>
        )}

        {view === 'chat_theme' && (
          <>
            <Header title={t('chat_theme') || "Tema"} onBack={() => setView('chats')} />
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              <ChatSettingsForm
                user={user}
                t={t}
                onSave={onUpdateUser}
                onClose={() => setView('chats')} // Not used in embedded mode logic effectively but kept for compatibility
                embedded={true}
                mode="theme"
                onReset={() => {
                  // Reset logic handled in ChatSettingsForm
                }}
              />
            </div>
          </>
        )}

        {view === 'chat_config' && (
          <>
            <Header title={t('chat_config') || "Configuración de chat"} onBack={() => setView('chats')} />
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              <ChatSettingsForm
                user={user}
                t={t}
                onSave={onUpdateUser}
                onClose={() => setView('chats')}
                embedded={true}
                mode="config"
              />
            </div>
          </>
        )}

      </div>
    </div>
  );
};


const PrivacySecurityModal: React.FC<{
  t: any,
  user: User,
  onClose: () => void
}> = ({ t, user, onClose }) => {
  useScrollLock();
  const [view, setView] = useState<'menu' | 'change_password' | 'forgot_password'>('menu');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!passwords.current) {
      setError(t('enter_current_password'));
      return;
    }

    if (passwords.new.length < 8) {
      setError(t('password_min_length'));
      return;
    }

    if (passwords.new !== passwords.confirm) {
      setError(t('passwords_dont_match'));
      return;
    }

    setLoading(true);

    try {
      // Re-autenticar al usuario con la contraseña actual
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: passwords.current,
      });

      if (signInError) throw signInError;

      // Actualizar a la nueva contraseña
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwords.new
      });

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message === 'Invalid login credentials' ? t('enter_current_password') : err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email!, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const Header = ({ title, onBack }: { title: string, onBack?: () => void }) => (
    <div className="px-6 py-5 border-b border-gray-100 dark:border-zinc-900 flex justify-between items-center bg-white dark:bg-[#0a0a0a]">
      <div className="flex items-center space-x-3">
        {onBack && (
          <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft size={20} />
          </button>
        )}
        <div className="p-2 bg-blue-50 dark:bg-zinc-800 rounded-xl text-blue-600">
          <Lock size={20} />
        </div>
        <h3 className="text-xl font-black text-slate-900 dark:text-white">{title}</h3>
      </div>
      <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
      <div className="bg-white dark:bg-[#0a0a0a] w-full max-w-lg rounded-[2.5rem] overflow-hidden animate-in zoom-in-95 duration-300 border border-white dark:border-zinc-800 shadow-xl flex flex-col max-h-[85vh]" onClick={(e) => e.stopPropagation()}>

        {view === 'menu' && (
          <>
            <Header title={t('privacy_security')} />
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide space-y-3">
              <button
                onClick={() => setView('change_password')}
                className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all rounded-2xl border border-slate-100 dark:border-zinc-800"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 text-slate-600 dark:text-gray-400 border border-slate-100 dark:border-zinc-700">
                    <RefreshCw size={20} />
                  </div>
                  <div className="text-left">
                    <span className="block font-bold text-slate-900 dark:text-white">{t('change_password_label') || "Cambiar contraseña"}</span>
                    <span className="text-xs text-slate-500 font-medium">{t('password_change_hint')}</span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-300 dark:text-zinc-600" />
              </button>

              <button
                onClick={() => setView('forgot_password')}
                className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all rounded-2xl border border-slate-100 dark:border-zinc-800"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 text-slate-600 dark:text-gray-400 border border-slate-100 dark:border-zinc-700">
                    <Mail size={20} />
                  </div>
                  <div className="text-left">
                    <span className="block font-bold text-slate-900 dark:text-white">{t('forgot_password_label')}</span>
                    <span className="text-xs text-slate-500 font-medium">{t('forgot_password_desc')}</span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-300 dark:text-zinc-600" />
              </button>
            </div>
          </>
        )}

        {view === 'change_password' && (
          <>
            <Header title={t('new_password_label')} onBack={() => setView('menu')} />
            <form onSubmit={handlePasswordUpdate} className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
              {success ? (
                <div className="text-center space-y-4 py-8 animate-in zoom-in-95 duration-500">
                  <div className="relative inline-flex">
                    <div className="p-6 bg-green-50 dark:bg-green-900/20 text-green-500 rounded-[2.5rem] flex items-center justify-center">
                      <CheckCircle2 size={48} />
                    </div>
                  </div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white">{t('password_updated_success')}</h2>
                </div>
              ) : (
                <>
                  {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-2xl border border-red-100 dark:border-red-900/30 flex items-center space-x-3">
                      <AlertCircle size={18} />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase ml-1">{t('current_password_label')}</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input
                          type="password"
                          value={passwords.current}
                          onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                          className="w-full pl-12 pr-5 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
                          placeholder={t('current_password_placeholder')}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase ml-1">{t('new_password_label')}</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input
                          type="password"
                          value={passwords.new}
                          onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                          className="w-full pl-12 pr-5 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
                          placeholder={t('new_password_placeholder')}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase ml-1">{t('confirm_new_password_label')}</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input
                          type="password"
                          value={passwords.confirm}
                          onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                          className="w-full pl-12 pr-5 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
                          placeholder={t('confirm_password_placeholder')}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setView('menu')}
                      className="flex-1 py-4 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-gray-400 rounded-2xl font-black text-sm hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all"
                    >
                      {t('cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !passwords.new || !passwords.confirm}
                      className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all flex items-center justify-center space-x-2 transform active:scale-95 disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="animate-spin" size={20} /> : <><Save size={18} /><span>{t('save_changes')}</span></>}
                    </button>
                  </div>
                </>
              )}
            </form>
          </>
        )}

        {view === 'forgot_password' && (
          <>
            <Header title={t('forgot_password_label')} onBack={() => { setView('menu'); setSuccess(false); setError(null); }} />
            <div className="flex-1 p-8 flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-300">
              {success ? (
                <div className="text-center space-y-4 py-8 animate-in zoom-in-95 duration-500">
                  <div className="relative inline-flex">
                    <div className="p-6 bg-green-50 dark:bg-green-900/20 text-green-500 rounded-[2.5rem] flex items-center justify-center">
                      <CheckCircle2 size={48} />
                    </div>
                  </div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white">{t('reset_link_sent')}</h2>
                  <p className="text-sm text-slate-500 font-medium max-w-xs mx-auto">{t('forgot_password_desc')}</p>
                </div>
              ) : (
                <div className="text-center space-y-6">
                  <div className="mx-auto w-20 h-20 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-[2.5rem] flex items-center justify-center">
                    <Mail size={40} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">{t('send_reset_link')}</h3>
                    <p className="text-sm text-slate-500 dark:text-gray-400 font-medium max-w-xs mx-auto">
                      {t('forgot_password_desc')}
                    </p>
                  </div>

                  {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-2xl border border-red-100 dark:border-red-900/30 flex items-center space-x-3">
                      <AlertCircle size={18} />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="flex flex-col w-full space-y-3">
                    <button
                      onClick={handleForgotPassword}
                      disabled={loading}
                      className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all flex items-center justify-center space-x-2 transform active:scale-95 disabled:opacity-50 shadow-lg shadow-blue-500/20"
                    >
                      {loading ? <Loader2 className="animate-spin" size={20} /> : <><RefreshCw size={18} /><span>{t('send_reset_link')}</span></>}
                    </button>
                    <button
                      onClick={() => setView('menu')}
                      className="w-full py-4 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-gray-400 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all"
                    >
                      {t('cancel')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};


export const SettingsView: React.FC<SettingsViewProps> = ({ user, onUpdateUser, onLogout, onViewChange, theme, onThemeChange, language, onLanguageChange }) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showAccessibility, setShowAccessibility] = useState(false);
  const [showPersonalData, setShowPersonalData] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showPrivacySecurity, setShowPrivacySecurity] = useState(false);
  const [showBadges, setShowBadges] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showChatSettings, setShowChatSettings] = useState(false);
  const [showHelpChat, setShowHelpChat] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showInterests, setShowInterests] = useState(false);
  const t = useTranslation(language);

  useScrollLock(
    showPrivacyPolicy ||
    showAbout ||
    showPersonalData ||
    showBadges ||
    showNotifications ||
    showChatSettings ||
    showLogoutConfirm ||
    showInterests
  );
  const location = useLocation();

  useEffect(() => {
    if (location.state?.openPersonalData) {
      setShowPersonalData(true);
    }
  }, [location.state]);

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
        <SettingItem icon={CustomBadgeIcon} label={t('badges')} onClick={() => setShowBadges(true)} />
        <SettingItem icon={Heart} label={t('interests')} onClick={() => setShowInterests(true)} />
        <SettingItem icon={Wand2} label={t('accessibility')} onClick={() => setShowAccessibility(true)} />
        <SettingItem icon={Bell} label={t('notifications')} onClick={() => setShowNotifications(true)} />

        <SettingItem icon={Lock} label={t('privacy_security')} onClick={() => setShowPrivacySecurity(true)} />
        <SettingItem
          icon={Megaphone}
          label={t('news_updates')}
          onClick={() => { /* Proximamente: Novedades */ }}
        />
      </div>

      {showChatSettings && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowChatSettings(false)}>
          <div className="bg-white dark:bg-[#0a0a0a] w-full max-w-lg rounded-[2.5rem] overflow-hidden animate-in zoom-in-95 duration-300 border border-white dark:border-zinc-800 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <ChatSettingsForm user={user} t={t} onSave={(updated) => { onUpdateUser(updated); setShowChatSettings(false); }} onClose={() => setShowChatSettings(false)} />
          </div>
        </div>,
        document.body
      )}

      {showBadges && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowBadges(false)}>
          <div className="bg-white dark:bg-[#0a0a0a] w-full max-w-2xl rounded-[2.5rem] overflow-hidden animate-in zoom-in-95 duration-300 border border-white dark:border-zinc-800 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <BadgesList user={user} t={t} onClose={() => setShowBadges(false)} />
          </div>
        </div>,
        document.body
      )}

      {showNotifications && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowNotifications(false)}>
          <div className="bg-white dark:bg-[#0a0a0a] w-full max-w-lg rounded-[2.5rem] overflow-hidden animate-in zoom-in-95 duration-300 border border-white dark:border-zinc-800 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <NotificationSettingsForm user={user} t={t} onSave={(updated) => { onUpdateUser(updated); setShowNotifications(false); }} onClose={() => setShowNotifications(false)} />
          </div>
        </div>,
        document.body
      )}

      {showPrivacySecurity && createPortal(
        <PrivacySecurityModal
          t={t}
          user={user}
          onClose={() => setShowPrivacySecurity(false)}
        />,
        document.body
      )}

      <div className="border border-slate-100 dark:border-zinc-800 rounded-[2rem] overflow-hidden">
        <SettingItem icon={Shield} label={t('help_center')} onClick={() => setShowHelpChat(true)} />
        <SettingItem icon={Eye} label={t('privacy_policy')} onClick={() => setShowPrivacyPolicy(true)} />
        <SettingItem icon={Info} label={t('about_us')} onClick={() => setShowAbout(true)} />
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

      {showPersonalData && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowPersonalData(false)}>
          <div className="bg-white dark:bg-[#0a0a0a] w-full max-w-lg rounded-[2.5rem] overflow-hidden animate-in zoom-in-95 duration-300 border border-white dark:border-zinc-800 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <PersonalDataForm user={user} t={t} onSave={(updated) => { onUpdateUser(updated); setShowPersonalData(false); }} onClose={() => setShowPersonalData(false)} />
          </div>
        </div>,
        document.body
      )}

      {showPrivacyPolicy && createPortal(
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
        </div>,
        document.body
      )}

      {showAbout && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowAbout(false)}>
          <div className="bg-white dark:bg-[#0a0a0a] w-full max-w-lg rounded-[2.5rem] overflow-hidden animate-in zoom-in-95 duration-300 border border-white dark:border-zinc-800 flex flex-col max-h-[85vh] shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="px-8 py-6 border-b border-gray-100 dark:border-zinc-900 flex justify-between items-center bg-white dark:bg-[#0a0a0a]">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 dark:bg-zinc-800 rounded-xl text-blue-600">
                  <Info size={20} />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">{t('about_us')}</h3>
              </div>
              <button onClick={() => setShowAbout(false)} className="p-2 text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 scrollbar-hide">
              <AboutContent t={t} />
            </div>
            <div className="p-6 bg-slate-50 dark:bg-zinc-900 flex justify-center">
              <button
                onClick={() => setShowAbout(false)}
                className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showAccessibility && createPortal(
        <AccessibilityModal
          t={t}
          onClose={() => setShowAccessibility(false)}
          theme={theme}
          onThemeChange={onThemeChange}
          language={language}
          onLanguageChange={onLanguageChange}
          user={user}
          onUpdateUser={onUpdateUser}
        />,
        document.body
      )}

      {showLogoutConfirm && createPortal(
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
        </div>,
        document.body
      )}

      {showHelpChat && createPortal(
        <HelpChatBot
          userName={user.name}
          onClose={() => setShowHelpChat(false)}
        />,
        document.body
      )}

      {showInterests && createPortal(
        <PreferencesModal
          user={user}
          onClose={() => setShowInterests(false)}
          onSave={(updatedUser) => {
            onUpdateUser(updatedUser);
            setShowInterests(false);
          }}
        />,
        document.body
      )}
    </div>
  );
};





