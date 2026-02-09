-- AGREGAR COLUMNA DE INSIGNIAS A PERFILES
-- Permite almacenar la lista de insignias desbloqueadas por usuario en formato JSONB.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'badges') THEN
        ALTER TABLE public.profiles ADD COLUMN badges jsonb DEFAULT '[]'::jsonb;
    END IF;
END $$;

SELECT 'Columna badges verificada en profiles.' as result;
