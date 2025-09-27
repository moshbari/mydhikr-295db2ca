-- Update the handle_new_user function to include email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'display_name', NEW.email);
  RETURN NEW;
END;
$$;

-- Update existing profiles with emails from current auth users
-- This needs to be done manually for existing users since we can't access auth.users directly
UPDATE public.profiles 
SET email = 'engr.mbari@gmail.com' 
WHERE user_id = 'f4a63752-8e9a-4458-8297-b6cf97dbb264';

UPDATE public.profiles 
SET email = 'user2@example.com' 
WHERE user_id = '3a2bc8f0-161d-432f-bb65-c6ef03580deb';