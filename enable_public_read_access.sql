-- ==========================================================
-- HABILITAR LECTURA PÚBLICA DE CONTENIDO
-- ==========================================================
-- Ejecuta esto si el feed aparece vacío para usuarios nuevos.

-- 1. POSTS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    CREATE POLICY "Lectura pública de posts" ON public.posts FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. NEWS
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    CREATE POLICY "Lectura pública de noticias" ON public.news FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. PROFILES (Necesario para ver autores)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    CREATE POLICY "Lectura pública de perfiles" ON public.profiles FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. COMENTARIOS
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    CREATE POLICY "Lectura pública de comentarios posts" ON public.post_comments FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.news_comments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    CREATE POLICY "Lectura pública de comentarios noticias" ON public.news_comments FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 5. LIKES (Para ver contadores si se consultan directamente, aunque conteo suele ser count(*))
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    CREATE POLICY "Lectura pública de likes posts" ON public.post_likes FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    CREATE POLICY "Lectura pública de likes comentarios" ON public.comment_likes FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


SELECT 'Políticas de lectura pública aplicadas correctamente.' as result;
