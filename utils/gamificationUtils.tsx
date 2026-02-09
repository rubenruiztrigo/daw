import { Target, Zap, Megaphone, Briefcase, Award, Star, Medal, Trophy, Sparkles, Crown } from 'lucide-react';
import React from 'react';

export interface LevelInfo {
    name: string;
    threshold: number;
    desc: string;
    color: string;
    bg: string;
    icon: React.ElementType;
}

export const LEVELS: LevelInfo[] = [
    { name: "Aspirante", threshold: 0, desc: "El recién llegado que está explorando el terreno.", color: "text-slate-400", bg: "bg-slate-50", icon: Target },
    { name: "Activo", threshold: 25, desc: "Ya participa y empieza a generar sus primeras Novas.", color: "text-amber-600", bg: "bg-amber-50", icon: Zap },
    { name: "Impulsor", threshold: 50, desc: "Alguien que dinamiza y aporta energía a los grupos.", color: "text-orange-500", bg: "bg-orange-50", icon: Megaphone },
    { name: "Especialista", threshold: 100, desc: "Domina su área y es reconocido por sus aportes técnicos.", color: "text-blue-500", bg: "bg-blue-50", icon: Briefcase },
    { name: "Profesional", threshold: 150, desc: "Un perfil sólido, fiable y con una red ya establecida.", color: "text-indigo-500", bg: "bg-indigo-50", icon: Award },
    { name: "Experto", threshold: 200, desc: "Su palabra tiene peso; otros usuarios lo consultan.", color: "text-violet-600", bg: "bg-violet-50", icon: Star },
    { name: "Élite", threshold: 300, desc: "Un nivel de distinción reservado para los más constantes.", color: "text-fuchsia-600", bg: "bg-fuchsia-50", icon: Medal },
    { name: "Maestro", threshold: 400, desc: "Guía a otros y tiene una influencia clara en la red.", color: "text-rose-600", bg: "bg-rose-50", icon: Trophy },
    { name: "Nova Estelar", threshold: 600, desc: "El paso previo a la leyenda. Un referente absoluto.", color: "text-cyan-500", bg: "bg-cyan-50", icon: Sparkles },
    { name: "Nova Galáctica", threshold: 800, desc: "Un titán de la comunidad, su impacto es universal.", color: "text-purple-600", bg: "bg-purple-50", icon: Crown },
    { name: "SuperNova", threshold: 1000, desc: "El máximo honor. Leyenda viva de la administración pública.", color: "text-yellow-600", bg: "bg-yellow-100", icon: Crown }
];

export const getLevelInfo = (novas: number) => {
    let currentLvlIndex = 0;
    for (let i = LEVELS.length - 1; i >= 0; i--) {
        if (novas >= LEVELS[i].threshold) {
            currentLvlIndex = i;
            break;
        }
    }

    const lvl = LEVELS[currentLvlIndex];
    const nextLvl = LEVELS[currentLvlIndex + 1];

    return {
        rank: lvl.name,
        color: lvl.color,
        bg: lvl.bg,
        icon: lvl.icon, // Return component reference, not element
        desc: lvl.desc,
        level: currentLvlIndex,
        next: currentLvlIndex + 1,
        threshold: lvl.threshold,
        nextThreshold: nextLvl ? nextLvl.threshold : null,
        currentLevelInfo: lvl,
        nextLevelInfo: nextLvl
    };
};
