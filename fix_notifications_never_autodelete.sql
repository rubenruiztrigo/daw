-- ============================================================================
-- Asegura que ningún RPC borre notificaciones automáticamente.
-- A partir de ahora, las notificaciones solo se eliminan cuando el usuario
-- pulsa el botón de borrar manualmente desde la UI.
-- ============================================================================

-- 1. fn_resolve_registration: Crea o actualiza la notificación al resolver.
create or replace function fn_resolve_registration(
  p_user_id uuid,
  p_notification_id uuid,
  p_approve boolean
) returns void
language plpgsql
security definer
as $$
begin
    -- Actualizar estado del usuario y su fecha de modificación
    update public.profiles
    set status = case when p_approve then 'active' else 'rejected' end,
        updated_at = now()
    where id = p_user_id;

    -- Manejar la notificación
    if p_notification_id is not null then
        -- Si ya existía una notificación real, la actualizamos
        update public.notifications
        set type = case when p_approve then 'registration_approved' else 'registration_rejected' end,
            is_read = true,
            updated_at = now()
        where id = p_notification_id;
    else
        -- Si era una notificación virtual (no había fila en DB), creamos una real
        -- para que quede constancia en el historial y no desaparezca.
        insert into public.notifications (user_id, sender_id, type, content, is_read, created_at, updated_at)
        values (auth.uid(), p_user_id, case when p_approve then 'registration_approved' else 'registration_rejected' end, 'Solicitud de registro', true, now(), now());
    end if;
end;
$$;

-- 2. fn_resolve_reward: Crea o actualiza la notificación al resolver recompensa.
create or replace function fn_resolve_reward(
  p_user_id uuid,
  p_reward_id uuid,
  p_notification_id uuid,
  p_approve boolean
) returns void
language plpgsql
security definer
as $$
declare
  v_cost integer;
begin
    if p_approve then
        select cost_novas into v_cost from rewards where id = p_reward_id;
        if v_cost is null then v_cost := 0; end if;

        update profiles
        set novas = greatest(0, coalesce(novas, 0) - v_cost),
            updated_at = now()
        where id = p_user_id;

        if p_notification_id is not null then
            update notifications
            set type = 'reward_accepted', 
                is_read = true,
                updated_at = now()
            where id = p_notification_id;
        else
            insert into public.notifications (user_id, sender_id, type, content, is_read, created_at, updated_at)
            values (auth.uid(), p_user_id, 'reward_accepted', 'Canje de recompensa aceptado', true, now(), now());
        end if;
    else
        if p_notification_id is not null then
            update notifications
            set type = 'reward_rejected', 
                is_read = true,
                updated_at = now()
            where id = p_notification_id;
        else
            insert into public.notifications (user_id, sender_id, type, content, is_read, created_at, updated_at)
            values (auth.uid(), p_user_id, 'reward_rejected', 'Canje de recompensa rechazado', true, now(), now());
        end if;
    end if;
end;
$$;
