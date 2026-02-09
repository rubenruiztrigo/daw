
import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, Users, Sparkles, Plus, X, Check, Save, Loader2, ChevronDown, Megaphone, Share2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { CalendarEvent } from '../types';
import { UsersListModal } from './UsersListModal';

interface CalendarViewProps {
  onNavigateToEvent?: (userId: string, eventId: string) => void;
  onPromoteEvent?: (event: CalendarEvent) => void;
  onSupportEvent?: (event: CalendarEvent) => void;
  onShareEvent?: (event: CalendarEvent) => void;
  initialDate?: Date | null;
}

interface EventDisplay extends CalendarEvent {
  time: string;
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const YEARS = [2024, 2025, 2026, 2027, 2028, 2029];
export const CalendarView: React.FC<CalendarViewProps> = ({ onNavigateToEvent, onPromoteEvent, onSupportEvent, onShareEvent, initialDate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const location = useLocation();
  const [events, setEvents] = useState<EventDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [viewingSupportersEventId, setViewingSupportersEventId] = useState<string | null>(null);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const selectedDay = currentDate.getDate();

  // ... (existing effects)

  // New effect to handle navigation state
  useEffect(() => {
    if (location.state?.date) {
      // Parse the date string (YYYY-MM-DD) or ensure it's a valid date object
      const newDate = new Date(location.state.date);
      if (!isNaN(newDate.getTime())) {
        // Fix: Ensure we are setting it to the correct local day, preventing timezone shifts
        // Since input is usually YYYY-MM-DD string from database
        const [year, month, day] = location.state.date.toString().split('-').map(Number);
        if (year && month && day) {
          setCurrentDate(new Date(year, month - 1, day));
        } else {
          setCurrentDate(newDate);
        }
      }
    }
  }, [location.state]);

  useEffect(() => {
    if (initialDate) {
      setCurrentDate(initialDate);
    }
    fetchEvents();
  }, [initialDate]);

  const fetchEvents = async () => {
    setLoading(true);
    // Filtrar: solo eventos con al menos 2 apoyos aparecen en el calendario global
    const { data, error } = await supabase
      .from('user_events')
      .select('*')
      .gte('attendees_count', 2)
      .order('event_date', { ascending: true });

    if (!error && data) {
      const mapped = data.map(ev => ({
        id: ev.id,
        creator_id: ev.creator_id,
        title: ev.title,
        type: ev.type as any,
        event_date: ev.event_date,
        event_time: ev.event_time,
        location: ev.location,
        description: ev.description,
        attendees: ev.attendees_count,
        time: ev.event_time.substring(0, 5)
      }));
      setEvents(mapped);
    }
    setLoading(false);
  };

  const mappedEventsByDate = useMemo(() => {
    const record: Record<string, EventDisplay[]> = {};
    events.forEach(ev => {
      const parts = ev.event_date.split('-');
      // Aseguramos formato YYYY-MM-DD
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Meses en JS son 0-11
        const day = parseInt(parts[2], 10);
        const key = `${year}-${month}-${day}`;
        if (!record[key]) record[key] = [];
        record[key].push(ev);
      }
    });
    return record;
  }, [events]);

  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate();
  }, [currentMonth, currentYear]);

  const firstDayOfMonth = useMemo(() => {
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

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'physical': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
      case 'online_course': return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'meeting': return 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'physical': return 'Evento Presencial';
      case 'online_course': return 'Curso Online';
      case 'meeting': return 'Reunión';
      default: return type;
    }
  };

  const dateKey = `${currentYear}-${currentMonth}-${selectedDay}`;
  const todaysEvents = mappedEventsByDate[dateKey] || [];

  return (
    <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-8 pb-20 animate-in fade-in duration-500 relative" onClick={() => setIsSelectorOpen(false)}>
      <div className="flex-1 bg-white dark:bg-[#111] p-8 rounded-[2.5rem] border border-gray-100 dark:border-zinc-900 relative overflow-visible">
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
                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-1">Agenda Comunitaria Red Social</p>
              </div>
            </button>

            {isSelectorOpen && (
              <div
                className="absolute top-full left-0 mt-4 w-72 bg-white dark:bg-[#0a0a0a] rounded-[2rem] border border-gray-100 dark:border-zinc-800 z-50 p-6 animate-in zoom-in-95 duration-200"
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

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
            <p className="text-gray-400 font-bold">Cargando agenda comunitaria...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-7 gap-4 text-center mb-6">
              {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
                <span key={d} className="text-[10px] font-black text-gray-300 dark:text-zinc-700 uppercase tracking-widest">{d}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const hasEvents = mappedEventsByDate[`${currentYear}-${currentMonth}-${day}`];
                const isSelected = selectedDay === day;
                return (
                  <button
                    key={day}
                    onClick={() => selectDate(day)}
                    className={`aspect-square rounded-[1.5rem] flex flex-col items-center justify-center relative transition-all border-2 ${isSelected
                      ? 'bg-blue-600 border-blue-600 text-white'
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
          </>
        )}

        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/20">
          <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold leading-relaxed">
            💡 Nota: Solo los eventos con al menos 2 apoyos de la comunidad aparecen en el calendario global.
            Organiza tus propios eventos desde tu perfil.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-96 space-y-6">
        <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white relative overflow-hidden">
          <Sparkles className="absolute top-4 right-4 opacity-30" size={24} />
          <h3 className="text-4xl font-black mb-1 italic">{selectedDay}</h3>
          <p className="text-blue-100 font-bold uppercase text-xs tracking-widest">{MONTHS[currentMonth]}</p>
        </div>

        <div className="space-y-4">
          {todaysEvents.length > 0 ? (
            todaysEvents.map(event => (
              <div key={event.id} className="bg-white dark:bg-[#111] p-6 rounded-[2rem] border border-gray-100 dark:border-zinc-900 hover:border-gray-200 dark:hover:border-zinc-800 transition-all group relative">
                <div className="absolute top-6 right-6">
                </div>
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider mb-3 inline-block ${getTypeStyle(event.type)}`}>
                  {getTypeName(event.type)}
                </span>
                <h4 className="text-gray-900 dark:text-white font-black text-lg leading-tight mb-4 group-hover:text-blue-600 transition-colors pr-24">
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
                  <div className="flex items-center text-xs text-blue-600 font-bold">
                    <Users size={14} className="mr-2" />
                    <button
                      onClick={(e) => { e.stopPropagation(); setViewingSupportersEventId(event.id); }}
                      className="hover:underline cursor-pointer"
                    >
                      {event.attendees} apoyos
                    </button>
                  </div>
                  <button
                    onClick={() => onNavigateToEvent?.(event.creator_id, event.id)}
                    className="w-full py-3 bg-gray-50 dark:bg-zinc-900 text-slate-900 dark:text-white rounded-xl text-xs font-black hover:bg-gray-100 transition-all"
                  >
                    Ver detalles del evento
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white dark:bg-[#111] p-10 rounded-[2rem] border border-dashed border-gray-200 dark:border-zinc-800 text-center">
              <CalendarIcon className="mx-auto text-gray-100 dark:text-zinc-900 mb-4" size={48} />
              <p className="text-gray-400 font-bold italic text-sm">No hay eventos comunitarios confirmados para este día.</p>
            </div>
          )}
        </div>
      </div>

      {viewingSupportersEventId && (
        <UsersListModal
          type="event-supporters"
          userId={viewingSupportersEventId}
          onClose={() => setViewingSupportersEventId(null)}
          onNavigate={(id) => onNavigateToEvent?.(id, '')} // Simple navigation to profile, eventId irrelevant for this call
        />
      )}
    </div>
  );
};
