import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, Users, Sparkles, Plus, X, Check, Save, Loader2, ChevronDown, Megaphone, Share2, Info } from 'lucide-react';
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
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const [viewingSupportersEventId, setViewingSupportersEventId] = useState<string | null>(null);
  const t = useTranslation(language);

  const MONTHS = useMemo(() => [
    t('january'), t('february'), t('march'), t('april'), t('may'), t('june'),
    t('july'), t('august'), t('september'), t('october'), t('november'), t('december')
  ], [t]);

  const YEARS = useMemo(() => {
    const year = new Date().getFullYear();
    return [year - 1, year, year + 1];
  }, []);

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

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.key === '=' || e.key === '-' || e.key === '0' || e.key === '+')) {
        e.preventDefault();
      }
      if (e.key === 'Escape') {
        setIsSelectorOpen(false);
        setShowInfoTooltip(false);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeydown);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeydown);
    };
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('user_events')
      .select('*, profiles:creator_id(username)')
      .gte('attendees_count', 50)
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
        time: ev.event_time.substring(0, 5),
        username: ev.profiles?.username || ev.creator_id
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

  const numWeeks = useMemo(() => {
    return Math.ceil((firstDayOfMonth + daysInMonth) / 7);
  }, [firstDayOfMonth, daysInMonth]);

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
      case 'physical':
      case 'online': return t('event');
      case 'online_course': return t('event_online');
      case 'meeting': return t('event_meeting');
      default: return type;
    }
  };

  const dateKey = `${currentYear}-${currentMonth}-${selectedDay}`;
  const todaysEvents = mappedEventsByDate[dateKey] || [];

  return (
    <div
      className="w-full max-w-[1400px] mx-auto px-3 lg:px-8 min-h-0 lg:min-h-[75vh] flex flex-col lg:flex-row gap-2 lg:gap-8 pb-1 lg:pb-8 animate-in fade-in duration-500 relative touch-none select-none"
      onClick={() => {
        setIsSelectorOpen(false);
        setShowInfoTooltip(false);
      }}
      style={{ touchAction: 'none' }}
    >
      {/* Mobile Title */}
      <div className="md:hidden pt-[88px] pb-2 px-2 leading-none">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
          {t('nav_calendar') || 'Calendario'}
        </h1>
      </div>

      <div className="flex-1 bg-white dark:bg-[#111] px-2 py-3 md:p-5 rounded-[2.5rem] border border-gray-100 dark:border-zinc-900 relative md:overflow-hidden overflow-visible flex flex-col">
        <div className="flex items-center justify-between mb-2 md:mb-4">
          <div className="relative ml-8">
            <button
              onClick={(e) => { e.stopPropagation(); setIsSelectorOpen(!isSelectorOpen); }}
              className="group flex items-center space-x-2 text-left hover:bg-gray-50 dark:hover:bg-zinc-800 p-2 -m-2 rounded-2xl transition-all"
            >
              <div>
                <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight flex items-center">
                  {MONTHS[currentMonth]} {currentYear}
                  <ChevronDown size={18} className={`ml-2 text-blue-600 transition-transform duration-300 ${isSelectorOpen ? 'rotate-180' : ''}`} />
                </h2>
              </div>
            </button>

            {isSelectorOpen && (
              <div
                className="absolute top-full left-0 mt-1 w-72 bg-white dark:bg-[#0a0a0a] rounded-[2rem] border border-gray-100 dark:border-zinc-800 z-50 p-4 md:p-6 animate-in zoom-in-95 duration-200 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="space-y-4 md:space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 md:mb-3 block">{t('select_month')}</label>
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
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 md:mb-3 block">{t('select_year')}</label>
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
          <div className="flex items-center space-x-2 mr-2 lg:mr-0">
            <div className="relative group">
              <button
                onClick={(e) => { e.stopPropagation(); setShowInfoTooltip(!showInfoTooltip); }}
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"
              >
                <Info size={18} />
              </button>

              {showInfoTooltip && (
                <div className="absolute top-full right-0 mt-2 w-64 p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-lg z-[60] animate-in zoom-in-95 duration-200">
                  <p className="text-[11px] font-bold text-slate-600 dark:text-gray-300 leading-relaxed">
                    En el calendario aparecerán aquellos eventos que hayan alcanzado los <span className="text-blue-600">50 apoyos</span>.
                  </p>
                  <div className="absolute bottom-full right-4 -mb-1 w-2 h-2 bg-white dark:bg-zinc-900 border-l border-t border-gray-100 dark:border-zinc-800 rotate-45" />
                </div>
              )}
            </div>

            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all"
            >
              {t('today')}
            </button>
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

            <div className={`flex-1 grid grid-cols-7 gap-1 md:gap-2`} style={{ gridTemplateRows: `repeat(${numWeeks}, 1fr)` }}>
              {Array.from({ length: numWeeks * 7 }).map((_, i) => {
                const day = i + 1 - firstDayOfMonth;
                const isCurrentMonth = day > 0 && day <= daysInMonth;

                if (!isCurrentMonth) {
                  return <div key={`empty-${i}`} className="h-full" />;
                }

                const hasEvents = mappedEventsByDate[`${currentYear}-${currentMonth}-${day}`];
                const isSelected = selectedDay === day;
                return (
                  <button
                    key={day}
                    onClick={() => selectDate(day)}
                    className={`h-full py-2.5 lg:py-3 rounded-xl flex flex-col items-center justify-center transition-all duration-300 relative group/day ${isSelected
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white dark:bg-zinc-900 border-transparent hover:border-gray-100 dark:hover:border-zinc-800 text-gray-600 dark:text-gray-400'
                      }`}
                  >
                    <span className="text-[1.8vh] md:text-[2.2vh] font-black leading-none">{day}</span>
                    {hasEvents && !isSelected && (
                      <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full transition-all duration-300 bg-blue-600 ring-2 ring-white/50 dark:ring-zinc-900/50" />
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}

      </div>

      <div className="w-full lg:w-96 space-y-4 lg:flex-none flex flex-col">

        <div className="space-y-3 overflow-y-auto max-h-[calc(70vh-140px)] scrollbar-hide flex flex-col">
          {todaysEvents.length > 0 ? (
            todaysEvents.map(event => (
              <div key={event.id} className="bg-white dark:bg-[#111] p-6 rounded-[2rem] border border-gray-100 dark:border-zinc-900 hover:border-gray-200 dark:hover:border-zinc-800 transition-all group relative">
                <h4 className="text-gray-900 dark:text-white font-black text-base leading-tight mb-4 group-hover:text-blue-600 transition-colors pl-1 pr-10">
                  {event.title}
                </h4>

                <div className="flex items-center justify-between mb-5 pl-1">
                  <div className="flex items-center text-xs text-gray-500 font-bold">
                    <Clock size={14} className="mr-2 opacity-50" />
                    <span>{event.time}h</span>
                  </div>

                  <div className="flex items-center text-xs text-gray-500 font-bold">
                    <MapPin size={14} className="mr-2 opacity-50" />
                    <span className="truncate max-w-[100px]">
                      {event.type === 'physical' ? t('event_physical') : event.type === 'online' ? t('event_online') : ''}
                    </span>
                  </div>

                  <div className="flex items-center text-xs text-gray-500 font-bold">
                    <Users size={14} className="mr-2 opacity-70" />
                    <span>
                      {t('supports', { count: event.attendees })}
                    </span>
                  </div>
                </div>

                <div className="mb-1">
                  <button
                    onClick={() => {
                      const identifier = event.username || event.creator_id;
                      navigate(`/${identifier}/${event.id}`);
                    }}
                    className="w-full py-3.5 bg-gray-50 dark:bg-zinc-900 text-slate-900 dark:text-white rounded-xl text-xs font-black hover:bg-purple-600 hover:text-white transition-all shadow-sm hover:shadow-purple-500/20"
                  >
                    {t('view_event_details')}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white dark:bg-[#111] px-6 py-7 rounded-[2rem] border border-dashed border-gray-200 dark:border-zinc-800 text-center flex flex-col items-center justify-center">
              <CalendarIcon className="mx-auto text-gray-100 dark:text-zinc-900 mb-4" size={40} />
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
