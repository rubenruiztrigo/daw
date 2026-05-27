import React from 'react';
import { Calendar, MapPin, ChevronRight, X } from 'lucide-react';
import { CalendarEvent } from '../types';
import { Language, useTranslation } from '../utils/translations';
import { generateDefaultEventImage } from '../utils/eventImageUtils';

interface EventPreviewProps {
  event: CalendarEvent;
  language: Language;
  onNavigateToEvent?: (userId: string, eventId: string) => void;
  onViewCalendar?: () => void;
  onNavigateToProfile?: (userId: string) => void;
  isCompact?: boolean;
  onRemove?: () => void;
  renderActions?: () => React.ReactNode;
  isFocused?: boolean;
}

export const EventPreview: React.FC<EventPreviewProps> = ({
  event,
  language,
  onNavigateToEvent,
  onViewCalendar,
  onNavigateToProfile,
  isCompact = false,
  onRemove,
  renderActions,
  isFocused = false
}) => {
  const t = useTranslation(language);

  if (isCompact) {
    return (
      <div className="mt-4 mb-2 relative group overflow-hidden rounded-3xl bg-gray-50/50 dark:bg-zinc-900/30 border border-gray-100 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-all duration-500 translate-y-0 hover:-translate-y-1">
        {onRemove && (
          <button 
            type="button" 
            onClick={onRemove} 
            className="absolute top-3 right-3 p-1.5 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm text-slate-400 hover:text-red-500 rounded-full shadow-lg transition-all z-[20] opacity-0 group-hover:opacity-100"
          >
            <X size={14} strokeWidth={3} />
          </button>
        )}

        <div 
          className="flex flex-row min-h-[7rem] h-auto cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            if (onNavigateToProfile) {
              onNavigateToProfile(event.creator_id);
            }
          }}
        >
          {/* Image Section - SQUARED & CLEAN */}
          <div className="relative w-24 h-24 m-3 overflow-hidden rounded-2xl flex-shrink-0">
            <img
              src={event.image_url || generateDefaultEventImage()}
              className="w-full h-full object-cover transition-opacity duration-300"
              alt={event.title}
              loading="lazy"
              decoding="async"
            />
          </div>

          {/* Content Section */}
          <div className="flex-1 p-3 flex flex-col justify-center min-w-0 bg-transparent -ml-px relative z-10">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-widest mb-1">{t('linked_event')}</p>
              <h4 
                className="font-bold text-slate-900 dark:text-white text-sm leading-tight truncate pr-4 cursor-pointer hover:text-blue-600 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onNavigateToEvent) {
                    onNavigateToEvent(event.creator_id, event.id);
                  } else {
                    onViewCalendar?.();
                  }
                }}
              >
                {event.title}
              </h4>

              <div className="flex flex-wrap gap-2 pt-1">
                <div className="flex items-center text-[9px] text-gray-500 font-bold uppercase tracking-wider">
                  <Calendar size={10} className="mr-1 text-blue-500" />
                  <span>{new Date(event.event_date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US')}</span>
                </div>
                <div className="flex items-center text-[9px] text-gray-500 font-bold uppercase tracking-wider">
                  <MapPin size={10} className="mr-1 text-emerald-500" />
                  <span className="truncate max-w-[80px]">{event.type === 'physical' ? (language === 'es' ? 'Presencial' : 'Physical') : (language === 'es' ? 'Online' : 'Online')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(event.event_date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div
      className={`event-preview-container bg-white dark:bg-[#111] rounded-[2rem] border transition-all duration-300 group overflow-hidden relative cursor-pointer min-h-[7rem] md:min-h-[10rem] mb-3 flex flex-row items-stretch ${
        isFocused
          ? 'border-purple-500 ring-2 ring-purple-500 ring-offset-2 dark:ring-offset-black shadow-2xl'
          : 'border-gray-100 dark:border-zinc-800 hover:border-blue-200 dark:hover:border-zinc-700'
      }`}
      onClick={(e) => {
        e.stopPropagation();
        if (onNavigateToEvent) {
          onNavigateToEvent(event.creator_id, event.id);
        } else {
          onViewCalendar?.();
        }
      }}
    >
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute top-4 right-4 p-2 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm text-slate-400 hover:text-red-500 rounded-full shadow-lg transition-all z-[20] opacity-0 group-hover:opacity-100"
        >
          <X size={16} strokeWidth={3} />
        </button>
      )}

      <div className="contents">
        {/* Image Section - flush left/top/bottom with right fade */}
        <div className="relative w-32 md:w-40 flex-shrink-0 overflow-hidden rounded-l-[2rem] self-stretch">
          <img
            src={event.image_url || generateDefaultEventImage()}
            className="absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
            alt={event.title}
            loading="eager"
          />
        </div>

        {/* Content Section */}
        <div className="flex-1 p-3 md:p-5 flex flex-col justify-between min-w-0 bg-white dark:bg-[#111] relative z-10">
          <div className="space-y-1.5">
            <h4
              className="text-gray-900 dark:text-white font-black text-sm md:text-lg leading-tight hover:text-blue-600 transition-colors cursor-pointer truncate pr-2"
            >
              {event.title}
            </h4>

            <div className="flex flex-wrap gap-2 pt-0.5">
              <div className="flex items-center text-[10px] text-gray-400 font-bold uppercase tracking-wider bg-slate-50 dark:bg-zinc-900/50 px-2 py-1 rounded-lg border border-slate-100 dark:border-zinc-800/50">
                <Calendar size={10} className="mr-1.5 text-blue-500" strokeWidth={3} />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center text-[10px] text-gray-400 font-bold uppercase tracking-wider bg-slate-50 dark:bg-zinc-900/50 px-2 py-1 rounded-lg border border-slate-100 dark:border-zinc-800/50">
                <MapPin size={10} className="mr-1.5 text-emerald-500" strokeWidth={3} />
                <span className="truncate max-w-[120px]">{event.type === 'physical' ? (language === 'es' ? 'Presencial' : 'Physical') : (language === 'es' ? 'Online' : 'Online')}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-4">
            {renderActions ? (
              renderActions()
            ) : (
              <div className="w-full pt-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400 hover:underline flex items-center">
                  {t('view_event_details')}
                  <ChevronRight size={12} className="ml-1 transform hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
