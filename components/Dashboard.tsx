
import React, { useEffect, useState } from 'react';
import { fetchTenders } from '../services/tenderService';
import { Tender } from '../types';
import { TenderCard } from './TenderCard';
import { Search, Loader2, ChevronLeft, ChevronRight, Filter, Layers, Database, RefreshCw, CheckCircle2, Gavel } from 'lucide-react';
import { normalizeString } from '../utils/stringUtils';

interface DashboardProps {
  favorites: Set<string>;
  toggleFavorite: (tender: Tender) => void;
  isAIEnabled: boolean;
  keywords: string[];
}

type SortOption = 'newest' | 'oldest' | 'highest_budget' | 'lowest_budget';
type SourceFilter = 'all' | 'Perfiles Contratante' | 'Plataformas Agregadas' | 'Contratos Menores';

export const Dashboard: React.FC<DashboardProps> = ({ favorites, toggleFavorite, isAIEnabled, keywords }) => {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [sortOrder, setSortOrder] = useState<SortOption>('newest');
  const [selectedSource, setSelectedSource] = useState<SourceFilter>('all');
  
  const [showOnlyRelevant, setShowOnlyRelevant] = useState(true); 
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [lastViewedDate, setLastViewedDate] = useState<string>(() => {
      if (typeof window !== 'undefined') {
          return localStorage.getItem('novaHubLastViewedDate') || new Date(0).toISOString();
      }
      return new Date(0).toISOString();
  });

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await fetchTenders(keywords);
      setTenders(data);

      if (data.length > 0) {
          const newestFound = data[0].updated;
          const currentSaved = localStorage.getItem('novaHubLastViewedDate') || new Date(0).toISOString();
          
          if (new Date(newestFound) > new Date(currentSaved)) {
              localStorage.setItem('novaHubLastViewedDate', newestFound);
          }
      }
    } catch (e) {
      console.error("Failed to load tenders", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [keywords.length]);

  const handleRefresh = async () => {
    if (tenders.length > 0) {
        const newestDate = tenders[0].updated;
        setLastViewedDate(newestDate); 
    }
    await loadData(true);
  };

  const parseAmount = (amountStr?: string): number => {
    if (!amountStr) return 0;
    const clean = amountStr.replace(/[^0-9,]/g, '');
    return parseFloat(clean.replace(',', '.')) || 0;
  };

  const filteredTenders = tenders.filter(t => {
    if (showOnlyRelevant && t.keywordsFound.length === 0) {
        return false;
    }
    if (selectedSource !== 'all' && t.sourceType !== selectedSource) {
        return false;
    }
    const normalizedSearch = normalizeString(searchTerm);
    const matchesSearch = 
      normalizeString(t.title).includes(normalizedSearch) ||
      normalizeString(t.summary).includes(normalizedSearch) ||
      t.keywordsFound.some(k => normalizeString(k).includes(normalizedSearch));

    return matchesSearch;
  });

  const sortedTenders = [...filteredTenders].sort((a, b) => {
    switch (sortOrder) {
      case 'oldest':
        return new Date(a.updated).getTime() - new Date(b.updated).getTime();
      case 'highest_budget':
        return parseAmount(b.amount) - parseAmount(a.amount);
      case 'lowest_budget':
        return parseAmount(a.amount) - parseAmount(b.amount);
      case 'newest':
      default:
        return new Date(b.updated).getTime() - new Date(a.updated).getTime();
    }
  });

  const totalPages = Math.ceil(sortedTenders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentTenders = sortedTenders.slice(startIndex, startIndex + itemsPerPage);

  const isNewTender = (tenderDate: string) => {
      return new Date(tenderDate).getTime() > new Date(lastViewedDate).getTime();
  };

  const unreadCount = tenders.filter(t => isNewTender(t.updated)).length;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-100 pb-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-100">
            <Gavel size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900">Mercado de Licitaciones</h2>
            <p className="text-gray-500 text-sm font-medium">Oportunidades reales de la Plataforma de Contratación.</p>
          </div>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200">
          <button 
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all bg-white shadow-sm text-blue-600 hover:bg-blue-50"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Sincronizando...' : 'Actualizar Feeds'}</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-8 space-y-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por objeto de contrato o palabras clave..." 
            className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <button
            onClick={() => setShowOnlyRelevant(!showOnlyRelevant)}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-black border transition-all ${
                !showOnlyRelevant 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' 
                    : 'bg-white text-slate-500 border-slate-100 hover:border-blue-200' 
            }`}
          >
            <Layers size={14} />
            <span>{showOnlyRelevant ? 'Mostrando según mis intereses' : 'Mostrando todo el mercado'}</span>
          </button>

          <div className="h-8 w-px bg-slate-100 hidden sm:block"></div>

          <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value as SourceFilter)}
              className="bg-gray-50 border-none px-4 py-2.5 rounded-xl text-xs font-black text-slate-600 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
              <option value="all">Todos los orígenes</option>
              <option value="Perfiles Contratante">Perfiles Contratante</option>
              <option value="Plataformas Agregadas">Plataformas Agregadas</option>
              <option value="Contratos Menores">Contratos Menores</option>
          </select>

          <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOption)}
              className="bg-gray-50 border-none px-4 py-2.5 rounded-xl text-xs font-black text-slate-600 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
              <option value="newest">Más recientes</option>
              <option value="oldest">Cronológico inverso</option>
              <option value="highest_budget">Mayor presupuesto</option>
              <option value="lowest_budget">Menor presupuesto</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <div className="relative">
            <Loader2 className="animate-spin text-blue-600" size={48} />
            <Gavel className="absolute inset-0 m-auto text-blue-100" size={20} />
          </div>
          <p className="text-slate-400 font-black uppercase text-xs tracking-[0.2em] animate-pulse">Consultando Licitaciones en Tiempo Real...</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6">
            {currentTenders.map((tender, index) => (
              <TenderCard 
                key={tender.id} 
                tender={tender} 
                isFavorite={favorites.has(tender.id)}
                onToggleFavorite={() => toggleFavorite(tender)}
                isAIEnabled={isAIEnabled}
              />
            ))}
          </div>

          {currentTenders.length === 0 && (
            <div className="text-center py-24 bg-white rounded-[32px] border border-dashed border-slate-200">
              <Search className="mx-auto h-16 w-16 text-slate-100 mb-6" />
              <h3 className="text-xl font-black text-slate-900 mb-2">Sin resultados para esta búsqueda</h3>
              <p className="text-slate-400 font-medium max-w-sm mx-auto mb-8">
                Prueba con otros términos o cambia el filtro de intereses.
              </p>
              <button 
                onClick={() => { setSearchTerm(''); setShowOnlyRelevant(false); }}
                className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all"
              >
                Limpiar Filtros
              </button>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-4 pt-8">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-3 rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className="px-6 py-2 bg-slate-100 rounded-xl text-xs font-black text-slate-600">
                PÁGINA {currentPage} DE {totalPages}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-3 rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
