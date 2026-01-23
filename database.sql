
-- Tabla de perfiles actualizada
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL REFERENCES auth.users(id) PRIMARY KEY,
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
  followers_count integer NOT NULL DEFAULT 0,
  following_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Tabla de Posts (unificada para posts sociales y noticias de ranking)
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  image_url text,
  doc_url text,
  doc_name text,
  type text NOT NULL DEFAULT 'post' CHECK (type IN ('post', 'news')),
  tags text[] DEFAULT '{}',
  likes_count integer NOT NULL DEFAULT 0, -- Actúa como puntuación neta para noticias (upvotes - downvotes)
  comments_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Tabla de Votos y Likes
CREATE TABLE IF NOT EXISTS public.post_likes (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  vote_type text NOT NULL DEFAULT 'up' CHECK (vote_type IN ('up', 'down')),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (user_id, post_id)
);

-- Tabla de Comentarios
CREATE TABLE IF NOT EXISTS public.post_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
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

-- Tabla de Mensajes Directos
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text text NOT NULL,
  is_post_share boolean DEFAULT false,
  post_id uuid REFERENCES public.posts(id),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Tabla de Notificaciones
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('follow', 'like', 'comment')),
  content text,
  post_id uuid,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Trigger para manejar el Score neto de los posts (upvotes - downvotes)
CREATE OR REPLACE FUNCTION public.handle_post_score()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.posts 
    SET likes_count = likes_count + (CASE WHEN NEW.vote_type = 'up' THEN 1 ELSE -1 END)
    WHERE id = NEW.post_id;
  ELSIF (TG_OP = 'UPDATE') THEN
    UPDATE public.posts 
    SET likes_count = likes_count + (CASE WHEN NEW.vote_type = 'up' THEN 2 ELSE -2 END)
    WHERE id = NEW.post_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.posts 
    SET likes_count = likes_count - (CASE WHEN OLD.vote_type = 'up' THEN 1 ELSE -1 END)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_post_score_change
AFTER INSERT OR UPDATE OR DELETE ON public.post_likes
FOR EACH ROW EXECUTE FUNCTION public.handle_post_score();
