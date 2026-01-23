
-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de perfiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id),
  name text NOT NULL,
  last_name text,
  username text UNIQUE,
  email text,
  gender text,
  birth_date date,
  position text,
  department text,
  job_category text,
  administration_type text,
  country text DEFAULT 'España',
  region text,
  avatar text,
  bio text,
  interests text[] DEFAULT '{}',
  followers_count integer DEFAULT 0,
  following_count integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Tabla de Posts (Exclusiva para 'Inicio')
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  image_url text,
  doc_url text,
  doc_name text,
  tags text[] DEFAULT '{}',
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Tabla de News (Exclusiva para 'Noticias')
CREATE TABLE IF NOT EXISTS public.news (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  image_url text,
  tags text[] DEFAULT '{}',
  likes_count integer DEFAULT 0,
  up_votes_count integer DEFAULT 0,
  down_votes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

-- Políticas para Profiles
CREATE POLICY "Perfiles visibles para todos" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Usuarios pueden insertar su propio perfil" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Usuarios pueden actualizar su propio perfil" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Políticas para Posts (Inicio)
CREATE POLICY "Posts visibles para todos" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Usuarios autenticados pueden crear posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Usuarios pueden borrar sus propios posts" ON public.posts FOR DELETE USING (auth.uid() = author_id);

-- Políticas para News (Noticias)
CREATE POLICY "Noticias visibles para todos" ON public.news FOR SELECT USING (true);
CREATE POLICY "Usuarios autenticados pueden crear noticias" ON public.news FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Tabla de Likes para Posts
CREATE TABLE IF NOT EXISTS public.post_likes (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  vote_type text DEFAULT 'up' CHECK (vote_type IN ('up', 'down')),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (user_id, post_id)
);

-- Tabla de Comentarios de Posts
CREATE TABLE IF NOT EXISTS public.post_comments (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Tabla de Seguimientos
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  followed_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (follower_id, followed_id)
);
