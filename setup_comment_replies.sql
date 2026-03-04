
-- 1. Asegurar que la tabla existe con la estructura correcta
CREATE TABLE IF NOT EXISTS public.comment_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL,
    parent_reply_id UUID REFERENCES public.comment_replies(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Asegurar que las columnas existen (por si la tabla ya fue creada)
DO $$ 
BEGIN
    -- Renombrar content a text si existiera
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comment_replies' AND column_name = 'content') THEN
        ALTER TABLE public.comment_replies RENAME COLUMN content TO text;
    END IF;
    
    -- Añadir text si falta
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comment_replies' AND column_name = 'text') THEN
        ALTER TABLE public.comment_replies ADD COLUMN text TEXT NOT NULL DEFAULT '';
    END IF;

    -- Añadir parent_reply_id si falta
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comment_replies' AND column_name = 'parent_reply_id') THEN
        ALTER TABLE public.comment_replies ADD COLUMN parent_reply_id UUID REFERENCES public.comment_replies(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 3. Habilitar RLS
ALTER TABLE public.comment_replies ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de acceso
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Public read replies" ON public.comment_replies;
    CREATE POLICY "Public read replies" ON public.comment_replies FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Authenticated users can reply" ON public.comment_replies;
    CREATE POLICY "Authenticated users can reply" ON public.comment_replies FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error en políticas: %', SQLERRM;
END $$;

-- 5. RECARGAR EL CACHÉ (Esto soluciona el error "Could not find column in schema cache")
NOTIFY pgrst, 'reload schema';
