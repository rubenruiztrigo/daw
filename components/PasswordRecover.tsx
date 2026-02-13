
import React, { useState } from 'react';
import { Lock, Loader2, Check, ShieldCheck, Save, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface UpdatePasswordProps {
  onComplete: () => void;
}

export const PasswordRecover: React.FC<UpdatePasswordProps> = ({ onComplete }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las nuevas contraseñas no coinciden.');
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
      setTimeout(() => {
        onComplete();
        window.location.href = '/'; // Hard redirect to clear session/state if needed, or just let App handle it
      }, 2500);
    }
  };

  return (
    <div className="min-h-screen bg-transparent dark:bg-transparent flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-[#0a0a0a] rounded-[40px] p-10 space-y-8 border border-gray-100 dark:border-zinc-900 animate-in fade-in zoom-in-95 duration-300">

        <div className="text-center space-y-3">
          <div className="inline-flex p-5 bg-blue-50 dark:bg-zinc-900 rounded-[2rem] text-blue-600 mb-2">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Nueva Contraseña</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-relaxed px-4">
            Has confirmado tu identidad. Por favor, elige una nueva clave de acceso segura.
          </p>
        </div>

        {success ? (
          <div className="text-center space-y-8 animate-in zoom-in-95 duration-500 py-4">
            <div className="relative inline-flex">
              <div className="absolute inset-0 bg-green-200 blur-2xl opacity-20 rounded-full" />
              <div className="relative p-6 bg-green-50 dark:bg-green-900/20 text-green-500 rounded-[2.5rem] flex items-center justify-center">
                <CheckCircle2 size={48} strokeWidth={3} />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">¡Actualizada!</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Tu contraseña ha sido cambiada con éxito. Estamos redirigiéndote al inicio...</p>
            </div>
            <div className="flex justify-center">
              <Loader2 className="animate-spin text-green-500" size={32} />
            </div>
          </div>
        ) : (
          <form onSubmit={handleUpdate} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-2xl border border-red-100 dark:border-red-900/30 flex items-center space-x-3">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 dark:text-zinc-600 uppercase tracking-widest ml-1">Escribe la nueva contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    required
                    className="w-full pl-12 pr-5 py-4 bg-gray-50 dark:bg-zinc-900 border border-transparent rounded-[1.5rem] text-gray-900 dark:text-white font-bold placeholder-gray-400 focus:ring-4 focus:ring-blue-500/20 focus:bg-white outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 dark:text-zinc-600 uppercase tracking-widest ml-1">Repite la contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirmar contraseña"
                    required
                    className="w-full pl-12 pr-5 py-4 bg-gray-50 dark:bg-zinc-900 border border-transparent rounded-[1.5rem] text-gray-900 dark:text-white font-bold placeholder-gray-400 focus:ring-4 focus:ring-blue-500/20 focus:bg-white outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || !newPassword || !confirmPassword}
                className="w-full bg-blue-600 text-white py-5 rounded-[1.5rem] font-black hover:bg-blue-700 transition-all transform active:scale-95 flex items-center justify-center space-x-3 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={24} />
                ) : (
                  <>
                    <Save size={22} />
                    <span>Guardar Nueva Contraseña</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-zinc-900/50 p-4 rounded-2xl border border-slate-100 dark:border-zinc-800 text-center">
              <p className="text-[10px] text-gray-400 font-bold flex items-center justify-center space-x-2">
                <Sparkles size={12} className="text-blue-500" />
                <span>Usa una combinación de letras, números y símbolos.</span>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
