-- This migration ensures the user profile creation function and trigger are present.

-- Function: create_profile_for_new_user
-- This function needs SECURITY DEFINER because it operates on auth.users and inserts into public.profiles
-- when a new user signs up (who has no privileges yet).
CREATE OR REPLACE FUNCTION public.create_profile_for_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public -- Ensure the function works in the public schema
AS $$
BEGIN
  INSERT INTO public.profiles (auth_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

-- Trigger: on_auth_user_created
-- This trigger calls the function after a new user is inserted into auth.users.
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.create_profile_for_new_user();