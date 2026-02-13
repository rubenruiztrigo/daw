-- Function to handle new user approval
CREATE OR REPLACE FUNCTION public.handle_new_user_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if status changed from 'pending' to 'active'
  IF OLD.status = 'pending' AND NEW.status = 'active' THEN
    INSERT INTO public.notifications (user_id, type, content, is_read, sender_id)
    VALUES (NEW.id, 'system', 'Has sido aceptado en la red social', FALSE, NULL);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists to avoid duplication errors
DROP TRIGGER IF EXISTS on_profile_approved ON public.profiles;

-- Create the trigger
CREATE TRIGGER on_profile_approved
AFTER UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_approval();
