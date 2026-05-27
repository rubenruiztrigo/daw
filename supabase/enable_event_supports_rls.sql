-- Habilitar Row Level Security y políticas para table event_supports
-- Permite a usuarios autenticados insertar/eliminar sus propios apoyos,
-- y permite la lectura pública de los apoyos.

-- Activar RLS si no está ya activado
ALTER TABLE IF EXISTS public.event_supports ENABLE ROW LEVEL SECURITY;

-- Permitir SELECT para todos (visibilidad pública)
DROP POLICY IF EXISTS "Allow select for everyone on event_supports" ON public.event_supports;
CREATE POLICY "Allow select for everyone on event_supports" ON public.event_supports
  FOR SELECT
  USING (true);

-- Permitir INSERT solo si auth.uid() coincide con user_id (el usuario inserta su propio apoyo)
DROP POLICY IF EXISTS "Allow insert for owners on event_supports" ON public.event_supports;
CREATE POLICY "Allow insert for owners on event_supports" ON public.event_supports
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Permitir DELETE solo si auth.uid() coincide con user_id (el usuario borra su propio apoyo)
DROP POLICY IF EXISTS "Allow delete for owners on event_supports" ON public.event_supports;
CREATE POLICY "Allow delete for owners on event_supports" ON public.event_supports
  FOR DELETE
  USING (auth.uid() = user_id);

-- Permitir UPDATE solo si auth.uid() coincide con user_id (si se necesita actualizar)
DROP POLICY IF EXISTS "Allow update for owners on event_supports" ON public.event_supports;
CREATE POLICY "Allow update for owners on event_supports" ON public.event_supports
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- (Opcional) Asegurarse de que el rol authenticated tiene permisos básicos
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_supports TO authenticated;
