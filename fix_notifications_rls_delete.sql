-- ============================================================================
-- Permite al usuario dueño de una notificación borrarla (DELETE).
-- ----------------------------------------------------------------------------
-- Síntoma: al pulsar "Borrar" en la UI, la notificación desaparece del estado
-- local pero reaparece en la siguiente carga porque el DELETE en Supabase
-- devuelve 0 filas afectadas (bloqueado por RLS sin error).
--
-- Esta migración garantiza que exista una policy permitiendo a cada usuario
-- borrar SOLO sus propias notificaciones (user_id = auth.uid()).
-- ============================================================================

-- RLS debe estar habilitado (idempotente)
alter table notifications enable row level security;

-- Eliminar policy previa con mismo nombre si existe para permitir re-ejecución
drop policy if exists "notifications_owner_delete" on notifications;

-- Crear la policy de borrado
create policy "notifications_owner_delete"
  on notifications
  for delete
  using (user_id = auth.uid());
