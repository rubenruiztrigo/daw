-- Create a secure function to handle registration requests
-- This function runs with SECURITY DEFINER privileges to bypass RLS, 
-- allowing any admin to update the notifications of ALL admins.

CREATE OR REPLACE FUNCTION resolve_registration_request(
  target_user_id UUID,
  request_status TEXT -- 'active' or 'rejected'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_content TEXT;
  target_name TEXT;
  target_lastname TEXT;
  full_name TEXT;
  v_is_admin BOOLEAN;
BEGIN
  -- 1. Verify the caller is an admin
  SELECT is_admin INTO v_is_admin
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_is_admin IS NOT TRUE THEN
    RAISE EXCEPTION 'Acess denied: Only admins can perform this action';
  END IF;

  -- 2. Get target user details
  SELECT name, last_name INTO target_name, target_lastname
  FROM public.profiles
  WHERE id = target_user_id;
  
  -- Construct name (handle nulls)
  full_name := TRIM(CONCAT(target_name, ' ', COALESCE(target_lastname, '')));
  IF full_name = '' OR full_name IS NULL THEN
    full_name := 'Usuario';
  END IF;

  -- 3. Determine new content message
  IF request_status = 'active' THEN
    new_content := 'Solicitud de ' || full_name || ' aceptada';
  ELSIF request_status = 'rejected' THEN
    new_content := 'Solicitud de ' || full_name || ' rechazada';
  ELSE
    RAISE EXCEPTION 'Invalid status: %', request_status;
  END IF;

  -- 4. Update Profile Status
  UPDATE public.profiles
  SET status = request_status
  WHERE id = target_user_id;

  -- 5. Update ALL Notifications for this request (Global update)
  UPDATE public.notifications
  SET 
    content = new_content,
    is_read = true,
    type = 'system'
  WHERE sender_id = target_user_id 
  AND type = 'registration_request';
  
END;
$$;
