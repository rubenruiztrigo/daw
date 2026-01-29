
import React, { useState } from 'react';
import { Lock, Loader2, Check, ShieldCheck, Save, AlertCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface UpdatePasswordProps {
  onComplete: () => void;
}

export const UpdatePassword: React.FC<UpdatePasswordProps> = ({ onComplete }) => {
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
      setError('Las contraseñas no coinciden.');
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
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-[#0a0a0a] rounded-[40px] p-10 space-y-8 border border-gray-100 dark:border-zinc-900 animate-in fade-in zoom-in-95 duration-300">
        
        <div className="text-center space-y-3">
          <div className="inline-flex p-4 bg-blue-50 dark:bg-zinc-900 rounded-2xl text-blue-600 mb-2">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white">Actualizar contraseña</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Por favor, elige una nueva contraseña segura para tu cuenta institucional.</p>
        </div>

        {success ? (
          <div className="text-center space-y-6 animate-in zoom-in-95 duration-500">
            <div className="mx-auto w-20 h-20 bg-green-50 dark:bg-green-900/20 text-green-500 rounded-full flex items-center justify-center">
              <Check size={40} strokeWidth={3} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">¡Actualizada!</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Tu contraseña ha sido cambiada correctamente. Redirigiendo...</p>
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
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 dark:text-zinc-600 uppercase ml-1">Nueva contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-zinc-900 border-none rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 dark:text-zinc-600 uppercase ml-1">Repetir contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-zinc-900 border-none rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !newPassword || !confirmPassword}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black hover:bg-blue-700 transition-all transform active:scale-95 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <Save size={20} />
                  <span>Guardar cambios</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
