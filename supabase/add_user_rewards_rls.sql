-- ============================================================================
-- Fix RLS Policies for User Rewards
-- ----------------------------------------------------------------------------
-- Este script habilita las políticas RLS en la tabla user_rewards para 
-- permitir que los usuarios puedan ver el estado de sus canjes (solicitado,
-- aceptado, rechazado) en el panel de recompensas.
-- ============================================================================

-- 1. Habilitar RLS en la tabla user_rewards
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas existentes para evitar duplicados
DROP POLICY IF EXISTS "Users can view their own rewards" ON public.user_rewards;
DROP POLICY IF EXISTS "Admins can view all rewards" ON public.user_rewards;

-- 3. Crear política para que cada usuario pueda ver sus propios canjes
CREATE POLICY "Users can view their own rewards" 
  ON public.user_rewards FOR SELECT 
  USING (auth.uid() = user_id);

-- 4. Crear política para que los administradores puedan ver todos los canjes
CREATE POLICY "Admins can view all rewards" 
  ON public.user_rewards FOR SELECT 
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  );

-- 5. Conceder permisos necesarios
GRANT SELECT ON public.user_rewards TO authenticated;

-- 6. Notificar a PostgREST para recargar el esquema
NOTIFY pgrst, 'reload schema';
