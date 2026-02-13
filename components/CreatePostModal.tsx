import React, { useState, useRef, useEffect } from 'react';
import { X, ImageIcon, Calendar, MapPin, Smile, User, Tag } from 'lucide-react';
import { Language, useTranslation } from '../utils/translations';
import { CalendarEvent, User as UserType } from '../types';

interface CreatePostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPost: (content: string, type: 'post' | 'news', tags: string[], imageUrl?: string, docUrl?: string, docName?: string, eventId?: string) => void;
    user: UserType;
    type?: 'post' | 'news';
    language: Language;
    userEvents?: CalendarEvent[];
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
    isOpen,
    onClose,
    onPost,
    user,
    type = 'post',
    language,
    userEvents = []
}) => {
    const [content, setContent] = useState('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [linkedEvent, setLinkedEvent] = useState<CalendarEvent | null>(null);
    const [showEventDropdown, setShowEventDropdown] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const t = useTranslation(language);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                textareaRef.current?.focus();
            }, 100);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowEventDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() && !selectedImage && !linkedEvent) return;

        const tags = content.match(/#[\wáéíóúÁÉÍÓÚñÑ]+/g)?.map(t => t.slice(1)) || [];
        onPost(content, type, tags, selectedImage || undefined, undefined, undefined, linkedEvent?.id);

        setContent('');
        setSelectedImage(null);
        setLinkedEvent(null);
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            // On mobile we might want to allow new lines with just Enter, 
            // but for consistency with desktop let's submit. 
            // Actually, on mobile Enter usually adds a new line. Let's keep default behavior for mobile friendliness 
            // or check if it's a physical keyboard.
            // For now, let's NOT submit on Enter to allow multiline easily on mobile.
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#111] w-full sm:max-w-lg h-auto max-h-[80vh] sm:h-auto sm:rounded-[2rem] rounded-t-[2rem] shadow-xl flex flex-col animate-in slide-in-from-bottom-10 duration-300">

                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-zinc-800">
                    <button
                        onClick={onClose}
                        className="p-2 -ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                        <span className="text-base font-medium">{t('cancel')}</span>
                    </button>
                    <span className="font-bold text-slate-900 dark:text-white">
                        {type === 'post' ? t('create_post') : t('create_news')}
                    </span>
                    <button
                        onClick={handleSubmit}
                        disabled={!content.trim() && !selectedImage && !linkedEvent}
                        className={`px-4 py-1.5 ${type === 'news' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'} text-white text-sm font-bold rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                    >
                        {t('publish')}
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-4 pt-4 pb-0 custom-scrollbar">
                    <div className="flex space-x-3">
                        <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                        <div className="flex-1 min-w-0">
                            <textarea
                                ref={textareaRef}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder={type === 'post' ? t('post_placeholder') : t('share_your_news')}
                                className="w-full bg-transparent border-b-2 border-transparent focus:border-gray-300 text-lg text-slate-900 dark:text-white placeholder-slate-400 focus:ring-0 focus:outline-none resize-none min-h-[80px] p-0 transition-colors"
                            />

                            {/* Linked Event Preview */}
                            {linkedEvent && (
                                <div className="mt-2 mb-1 bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-3 border border-blue-100 dark:border-blue-800/50 relative group/event">
                                    <button type="button" onClick={() => setLinkedEvent(null)} className="absolute top-2 right-2 p-1.5 bg-white dark:bg-zinc-800 text-slate-400 hover:text-red-500 rounded-full"><X size={14} /></button>
                                    <div className="flex items-start space-x-3">
                                        <div className="p-2 bg-blue-600 text-white rounded-xl"><Calendar size={18} /></div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-widest mb-1">{t('linked_event')}</p>
                                            <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">{linkedEvent.title}</h4>
                                            <div className="flex items-center space-x-2 mt-1 text-[10px] text-slate-500 font-bold">
                                                <MapPin size={10} /> <span>{linkedEvent.location}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Image Preview */}
                            {selectedImage && (
                                <div className="relative mt-2 rounded-xl overflow-hidden border border-gray-100 dark:border-zinc-800">
                                    <img src={selectedImage} alt="Preview" className="w-full h-auto max-h-60 object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => setSelectedImage(null)}
                                        className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 backdrop-blur-sm"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="px-4 pt-2 border-t border-gray-50 dark:border-zinc-900 bg-white dark:bg-[#111] pb-6 sm:pb-3 rounded-b-[2rem]">
                    <div className="flex items-center space-x-4">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-zinc-800 rounded-full transition-colors"
                        >
                            <ImageIcon size={24} />
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            hidden
                            accept="image/*"
                            onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) {
                                    const r = new FileReader();
                                    r.onloadend = () => setSelectedImage(r.result as string);
                                    r.readAsDataURL(f);
                                }
                            }}
                        />

                        {type === 'post' && (
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setShowEventDropdown(!showEventDropdown)}
                                    className={`p-2 rounded-full transition-colors ${showEventDropdown || linkedEvent ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' : 'text-blue-500 hover:bg-blue-50 dark:hover:bg-zinc-800'}`}
                                >
                                    <Calendar size={24} />
                                </button>

                                {showEventDropdown && (
                                    <div ref={dropdownRef} className="absolute bottom-14 left-0 w-72 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-zinc-800 z-50 overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-200">
                                        <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between bg-gray-50 dark:bg-zinc-900/50">
                                            <span className="text-xs font-black text-gray-500 uppercase tracking-widest">{t('your_events')}</span>
                                            <button type="button" onClick={() => setShowEventDropdown(false)}><X size={14} className="text-gray-400" /></button>
                                        </div>
                                        <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                            {userEvents.length > 0 ? userEvents.map(event => (
                                                <button
                                                    key={event.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setLinkedEvent(event);
                                                        setShowEventDropdown(false);
                                                    }}
                                                    className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors border-b border-gray-50 dark:border-zinc-800/50 last:border-0"
                                                >
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{event.title}</p>
                                                    <div className="flex items-center space-x-2 mt-1">
                                                        <Calendar size={12} className="text-blue-500" />
                                                        <span className="text-[10px] font-medium text-gray-500">{new Date(event.event_date).toLocaleDateString()}</span>
                                                    </div>
                                                </button>
                                            )) : (
                                                <div className="p-6 text-center">
                                                    <p className="text-xs text-gray-400 italic">{t('no_events_published')}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
