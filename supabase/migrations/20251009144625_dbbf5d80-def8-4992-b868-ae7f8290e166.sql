-- Optimiser la structure de la table hubspot_contacts
-- Convertir les colonnes text en varchar avec limites appropriées et ajouter des index

-- Modifier les types de colonnes principales existantes
ALTER TABLE public.hubspot_contacts
  ALTER COLUMN email TYPE varchar(255),
  ALTER COLUMN firstname TYPE varchar(100),
  ALTER COLUMN lastname TYPE varchar(100),
  ALTER COLUMN company TYPE varchar(255),
  ALTER COLUMN jobtitle TYPE varchar(150),
  ALTER COLUMN phone TYPE varchar(50),
  ALTER COLUMN city TYPE varchar(100),
  ALTER COLUMN state TYPE varchar(100),
  ALTER COLUMN country TYPE varchar(100),
  ALTER COLUMN lifecyclestage TYPE varchar(50),
  ALTER COLUMN hs_lead_status TYPE varchar(50),
  ALTER COLUMN hs_pipeline TYPE varchar(100),
  ALTER COLUMN hs_latest_source TYPE varchar(100),
  ALTER COLUMN hs_email_domain TYPE varchar(255),
  ALTER COLUMN linkedin_account TYPE varchar(255),
  ALTER COLUMN hs_object_source TYPE varchar(100),
  ALTER COLUMN hs_object_source_id TYPE varchar(100),
  ALTER COLUMN hs_object_source_user_id TYPE varchar(100),
  ALTER COLUMN hs_sa_first_engagement_object_type TYPE varchar(100),
  ALTER COLUMN hs_calculated_phone_number TYPE varchar(50),
  ALTER COLUMN hs_calculated_phone_number_country_code TYPE varchar(10),
  ALTER COLUMN hs_searchable_calculated_phone_number TYPE varchar(50);

-- Ajouter un index unique sur email pour optimiser les recherches
CREATE UNIQUE INDEX IF NOT EXISTS idx_hubspot_contacts_email ON public.hubspot_contacts(email);

-- Ajouter des index sur les colonnes fréquemment utilisées pour les recherches et filtres
CREATE INDEX IF NOT EXISTS idx_hubspot_contacts_lastname ON public.hubspot_contacts(lastname);
CREATE INDEX IF NOT EXISTS idx_hubspot_contacts_firstname ON public.hubspot_contacts(firstname);
CREATE INDEX IF NOT EXISTS idx_hubspot_contacts_company ON public.hubspot_contacts(company);
CREATE INDEX IF NOT EXISTS idx_hubspot_contacts_inserted_at ON public.hubspot_contacts(inserted_at DESC);
CREATE INDEX IF NOT EXISTS idx_hubspot_contacts_updated_at ON public.hubspot_contacts(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_hubspot_contacts_lifecyclestage ON public.hubspot_contacts(lifecyclestage);
CREATE INDEX IF NOT EXISTS idx_hubspot_contacts_hs_lead_status ON public.hubspot_contacts(hs_lead_status);
CREATE INDEX IF NOT EXISTS idx_hubspot_contacts_hubspot_owner_id ON public.hubspot_contacts(hubspot_owner_id);

-- Ajouter un trigger pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION public.update_hubspot_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_hubspot_contacts_updated_at
BEFORE UPDATE ON public.hubspot_contacts
FOR EACH ROW
EXECUTE FUNCTION public.update_hubspot_contacts_updated_at();