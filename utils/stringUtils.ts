
export const normalizeString = (str: string): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

export const timeAgo = (date: string | number | Date, lang: 'es' | 'en' = 'es'): string => {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 5) return lang === 'es' ? 'ahora mismo' : 'just now';

  const intervals = [
    { label: { es: 'año', en: 'year' }, seconds: 31536000 },
    { label: { es: 'mes', en: 'month' }, seconds: 2592000 },
    { label: { es: 'semana', en: 'week' }, seconds: 604800 },
    { label: { es: 'día', en: 'day' }, seconds: 86400 },
    { label: { es: 'hora', en: 'hour' }, seconds: 3600 },
    { label: { es: 'minuto', en: 'minute' }, seconds: 60 },
    { label: { es: 'segundo', en: 'second' }, seconds: 1 }
  ];

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count >= 1) {
      if (count === 1) {
        return lang === 'es' ? `hace 1 ${interval.label.es}` : `1 ${interval.label.en} ago`;
      } else {
        if (lang === 'es') {
          const plural = interval.label.es === 'mes' ? 'es' : 's';
          return `hace ${count} ${interval.label.es}${plural}`;
        } else {
          return `${count} ${interval.label.en}s ago`;
        }
      }
    }
  }
  return lang === 'es' ? 'hace unos instantes' : 'a moment ago';
};

export const extractFirstUrl = (text: string): string | null => {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const match = text.match(urlRegex);
  return match ? match[0] : null;
};

export const extractAllExternalUrls = (text: string, isExternalUrlFn: (url: string) => boolean): string[] => {
  if (!text) return [];
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const matches = text.match(urlRegex) || [];
  const seen = new Set<string>();
  return matches.filter(url => {
    if (seen.has(url) || !isExternalUrlFn(url)) return false;
    seen.add(url);
    return true;
  });
};

export const isExternalUrl = (url: string): boolean => {
  if (!url) return false;
  const internalDomains = [
    'redsocial.app',
    'red.novagob.org',
    'localhost',
    '127.0.0.1'
  ];
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    if (internalDomains.some(d => hostname.includes(d))) return false;
    // Treat private/LAN IP ranges as internal
    if (/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(hostname)) return false;
    return true;
  } catch {
    return false;
  }
};

const RESERVED_ROUTES = new Set([
  'inicio', 'noticias', 'mensajes', 'calendario', 'notificaciones',
  'configuracion', 'recompensas', 'buscar', 'admin', 'img', 'api'
]);

/** Parses an internal app URL and returns { type, identifier } or null */
export const parseInternalAppUrl = (url: string): { type: 'profile' | 'news' | 'post'; identifier: string } | null => {
  try {
    const { pathname } = new URL(url);
    const segments = pathname.replace(/^\//, '').split('/').filter(Boolean);
    if (segments.length === 0) return null;

    const first = segments[0];
    if (RESERVED_ROUTES.has(first)) return null;

    if (first === 'noticias' && segments[1]) return { type: 'news', identifier: segments[1] };
    if ((first === 'post' || first === 'posts') && segments[1]) return { type: 'post', identifier: segments[1] };

    // Single segment that is not a reserved route → profile username or ID
    if (segments.length === 1 || (segments.length === 2 && /^[0-9a-f-]{36}$/.test(segments[1]))) {
      return { type: 'profile', identifier: first };
    }
    return null;
  } catch {
    return null;
  }
};
