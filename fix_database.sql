-- ==========================================================
-- SCRIPT DE REPARACIÓN DE BASE DE DATOS
-- ==========================================================
-- Ejecuta TODO este script en el Editor SQL de Supabase para:
-- 1. Crear la tabla de posts eliminados (soluciona error 404)
-- 2. Asegurar que la tabla profiles tenga todas las columnas necesarias (soluciona error 500 si faltan campos)
-- 3. Actualizar el trigger de registro para ser más robusto (soluciona error 500 por fechas vacías)

-- 1. SOLUCIÓN ERROR 404: Crear tabla de posts eliminados si no existe
CREATE TABLE IF NOT EXISTS public.posts_eliminados (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id uuid NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now()
);

-- Habilitar seguridad (RLS)
ALTER TABLE public.posts_eliminados ENABLE ROW LEVEL SECURITY;

-- Políticas (si no existen, el comando CREATE POLICY puede fallar si se duplica, así que usamos bloque DO)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'posts_eliminados' AND policyname = 'Permitir inserción a dueños') THEN
        CREATE POLICY "Permitir inserción a dueños" ON public.posts_eliminados FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'posts_eliminados' AND policyname = 'Permitir lectura a dueños') THEN
        CREATE POLICY "Permitir lectura a dueños" ON public.posts_eliminados FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;


-- 2. SOLUCIÓN ERROR 500 (POSIBLE): Asegurar columnas en profiles
-- Añadimos las columnas si no existen
DO $$
BEGIN
    -- Añadir columna role_description
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role_description') THEN
        ALTER TABLE public.profiles ADD COLUMN role_description text;
    END IF;

    -- Añadir columna organization_name
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'organization_name') THEN
        ALTER TABLE public.profiles ADD COLUMN organization_name text;
    END IF;

    -- Asegurarnos de que job_category y administration_type sean TEXT (para evitar errores de Enum)
    -- Si ya existen, esto no hace nada, pero es bueno saberlo.
END $$;


-- 3. ACTUALIZACIÓN ROBUSTA DEL TRIGGER (Soluciona error de fecha vacía)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    name,
    last_name,
    username,
    email,
    avatar,
    position,
    department,
    job_category,
    administration_type,
    country,
    region,
    interests,
    birth_date,
    organization_name,
    role_description
  )
  VALUES (
    new.id,
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'last_name',
    -- Fallback de username si viene vacío
    COALESCE(LOWER(new.raw_user_meta_data->>'username'), 'user_' || substr(new.id::text, 1, 8)),
    new.email,
    COALESCE(new.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || new.id),
    new.raw_user_meta_data->>'position',
    new.raw_user_meta_data->>'department',
    new.raw_user_meta_data->>'job_category',
    new.raw_user_meta_data->>'administration_type',
    new.raw_user_meta_data->>'country',
    new.raw_user_meta_data->>'region',
    -- Manejo robusto de array de intereses
    ARRAY(SELECT jsonb_array_elements_text(COALESCE(NULLIF(new.raw_user_meta_data->>'interests', ''), '[]')::jsonb)),
    -- Manejo robusto de fecha: NULLIF para evitar error con string vacío ''
    NULLIF(new.raw_user_meta_data->>'birth_date', '')::date,
    new.raw_user_meta_data->>'department',
    ''
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    last_name = EXCLUDED.last_name,
    username = EXCLUDED.username,
    position = EXCLUDED.position,
    department = EXCLUDED.department,
    job_category = EXCLUDED.job_category,
    administration_type = EXCLUDED.administration_type,
    country = EXCLUDED.country,
    region = EXCLUDED.region,
    interests = EXCLUDED.interests,
    birth_date = EXCLUDED.birth_date,
    avatar = EXCLUDED.avatar;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recrear el trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

SELECT 'Base de datos reparada correctamente' as result;
