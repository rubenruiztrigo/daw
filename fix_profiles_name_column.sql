-- ============================================================================
-- Añade columna `name` a profiles para que la RPC get_chat_sidebar (que
-- referencia p.name) deje de fallar con: "column p.name does not exist".
-- ----------------------------------------------------------------------------
-- Estrategia: intentamos crear `name` como columna generada apuntando a la
-- columna fuente real (first_name / nombre / display_name / full_name) si
-- alguna de ellas existe. Si no existe ninguna candidata, creamos `name`
-- como columna de texto normal vacía.
-- Idempotente: si `profiles.name` ya existe, no hace nada.
-- ============================================================================

do $$
declare
  v_has_name          boolean;
  v_has_first_name    boolean;
  v_has_nombre        boolean;
  v_has_display_name  boolean;
  v_has_full_name     boolean;
begin
  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'name'
  ) into v_has_name;

  if v_has_name then
    raise notice 'profiles.name ya existe, no hay nada que hacer.';
    return;
  end if;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'first_name'
  ) into v_has_first_name;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'nombre'
  ) into v_has_nombre;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'display_name'
  ) into v_has_display_name;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'full_name'
  ) into v_has_full_name;

  if v_has_first_name then
    execute 'alter table public.profiles add column name text generated always as (first_name) stored';
    raise notice 'profiles.name creada como generada desde first_name.';
  elsif v_has_nombre then
    execute 'alter table public.profiles add column name text generated always as (nombre) stored';
    raise notice 'profiles.name creada como generada desde nombre.';
  elsif v_has_display_name then
    execute 'alter table public.profiles add column name text generated always as (display_name) stored';
    raise notice 'profiles.name creada como generada desde display_name.';
  elsif v_has_full_name then
    execute 'alter table public.profiles add column name text generated always as (full_name) stored';
    raise notice 'profiles.name creada como generada desde full_name.';
  else
    -- Fallback: columna normal vacía (la RPC al menos no romperá). El admin
    -- puede rellenarla a mano si procede.
    execute 'alter table public.profiles add column name text';
    raise notice 'profiles.name creada como columna de texto vacía (no se encontró fuente).';
  end if;
end;
$$;
