import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, CheckCircle2, Lock, Gift, ChevronRight } from 'lucide-react';
import { LEVELS, getLevelInfo } from '../utils/gamificationUtils';

interface LevelsListModalProps {
    currentNovas: number;
    onClose: () => void;
}

export const LevelsListModal: React.FC<LevelsListModalProps> = ({ currentNovas, onClose }) => {
    const navigate = useNavigate();
    const [showAllLevels, setShowAllLevels] = React.useState(false);

    React.useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'unset'; };
    }, []);

    const currentStatus = getLevelInfo(currentNovas);

    // Calculate progress
    const nextThreshold = currentStatus.nextThreshold;
    const currentThreshold = currentStatus.threshold;
    const progress = nextThreshold
        ? Math.min(100, Math.max(0, ((currentNovas - currentThreshold) / (nextThreshold - currentThreshold)) * 100))
        : 100;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
            <div className="bg-white dark:bg-[#0a0a0a] w-full max-w-2xl rounded-[2.5rem] overflow-hidden animate-in zoom-in-95 duration-300 border border-white dark:border-zinc-800 max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>

                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-50 dark:border-zinc-900 flex justify-between items-center bg-white dark:bg-[#0a0a0a] sticky top-0 z-10">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white">Nivel Novagober</h3>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Tu progreso en la comunidad</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 dark:hover:bg-zinc-900 rounded-full text-slate-400 transition-all"><X size={24} /></button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto p-6 space-y-8 flex-1">
                    {/* Progress Section */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-3xl p-6 border border-blue-100 dark:border-blue-900/30">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-1">Nivel Actual</span>
                                <h2
                                    className="text-3xl font-black text-blue-900 dark:text-white cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-2"
                                    onClick={() => setShowAllLevels(!showAllLevels)}
                                >
                                    {currentStatus.rank}
                                    <ChevronRight size={24} className={`text-blue-500 transition-transform duration-300 ${showAllLevels ? 'rotate-90' : ''}`} />
                                </h2>
                            </div>
                            <div className="text-right">
                                <span className="text-3xl font-black text-blue-600 dark:text-blue-400">{currentNovas}</span>
                                <span className="text-xs font-bold text-blue-400 dark:text-blue-500 uppercase ml-1 block">Novas Totales</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="h-4 w-full bg-white/50 dark:bg-black/20 rounded-full overflow-hidden p-1 backdrop-blur-sm">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-1000 ease-out"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
                                <span>Nivel {currentStatus.level}</span>
                                {nextThreshold ? <span>Siguiente: Nivel {currentStatus.level + 1}</span> : <span>Nivel Máximo</span>}
                            </div>
                        </div>
                    </div>

                    {/* All Levels List (Toggleable) */}
                    {showAllLevels && (
                        <div className="space-y-4 animate-in slide-in-from-top-4 fade-in duration-300">
                            <h4 className="text-lg font-black text-slate-900 dark:text-white px-2">Todos los niveles</h4>
                            <div className="space-y-3">
                                {LEVELS.map((lvl, index) => {
                                    const isUnlocked = currentNovas >= lvl.threshold;
                                    const isCurrent = currentStatus.rank === lvl.name;
                                    const Icon = lvl.icon;

                                    return (
                                        <div
                                            key={lvl.name}
                                            className={`relative p-4 rounded-3xl border transition-all ${isCurrent
                                                ? 'bg-white dark:bg-[#111] border-blue-500 ring-4 ring-blue-500/10 z-10 scale-[1.02]'
                                                : isUnlocked
                                                    ? 'bg-white dark:bg-[#111] border-slate-100 dark:border-zinc-800 opacity-100'
                                                    : 'bg-slate-50 dark:bg-zinc-900/50 border-slate-100 dark:border-zinc-800 opacity-60 grayscale'
                                                }`}
                                        >
                                            <div className="flex items-center space-x-4">
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${isUnlocked ? `${lvl.bg} ${lvl.color}` : 'bg-slate-200 text-slate-400 dark:bg-zinc-800 dark:text-zinc-600'}`}>
                                                    <Icon size={24} />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center space-x-2">
                                                        <h4 className={`font-black text-lg ${isUnlocked ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>{lvl.name}</h4>
                                                        {isCurrent && <span className="px-2 py-0.5 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] font-black uppercase tracking-wider rounded-full">Actual</span>}
                                                    </div>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-snug">{lvl.desc}</p>
                                                </div>

                                                <div className="text-right shrink-0 min-w-[60px]">
                                                    {isUnlocked ? (
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-xs font-black text-slate-300 uppercase tracking-widest">Min</span>
                                                            <span className={`text-lg font-black ${isCurrent ? 'text-blue-600' : 'text-slate-700 dark:text-slate-300'}`}>{lvl.threshold}</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center">
                                                            <Lock size={20} className="text-slate-300 mb-1" />
                                                            <span className="text-[10px] font-black text-slate-300">{lvl.threshold}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer with Rewards Button */}
                <div className="p-6 border-t border-slate-50 dark:border-zinc-900 bg-white dark:bg-[#0a0a0a]">
                    <button
                        onClick={() => {
                            onClose();
                            navigate('/store');
                        }}
                        className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl font-black text-lg hover:from-emerald-600 hover:to-teal-700 transition-all flex items-center justify-center space-x-2 active:scale-[0.98]"
                    >
                        <Gift size={24} />
                        <span>Ver Recompensas Disponibles</span>
                        <ChevronRight size={20} className="opacity-70" />
                    </button>
                </div>
            </div>
        </div>
    );
};
