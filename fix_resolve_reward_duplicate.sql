-- ============================================================================
-- Deja UNA sola versión canónica de fn_resolve_reward (p_reward_id TEXT).
-- ----------------------------------------------------------------------------
-- Contexto / síntomas:
--   (A) "Could not choose the best candidate function between ... text ... uuid"
--       → coexisten dos sobrecargas, PostgREST no sabe cuál elegir.
--   (B) "invalid input syntax for type uuid: 'course'"
--       → notifications.post_id y user_rewards.reward_id guardan un slug de
--         texto (ej. 'course') en vez de un UUID. La variante uuid no puede
--         operar con esos datos.
--
-- Solución: eliminamos las dos variantes existentes y creamos una única con
-- p_reward_id TEXT. Internamente compara por id::text, icon_name o name, así
-- funciona tanto si rewards.id es UUID como si es un slug.
-- ============================================================================

drop function if exists public.fn_resolve_reward(
  p_user_id uuid,
  p_reward_id text,
  p_notification_id uuid,
  p_approve boolean
);

drop function if exists public.fn_resolve_reward(
  p_user_id uuid,
  p_reward_id uuid,
  p_notification_id uuid,
  p_approve boolean
);

create or replace function public.fn_resolve_reward(
  p_user_id uuid,
  p_reward_id text,
  p_notification_id uuid,
  p_approve boolean
) returns void
language plpgsql
security definer
as $$
declare
  v_reward_name text;
begin
  -- Resolver el nombre legible de la recompensa (para la notificación al
  -- usuario). Busca por id::text, icon_name o name; funciona tanto si
  -- rewards.id es UUID como si es un slug.
  select name into v_reward_name
    from rewards
    where id::text = p_reward_id
       or icon_name = p_reward_id
       or lower(name) = lower(p_reward_id)
    limit 1;

  if p_approve then
    -- NO se descuentan novas: solicitud canjeada ≠ gasto.
    -- (Si en el futuro quisieras descontar, hazlo aquí con greatest(0, ...).)

    -- Marcar la fila pendiente de user_rewards como aceptada.
    update user_rewards
      set status = 'aceptado'
      where user_id = p_user_id
        and reward_id::text = p_reward_id
        and status = 'solicitado';

    if p_notification_id is not null then
      -- Mantener type='reward_request' y marcar el sufijo ' (aceptado)' en
      -- content del admin. Así la notificación NO desaparece del panel admin
      -- y se renderiza con el badge "Aceptada" que ya existe en
      -- NotificationsView.
      update notifications
        set content = case
              when content ilike '%(aceptado)%' or content ilike '%(rechazado)%'
                then content
              else coalesce(content, '') || ' (aceptado)'
            end,
            is_read = true
        where id = p_notification_id;
    end if;

    -- Notificar al USUARIO dueño de la solicitud. Evita duplicar: solo
    -- inserta si no hay ya una notificación reward_accepted con ese mismo
    -- texto en las últimas 24h.
    if not exists (
      select 1 from notifications
      where user_id = p_user_id
        and type = 'reward_accepted'
        and content = 'La recompensa solicitada "' || coalesce(v_reward_name, p_reward_id) || '"'
        and created_at > now() - interval '1 day'
    ) then
      insert into notifications (user_id, sender_id, type, content)
      values (
        p_user_id,
        auth.uid(),
        'reward_accepted',
        'La recompensa solicitada "' || coalesce(v_reward_name, p_reward_id) || '"'
      );
    end if;
  else
    update user_rewards
      set status = 'rechazado'
      where user_id = p_user_id
        and reward_id::text = p_reward_id
        and status = 'solicitado';

    if p_notification_id is not null then
      update notifications
        set content = case
              when content ilike '%(aceptado)%' or content ilike '%(rechazado)%'
                then content
              else coalesce(content, '') || ' (rechazado)'
            end,
            is_read = true
        where id = p_notification_id;
    end if;
  end if;
end;
$$;

-- Verificación (opcional): debería listar exactamente una fila.
-- select proname, pg_get_function_identity_arguments(oid)
--   from pg_proc where proname = 'fn_resolve_reward';
