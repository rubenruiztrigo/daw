-- ==========================================
-- 1. PERMISOS DE RLS PARA NOTIFICACIONES
-- ==========================================

-- Permitir que el remitente (el que hace la acción) pueda VER si ya envió una notificación (Deduplicación)
DROP POLICY IF EXISTS "Usuarios pueden ver notificaciones enviadas" ON public.notifications;
CREATE POLICY "Usuarios pueden ver notificaciones enviadas"
ON public.notifications
FOR SELECT
USING (auth.uid() = sender_id);

-- Permitir que el remitente pueda BORRAR su notificación (al dar unlike, unfollow, etc.)
DROP POLICY IF EXISTS "Usuarios pueden borrar sus notificaciones enviadas" ON public.notifications;
CREATE POLICY "Usuarios pueden borrar sus notificaciones enviadas"
ON public.notifications
FOR DELETE
USING (auth.uid() = sender_id);

-- Asegurar que el receptor pueda ver sus notificaciones
DROP POLICY IF EXISTS "Usuarios pueden ver sus propias notificaciones" ON public.notifications;
CREATE POLICY "Usuarios pueden ver sus propias notificaciones"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Asegurar que el receptor pueda borrar sus notificaciones (si desea limpiarlas)
DROP POLICY IF EXISTS "Usuarios pueden borrar sus propias notificaciones" ON public.notifications;
CREATE POLICY "Usuarios pueden borrar sus propias notificaciones"
ON public.notifications
FOR DELETE
USING (auth.uid() = user_id);

-- ==========================================
-- 2. DEDUPLICACIÓN A NIVEL DE BASE DE DATOS
-- ==========================================

-- Nota: Para likes, follows y reposts, solo debería existir una notificación activa entre dos usuarios para el mismo post.
-- Primero limpiamos duplicados existentes para evitar errores al crear la restricción
DELETE FROM public.notifications n1
USING public.notifications n2
WHERE n1.id > n2.id
  AND n1.user_id = n2.user_id
  AND n1.sender_id = n2.sender_id
  AND n1.type = n2.type
  AND (n1.post_id = n2.post_id OR (n1.post_id IS NULL AND n2.post_id IS NULL));

-- Añadir restricción de unicidad para evitar duplicados futuros
-- Comentamos esto por si quieres aplicarlo manualmente o si prefieres confiar en el código.
-- ALTER TABLE public.notifications ADD CONSTRAINT unique_notification_sync 
-- UNIQUE (user_id, sender_id, type, post_id);
