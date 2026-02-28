
-- Create a secure function to look up email by username for login
CREATE OR REPLACE FUNCTION public.get_email_by_username(_username text)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT email FROM public.profiles WHERE username = _username LIMIT 1;
$$;
