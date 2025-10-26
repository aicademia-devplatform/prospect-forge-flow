-- Mettre à jour la fonction handle_new_user pour gérer correctement Google OAuth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, avatar_url)
  VALUES (
    NEW.id, 
    NEW.email,
    -- Essayer d'abord 'first_name' (email signup), sinon 'given_name' (Google)
    COALESCE(
      NEW.raw_user_meta_data->>'first_name',
      NEW.raw_user_meta_data->>'given_name',
      split_part(NEW.raw_user_meta_data->>'full_name', ' ', 1)
    ),
    -- Essayer d'abord 'last_name' (email signup), sinon 'family_name' (Google)
    COALESCE(
      NEW.raw_user_meta_data->>'last_name',
      NEW.raw_user_meta_data->>'family_name',
      split_part(NEW.raw_user_meta_data->>'full_name', ' ', 2)
    ),
    -- Avatar URL (Google ou autre)
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture'
    )
  );
  
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'sdr');
  RETURN NEW;
END;
$$;