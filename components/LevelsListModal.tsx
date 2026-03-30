import React from 'react';
import { createPortal } from 'react-dom';
import { useScrollLock } from '../hooks/useScrollLock';
import { useNavigate } from 'react-router-dom';
import { X, CheckCircle2, Lock, Gift, ChevronRight } from 'lucide-react';
import { LEVELS, getLevelInfo } from '../utils/gamificationUtils';
import { Language, useTranslation } from '../utils/translations';

interface LevelsListModalProps {
    currentNovas: number;
    language: Language;
    onClose: () => void;
}

export const LevelsListModal: React.FC<LevelsListModalProps> = ({ currentNovas, language, onClose }) => {
    const navigate = useNavigate();
    const t = useTranslation(language);
    const [showAllLevels, setShowAllLevels] = React.useState(false);

    useScrollLock();

    const currentStatus = getLevelInfo(currentNovas, language);

    // Calculate progress
    const nextThreshold = currentStatus.nextThreshold;
    const currentThreshold = currentStatus.threshold;
    const progress = nextThreshold
        ? Math.min(100, Math.max(0, ((currentNovas - currentThreshold) / (nextThreshold - currentThreshold)) * 100))
        : 100;

    return createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
            <div className="bg-white dark:bg-[#0a0a0a] w-full max-w-2xl rounded-[2.5rem] overflow-hidden animate-in zoom-in-95 duration-300 border border-white dark:border-zinc-800 max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>

                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-50 dark:border-zinc-900 flex justify-between items-center bg-white dark:bg-[#0a0a0a] sticky top-0 z-10">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white">Nivel Novagober</h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 dark:hover:bg-zinc-900 rounded-full text-slate-400 transition-all"><X size={24} /></button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto p-6 space-y-8 flex-1">
                    {/* Progress Section */}
                    <div className="rounded-3xl p-6 border dark:border-zinc-800" style={{ backgroundColor: `${currentStatus.currentLevelInfo.bannerColor}15`, borderColor: `${currentStatus.currentLevelInfo.bannerColor}40` }}>
                        <div className="flex justify-between items-center mb-6 px-1">
                            <div className="min-w-0">
                                <h2 className="text-base md:text-lg font-black text-slate-900 dark:text-white" style={{ color: currentStatus.currentLevelInfo.bannerColor }}>
                                    {currentStatus.rank}
                                </h2>
                            </div>
                            <div className="shrink-0 flex items-center gap-1.5">
                                <span className="text-base md:text-lg font-black" style={{ color: currentStatus.currentLevelInfo.bannerColor }}>{currentNovas}</span>
                                <span className="text-[9px] font-bold uppercase opacity-80 mt-0.5" style={{ color: currentStatus.currentLevelInfo.bannerColor }}>Novas</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="h-4 w-full bg-white/50 dark:bg-black/20 rounded-full overflow-hidden p-1 backdrop-blur-sm">
                                <div
                                    className="h-full rounded-full transition-all duration-1000 ease-out animate-shimmer-bar"
                                    style={{
                                        width: `${Math.max(2, progress)}%`,
                                        backgroundColor: currentStatus.currentLevelInfo.bannerColor,
                                        backgroundImage: 'linear-gradient(110deg, transparent 40%, rgba(255,255,255,0.5) 50%, transparent 60%)',
                                        boxShadow: `0 0 20px ${currentStatus.currentLevelInfo.bannerColor}90`
                                    }}
                                />
                            </div>
                            <div className="flex justify-between items-center text-[8px] md:text-[9px] font-black tracking-widest text-slate-400 mt-4 opacity-80 gap-4 px-1 pb-1">
                                {nextThreshold ? (
                                    <>
                                        <span className="uppercase whitespace-nowrap">Faltan {nextThreshold - currentNovas} novas</span>
                                        <span className="uppercase text-right whitespace-nowrap">{currentStatus.nextLevelInfo?.name}</span>
                                    </>
                                ) : (
                                    <span className="uppercase text-center w-full">{t('max_level')}</span>
                                )}
                            </div>
                        </div>

                        {/* All Levels Toggle Button */}
                        <div className="mt-4 pt-4 border-t border-black/5 dark:border-white/5">
                            <button
                                onClick={() => setShowAllLevels(!showAllLevels)}
                                className="text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2 group hover:opacity-80 text-slate-400"
                            >
                                {t('all_levels')}
                                <ChevronRight size={14} className={`transition-transform duration-300 ${showAllLevels ? 'rotate-90' : 'group-hover:translate-x-0.5'}`} />
                            </button>
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
                                            className={`relative p-4 rounded-3xl transition-all ${isCurrent
                                                ? 'bg-white dark:bg-[#111] z-10 scale-[1.02] border ring-4'
                                                : isUnlocked
                                                    ? 'bg-white dark:bg-[#111] border border-slate-100 dark:border-zinc-800 opacity-100'
                                                    : 'bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800 opacity-60 grayscale'
                                                }`}
                                            style={isCurrent ? {
                                                borderColor: currentStatus.currentLevelInfo.bannerColor,
                                                boxShadow: `0 0 0 4px ${currentStatus.currentLevelInfo.bannerColor}15`
                                            } : {}}
                                        >
                                            <div className="flex items-center space-x-4">
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${isUnlocked ? `${lvl.bg} ${lvl.color}` : 'bg-slate-200 text-slate-400 dark:bg-zinc-800 dark:text-zinc-600'}`}>
                                                    <Icon size={24} />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center space-x-2">
                                                        <h4 className={`font-black text-lg ${isUnlocked ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>{lvl.name}</h4>
                                                        {isCurrent && <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full" style={{ backgroundColor: `${currentStatus.currentLevelInfo.bannerColor}15`, color: currentStatus.currentLevelInfo.bannerColor }}>Actual</span>}
                                                    </div>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-snug">{lvl.desc}</p>
                                                </div>

                                                <div className="text-right shrink-0 min-w-[60px]">
                                                    {isUnlocked ? (
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-xs font-black text-slate-300 uppercase tracking-widest">Min</span>
                                                            <span className={`text-lg font-black ${!isCurrent && 'text-slate-700 dark:text-slate-300'}`} style={isCurrent ? { color: currentStatus.currentLevelInfo.bannerColor } : {}}>{lvl.threshold}</span>
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
                            navigate('/recompensas');
                        }}
                        className="w-full py-4 text-white rounded-2xl font-black text-lg transition-all flex items-center justify-center active:scale-[0.98] hover:opacity-90 shadow-lg"
                        style={{
                            backgroundColor: '#9C5DFF',
                            boxShadow: `0 4px 14px 0 rgba(156, 93, 255, 0.4)`
                        }}
                    >
                        <span>Ver Recompensas Disponibles</span>
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
