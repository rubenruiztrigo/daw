
import React from 'react';
import { ShoppingBag, Construction, Star } from 'lucide-react';
import { User, calculateNovas } from '../types';

interface StoreViewProps {
    user: User;
}

export const StoreView: React.FC<StoreViewProps> = ({ user }) => {
    const points = calculateNovas(user.badges);

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8 text-center sm:text-left">
                <div className="flex items-center space-x-4">
                    <div className="p-3 bg-pink-50 dark:bg-pink-900/20 rounded-2xl text-pink-600">
                        <ShoppingBag size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Recompensas NovaGob</h2>
                        <p className="text-slate-500 dark:text-gray-400 text-sm font-medium">Desbloquea recompensas exclusivas al alcanzar nuevos hitos de Novas.</p>
                    </div>
                </div>

                <div className="flex items-center space-x-2 bg-gradient-to-r from-amber-200 to-yellow-400 text-amber-900 px-4 py-2 rounded-2xl border border-yellow-300">
                    <Star size={18} className="fill-amber-700 text-amber-700" />
                    <div className="flex flex-col leading-none">
                        <span className="font-black text-lg">{points}</span>
                        <span className="text-[9px] font-bold uppercase tracking-widest">Novas</span>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-[#111] rounded-[2.5rem] border border-dashed border-slate-200 dark:border-zinc-800 p-6 md:p-12 text-center">
                <div className="mx-auto w-20 h-20 bg-slate-50 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-6 text-slate-400">
                    <Construction size={40} />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Próximamente</h3>
                <p className="text-slate-500 dark:text-gray-400 max-w-md mx-auto">
                    Estamos diseñando las recompensas que se desbloquearán automáticamente al alcanzar diferentes niveles de prestigio (Novas) en la red.
                </p>
            </div>
        </div>
    );
};
