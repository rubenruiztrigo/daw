-- =====================================================
-- ACTUALIZACIÓN TABLA MENSAJES (SHARED EVENT)
-- =====================================================

ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS shared_event_id uuid REFERENCES public.user_events(id) ON DELETE SET NULL;
