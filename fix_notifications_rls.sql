-- SOLUCIONA DUPLICADOS EN NOTIFICACIONES POR RLS
-- Permitir que el remitente (sender_id) pueda ver si ya envió una notificación.

-- 1. Asegurar politica de lectura para el emisor
DROP POLICY IF EXISTS "Usuarios pueden ver notificaciones enviadas" ON public.notifications;

CREATE POLICY "Usuarios pueden ver notificaciones enviadas"
ON public.notifications
FOR SELECT
USING (auth.uid() = sender_id);

-- 2. Asegurar que existe la politica para que el receptor vea sus notificaciones (ya debería existir, pero por seguridad)
-- Nota: Si Policy "Permitir lectura a dueños" ya existe y usa (auth.uid() = user_id), está cubierto.
-- Verificar si podemos consolidar, o dejar separadas. Separadas es más limpio.

SELECT 'Politica de RLS actualizada: Remitentes pueden ver sus notificaciones enviadas.' as result;
