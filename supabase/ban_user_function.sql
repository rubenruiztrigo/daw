
-- Funcion segura para banear usuarios (evita problemas de RLS)
CREATE OR REPLACE FUNCTION ban_user(target_user_id UUID, ban_duration_iso TEXT)
RETURNS VOID AS 
BEGIN
  -- Verificar que el ejecutor es administrador
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true) THEN
    UPDATE public.profiles
    SET is_banned = true,
        banned_until = ban_duration_iso::TIMESTAMPTZ
    WHERE id = target_user_id;
  ELSE
    RAISE EXCEPTION 'No tienes permisos de administrador';
  END IF;
END;
 LANGUAGE plpgsql SECURITY DEFINER;

-- Funcion segura para desbanear
CREATE OR REPLACE FUNCTION unban_user(target_user_id UUID)
RETURNS VOID AS 
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true) THEN
    UPDATE public.profiles
    SET is_banned = false,
        banned_until = NULL
    WHERE id = target_user_id;
  ELSE
    RAISE EXCEPTION 'No tienes permisos de administrador';
  END IF;
END;
 LANGUAGE plpgsql SECURITY DEFINER;

