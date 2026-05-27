-- ============================================================================
-- DIAGNÓSTICO (solo lectura): identificar por qué get_chat_sidebar falla con
-- "column p.name does not exist".
-- Ejecuta las dos queries y pega los resultados en el chat.
-- ============================================================================

-- (1) Columnas actuales de profiles. Nos interesa si existe 'name',
--     'first_name', u otra variante equivalente.
select column_name, data_type
  from information_schema.columns
  where table_schema = 'public' and table_name = 'profiles'
  order by ordinal_position;

-- (2) Cuerpo actual de get_chat_sidebar. Aquí veremos en qué línea aparece
--     'p.name' y a qué tabla corresponde el alias 'p'.
select pg_get_functiondef(oid) as definition
  from pg_proc
  where proname = 'get_chat_sidebar';
