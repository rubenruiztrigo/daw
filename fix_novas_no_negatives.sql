-- ============================================================================
-- Evita valores negativos en profiles.novas
-- ----------------------------------------------------------------------------
-- 1. Clampa los valores existentes que estén por debajo de 0 a 0.
-- 2. Añade un CHECK constraint para impedir futuros valores negativos.
-- 3. Reescribe la RPC add_novas para que clampe a 0 (defensa en profundidad:
--    si otro código pasa un delta muy negativo, nunca bajará de 0).
-- 4. Reescribe fn_resolve_reward para que clampe el coste.
-- ============================================================================

-- 1. Corregir valores existentes
update profiles
set novas = 0
where novas < 0;

-- 2. CHECK constraint (drop primero por si ya existe para permitir re-ejecución)
alter table profiles drop constraint if exists profiles_novas_non_negative;
alter table profiles add constraint profiles_novas_non_negative check (novas >= 0);

-- 3. add_novas con clamp a 0
create or replace function add_novas(target_user_id uuid, delta integer)
returns void
language plpgsql
security definer
as $$
begin
  update profiles
  set novas = greatest(0, coalesce(novas, 0) + delta)
  where id = target_user_id;
end;
$$;

-- 4. fn_resolve_reward con clamp a 0 al restar el coste
-- Esta versión asume la firma (p_user_id uuid, p_reward_id uuid, p_notification_id uuid, p_approve boolean).
-- Si la firma real difiere, adapta el encabezado antes de ejecutar.
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
    set novas = greatest(0, coalesce(novas, 0) - v_cost)
    where id = p_user_id;

    if p_notification_id is not null then
      update notifications
      set type = 'reward_accepted', is_read = true
      where id = p_notification_id;
    end if;
  else
    if p_notification_id is not null then
      delete from notifications where id = p_notification_id;
    end if;
  end if;
end;
$$;
