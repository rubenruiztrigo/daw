import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useScrollLock } from '../hooks/useScrollLock';
import { X, UserCircle, Loader2, Check, AlertCircle, AtSign, FileText, Mail, Calendar, Briefcase, Building, CheckCircle2, ChevronDown, Save } from 'lucide-react';
import { User } from '../types';
import { COUNTRIES, COUNTRIES_DATA } from '../constants';
import { supabase } from '../supabaseClient';
import { useTranslation, Language } from '../utils/translations';
import { decodeEmail } from '../utils/emailUtils';

const JOB_CATEGORIES = ['Directivo', 'Técnico', 'Administrativo'];
const ADMIN_TYPES = [
  'Administración central',
  'Administración regional',
  'Administración local / municipal',
  'Empresa pública',
  'Organismo autónomo',
  'Universidad',
  'Organismo internacional',
  'Organización del tercer sector',
  'Sector privado',
  'Otros'
];

const SelectDrop: React.FC<{
  label: string,
  value: string,
  options: string[],
  onChange: (val: string) => void,
  placeholder: string,
  disabled?: boolean
}> = ({ label, value, options, onChange, placeholder, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  useLayoutEffect(() => {
    if (!isOpen || !buttonRef.current) return;
    const update = () => {
      const rect = buttonRef.current!.getBoundingClientRect();
      const viewportH = window.innerHeight;
      const spaceBelow = viewportH - rect.bottom;
      const spaceAbove = rect.top;
      const maxH = 240;
      const openUp = spaceBelow < maxH && spaceAbove > spaceBelow;
      setMenuStyle({
        position: 'fixed',
        left: rect.left,
        width: rect.width,
        zIndex: 250,
        maxHeight: Math.min(maxH, openUp ? spaceAbove - 8 : spaceBelow - 8),
        ...(openUp
          ? { bottom: viewportH - rect.top + 4 }
          : { top: rect.bottom + 4 }),
      });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [isOpen]);

  return (
    <div className="space-y-1 relative">
      <label className="text-[9px] font-black text-slate-500 dark:text-gray-400 uppercase ml-1 tracking-wider">{label}</label>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl font-bold dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all flex items-center justify-between ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span className={!value ? 'text-slate-400 font-medium' : ''}>{value || placeholder}</span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && !disabled && createPortal(
        <>
          <div className="fixed inset-0 z-[240]" onClick={() => setIsOpen(false)} />
          <div 
            style={menuStyle}
            className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-y-auto animate-in fade-in zoom-in-95 duration-200 scrollbar-hide"
          >
            {options.map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => { onChange(opt); setIsOpen(false); }}
                className={`w-full text-left px-5 py-3 text-sm font-bold hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors ${value === opt ? 'text-blue-600 bg-blue-50/50 dark:bg-blue-900/20' : 'text-slate-600 dark:text-gray-300'}`}
              >
                {opt}
              </button>
            ))}
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

interface PersonalDataFormProps {
  user: User;
  t: any;
  onSave: (updatedUser: User) => void;
  onClose: () => void;
}

export const PersonalDataForm: React.FC<PersonalDataFormProps> = ({ user, t, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: user.name || '',
    lastName: user.lastName || '',
    username: user.username || '',
    birthDate: user.birthDate || '',
    email: decodeEmail(user.email) || '',
    country: user.country || '',
    region: user.region || '',
    position: user.position || '',
    institution: user.institution || '',
    jobCategory: user.jobCategory && JOB_CATEGORIES.includes(user.jobCategory) ? user.jobCategory : (user.jobCategory ? 'Otro' : ''),
    customJobCategory: user.jobCategory && !JOB_CATEGORIES.includes(user.jobCategory) ? user.jobCategory : '',
    administrationType: user.administrationType && ADMIN_TYPES.includes(user.administrationType) ? user.administrationType : (user.administrationType ? 'Otra' : ''),
    customAdministrationType: user.administrationType && !ADMIN_TYPES.includes(user.administrationType) ? user.administrationType : '',
    bio: user.bio || '',
    linkedOrganizationId: user.linkedOrganizationId || null
  });

  const [orgResults, setOrgResults] = useState<{ id: string, name: string }[]>([]);
  const [isSearchingOrgs, setIsSearchingOrgs] = useState(false);

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

  const [isUpdating, setIsUpdating] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'personal' | 'professional'>('professional');
  const navigate = useNavigate();

  const performSave = async (data: typeof formData) => {
    setSaveStatus('saving');
    setError(null);
    try {
      const finalAdministrationType = data.administrationType === 'Otra'
        ? data.customAdministrationType
        : data.administrationType;

      const finalJobCategory = data.jobCategory === 'Otro'
        ? data.customJobCategory
        : data.jobCategory;

      await onSave({
        ...user,
        ...data,
        administrationType: finalAdministrationType,
        jobCategory: finalJobCategory
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err: any) {
      setSaveStatus('error');
      const errorMsg = err.message || "Error al guardar los cambios";
      setError(errorMsg);
      console.error("Save error:", err);
      throw err;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUpdating || saveStatus === 'saving') return;

    setIsUpdating(true);
    setError(null);
    
    const errors: string[] = [];
    if (!formData.username || formData.username.length < 3) errors.push("Nombre de usuario (min 3 carac.)");
    if (!formData.email?.trim() || !formData.email.includes('@')) errors.push("Email válido");
    if (!formData.country) errors.push("País");
    if (!formData.region) errors.push("Región");

    if (!user.isOrganization) {
      if (!formData.name?.trim()) errors.push("Nombre");
      if (!formData.lastName?.trim()) errors.push("Apellidos");
      if (!formData.birthDate) errors.push("Fecha de nacimiento");
      if (!formData.jobCategory) errors.push("Categoría profesional");
      if (!formData.administrationType) errors.push("Tipo de administración");
      if (!formData.position?.trim()) errors.push("Especialización / Puesto");
      if (!formData.institution?.trim()) errors.push("Nombre de la organización");
    } else {
      if (!formData.name?.trim()) errors.push("Nombre de la organización");
      if (!formData.bio?.trim()) errors.push("Biografía profesional");
    }

    if (errors.length > 0) {
      setError(`Campos obligatorios: ${errors.join(', ')}`);
      setIsUpdating(false);
      return;
    }

    try {
      await performSave(formData);
      // Si el nombre de usuario ha cambiado, redirigir a la nueva URL de perfil
      if (formData.username !== user.username) {
        navigate(`/${formData.username}`);
      }
      onClose();
    } catch (err) {
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

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8 pb-12 space-y-8 scrollbar-hide">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-2xl border border-red-100 dark:border-red-900/30 flex items-center space-x-3 animate-in slide-in-from-top-2">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {!user.isOrganization && (
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
                    placeholder="Escribe..."
                  />
                </div>
              </div>
            </div>
          )}

          {!user.isOrganization && (
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
          )}

          <div className="space-y-6">
            {user.isOrganization ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase ml-1">{t('username_label')}</label>
                  <div className="relative">
                    <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
                      className="w-full pl-12 pr-5 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
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
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase ml-1">Nombre de Organización</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-5 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase ml-1">Correo electrónico</label>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
                  <SelectDrop
                    label="País"
                    value={formData.country}
                    options={COUNTRIES}
                    onChange={(val) => setFormData({ ...formData, country: val, region: val === 'Otro' ? 'Otra' : '' })}
                    placeholder="Selecciona..."
                  />
                  <SelectDrop
                    label="Región"
                    value={formData.region}
                    options={formData.country ? COUNTRIES_DATA[formData.country] || [] : []}
                    onChange={(val) => setFormData({ ...formData, region: val })}
                    placeholder="Selecciona..."
                    disabled={!formData.country}
                  />
                </div>
              </div>
            ) : activeTab === 'personal' ? (
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
                  <SelectDrop
                    label="País"
                    value={formData.country}
                    options={COUNTRIES}
                    onChange={(val) => setFormData({ ...formData, country: val, region: val === 'Otro' ? 'Otra' : '' })}
                    placeholder="Selecciona..."
                  />
                  <SelectDrop
                    label="Región"
                    value={formData.region}
                    options={formData.country ? COUNTRIES_DATA[formData.country] || [] : []}
                    onChange={(val) => setFormData({ ...formData, region: val })}
                    placeholder="Selecciona..."
                    disabled={!formData.country}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
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
                  <div className="space-y-1 relative">
                    <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase ml-1 flex items-center h-[14px]">Especialización / Puesto</label>
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
                  <div className="space-y-1 relative">
                    <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase ml-1 flex items-center gap-1.5 h-[14px]">
                      <span>Nombre de la organización</span>
                      {formData.linkedOrganizationId && <CheckCircle2 size={12} className="text-blue-500" />}
                    </label>
                    <div className="relative">
                      <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input
                        type="text"
                        value={formData.institution}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          setFormData(prev => ({ 
                            ...prev, 
                            institution: newValue, 
                            linkedOrganizationId: null 
                          }));
                          searchOrganizations(newValue);
                        }}
                        className="w-full pl-12 pr-5 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
                        placeholder="Ej. Ayuntamiento de Madrid"
                      />
                      {isSearchingOrgs && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <Loader2 size={16} className="animate-spin text-blue-500" />
                        </div>
                      )}
                    </div>

                    {orgResults.length > 0 && (
                      <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
                        {orgResults.map(org => (
                          <button
                            key={org.id}
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ 
                                ...prev, 
                                linkedOrganizationId: org.id, 
                                institution: org.name 
                              }));
                              setOrgResults([]);
                            }}
                            className="w-full text-left px-5 py-3 text-sm font-bold hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center space-x-3 transition-colors text-slate-700 dark:text-gray-300"
                          >
                            <Building size={16} className="text-blue-500" />
                            <span>{org.name}</span>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {formData.linkedOrganizationId && (
                <div className="mt-2 flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 size={16} className="text-blue-500" />
                    <span className="text-sm font-bold text-blue-700 dark:text-blue-300">Organización vinculada: {formData.institution}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, linkedOrganizationId: null }))}
                    className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-full text-blue-500 transition-colors"
                  >
                    <X size={14} />
                  </button>
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
          className="flex-1 py-4 bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-gray-400 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all transform active:scale-95"
        >
          {t('cancel')}
        </button>
        <button
          type="submit"
          disabled={isUpdating || saveStatus === 'saving'}
          className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all transform active:scale-95 flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          <Save size={18} />
          <span>{t('save_changes')}</span>
        </button>
      </div>
    </form>
  </div>
);
};

interface PersonalDataModalProps {
  user: User;
  onClose: () => void;
  onSave: (updatedUser: User) => void;
  language: Language;
}

export const PersonalDataModal: React.FC<PersonalDataModalProps> = ({ user, onClose, onSave, language }) => {
  const t = useTranslation(language);
  useScrollLock();

  return createPortal(
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-[#0a0a0a] w-full max-w-2xl rounded-[2.5rem] overflow-hidden border border-white dark:border-zinc-800 animate-in zoom-in-95 duration-300 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <PersonalDataForm 
          user={user} 
          t={t} 
          onSave={onSave} 
          onClose={onClose} 
        />
      </div>
    </div>,
    document.body
  );
};
