import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useScrollLock } from '../hooks/useScrollLock';
import { X, ImageIcon, Calendar, MapPin, Smile, User, Tag, Heart, Megaphone, Share2 } from 'lucide-react';
import { Language, useTranslation } from '../utils/translations';
import { CalendarEvent, User as UserType } from '../types';
import { MENTION_REGEX, getMentionSuggestions } from '../utils/mentionUtils';
import { EventPreview } from './EventPreview';
import { LinkPreview } from './LinkPreview';
import { getSafeAvatar } from '../utils/avatarUtils';
import { supabase } from '../supabaseClient';
import { compressImage } from '../utils/imageUtils';
import { extractAllExternalUrls, isExternalUrl } from '../utils/stringUtils';

interface SelectedImage {
    id: string;
    preview: string;
    url?: string;
    status: 'uploading' | 'done' | 'error';
}

interface CreatePostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPost: (content: string, type: 'post' | 'news', tags: string[], imageUrls?: string[], docUrl?: string, docName?: string, eventId?: string, title?: string, showLinkPreview?: boolean, linkPreviewUrl?: string | null) => Promise<void>;
    user: UserType;
    type?: 'post' | 'news';
    language: Language;
    userEvents?: CalendarEvent[];
    users?: UserType[];
    initialContent?: string;
    prefilledEvent?: CalendarEvent | null;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
    isOpen,
    onClose,
    onPost,
    user,
    type = 'post',
    language,
    userEvents = [],
    users = [],
    initialContent = '',
    prefilledEvent = null
}) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
    const [linkedEvent, setLinkedEvent] = useState<CalendarEvent | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showEventDropdown, setShowEventDropdown] = useState(false);
    const [mentionQuery, setMentionQuery] = useState<string | null>(null);
    const [mentionStartIndex, setMentionStartIndex] = useState(-1);
    // URLs que el usuario cerró con la X.
    const [dismissedUrls, setDismissedUrls] = useState<Set<string>>(new Set());

    // Todas las URLs externas detectadas en el texto.
    const detectedUrls = useMemo(() => {
        return extractAllExternalUrls(content, isExternalUrl);
    }, [content]);

    // Si una URL desaparece del texto, la quitamos de dismissedUrls; al pegarla
    // de nuevo volverá a mostrarse la preview.
    useEffect(() => {
        setDismissedUrls(prev => {
            const detectedSet = new Set(detectedUrls);
            let changed = false;
            const next = new Set<string>();
            prev.forEach(u => { if (detectedSet.has(u)) next.add(u); else changed = true; });
            return changed ? next : prev;
        });
    }, [detectedUrls]);

    // Sólo UNA preview a la vez: la primera URL detectada que no esté cerrada.
    // Mutuamente excluyente con imágenes y con eventos enlazados.
    const activePreviewUrl = useMemo(() => {
        if (selectedImages.length > 0 || linkedEvent) return null;
        return detectedUrls.find(u => !dismissedUrls.has(u)) || null;
    }, [detectedUrls, dismissedUrls, selectedImages.length, linkedEvent]);

    const canShowLinkPreview = !!activePreviewUrl;

    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const eventButtonRef = useRef<HTMLButtonElement>(null);
    const t = useTranslation(language);

    useScrollLock(isOpen);

    const mentionSuggestions = useMemo(() => {
        if (mentionQuery === null) return [];
        return getMentionSuggestions(mentionQuery, users as any);
    }, [mentionQuery, users]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [content]);

    useEffect(() => {
        if (isOpen) {
            if (initialContent) setContent(initialContent);
            if (prefilledEvent) setLinkedEvent(prefilledEvent);
            setDismissedUrls(new Set());
            setTimeout(() => {
                textareaRef.current?.focus();
            }, 100);
        }
    }, [isOpen, initialContent, prefilledEvent]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                if (showEventDropdown) {
                    setShowEventDropdown(false);
                    event.stopPropagation();
                } else if (mentionQuery) {
                    setMentionQuery(null);
                    event.stopPropagation();
                }
            }
        };

        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
                eventButtonRef.current && !eventButtonRef.current.contains(event.target as Node)) {
                setShowEventDropdown(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showEventDropdown, mentionQuery]);

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

    const selectMention = (selectedUser: any) => {
        if (mentionStartIndex === -1) return;
        const before = content.slice(0, mentionStartIndex);
        const after = content.slice(textareaRef.current?.selectionStart || 0);
        const newContent = `${before}@${selectedUser.username} ${after}`;
        setContent(newContent);
        setMentionQuery(null);
        textareaRef.current?.focus();
    };

    const uploadImage = async (file: File, id: string) => {
        try {
            const compressedBlob = await compressImage(file);
            const fileExt = file.name.split('.').pop() || 'jpg';
            const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('post-images')
                .upload(filePath, compressedBlob);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('post-images')
                .getPublicUrl(filePath);

            setSelectedImages(prev => prev.map(img =>
                img.id === id ? { ...img, url: publicUrl, status: 'done' } : img
            ));
        } catch (error) {
            console.error('Error uploading image:', error);
            setSelectedImages(prev => prev.map(img =>
                img.id === id ? { ...img, status: 'error' } : img
            ));
        }
    };

    const handleSubmit = async (e: React.FormEvent | React.MouseEvent) => {
        if (e) e.preventDefault();
        const isUploading = selectedImages.some(img => img.status === 'uploading');
        if (isSubmitting || isUploading) return;

        if (type === 'news') {
            if (!title.trim() || !content.trim()) return;
        }
        if (!content.trim() && selectedImages.length === 0 && !linkedEvent) return;

        setIsSubmitting(true);
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
        try {
            const uploadedImageUrls = selectedImages
                .filter(img => img.status === 'done' && img.url)
                .map(img => img.url as string);

            const tags = content.match(/#[\wáéíóúÁÉÍÓÚñÑ]+/g)?.map(t => t.slice(1)) || [];
            // showLinkPreview: sólo cuando hay URL externa visible (no hay imágenes ni
            // está cerrada). linkPreviewUrl guarda CUÁL URL se muestra.
            const showLinkPreview = canShowLinkPreview;
            const linkPreviewUrl = activePreviewUrl;
            await onPost(content, type, tags, uploadedImageUrls, undefined, undefined, linkedEvent?.id, title, showLinkPreview, linkPreviewUrl);

            setMentionQuery(null);
            setTitle('');
            setContent('');
            setSelectedImages([]);
            setLinkedEvent(null);
            setDismissedUrls(new Set());
            if (textareaRef.current) textareaRef.current.style.height = '';
            onClose();
        } catch (error) {
            console.error('Error publishing post:', error);
            alert('Error al publicar. Por favor intenta de nuevo.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            const maxImages = 4;
            const remainingSlots = maxImages - selectedImages.length;
            if (remainingSlots <= 0) {
                alert(t('max_images_reached') || 'Máximo 4 imágenes permitidas');
                return;
            }
            const filesToProcess = Array.from(files).slice(0, remainingSlots);

            filesToProcess.forEach((file: any) => {
                const id = Math.random().toString(36).substring(7);
                const reader = new FileReader();
                reader.onloadend = () => {
                    const newImage: SelectedImage = {
                        id,
                        preview: reader.result as string,
                        status: 'uploading'
                    };
                    setSelectedImages(prev => [...prev, newImage]);
                    uploadImage(file, id);
                };
                reader.readAsDataURL(file);
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
                if (currentImageCount >= maxImages) {
                    alert(t('max_images_reached') || 'Máximo 4 imágenes permitidas');
                    break;
                }

                const file = items[i].getAsFile();
                if (file) {
                    const id = Math.random().toString(36).substring(7);
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const newImage: SelectedImage = {
                            id,
                            preview: reader.result as string,
                            status: 'uploading'
                        };
                        setSelectedImages(prev => {
                            if (prev.length >= maxImages) return prev;
                            return [...prev, newImage];
                        });
                        uploadImage(file, id);
                    };
                    reader.readAsDataURL(file);
                    currentImageCount++;
                }
            }
        }
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
        onClose();
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
                        onMouseDown={(e) => {
                            e.preventDefault();
                            if (document.activeElement instanceof HTMLElement) {
                                document.activeElement.blur();
                            }
                            onClose();
                        }}
                        className="p-2 -ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    >
                        <span className="text-base font-medium">{t('cancel')}</span>
                    </button>
                    <span className="font-bold text-slate-900 dark:text-white">
                        {type === 'post' ? t('create_post') : t('create_news')}
                    </span>
                    <button
                        onMouseDown={(e) => {
                            e.preventDefault();
                            handleSubmit(e);
                        }}
                        disabled={isSubmitting || selectedImages.some(img => img.status === 'uploading') || (!content.trim() && selectedImages.length === 0 && !linkedEvent)}
                        className={`px-4 py-1.5 ${type === 'news' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'} text-white text-sm font-bold rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 cursor-pointer`}
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
                                    maxLength={type === 'post' ? undefined : 1000}
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
                                    <div className="mt-4">
                                        <EventPreview
                                            event={linkedEvent}
                                            language={language}
                                            isCompact={false}
                                            onRemove={() => setLinkedEvent(null)}
                                        />
                                    </div>
                                )}

                                {/* Link preview — sólo una a la vez */}
                                {activePreviewUrl && (
                                    <div className="mt-4 relative group/linkprev">
                                        <LinkPreview url={activePreviewUrl} language={language} />
                                        <button
                                            type="button"
                                            onClick={() => setDismissedUrls(prev => new Set(prev).add(activePreviewUrl))}
                                            className="absolute top-2 right-2 p-1.5 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm text-gray-500 hover:text-red-500 rounded-full shadow-md transition-all opacity-0 group-hover/linkprev:opacity-100"
                                            title="Quitar previsualización"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                            {type === 'news' && selectedImages.length > 0 && (
                                <div className="w-24 md:w-32 shrink-0 relative group/img aspect-[4/3] self-start mt-2 border border-gray-100 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm animate-in fade-in zoom-in-95">
                                    <img src={selectedImages[0].preview} alt="Preview" className="w-full h-full object-cover" />
                                    {selectedImages[0].status === 'uploading' && (
                                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        </div>
                                    )}
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
                                        <img src={selectedImages[0].preview} alt="Preview" className="w-full h-full rounded-2xl object-cover border border-gray-100 dark:border-zinc-800 shadow-sm" />
                                        {selectedImages[0].status === 'uploading' && (
                                            <div className="absolute inset-0 bg-black/20 rounded-2xl flex items-center justify-center">
                                                <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                            </div>
                                        )}
                                        <button type="button" onClick={() => removeImage(0)} className="absolute top-3 right-3 p-2 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm text-gray-500 hover:text-red-500 rounded-full shadow-lg transition-all opacity-0 group-hover/img:opacity-100"><X size={18} /></button>
                                    </div>
                                )}

                                {selectedImages.length === 2 && (
                                    <div className="grid grid-cols-2 gap-2 w-full aspect-[2/1]">
                                        {selectedImages.map((img, idx) => (
                                            <div key={idx} className="relative group/img h-full">
                                                <img src={img.preview} alt="Preview" className="w-full h-full rounded-2xl object-cover border border-gray-100 dark:border-zinc-800 shadow-sm" />
                                                {img.status === 'uploading' && (
                                                    <div className="absolute inset-0 bg-black/20 rounded-2xl flex items-center justify-center">
                                                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    </div>
                                                )}
                                                <button type="button" onClick={() => removeImage(idx)} className="absolute top-2 right-2 p-1.5 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm text-gray-500 hover:text-red-500 rounded-full shadow-lg transition-all opacity-0 group-hover/img:opacity-100"><X size={14} /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {selectedImages.length === 3 && (
                                    <div className="grid grid-cols-2 grid-rows-2 gap-2 w-full aspect-[2/1]">
                                        <div className="relative group/img row-span-2">
                                            <img src={selectedImages[0].preview} alt="Preview" className="w-full h-full rounded-2xl object-cover border border-gray-100 dark:border-zinc-800 shadow-sm" />
                                            {selectedImages[0].status === 'uploading' && (
                                                <div className="absolute inset-0 bg-black/20 rounded-2xl flex items-center justify-center">
                                                    <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                                </div>
                                            )}
                                            <button type="button" onClick={() => removeImage(0)} className="absolute top-2 right-2 p-1.5 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm text-gray-500 hover:text-red-500 rounded-full shadow-lg transition-all opacity-0 group-hover/img:opacity-100"><X size={14} /></button>
                                        </div>
                                        {selectedImages.slice(1).map((img, idx) => (
                                            <div key={idx + 1} className="relative group/img h-full">
                                                <img src={img.preview} alt="Preview" className="w-full h-full rounded-2xl object-cover border border-gray-100 dark:border-zinc-800 shadow-sm" />
                                                {img.status === 'uploading' && (
                                                    <div className="absolute inset-0 bg-black/20 rounded-2xl flex items-center justify-center">
                                                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    </div>
                                                )}
                                                <button type="button" onClick={() => removeImage(idx + 1)} className="absolute top-2 right-2 p-1.5 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm text-gray-500 hover:text-red-500 rounded-full shadow-lg transition-all opacity-0 group-hover/img:opacity-100"><X size={14} /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {selectedImages.length === 4 && (
                                    <div className="grid grid-cols-2 grid-rows-2 gap-2 w-full aspect-[2/1]">
                                        {selectedImages.map((img, idx) => (
                                            <div key={idx} className="relative group/img h-full">
                                                <img src={img.preview} alt="Preview" className="w-full h-full rounded-2xl object-cover border border-gray-100 dark:border-zinc-800 shadow-sm" />
                                                {img.status === 'uploading' && (
                                                    <div className="absolute inset-0 bg-black/20 rounded-2xl flex items-center justify-center">
                                                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    </div>
                                                )}
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
                                disabled={canShowLinkPreview || !!linkedEvent}
                                title={canShowLinkPreview ? 'Quita la previsualización del enlace para adjuntar imágenes' : linkedEvent ? 'Quita el evento para adjuntar imágenes' : ''}
                                className={`p-2 ${type === 'post' ? 'text-blue-500 hover:bg-blue-50' : 'text-orange-500 hover:bg-orange-50'} dark:hover:bg-zinc-800 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent`}
                            >
                                <ImageIcon size={24} />
                            </button>
                            {type === 'post' && (
                                <div className="relative w-fit">
                                    <button
                                        ref={eventButtonRef}
                                        type="button"
                                        onClick={() => setShowEventDropdown(!showEventDropdown)}
                                        disabled={canShowLinkPreview || selectedImages.length > 0}
                                        title={canShowLinkPreview ? 'Quita la previsualización del enlace para adjuntar un evento' : selectedImages.length > 0 ? 'Quita las imágenes para adjuntar un evento' : ''}
                                        className={`p-2 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent ${showEventDropdown || linkedEvent ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' : 'text-blue-500 hover:bg-blue-50 dark:hover:bg-zinc-800'}`}
                                    >
                                        <Calendar size={24} />
                                    </button>

                                    {showEventDropdown && createPortal(
                                        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onMouseDown={() => setShowEventDropdown(false)}>
                                            <div ref={dropdownRef} className="bg-white dark:bg-[#1a1a1a] w-full max-w-sm rounded-[2rem] border border-gray-100 dark:border-zinc-800 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200" onMouseDown={e => e.stopPropagation()}>
                                                <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between bg-gray-50/50 dark:bg-zinc-900/50">
                                                    <span className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">{t('your_events')}</span>
                                                    <button 
                                                        type="button" 
                                                        onMouseDown={(e) => { e.preventDefault(); setShowEventDropdown(false); }}
                                                        className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                                                    >
                                                        <X size={18} className="text-gray-400" />
                                                    </button>
                                                </div>
                                                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2">
                                                    {userEvents && userEvents.length > 0 ? userEvents.map(event => (
                                                        <button
                                                            key={event.id}
                                                            type="button"
                                                            onMouseDown={(e) => {
                                                                e.preventDefault();
                                                                setLinkedEvent(event);
                                                                setShowEventDropdown(false);
                                                            }}
                                                            className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-2xl transition-all border-b border-transparent last:border-0 group"
                                                        >
                                                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-blue-600 transition-colors">{event.title}</p>
                                                            <div className="flex items-center space-x-2 mt-1">
                                                                <Calendar size={12} className="text-blue-500" />
                                                                <span className="text-[10px] font-medium text-gray-500">{new Date(event.event_date).toLocaleDateString()}</span>
                                                                {event.location && (
                                                                    <>
                                                                        <span className="text-gray-300">•</span>
                                                                        <span className="text-[10px] font-medium text-gray-400 truncate max-w-[150px]">{event.location}</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </button>
                                                    )) : (
                                                        <div className="py-12 px-6 text-center">
                                                            <div className="w-12 h-12 bg-gray-50 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-3">
                                                                <Calendar size={24} className="text-gray-300" />
                                                            </div>
                                                            <p className="text-xs text-gray-400 font-bold italic">{t('no_events_published')}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>,
                                        document.body
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
