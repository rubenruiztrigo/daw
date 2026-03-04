import React from 'react';
import { ShoppingBag, Construction, Star, BookOpen, Trophy, Coffee, Award, Lock, CheckCircle2, Loader2, Clock } from 'lucide-react';
import { User, calculateNovas } from '../types';
import { Language, useTranslation } from '../utils/translations';

// Create a mapping from string to icon components
const IconMap: { [key: string]: React.FC<any> } = {
    BookOpen,
    Trophy,
    Coffee,
    Award
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
                        <p className="text-slate-500 dark:text-gray-400 text-sm font-medium">{t('rewards_description')}</p>
                    </div>
                </div>

                <div className="flex items-center space-x-2 bg-gradient-to-r from-purple-100 to-violet-200 dark:from-purple-900/40 dark:to-violet-900/40 text-purple-900 dark:text-purple-100 px-4 py-2 rounded-2xl border border-purple-200 dark:border-purple-800/50">
                    <Star size={18} className="fill-purple-600 text-purple-600 dark:fill-purple-400 dark:text-purple-400" />
                    <div className="flex flex-col leading-none">
                        <span className="font-black text-lg">{points}</span>
                        <span className="text-[9px] font-bold uppercase tracking-widest">Novas</span>
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
                    const Icon = IconMap[reward.icon_name] || Award; // Fallback to Award if not found

                    return (
                        <div key={reward.id} className={`group relative bg-white dark:bg-[#111] rounded-[2.5rem] border transition-all duration-300 p-6 flex flex-col items-center text-center ${isUnlocked ? 'border-slate-100 dark:border-zinc-800 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/5' : 'border-slate-100 dark:border-zinc-800 opacity-75'}`}>
                            <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110 ${reward.bg_color} ${reward.text_color}`}>
                                <Icon size={40} />
                            </div>
                            <h3 className="font-black text-slate-900 dark:text-white mb-2">{reward.name}</h3>
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
                                        onClick={() => handleRedeemClick(reward.id, reward.name)}
                                        disabled={isProcessing}
                                        className={`w-full flex items-center justify-center space-x-2 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${isProcessing ? 'bg-slate-100 dark:bg-zinc-800 text-slate-400' : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20'}`}
                                    >
                                        {isProcessing ? <Loader2 className="animate-spin" size={16} /> : null}
                                        <span>{t('redeem')}</span>
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
        </div>
    );
};
