-- ==========================================================
-- ACTUALIZACIÓN DEL TRIGGER DE REGISTRO DE USUARIOS
-- ==========================================================
-- Ejecuta este script en el Editor SQL de Supabase para corregir
-- el problema de que no se guardan todos los datos del perfil
-- cuando el usuario se registra (especialmente con confirmación de email).

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
    LOWER(new.raw_user_meta_data->>'username'),
    new.email,
    COALESCE(new.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || new.id),
    new.raw_user_meta_data->>'position',
    new.raw_user_meta_data->>'department',
    new.raw_user_meta_data->>'job_category',
    new.raw_user_meta_data->>'administration_type',
    new.raw_user_meta_data->>'country',
    new.raw_user_meta_data->>'region',
    ARRAY(SELECT jsonb_array_elements_text(COALESCE(new.raw_user_meta_data->>'interests', '[]')::jsonb)),
    (new.raw_user_meta_data->>'birth_date')::date,
    new.raw_user_meta_data->>'department', -- Usamos department como organización por defecto
    '' -- role_description vacío por defecto
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

-- Asegurarse de que el trigger esté activo (por si acaso)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Confirmación
SELECT 'Trigger handle_new_user actualizado correctamente' as result;
