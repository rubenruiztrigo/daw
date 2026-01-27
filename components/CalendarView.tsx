
import React, { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, Users, Sparkles, Plus, X, Check, Save, Loader2, ChevronDown } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  type: 'innovation' | 'training' | 'meeting' | 'congress';
  time: string;
  location: string;
  attendees: number;
  description: string;
}

const MOCK_EVENTS: Record<string, Event[]> = {
  "2024-5-15": [
    { id: '1', title: 'Congreso NovaGob 2024', type: 'congress', time: '09:00', location: 'Sede Central / Online', attendees: 450, description: 'El mayor evento de innovación pública en iberoamérica.' },
    { id: '2', title: 'Webinar: IA en Gobiernos Locales', type: 'training', time: '16:30', location: 'Zoom', attendees: 120, description: 'Sesión práctica sobre implementación de LLMs en ayuntamientos.' }
  ],
  "2024-5-18": [
    { id: '3', title: 'Reunión de Laboratorios de Innovación', type: 'innovation', time: '11:00', location: 'Sala 3B', attendees: 15, description: 'Coordinación trimestral de laboratorios de innovación ciudadana.' }
  ],
  "2024-6-10": [
    { id: '4', title: 'Taller de Transparencia Activa', type: 'training', time: '10:00', location: 'Aula Virtual', attendees: 85, description: 'Mejora de los portales de datos abiertos institucionales.' }
  ]
};

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const YEARS = [2024, 2025, 2026, 2027, 2028, 2029];

export const CalendarView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2024, 5, 15)); // Junio 2024 por defecto
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    type: 'innovation' as Event['type'],
    date: '',
    time: '',
    location: '',
    description: ''
  });

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const selectedDay = currentDate.getDate();

  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate();
  }, [currentMonth, currentYear]);

  const firstDayOfMonth = useMemo(() => {
    // getDay() devuelve 0 para domingo, queremos que 0 sea Lunes
    let day = new Date(currentYear, currentMonth, 1).getDay();
    return day === 0 ? 6 : day - 1;
  }, [currentMonth, currentYear]);

  const changeMonth = (delta: number) => {
    const nextDate = new Date(currentYear, currentMonth + delta, 1);
    setCurrentDate(nextDate);
  };

  const selectDate = (day: number) => {
    setCurrentDate(new Date(currentYear, currentMonth, day));
  };

  const handleSuggest = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsModalOpen(false);
      setShowSuccessToast(true);
      setFormData({ title: '', type: 'innovation', date: '', time: '', location: '', description: '' });
      setTimeout(() => setShowSuccessToast(false), 3000);
    }, 1500);
  };

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'innovation': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
      case 'training': return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'congress': return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
      case 'meeting': return 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const dateKey = `${currentYear}-${currentMonth}-${selectedDay}`;
  const todaysEvents = MOCK_EVENTS[dateKey] || [];

  return (
    <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-8 pb-20 animate-in fade-in duration-500 relative" onClick={() => setIsSelectorOpen(false)}>
      {/* Calendario */}
      <div className="flex-1 bg-white dark:bg-[#111] p-8 rounded-[2.5rem] border border-gray-100 dark:border-zinc-900 shadow-sm relative overflow-visible">
        <div className="flex items-center justify-between mb-10">
          <div className="relative">
            <button 
              onClick={(e) => { e.stopPropagation(); setIsSelectorOpen(!isSelectorOpen); }}
              className="group flex items-center space-x-2 text-left hover:bg-gray-50 dark:hover:bg-zinc-800 p-2 -m-2 rounded-2xl transition-all"
            >
              <div>
                <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center">
                  {MONTHS[currentMonth]} {currentYear}
                  <ChevronDown size={24} className={`ml-2 text-blue-600 transition-transform duration-300 ${isSelectorOpen ? 'rotate-180' : ''}`} />
                </h2>
                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-1">Agenda Institucional Red Social</p>
              </div>
            </button>

            {/* Selector de Mes y Año Popover */}
            {isSelectorOpen && (
              <div 
                className="absolute top-full left-0 mt-4 w-72 bg-white dark:bg-[#0a0a0a] rounded-[2rem] shadow-2xl border border-gray-100 dark:border-zinc-800 z-50 p-6 animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Seleccionar Mes</label>
                    <div className="grid grid-cols-3 gap-2">
                      {MONTHS.map((m, idx) => (
                        <button 
                          key={m}
                          onClick={() => { setCurrentDate(new Date(currentYear, idx, 1)); setIsSelectorOpen(false); }}
                          className={`py-2 text-[11px] font-bold rounded-xl transition-all ${idx === currentMonth ? 'bg-blue-600 text-white' : 'bg-gray-50 dark:bg-zinc-900 text-gray-500 hover:bg-gray-100'}`}
                        >
                          {m.substring(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Seleccionar Año</label>
                    <div className="grid grid-cols-3 gap-2">
                      {YEARS.map((y) => (
                        <button 
                          key={y}
                          onClick={() => { setCurrentDate(new Date(y, currentMonth, 1)); setIsSelectorOpen(false); }}
                          className={`py-2 text-xs font-bold rounded-xl transition-all ${y === currentYear ? 'bg-blue-600 text-white' : 'bg-gray-50 dark:bg-zinc-900 text-gray-500 hover:bg-gray-100'}`}
                        >
                          {y}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex space-x-2">
            <button onClick={() => changeMonth(-1)} className="p-3 bg-gray-50 dark:bg-zinc-800 rounded-2xl hover:bg-gray-100 transition-all"><ChevronLeft size={20} /></button>
            <button onClick={() => changeMonth(1)} className="p-3 bg-gray-50 dark:bg-zinc-800 rounded-2xl hover:bg-gray-100 transition-all"><ChevronRight size={20} /></button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-4 text-center mb-6">
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
            <span key={d} className="text-[10px] font-black text-gray-300 dark:text-zinc-700 uppercase tracking-widest">{d}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {/* Espacios vacíos para el inicio del mes */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          
          {/* Días del mes */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const hasEvents = MOCK_EVENTS[`${currentYear}-${currentMonth}-${day}`];
            const isSelected = selectedDay === day;
            return (
              <button 
                key={day} 
                onClick={() => selectDate(day)}
                className={`aspect-square rounded-[1.5rem] flex flex-col items-center justify-center relative transition-all border-2 ${
                  isSelected 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-100 dark:shadow-none' 
                    : 'bg-white dark:bg-zinc-900 border-transparent hover:border-gray-100 dark:hover:border-zinc-800 text-gray-600 dark:text-gray-400'
                }`}
              >
                <span className="text-lg font-black">{day}</span>
                {hasEvents && !isSelected && (
                  <div className="absolute bottom-2 w-1.5 h-1.5 bg-blue-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full mt-8 py-4 bg-slate-50 dark:bg-zinc-900 text-blue-600 dark:text-blue-400 rounded-2xl font-black text-sm border border-dashed border-blue-200 dark:border-blue-800 flex items-center justify-center space-x-2 hover:bg-blue-50 transition-all active:scale-95"
        >
          <Plus size={18} />
          <span>Sugerir nuevo evento</span>
        </button>
      </div>

      {/* Eventos del día */}
      <div className="w-full lg:w-96 space-y-6">
        <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-blue-100 dark:shadow-none relative overflow-hidden">
          <Sparkles className="absolute top-4 right-4 opacity-30" size={24} />
          <h3 className="text-4xl font-black mb-1 italic">{selectedDay}</h3>
          <p className="text-blue-100 font-bold uppercase text-xs tracking-widest">{MONTHS[currentMonth]}</p>
        </div>

        <div className="space-y-4">
          {todaysEvents.length > 0 ? (
            todaysEvents.map(event => (
              <div key={event.id} className="bg-white dark:bg-[#111] p-6 rounded-[2rem] border border-gray-100 dark:border-zinc-900 shadow-sm hover:shadow-md transition-all group">
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider mb-3 inline-block ${getTypeStyle(event.type)}`}>
                  {event.type}
                </span>
                <h4 className="text-gray-900 dark:text-white font-black text-lg leading-tight mb-4 group-hover:text-blue-600 transition-colors">
                  {event.title}
                </h4>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-xs text-gray-500 font-medium">
                    <Clock size={14} className="mr-2 opacity-50" />
                    <span>{event.time}h</span>
                  </div>
                  <div className="flex items-center text-xs text-gray-500 font-medium">
                    <MapPin size={14} className="mr-2 opacity-50" />
                    <span className="truncate">{event.location}</span>
                  </div>
                  <div className="flex items-center text-xs text-gray-500 font-medium">
                    <Users size={14} className="mr-2 opacity-50" />
                    <span>{event.attendees} inscritos</span>
                  </div>
                </div>
                <button className="w-full py-3 bg-gray-50 dark:bg-zinc-900 text-slate-900 dark:text-white rounded-xl text-xs font-black hover:bg-gray-100 transition-all">
                  Ver detalles del evento
                </button>
              </div>
            ))
          ) : (
            <div className="bg-white dark:bg-[#111] p-10 rounded-[2rem] border border-dashed border-gray-200 dark:border-zinc-800 text-center">
              <CalendarIcon className="mx-auto text-gray-100 dark:text-zinc-900 mb-4" size={48} />
              <p className="text-gray-400 font-bold italic text-sm">No hay eventos para este día.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Sugerir Evento */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#0a0a0a] w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 border border-white dark:border-zinc-800">
            <div className="px-8 py-6 border-b border-slate-50 dark:border-zinc-900 flex justify-between items-center sticky top-0 bg-white dark:bg-[#0a0a0a] z-10">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-lg"><CalendarIcon size={20} /></div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Sugerir Evento</h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Propón una actividad a la administración</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-50 dark:hover:bg-zinc-900 rounded-full text-slate-400 transition-all"><X size={24} /></button>
            </div>

            <form onSubmit={handleSuggest} className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-widest ml-1">Título del Evento</label>
                  <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Ej. Taller de Transformación Digital" className="w-full px-5 py-3.5 bg-gray-50 dark:bg-zinc-900 border border-transparent rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-widest ml-1">Tipo de Evento</label>
                    <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})} className="w-full px-5 py-3.5 bg-gray-50 dark:bg-zinc-900 border border-transparent rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none dark:text-white appearance-none">
                      <option value="innovation">Innovación</option>
                      <option value="training">Formación</option>
                      <option value="meeting">Reunión</option>
                      <option value="congress">Congreso</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-widest ml-1">Ubicación</label>
                    <input required type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="Ej. Sala A / Online" className="w-full px-5 py-3.5 bg-gray-50 dark:bg-zinc-900 border border-transparent rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition-all" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-widest ml-1">Fecha</label>
                    <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-5 py-3.5 bg-gray-50 dark:bg-zinc-900 border border-transparent rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition-all" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-widest ml-1">Hora</label>
                    <input required type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="w-full px-5 py-3.5 bg-gray-50 dark:bg-zinc-900 border border-transparent rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition-all" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-widest ml-1">Descripción corta</label>
                  <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Describe brevemente el objetivo del evento..." className="w-full p-5 bg-gray-50 dark:bg-zinc-900 border border-transparent rounded-[1.5rem] text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 dark:text-white min-h-[100px] resize-none leading-relaxed" />
                </div>
              </div>

              <div className="pt-4 flex space-x-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-gray-400 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all active:scale-95">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-100 dark:shadow-none hover:bg-blue-700 transition-all flex items-center justify-center space-x-2 transform active:scale-95 disabled:opacity-50">
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /><span>Enviar Sugerencia</span></>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] bg-emerald-600 text-white px-8 py-4 rounded-[2rem] shadow-2xl flex items-center space-x-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="p-1 bg-white/20 rounded-full"><Check size={18} strokeWidth={4} /></div>
          <div>
            <p className="text-sm font-black">Sugerencia enviada</p>
            <p className="text-[10px] opacity-80 font-bold uppercase tracking-widest">La administración revisará tu propuesta</p>
          </div>
        </div>
      )}
    </div>
  );
};
