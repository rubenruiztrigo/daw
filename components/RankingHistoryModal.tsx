import React, { useEffect, useState, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { useScrollLock } from '../hooks/useScrollLock';
import { X, Trophy, Medal, Calendar, User as UserIcon, Loader2, ChevronRight, Clock } from 'lucide-react';
import { Badge, BADGE_CATALOG, User } from '../types';
import { supabase } from '../supabaseClient';

interface RankingHistoryModalProps {
    badges: Badge[];
    onClose: () => void;
    mode?: 'full' | 'personal' | 'global_only';
    onNavigateToProfile?: () => void;
}

interface Winner {
    user: {
        id: string;
        name: string;
        lastName?: string;
        avatar: string;
        position: string;
    };
    badgeId: string;
    createdAt: string;
}

export const RankingHistoryModal: React.FC<RankingHistoryModalProps> = ({ badges, onClose, mode = 'full', onNavigateToProfile }) => {
    // If global_only, force global. If personal, force personal. Default full -> global.
    const [activeTab, setActiveTab] = useState<'global' | 'personal'>(mode === 'personal' ? 'personal' : 'global');
    useScrollLock();
    const [winners, setWinners] = useState<Winner[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Filter only personal ranking badges
    const rankingBadges = badges
        .filter(b => ['ranking_top1', 'ranking_top2', 'ranking_top3'].includes(b.id))
        .sort((a, b) => {
            const dateA = (a as any).created_at ? new Date((a as any).created_at).getTime() : 0;
            const dateB = (b as any).created_at ? new Date((b as any).created_at).getTime() : 0;
            return dateB - dateA;
        });

    const stats = {
        top1: rankingBadges.filter(b => b.id === 'ranking_top1').length,
        top2: rankingBadges.filter(b => b.id === 'ranking_top2').length,
        top3: rankingBadges.filter(b => b.id === 'ranking_top3').length,
    };

    const groupedBadges = useMemo(() => {
        const groups: Record<number, Badge[]> = {};
        rankingBadges.forEach(badge => {
            const year = (badge as any).created_at ? new Date((badge as any).created_at).getFullYear() : new Date().getFullYear();
            if (!groups[year]) groups[year] = [];
            groups[year].push(badge);
        });

        // Ensure current year is there if we want to show headers even if empty, 
        // but user only asked to show year headers for existing ones and transitions.

        return Object.entries(groups)
            .sort(([yearA], [yearB]) => Number(yearB) - Number(yearA))
            .map(([year, items]) => ({ year: Number(year), items }));
    }, [rankingBadges]);

    useEffect(() => {
        const fetchWinners = async () => {
            setIsLoading(true);
            try {
                const { data, error } = await supabase
                    .from('ranking_history')
                    .select(`
                        badge_id,
                        created_at,
                        user_id,
                        profiles:user_id (
                            id,
                            name,
                            last_name,
                            avatar,
                            position
                        )
                    `)
                    .in('badge_id', ['ranking_top1', 'ranking_top2', 'ranking_top3'])
                    .order('created_at', { ascending: false })
                    .limit(10);

                if (data) {
                    const processedWinners = data.map((item: any) => ({
                        user: {
                            id: item.profiles.id,
                            name: item.profiles.name,
                            lastName: item.profiles.last_name,
                            avatar: item.profiles.avatar,
                            position: item.profiles.position
                        },
                        badgeId: item.badge_id,
                        createdAt: item.created_at
                    }));

                    const rankOrder: Record<string, number> = { 'ranking_top1': 1, 'ranking_top2': 2, 'ranking_top3': 3 };

                    if (processedWinners.length > 0) {
                        const latestDate = new Date(processedWinners[0].createdAt).toDateString();
                        const latestWinners = processedWinners.filter(w => new Date(w.createdAt).toDateString() === latestDate);
                        setWinners(latestWinners.sort((a, b) => rankOrder[a.badgeId] - rankOrder[b.badgeId]));
                    } else {
                        setWinners([]);
                    }
                }
            } catch (error) {
                console.error("Error fetching winners:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (activeTab === 'global') {
            fetchWinners();
        }
    }, [activeTab]);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'unset'; };
    }, []);


    const getWeekOfMonth = (date: Date) => {
        const day = date.getDate();
        return Math.ceil(day / 7);
    };

    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);



    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-in fade-in duration-300">
            <div
                className="bg-white dark:bg-[#111] w-full max-w-2xl rounded-[2.5rem] overflow-hidden flex flex-col max-h-[85vh] border border-white dark:border-zinc-800 animate-in zoom-in-95 duration-300"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-50 dark:border-zinc-900 flex justify-between items-center bg-white dark:bg-[#111] sticky top-0 z-10">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-500 rounded-2xl">
                            <Trophy size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white">
                                {mode === 'personal' ? 'Historial Ranking Semanal' : 'Ganadores de la semana pasada'}
                            </h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                {mode === 'personal' ? '' : ''}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-full text-slate-400 transition-all"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs - Only show in full mode */}
                {mode === 'full' && (
                    <div className="px-6 pt-4 flex space-x-2 bg-white dark:bg-[#111] z-10 pb-2">
                        <button
                            onClick={() => setActiveTab('global')}
                            className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'global' ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-zinc-900'}`}
                        >
                            Top Semanal
                        </button>
                        <button
                            onClick={() => setActiveTab('personal')}
                            className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'personal' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-zinc-900'}`}
                        >
                            Mi Historial
                        </button>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide min-h-[300px]">
                    {activeTab === 'global' ? (
                        isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 space-y-4 text-slate-400">
                                <Loader2 size={32} className="animate-spin text-orange-500" />
                                <p className="text-xs font-bold uppercase tracking-widest">Cargando ganadores...</p>
                            </div>
                        ) : winners.length > 0 ? (
                            <div className="space-y-4">
                                {winners.map((winner, index) => {
                                    const badgeInfo = BADGE_CATALOG.find(b => b.id === winner.badgeId);
                                    if (!badgeInfo) return null;

                                    return (
                                        <div key={`${winner.user.id}-${index}`} className="flex items-center p-4 bg-white dark:bg-zinc-900/50 rounded-2xl border border-slate-100 dark:border-zinc-800">
                                            <div className="relative mr-4">
                                                <img src={winner.user.avatar} className="w-12 h-12 rounded-xl object-cover" alt={winner.user.name} />
                                                <div className="absolute -bottom-2 -right-2 bg-white dark:bg-zinc-900 rounded-full p-1 border border-slate-100 dark:border-zinc-800">
                                                    <div className={`${badgeInfo.color.split(' ')[1]} p-1 rounded-full`}>
                                                        <Trophy size={10} fill="currentColor" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center space-x-2">
                                                    <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">{winner.user.name} {winner.user.lastName}</h4>
                                                </div>
                                                <p className="text-xs text-slate-500 dark:text-zinc-500 font-medium truncate">{winner.user.position}</p>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className={`text-[10px] font-black px-2 py-1 border rounded-md ${badgeInfo.color} bg-opacity-20`}>
                                                    {badgeInfo.label}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Inline button after winners list */}
                                <div className="pt-2">
                                    <button
                                        onClick={() => {
                                            if (mode === 'full') {
                                                setActiveTab('personal');
                                            } else {
                                                onNavigateToProfile?.();
                                                onClose();
                                            }
                                        }}
                                        className="w-auto px-6 py-2 rounded-xl bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/20 text-orange-600 dark:text-orange-400 font-bold text-xs uppercase tracking-wider hover:bg-orange-100 dark:hover:bg-orange-900/20 transition-all flex items-center justify-center space-x-2 group active:scale-[0.98] mx-auto"
                                    >
                                        <Clock size={14} />
                                        <span>Ver mi historial de ranking</span>
                                        <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-20">
                                <Trophy size={48} className="mx-auto text-slate-200 dark:text-zinc-800 mb-4" />
                                <p className="text-gray-400 dark:text-zinc-600 font-medium">Aún no se han otorgado insignias de ranking esta semana.</p>
                            </div>
                        )
                    ) : (
                        // Personal History
                        <div className="space-y-6">
                            {/* Statistics Section */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/20 rounded-2xl p-3 text-center">
                                    <div className="bg-yellow-100 dark:bg-yellow-900/30 w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 text-yellow-600">
                                        <Trophy size={14} fill="currentColor" />
                                    </div>
                                    <div className="text-2xl font-black text-slate-900 dark:text-white">{stats.top1}</div>
                                    <div className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Top 1</div>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900/10 border border-slate-100 dark:border-slate-800/20 rounded-2xl p-3 text-center">
                                    <div className="bg-slate-200 dark:bg-slate-700 w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 text-slate-600 dark:text-slate-400">
                                        <Trophy size={14} fill="currentColor" />
                                    </div>
                                    <div className="text-2xl font-black text-slate-900 dark:text-white">{stats.top2}</div>
                                    <div className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Top 2</div>
                                </div>
                                <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/20 rounded-2xl p-3 text-center">
                                    <div className="bg-orange-100 dark:bg-orange-900/30 w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 text-orange-600">
                                        <Trophy size={14} fill="currentColor" />
                                    </div>
                                    <div className="text-2xl font-black text-slate-900 dark:text-white">{stats.top3}</div>
                                    <div className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Top 3</div>
                                </div>
                            </div>

                            <div className="space-y-8">
                                {groupedBadges.length === 0 ? (
                                    <div className="text-center py-10">
                                        <p className="text-gray-400 dark:text-zinc-600 font-bold text-sm">No tienes insignias de ranking.</p>
                                        <p className="text-slate-400/60 dark:text-zinc-700 text-xs mt-2 max-w-[200px] mx-auto">¡Participa activamente para ganar tu lugar en el podio!</p>
                                    </div>
                                ) : (
                                    groupedBadges.map(({ year, items }) => (
                                        <div key={year} className="space-y-4">
                                            <div className="flex items-center space-x-4">
                                                <div className="h-px flex-1 bg-slate-100 dark:bg-zinc-800"></div>
                                                <span className="text-xl font-black text-slate-300 dark:text-zinc-700 tracking-tighter">{year}</span>
                                                <div className="h-px flex-1 bg-slate-100 dark:bg-zinc-800"></div>
                                            </div>

                                            <div className="space-y-4">
                                                {items.map((badge, index) => {
                                                    const badgeInfo = BADGE_CATALOG.find(b => b.id === badge.id);
                                                    if (!badgeInfo) return null;

                                                    const createdAt = (badge as any).created_at;
                                                    let dateDisplay = null;

                                                    if (createdAt) {
                                                        const date = new Date(createdAt);
                                                        const week = getWeekOfMonth(date);
                                                        const month = date.toLocaleString('es-ES', { month: 'long' });
                                                        dateDisplay = (
                                                            <div className="flex items-center text-xs text-slate-500 dark:text-zinc-500 font-bold uppercase tracking-wide mt-1">
                                                                <Calendar size={12} className="mr-1.5 opacity-70" />
                                                                <span>Semana {week} de {capitalize(month)}</span>
                                                            </div>
                                                        );
                                                    }

                                                    const rankNum = badge.id === 'ranking_top1' ? 1 : badge.id === 'ranking_top2' ? 2 : 3;

                                                    return (
                                                        <div key={`${badge.id}-${index}`} className="flex items-center p-4 bg-slate-50 dark:bg-zinc-900/50 rounded-2xl border border-slate-100 dark:border-zinc-800 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                            <div className={`p-3 rounded-xl ${badgeInfo.color} mr-4`}>
                                                                <img src="/img/novagob.brand_isotipo_black.svg" className="w-6 h-6 dark:invert opacity-80" alt="" />
                                                            </div>
                                                            <div className="flex-1">
                                                                {dateDisplay}
                                                            </div>
                                                            <div className="text-2xl font-black text-slate-400 dark:text-zinc-600">
                                                                #{rankNum}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                </div>

            </div>
        </div>,
        document.body
    );
};
