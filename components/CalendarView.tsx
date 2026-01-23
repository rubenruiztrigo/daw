
import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, Users, Sparkles, Plus } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  type: 'innovation' | 'training' | 'meeting' | 'congress';
  time: string;
  location: string;
  attendees: number;
  description: string;
}

const MOCK_EVENTS: Record<number, Event[]> = {
  15: [
    { id: '1', title: 'Congreso NovaGob 2024', type: 'congress', time: '09:00', location: 'Sede Central / Online', attendees: 450, description: 'El mayor evento de innovación pública en iberoamérica.' },
    { id: '2', title: 'Webinar: IA en Gobiernos Locales', type: 'training', time: '16:30', location: 'Zoom', attendees: 120, description: 'Sesión práctica sobre implementación de LLMs en ayuntamientos.' }
  ],
  18: [
    { id: '3', title: 'Reunión de Laboratorios de Innovación', type: 'innovation', time: '11:00', location: 'Sala 3B', attendees: 15, description: 'Coordinación trimestral de laboratorios de innovación ciudadana.' }
  ],
  22: [
    { id: '4', title: 'Taller de Transparencia Activa', type: 'training', time: '10:00', location: 'Aula Virtual', attendees: 85, description: 'Mejora de los portales de datos abiertos institucionales.' }
  ]
};

export const CalendarView: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState(15);
  const [currentMonth] = useState('Junio 2024');

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'innovation': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
      case 'training': return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'congress': return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
      case 'meeting': return 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const days = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-8 pb-20 animate-in fade-in duration-500">
      {/* Lado Izquierdo: Calendario */}
      <div className="flex-1 bg-white dark:bg-[#111] p-8 rounded-[2.5rem] border border-gray-100 dark:border-zinc-900 shadow-sm">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{currentMonth}</h2>
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-1">Agenda Institucional NovaHub</p>
          </div>
          <div className="flex space-x-2">
            <button className="p-3 bg-gray-50 dark:bg-zinc-800 rounded-2xl hover:bg-gray-100 transition-all"><ChevronLeft size={20} /></button>
            <button className="p-3 bg-gray-50 dark:bg-zinc-800 rounded-2xl hover:bg-gray-100 transition-all"><ChevronRight size={20} /></button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-4 text-center mb-6">
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
            <span key={d} className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{d}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {days.map(day => {
            const hasEvents = MOCK_EVENTS[day];
            const isSelected = selectedDay === day;
            return (
              <button 
                key={day} 
                onClick={() => setSelectedDay(day)}
                className={`aspect-square rounded-[1.5rem] flex flex-col items-center justify-center relative transition-all border-2 ${
                  isSelected 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-100 dark:shadow-none' 
                    : 'bg-white dark:bg-zinc-900 border-transparent hover:border-gray-100 dark:hover:border-zinc-800 text-gray-600 dark:text-gray-400'
                }`}
              >
                <span className="text-lg font-black">{day}</span>
                {hasEvents && !isSelected && (
                  <div className="absolute bottom-2 w-1 h-1 bg-blue-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
        
        <button className="w-full mt-8 py-4 bg-slate-50 dark:bg-zinc-900 text-blue-600 dark:text-blue-400 rounded-2xl font-black text-sm border border-dashed border-blue-200 dark:border-blue-800 flex items-center justify-center space-x-2 hover:bg-blue-50 transition-all">
          <Plus size={18} />
          <span>Sugerir nuevo evento</span>
        </button>
      </div>

      {/* Lado Derecho: Eventos del día */}
      <div className="w-full lg:w-96 space-y-6">
        <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-blue-100 dark:shadow-none relative overflow-hidden">
          <Sparkles className="absolute top-4 right-4 opacity-30" size={24} />
          <h3 className="text-4xl font-black mb-1 italic">{selectedDay}</h3>
          <p className="text-blue-100 font-bold uppercase text-xs tracking-widest">Eventos para hoy</p>
        </div>

        <div className="space-y-4">
          {MOCK_EVENTS[selectedDay] ? (
            MOCK_EVENTS[selectedDay].map(event => (
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
              <p className="text-gray-400 font-bold italic text-sm">No hay eventos programados para este día.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
