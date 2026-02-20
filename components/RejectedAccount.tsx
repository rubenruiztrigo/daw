import React from 'react';
import { X } from 'lucide-react';

interface RejectedAccountProps {
    onLogout: () => void;
}

export const RejectedAccount: React.FC<RejectedAccountProps> = ({ onLogout }) => {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-xl">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <X size={32} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2">Solicitud rechazada</h2>
                <p className="text-slate-600 mb-8">
                    Tu solicitud de registro ha sido denegada por el administrador.
                    <br /><br />
                    Si crees que ha habido un error, ponte en contacto con <a href="mailto:info@novagob.org" className="text-brand font-bold hover:underline">info@novagob.org</a>
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
