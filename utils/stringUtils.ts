
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

export const isExternalUrl = (url: string): boolean => {
  if (!url) return false;
  const internalDomains = [
    'redsocial.app',
    'red.novagob.org',
    'localhost',
    '127.0.0.1'
  ];
  try {
    const domain = new URL(url).hostname.toLowerCase();
    return !internalDomains.some(d => domain.includes(d));
  } catch {
    return false;
  }
};
