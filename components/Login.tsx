
import React, { useState, useEffect } from 'react';
import { Lock, User, ShieldCheck, Loader2, Check, ArrowLeft, Mail, AtSign } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface LoginProps {
  onLogin: () => void;
  onRegister: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, onRegister }) => {
  const [identifier, setIdentifier] = useState(''); 
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [isRecoverySent, setIsRecoverySent] = useState(false);

  const STORAGE_KEY = 'remembered_identifier';

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
        .eq(isEmail ? 'email' : 'username', id.toLowerCase())
        .single();
      
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

    // Login por username: buscar el email asociado
    if (!emailToUse.includes('@')) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', emailToUse.toLowerCase())
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
      onLogin();
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(recoveryEmail, {
      redirectTo: window.location.origin,
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
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-[#0a0a0a] rounded-[40px] p-10 space-y-8 border border-gray-100 dark:border-zinc-900 animate-in fade-in zoom-in-95 duration-300">
          <button 
            onClick={() => { setIsForgotPassword(false); setIsRecoverySent(false); setError(null); }}
            className="flex items-center space-x-2 text-gray-400 hover:text-blue-600 transition-colors group"
          >
            <ArrowLeft size={20} />
            <span className="text-xs font-black uppercase">Volver al inicio</span>
          </button>

          {!isRecoverySent ? (
            <>
              <div className="text-center space-y-3">
                <div className="inline-flex p-4 bg-blue-50 dark:bg-zinc-900 rounded-2xl text-blue-600 mb-2">
                  <Lock size={32} />
                </div>
                <h2 className="text-3xl font-black text-gray-900 dark:text-white">Recuperar cuenta</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Introduce tu correo institucional.</p>
              </div>

              <form onSubmit={handleForgotPassword} className="space-y-6">
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl border border-red-100 dark:border-red-800">
                    {error}
                  </div>
                )}
                
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 dark:text-zinc-600 uppercase ml-1">Correo Institucional</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="email" 
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      placeholder="nombre@gob.es"
                      required
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-zinc-900 border-none rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !recoveryEmail}
                  className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black hover:bg-blue-700 transition-all transform active:scale-95 flex items-center justify-center disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : 'Enviar instrucciones'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center space-y-6 animate-in zoom-in-95 duration-500">
              <div className="mx-auto w-20 h-20 bg-green-50 dark:bg-green-900/20 text-green-500 rounded-full flex items-center justify-center">
                <Check size={40} strokeWidth={3} />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">Correo enviado</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Instrucciones enviadas a <span className="text-blue-600 font-black">{recoveryEmail}</span>.</p>
              </div>
              <button 
                onClick={() => setIsForgotPassword(false)}
                className="w-full py-4 bg-gray-100 dark:bg-zinc-900 text-gray-600 dark:text-gray-300 rounded-2xl font-black text-sm hover:bg-gray-200 transition-all"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-[#0a0a0a] rounded-3xl p-10 space-y-8 border border-gray-100 dark:border-zinc-900">
        <div className="text-center space-y-3">
          <div className="inline-flex p-4 bg-blue-50 dark:bg-zinc-900 rounded-2xl text-blue-600 mb-2">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white leading-tight">
            {getWelcomeMessage()}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Acceso para personal de la administración pública.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
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
                  placeholder="Ej. anagarcia o ana@gob.es"
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
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-zinc-900 border-none rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
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

        <div className="text-center pt-4 border-t border-gray-50 dark:border-zinc-900">
          <p className="text-xs text-gray-400 font-medium">
            ¿No tienes cuenta?{' '}
            <button 
              onClick={onRegister}
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
