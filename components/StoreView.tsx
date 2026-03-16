import React from 'react';
import { createPortal } from 'react-dom';
import { ShoppingBag, Construction, Star, BookOpen, Trophy, Coffee, Award, Lock, CheckCircle2, Loader2, Clock, Building2, Crown, X, Info } from 'lucide-react';
import { User, calculateNovas } from '../types';
import { Language, useTranslation } from '../utils/translations';
import { supabase } from '../supabaseClient';
import { getSafeAvatar } from '../utils/avatarUtils';
import { useScrollLock } from '../hooks/useScrollLock';

// Create a mapping from string to icon components (based on rewards.icon_name)
const IconMap: { [key: string]: React.FC<any> } = {
    BookOpen,
    Trophy,
    Coffee,
    Award,
    Star,
    Crown,
    Building2,
};

interface RankingUser {
    id: string;
    name: string;
    lastName?: string | null;
    username?: string | null;
    avatar?: string | null;
    position?: string | null;
    department?: string | null;
    novas: number;
}

const GlobalNovasRankingModal: React.FC<{
    users: RankingUser[];
    loading: boolean;
    onClose: () => void;
    language: Language;
}> = ({ users, loading, onClose, language }) => {
    useScrollLock();
    const [showInfo, setShowInfo] = React.useState(false);

    return createPortal(
        <div
            className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-[#0a0a0a] w-full max-w-lg rounded-[2.5rem] overflow-hidden border border-slate-100 dark:border-zinc-800 shadow-2xl animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-8 py-6 border-b border-slate-50 dark:border-zinc-900 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-black uppercase tracking-[0.25em] text-violet-500">
                            {language === 'es' ? 'Ranking Novas' : 'Novas Ranking'}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowInfo(!showInfo)}
                            className={`p-2 rounded-full transition-colors ${showInfo ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-600' : 'hover:bg-slate-100 dark:hover:bg-zinc-900 text-slate-400'}`}
                        >
                            <Info size={20} />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-900 text-slate-400 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                    {showInfo && (
                        <div className="p-4 rounded-2xl bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-800/30 animate-in slide-in-from-top-2 duration-300">
                            <p className="text-xs font-medium text-violet-700 dark:text-violet-300 leading-relaxed">
                                {language === 'es' 
                                    ? "El usuario que alcance el mayor numero de Novas a lo largo del año, será recompensado mediante un premio físico e insignia."
                                    : "The user who reaches the highest number of Novas throughout the year will be rewarded with a physical prize and badge."}
                            </p>
                        </div>
                    )}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-10 space-y-3">
                            <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                            <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                                {language === 'es' ? 'Cargando ranking...' : 'Loading ranking...'}
                            </p>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 space-y-3">
                            <Star className="w-8 h-8 text-slate-300 dark:text-zinc-700" />
                            <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 text-center">
                                {language === 'es'
                                    ? 'Todavía no hay usuarios con Novas registradas.'
                                    : 'There are no users with recorded Novas yet.'}
                            </p>
                        </div>
                    ) : (
                        <ol className="space-y-2">
                            {users.map((u, index) => (
                                <li
                                    key={u.id}
                                    className={`flex items-center justify-between p-3 rounded-2xl border ${
                                        index === 0
                                            ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/10'
                                            : 'border-slate-100 dark:border-zinc-800 bg-white dark:bg-[#050505]'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-900 text-white text-xs font-black">
                                            {index + 1}
                                        </div>
                                        <img
                                            src={getSafeAvatar(u.avatar)}
                                            alt={u.username || ''}
                                            className="w-8 h-8 rounded-full object-cover border border-white dark:border-zinc-800"
                                        />
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">
                                                {u.name} {u.lastName || ''}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-sm font-black text-violet-600 dark:text-violet-400">
                                            {u.novas}
                                        </span>
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400">
                                            Novas
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    )}
                </div>


            </div>
        </div>,
        document.body
    );
};

interface StoreViewProps {
    user: User;
    language: Language;
    onRedeemReward?: (rewardId: string, rewardName: string) => void;
    storeRewards?: any[];
    userRedemptions?: { reward_id: string, status: string }[];
}

export const StoreView: React.FC<StoreViewProps> = ({ user, language, onRedeemReward, storeRewards = [], userRedemptions = [] }) => {
    const points = user.novas ?? calculateNovas(user.badges || []);
    const t = useTranslation(language);
    const [isRedeemingId, setIsRedeemingId] = React.useState<string | null>(null);
    const [isRankingOpen, setIsRankingOpen] = React.useState(false);
    const [rankingUsers, setRankingUsers] = React.useState<RankingUser[]>([]);
    const [isLoadingRanking, setIsLoadingRanking] = React.useState(false);

    const fetchGlobalRanking = React.useCallback(async () => {
        try {
            setIsLoadingRanking(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('id, name, last_name, username, avatar, position, department, novas')
                .not('novas', 'is', null);

            if (!error && data) {
                const mapped = (data as any[])
                    .map((u) => ({
                        id: u.id,
                        name: u.name,
                        lastName: u.last_name,
                        username: u.username,
                        avatar: u.avatar,
                        position: u.position,
                        department: u.department,
                        novas: typeof u.novas === 'number' ? u.novas : 0,
                    }) as RankingUser)
                    .filter((u) => u.novas > 0)
                    .sort((a, b) => b.novas - a.novas)
                    .slice(0, 10);

                setRankingUsers(mapped);
            } else if (error) {
                console.error('Error fetching global Novas ranking:', error);
                setRankingUsers([]);
            }
        } finally {
            setIsLoadingRanking(false);
        }
    }, []);

    const handleOpenRanking = React.useCallback(async () => {
        setIsRankingOpen(true);
        await fetchGlobalRanking();
    }, [fetchGlobalRanking]);

    const handleRedeemClick = (rewardId: string, rewardName: string) => {
        setIsRedeemingId(rewardId);
        onRedeemReward?.(rewardId, rewardName);
        setTimeout(() => setIsRedeemingId(null), 1500);
    };

    return (
        <div className="w-full space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8 text-center sm:text-left">
                <div className="flex items-center space-x-4">
                    <div className="p-3 bg-pink-50 dark:bg-pink-900/20 rounded-2xl text-pink-600">
                        <ShoppingBag size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white">{t('rewards_title')}</h2>
                    </div>
                </div>

                <div className="flex items-center bg-purple-600 dark:bg-purple-700 text-white px-5 py-2 rounded-2xl shadow-lg border border-purple-500/30 sm:mr-8 transition-transform hover:scale-105">
                    <div className="flex items-baseline space-x-2">
                        <span className="font-black text-lg tracking-tight">{points}</span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-90">Novas</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {storeRewards.map((reward) => {
                    const isUnlocked = points >= reward.cost_novas;
                    const userReward = userRedemptions.find(r => r.reward_id === reward.id);
                    const isRedeemed = userReward?.status === 'aceptado';
                    const isPending = userReward?.status === 'solicitado';
                    const isProcessing = isRedeemingId === reward.id;
                    const isSupernova = typeof reward.name === 'string' && reward.name.toLowerCase().includes('supernova');
                    const isCongress = typeof reward.name === 'string' && reward.name.toLowerCase().includes('congreso');

                    // Base icon coming from DB configuration
                    let Icon = IconMap[reward.icon_name] || Award;

                    // Override icon depending on reward type/name
                    if (isCongress) {
                        Icon = Building2;
                    } else if (isSupernova) {
                        Icon = Trophy;
                    }

                    // Override display name for specific rewards
                    let displayName: string = reward.name;
                    if (reward.name === 'Curso') {
                        displayName = 'Descuento 15% curso';
                    } else if (reward.name === 'Course') {
                        displayName = '15% course discount';
                    }

                    return (
                        <div key={reward.id} className={`group relative bg-white dark:bg-[#111] rounded-[2.5rem] border transition-all duration-500 p-6 flex flex-col items-center text-center ${isUnlocked ? 'border-slate-100 dark:border-zinc-800 hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-2' : 'border-slate-100 dark:border-zinc-800 opacity-75'}`}>
                            <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mb-6 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 ${reward.bg_color} ${reward.text_color} shadow-sm group-hover:shadow-lg`}>
                                <Icon size={40} className="transition-transform duration-500 group-hover:scale-110" />
                            </div>
                            <h3 className="font-black text-slate-900 dark:text-white mb-2 transition-all duration-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 group-hover:scale-105 transform-gpu">{displayName}</h3>
                            <div className="flex items-center space-x-1 mb-4">
                                <span className={`text-sm font-black ${isUnlocked ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-zinc-600'}`}>{reward.cost_novas} Novas</span>
                            </div>
                            <div className="mt-auto w-full">
                                {isRedeemed ? (
                                    <div className="flex items-center justify-center space-x-2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-inner">
                                        <CheckCircle2 size={16} />
                                        <span>{t('redeemed')}</span>
                                    </div>
                                ) : isPending ? (
                                    <div className="flex items-center justify-center space-x-2 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-inner">
                                        <Clock size={16} />
                                        <span>{language === 'es' ? 'Solicitado' : 'Requested'}</span>
                                    </div>
                                ) : isUnlocked ? (
                                    <button
                                        onClick={() => handleRedeemClick(reward.id, displayName)}
                                        disabled={isProcessing}
                                        className={`w-full flex items-center justify-center space-x-2 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${isProcessing ? 'bg-slate-100 dark:bg-zinc-800 text-slate-400' : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20'}`}
                                    >
                                        {isProcessing ? <Loader2 className="animate-spin" size={16} /> : null}
                                        <span>{t('redeem')}</span>
                                    </button>
                                ) : isSupernova ? (
                                    <button
                                        onClick={handleOpenRanking}
                                        className="w-full flex items-center justify-center space-x-2 py-3 rounded-2xl font-black text-xs uppercase tracking-[0.25em] transition-all bg-slate-900 text-white hover:bg-black shadow-lg shadow-slate-900/30"
                                    >
                                        <Crown size={16} />
                                        <span>{language === 'es' ? 'Ver ranking' : 'View ranking'}</span>
                                    </button>
                                ) : (
                                    <div className="flex items-center justify-center space-x-2 text-slate-400 dark:text-zinc-600 bg-slate-50 dark:bg-zinc-900/40 py-3 rounded-2xl font-black text-xs uppercase tracking-widest">
                                        <Lock size={16} />
                                        <span>{t('locked')}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {isRankingOpen && (
                <GlobalNovasRankingModal
                    users={rankingUsers}
                    loading={isLoadingRanking}
                    onClose={() => setIsRankingOpen(false)}
                    language={language}
                />
            )}
        </div>
    );
};
