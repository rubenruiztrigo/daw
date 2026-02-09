-- ==========================================================
-- MIGRACIÓN: AGREGAR SOPORTE PARA COMPARTIR PERFILES EN MENSAJES
-- ==========================================================

-- Agregar columnas para compartir perfil
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS shared_profile_id uuid REFERENCES public.profiles(id);

SELECT 'Columnas para compartir perfil agregadas a mensajes.' as result;
