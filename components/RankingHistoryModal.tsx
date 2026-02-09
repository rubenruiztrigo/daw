import React from 'react';
import { X, Trophy, Medal, Calendar } from 'lucide-react';
import { Badge, BADGE_CATALOG } from '../types';

interface RankingHistoryModalProps {
    badges: Badge[];
    onClose: () => void;
}

export const RankingHistoryModal: React.FC<RankingHistoryModalProps> = ({ badges, onClose }) => {
    // Filter only ranking badges and sort by date descending (newest first)
    const rankingBadges = badges
        .filter(b => ['ranking_top1', 'ranking_top2', 'ranking_top3'].includes(b.id))
        .sort((a, b) => {
            const dateA = new Date((a as any).created_at).getTime();
            const dateB = new Date((b as any).created_at).getTime();
            return dateB - dateA;
        });

    const getWeekOfMonth = (date: Date) => {
        const day = date.getDate();
        return Math.ceil(day / 7);
    };

    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-[#0a0a0a] w-full max-w-md rounded-[2.5rem] overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-300 border border-white dark:border-zinc-800"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-50 dark:border-zinc-900 flex justify-between items-center bg-white dark:bg-[#0a0a0a] sticky top-0 z-10">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-yellow-100 dark:bg-yellow-900/40 rounded-xl text-yellow-600 dark:text-yellow-400">
                            <Trophy size={20} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                            Historial de Ranking
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-50 dark:hover:bg-zinc-900 rounded-full text-slate-400 transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
                    {rankingBadges.length === 0 ? (
                        <div className="text-center py-10">
                            <p className="text-gray-400 dark:text-zinc-600 font-medium">No hay insignias de ranking registradas.</p>
                        </div>
                    ) : (
                        rankingBadges.map((badge, index) => {
                            const badgeInfo = BADGE_CATALOG.find(b => b.id === badge.id);
                            if (!badgeInfo) return null;

                            const date = new Date((badge as any).created_at);
                            const week = getWeekOfMonth(date);
                            const month = date.toLocaleString('es-ES', { month: 'long' });

                            return (
                                <div key={`${badge.id}-${index}`} className="flex items-center p-4 bg-slate-50 dark:bg-zinc-900/50 rounded-2xl border border-slate-100 dark:border-zinc-800">
                                    <div className={`p-3 rounded-xl ${badgeInfo.color} mr-4`}>
                                        <Medal size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-slate-900 dark:text-white text-base">{badgeInfo.label}</h4>
                                        <div className="flex items-center text-xs text-slate-500 dark:text-zinc-500 font-bold uppercase tracking-wide mt-1">
                                            <Calendar size={12} className="mr-1.5 opacity-70" />
                                            <span>Semana {week} de {capitalize(month)}</span>
                                        </div>
                                    </div>
                                    <div className="text-2xl font-black text-slate-200 dark:text-zinc-800">
                                        #{index + 1}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};
