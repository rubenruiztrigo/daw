import React from 'react';
import { Loader2 } from 'lucide-react';

interface PendingAccountProps {
    onLogout: () => void;
}

export const PendingAccount: React.FC<PendingAccountProps> = ({ onLogout }) => {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-xl">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Loader2 className="animate-spin" size={32} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2">Cuenta en revisión</h2>
                <p className="text-slate-600 mb-8">
                    Tu solicitud está pendiente de aprobación por el administrador.
                    Te notificaremos por correo electrónico cuando tu cuenta esté activa.
                </p>
                <button
                    onClick={onLogout}
                    className="px-6 py-3 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition-colors"
                >
                    Cerrar sesión
                </button>
            </div>
        </div>
    );
};
