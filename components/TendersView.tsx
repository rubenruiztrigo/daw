
import React, { useState, useEffect, useMemo } from 'react';
import { fetchPublicTenders } from '../services/tenderService';
import { Tender } from '../types';
import { TenderCard } from './TenderCard';
import { Search, Filter, FileText, Loader2, Sparkles, Building2, Globe2 } from 'lucide-react';

export const TendersView: React.FC = () => {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterRegion, setFilterRegion] = useState<string>('all');

  useEffect(() => {
    const load = async () => {
      const data = await fetchPublicTenders();
      setTenders(data);
      setLoading(false);
    };
    load();
  }, []);

  const filteredTenders = useMemo(() => {
    return tenders.filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.organism.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || t.type === filterType;
      const matchesRegion = filterRegion === 'all' || t.region === filterRegion;
      return matchesSearch && matchesType && matchesRegion;
    });
  }, [tenders, searchTerm, filterType, filterRegion]);

  const regions = useMemo(() => ['all', ...Array.from(new Set(tenders.map(t => t.region)))], [tenders]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2.5 bg-blue-600 text-white rounded-2xl">
              <FileText size={24} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Licitaciones Públicas</h2>
          </div>
          <p className="text-slate-500 dark:text-zinc-500 text-sm font-medium">Plataforma de Contratación del Sector Público - Monitor NovaGob</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por organismo o título..."
              className="pl-12 pr-4 py-3 bg-white dark:bg-[#111] border border-gray-100 dark:border-zinc-800 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none w-64 md:w-80 transition-all dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-[#111] p-4 rounded-3xl border border-gray-100 dark:border-zinc-800">
        <div className="flex items-center space-x-2 px-3 border-r border-slate-100 dark:border-zinc-900 pr-6">
          <Filter size={16} className="text-slate-400" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filtros:</span>
        </div>

        <div className="flex items-center space-x-3">
          <Building2 size={14} className="text-blue-500" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-transparent text-xs font-black text-slate-600 dark:text-gray-300 outline-none cursor-pointer hover:text-blue-600"
          >
            <option value="all">Todos los Tipos</option>
            <option value="service">Servicios</option>
            <option value="supply">Suministros</option>
            <option value="works">Obras</option>
          </select>
        </div>

        <div className="flex items-center space-x-3">
          <Globe2 size={14} className="text-blue-500" />
          <select
            value={filterRegion}
            onChange={(e) => setFilterRegion(e.target.value)}
            className="bg-transparent text-xs font-black text-slate-600 dark:text-gray-300 outline-none cursor-pointer hover:text-blue-600"
          >
            {regions.map(r => (
              <option key={r} value={r}>{r === 'all' ? 'Todas las Regiones' : r}</option>
            ))}
          </select>
        </div>

        <div className="ml-auto flex items-center space-x-2 text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full">
          <Sparkles size={12} />
          <span>Monitorizando {tenders.length} licitaciones activas</span>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 className="animate-spin text-blue-600" size={48} />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Sincronizando con PLACE...</p>
        </div>
      ) : filteredTenders.length === 0 ? (
        <div className="text-center py-32 bg-white dark:bg-[#111] rounded-[3rem] border border-dashed border-slate-200 dark:border-zinc-800">
          <Search className="mx-auto text-slate-100 dark:text-zinc-900 mb-4" size={64} />
          <h3 className="text-slate-400 font-black italic">No se han encontrado licitaciones que coincidan con tu búsqueda.</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTenders.map(t => (
            <TenderCard key={t.id} tender={t} />
          ))}
        </div>
      )}
    </div>
  );
};
