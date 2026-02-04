-- ==========================================================
-- MIGRACIÓN: LIMPIEZA DE PERFIL Y LIKES EN COMENTARIOS
-- ==========================================================

-- 1. ELIMINAR COLUMNAS DEPRECATED EN PROFILES
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role_description;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS organization_name;

-- 2. CREAR TABLA DE LIKES EN COMENTARIOS
CREATE TABLE IF NOT EXISTS public.comment_likes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    comment_id uuid NOT NULL, -- Puede referenciar a post_comments o news_comments (no FK estricta para simplificar polimorfismo, o dos FKs nullable)
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, comment_id) -- Un usuario solo puede dar like una vez por comentario
);

-- Habilitar RLS
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- Políticas
DO $$ BEGIN
    CREATE POLICY "Lectura pública de likes comentarios" ON public.comment_likes FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Insertar likes propios comentarios" ON public.comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Borrar likes propios comentarios" ON public.comment_likes FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- 3. ACTUALIZAR TRIGGER DE REGISTRO (SIN LAS COLUMNAS BORRADAS)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
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
        birth_date
      )
      VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'name', ''),
        COALESCE(new.raw_user_meta_data->>'last_name', ''),
        COALESCE(LOWER(new.raw_user_meta_data->>'username'), 'u' || substr(md5(random()::text), 1, 8)),
        new.email,
        COALESCE(new.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || new.id),
        new.raw_user_meta_data->>'position',
        new.raw_user_meta_data->>'department',
        new.raw_user_meta_data->>'job_category',
        new.raw_user_meta_data->>'administration_type',
        new.raw_user_meta_data->>'country',
        new.raw_user_meta_data->>'region',
        ARRAY(SELECT jsonb_array_elements_text(COALESCE(NULLIF(new.raw_user_meta_data->>'interests', ''), '[]')::jsonb)),
        NULLIF(new.raw_user_meta_data->>'birth_date', '')::date
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email;
  EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Error creating profile for user %: %', new.id, SQLERRM;
  END;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT 'Migración completada: Columnas eliminadas, Tabla Likes creada, Trigger actualizado.' as result;
