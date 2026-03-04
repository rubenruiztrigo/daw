import { Target, Zap, Megaphone, Briefcase, Award, Star, Medal, Trophy, Sparkles, Crown } from 'lucide-react';
import React from 'react';
import { Language, translations } from './translations';

export interface LevelInfo {
    name: string;
    threshold: number;
    desc: string;
    color: string;
    bg: string;
    bannerColor: string;
    icon: React.ElementType;
}

export const LEVELS: LevelInfo[] = [
    { name: "NovaReferente", threshold: 0, desc: "El recién llegado que está explorando el terreno.", color: "text-[#82E4FF]", bg: "bg-[#82E4FF]/10", bannerColor: "#82E4FF", icon: Target },
    { name: "NovaProfesional", threshold: 10, desc: "Ya participa y empieza a generar sus primeras Novas.", color: "text-[#ea76f3]", bg: "bg-[#ea76f3]/10", bannerColor: "#ea76f3", icon: Zap },
    { name: "NovaEspecialista", threshold: 50, desc: "Domina su área y es reconocido por sus aportes técnicos.", color: "text-[#B8FF1E]", bg: "bg-[#B8FF1E]/10", bannerColor: "#B8FF1E", icon: Briefcase },
    { name: "NovaDestacada", threshold: 100, desc: "Un perfil sólido, fiable y con una red ya establecida.", color: "text-[#2F5BFF]", bg: "bg-[#2F5BFF]/10", bannerColor: "#2F5BFF", icon: Award },
    { name: "NovaEstelar", threshold: 150, desc: "Su palabra tiene peso; otros usuarios lo consultan.", color: "text-[#EBD916]", bg: "bg-[#EBD916]/10", bannerColor: "#EBD916", icon: Star },
    { name: "SuperNova", threshold: 200, desc: "El máximo honor. Leyenda viva de la comunidad.", color: "text-[#9C5DFF]", bg: "bg-[#9C5DFF]/10", bannerColor: "#9C5DFF", icon: Crown }
];

export const getLevelInfo = (novas: number, language: Language = 'es') => {
    let currentLvlIndex = 0;
    for (let i = LEVELS.length - 1; i >= 0; i--) {
        if (novas >= LEVELS[i].threshold) {
            currentLvlIndex = i;
            break;
        }
    }

    const lvl = LEVELS[currentLvlIndex];
    const nextLvl = LEVELS[currentLvlIndex + 1];

    // Localized strings
    const langKey = language as Language;
    const nameKey = `level_${currentLvlIndex}_name` as keyof typeof translations['es'];
    const descKey = `level_${currentLvlIndex}_desc` as keyof typeof translations['es'];

    const rank = translations[langKey][nameKey] || lvl.name;
    const desc = translations[langKey][descKey] || lvl.desc;

    return {
        rank,
        color: lvl.color,
        bg: lvl.bg,
        icon: lvl.icon,
        desc,
        level: currentLvlIndex,
        next: currentLvlIndex + 1,
        threshold: lvl.threshold,
        nextThreshold: nextLvl ? nextLvl.threshold : null,
        currentLevelInfo: { ...lvl, name: rank, desc },
        nextLevelInfo: nextLvl
    };
};
