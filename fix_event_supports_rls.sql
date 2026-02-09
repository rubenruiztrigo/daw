-- ==========================================================
-- SOLUCIÓN: Habilitar lectura pública de apoyos a eventos
-- ==========================================================

-- 1. Asegurar que RLS esté activo (por seguridad)
ALTER TABLE public.event_supports ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas antiguas que podrían estar restringiendo la visión
-- (Por ejemplo, políticas generadas automáticamente que solo permiten select a auth.uid() = user_id)
DROP POLICY IF EXISTS "Permitir lectura pública de apoyos" ON public.event_supports;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.event_supports;
DROP POLICY IF EXISTS "Usuarios pueden ver sus propios apoyos" ON public.event_supports;

-- 3. Crear la política CORRECTA que permite a cualquiera (autenticado o anónimo, según prefieras) ver los apoyos
-- Usamos 'true' para que cualquier query SELECT pase la política.
CREATE POLICY "Permitir lectura pública de apoyos"
ON public.event_supports
FOR SELECT
USING (true);

-- 4. Mantener las políticas de INSERT/DELETE restringidas (solo el usuario puede apoyar/deshacer)
DROP POLICY IF EXISTS "Permitir insertar a autenticados" ON public.event_supports;
CREATE POLICY "Permitir insertar a autenticados"
ON public.event_supports
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Permitir borrar a dueños" ON public.event_supports;
CREATE POLICY "Permitir borrar a dueños"
ON public.event_supports
FOR DELETE
USING (auth.uid() = user_id);
