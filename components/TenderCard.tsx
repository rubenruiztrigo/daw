
import React, { useState, useEffect } from 'react';
import { Tender } from '../types';
import { Calendar, Bookmark, FileText, Building2, Euro, Sparkles, ArrowUpRight } from 'lucide-react';
import { ProjectModal } from './ProjectModal';
import { generateTenderSummary } from '../services/geminiService';

interface TenderCardProps {
  tender: Tender;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  isAIEnabled: boolean;
}

export const TenderCard: React.FC<TenderCardProps> = ({ tender, isFavorite, onToggleFavorite, isAIEnabled }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [summary, setSummary] = useState(tender.summary);
  const [isAiGenerated, setIsAiGenerated] = useState(false);

  useEffect(() => {
    if (!isAIEnabled) {
        setSummary(tender.summary);
        setIsAiGenerated(false);
        return;
    }
    let isMounted = true;
    const fetchSummary = async () => {
        const enhancedText = await generateTenderSummary(tender.id, tender.title, tender.summary);
        if (isMounted && enhancedText) {
            setSummary(enhancedText);
            setIsAiGenerated(true);
        }
    };
    fetchSummary();
    return () => { isMounted = false; };
  }, [tender.id, tender.title, tender.summary, isAIEnabled]);

  return (
    <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-8 transition-all hover:shadow-xl hover:shadow-gray-200/50 group relative">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
            {/* Context Header */}
            <div className="flex flex-wrap gap-2 mb-4">
                <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border ${
                    tender.sourceType === 'Contratos Menores' 
                    ? 'bg-orange-50 text-orange-600 border-orange-100'
                    : 'bg-purple-50 text-purple-600 border-purple-100'
                }`}>
                    {tender.sourceType}
                </span>
                {tender.contractType && (
                    <span className="px-3 py-1 bg-slate-50 text-slate-500 border border-slate-100 text-[10px] font-black uppercase tracking-widest rounded-lg">
                        {tender.contractType}
                    </span>
                )}
            </div>
          
            {/* Organism */}
            {tender.organism && (
                <div className="flex items-center space-x-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    <Building2 size={12} />
                    <span className="truncate max-w-[400px]">{tender.organism}</span>
                </div>
            )}

            {/* Title */}
            <h3 className="text-xl font-black text-slate-900 mb-4 leading-tight group-hover:text-blue-600 transition-colors">
                <a href={tender.link} target="_blank" rel="noopener noreferrer" className="flex items-start">
                    <span className="line-clamp-2">{tender.title}</span>
                    <ArrowUpRight size={18} className="ml-2 mt-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                </a>
            </h3>

            {/* Summary Box */}
            <div className={`relative p-5 rounded-2xl border mb-6 transition-all ${isAiGenerated ? 'bg-blue-50/50 border-blue-100 shadow-inner' : 'bg-slate-50 border-slate-100'}`}>
                {isAiGenerated && (
                    <div className="absolute -top-3 left-4 flex items-center space-x-1 bg-blue-600 text-white text-[9px] font-black px-2 py-1 rounded-md shadow-sm uppercase tracking-tighter">
                        <Sparkles size={10} /> <span>Smart Summary</span>
                    </div>
                )}
                <p className={`text-sm leading-relaxed font-medium ${isAiGenerated ? 'text-blue-900 italic' : 'text-slate-600'}`}>
                    {summary}
                </p>
            </div>
          
            {/* Info Badges */}
            <div className="flex flex-wrap items-center gap-6 mb-8 pt-4 border-t border-slate-50">
                <div className="flex flex-col">
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Publicado el</span>
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-600">
                    <Calendar size={14} className="text-slate-300" />
                    <span>{new Date(tender.updated).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                  </div>
                </div>
                
                {tender.amount && (
                    <div className="flex flex-col">
                      <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Presupuesto Estimado</span>
                      <div className="flex items-center space-x-1.5 text-sm font-black text-green-600 bg-green-50 px-3 py-1 rounded-xl border border-green-100">
                        <Euro size={14} />
                        <span>{tender.amount}</span>
                      </div>
                    </div>
                )}

                {tender.keywordsFound.length > 0 && (
                   <div className="flex flex-col">
                      <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Relevancia</span>
                      <div className="flex gap-1">
                        {tender.keywordsFound.map(k => (
                          <span key={k} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-black rounded-md uppercase">#{k}</span>
                        ))}
                      </div>
                   </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4">
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all transform active:scale-95"
                >
                    <FileText size={16} />
                    <span>Preparar Proyecto</span>
                </button>
            </div>
        </div>
        
        {/* Favorite */}
        <button 
            onClick={onToggleFavorite}
            className={`p-3 rounded-2xl transition-all ${isFavorite ? 'text-yellow-500 bg-yellow-50 border-yellow-200 border shadow-sm scale-110' : 'text-slate-300 bg-white border border-slate-100 hover:border-yellow-200 hover:text-yellow-400'}`}
            title="Guardar Licitación"
        >
            <Bookmark fill={isFavorite ? "currentColor" : "none"} size={22} />
        </button>
      </div>

      {isModalOpen && (
        <ProjectModal tender={tender} onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  );
};
