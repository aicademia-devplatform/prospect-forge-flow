-- Fix remaining Function Search Path Mutable warnings
-- Update the remaining functions to have proper search_path

CREATE OR REPLACE FUNCTION public.update_updated_at_profiles()
RETURNS trigger
LANGUAGE plpgsql
STABLE
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.link_apollo_with_crm()
RETURNS trigger
LANGUAGE plpgsql
STABLE
SET search_path = 'public'
AS $$
BEGIN
    -- Vérifier que le contact CRM existe (liaison par email uniquement)
    IF NOT EXISTS (SELECT 1 FROM crm_contacts WHERE email = NEW.email) THEN
        RAISE NOTICE 'Contact CRM non trouvé pour l''email: %', NEW.email;
    END IF;
    
    RETURN NEW;
END;
$$;