import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, Users, Sparkles, Plus, X, Check, Save, Loader2, ChevronDown, Megaphone, Share2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { CalendarEvent } from '../types';
import { UsersListModal } from './UsersListModal';
import { Language, useTranslation } from '../utils/translations';

interface CalendarViewProps {
  onNavigateToEvent?: (userId: string, eventId: string) => void;
  onPromoteEvent?: (event: CalendarEvent) => void;
  onSupportEvent?: (event: CalendarEvent) => void;
  onShareEvent?: (event: CalendarEvent) => void;
  initialDate?: Date | null;
  language: Language;
}

interface EventDisplay extends CalendarEvent {
  time: string;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onNavigateToEvent, onPromoteEvent, onSupportEvent, onShareEvent, initialDate, language }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const location = useLocation();
  const [events, setEvents] = useState<EventDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [viewingSupportersEventId, setViewingSupportersEventId] = useState<string | null>(null);
  const t = useTranslation(language);

  const MONTHS = useMemo(() => [
    t('january'), t('february'), t('march'), t('april'), t('may'), t('june'),
    t('july'), t('august'), t('september'), t('october'), t('november'), t('december')
  ], [t]);

  const YEARS = [2024, 2025, 2026, 2027, 2028, 2029];

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const selectedDay = currentDate.getDate();

  useEffect(() => {
    if (location.state?.date) {
      const parts = location.state.date.toString().split('-').map(Number);
      if (parts.length === 3) {
        const [year, month, day] = parts;
        setCurrentDate(new Date(year, month - 1, day));
      } else {
        const newDate = new Date(location.state.date);
        if (!isNaN(newDate.getTime())) setCurrentDate(newDate);
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
    const { data, error } = await supabase
      .from('user_events')
      .select('*')
      .order('event_date', { ascending: true });

    if (!error && data) {
      const mapped = data.map(ev => ({
        id: ev.id,
        creator_id: ev.creator_id,
        title: ev.title,
        type: (ev.type === 'online_course' || ev.type === 'meeting') ? 'online' : ev.type,
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
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
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
      case 'online':
      case 'online_course': return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'meeting': return 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'physical': return t('event_physical');
      case 'online':
      case 'online_course': return t('event_online');
      case 'meeting': return t('event_meeting');
      default: return type;
    }
  };

  const dateKey = `${currentYear}-${currentMonth}-${selectedDay}`;
  const todaysEvents = mappedEventsByDate[dateKey] || [];

  return (
    <div className="w-full flex flex-col lg:flex-row gap-8 pb-20 animate-in fade-in duration-500 relative" onClick={() => setIsSelectorOpen(false)}>
      <div className="flex-1 bg-white dark:bg-[#111] p-3 md:p-5 rounded-[2.5rem] border border-gray-100 dark:border-zinc-900 relative overflow-visible">
        <div className="flex items-center justify-between mb-2 md:mb-4">
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setIsSelectorOpen(!isSelectorOpen); }}
              className="group flex items-center space-x-2 text-left hover:bg-gray-50 dark:hover:bg-zinc-800 p-2 -m-2 rounded-2xl transition-all"
            >
              <div>
                <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight flex items-center">
                  {MONTHS[currentMonth]} {currentYear}
                  <ChevronDown size={18} className={`ml-2 text-blue-600 transition-transform duration-300 ${isSelectorOpen ? 'rotate-180' : ''}`} />
                </h2>
                <p className="text-gray-400 font-bold uppercase text-[9px] tracking-widest mt-0">{t('community_agenda')}</p>
              </div>
            </button>

            {isSelectorOpen && (
              <div
                className="absolute top-full left-0 mt-4 w-72 bg-white dark:bg-[#0a0a0a] rounded-[2rem] border border-gray-100 dark:border-zinc-800 z-50 p-6 animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">{t('select_month')}</label>
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
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">{t('select_year')}</label>
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
          <div className="flex space-x-1">
            <button onClick={() => changeMonth(-1)} className="p-2 bg-gray-50 dark:bg-zinc-800 rounded-xl hover:bg-gray-100 transition-all"><ChevronLeft size={18} /></button>
            <button onClick={() => changeMonth(1)} className="p-2 bg-gray-50 dark:bg-zinc-800 rounded-xl hover:bg-gray-100 transition-all"><ChevronRight size={18} /></button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
            <p className="text-gray-400 font-bold">{t('loading_agenda')}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-7 gap-4 text-center mb-2">
              {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d, i) => {
                const enDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
                return (
                  <span key={i} className="text-[10px] font-black text-gray-300 dark:text-zinc-700 uppercase tracking-widest">{language === 'es' ? d : enDays[i]}</span>
                );
              })}
            </div>

            <div className="grid grid-cols-7 gap-1 md:gap-2">
              {Array.from({ length: 42 }).map((_, i) => {
                const day = i + 1 - firstDayOfMonth;
                const isCurrentMonth = day > 0 && day <= daysInMonth;

                if (!isCurrentMonth) {
                  return <div key={`empty-${i}`} className="aspect-[1.25/1]" />;
                }

                const hasEvents = mappedEventsByDate[`${currentYear}-${currentMonth}-${day}`];
                const isSelected = selectedDay === day;
                return (
                  <button
                    key={day}
                    onClick={() => selectDate(day)}
                    className={`aspect-[1.25/1] rounded-xl flex flex-col items-center justify-center relative transition-all border-2 ${isSelected
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white dark:bg-zinc-900 border-transparent hover:border-gray-100 dark:hover:border-zinc-800 text-gray-600 dark:text-gray-400'
                      }`}
                  >
                    <span className="text-sm font-black">{day}</span>
                    {hasEvents && (
                      <div className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full transition-all duration-300 ${isSelected ? 'bg-white ring-2 ring-white/20' : 'bg-blue-600 ring-2 ring-white/50 dark:ring-zinc-900/50'}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}

        <div className="mt-1 md:mt-2 p-2 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/20">
          <p className="text-[9px] text-blue-600 dark:text-blue-400 font-bold leading-tight">
            {t('calendar_note')}
          </p>
        </div>
      </div>

      <div className="w-full lg:w-96 space-y-4">
        <div className="bg-blue-600 p-6 rounded-[2rem] text-white relative overflow-hidden">
          <Sparkles className="absolute top-3 right-3 opacity-30" size={20} />
          <h3 className="text-2xl font-black mb-0.5 italic">{selectedDay}</h3>
          <p className="text-blue-100 font-bold uppercase text-[10px] tracking-widest">{MONTHS[currentMonth]}</p>
        </div>

        <div className="space-y-3">
          {todaysEvents.length > 0 ? (
            todaysEvents.map(event => (
              <div key={event.id} className="bg-white dark:bg-[#111] p-4 rounded-[1.5rem] border border-gray-100 dark:border-zinc-900 hover:border-gray-200 dark:hover:border-zinc-800 transition-all group relative">
                <div className="absolute top-4 right-4">
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider mb-2 inline-block ${getTypeStyle(event.type)}`}>
                  {getTypeName(event.type)}
                </span>
                <h4 className="text-gray-900 dark:text-white font-black text-base leading-tight mb-3 group-hover:text-blue-600 transition-colors pr-10">
                  {event.title}
                </h4>
                <div className="space-y-1.5 mb-3">
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
                      {t('supports', { count: event.attendees })}
                    </button>
                  </div>
                  <button
                    onClick={() => onNavigateToEvent?.(event.creator_id, event.id)}
                    className="w-full py-2 bg-gray-50 dark:bg-zinc-900 text-slate-900 dark:text-white rounded-lg text-[10px] font-black hover:bg-gray-100 transition-all"
                  >
                    {t('view_event_details')}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white dark:bg-[#111] p-10 rounded-[2rem] border border-dashed border-gray-200 dark:border-zinc-800 text-center">
              <CalendarIcon className="mx-auto text-gray-100 dark:text-zinc-900 mb-4" size={48} />
              <p className="text-gray-400 font-bold italic text-sm">{t('no_events_today')}</p>
            </div>
          )}
        </div>
      </div>

      {viewingSupportersEventId && (
        <UsersListModal
          type="event-supporters"
          userId={viewingSupportersEventId}
          onClose={() => setViewingSupportersEventId(null)}
          onNavigate={(id) => onNavigateToEvent?.(id, '')}
        />
      )}
    </div>
  );
};
