
import React, { useState, useEffect } from 'react';
import { Search, Briefcase, Calendar, Building, ExternalLink, Sparkles, Loader2, Info, ChevronRight } from 'lucide-react';
import { Tender } from '../types';
import { fetchPublicTenders } from '../services/tenderService';
import { generateTenderSummary } from '../services/geminiService';

export const TendersView: React.FC = () => {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [summaries, setSummaries] = useState<Record<string, string>>({});
  const [loadingSummary, setLoadingSummary] = useState<string | null>(null);

  useEffect(() => {
    loadTenders();
  }, []);

  const loadTenders = async (query: string = '') => {
    setLoading(true);
    const data = await fetchPublicTenders(query);
    setTenders(data);
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadTenders(searchTerm);
  };

  const handleGenerateSummary = async (tender: Tender) => {
    if (summaries[tender.id]) return;
    setLoadingSummary(tender.id);
    const summary = await generateTenderSummary(tender.id, tender.title, tender.description || '');
    if (summary) {
      setSummaries(prev => ({ ...prev, [tender.id]: summary }));
    }
    setLoadingSummary(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">Licitaciones Públicas</h2>
          <p className="text-gray-500 dark:text-zinc-500 text-sm font-medium">Contratación del Sector Público en tiempo real.</p>
        </div>
        
        <form onSubmit={handleSearch} className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por objeto o entidad..."
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
          />
        </form>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
          <p className="text-gray-400 font-bold">Consultando la Plataforma de Contratación...</p>
        </div>
      ) : tenders.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-[#111] rounded-3xl border border-dashed border-gray-200 dark:border-zinc-800">
          <Briefcase className="mx-auto text-gray-200 dark:text-zinc-800 mb-4" size={48} />
          <p className="text-gray-400 font-bold">No se han encontrado licitaciones para esta búsqueda.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {tenders.map(tender => (
            <div key={tender.id} className="bg-white dark:bg-[#111] p-6 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                      tender.status === 'Licitación' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {tender.status}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{tender.id}</span>
                  </div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white leading-snug group-hover:text-blue-600 transition-colors">
                    {tender.title}
                  </h3>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xl font-black text-blue-600 dark:text-blue-400">{tender.budget}</div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Presupuesto base</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <Building size={16} className="text-gray-400" />
                  <span className="font-medium truncate">{tender.organization}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <Calendar size={16} className="text-gray-400" />
                  <span className="font-medium">Límite: {new Date(tender.deadline).toLocaleDateString()}</span>
                </div>
              </div>

              {summaries[tender.id] && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-zinc-800/50 rounded-2xl border border-blue-100 dark:border-zinc-800 animate-in fade-in zoom-in-95">
                  <div className="flex items-center space-x-2 mb-2 text-blue-600 dark:text-blue-400 font-black text-[10px] uppercase tracking-widest">
                    <Sparkles size={14} />
                    <span>Resumen IA para Colegas</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
                    {summaries[tender.id]}
                  </p>
                </div>
              )}

              <div className="flex items-center space-x-3 pt-4 border-t border-gray-50 dark:border-zinc-800">
                <button 
                  onClick={() => handleGenerateSummary(tender)}
                  disabled={!!loadingSummary}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-black hover:bg-blue-50 hover:text-blue-600 transition-all disabled:opacity-50"
                >
                  {loadingSummary === tender.id ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <Sparkles size={14} />
                  )}
                  <span>{summaries[tender.id] ? 'Resumen generado' : 'Resumir con IA'}</span>
                </button>
                
                <a 
                  href={tender.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 px-4 py-2 text-blue-600 dark:text-blue-400 font-black text-xs hover:underline"
                >
                  <span>Ver en PLACSP</span>
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
