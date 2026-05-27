
import { COUNTRIES_DATA } from './utils/countriesData';

export { COUNTRIES_DATA };
export const COUNTRIES = Object.keys(COUNTRIES_DATA);

export const PUBLIC_INTERESTS = [
  'Innovación Pública',
  'IA en Gobierno',
  'Transformación Digital',
  'Transparencia',
  'Gestión del Talento',
  'Sostenibilidad',
  'Innovación urbana',
  'Comunicación',
  'Buen gobierno',
  'Participación',
  'Resiliencia',
  'Prospectiva',
  'Contratación Pública',
  'Datos Abiertos',
  'Liderazgo',
  'Laboratorios de Innovación'
];

// Eventos dinámicos para que el filtro de "próximos 15 días" siempre tenga datos
const now = new Date();
const dayInMs = 24 * 60 * 60 * 1000;

export const CALENDAR_EVENTS = [
  {
    id: 'e1',
    title: 'Congreso Red Social de NovaGob 2024',
    type: 'congress' as const,
    date: new Date(now.getTime() + 2 * dayInMs),
    location: 'Sede Central / Online',
    attendees: 450,
    description: 'El mayor evento de innovación pública en iberoamérica.'
  },
  {
    id: 'e2',
    title: 'Webinar: IA en Gobiernos Locales',
    type: 'training' as const,
    date: new Date(now.getTime() + 5 * dayInMs),
    location: 'Zoom',
    attendees: 120,
    description: 'Sesión práctica sobre implementación de LLMs en ayuntamientos.'
  },
  {
    id: 'e3',
    title: 'Reunión de Laboratorios',
    type: 'innovation' as const,
    date: new Date(now.getTime() + 10 * dayInMs),
    location: 'Sala 3B',
    attendees: 15,
    description: 'Coordinación trimestral de laboratorios de innovación ciudadana.'
  },
  {
    id: 'e4',
    title: 'Taller de Transparencia Activa',
    type: 'training' as const,
    date: new Date(now.getTime() + 14 * dayInMs),
    location: 'Aula Virtual',
    attendees: 85,
    description: 'Mejora de los portales de datos abiertos institucionales.'
  },
  {
    id: 'e5',
    title: 'Hackathon Sector Público',
    type: 'innovation' as const,
    date: new Date(now.getTime() + 25 * dayInMs),
    location: 'Madrid Tech Lab',
    attendees: 200,
    description: 'Resolviendo retos reales con tecnología abierta.'
  }
];

export const MOCK_USER: any = {
  id: 'u1',
  name: 'Ana García',
  position: 'Directora de Innovación',
  institution: 'Diputación General',
  avatar: '/img/imagen-por-defecto.png',
  bio: 'Apasionada por la transformación digital del sector público. Siempre buscando nuevas formas de mejorar los servicios ciudadanos.',
  interests: ['Innovación Pública', 'IA en Gobierno', 'Transparencia'],
  followers: 128,
  following: 84,
  joinedDate: '2018-06-15T10:00:00.000Z'
};
