import React, { useEffect, useState } from 'react';
import { ExternalLink, Loader2, Globe } from 'lucide-react';
import { Language, useTranslation } from '../utils/translations';

interface LinkPreviewData {
    title?: string;
    description?: string;
    image?: {
        url: string;
    };
    logo?: {
        url: string;
    };
    url: string;
    publisher?: string;
}

interface LinkPreviewProps {
    url: string;
    language?: Language;
}

export const LinkPreview: React.FC<LinkPreviewProps> = ({ url, language = 'es' }) => {
    const [data, setData] = useState<LinkPreviewData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const t = useTranslation(language as Language);

    useEffect(() => {
        let isMounted = true;
        const fetchMetadata = async () => {
            try {
                setLoading(true);
                setError(false);
                // Using microlink.io as a free proxy/metadata fetcher
                const response = await fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}`);
                const json = await response.json();

                if (isMounted && json.status === 'success') {
                    setData(json.data);
                } else if (isMounted) {
                    setError(true);
                }
            } catch (err) {
                if (isMounted) setError(true);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchMetadata();
        return () => { isMounted = false; };
    }, [url]);

    if (loading) {
        return (
            <div className="flex items-center space-x-2 p-4 bg-gray-50/50 dark:bg-zinc-900/50 rounded-2xl border-[0.5px] border-gray-100 dark:border-zinc-800 animate-pulse">
                <Loader2 size={16} className="text-blue-500 animate-spin" />
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('searching')}...</span>
            </div>
        );
    }

    if (error || !data) {
        return (
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-3 p-4 bg-gray-50/50 dark:bg-zinc-900/50 rounded-2xl border-[0.5px] border-gray-100 dark:border-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all group"
            >
                <div className="p-2 bg-white dark:bg-zinc-800 rounded-lg text-slate-400 group-hover:text-blue-500 transition-colors shadow-sm">
                    <ExternalLink size={16} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{url}</p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">{new URL(url).hostname}</p>
                </div>
            </a>
        );
    }

    const domain = new URL(url).hostname.replace('www.', '');

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-white dark:bg-zinc-950 rounded-2xl border-[0.5px] border-gray-100 dark:border-zinc-800 overflow-hidden hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-0.5 transition-all duration-300 group"
        >
            <div className="flex flex-row">
                {data.image?.url && (
                    <div className="w-20 h-20 sm:w-28 sm:h-auto overflow-hidden shrink-0 bg-gray-100 dark:bg-zinc-900 border-r border-gray-100 dark:border-zinc-800">
                        <img
                            src={data.image.url}
                            alt={data.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    </div>
                )}
                <div className="p-2.5 sm:p-3 flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center space-x-2 mb-1">
                        {data.logo?.url ? (
                            <img src={data.logo.url} className="w-3 h-3 object-contain" alt="" />
                        ) : (
                            <Globe size={10} className="text-blue-500" />
                        )}
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">
                            {data.publisher || domain}
                        </span>
                    </div>
                    <h4 className="text-sm font-black text-gray-900 dark:text-white line-clamp-1 mb-0.5 group-hover:text-blue-600 transition-colors">
                        {data.title || url}
                    </h4>
                    {data.description && (
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-1 font-medium leading-relaxed">
                            {data.description}
                        </p>
                    )}
                </div>
            </div>
        </a>
    );
};
