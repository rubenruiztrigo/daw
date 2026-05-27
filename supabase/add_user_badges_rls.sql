-- ============================================================================
-- Fix RLS Policies for User Badges
-- ----------------------------------------------------------------------------
-- Este script habilita las políticas RLS en la tabla user_badges para 
-- permitir que los administradores puedan asignar o quitar insignias.
-- ============================================================================

-- 1. Habilitar RLS en la tabla user_badges
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas existentes para evitar duplicados
DROP POLICY IF EXISTS "User badges are viewable by everyone" ON public.user_badges;
DROP POLICY IF EXISTS "Admins can insert user badges" ON public.user_badges;
DROP POLICY IF EXISTS "Admins can update user badges" ON public.user_badges;
DROP POLICY IF EXISTS "Admins can delete user badges" ON public.user_badges;

-- 3. Crear política para que todos puedan leer las insignias (SELECT)
CREATE POLICY "User badges are viewable by everyone" 
  ON public.user_badges FOR SELECT 
  USING (true);

-- 4. Crear política para que los administradores puedan asignar insignias (INSERT)
CREATE POLICY "Admins can insert user badges" 
  ON public.user_badges FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  );

-- 5. Crear política para que los administradores puedan actualizar insignias (UPDATE)
CREATE POLICY "Admins can update user badges" 
  ON public.user_badges FOR UPDATE TO authenticated 
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  );

-- 6. Crear política para que los administradores puedan eliminar insignias (DELETE)
CREATE POLICY "Admins can delete user badges" 
  ON public.user_badges FOR DELETE TO authenticated 
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  );

-- 7. Conceder permisos necesarios a los roles anon y authenticated
GRANT SELECT ON public.user_badges TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_badges TO authenticated;

-- 8. Notificar a PostgREST para recargar el esquema
NOTIFY pgrst, 'reload schema';
