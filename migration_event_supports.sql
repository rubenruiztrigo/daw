-- =====================================================
-- TABLA DE APOYOS A EVENTOS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.event_supports (
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_id uuid REFERENCES public.user_events(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (user_id, event_id)
);

-- Habilitar RLS
ALTER TABLE public.event_supports ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Permitir lectura pública de apoyos" ON public.event_supports FOR SELECT USING (true);
CREATE POLICY "Permitir insertar a autenticados" ON public.event_supports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Permitir borrar a dueños" ON public.event_supports FOR DELETE USING (auth.uid() = user_id);

-- Trigger para sincronizar attendees_count en user_events
CREATE OR REPLACE FUNCTION public.handle_event_support_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.user_events 
    SET attendees_count = attendees_count + 1 
    WHERE id = NEW.event_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.user_events 
    SET attendees_count = GREATEST(0, attendees_count - 1) 
    WHERE id = OLD.event_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_event_support_count ON public.event_supports;
CREATE TRIGGER tr_event_support_count
AFTER INSERT OR DELETE ON public.event_supports
FOR EACH ROW EXECUTE FUNCTION public.handle_event_support_count();
