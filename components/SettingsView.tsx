
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { useScrollLock } from '../hooks/useScrollLock';
import { Shield, Bell, Eye, LogOut, ChevronRight, ChevronDown, Wand2, Megaphone, Lock, ArrowLeft, X, Sun, Moon, Check, UserCircle, Save, Calendar, Mail, AtSign, FileText, AlertCircle, CheckCircle2, Loader2, Medal, GraduationCap, Star, Trophy, MessageCircle, RefreshCw, Info, Heart, Globe, Settings, Briefcase, Building, Award, Mic, Users, Sparkles, BadgeCheck, Target, LayoutDashboard } from 'lucide-react';
import { User, BADGE_CATALOG, Badge } from '../types';
import { COUNTRIES, COUNTRIES_DATA } from '../constants';
import { supabase } from '../supabaseClient';
import { PreferencesModal } from './PreferencesModal';
import { Language, useTranslation } from '../utils/translations';
import { PersonalDataModal } from './PersonalDataModal';


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
  <div className="text-sm text-slate-600 dark:text-gray-400 leading-relaxed">

    {/* Hero */}
    <div className="flex flex-col items-center text-center pb-7 mb-7 border-b border-slate-100 dark:border-zinc-800">
      <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mb-4 shadow-sm overflow-hidden p-2">
        <img src="/img/novagob.brand_isotipo_blanco.svg" className="w-full h-full object-contain" alt="NovaGob" />
      </div>
      <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Red Social NovaGob</h2>
      <span className="mt-3 inline-flex items-center px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-100 dark:border-blue-800/50">
        v1.0
      </span>
    </div>

    {/* Misión + Visión */}
    <div className="space-y-3 mb-7">
      <div className="flex gap-3 p-4 bg-blue-50/60 dark:bg-blue-900/10 rounded-2xl border border-blue-100/80 dark:border-blue-800/20">
        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
          <Target size={15} className="text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-1">Misión</p>
          <p className="text-xs text-slate-600 dark:text-gray-400 leading-relaxed">Conectar a los profesionales del sector público para compartir conocimiento, experiencias y buenas prácticas, fomentando la colaboración y la innovación abierta.</p>
        </div>
      </div>

      <div className="flex gap-3 p-4 bg-purple-50/60 dark:bg-purple-900/10 rounded-2xl border border-purple-100/80 dark:border-purple-800/20">
        <div className="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
          <Globe size={15} className="text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400 mb-1">Visión</p>
          <p className="text-xs text-slate-600 dark:text-gray-400 leading-relaxed">Ser la plataforma de referencia para la transformación de la administración pública en Iberoamérica, impulsando una gestión más eficiente, transparente y cercana a la ciudadanía.</p>
        </div>
      </div>
    </div>

    {/* Valores */}
    <div className="mb-7">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-gray-500 mb-3">Valores</p>
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'Innovación pública', icon: Sparkles },
          { label: 'Colaboración', icon: Users },
          { label: 'Transparencia', icon: Eye },
          { label: 'Ética pública', icon: Shield },
          { label: 'Ciudadanía', icon: Heart },
        ].map(({ label, icon: Icon }) => (
          <span key={label} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/15 border-blue-100 dark:border-blue-800/30">
            <Icon size={10} />
            {label}
          </span>
        ))}
      </div>
    </div>

    {/* Footer */}
    <div className="pt-5 border-t border-slate-100 dark:border-zinc-800 text-center">
      <p className="text-[11px] text-slate-400 dark:text-gray-500">© {new Date().getFullYear()} NovaGob · Todos los derechos reservados</p>
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



const BADGE_IMAGES: Record<string, string> = {
  'congress_2021': '/img/insignias/Congreso_2024.png',
  'congress_2021_speaker': '/img/insignias/Congreso_2024.png',
  'congress_2022': '/img/insignias/Congreso_2024.png',
  'congress_2022_speaker': '/img/insignias/Congreso_2024.png',
  'congress_2023': '/img/insignias/Congreso_2024.png',
  'congress_2023_speaker': '/img/insignias/Congreso_2024.png',
  'congress_2024': '/img/insignias/Congreso_2024.png',
  'congress_2024_speaker': '/img/insignias/Congreso_2024.png',
  'congress_2025': '/img/insignias/Congreso_2025.png',
  'congress_2025_speaker': '/img/insignias/Congreso_2025.png',
  'event_burocracia': '/img/insignias/Burocrac_IA.png',
  'event_burocracia_speaker': '/img/insignias/Burocrac_IA.png',
  'event_innovalencia': '/img/insignias/InnoValencia.png',
  'event_innovalencia_speaker': '/img/insignias/InnoValencia.png',
  'event_innovamos': '/img/insignias/InnovamosLab.png',
  'event_innovamos_speaker': '/img/insignias/InnovamosLab.png',
  'award_innovator': '/img/insignias/Excelencia_2025.png',
  'award_woman': '/img/insignias/Excelencia_2025.png',
  'award_talent': '/img/insignias/Excelencia_2025.png',
  'award_excellence': '/img/insignias/Excelencia_2025.png',
  'award_special': '/img/insignias/Excelencia_2025.png',
  'award_creativity': '/img/insignias/Excelencia_2025.png',
  'award_transformative_project': '/img/insignias/Excelencia_2025.png',
  'award_efficiency': '/img/insignias/Excelencia_2025.png',
  'award_digital_transformation': '/img/insignias/Excelencia_2025.png',
  'award_people_management': '/img/insignias/Excelencia_2025.png',
  'award_good_government': '/img/insignias/Excelencia_2025.png',
  'ranking_top1': '/img/insignias/top-1.png',
  'ranking_top2': '/img/insignias/top-2.png',
  'ranking_top3': '/img/insignias/top-3.png',
};

const getBadgeImage = (b: any) => {
  // Priorizar imagen guardada en Supabase por el admin
  if (b.image_url) return b.image_url;
  const id = (b.id || '').toLowerCase();
  const label = (b.label || '').toLowerCase();
  if (BADGE_IMAGES[id]) return BADGE_IMAGES[id];
  if (id.includes('innovamos') || label.includes('innovamos')) return '/img/insignias/InnovamosLab.png';
  if (id.includes('innovalencia') || label.includes('innovalencia')) return '/img/insignias/InnoValencia.png';
  if (id.includes('burocrac') || label.includes('burocrac')) return '/img/insignias/Burocrac_IA.png';
  if (id.includes('congres') || label.includes('congres')) {
    if (id.includes('2025') || label.includes('2025')) return '/img/insignias/Congreso_2025.png';
    return '/img/insignias/Congreso_2024.png';
  }
  if (b.category === 'premios_excelencia' || id.startsWith('award_') || label.includes('excelencia')) return '/img/insignias/Excelencia_2025.png';
  return '/img/insignias/insignia-degradado.png';
};

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
          .select('id, label, nova_reward, category, image_url')
          .order('label');

        const merged = [...BADGE_CATALOG];
        if (dbBadges && dbBadges.length > 0) {
          dbBadges.forEach(dbB => {
            const badgeIdLower = dbB.id.toLowerCase();
            const existingIdx = merged.findIndex(m => m.id.toLowerCase() === badgeIdLower);

            if (existingIdx !== -1) {
              merged[existingIdx] = {
                ...merged[existingIdx],
                label: dbB.label || merged[existingIdx].label,
                nova_reward: dbB.nova_reward ?? merged[existingIdx].nova_reward,
                image_url: dbB.image_url || undefined,
              };
            } else {
              merged.push({
                id: dbB.id,
                label: dbB.label || dbB.id,
                color: 'bg-slate-100 text-slate-500 border-slate-200',
                category: (dbB.category || 'congreso') as Badge['category'],
                nova_reward: dbB.nova_reward,
                image_url: dbB.image_url || undefined,
              } as Badge);
            }
          });
        }
        setAllBadges(merged);

        // Fetch user's unlocked badges from 'user_badges' table
        const { data: unlocked } = await supabase
          .from('user_badges')
          .select('badge_id')
          .eq('user_id', user.id);

        if (unlocked) {
          setUserBadgeIds(new Set(unlocked.map(ub => ub.badge_id.toLowerCase())));
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
    { id: 'congresos', label: 'Congreso', icon: Calendar },
    { id: 'premios_excelencia', label: 'Premios', icon: Medal },
    { id: 'eventos', label: 'Eventos', icon: GraduationCap },
    { id: 'ranking', label: 'Ranking', icon: Trophy }
  ];

  return (
    <div className="flex flex-col h-full max-h-[85vh]">
      <div className="p-8 border-b border-slate-50 dark:border-zinc-900 flex justify-between items-center bg-white dark:bg-[#0a0a0a]">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-amber-600">
            <Medal size={24} />
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white">{t('badges_title')}</h3>
        </div>
        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 scrollbar-hide bg-slate-50 dark:bg-black/20 space-y-12">
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
          const catBadges = allBadges.filter(b => {
            const label = (b.label || '').toLowerCase();
            const id = (b.id || '').toLowerCase();
            let bCat = b.category?.toLowerCase();

            if (!bCat) {
              if (id.startsWith('award_') || label.includes('excelencia') || label.includes('premio')) bCat = 'premios_excelencia';
              else if (label.includes('congreso')) bCat = 'congresos';
              else if (label.includes('evento')) bCat = 'eventos';
              else if (id.startsWith('ranking_')) bCat = 'ranking';
              else bCat = 'premios_excelencia'; // Default to premios for now
            }
            
            // Normalizar singular → plural y variantes
            if (bCat === 'congreso') bCat = 'congresos';
            if (bCat === 'premio' || bCat === 'premios') bCat = 'premios_excelencia';
            if (bCat === 'evento') bCat = 'eventos';
            if (bCat === 'formacion') bCat = 'eventos';
            if (bCat === 'general' || bCat === 'novas') bCat = 'premios_excelencia';

            return bCat === cat.id.toLowerCase();
          });
          if (catBadges.length === 0) return null;

          return (
            <div key={cat.id} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center space-x-3 text-slate-400 dark:text-zinc-500 uppercase tracking-[0.2em] text-[11px] font-black pl-1">
                <span>{cat.label}</span>
              </div>
              <div className="grid grid-cols-3 gap-3 sm:gap-6">
                {catBadges.map(b => {
                  const label = (b.label || '').toLowerCase();
                  const id = (b.id || '').toLowerCase();
                  let bCat = b.category?.toLowerCase();

                  if (!bCat) {
                    if (id.startsWith('award_') || label.includes('excelencia')) bCat = 'premios_excelencia';
                    else if (label.includes('congreso')) bCat = 'congresos';
                    else if (label.includes('premio')) bCat = 'premios';
                    else if (label.includes('evento')) bCat = 'eventos';
                    else if (label.includes('formación') || label.includes('curso')) bCat = 'formacion';
                    else if (id.startsWith('ranking_')) bCat = 'ranking';
                    else bCat = 'general';
                  }

                  const badge = { ...b, category: bCat };
                  const isUnlocked = userBadgeIds.has(badge.id.toLowerCase());
                  const isSpeaker = (badge.label || '').toLowerCase().includes('ponente');
                  const isAward = badge.category === 'premios' || badge.category === 'premios_excelencia';
                  const isNovas = badge.category?.toLowerCase() === 'novas';
                  const isVerified = badge.id === 'verified';
                  const isPioneer = badge.id === 'pioneer';
                  const isTraining = badge.category?.toLowerCase() === 'formacion';
                  const isEvent = badge.category?.toLowerCase() === 'eventos';
                  const isTopRanking = ['ranking_top1', 'ranking_top2', 'ranking_top3'].includes((badge.id || '').toLowerCase());

                  // Same gradient logic as ProfileView for consistency
                  let gradient = 'from-blue-500 to-indigo-600';
                  let CustomBadgeIcon = Award;

                  if (isSpeaker) {
                    gradient = 'from-amber-400 via-orange-500 to-amber-600';
                    CustomBadgeIcon = Mic;
                  }
                  else if (badge.label.toLowerCase().includes('asistente')) {
                    gradient = 'from-slate-400 to-slate-600';
                    CustomBadgeIcon = Users;
                  }
                  else if (isAward) {
                    gradient = 'from-yellow-400 via-amber-500 to-yellow-600';
                    CustomBadgeIcon = Trophy;
                  }
                  else if (isNovas) {
                    gradient = 'from-purple-500 via-pink-500 to-rose-500';
                    CustomBadgeIcon = Sparkles;
                  }
                  else if (isVerified) {
                    gradient = 'from-cyan-400 to-blue-500';
                    CustomBadgeIcon = BadgeCheck;
                  }
                  else if (isPioneer) {
                    gradient = 'from-amber-300 to-orange-500';
                    CustomBadgeIcon = Star;
                  }
                  else if (isTraining) {
                    gradient = 'from-indigo-500 to-purple-600';
                    CustomBadgeIcon = Target;
                  }
                  else if (isEvent) {
                    gradient = 'from-emerald-400 to-teal-600';
                    CustomBadgeIcon = Calendar;
                  }

                  const frameGradient = isUnlocked ? 'from-purple-500 via-indigo-500 to-purple-600' : gradient;

                  return (
                    <div key={badge.id} className={`group relative aspect-square rounded-full transition-all duration-500 perspective-1000 ${isUnlocked ? 'cursor-pointer' : 'grayscale opacity-60'}`}>
                      <div className="w-full h-full relative preserve-3d group-hover:rotate-y-180 transition-transform duration-700 will-change-transform transform-gpu">
                        {/* Front Side */}
                        <div className="absolute inset-0 bg-white dark:bg-[#0a0a0a] rounded-full flex items-center justify-center overflow-hidden backface-hidden border-2 border-slate-100 dark:border-zinc-800">
                          <img src={getBadgeImage(badge)} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={badge.label} />

                          {/* Overlay: Legible Title */}
                          <div className={`absolute inset-0 flex items-center justify-center p-4 rounded-full ${isTopRanking ? '' : 'bg-slate-900/25 backdrop-blur-[1px] ring-inset ring-1 ring-white/10'}`}>
                            <h4 className="text-[8px] sm:text-xs md:text-sm font-black text-white leading-tight text-center uppercase tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] px-1">
                              {badge.label}
                            </h4>
                          </div>

                          {/* Shine Effect */}
                          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>
                        </div>

                        {/* Back Side */}
                        <div className="absolute inset-0 bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-md rounded-full flex flex-col items-center justify-center overflow-hidden backface-hidden rotate-y-180 border-2 border-blue-500 dark:border-blue-400">
                          <div className={`absolute inset-0 bg-gradient-to-br ${frameGradient} opacity-20`}></div>
                          <div className="relative z-10 flex flex-col items-center justify-center">
                            <img src="/img/novagob.brand_isotipo_black.svg" className="w-14 h-14 object-contain opacity-20 dark:invert mb-1" alt="NovaGob" />
                            {badge.nova_reward !== undefined && badge.nova_reward !== null && badge.nova_reward > 0 && (
                              <div className="flex items-baseline gap-1 mt-1">
                                <span className="text-base font-black text-blue-600 dark:text-blue-400 leading-none">{badge.nova_reward}</span>
                                <span className="text-base font-black text-slate-400 uppercase tracking-widest">novas</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
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
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

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
    setSaveStatus('saving');
    const { error } = await supabase.from('profiles').update({ chat_settings: settings }).eq('id', user.id);

    if (!error) {
      onSave({ ...user, chatSettings: settings });
      setSaveStatus('saved');
      setTimeout(() => {
        setSaveStatus('idle');
        onClose(); // Close the settings window after showing "Saved"
      }, 1000);
    } else {
      setSaveStatus('error');
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
            <h3 className="text-xl font-black text-slate-900 dark:text-white">{t('chats')}</h3>
            <div className="flex items-center space-x-2 h-4">
              {saveStatus === 'saving' && (
                <span className="flex items-center space-x-1 text-[10px] font-bold text-blue-500 animate-pulse">
                  <Loader2 size={10} className="animate-spin" />
                  <span>Guardando...</span>
                </span>
              )}
              {saveStatus === 'saved' && (
                <span className="flex items-center space-x-1 text-[10px] font-bold text-green-500 animate-in fade-in slide-in-from-bottom-1">
                  <Check size={10} />
                  <span>Cambios guardados</span>
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
        </div>
      )}

      <div className={`flex-1 min-h-0 ${embedded ? 'px-6 py-3 space-y-3 overflow-hidden' : 'space-y-8 p-8 overflow-y-auto'}`}>

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
          <div className={`${embedded ? 'pt-1' : 'pt-4'} ${mode === 'config' ? '' : 'border-t border-slate-50 dark:border-zinc-900'}`}>
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
          <div className={`${embedded ? 'p-3' : 'mt-8 p-4'} rounded-3xl border border-gray-100 dark:border-zinc-800`} style={{ backgroundColor: settings.backgroundColor }}>
            <p className="text-[10px] text-center text-slate-400 font-bold uppercase mb-2">VISTA PREVIA</p>
            <div className="space-y-2">
              <div className="flex justify-start">
                <div className="p-2 rounded-2xl rounded-tl-none max-w-[80%] text-xs font-medium" style={{ backgroundColor: settings.receiverColor, color: settings.receiverColor === '#27272a' ? 'white' : 'black' }}>
                  Hola, ¿qué tal todo?
                </div>
              </div>
              <div className="flex justify-end">
                <div className="p-2 rounded-2xl rounded-tr-none max-w-[80%] text-xs font-medium text-white" style={{ backgroundColor: settings.senderColor }}>
                  ¡Todo genial! Configurando mis chats 🎨
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Buttons — fixed footer, never scrolled */}
      <div className={`flex-shrink-0 ${embedded ? 'px-6 pb-5 pt-3' : 'pt-8 border-t border-slate-50 dark:border-zinc-900 bg-white dark:bg-[#0a0a0a] p-8'} flex items-center justify-center gap-3`}>
        {mode === 'theme' && onReset && (
          <button
            onClick={handleReset}
            disabled={isSaving}
            className={`flex-1 max-w-[45%] ${embedded ? 'py-2.5 text-xs' : 'py-4 text-sm'} bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-gray-400 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all`}
          >
            {t('reset') || "Restablecer"}
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`flex-1 max-w-[45%] ${embedded ? 'py-2.5 text-xs' : 'py-4 text-sm'} bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700 transition-all flex items-center justify-center space-x-2 disabled:opacity-50`}
        >
          {isSaving ? <Loader2 className="animate-spin" size={16} /> : <span>{t('save_changes')}</span>}
        </button>
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
    rewards_accepted: true,
    novas_earned: true,
    badges_earned: true,
    ranking_weekly: true,
    maintenance_notices: true,
    ...user.notificationSettings
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('saving');
    const { error } = await supabase.from('profiles').update({ notification_settings: settings }).eq('id', user.id);
    if (!error) {
      onSave({ ...user, notificationSettings: settings });
      setSaveStatus('saved');
      setTimeout(() => {
        setSaveStatus('idle');
        onClose();
      }, 1000);
    } else {
      setSaveStatus('error');
    }
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
          <h3 className="text-xl font-black text-slate-900 dark:text-white">{t('notifications')}</h3>
          <div className="flex items-center space-x-2 h-4">
            {saveStatus === 'saving' && (
              <span className="flex items-center space-x-1 text-[10px] font-bold text-blue-500 animate-pulse">
                <Loader2 size={10} className="animate-spin" />
                <span>Guardando...</span>
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="flex items-center space-x-1 text-[10px] font-bold text-green-500 animate-in fade-in slide-in-from-bottom-1">
                <Check size={10} />
                <span>Cambios guardados</span>
              </span>
            )}
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

        {/* Sección Recompensas y logros */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{t('notif_cat_rewards')}</h4>
          <ToggleItem id="rewards_accepted" label={t('notif_rewards_accepted')} checked={settings.rewards_accepted} onChange={() => toggleSetting('rewards_accepted')} />
          <ToggleItem id="novas_earned" label={t('notif_novas_earned')} checked={settings.novas_earned} onChange={() => toggleSetting('novas_earned')} />
          <ToggleItem id="badges_earned" label={t('notif_badges_earned')} checked={settings.badges_earned} onChange={() => toggleSetting('badges_earned')} />
          <ToggleItem id="ranking_weekly" label={t('notif_ranking_weekly')} checked={settings.ranking_weekly} onChange={() => toggleSetting('ranking_weekly')} />
        </div>

        {/* Sección Sistema */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{t('notif_cat_system')}</h4>
          <ToggleItem id="maintenance_notices" label={t('notif_maintenance')} checked={settings.maintenance_notices} onChange={() => toggleSetting('maintenance_notices')} />
        </div>
      </div>

      <div className="p-6 bg-slate-50 dark:bg-zinc-900 border-t border-slate-100 dark:border-zinc-800 flex space-x-3">
        <button
          onClick={onClose}
          className="flex-1 py-3 bg-white dark:bg-zinc-800 text-slate-600 dark:text-gray-400 rounded-2xl font-black text-sm border border-slate-100 dark:border-zinc-700 hover:bg-slate-50 transition-all"
        >
          {t('cancel')}
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex-[2] py-3 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all flex items-center justify-center space-x-2 transform active:scale-95 disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="animate-spin" size={20} /> : <><Save size={18} /><span>{t('save_changes')}</span></>}
        </button>
      </div>
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
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


const PersonalAreaModal: React.FC<{
  t: any,
  user: User,
  onClose: () => void
}> = ({ t, user, onClose }) => {
  useScrollLock();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    const fetchNote = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('personal_notes')
          .select('content')
          .eq('user_id', user.id)
          .maybeSingle();
        if (data) {
          setContent(data.content || '');
        }
      } catch (err) {
        // Not found, will just be empty
      } finally {
        setLoading(false);
      }
    };
    fetchNote();
  }, [user.id]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('saving');
    try {
      const { error } = await supabase
        .from('personal_notes')
        .upsert({ user_id: user.id, content, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
      if (error) throw error;
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
      <div className="bg-white dark:bg-[#0a0a0a] w-full max-w-2xl rounded-[2.5rem] overflow-hidden animate-in zoom-in-95 duration-300 border border-white dark:border-zinc-800 shadow-xl flex flex-col max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
        <div className="px-8 py-6 border-b border-gray-100 dark:border-zinc-900 flex justify-between items-center bg-white dark:bg-[#0a0a0a] shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 dark:bg-zinc-800 rounded-xl text-blue-600">
              <FileText size={20} />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">{t('personal_area') || 'Área Personal'}</h3>
            <div className="flex items-center space-x-2">
              {saveStatus === 'saving' && (
                <span className="flex items-center space-x-1 text-[10px] font-bold text-blue-500 animate-pulse">
                  <Loader2 size={10} className="animate-spin" />
                  <span>Guardando...</span>
                </span>
              )}
              {saveStatus === 'saved' && (
                <span className="flex items-center space-x-1 text-[10px] font-bold text-green-500 animate-in fade-in slide-in-from-bottom-1">
                  <Check size={10} />
                  <span>Cambios guardados</span>
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
        </div>

        <div className="flex-1 p-8 bg-slate-50 dark:bg-zinc-900/50 flex flex-col min-h-0 overflow-y-auto w-full">
          {loading ? (
             <div className="flex-1 flex items-center justify-center min-h-[50vh]">
               <Loader2 className="animate-spin text-blue-600" size={32} />
             </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 w-full min-h-[50vh] bg-transparent border-none outline-none resize-none text-slate-700 dark:text-gray-200 text-sm leading-relaxed p-0 placeholder:text-slate-400 dark:placeholder:text-zinc-600"
              placeholder={t('personal_area_placeholder') || "Escribe aquí tus notas personales, tareas pendientes, ideas..."}
              autoFocus
            />
          )}
        </div>

        <div className="p-6 bg-white dark:bg-[#0a0a0a] border-t border-slate-50 dark:border-zinc-900 flex justify-end space-x-3 shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-gray-400 rounded-2xl font-black text-sm hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || loading}
            className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all flex items-center justify-center space-x-2 transform active:scale-95 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /><span>{t('save')}</span></>}
          </button>
        </div>
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
  const [showAbout, setShowAbout] = useState(false);
  const [showInterests, setShowInterests] = useState(false);
  const [showPersonalArea, setShowPersonalArea] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  const t = useTranslation(language);

  useScrollLock(
    showPrivacyPolicy ||
    showAbout ||
    showPersonalData ||
    showBadges ||
    showNotifications ||
    showChatSettings ||
    showLogoutConfirm ||
    showInterests ||
    showPersonalArea
  );
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.openPersonalData) {
      setShowPersonalData(true);
    }
  }, [location.state]);

  const SettingItem = ({ icon: Icon, label, color = "text-slate-600 dark:text-gray-400", onClick }: { icon: any, label: string, color?: string, onClick?: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      onMouseDown={(e) => e.preventDefault()}
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
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-20 md:pt-0 px-4 md:px-0">
      <div className="flex items-center space-x-4 mb-4">
        {/* Back button removed as requested */}
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">{t('settings')}</h2>
        </div>
      </div>

      {user.isAdmin && (
        <div className="border border-purple-200 dark:border-purple-900 rounded-[2rem] overflow-hidden">
          <button
            type="button"
            onClick={() => navigate('/panel-control')}
            onMouseDown={(e) => e.preventDefault()}
            className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 transition-all rounded-[2rem]"
          >
            <div className="flex items-center space-x-4">
              <div className="p-2.5 rounded-xl bg-white/20">
                <LayoutDashboard size={20} className="text-white" />
              </div>
              <span className="font-bold text-white">Panel de Control</span>
            </div>
            <ChevronRight size={18} className="text-white/70" />
          </button>
        </div>
      )}

      <div className="border border-slate-100 dark:border-zinc-800 rounded-[2rem] overflow-hidden">
        <SettingItem icon={UserCircle} label={t('personal_data')} onClick={() => setShowPersonalData(true)} />

        <SettingItem icon={Medal} label={t('badges')} onClick={() => setShowBadges(true)} />
        <SettingItem icon={Heart} label={t('interests')} onClick={() => setShowInterests(true)} />
        <SettingItem icon={Wand2} label={t('accessibility')} onClick={() => setShowAccessibility(true)} />
        <SettingItem icon={Bell} label={t('notifications')} onClick={() => setShowNotifications(true)} />

        <SettingItem icon={Lock} label={t('privacy_security')} onClick={() => setShowPrivacySecurity(true)} />
        <SettingItem
          icon={Megaphone}
          label={t('news_updates')}
          onClick={() => showToast('¡Próximamente disponible!\nEstamos trabajando en esta función.', 'info')}
        />
      </div>

      {showChatSettings && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowChatSettings(false)}>
          <div className="bg-white dark:bg-[#0a0a0a] w-full max-w-lg rounded-[2.5rem] overflow-hidden animate-in zoom-in-95 duration-300 border border-white dark:border-zinc-800 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <ChatSettingsForm user={user} t={t} onSave={onUpdateUser} onClose={() => setShowChatSettings(false)} />
          </div>
        </div>,
        document.body
      )}

      {showBadges && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowBadges(false)}>
          <div className="bg-white dark:bg-[#0a0a0a] w-full max-w-2xl rounded-[2.5rem] overflow-hidden animate-in zoom-in-95 duration-300 border border-white dark:border-zinc-800 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <BadgesList user={user} t={t} onClose={() => setShowBadges(false)} />
          </div>
        </div>,
        document.body
      )}

      {showNotifications && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowNotifications(false)}>
          <div className="bg-white dark:bg-[#0a0a0a] w-full max-w-lg rounded-[2.5rem] overflow-hidden animate-in zoom-in-95 duration-300 border border-white dark:border-zinc-800 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <NotificationSettingsForm user={user} t={t} onSave={onUpdateUser} onClose={() => setShowNotifications(false)} />
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
        <SettingItem icon={Shield} label={t('privacy_policy')} onClick={() => setShowPrivacyPolicy(true)} />
        <SettingItem icon={Info} label={t('about_us')} onClick={() => setShowAbout(true)} />
        <SettingItem
          icon={LogOut}
          label={t('logout')}
          color="text-red-500"
          onClick={() => setShowLogoutConfirm(true)}
        />
      </div>

      <div className="text-center pt-8">
        <p className="text-[10px] text-slate-300 dark:text-zinc-700 font-black uppercase tracking-[0.3em]">v1.0</p>
      </div>

      {showPersonalData && (
        <PersonalDataModal 
          user={user} 
          onClose={() => setShowPersonalData(false)} 
          onSave={onUpdateUser}
          language={language}
        />
      )}


      {showPersonalArea && createPortal(
        <PersonalAreaModal t={t} user={user} onClose={() => setShowPersonalArea(false)} />,
        document.body
      )}

      {showPrivacyPolicy && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowPrivacyPolicy(false)}>
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
                className="px-6 py-2 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all"
              >
                {t('close_document')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showAbout && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowAbout(false)}>
          <div className="bg-white dark:bg-[#0a0a0a] w-full max-w-lg rounded-[2.5rem] overflow-hidden animate-in zoom-in-95 duration-300 border border-white dark:border-zinc-800 flex flex-col max-h-[85vh] shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-900 flex justify-between items-center bg-white dark:bg-[#0a0a0a]">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-blue-50 dark:bg-zinc-800 rounded-xl text-blue-600">
                  <Info size={16} />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">{t('about_us')}</h3>
              </div>
              <button onClick={() => setShowAbout(false)} className="p-1 text-gray-400 hover:text-gray-600 transition-colors"><X size={16} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 scrollbar-hide">
              <AboutContent t={t} />
            </div>
            <div className="px-6 py-4 bg-slate-50 dark:bg-zinc-900 flex justify-center">
              <button
                onClick={() => setShowAbout(false)}
                className="px-6 py-2 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all"
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
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
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

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[300] w-auto max-w-[calc(100%-4rem)] animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className={`px-8 py-3.5 rounded-full shadow-2xl border flex flex-col items-center text-center backdrop-blur-md ${toast.type === 'success' ? 'bg-green-500/95 border-green-400 text-white' :
              toast.type === 'error' ? 'bg-red-500/95 border-red-400 text-white' :
                'bg-slate-900/95 border-slate-700 text-white'
            }`}>
            <div className="flex flex-col space-y-0.5 min-w-max">
              {toast.message.split('\n').map((line, i) => (
                <span key={i} className={`font-bold ${i === 0 ? 'text-[13px]' : 'text-[10px] opacity-80'} leading-tight whitespace-nowrap`}>
                  {line}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};





