
import React, { useState } from 'react';
import { User as UserType } from '../types';
import { COUNTRIES, COUNTRIES_DATA, PUBLIC_INTERESTS } from '../constants';
import { Mail, Lock, Briefcase, Building, Globe, Check, Calendar, User as UserIcon, Loader2, ArrowRight, ArrowLeft, Pencil, AtSign, ShieldCheck, Clock, CheckCircle2, ChevronDown, FileText, X, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface OnboardingProps {
  onComplete: () => void;
  onCancel: () => void;
}





const PrivacyPolicyContent = () => (
  <div className="space-y-6 text-sm text-slate-600 leading-relaxed">
    <div className="flex items-center space-x-2 text-slate-900 mb-4 border-b pb-4">
      <FileText size={20} className="text-blue-600" />
      <h4 className="font-black uppercase tracking-widest text-lg">POLÍTICA DE PRIVACIDAD</h4>
    </div>

    <p className="font-bold text-slate-800">Red Social</p>

    <p>
      En cumplimiento de lo dispuesto en el Reglamento (UE) 2016/679 del Parlamento Europeo y del Consejo, de 27 de abril de 2016 (RGPD), así como en la normativa nacional aplicable en materia de protección de datos personales, se informa a los usuarios de la red social privada Red Social sobre el tratamiento de sus datos personales.
    </p>

    <p>
      La protección de la privacidad, la seguridad de la información y la confidencialidad de los datos son principios fundamentales de nuestra organización.
    </p>

    <section>
      <h5 className="font-bold text-slate-900 mb-2">1. Responsable del tratamiento</h5>
      <p>El responsable del tratamiento de los datos personales es la empresa titular de Red Social, quien determina los fines y medios del tratamiento, y actúa conforme a los principios de licitud, lealtad, transparencia, minimización de datos y seguridad.</p>
    </section>

    <section>
      <h5 className="font-bold text-slate-900 mb-2">2. Ámbito y naturaleza de la plataforma</h5>
      <p>Red Social es una red social privada, corporativa y de acceso restringido, dirigida exclusivamente a profesionales, directivos y altos cargos vinculados al ámbito de la administración pública, la innovación y sectores afines. El acceso está sujeto a autorización expresa.</p>
    </section>

    <section>
      <h5 className="font-bold text-slate-900 mb-2">3. Datos personales objeto de tratamiento</h5>
      <p>De conformidad con el principio de minimización de datos (art. 5.1.c RGPD), únicamente se tratan los siguientes datos personales:</p>
      <ul className="list-disc ml-5 mt-2">
        <li>Dirección de correo electrónico profesional del usuario.</li>
      </ul>
      <p className="mt-2 text-xs italic">No se recaban datos especialmente protegidos ni información personal adicional.</p>
    </section>

    <section>
      <h5 className="font-bold text-slate-900 mb-2">4. Base legal del tratamiento</h5>
      <p>El tratamiento de los datos personales se fundamenta en:</p>
      <ul className="list-disc ml-5 mt-2">
        <li>El consentimiento del interesado (art. 6.1.a RGPD), otorgado en el momento del registro.</li>
        <li>La ejecución de un servicio solicitado por el usuario (art. 6.1.b RGPD).</li>
      </ul>
    </section>

    <section>
      <h5 className="font-bold text-slate-900 mb-2">5. Finalidad del tratamiento</h5>
      <p>Los datos personales serán tratados exclusivamente para las siguientes finalidades legítimas:</p>
      <ul className="list-disc ml-5 mt-2">
        <li>Gestión del alta, autenticación y acceso a la plataforma.</li>
        <li>Garantizar la seguridad y el correcto funcionamiento de la red social.</li>
        <li>Facilitar la interacción profesional dentro de la comunidad privada.</li>
        <li>Prevención de accesos no autorizados y usos indebidos del sistema.</li>
      </ul>
      <p className="mt-2 font-bold text-slate-800">En ningún caso los datos serán utilizados con fines comerciales, publicitarios o de perfilado.</p>
    </section>

    <section>
      <h5 className="font-bold text-slate-900 mb-2">6. Seguridad y confidencialidad de las credenciales</h5>
      <p>Las contraseñas de los usuarios:</p>
      <ul className="list-disc ml-5 mt-2">
        <li>Se almacenan mediante sistemas de cifrado robustos y no reversibles.</li>
        <li>No son accesibles ni visibles para el personal de la empresa.</li>
        <li>Se aplican medidas técnicas y organizativas apropiadas conforme al artículo 32 del RGPD para garantizar un nivel de seguridad adecuado al riesgo.</li>
      </ul>
    </section>

    <section>
      <h5 className="font-bold text-slate-900 mb-2">7. Conservación de los datos</h5>
      <p>Los datos personales se conservarán:</p>
      <ul className="list-disc ml-5 mt-2">
        <li>Mientras la cuenta del usuario permanezca activa.</li>
        <li>Durante el tiempo estrictamente necesario para cumplir con las finalidades del tratamiento.</li>
      </ul>
      <p className="mt-2">Una vez solicitada la baja, los datos serán eliminados de forma segura, salvo obligación legal de conservación.</p>
    </section>

    <section>
      <h5 className="font-bold text-slate-900 mb-2">8. Destinatarios y cesión de datos</h5>
      <p>No se cederán datos personales a terceros, salvo en los siguientes supuestos:</p>
      <ul className="list-disc ml-5 mt-2">
        <li>Cumplimiento de una obligación legal.</li>
        <li>Requerimiento por parte de autoridades públicas o judiciales competentes.</li>
      </ul>
      <p className="mt-2 font-medium">No se realizan transferencias internacionales de datos.</p>
    </section>

    <section>
      <h5 className="font-bold text-slate-900 mb-2">9. Derechos de los interesados</h5>
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
      <h5 className="font-bold text-slate-900 mb-2">10. Derecho a reclamar ante la autoridad de control</h5>
      <p>El usuario tiene derecho a presentar una reclamación ante la autoridad de control competente en materia de protección de datos, si considera que el tratamiento de sus datos personales infringe la normativa vigente.</p>
    </section>

    <section>
      <h5 className="font-bold text-slate-900 mb-2">11. Obligaciones y responsabilidad del usuario</h5>
      <p>El usuario se compromete a:</p>
      <ul className="list-disc ml-5 mt-2">
        <li>Utilizar la plataforma de forma profesional, ética y conforme a su finalidad.</li>
        <li>Custodiar adecuadamente sus credenciales de acceso.</li>
        <li>Respetar la confidencialidad de la información compartida dentro de la red.</li>
      </ul>
    </section>

    <section>
      <h5 className="font-bold text-slate-900 mb-2">12. Modificaciones de la política de privacidad</h5>
      <p>La presente Política de Privacidad podrá actualizarse para adaptarse a cambios normativos o mejoras en la plataforma. Las modificaciones serán comunicadas a los usuarios de forma adecuada.</p>
    </section>
  </div>
);

import { notifyAdminNewUser } from '../utils/emailService';

// ... existing imports ...

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customJobInput, setCustomJobInput] = useState('');
  const [customAdminInput, setCustomAdminInput] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(true);
  const [showPolicyOverlay, setShowPolicyOverlay] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [showPendingApprovalModal, setShowPendingApprovalModal] = useState(false);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);


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

  const checkAvailability = async (): Promise<boolean> => {
    setIsChecking(true);
    setUsernameError(null);
    setEmailError(null);
    try {
      let valid = true;

      // Validate Username
      if (formData.username) {
        const { data: userByUsername } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', formData.username.toLowerCase())
          .maybeSingle();

        if (userByUsername) {
          setUsernameError("Este nombre de usuario ya está en uso.");
          valid = false;
        }
      }

      // Validate Email
      if (formData.email) {
        const { data: userByEmail } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', formData.email.toLowerCase())
          .maybeSingle();

        if (userByEmail) {
          setEmailError("Este correo electrónico ya está registrado.");
          valid = false;
        }
      }

      return valid;
    } catch (error) {
      console.error("Availability check failed:", error);
      return false; // Fail safe
    } finally {
      setIsChecking(false);
    }
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const updateField = (field: keyof UserType, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'username') setUsernameError(null);
    if (field === 'email') setEmailError(null);
    if (field === 'password') setPasswordError(null);
  };

  const handleFinalize = async () => {
    setLoading(true);
    setError(null);

    const finalJobCategory = formData.jobCategory === 'Otro' ? customJobInput : formData.jobCategory;
    const finalAdminType = formData.administrationType === 'Otra' ? customAdminInput : formData.administrationType;

    if (!formData.username || formData.username.includes('@') || formData.username.includes(' ')) {
      setError("El nombre de usuario no puede contener espacios ni el símbolo @");
      setLoading(false);
      return;
    }

    // Ensure all data is snake_case for the database
    const profileData = {
      name: formData.name,
      last_name: formData.lastName,
      username: formData.username,
      // avatar_url: formData.avatar, // Removed: Column likely doesn't exist, causing 400
      position: formData.position,
      department: formData.department,
      job_category: finalJobCategory,
      administration_type: finalAdminType,
      country: formData.country,
      region: formData.region,
      interests: formData.interests,
      birth_date: formData.birthDate || null, // Ensure empty string becomes null
      // Extra fields if needed for future
      bio: ''
    };

    // Attempt registration
    let authResponse = await supabase.auth.signUp({
      email: formData.email!,
      password: formData.password!,
      options: {
        data: profileData
      }
    });

    // Handle "User already registered" (Status 422) specifically for "Zombie" users (Auth exists, Profile missing)
    if (authResponse.error?.status === 422 || authResponse.error?.message?.includes("already registered")) {
      console.log("User already exists in Auth. Checking for Zombie state...");
      // Try to sign in with the provided credentials
      const signInResponse = await supabase.auth.signInWithPassword({
        email: formData.email!,
        password: formData.password!,
      });

      if (!signInResponse.error && signInResponse.data.session) {
        // Check if profile exists (use try/catch to handle 406 gracefully if needed, though Select should be fine)
        const { data: existingProfile, error: fetchProfileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', signInResponse.data.user.id)
          .maybeSingle();

        if (fetchProfileError) console.warn("Error checking profile existence:", JSON.stringify(fetchProfileError));

        if (!existingProfile) {
          console.log("Zombie user detected (Auth yes, Profile no). Proceeding to resurrect...");
          // Verified: Usage of 'authResponse' as a mutable structure to mimic successful signup
          authResponse = {
            data: { user: signInResponse.data.user, session: signInResponse.data.session },
            error: null
          } as any;
        }
      }
    }

    const { data, error: signUpError } = authResponse;

    if (signUpError) {
      console.error("SignUp Error:", signUpError);
      if (signUpError.message.toLowerCase().includes('rate limit') || signUpError.status === 429) {
        setError("Límite de intentos excedido. Por favor, revisa tu bandeja de entrada o espera unos minutos.");
      } else if (signUpError.message.includes("User already registered") || signUpError.status === 422) {
        setError("Error: El usuario o correo ya está registrado en el sistema. Si no recuerdas tu contraseña, intenta iniciar sesión o recuperarla.");
      } else {
        setError(`Error al crear la cuenta: ${signUpError.message}`);
      }
      setLoading(false);
      return;
    }

    // Check if session exists (Auto-login)
    if (data.session) {
      try {
        console.log("Session established. Proceeding to profile creation...");
        // User is logged in, try to write profile to DB
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user!.id,
            ...profileData,
            email: formData.email,
            avatar: formData.avatar,
            username: formData.username!.toLowerCase(),
            status: 'pending' // Enforce pending status
          });

        if (profileError) {
          console.error("Error creating profile:", JSON.stringify(profileError));
          setToast({ message: "Cuenta creada, pero hubo un error guardando el perfil. Contacta con soporte.", type: 'error' });
        } else {
          console.log("Profile created. Sending notifications...");

          // Fetch ALL admins
          const { data: adminUsers, error: adminFetchError } = await supabase
            .from('profiles')
            .select('id, email')
            .eq('is_admin', true);

          if (adminFetchError) console.error("Error fetching admins:", adminFetchError);

          if (adminUsers && adminUsers.length > 0) {
            console.log(`Found ${adminUsers.length} admins. Sending notifications...`);

            // Send notifications to all admins in parallel
            await Promise.all(adminUsers.map(async (admin) => {
              // 1. Email Notification
              if (admin.email) {
                await notifyAdminNewUser(formData.username!, `${formData.name} ${formData.lastName}`, admin.email)
                  .catch(err => console.error(`Email to ${admin.email} failed`, err));
              }

              // 2. In-App Notification
              const { error: notifError } = await supabase.from('notifications').insert({
                user_id: admin.id,
                type: 'registration_request',
                content: `El usuario ${formData.username} solicita registro.`,
                sender_id: data.user!.id,
                is_read: false
              });

              if (notifError) console.error(`Error notifying admin ${admin.id}:`, notifError);
            }));
          } else {
            console.warn("No admins found to notify.");
          }

          console.log("Notifications sent. Showing modal.");
          // Show pending modal instead of completing immediately
          setShowPendingApprovalModal(true);
        }
      } catch (err: any) {
        console.error("Critical error in registration finalization:", err);
        setError("Ocurrió un error inesperado al finalizar el registro: " + (err.message || String(err)));
      }
    } else if (data.user) {
      console.warn("User created but no session (Email verification?)");
      alert("Registro completado. Por favor, verifica tu correo electrónico.");
    }

    setLoading(false);
  };

  const setToast = (props: { message: string, type: 'success' | 'error' | 'info' }) => {
    console.log(`[${props.type.toUpperCase()}] ${props.message}`);
    if (props.type === 'error') setError(props.message);
  };

  const isStepValid = () => {
    switch (step) {
      case 0: return privacyAccepted;
      case 1: return !!(formData.name && formData.lastName && formData.username && formData.email && formData.password && formData.birthDate);
      case 2: return formData.jobCategory === 'Otro' ? !!customJobInput.trim() : !!formData.jobCategory;
      case 3: return formData.administrationType === 'Otra' ? !!customAdminInput.trim() : !!formData.administrationType;
      case 4: return !!(formData.position && formData.department);
      case 5: return !!(formData.country && formData.region);
      case 6: return (formData.interests?.length || 0) >= 3;
      default: return false;
    }
  };



  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-[40px] p-8 md:p-12 relative overflow-hidden border border-slate-100">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100">
          <div className="h-full bg-blue-600 transition-all duration-700 ease-in-out" style={{ width: `${((step - 1) / 5) * 100}%` }} />
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-bold rounded-2xl border border-red-100 flex items-center space-x-2 animate-in fade-in zoom-in-95">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            <span>{error}</span>
          </div>
        )}

        <div className="mb-10 min-h-[520px] flex flex-col justify-center">
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
                    <input
                      type="text"
                      value={formData.username}
                      onChange={e => updateField('username', e.target.value.toLowerCase().replace(/\s/g, ''))}
                      onBlur={() => { if (formData.username) checkAvailability(); }}
                      className={`w-full pl-12 pr-4 py-3 bg-slate-50 border ${usernameError ? 'border-red-300 focus:ring-red-200' : 'border-slate-100 focus:ring-blue-500'} rounded-2xl text-sm font-bold focus:ring-2 outline-none transition-all`}
                      placeholder="anagarcia"
                    />
                  </div>
                  {usernameError && (
                    <div className="flex items-center space-x-1 mt-1 ml-1 text-red-500 animate-in slide-in-from-top-1">
                      <AlertCircle size={12} />
                      <span className="text-xs font-bold">{usernameError}</span>
                    </div>
                  )}
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
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => updateField('email', e.target.value)}
                    onBlur={() => { if (formData.email) checkAvailability(); }}
                    className={`w-full pl-12 pr-4 py-3 bg-slate-50 border ${emailError ? 'border-red-300 focus:ring-red-200' : 'border-slate-100 focus:ring-blue-500'} rounded-2xl text-sm font-bold focus:ring-2 outline-none transition-all`}
                    placeholder="nombre@gob.es"
                  />
                </div>
                {emailError && (
                  <div className="flex items-center space-x-1 mt-1 ml-1 text-red-500 animate-in slide-in-from-top-1">
                    <AlertCircle size={12} />
                    <span className="text-xs font-bold">{emailError}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input type="password" value={formData.password} onChange={e => updateField('password', e.target.value)} className={`w-full pl-12 pr-4 py-3 bg-slate-50 border ${passwordError ? 'border-red-300 focus:ring-red-200' : 'border-slate-100 focus:ring-blue-500'} rounded-2xl text-sm font-bold focus:ring-2 outline-none transition-all`} placeholder="Mínimo 8 caracteres" />
                </div>
                {passwordError && (
                  <div className="flex items-center space-x-1 mt-1 ml-1 text-red-500 animate-in slide-in-from-top-1">
                    <AlertCircle size={12} />
                    <span className="text-xs font-bold">{passwordError}</span>
                  </div>
                )}
              </div>

              <div className="text-center pt-2">
                <button
                  onClick={() => setShowPolicyOverlay(true)}
                  className="text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors underline decoration-slate-200 underline-offset-4"
                >
                  Protección y políticas de privacidad
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight mb-2">Tipo de puesto que desempeñas</h2>
                <p className="text-slate-500 font-medium">Indica tu nivel de responsabilidad actual</p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {['Directivo', 'Técnico', 'Administrativo', 'Otro'].map(cat => (
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

              {formData.jobCategory === 'Otro' && (
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
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight mb-2">Tipo de organización</h2>
                <p className="text-slate-500 font-medium">¿En qué tipo de entidad prestas servicio?</p>
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
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Especialización</label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                    <input type="text" value={formData.position} onChange={e => updateField('position', e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Ej. Responsable de Innovación" />
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
                      className={`px-6 py-3 rounded-2xl border-2 text-sm font-black transition-all transform active:scale-95 ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-100 text-slate-500 hover:border-blue-100'}`}
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
            className="flex-1 py-4 rounded-[1.5rem] bg-slate-100 text-slate-500 font-black flex items-center justify-center space-x-2 hover:bg-slate-200 transition-all"
          >
            <ArrowLeft size={20} />
            <span>{step === 1 ? 'Cancelar' : 'Atrás'}</span>
          </button>
          <button
            onClick={async () => {
              // Manual validation check to provide feedback
              if (!isStepValid()) {
                if (step === 1) {
                  if (!formData.name) setError("Por favor, introduce tu nombre.");
                  else if (!formData.lastName) setError("Por favor, introduce tus apellidos.");
                  else if (!formData.username) setError("Por favor, elige un nombre de usuario.");
                  else if (!formData.birthDate) setError("Por favor, selecciona tu fecha de nacimiento.");
                  else if (!formData.email) setError("Por favor, introduce tu correo institucional.");
                  else if (!formData.password) setError("Por favor, crea una contraseña.");
                  else setError("Por favor, completa todos los campos.");
                } else if (step === 2) {
                  setError("Por favor, selecciona una categoría profesional.");
                } else if (step === 3) {
                  setError("Por favor, selecciona un tipo de organización.");
                } else if (step === 4) {
                  setError("Por favor, completa tu puesto y organización.");
                } else if (step === 5) {
                  setError("Por favor, selecciona tu país y región.");
                } else if (step === 6) {
                  setError("Por favor, selecciona al menos 3 intereses.");
                }
                return;
              }

              if (step === 1) {
                // strict validation
                if (!formData.username || !formData.email || !formData.password || !formData.name || !formData.lastName) return;

                let valid = true;

                if (!validateEmail(formData.email)) {
                  setEmailError("Correo electrónico no válido");
                  valid = false;
                }

                if (formData.password.length < 8) {
                  setPasswordError("La contraseña debe tener al menos 8 caracteres");
                  valid = false;
                }

                if (!valid) return;

                try {
                  const isAvailable = await checkAvailability();
                  if (isAvailable) nextStep();
                } catch (err) {
                  console.error("Availability check failed", err);
                  setError("Error verificando disponibilidad. Inténtalo de nuevo.");
                }
              } else if (step < 6) {
                nextStep();
              } else {
                handleFinalize();
              }
            }}
            disabled={loading || isChecking} // Enable button even if invalid to show feedback
            className={`flex-[2] py-4 rounded-[1.5rem] font-black flex items-center justify-center space-x-2 transition-all transform active:scale-95 ${!isStepValid() || loading || isChecking ? 'bg-blue-400 cursor-not-allowed opacity-70' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'}`}
          >
            {loading || isChecking ? (
              <Loader2 className="animate-spin text-white" size={24} />
            ) : (
              <>
                <span className="text-white">{step === 6 ? 'Completar registro' : 'Siguiente'}</span>
                {step < 6 && <ArrowRight size={20} className="text-white" />}
              </>
            )}
          </button>
        </div>
      </div>

      {
        showPolicyOverlay && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setShowPolicyOverlay(false)}
          >
            <div
              className="bg-white w-full max-w-3xl rounded-[2.5rem] overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 border border-white"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                    <ShieldCheck size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Política de Privacidad</h3>
                </div>
                <button
                  onClick={() => setShowPolicyOverlay(false)}
                  className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-all"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-10 scrollbar-hide">
                <PrivacyPolicyContent />
              </div>
              <div className="p-6 bg-slate-50 flex justify-center">
                <button
                  onClick={() => setShowPolicyOverlay(false)}
                  className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all"
                >
                  He leído y acepto los términos
                </button>
              </div>
            </div>
          </div>
        )
      }

      {
        showPendingApprovalModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white max-w-md w-full rounded-3xl p-8 text-center shadow-2xl animate-in zoom-in-95">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock size={32} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Solicitud enviada</h3>
              <p className="text-slate-600 mb-6 leading-relaxed">
                Tu registro ha sido completado con éxito. Ahora, un administrador debe revisar y aprobar tu solicitud.
                Recibirás un correo electrónico cuando tu cuenta esté activa.
              </p>
              <button
                onClick={onCancel} // Go back to landing/login
                className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        )
      }
    </div >
  );
};
