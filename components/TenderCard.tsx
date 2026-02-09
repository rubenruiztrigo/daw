
import React, { useState } from 'react';
import { Tender } from '../types';
import { Building, MapPin, Calendar, CreditCard, ExternalLink, Sparkles, Loader2, ChevronRight, CheckCircle2, Clock, Ban } from 'lucide-react';
import { generateContentSummary } from '../services/geminiService';

interface TenderCardProps {
  tender: Tender;
}

export const TenderCard: React.FC<TenderCardProps> = ({ tender }) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getStatusInfo = (status: Tender['status']) => {
    switch (status) {
      case 'published': return { label: 'Abierta', icon: <Clock size={12} />, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' };
      case 'evaluation': return { label: 'En Evaluación', icon: <Loader2 size={12} className="animate-spin" />, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' };
      case 'awarded': return { label: 'Adjudicada', icon: <CheckCircle2 size={12} />, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' };
      default: return { label: 'Cerrada', icon: <Ban size={12} />, color: 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-500' };
    }
  };

  const status = getStatusInfo(tender.status);

  const handleAnalyze = async () => {
    if (summary) return;
    setLoading(true);
    const result = await generateContentSummary(tender.id, tender.title, tender.description);
    setSummary(result);
    setLoading(false);
  };

  return (
    <div className="bg-white dark:bg-[#111] rounded-[2rem] border border-gray-100 dark:border-zinc-800 overflow-hidden transition-all group">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className={`px-3 py-1 rounded-full flex items-center space-x-1.5 text-[10px] font-black uppercase tracking-widest ${status.color}`}>
            {status.icon}
            <span>{status.label}</span>
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{tender.id}</span>
        </div>

        <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight mb-3 group-hover:text-blue-600 transition-colors">
          {tender.title}
        </h3>

        <div className="space-y-2 mb-6">
          <div className="flex items-center text-xs text-slate-500 dark:text-zinc-400 font-bold">
            <Building size={14} className="mr-2 opacity-50" />
            <span className="truncate">{tender.organism}</span>
          </div>
          <div className="flex items-center text-xs text-slate-500 dark:text-zinc-400 font-bold">
            <MapPin size={14} className="mr-2 opacity-50" />
            <span>{tender.region}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 pt-6 border-t border-slate-50 dark:border-zinc-900">
          <div className="space-y-1">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Presupuesto</p>
            <div className="flex items-center text-blue-600 dark:text-blue-400 font-black">
              <CreditCard size={14} className="mr-1.5" />
              <span>{new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(tender.budget)}</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fecha Límite</p>
            <div className="flex items-center text-slate-700 dark:text-zinc-300 font-black">
              <Calendar size={14} className="mr-1.5" />
              <span>{new Date(tender.deadline).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-50 dark:bg-zinc-900/50 rounded-2xl p-4">
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed font-medium line-clamp-3">
              {tender.description}
            </p>
          </div>

          {summary && (
            <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-2xl p-5 animate-in slide-in-from-top-2">
              <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 mb-2">
                <Sparkles size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Análisis IA NovaGob</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-blue-200/80 leading-relaxed font-bold italic">
                {summary}
              </p>
            </div>
          )}

          <div className="flex space-x-2">
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="flex-1 py-3 bg-white dark:bg-zinc-800 border-2 border-blue-50 dark:border-zinc-700 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-black hover:bg-blue-50 dark:hover:bg-zinc-700 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <><Sparkles size={16} /><span>Resumen IA</span></>}
            </button>
            <a
              href={tender.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-xs font-black hover:bg-blue-700 transition-all flex items-center justify-center space-x-2 transform active:scale-95"
            >
              <span>Ver Pliegos</span>
              <ExternalLink size={16} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
