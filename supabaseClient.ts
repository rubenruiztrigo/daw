import { createClient } from '@supabase/supabase-js';
import { safeLocalStorageSet } from './utils/cacheUtils';

// Cambiamos las cadenas de texto por las variables de entorno
// Usamos import.meta.env porque parece que estás usando Vite (por el error anterior)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const REMEMBER_ME_KEY = 'remember_me_session';
export const SESSION_ALIVE_KEY = 'session_alive';

const safeStorage = {
  getItem: (key: string) => localStorage.getItem(key),
  setItem: (key: string, value: string) => safeLocalStorageSet(key, value),
  removeItem: (key: string) => localStorage.removeItem(key),
};

// Verificación de seguridad para avisarte si el .env no carga
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ ERROR: No se han cargado las variables de entorno de Supabase. Revisa tu archivo .env");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: safeStorage,
  },
});