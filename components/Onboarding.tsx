
import React, { useState } from 'react';
import { User as UserType } from '../types';
import { COUNTRIES, COUNTRIES_DATA, PUBLIC_INTERESTS } from '../constants';
import { Mail, Lock, Briefcase, Building, Globe, Check, Calendar, User as UserIcon, Loader2, ArrowRight, ArrowLeft, Pencil, AtSign } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface OnboardingProps {
  onComplete: () => void;
  onCancel: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customJobInput, setCustomJobInput] = useState('');
  const [customAdminInput, setCustomAdminInput] = useState('');
  
  const [formData, setFormData] = useState<Partial<UserType>>({
    name: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    birthDate: '',
    jobCategory: '',
    administrationType: '',
    position: '',
    department: '',
    country: 'España',
    region: '',
    interests: [],
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`
  });

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const updateField = (field: keyof UserType, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFinalize = async () => {
    setLoading(true);
    setError(null);

    const finalJobCategory = formData.jobCategory === 'Otro/a' ? customJobInput : formData.jobCategory;
    const finalAdminType = formData.administrationType === 'Otra' ? customAdminInput : formData.administrationType;

    // Validación extra de nombre de usuario
    if (!formData.username || formData.username.includes('@') || formData.username.includes(' ')) {
      setError("El nombre de usuario no puede contener espacios ni el símbolo @");
      setLoading(false);
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: formData.email!,
      password: formData.password!,
      options: {
        data: {
          name: formData.name,
          last_name: formData.lastName,
          username: formData.username,
          avatar_url: formData.avatar,
        }
      }
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          name: formData.name,
          last_name: formData.lastName,
          username: formData.username.toLowerCase(),
          email: formData.email,
          position: formData.position,
          department: formData.department,
          job_category: finalJobCategory,
          administration_type: finalAdminType,
          country: formData.country,
          region: formData.region,
          interests: formData.interests,
          birth_date: formData.birthDate,
          avatar: formData.avatar
        });
    }

    setLoading(false);
    onComplete();
  };

  const isStepValid = () => {
    switch (step) {
      case 1: return !!(formData.name && formData.lastName && formData.username && formData.email && formData.password && formData.birthDate);
      case 2: return formData.jobCategory === 'Otro/a' ? !!customJobInput.trim() : !!formData.jobCategory;
      case 3: return formData.administrationType === 'Otra' ? !!customAdminInput.trim() : !!formData.administrationType;
      case 4: return !!(formData.position && formData.department);
      case 5: return !!(formData.country && formData.region);
      case 6: return (formData.interests?.length || 0) >= 3;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-[40px] shadow-2xl p-8 md:p-12 relative overflow-hidden border border-slate-100">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100">
          <div className="h-full bg-blue-600 transition-all duration-700 ease-in-out" style={{ width: `${(step / 6) * 100}%` }} />
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-bold rounded-2xl border border-red-100 flex items-center space-x-2 animate-in fade-in zoom-in-95">
             <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
             <span>{error}</span>
          </div>
        )}

        <div className="mb-10 min-h-[480px] flex flex-col justify-center">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center mb-8">
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">Crea tu cuenta</h2>
                <p className="text-slate-500 font-medium mt-2">Introduce tus datos fundamentales para empezar</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre</label>
                  <input type="text" value={formData.name} onChange={e => updateField('name', e.target.value)} className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Ej. Ana" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Apellidos</label>
                  <input type="text" value={formData.lastName} onChange={e => updateField('lastName', e.target.value)} className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Ej. García López" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre de usuario</label>
                  <div className="relative">
                    <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input type="text" value={formData.username} onChange={e => updateField('username', e.target.value.toLowerCase().replace(/\s/g, ''))} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="anagarcia" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha de nacimiento</label>
                  <input type="date" value={formData.birthDate} onChange={e => updateField('birthDate', e.target.value)} className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Correo institucional</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input type="email" value={formData.email} onChange={e => updateField('email', e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="nombre@gob.es" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input type="password" value={formData.password} onChange={e => updateField('password', e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Mínimo 8 caracteres" />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center">
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">Tu perfil profesional</h2>
                <p className="text-slate-500 font-medium mt-2">Ayúdanos a conectarte con las personas adecuadas</p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {['Personal directivo', 'Personal técnico', 'Personal administrativo', 'Consultoría', 'Otro/a'].map(cat => (
                  <button 
                    key={cat} 
                    onClick={() => updateField('jobCategory', cat)} 
                    className={`w-full text-left px-6 py-5 rounded-[2rem] border-2 transition-all flex items-center justify-between group ${formData.jobCategory === cat ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-100 text-slate-600 hover:border-blue-200'}`}
                  >
                    <span className="font-black text-lg">{cat}</span>
                    {formData.jobCategory === cat && <Check size={24} />}
                  </button>
                ))}
              </div>

              {formData.jobCategory === 'Otro/a' && (
                <div className="animate-in slide-in-from-top-4 duration-300 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Especifica tu perfil profesional</label>
                  <div className="relative">
                    <Pencil className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                    <input 
                      type="text" 
                      value={customJobInput}
                      onChange={(e) => setCustomJobInput(e.target.value)}
                      placeholder="Escribe tu categoría aquí..."
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center">
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">Administración</h2>
                <p className="text-slate-500 font-medium mt-2">¿En qué tipo de entidad prestas servicio?</p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {[
                  'Administración central',
                  'Administración regional',
                  'Administración local / municipal',
                  'Empresa pública',
                  'Organismo autónomo',
                  'Otra'
                ].map(type => (
                  <button 
                    key={type} 
                    onClick={() => updateField('administrationType', type)} 
                    className={`w-full text-left px-6 py-5 rounded-[2rem] border-2 transition-all flex items-center justify-between group ${formData.administrationType === type ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-100 text-slate-600 hover:border-blue-200'}`}
                  >
                    <span className="font-black text-lg">{type}</span>
                    {formData.administrationType === type && <Check size={24} />}
                  </button>
                ))}
              </div>

              {formData.administrationType === 'Otra' && (
                <div className="animate-in slide-in-from-top-4 duration-300 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Especifica el tipo de administración</label>
                  <div className="relative">
                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                    <input 
                      type="text" 
                      value={customAdminInput}
                      onChange={(e) => setCustomAdminInput(e.target.value)}
                      placeholder="Escribe el tipo de entidad aquí..."
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center">
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">Tu puesto actual</h2>
                <p className="text-slate-500 font-medium mt-2">Define tu posición dentro de la estructura pública</p>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cargo / Puesto</label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                    <input type="text" value={formData.position} onChange={e => updateField('position', e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Ej. Responsable de Contratación" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre de la organización</label>
                  <div className="relative">
                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                    <input type="text" value={formData.department} onChange={e => updateField('department', e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Ej. Ayuntamiento de Madrid" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center">
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">Tu ubicación</h2>
                <p className="text-slate-500 font-medium mt-2">Conecta con otras personas innovadoras de tu región</p>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase ml-1">País</label>
                  <select 
                    value={formData.country} 
                    onChange={e => { updateField('country', e.target.value); updateField('region', ''); }} 
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                  >
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase ml-1">Región / Comunidad</label>
                  <select 
                    value={formData.region} 
                    onChange={e => updateField('region', e.target.value)} 
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                  >
                    <option value="">Selecciona una región...</option>
                    {formData.country && COUNTRIES_DATA[formData.country]?.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center">
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">Tus intereses</h2>
                <p className="text-slate-500 font-medium mt-2">Elige al menos 3 temas para personalizar tu feed</p>
              </div>
              <div className="flex flex-wrap gap-2.5 justify-center">
                {PUBLIC_INTERESTS.map(topic => {
                  const isSelected = formData.interests?.includes(topic);
                  return (
                    <button 
                      key={topic} 
                      onClick={() => {
                        const current = formData.interests || [];
                        updateField('interests', isSelected ? current.filter(i => i !== topic) : [...current, topic]);
                      }} 
                      className={`px-6 py-3 rounded-2xl border-2 text-sm font-black transition-all transform active:scale-95 ${isSelected ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-500 hover:border-blue-100'}`}
                    >
                      {topic}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <button 
            onClick={step === 1 ? onCancel : prevStep} 
            className="flex-1 py-4 rounded-[1.5rem] bg-slate-50 text-slate-500 font-black flex items-center justify-center space-x-2 hover:bg-slate-100 transition-all"
          >
            <ArrowLeft size={20} />
            <span>{step === 1 ? 'Cancelar' : 'Atrás'}</span>
          </button>
          <button 
            onClick={() => step < 6 ? nextStep() : handleFinalize()} 
            disabled={!isStepValid() || loading} 
            className="flex-[2] py-4 rounded-[1.5rem] bg-blue-600 text-white font-black shadow-2xl shadow-blue-200 flex items-center justify-center space-x-2 hover:bg-blue-700 transition-all disabled:opacity-30 transform active:scale-95"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <>
                <span>{step === 6 ? 'Completar registro' : 'Siguiente'}</span>
                {step < 6 && <ArrowRight size={20} />}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
