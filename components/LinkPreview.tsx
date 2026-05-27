import React, { useEffect, useState } from 'react';
import { ExternalLink, Globe, Play } from 'lucide-react';
import { Language, useTranslation } from '../utils/translations';

interface LinkPreviewData {
    title?: string;
    description?: string;
    image?: { url: string };
    logo?: { url: string };
    url: string;
    publisher?: string;
}

interface LinkPreviewProps {
    url: string;
    language?: Language;
}

// ─── Module-level cache (survives re-renders and tab switches) ────────────────
// Key: URL string  Value: resolved data or null (error)
const loadCache = (): Map<string, LinkPreviewData | null> => {
    const map = new Map<string, LinkPreviewData | null>();
    try {
        const stored = localStorage.getItem('novagob_link_previews');
        if (stored) {
            const parsed = JSON.parse(stored);
            Object.entries(parsed).forEach(([k, v]) => {
                map.set(k, v as LinkPreviewData | null);
            });
        }
    } catch (e) {
        console.error('Failed to load link previews cache', e);
    }
    return map;
};

const previewCache = loadCache();
// Pending promises: avoid duplicate in-flight requests for the same URL
const pendingFetches = new Map<string, Promise<LinkPreviewData | null>>();

const getYouTubeId = (url: string) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    if (match && match[7]?.length === 11) return match[7];
    if (url.includes('/live/')) {
        const parts = url.split('/live/');
        if (parts[1]) return parts[1].split('?')[0];
    }
    return null;
};

const isYouTubeChannel = (url: string) => {
    return /youtube\.com\/@[^/?#]+/.test(url) ||
        /youtube\.com\/(channel|c|user)\/[^/?#]+/.test(url);
};

const getYouTubeChannelName = (url: string): string => {
    const atMatch = url.match(/youtube\.com\/@([^/?#]+)/);
    if (atMatch) return atMatch[1];
    const pathMatch = url.match(/youtube\.com\/(?:channel|c|user)\/([^/?#]+)/);
    if (pathMatch) return pathMatch[1];
    return 'Canal de YouTube';
};

async function fetchPreviewData(url: string): Promise<LinkPreviewData | null> {
    const isYouTube = url.toLowerCase().includes('youtube.com') || url.toLowerCase().includes('youtu.be');

    // YouTube fast path: construct thumbnail instantly, then try to get title from oEmbed
    if (isYouTube) {
        const ytId = getYouTubeId(url);
        const isChannel = isYouTubeChannel(url);
        const instant: LinkPreviewData = {
            title: isChannel ? getYouTubeChannelName(url) : 'Vídeo de YouTube',
            publisher: 'YouTube',
            url,
            image: ytId ? { url: `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` } : undefined,
        };

        if (isChannel) {
            // Use Microlink to get the real channel display name from the page title
            try {
                const res = await fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}`);
                if (res.ok) {
                    const json = await res.json();
                    if (json.status === 'success') {
                        // Page title is typically "Channel Name - YouTube"
                        const rawTitle: string = json.data?.title || '';
                        const displayName = rawTitle.replace(/\s*[-–|]\s*YouTube\s*$/i, '').trim() || instant.title;
                        return { ...instant, title: displayName, description: json.data?.description || undefined };
                    }
                }
            } catch { /* use instant result */ }
            return instant;
        }

        // oEmbed only works for videos
        try {
            const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
            if (res.ok) {
                const oembed = await res.json();
                return {
                    ...instant,
                    title: oembed.title || instant.title,
                    description: oembed.author_name ? `Canal: ${oembed.author_name}` : undefined,
                    image: { url: oembed.thumbnail_url || instant.image?.url || '' },
                };
            }
        } catch { /* use instant result */ }
        return instant;
    }

    // Generic URL: call Microlink
    try {
        const res = await fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}`);
        if (res.ok) {
            const json = await res.json();
            if (json.status === 'success') return json.data as LinkPreviewData;
        }
    } catch { /* fall through */ }

    return null; // error state
}

export function getOrFetchPreview(url: string): Promise<LinkPreviewData | null> {
    // Return cached result immediately
    if (previewCache.has(url)) {
        return Promise.resolve(previewCache.get(url)!);
    }
    // Reuse in-flight request if already fetching this URL
    if (pendingFetches.has(url)) {
        return pendingFetches.get(url)!;
    }
    // New request
    const promise = fetchPreviewData(url).then(result => {
        previewCache.set(url, result);
        try {
            const obj = Object.fromEntries(previewCache.entries());
            localStorage.setItem('novagob_link_previews', JSON.stringify(obj));
        } catch (e) {
            console.error('Failed to save link previews cache', e);
        }
        pendingFetches.delete(url);
        return result;
    });
    pendingFetches.set(url, promise);
    return promise;
}

// ─── Component ────────────────────────────────────────────────────────────────
export const LinkPreview: React.FC<LinkPreviewProps> = ({ url, language = 'es' }) => {
    const isYouTube = url.toLowerCase().includes('youtube.com') || url.toLowerCase().includes('youtu.be');
    const isVideo = (isYouTube && !isYouTubeChannel(url)) || url.toLowerCase().includes('vimeo.com') || url.toLowerCase().includes('twitch.tv');
    const t = useTranslation(language as Language);

    // If already cached, initialise with it — no loading flash
    const [data, setData] = useState<LinkPreviewData | null>(() =>
        previewCache.has(url) ? previewCache.get(url)! : null
    );
    const [loading, setLoading] = useState(() => !previewCache.has(url));
    const [error, setError] = useState(false);

    useEffect(() => {
        // URL is already cached — nothing to do
        if (previewCache.has(url)) {
            const cached = previewCache.get(url)!;
            setData(cached);
            setLoading(false);
            setError(!cached);
            return;
        }

        let cancelled = false;
        setLoading(true);
        setError(false);

        getOrFetchPreview(url).then(result => {
            if (cancelled) return;
            setData(result);
            setError(!result);
            setLoading(false);
        });

        return () => { cancelled = true; };
    }, [url]);

    // ── Loading skeleton ──────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className={`flex flex-row items-center space-x-4 p-4 rounded-[1.5rem] border-[0.5px] border-gray-100 dark:border-zinc-800 animate-pulse ${isYouTube ? 'bg-red-50/10 dark:bg-red-900/5' : 'bg-gray-50/50 dark:bg-zinc-900/50'}`}>
                {isVideo ? (
                    <div className="w-32 sm:w-44 aspect-video bg-gray-200 dark:bg-zinc-800 rounded-xl shrink-0" />
                ) : (
                    <div className="w-10 h-10 bg-gray-200 dark:bg-zinc-800 rounded-lg shrink-0" />
                )}
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 dark:bg-zinc-800 rounded w-1/2" />
                </div>
            </div>
        );
    }

    // ── Error / fallback ──────────────────────────────────────────────────────
    if (error || !data) {
        let domain = '';
        try { domain = new URL(url).hostname.replace('www.', ''); } catch { domain = url; }

        if (isVideo) {
            return (
                <a href={url} target="_blank" rel="noopener noreferrer"
                    className="block overflow-hidden h-[104px] sm:h-[116px] rounded-[1.5rem] border border-gray-100 dark:border-zinc-800 transition-all group shadow-sm bg-white dark:bg-zinc-950 mb-2">
                    <div className="flex flex-row h-full">
                        <div className="relative w-40 sm:w-52 h-full overflow-hidden bg-gradient-to-tr from-red-600/20 via-black to-red-600/10 flex items-center justify-center shrink-0 border-r border-gray-100 dark:border-zinc-800">
                            <div className="relative p-2 bg-red-600 text-white rounded-full shadow-lg transform transition-transform group-hover:scale-110">
                                <Play size={14} fill="currentColor" />
                            </div>
                        </div>
                        <div className="p-4 flex-1 min-w-0 flex flex-col justify-center">
                            <div className="flex items-center space-x-2 mb-1.5">
                                <Globe size={11} className="text-red-500" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{domain}</span>
                            </div>
                            <h4 className="text-sm md:text-base font-black text-gray-900 dark:text-white mb-1 group-hover:text-red-500 transition-colors line-clamp-2">
                                {isYouTube ? 'YouTube Video' : 'Multimedia Content'}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-tight break-words opacity-70 truncate">{url}</p>
                        </div>
                    </div>
                </a>
            );
        }

        return (
            <a href={url} target="_blank" rel="noopener noreferrer"
                className="flex items-center space-x-3 p-4 bg-gray-50/50 dark:bg-zinc-900/50 rounded-2xl border-[0.5px] border-gray-100 dark:border-zinc-800 transition-all group mb-2">
                <div className="p-2 bg-white dark:bg-zinc-800 rounded-lg text-slate-400 transition-colors shadow-sm">
                    <ExternalLink size={16} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{url}</p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">{domain}</p>
                </div>
            </a>
        );
    }

    // ── Success ───────────────────────────────────────────────────────────────
    let domain = '';
    try { domain = new URL(url).hostname.replace('www.', ''); } catch { domain = url; }

    if (isVideo) {
        return (
            <a href={url} target="_blank" rel="noopener noreferrer"
                className={`block overflow-hidden max-w-full h-[104px] sm:h-[116px] rounded-[1.5rem] border transition-all duration-300 group shadow-sm hover:shadow-md mb-2 bg-white dark:bg-zinc-950 ${isYouTube ? 'border-red-500/20 hover:border-red-500/40' : 'border-gray-100 dark:border-zinc-800'}`}>
                <div className="flex flex-row h-full min-w-0">
                    {data.image?.url && (
                        <div className="relative w-40 sm:w-52 h-full overflow-hidden shrink-0 bg-gray-100 dark:bg-zinc-900 border-r border-gray-100 dark:border-zinc-800">
                            <img
                                src={data.image.url}
                                alt={data.title}
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                onError={(e) => {
                                    const ytId = getYouTubeId(url);
                                    if (ytId && !e.currentTarget.src.includes('mqdefault')) {
                                        e.currentTarget.src = `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`;
                                    }
                                }}
                            />
                            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-all flex items-center justify-center">
                                <div className="p-2 bg-red-600 text-white rounded-full shadow-lg transform transition-transform group-hover:scale-110">
                                    <Play size={14} fill="currentColor" />
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="p-3 sm:p-4 flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex items-center space-x-2 mb-1.5">
                            {data.logo?.url
                                ? <img src={data.logo.url} className="w-4 h-4 object-contain" alt="" loading="lazy" />
                                : <Globe size={11} className={isYouTube ? 'text-red-500' : 'text-blue-500'} />
                            }
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{data.publisher || domain}</span>
                        </div>
                        <h4 className="text-sm md:text-base font-black text-gray-900 dark:text-white line-clamp-2 mb-1 leading-tight group-hover:text-red-600 transition-colors">
                            {data.title || url}
                        </h4>
                        {data.description && (
                            <p className="text-xs md:text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1 font-medium leading-relaxed opacity-80">{data.description}</p>
                        )}
                    </div>
                </div>
            </a>
        );
    }

    return (
        <a href={url} target="_blank" rel="noopener noreferrer"
            className="block max-w-full bg-white dark:bg-zinc-950 rounded-2xl border-[0.5px] border-gray-100 dark:border-zinc-800 overflow-hidden transition-all duration-300 group shadow-sm hover:shadow-md mb-2">
            <div className="flex flex-row min-w-0">
                {data.image?.url && (
                    <div className="w-24 h-24 sm:w-32 sm:h-auto overflow-hidden shrink-0 bg-gray-100 dark:bg-zinc-900 border-r border-gray-100 dark:border-zinc-800">
                        <img src={data.image.url} alt={data.title} loading="lazy" decoding="async"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    </div>
                )}
                <div className="p-4 flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center space-x-2 mb-1">
                        {data.logo?.url
                            ? <img src={data.logo.url} className="w-3 h-3 object-contain" alt="" loading="lazy" />
                            : <Globe size={10} className="text-blue-500" />
                        }
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{data.publisher || domain}</span>
                    </div>
                    <h4 className="text-sm font-black text-gray-900 dark:text-white line-clamp-1 mb-0.5 transition-colors">{data.title || url}</h4>
                    {data.description && (
                        <p className="text-xs md:text-[10px] text-gray-500 dark:text-gray-400 line-clamp-1 font-medium leading-relaxed">{data.description}</p>
                    )}
                </div>
            </div>
        </a>
    );
};
