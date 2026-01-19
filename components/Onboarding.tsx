
import React, { useState } from 'react';
import { User as UserType } from '../types';
import { COUNTRIES, COUNTRIES_DATA, PUBLIC_INTERESTS } from '../constants';
import { Mail, Lock, Briefcase, Building, Globe, Check, Info } from 'lucide-react';

interface OnboardingProps {
  onComplete: (user: Partial<UserType>) => void;
  onCancel: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  const [customRole, setCustomRole] = useState('');
  const [formData, setFormData] = useState<Partial<UserType>>({
    name: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
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

  const isStepValid = () => {
    switch (step) {
      case 1: return formData.name && formData.lastName && formData.email && formData.password;
      case 2: 
        if (formData.jobCategory === 'Otro') return customRole.trim().length > 0;
        return !!formData.jobCategory;
      case 3: return !!formData.administrationType;
      case 4: return formData.position && formData.department;
      case 5: return formData.country && formData.region;
      case 6: return (formData.interests?.length || 0) >= 3;
      default: return false;
    }
  };

  const handleFinalize = () => {
    const finalData = { ...formData };
    if (finalData.jobCategory === 'Otro') {
      finalData.jobCategory = customRole;
    }
    onComplete(finalData);
  };

  const renderStep1 = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-black text-slate-900">Crea tu cuenta</h2>
        <p className="text-slate-500 font-medium">Únete a la red de innovación pública</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <input 
          type="text" 
          value={formData.name}
          onChange={(e) => updateField('name', e.target.value)}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          placeholder="Nombre"
        />
        <input 
          type="text" 
          value={formData.lastName}
          onChange={(e) => updateField('lastName', e.target.value)}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          placeholder="Apellido"
        />
      </div>
      <div className="relative">
        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="email" 
          value={formData.email}
          onChange={(e) => updateField('email', e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          placeholder="Correo Institucional"
        />
      </div>
      <div className="relative">
        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="password" 
          value={formData.password}
          onChange={(e) => updateField('password', e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          placeholder="Contraseña"
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="text-center">
        <h2 className="text-3xl font-black text-slate-900">¿Cuál es tu rol?</h2>
      </div>
      <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
        {['Directivo', 'Técnico', 'Administrativo', 'Consultor', 'Otro'].map(cat => (
          <div key={cat} className="space-y-2">
            <button
              onClick={() => updateField('jobCategory', cat)}
              className={`w-full text-left px-5 py-4 rounded-2xl border-2 transition-all flex justify-between items-center ${
                formData.jobCategory === cat ? 'bg-blue-600 border-blue-600 text-white font-black' : 'bg-white border-slate-100 text-slate-600 hover:border-blue-200'
              }`}
            >
              <span>{cat}</span>
              {formData.jobCategory === cat && <Check size={18} />}
            </button>
            {cat === 'Otro' && formData.jobCategory === 'Otro' && (
              <input 
                type="text"
                autoFocus
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                placeholder="Especifique su puesto..."
                className="w-full px-5 py-3 bg-blue-50 border-2 border-blue-200 rounded-xl text-sm font-bold text-blue-900 placeholder-blue-300 outline-none focus:ring-2 focus:ring-blue-500 animate-in slide-in-from-top-2 duration-200"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="text-center">
        <h2 className="text-3xl font-black text-slate-900">Trabajo en...</h2>
        <p className="text-slate-500 font-medium">Selecciona el tipo de organización</p>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {[
          'Administración Pública central',
          'Administración Pública regional',
          'Administración Pública local/municipal',
          'Empresa privada',
          'Organización del tercer sector',
          'Otra'
        ].map(type => (
          <button
            key={type}
            onClick={() => updateField('administrationType', type)}
            className={`text-left px-5 py-4 rounded-2xl border-2 transition-all flex justify-between items-center ${
              formData.administrationType === type ? 'bg-blue-600 border-blue-600 text-white font-black' : 'bg-white border-slate-100 text-slate-600 hover:border-blue-200'
            }`}
          >
            <span>{type}</span>
            {formData.administrationType === type && <Check size={18} />}
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="text-center">
        <h2 className="text-3xl font-black text-slate-900">Tu Institución</h2>
      </div>
      <div className="space-y-4">
        <div className="relative">
          <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            value={formData.position}
            onChange={(e) => updateField('position', e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            placeholder="Cargo actual"
          />
        </div>
        <div className="relative">
          <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            value={formData.department}
            onChange={(e) => updateField('department', e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            placeholder="Departamento / Área"
          />
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="text-center">
        <h2 className="text-3xl font-black text-slate-900">Ubicación</h2>
      </div>
      <div className="space-y-4">
        <div className="relative">
          <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <select 
            value={formData.country}
            onChange={(e) => { 
                updateField('country', e.target.value); 
                updateField('region', ''); 
            }}
            className="w-full pl-12 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold appearance-none outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          >
            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="relative">
          <select 
            value={formData.region}
            onChange={(e) => updateField('region', e.target.value)}
            className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold appearance-none outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          >
            <option value="">Selecciona región...</option>
            {formData.country && COUNTRIES_DATA[formData.country].map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  const renderStep6 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="text-center">
        <h2 className="text-3xl font-black text-slate-900">Intereses</h2>
        <p className="text-slate-500 font-medium">Elige al menos 3 temas</p>
      </div>
      <div className="flex flex-wrap gap-2 justify-center max-h-60 overflow-y-auto p-2">
        {PUBLIC_INTERESTS.map(topic => (
          <button
            key={topic}
            onClick={() => {
              const current = formData.interests || [];
              if (current.includes(topic)) updateField('interests', current.filter(i => i !== topic));
              else updateField('interests', [...current, topic]);
            }}
            className={`px-4 py-2 rounded-full border-2 text-xs font-black transition-all ${
              formData.interests?.includes(topic) ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white border-slate-100 text-slate-500 hover:border-blue-200'
            }`}
          >
            {topic}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-white rounded-[40px] shadow-2xl p-10 relative overflow-hidden border border-slate-100">
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-slate-100">
          <div 
            className="h-full bg-blue-600 transition-all duration-500 ease-out" 
            style={{ width: `${(step / 6) * 100}%` }} 
          />
        </div>

        <div className="mb-10 min-h-[400px]">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          {step === 5 && renderStep5()}
          {step === 6 && renderStep6()}
        </div>

        <div className="flex gap-4">
          <button 
            onClick={step === 1 ? onCancel : prevStep} 
            className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-600 font-black text-sm transition-all hover:bg-slate-200"
          >
            {step === 1 ? 'Cancelar' : 'Atrás'}
          </button>
          <button 
            onClick={() => step < 6 ? nextStep() : handleFinalize()} 
            disabled={!isStepValid()} 
            className="flex-[2] py-4 rounded-2xl bg-blue-600 text-white font-black text-sm shadow-xl shadow-blue-100 disabled:opacity-30 transition-all hover:bg-blue-700 active:scale-95"
          >
            {step === 6 ? 'Crear Cuenta' : 'Siguiente'}
          </button>
        </div>
      </div>
    </div>
  );
};