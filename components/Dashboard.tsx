
import React, { useEffect, useState } from 'react';
import { fetchTenders } from '../services/tenderService';
import { Tender } from '../types';
import { TenderCard } from './TenderCard';
import { Search, Loader2, ChevronLeft, ChevronRight, Filter, Layers, Database, RefreshCw, CheckCircle2 } from 'lucide-react';

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
  
  // Pagination and Filtering State
  const [sortOrder, setSortOrder] = useState<SortOption>('newest');
  const [selectedSource, setSelectedSource] = useState<SourceFilter>('all');
  
  // Default to true as requested: show only NovaGob relevant tenders first
  const [showOnlyRelevant, setShowOnlyRelevant] = useState(true); 
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Last Seen Logic
  // This state determines the "Cutoff" for what is considered NEW in the CURRENT viewing session.
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

      // SILENT UPDATE: Update localStorage with the newest date found.
      // This ensures that if the user reloads the page (F5) or comes back later,
      // these items will be considered "read" (Last Viewed).
      // We do NOT update 'lastViewedDate' state here, so the user still sees the "New" markers
      // during this session until they manually refresh or leave.
      if (data.length > 0) {
          // Data is sorted desc by default in service, so index 0 is newest
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

  // Re-load data if keywords change substantially to re-calculate keyword matches
  // We use the length to avoid excessive re-renders, but ideally should deep check or manual refresh.
  // For simplicity, we just trigger it.
  useEffect(() => {
    loadData();
  }, [keywords.length]); // Simple dependency check

  const handleRefresh = async () => {
    // When manual refreshing:
    // 1. We essentially say "I have seen everything up to this point".
    //    So we update the VISUAL state (lastViewedDate) to the current top item.
    if (tenders.length > 0) {
        const newestDate = tenders[0].updated;
        setLastViewedDate(newestDate); 
        // Note: localStorage is also updated in loadData, but we set state here to clear 
        // the "New" markers from the UI immediately before fetching potentially newer ones.
    }
    
    // 2. Fetch new data
    await loadData(true);
  };

  // Helper to parse currency string (e.g. "40.631,78 €") to number
  const parseAmount = (amountStr?: string): number => {
    if (!amountStr) return 0;
    const clean = amountStr.replace(/[^0-9,]/g, '');
    return parseFloat(clean.replace(',', '.')) || 0;
  };

  // Filter Logic
  const filteredTenders = tenders.filter(t => {
    // 1. Keyword Relevance Filter
    if (showOnlyRelevant && t.keywordsFound.length === 0) {
        return false;
    }

    // 2. Source Filter
    if (selectedSource !== 'all' && t.sourceType !== selectedSource) {
        return false;
    }

    // 3. Search Term
    const matchesSearch = 
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.keywordsFound.some(k => k.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    return true;
  });

  // Sort Logic
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

  // Pagination Logic
  const totalPages = Math.ceil(sortedTenders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentTenders = sortedTenders.slice(startIndex, startIndex + itemsPerPage);

  // Helper to check if a tender is "New" (newer than last viewed)
  const isNewTender = (tenderDate: string) => {
      // It is new if it is strictly newer than what we saw last time we entered the app.
      return new Date(tenderDate).getTime() > new Date(lastViewedDate).getTime();
  };

  // Calculate unread count (based on unfiltered list to be accurate about "New" arrivals)
  const unreadCount = tenders.filter(t => isNewTender(t.updated)).length;

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortOrder, showOnlyRelevant, selectedSource]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Panel de Licitaciones</h2>
            <p className="text-gray-600 dark:text-gray-400">Explora las últimas oportunidades del sector público.</p>
        </div>
        
        <div className="flex items-center gap-4">
            {/* Unread Counter Badge */}
            {unreadCount > 0 && (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 hidden sm:inline-block">
                        Licitaciones sin leer
                    </span>
                    <span className="flex items-center justify-center bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[24px] h-6 shadow-md ring-2 ring-white dark:ring-slate-900">
                        {unreadCount}
                    </span>
                </div>
            )}

            {/* Refresh Button */}
            <button 
                onClick={handleRefresh}
                disabled={refreshing || loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors disabled:opacity-50 font-medium text-sm"
            >
                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                {refreshing ? 'Actualizando...' : 'Actualizar'}
            </button>
        </div>
      </div>

      {/* Controls Container */}
      <div className="space-y-4 mb-6">
          {/* Top Row: Search */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-end md:items-center">
            {/* Search */}
            <div className="w-full bg-white dark:bg-slate-900 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 flex items-center space-x-3 focus-within:ring-2 ring-blue-500/20 transition-all">
            <Search className="text-gray-400" size={20} />
            <input 
                type="text" 
                placeholder="Buscar por título o palabra clave..." 
                className="flex-1 bg-white dark:bg-slate-900 text-gray-900 dark:text-white outline-none placeholder-gray-400 text-sm transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            </div>
          </div>

          {/* Bottom Row: Relevance Toggle + Filters + Sort */}
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
             {/* Show All Toggle */}
             <button
                onClick={() => setShowOnlyRelevant(!showOnlyRelevant)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all text-sm font-medium whitespace-nowrap ${
                    !showOnlyRelevant // If "Show All" is ACTIVE (unfiltered)
                        ? 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800' // Active Color
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-slate-900 dark:text-gray-300 dark:border-slate-700 dark:hover:bg-slate-800' // Inactive Gray
                }`}
             >
                <Layers size={16} />
                <span>Mostrar todas</span>
             </button>

             {/* Filters & Count */}
             <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full xl:w-auto xl:justify-end">
                <span className="whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden sm:inline-block">{sortedTenders.length} resultados</span>
                
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    {/* Source Filter */}
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm transition-colors w-full sm:w-auto">
                        <Database size={14} className="text-gray-400 flex-shrink-0" />
                        <select
                            value={selectedSource}
                            onChange={(e) => setSelectedSource(e.target.value as SourceFilter)}
                            className="bg-transparent border-none text-gray-700 dark:text-gray-200 font-medium focus:ring-0 cursor-pointer outline-none text-sm w-full sm:w-[180px]"
                        >
                            <option value="all" className="dark:bg-slate-900">Todos los orígenes</option>
                            <option value="Perfiles Contratante" className="dark:bg-slate-900">Perfiles Contratante</option>
                            <option value="Plataformas Agregadas" className="dark:bg-slate-900">Plataformas Agregadas</option>
                            <option value="Contratos Menores" className="dark:bg-slate-900">Contratos Menores</option>
                        </select>
                    </div>

                    {/* Sort Filter */}
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm transition-colors w-full sm:w-auto">
                        <Filter size={14} className="text-gray-400 flex-shrink-0" />
                        <select
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value as SortOption)}
                            className="bg-transparent border-none text-gray-700 dark:text-gray-200 font-medium focus:ring-0 cursor-pointer outline-none text-sm w-full sm:w-auto"
                        >
                            <option value="newest" className="dark:bg-slate-900">Más recientes</option>
                            <option value="oldest" className="dark:bg-slate-900">Más antiguas</option>
                            <option value="highest_budget" className="dark:bg-slate-900">Mayor presupuesto</option>
                            <option value="lowest_budget" className="dark:bg-slate-900">Menor presupuesto</option>
                        </select>
                    </div>
                </div>
             </div>
          </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="animate-spin text-blue-600 dark:text-blue-400 mb-4" size={40} />
          <p className="text-gray-500 dark:text-gray-400">Consultando Feeds Oficiales...</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-4">
            {currentTenders.map((tender, index) => {
                // Logic for "Unseen" divider
                // We show the "Vistas anteriormente" divider when we transition from a NEW item to an OLD item.
                // Or if the very first item is already OLD, we assume everything is old (no new messages).
                
                // Is this specific tender older or equal to last seen?
                const isOld = !isNewTender(tender.updated);
                
                // Was the previous one new? (or is this the first one and it's old?)
                const prevWasNew = index > 0 ? isNewTender(currentTenders[index-1].updated) : false;
                
                // Show Divider IF:
                // 1. We are at index 0 and this item is OLD (Meaning NO new items at all on this page) -> Optional, maybe don't show.
                // 2. We are at index > 0, previous was NEW, and current is OLD.
                
                const showDivider = (index > 0 && prevWasNew && isOld);

                return (
                    <React.Fragment key={tender.id}>
                        {/* Divider for "No vistas" vs "Vistas" */}
                        {showDivider && (
                            <div className="flex items-center gap-4 py-4">
                                <div className="h-px bg-blue-200 dark:bg-blue-900 flex-1"></div>
                                <div className="px-4 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                    <CheckCircle2 size={12} />
                                    No vistas arriba &bull; Vistas abajo
                                </div>
                                <div className="h-px bg-blue-200 dark:bg-blue-900 flex-1"></div>
                            </div>
                        )}
                        
                        {/* Visual indicator for New items */}
                        <div className="relative">
                            {isNewTender(tender.updated) && (
                                <div className="absolute -left-2 top-6 w-1 h-12 bg-blue-500 rounded-r-lg shadow-sm" title="Nueva licitación"></div>
                            )}
                            <TenderCard 
                                tender={tender} 
                                isFavorite={favorites.has(tender.id)}
                                onToggleFavorite={() => toggleFavorite(tender)}
                                isAIEnabled={isAIEnabled}
                            />
                        </div>
                    </React.Fragment>
                );
            })}
            
            {currentTenders.length === 0 && (
              <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-gray-300 dark:border-slate-700 transition-colors">
                <Search className="mx-auto h-12 w-12 text-gray-300 dark:text-slate-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">No se encontraron licitaciones</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-md mx-auto">
                    {showOnlyRelevant 
                        ? 'No hay licitaciones relevantes para NovaGob con los filtros actuales.' 
                        : 'No se encontraron resultados. Prueba a cambiar el filtro de origen o el término de búsqueda.'}
                </p>
                {showOnlyRelevant && (
                    <button 
                        onClick={() => setShowOnlyRelevant(false)}
                        className="mt-4 text-blue-600 dark:text-blue-400 font-medium hover:underline"
                    >
                        Ver todas las licitaciones
                    </button>
                )}
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 py-6 border-t border-gray-200 dark:border-slate-800">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
                Anterior
              </button>
              
              <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Página {currentPage} de {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
