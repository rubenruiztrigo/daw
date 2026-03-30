
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useScrollLock } from '../hooks/useScrollLock';
import { User as UserType } from '../types';
import { COUNTRIES, COUNTRIES_DATA, PUBLIC_INTERESTS } from '../constants';
import { Mail, Lock, Briefcase, Building, Globe, Check, Calendar, User as UserIcon, Loader2, ArrowRight, ArrowLeft, Pencil, AtSign, ShieldCheck, Clock, CheckCircle2, ChevronDown, FileText, X, RefreshCw, AlertCircle, Eye, EyeOff, MapPin, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { getSafeAvatar } from '../utils/avatarUtils';

interface OnboardingProps {
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
import { ImageCropModal } from './ImageCropModal'; // Import ImageCropModal

// ... existing imports ...

const SelectDrop: React.FC<{
  label: string,
  value: string,
  options: string[],
  onChange: (val: string) => void,
  placeholder: string,
  disabled?: boolean,
  icon?: React.ReactNode
}> = ({ label, value, options, onChange, placeholder, disabled, icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="space-y-1 relative">
      <label className="text-[9px] font-black text-slate-500 dark:text-gray-400 uppercase ml-1 tracking-wider">{label}</label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl font-bold dark:text-white text-[11px] outline-none focus:ring-2 focus:ring-blue-500/50 transition-all flex items-center justify-between ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center space-x-2">
          {icon && <div className="text-slate-400">{icon}</div>}
          <span className={!value ? 'text-slate-400' : ''}>{value || placeholder}</span>
        </div>
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && !disabled && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl shadow-xl z-[101] max-h-48 overflow-y-auto animate-in fade-in zoom-in-95 duration-200 scrollbar-hide">
            {options.map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => { onChange(opt); setIsOpen(false); }}
                className={`w-full text-left px-4 py-2 text-[11px] font-bold hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors ${value === opt ? 'text-blue-600 bg-blue-50/50 dark:bg-blue-900/20' : 'text-slate-600 dark:text-gray-300'}`}
              >
                {opt}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export const Onboarding: React.FC<OnboardingProps> = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // Start at 0 for selection/privacy
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customJobInput, setCustomJobInput] = useState('');
  const [customAdminInput, setCustomAdminInput] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(true); // Default to true to skip initial privacy screen
  const [showPolicyOverlay, setShowPolicyOverlay] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [showPendingApprovalModal, setShowPendingApprovalModal] = useState(false);
  
  // Organization Mention State
  const [orgResults, setOrgResults] = useState<{ id: string, name: string }[]>([]);
  const [isSearchingOrgs, setIsSearchingOrgs] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<{ id: string, name: string } | null>(null);

  useScrollLock(showPolicyOverlay || showPendingApprovalModal);

  const [registrationType, setRegistrationType] = useState<'personal' | 'organization' | null>(null);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Image Cropping State
  const [showImageCropModal, setShowImageCropModal] = useState(false);
  const [imageCropSrc, setImageCropSrc] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setError("La imagen es demasiado grande (máx 5MB)");
        return;
      }
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageCropSrc(reader.result?.toString() || null);
        setShowImageCropModal(true);
        // Reset input so same file can be selected again if needed
        if (fileInputRef.current) fileInputRef.current.value = '';
      });
      reader.readAsDataURL(file);
    }
  };

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);


  // ... (imports remain the same)

  // ...

  const [formData, setFormData] = useState<Partial<UserType> & { organizationName?: string }>({
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
    avatar: '/img/imagen-por-defecto.png', // Changed default avatar
    organizationName: '',
    bio: ''
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
      name: registrationType === 'organization' ? formData.organizationName : formData.name,
      last_name: registrationType === 'organization' ? '' : formData.lastName,
      username: formData.username,
      avatar: formData.avatar,
      position: formData.position,
      department: formData.department,
      job_category: finalJobCategory,
      administration_type: finalAdminType,
      country: formData.country,
      region: formData.region,
      interests: formData.interests,
      birth_date: formData.birthDate || null, // Ensure empty string becomes null
      is_organization: registrationType === 'organization',
      linked_organization_id: selectedOrg?.id || null,
      // Extra fields if needed for future
      // Map Organization Objective to Bio column
      bio: formData.bio || '',
      // organization_objective: formData.organizationObjective || '' // Removed to use 'bio' column
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
        setStep(1); // Go back to input step to show error
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
            status: 'pending'
          });

        if (profileError) {
          console.error("Error creating profile:", JSON.stringify(profileError));
          setError("Cuenta creada, pero hubo un error guardando el perfil. Contacta con soporte.");
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


  const isStepValid = () => {
    if (step === 0) return true;

    if (registrationType === 'organization') {
      if (step === 1) {
        return !!(
          formData.organizationName &&
          formData.bio &&
          formData.username &&
          formData.email &&
          formData.password &&
          confirmPassword &&
          formData.password === confirmPassword &&
          formData.country &&
          formData.region &&
          !usernameError &&
          !emailError &&
          !passwordError
        );
      } else if (step === 2) {
        return (formData.interests?.length || 0) >= 1;
      } else if (step === 3) {
        return true; // Profile photo optional
      }
    }

    switch (step) {
      case 1: {
        const isBasicValid = !!(
          formData.name &&
          formData.lastName &&
          formData.username &&
          formData.email &&
          formData.password &&
          formData.birthDate &&
          confirmPassword &&
          formData.password === confirmPassword &&
          !usernameError &&
          !emailError &&
          !passwordError
        );

        if (!isBasicValid) return false;

        const birthDate = new Date(formData.birthDate);
        const eighteenYearsAgo = new Date();
        eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
        return birthDate <= eighteenYearsAgo;
      }
      case 2: return formData.jobCategory === 'Otro' ? !!customJobInput.trim() : !!formData.jobCategory;
      case 3: return formData.administrationType === 'Otra' ? !!customAdminInput.trim() : !!formData.administrationType;
      case 4: return !!(formData.position && formData.department);
      case 5: return !!(formData.country && formData.region);
      case 6: return (formData.interests?.length || 0) >= 1;
      case 7: return true; // Profile photo is optional (has default)
      default: return false;
    }
  };



  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-6">
      <div className="max-w-3xl w-full bg-white dark:bg-[#0a0a0a] rounded-3xl px-10 py-8 relative overflow-hidden border border-slate-100 dark:border-zinc-900">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100">
          <div
            className="h-full bg-blue-600 transition-all duration-700 ease-in-out"
            style={{
              width: `${((step - 1) / (registrationType === 'organization' ? 3 : 7)) * 100}%`
            }}
          />
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-bold rounded-2xl border border-red-100 flex items-center space-x-2 animate-in fade-in zoom-in-95">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            <span>{error}</span>
          </div>
        )}

        <div className="mb-6 min-h-[400px] flex flex-col justify-start pt-2">

          {/* ACCOUNT SELECTION - NOW THE FIRST SCREEN */}
          {step === 0 && registrationType === null && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">Selecciona el tipo de cuenta</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                  onClick={() => { setRegistrationType('personal'); setStep(1); }}
                  className="p-5 rounded-2xl border-2 border-slate-100 dark:border-zinc-800 bg-white dark:bg-[#0a0a0a] hover:border-blue-500 hover:bg-blue-50/50 transition-all group text-left relative overflow-hidden"
                >
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <UserIcon size={24} />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">Cuenta Personal</h3>
                  <p className="text-slate-500 dark:text-gray-400 text-xs font-medium leading-relaxed">
                    Para profesionales del sector público que quieren conectar, aprender y compartir.
                  </p>
                </button>

                <button
                  onClick={() => { setRegistrationType('organization'); setStep(1); }}
                  className="p-6 rounded-2xl border-2 border-slate-100 dark:border-zinc-800 bg-white dark:bg-[#0a0a0a] hover:border-purple-500 hover:bg-purple-50/50 transition-all group text-left relative overflow-hidden"
                >
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 text-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Building size={24} />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">Cuenta Organización</h3>
                  <p className="text-slate-500 dark:text-gray-400 text-xs font-medium leading-relaxed">
                    Para instituciones y entidades que desean tener presencia oficial en la red.
                  </p>
                </button>
              </div>

              {/* Implicit Privacy Acceptance */}
              <div className="text-center">
                <button
                  onClick={() => setShowPolicyOverlay(true)}
                  className="text-xs text-slate-400 font-medium hover:text-blue-500 hover:underline transition-colors"
                >
                  Al continuar, aceptas nuestra Política de Privacidad
                </button>
              </div>
            </div>
          )}

          {/* PERSONAL FLOW */}
          {registrationType === 'personal' && step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">Crea tu cuenta</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest ml-1">Nombre</label>
                  <input type="text" value={formData.name} onChange={e => updateField('name', e.target.value)} className="w-full px-5 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white" placeholder="Ej. Ana" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest ml-1">Apellidos</label>
                  <input type="text" value={formData.lastName} onChange={e => updateField('lastName', e.target.value)} className="w-full px-5 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white" placeholder="Ej. García López" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest ml-1">Nombre de usuario</label>
                  <div className="relative">
                    <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input
                      type="text"
                      value={formData.username}
                      onChange={e => updateField('username', e.target.value.toLowerCase().replace(/\s/g, ''))}
                      onBlur={() => { if (formData.username) checkAvailability(); }}
                      className={`w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-zinc-900 border ${usernameError ? 'border-red-300 focus:ring-red-200' : 'border-slate-100 dark:border-zinc-800 focus:ring-blue-500'} rounded-2xl text-sm font-bold focus:ring-2 outline-none transition-all dark:text-white`}
                      placeholder="novo"
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
                  <label className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest ml-1">Fecha de nacimiento</label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                    onChange={e => updateField('birthDate', e.target.value)}
                    className="w-full px-5 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest ml-1">Correo institucional</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => updateField('email', e.target.value)}
                    onBlur={() => { if (formData.email) checkAvailability(); }}
                    className={`w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-zinc-900 border ${emailError ? 'border-red-300 focus:ring-red-200' : 'border-slate-100 dark:border-zinc-800 focus:ring-blue-500'} rounded-2xl text-sm font-bold focus:ring-2 outline-none transition-all dark:text-white`}
                    placeholder="novo@novagob.org"
                  />
                </div>
                {emailError && (
                  <div className="flex items-center space-x-1 mt-1 ml-1 text-red-500 animate-in slide-in-from-top-1">
                    <AlertCircle size={12} />
                    <span className="text-xs font-bold">{emailError}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest ml-1">Contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={e => updateField('password', e.target.value)}
                      className={`w-full pl-12 pr-12 py-3 bg-slate-50 dark:bg-zinc-900 border ${passwordError ? 'border-red-300 focus:ring-red-200' : 'border-slate-100 dark:border-zinc-800 focus:ring-blue-500'} rounded-2xl text-sm font-bold focus:ring-2 outline-none transition-all dark:text-white`}
                      placeholder="Mínimo 8 caracteres"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {passwordError && (
                    <div className="flex items-center space-x-1 mt-1 ml-1 text-red-500 animate-in slide-in-from-top-1">
                      <AlertCircle size={12} />
                      <span className="text-xs font-bold">{passwordError}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest ml-1">Confirmar Contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className={`w-full pl-12 pr-12 py-3 bg-slate-50 dark:bg-zinc-900 border ${confirmPassword && formData.password !== confirmPassword ? 'border-red-300 focus:ring-red-200' : 'border-slate-100 dark:border-zinc-800 focus:ring-blue-500'} rounded-2xl text-sm font-bold focus:ring-2 outline-none transition-all dark:text-white`}
                      placeholder="Repite la contraseña"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {registrationType === 'personal' && step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-2">Tipo de puesto que desempeñas</h2>
                <p className="text-slate-500 dark:text-gray-400 font-medium text-sm">Indica tu nivel de responsabilidad actual</p>
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

          {registrationType === 'personal' && step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-2">Tipo de organización</h2>
              </div>
              <div className="grid grid-cols-1 gap-3 w-full">
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
                <div className="animate-in slide-in-from-top-4 duration-300 space-y-2 w-full">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Especifica el tipo de administración</label>
                  <div className="relative">
                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                    <input
                      type="text"
                      value={customAdminInput}
                      onChange={(e) => setCustomAdminInput(e.target.value)}
                      placeholder="Escribe el tipo de entidad aquí..."
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-slate-900"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {registrationType === 'personal' && step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Tu puesto actual</h2>
              </div>
              <div className="space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest ml-1">Especialización</label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input type="text" value={formData.position} onChange={e => updateField('position', e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white text-sm" placeholder="Ej. Responsable de Innovación" />
                  </div>
                </div>
                <div className="space-y-1 relative">
                  <label className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest ml-1">Nombre de la organización</label>
                  <div className="relative">
                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input
                      type="text"
                      value={formData.department}
                      onChange={e => {
                        updateField('department', e.target.value);
                        searchOrganizations(e.target.value);
                        if (selectedOrg) setSelectedOrg(null);
                      }}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white text-sm"
                      placeholder="Ej. Ayuntamiento de Madrid"
                    />
                    {isSearchingOrgs && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <Loader2 size={16} className="animate-spin text-blue-500" />
                      </div>
                    )}
                  </div>

                  {orgResults.length > 0 && (
                    <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                      {orgResults.map(org => (
                        <button
                          key={org.id}
                          type="button"
                          onClick={() => {
                            setSelectedOrg(org);
                            updateField('department', org.name);
                            setOrgResults([]);
                          }}
                          className="w-full text-left px-5 py-3 text-sm font-bold hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors flex items-center space-x-3"
                        >
                          <Building size={16} className="text-blue-500" />
                          <span className="text-slate-700 dark:text-slate-200">{org.name}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedOrg && (
                    <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-xl flex items-center justify-between animate-in zoom-in-95">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 size={16} className="text-blue-600" />
                        <span className="text-xs font-bold text-blue-700 dark:text-blue-400">Cuenta vinculada: {selectedOrg.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedOrg(null);
                        }}
                        className="text-blue-600 hover:text-blue-800 p-1"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {registrationType === 'personal' && step === 5 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Tu ubicación</h2>
              </div>
              <div className="space-y-6 relative">
                <SelectDrop
                  label="País"
                  value={formData.country || ''}
                  options={COUNTRIES}
                  onChange={val => {
                    updateField('country', val);
                    if (val === 'Otro') {
                      updateField('region', 'Otra');
                    } else {
                      updateField('region', '');
                    }
                  }}
                  placeholder="Selecciona un país..."
                />
                <SelectDrop
                  label="Región / Comunidad"
                  value={formData.region || ''}
                  options={formData.country ? COUNTRIES_DATA[formData.country] || [] : []}
                  onChange={val => updateField('region', val)}
                  placeholder="Selecciona una región..."
                  disabled={!formData.country}
                />
              </div>
            </div>
          )}

          {registrationType === 'personal' && step === 6 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Tus intereses</h2>
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
                      className={`px-4 py-2 rounded-xl border-2 text-xs font-black transition-all transform active:scale-95 ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white dark:bg-[#0a0a0a] border-slate-100 dark:border-zinc-800 text-slate-500 dark:text-gray-400 hover:border-blue-100'}`}
                    >
                      {topic}
                    </button>
                  );
                })}
              </div>
            </div>

          )}

          {registrationType === 'personal' && step === 7 && (
            <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-4 duration-500 text-center">
              <div className="text-center">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Foto de perfil</h2>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-slate-100 shadow-xl relative bg-slate-50">
                    <img
                      src={getSafeAvatar(formData.avatar)}
                      alt="Avatar Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="text-white" size={32} />
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 p-3 bg-blue-600 text-white rounded-full shadow-lg transform group-hover:scale-110 transition-transform">
                    <Pencil size={18} />
                  </div>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileSelect}
                />
              </div>
            </div>
          )}

          {/* ORGANIZATION FLOW */}
          {registrationType === 'organization' && step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Crea tu cuenta de Organización</h2>
                <p className="text-slate-500 dark:text-gray-400 font-medium mt-2 text-sm">Registra tu entidad en NovaGob</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest ml-1">Nombre de tu organización</label>
                  <div className="relative">
                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input
                      type="text"
                      value={formData.organizationName}
                      onChange={e => updateField('organizationName', e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                      placeholder="Ej. Ayuntamiento de..."
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest ml-1">Biografía</label>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={160}
                      value={formData.bio || ''}
                      onChange={e => updateField('bio', e.target.value)}
                      className="w-full px-5 py-3 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                      placeholder="Ej. Descripción de la entidad..."
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                      {(formData.bio?.length || 0)}/160
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
                  <SelectDrop
                    label="País"
                    value={formData.country || ''}
                    options={COUNTRIES}
                    onChange={val => {
                      updateField('country', val);
                      if (val === 'Otro') {
                        updateField('region', 'Otra');
                      } else {
                        updateField('region', '');
                      }
                    }}
                    placeholder="Selecciona..."
                    icon={<Globe size={16} />}
                  />
                  <SelectDrop
                    label="Región"
                    value={formData.region || ''}
                    options={formData.country ? COUNTRIES_DATA[formData.country] || [] : []}
                    onChange={val => updateField('region', val)}
                    placeholder="Selecciona..."
                    disabled={!formData.country}
                    icon={<MapPin size={16} />}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest ml-1">Nombre de usuario</label>
                    <div className="relative">
                      <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input
                        type="text"
                        value={formData.username}
                        onChange={e => updateField('username', e.target.value.toLowerCase().replace(/\s/g, ''))}
                        onBlur={() => { if (formData.username) checkAvailability(); }}
                        className={`w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-zinc-900 border ${usernameError ? 'border-red-300 focus:ring-red-200' : 'border-slate-100 dark:border-zinc-800 focus:ring-blue-500'} rounded-2xl text-sm font-bold focus:ring-2 outline-none transition-all dark:text-white`}
                        placeholder="ayuntamientex"
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
                    <label className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest ml-1">Correo electrónico</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={e => updateField('email', e.target.value)}
                        onBlur={() => { if (formData.email) checkAvailability(); }}
                        className={`w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-zinc-900 border ${emailError ? 'border-red-300 focus:ring-red-200' : 'border-slate-100 dark:border-zinc-800 focus:ring-blue-500'} rounded-2xl text-sm font-bold focus:ring-2 outline-none transition-all dark:text-white`}
                        placeholder="contacto@organizacion.com"
                      />
                    </div>
                    {emailError && (
                      <div className="flex items-center space-x-1 mt-1 ml-1 text-red-500 animate-in slide-in-from-top-1">
                        <AlertCircle size={12} />
                        <span className="text-xs font-bold">{emailError}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest ml-1">Contraseña</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={e => updateField('password', e.target.value)}
                        className={`w-full pl-12 pr-12 py-3 bg-slate-50 dark:bg-zinc-900 border ${passwordError ? 'border-red-300 focus:ring-red-200' : 'border-slate-100 dark:border-zinc-800 focus:ring-blue-500'} rounded-2xl text-sm font-bold focus:ring-2 outline-none transition-all dark:text-white`}
                        placeholder="Mínimo 8 caracteres"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest ml-1">Confirmar Contraseña</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className={`w-full pl-12 pr-12 py-3 bg-slate-50 dark:bg-zinc-900 border ${confirmPassword && formData.password !== confirmPassword ? 'border-red-300 focus:ring-red-200' : 'border-slate-100 dark:border-zinc-800 focus:ring-blue-500'} rounded-2xl text-sm font-bold focus:ring-2 outline-none transition-all dark:text-white`}
                        placeholder="Repite la contraseña"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {registrationType === 'organization' && step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Intereses de la organización</h2>
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
                      className={`px-4 py-2 rounded-xl border-2 text-xs font-black transition-all transform active:scale-95 ${isSelected ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white dark:bg-[#0a0a0a] border-slate-100 dark:border-zinc-800 text-slate-500 dark:text-gray-400 hover:border-purple-100'}`}
                    >
                      {topic}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {registrationType === 'organization' && step === 3 && (
            <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-4 duration-500 text-center">
              <div className="text-center">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Logo de la organización</h2>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-slate-100 shadow-xl relative bg-slate-50">
                    <img
                      src={getSafeAvatar(formData.avatar)}
                      alt="Avatar Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="text-white" size={32} />
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 p-3 bg-purple-600 text-white rounded-full shadow-lg transform group-hover:scale-110 transition-transform">
                    <Pencil size={18} />
                  </div>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileSelect}
                />
              </div>
            </div>
          )}


        </div>

        <div className="flex gap-4">
          <button
            onClick={() => {
              if (step === 0 && registrationType !== null) {
                setRegistrationType(null); // Go back to selection
              } else if (step === 1 && registrationType === 'organization') {
                setRegistrationType(null); setStep(0); // Back from org form
              } else if (step === 1) {
                if (registrationType === 'personal') {
                  setRegistrationType(null); setStep(0);
                } else {
                  navigate('/inicio-sesion');
                }
              } else if (step === 0) {
                navigate('/inicio-sesion');
              } else {
                prevStep();
              }
            }}
            className="flex-1 py-3.5 rounded-2xl bg-slate-100 text-slate-500 font-black flex items-center justify-center space-x-2 hover:bg-slate-200 transition-all"
          >
            <ArrowLeft size={20} />
            <span>{(step === 0 && registrationType === null) ? 'Cancelar' : 'Atrás'}</span>
          </button>

          {(registrationType !== null || (step === 0 && !privacyAccepted)) && (
            <button
              onClick={async () => {
                // Validaciones manuales
                if (!isStepValid()) {
                  if (step === 0 && !privacyAccepted) {
                    // No action needed really, button shouldn't show or be clickable if handled right, 
                    // but we show "Ver política" button instead above.
                  } else if (registrationType === 'personal') {
                    if (step === 1) {
                      if (!formData.name) setError("Por favor, introduce tu nombre.");
                      else if (!formData.lastName) setError("Por favor, introduce tus apellidos.");
                      else if (!formData.username) setError("Por favor, elige un nombre de usuario.");
                      else if (!formData.birthDate) setError("Por favor, selecciona tu fecha de nacimiento.");
                      else {
                        const birthDate = new Date(formData.birthDate);
                        const eighteenYearsAgo = new Date();
                        eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
                        if (birthDate > eighteenYearsAgo) {
                          setError("Debes tener al menos 18 años para registrarte.");
                        } else if (!formData.email) setError("Por favor, introduce tu correo institucional.");
                        else if (!formData.password) setError("Por favor, crea una contraseña.");
                        else if (formData.password !== confirmPassword) setError("Las contraseñas no coinciden.");
                        else setError("Por favor, completa todos los campos.");
                      }
                    } else if (step === 2) {
                      setError("Por favor, selecciona una categoría profesional.");
                    } else if (step === 3) {
                      setError("Por favor, selecciona un tipo de organización.");
                    } else if (step === 4) {
                      setError("Por favor, completa tu puesto y organización.");
                    } else if (step === 5) {
                      setError("Por favor, selecciona tu país y región.");
                    } else if (step === 6) {
                      setError("Por favor, selecciona al menos 1 interés.");
                    }
                  } else if (registrationType === 'organization') {
                    if (!formData.organizationName) setError("Introduce el nombre de la organización.");
                    else if (!formData.bio) setError("Introduce el objetivo principal.");
                    else if (!formData.username) setError("Elige un nombre de usuario.");
                    else if (!formData.email) setError("Introduce el correo electrónico.");
                    else if (!formData.password) setError("Crea una contraseña.");
                    else if (formData.password !== confirmPassword) setError("Las contraseñas no coinciden.");
                  }
                  return;
                }

                if (step === 1 && registrationType === 'personal') {
                  // Personal Step 1 Logic
                  let valid = true;
                  if (!validateEmail(formData.email || '')) {
                    setEmailError("Correo electrónico no válido"); valid = false;
                  }
                  if ((formData.password || '').length < 8) {
                    setPasswordError("Mínimo 8 caracteres"); valid = false;
                  }
                  if (formData.password !== confirmPassword) {
                    setError("Las contraseñas no coinciden"); valid = false;
                  }

                  if (!valid) return;

                  try {
                    const isAvailable = await checkAvailability();
                    if (isAvailable) nextStep();
                  } catch (err) { setError("Error al verificar disponibilidad."); }

                } else if (registrationType === 'personal' && step < 7) {
                  nextStep();
                } else if (registrationType === 'personal' && step === 7) {
                  handleFinalize();
                } else if (registrationType === 'organization') {

                  if (step === 1) {
                    let valid = true;
                    if (!validateEmail(formData.email || '')) {
                      setEmailError("Correo no válido"); valid = false;
                    }
                    if ((formData.password || '').length < 8) {
                      setPasswordError("Mínimo 8 caracteres"); valid = false;
                    }
                    if (formData.password !== confirmPassword) {
                      setError("Las contraseñas no coinciden"); valid = false;
                    }

                    if (!valid) return;

                    try {
                      const isAvailable = await checkAvailability();
                      if (isAvailable) nextStep();
                    } catch (err) { setError("Error al verificar disponibilidad."); }
                  } else if (step < 3) {
                    nextStep();
                  } else {
                    handleFinalize();
                  }
                }
              }}
              disabled={loading || isChecking}
              className={`flex-[2] py-3.5 rounded-2xl font-black flex items-center justify-center space-x-2 transition-all transform active:scale-95 ${!isStepValid() || loading || isChecking ? 'bg-blue-400 cursor-not-allowed opacity-70' : (registrationType === 'organization' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700') + ' text-white shadow-lg'}`}
            >
              {loading || isChecking ? (
                <Loader2 className="animate-spin text-white" size={24} />
              ) : (
                <>
                  <span className="text-white">
                    {registrationType === 'organization' ? (step === 3 ? 'Crear cuenta' : 'Siguiente') : (step === 7 ? 'Completar registro' : 'Siguiente')}
                  </span>
                  {!((registrationType === 'organization' && step === 3) || (registrationType === 'personal' && step === 7)) && <ArrowRight size={20} className="text-white" />}
                </>
              )}
            </button>
          )}
          {step === 0 && !!privacyAccepted && registrationType === null && (
            // Hidden next button in selection screen, forcing choice
            null
          )}
        </div>
      </div>

      {
        showPolicyOverlay && createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
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
                  onClick={() => { setPrivacyAccepted(true); setShowPolicyOverlay(false); setStep(0); }}
                  className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all"
                >
                  He leído y acepto los términos
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      }

      {
        showPendingApprovalModal && createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white max-w-md w-full rounded-3xl p-8 text-center shadow-2xl animate-in zoom-in-95">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock size={32} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Solicitud enviada</h3>
              <p className="text-slate-600 mb-6 leading-relaxed">
                Tu registro ha sido completado con éxito. Ahora, un administrador debe revisar y aprobar tu solicitud.
                Recibirás una notificación cuando tu cuenta esté activa.
              </p>
              <button
                onClick={() => navigate('/inicio-sesion')}
                className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>,
          document.body
        )
      }
      {
        showImageCropModal && imageCropSrc && (
          <ImageCropModal
            image={imageCropSrc}
            onClose={() => setShowImageCropModal(false)}
            onSave={(croppedImage) => {
              updateField('avatar', croppedImage);
              setShowImageCropModal(false);
            }}
          />
        )
      }
    </div >
  );
};
