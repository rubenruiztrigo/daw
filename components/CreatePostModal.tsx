import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useScrollLock } from '../hooks/useScrollLock';
import { X, ImageIcon, Calendar, MapPin, Smile, User, Tag } from 'lucide-react';
import { Language, useTranslation } from '../utils/translations';
import { CalendarEvent, User as UserType } from '../types';
import { MENTION_REGEX, getMentionSuggestions } from '../utils/mentionUtils';
import { getSafeAvatar } from '../utils/avatarUtils';

interface CreatePostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPost: (content: string, type: 'post' | 'news', tags: string[], imageUrls?: string[], docUrl?: string, docName?: string, eventId?: string, title?: string) => Promise<void>;
    user: UserType;
    type?: 'post' | 'news';
    language: Language;
    userEvents?: CalendarEvent[];
    users?: UserType[];
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
    isOpen,
    onClose,
    onPost,
    user,
    type = 'post',
    language,
    userEvents = [],
    users = []
}) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [linkedEvent, setLinkedEvent] = useState<CalendarEvent | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showEventDropdown, setShowEventDropdown] = useState(false);
    const [mentionQuery, setMentionQuery] = useState<string | null>(null);
    const [mentionStartIndex, setMentionStartIndex] = useState(-1);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const eventButtonRef = useRef<HTMLButtonElement>(null);
    const t = useTranslation(language);

    useScrollLock(isOpen);

    const mentionSuggestions = useMemo(() => {
        if (mentionQuery === null) return [];
        return getMentionSuggestions(mentionQuery, users);
    }, [mentionQuery, users]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [content]);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                textareaRef.current?.focus();
            }, 100);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
                eventButtonRef.current && !eventButtonRef.current.contains(event.target as Node)) {
                setShowEventDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        const selectionStart = e.target.selectionStart;
        setContent(value);

        const textBeforeCursor = value.slice(0, selectionStart);
        const match = textBeforeCursor.match(/(?:^|\s)@(\S*)$/);

        if (match && match[1].length >= 2) {
            const query = match[1];
            const atIndex = textBeforeCursor.lastIndexOf('@');
            setMentionQuery(query);
            setMentionStartIndex(atIndex);
        } else {
            setMentionQuery(null);
        }
    };

    const selectMention = (selectedUser: UserType) => {
        if (mentionStartIndex === -1) return;
        const before = content.slice(0, mentionStartIndex);
        const after = content.slice(textareaRef.current?.selectionStart || 0);
        const newContent = `${before}@${selectedUser.username} ${after}`;
        setContent(newContent);
        setMentionQuery(null);
        textareaRef.current?.focus();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        // If it's a news item, require both title and content
        if (type === 'news') {
            if (!title.trim() || !content.trim()) return;
        }
        if (!content.trim() && selectedImages.length === 0 && !linkedEvent) return;


        setIsSubmitting(true);
        try {
            const tags = content.match(/#[\wáéíóúÁÉÍÓÚñÑ]+/g)?.map(t => t.slice(1)) || [];
            await onPost(content, type, tags, selectedImages, undefined, undefined, linkedEvent?.id, title);

            setMentionQuery(null);
            setTitle('');
            setContent('');
            setSelectedImages([]);
            setLinkedEvent(null);
            if (textareaRef.current) textareaRef.current.style.height = '';
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            const maxImages = type === 'news' ? 1 : 4;
            const remainingSlots = maxImages - selectedImages.length;
            const filesToProcess = Array.from(files).slice(0, remainingSlots);

            filesToProcess.forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setSelectedImages(prev => [...prev, reader.result as string]);
                };
                reader.readAsDataURL(file as File);
            });
        }
    };

    const removeImage = (index: number) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        const items = e.clipboardData.items;
        const maxImages = type === 'news' ? 1 : 4;
        let currentImageCount = selectedImages.length;

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                if (currentImageCount >= maxImages) break;

                const file = items[i].getAsFile();
                if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setSelectedImages(prev => {
                            if (prev.length >= maxImages) return prev;
                            return [...prev, reader.result as string];
                        });
                    };
                    reader.readAsDataURL(file);
                    currentImageCount++;
                }
            }
        }
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        const activeElement = document.activeElement;
        const isInputFocused = activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement;

        if (isInputFocused) {
            (activeElement as HTMLElement).blur();
        } else {
            onClose();
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={handleBackdropClick}>
            <div
                className="bg-white dark:bg-[#111] w-full sm:max-w-lg h-auto max-h-[80vh] sm:h-auto sm:rounded-[2rem] rounded-t-[2rem] shadow-xl flex flex-col animate-in slide-in-from-bottom-10 duration-300"
                onClick={e => e.stopPropagation()}
            >

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
                        disabled={isSubmitting || (!content.trim() && selectedImages.length === 0 && !linkedEvent)}
                        className={`px-4 py-1.5 ${type === 'news' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'} text-white text-sm font-bold rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2`}
                    >
                        {isSubmitting ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>{t('publishing')}...</span>
                            </>
                        ) : (
                            t('publish')
                        )}
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-4 pt-4 pb-0 custom-scrollbar relative">
                    <div className="flex space-x-3">
                        <img src={getSafeAvatar(user.avatar)} alt={user.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                        <div className="flex-1 min-w-0 flex space-x-4">
                            <div className="flex-1 min-w-0 relative">
                                {type === 'news' && (
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        maxLength={100}
                                        placeholder="Título de la noticia"
                                        className="w-full bg-transparent border-none text-xl font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:ring-0 focus:outline-none mb-2"
                                    />
                                )}
                                <textarea
                                    ref={textareaRef}
                                    value={content}
                                    onChange={handleTextChange}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Escape') {
                                            setMentionQuery(null);
                                        }
                                    }}
                                    onPaste={handlePaste}
                                    placeholder={`${type === 'post' ? t('post_placeholder') : t('share_your_news')}`}
                                    maxLength={1000}
                                    className={`w-full bg-transparent border-none text-lg text-slate-900 dark:text-white placeholder-slate-400 focus:ring-0 focus:outline-none resize-none min-h-[40px] max-h-[400px] p-0 transition-all duration-200 pr-4 overflow-hidden`}
                                />

                                {/* Mention Suggestions */}
                                {mentionQuery !== null && (
                                    <div className="absolute left-0 top-full mt-2 w-64 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-zinc-800 z-[110] overflow-hidden shadow-2xl animate-in slide-in-from-top-2 duration-100">
                                        {mentionSuggestions.length > 0 ? mentionSuggestions.map(u => (
                                            <button key={u.id} type="button" onClick={() => selectMention(u)} className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors text-left border-b border-gray-50 dark:border-zinc-800 last:border-0 font-bold">
                                                <img src={getSafeAvatar(u.avatar)} className="w-8 h-8 rounded-lg object-cover" alt="" />
                                                <div className="min-w-0">
                                                    <p className="text-sm text-gray-900 dark:text-white truncate">{u.name} {u.lastName}</p>
                                                    <p className="text-[10px] text-purple-600 dark:text-purple-400">@{u.username}</p>
                                                </div>
                                            </button>
                                        )) : (
                                            <div className="px-4 py-3 text-xs text-gray-400 italic font-bold">
                                                {t('no_users_found')}
                                            </div>
                                        )}
                                    </div>
                                )}

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
                            </div>
                            {type === 'news' && selectedImages.length > 0 && (
                                <div className="w-24 md:w-32 shrink-0 relative group/img aspect-[4/3] self-start mt-2 border border-gray-100 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm animate-in fade-in zoom-in-95">
                                    <img src={selectedImages[0]} alt="Preview" className="w-full h-full object-cover" />
                                    <button type="button" onClick={() => removeImage(0)} className="absolute top-1.5 right-1.5 p-1 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm text-gray-500 hover:text-red-500 rounded-full shadow-md transition-all opacity-0 group-hover/img:opacity-100"><X size={12} /></button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="px-4 pt-2 border-t border-gray-50 dark:border-zinc-900 bg-white dark:bg-[#111] pb-6 sm:pb-3 rounded-b-[2rem]">
                    <div className="pl-[3.25rem]">
                        {/* Image Grid Preview */}
                        {selectedImages.length > 0 && type !== 'news' && (
                            <div className="grid grid-cols-1 pr-3 md:pr-4 gap-2 mb-3 animate-in fade-in zoom-in-95 duration-200">
                                {selectedImages.length === 1 && (
                                    <div className="relative group/img w-full aspect-[2/1]">
                                        <img src={selectedImages[0]} alt="Preview" className="w-full h-full rounded-2xl object-cover border border-gray-100 dark:border-zinc-800 shadow-sm" />
                                        <button type="button" onClick={() => removeImage(0)} className="absolute top-3 right-3 p-2 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm text-gray-500 hover:text-red-500 rounded-full shadow-lg transition-all opacity-0 group-hover/img:opacity-100"><X size={18} /></button>
                                    </div>
                                )}

                                {selectedImages.length === 2 && (
                                    <div className="grid grid-cols-2 gap-2 w-full aspect-[2/1]">
                                        {selectedImages.map((img, idx) => (
                                            <div key={idx} className="relative group/img h-full">
                                                <img src={img} alt="Preview" className="w-full h-full rounded-2xl object-cover border border-gray-100 dark:border-zinc-800 shadow-sm" />
                                                <button type="button" onClick={() => removeImage(idx)} className="absolute top-2 right-2 p-1.5 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm text-gray-500 hover:text-red-500 rounded-full shadow-lg transition-all opacity-0 group-hover/img:opacity-100"><X size={14} /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {selectedImages.length === 3 && (
                                    <div className="grid grid-cols-2 grid-rows-2 gap-2 w-full aspect-[2/1]">
                                        <div className="relative group/img row-span-2">
                                            <img src={selectedImages[0]} alt="Preview" className="w-full h-full rounded-2xl object-cover border border-gray-100 dark:border-zinc-800 shadow-sm" />
                                            <button type="button" onClick={() => removeImage(0)} className="absolute top-2 right-2 p-1.5 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm text-gray-500 hover:text-red-500 rounded-full shadow-lg transition-all opacity-0 group-hover/img:opacity-100"><X size={14} /></button>
                                        </div>
                                        <div className="relative group/img h-full">
                                            <img src={selectedImages[1]} alt="Preview" className="w-full h-full rounded-2xl object-cover border border-gray-100 dark:border-zinc-800 shadow-sm" />
                                            <button type="button" onClick={() => removeImage(1)} className="absolute top-2 right-2 p-1.5 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm text-gray-500 hover:text-red-500 rounded-full shadow-lg transition-all opacity-0 group-hover/img:opacity-100"><X size={14} /></button>
                                        </div>
                                        <div className="relative group/img h-full">
                                            <img src={selectedImages[2]} alt="Preview" className="w-full h-full rounded-2xl object-cover border border-gray-100 dark:border-zinc-800 shadow-sm" />
                                            <button type="button" onClick={() => removeImage(2)} className="absolute top-2 right-2 p-1.5 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm text-gray-500 hover:text-red-500 rounded-full shadow-lg transition-all opacity-0 group-hover/img:opacity-100"><X size={14} /></button>
                                        </div>
                                    </div>
                                )}

                                {selectedImages.length === 4 && (
                                    <div className="grid grid-cols-2 grid-rows-2 gap-2 w-full aspect-[2/1]">
                                        {selectedImages.map((img, idx) => (
                                            <div key={idx} className="relative group/img h-full">
                                                <img src={img} alt="Preview" className="w-full h-full rounded-2xl object-cover border border-gray-100 dark:border-zinc-800 shadow-sm" />
                                                <button type="button" onClick={() => removeImage(idx)} className="absolute top-2 right-2 p-1.5 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm text-gray-500 hover:text-red-500 rounded-full shadow-lg transition-all opacity-0 group-hover/img:opacity-100"><X size={14} /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className={`p-2 ${type === 'post' ? 'text-blue-500 hover:bg-blue-50' : 'text-orange-500 hover:bg-orange-50'} dark:hover:bg-zinc-800 rounded-full transition-colors`}
                            >
                                <ImageIcon size={24} />
                            </button>
                            {type === 'post' && (
                                <div className="relative">
                                    <button
                                        ref={eventButtonRef}
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
                                                {userEvents && userEvents.length > 0 ? userEvents.map(event => (
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
                            <input
                                type="file"
                                ref={fileInputRef}
                                hidden
                                accept="image/*"
                                multiple={type !== 'news'}
                                onChange={handleImageUpload}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
