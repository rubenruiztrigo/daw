
import React, { useState, useEffect } from 'react';
import { Lock, User, ShieldCheck, Loader2, Check, ArrowLeft, Mail, AtSign, Sparkles, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { encryptMessage, decryptMessage } from '../utils/encryption';

interface LoginProps {
}

export const Login: React.FC<LoginProps> = () => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);

  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [isRecoverySent, setIsRecoverySent] = useState(false);
  const [isLinkAccessed, setIsLinkAccessed] = useState(false);

  const STORAGE_KEY = 'remembered_identifier';

  // Poll for session when recovery email is sent to unlock "Next" button
  useEffect(() => {
    let interval: any;
    if (isRecoverySent) {
      // Direct listener for auth state changes (robust across tabs)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (session || event === 'PASSWORD_RECOVERY') {
          setIsLinkAccessed(true);
        }
      });

      interval = setInterval(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setIsLinkAccessed(true);
          clearInterval(interval);
        }
      }, 1500); // Slightly faster polling

      return () => {
        if (interval) clearInterval(interval);
        subscription.unsubscribe();
      };
    }
  }, [isRecoverySent]);

  useEffect(() => {
    const savedId = localStorage.getItem(STORAGE_KEY);
    if (savedId) {
      setIdentifier(savedId);
      setRememberMe(true);
      fetchDisplayName(savedId);
    }
  }, []);

  const fetchDisplayName = async (id: string) => {
    try {
      const isEmail = id.includes('@');
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('name')
        .eq(isEmail ? 'email' : 'username', isEmail ? id.toLowerCase() : id)
        .maybeSingle();

      if (!profileError && data?.name) {
        setDisplayName(data.name);
      }
    } catch (err) {
      console.error("Error fetching display name:", err);
    }
  };

  const handleToggleRemember = () => {
    const nextValue = !rememberMe;
    setRememberMe(nextValue);
    if (!nextValue) {
      localStorage.removeItem(STORAGE_KEY);
      setDisplayName(null);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let emailToUse = identifier.trim();

    if (!emailToUse.includes('@')) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', emailToUse)
        .maybeSingle();

      if (profileError || !profile?.email) {
        setError('El nombre de usuario no existe o no tiene un email asociado.');
        setLoading(false);
        return;
      }
      emailToUse = profile.email;
    }

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: emailToUse,
      password,
    });

    if (loginError) {
      setError("Credenciales incorrectas. Comprueba tu contraseña.");
      setLoading(false);
    } else {
      if (rememberMe) {
        localStorage.setItem(STORAGE_KEY, identifier);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
      // Removed onLogin() call as App.tsx handles redirection based on session change
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(recoveryEmail, {
      redirectTo: `${window.location.origin}/recover-password/`,
    });

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
    } else {
      setIsRecoverySent(true);
      setLoading(false);
    }
  };

  const getWelcomeMessage = () => {
    const savedId = localStorage.getItem(STORAGE_KEY);
    if (savedId && rememberMe && identifier === savedId && displayName) {
      return `Te damos la bienvenida ${displayName}`;
    }
    return "Te damos la bienvenida";
  };

  if (isForgotPassword) {
    return (
      <div className="min-h-screen bg-[#f0edff] dark:bg-[#13111a] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-[#0a0a0a] rounded-[40px] p-10 space-y-8 border border-gray-100 dark:border-zinc-900 animate-in fade-in zoom-in-95 duration-300">
          <button
            onClick={() => { setIsForgotPassword(false); setIsRecoverySent(false); setError(null); }}
            className="flex items-center space-x-2 text-gray-400 hover:text-blue-600 transition-colors group"
          >
            <ArrowLeft size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest">Volver al inicio</span>
          </button>

          {!isRecoverySent ? (
            <>
              <div className="text-center space-y-3">
                <div className="inline-flex p-5 bg-blue-50 dark:bg-zinc-900 rounded-[2rem] text-blue-600 mb-2">
                  <Lock size={32} />
                </div>
                <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Recuperar cuenta</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-relaxed px-4">
                  Enviaremos un enlace de confirmación a tu correo institucional para que puedas cambiar tu contraseña.
                </p>
              </div>

              <form onSubmit={handleForgotPassword} className="space-y-6">
                {error && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-2xl border border-red-100 dark:border-red-900/30 flex items-center space-x-3">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 dark:text-zinc-600 uppercase tracking-widest ml-1">Correo Institucional</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input
                      type="email"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      placeholder="novo@novagob.org"
                      required
                      className="w-full pl-12 pr-5 py-4 bg-gray-50 dark:bg-zinc-900 border border-transparent rounded-[1.5rem] text-gray-900 dark:text-white font-bold placeholder-gray-400 focus:ring-4 focus:ring-blue-500/20 focus:bg-white outline-none transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !recoveryEmail}
                  className="w-full bg-blue-600 text-white py-5 rounded-[1.5rem] font-black hover:bg-blue-700 transition-all transform active:scale-95 flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={24} /> : <span>Enviar Instrucciones</span>}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center space-y-8 animate-in zoom-in-95 duration-500 py-4">
              <div className="relative inline-flex">
                <div className="absolute inset-0 bg-green-200 blur-2xl opacity-20 rounded-full" />
                <div className="relative p-6 bg-green-50 dark:bg-green-900/20 text-green-500 rounded-[2.5rem] flex items-center justify-center">
                  <Check size={48} strokeWidth={3} />
                </div>
              </div>

              <div className="space-y-3">
                <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">¡Correo enviado!</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-relaxed px-2">
                  Hemos enviado un enlace a <span className="text-blue-600 font-black">{recoveryEmail}</span>.
                </p>
                <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/20 mt-4">
                  <p className="text-[11px] text-blue-600 dark:text-blue-400 font-bold">
                    💡 Haz clic en "Confirmar" en el correo y esta ventana te llevará automáticamente al formulario de nueva contraseña.
                  </p>
                </div>
              </div>

              <div className="pt-4 flex flex-col space-y-3">
                <button
                  onClick={() => window.location.reload()}
                  disabled={!isLinkAccessed}
                  className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center space-x-2 ${isLinkAccessed ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer' : 'bg-slate-100 dark:bg-zinc-900 text-slate-400 cursor-not-allowed'}`}
                >
                  {isLinkAccessed ? (
                    <>
                      <span>Siguiente</span>
                      <ArrowRight size={16} />
                    </>
                  ) : (
                    <>
                      <Lock size={14} />
                      <span>Esperando al mensaje...</span>
                    </>
                  )}
                </button>
                <p className="text-[10px] text-gray-400 font-bold">
                  {isLinkAccessed ? '¡Identidad verificada! Haz clic en Siguiente.' : 'Accede al enlace de tu correo para desbloquear el botón.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0edff] dark:bg-[#13111a] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-[#0a0a0a] rounded-3xl p-8 space-y-6 border border-gray-100 dark:border-zinc-900">
        <div className="text-center space-y-3">
          <div className="inline-flex p-4 bg-blue-50 dark:bg-zinc-900 rounded-2xl text-blue-600 mb-2">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white leading-tight">
            {getWelcomeMessage()}
          </h2>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl border border-red-100 dark:border-red-800">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 dark:text-zinc-600 uppercase ml-1">Usuario o Correo</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => {
                    const val = e.target.value;
                    setIdentifier(val);
                    if (val !== localStorage.getItem(STORAGE_KEY)) {
                      setDisplayName(null);
                    }
                  }}
                  placeholder="Ej. novo o novo@novagob.org"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-zinc-900 border-none rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 dark:text-zinc-600 uppercase ml-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-12 pr-12 py-3 bg-gray-50 dark:bg-zinc-900 border-none rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <button
                type="button"
                onClick={handleToggleRemember}
                className="flex items-center space-x-2 group cursor-pointer"
              >
                <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${rememberMe ? 'bg-blue-600 border-blue-600' : 'border-gray-200 dark:border-zinc-800 group-hover:border-blue-400'}`}>
                  {rememberMe && <Check size={14} className="text-white" strokeWidth={4} />}
                </div>
                <span className="text-xs font-bold text-gray-500 dark:text-zinc-500 group-hover:text-gray-700 dark:group-hover:text-zinc-300 transition-colors select-none">Recordar</span>
              </button>

              <button
                type="button"
                onClick={() => setIsForgotPassword(true)}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black hover:bg-blue-700 transition-all transform active:scale-95 flex items-center justify-center"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Iniciar sesión'}
          </button>
        </form>

        <div className="text-center pt-3 border-t border-gray-50 dark:border-zinc-900">
          <p className="text-xs text-gray-400 font-medium">
            ¿No tienes cuenta?{' '}
            <button
              onClick={() => navigate('/registro')}
              className="text-blue-600 font-bold hover:underline transition-all"
            >
              Regístrate ahora
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
