-- Migration: Créer la vue matérialisée enrichie unified_crm_detailed_view
-- Cette vue agrège les données de crm_contacts, hubspot_contacts et apollo_contacts
-- pour une vue 360° des prospects avec tous leurs détails

-- Supprimer la vue si elle existe déjà
DROP MATERIALIZED VIEW IF EXISTS unified_crm_detailed_view CASCADE;

-- Créer la vue matérialisée enrichie
CREATE MATERIALIZED VIEW unified_crm_detailed_view AS
WITH base_emails AS (
  -- Tous les emails uniques de toutes les sources
  SELECT DISTINCT email
  FROM (
    SELECT email FROM crm_contacts WHERE email IS NOT NULL
    UNION
    SELECT email FROM hubspot_contacts WHERE email IS NOT NULL
    UNION
    SELECT email FROM apollo_contacts WHERE email IS NOT NULL
  ) all_emails
),
crm_agg AS (
  -- Agrégation des données CRM
  SELECT 
    email,
    MAX(id) as crm_id,
    MAX(firstname) as crm_firstname,
    MAX(name) as crm_name,
    MAX(company) as crm_company,
    MAX(mobile) as crm_mobile,
    MAX(tel) as crm_tel,
    MAX(linkedin_url) as crm_linkedin_url,
    MAX(city) as crm_city,
    MAX(country) as crm_country,
    MAX(industrie) as crm_industrie,
    MAX(company_website) as crm_website,
    MAX(nb_employees) as crm_nb_employees,
    MAX(data_section) as data_section,
    MAX(contact_active) as contact_active,
    MAX(zoho_status) as zoho_status,
    MAX(zoho_tag) as zoho_tag,
    MAX(apollo_status) as apollo_status,
    MAX(created_at) as crm_created_at,
    MAX(updated_at) as crm_updated_at,
    jsonb_agg(to_jsonb(crm_contacts.*)) FILTER (WHERE crm_contacts.email IS NOT NULL) as crm_data
  FROM crm_contacts
  GROUP BY email
),
hubspot_agg AS (
  -- Agrégation des données HubSpot
  SELECT 
    email,
    MAX(id) as hubspot_id,
    MAX(firstname) as hubspot_firstname,
    MAX(lastname) as hubspot_lastname,
    MAX(company) as hubspot_company,
    MAX(lifecyclestage) as lifecyclestage,
    MAX(hs_lead_status) as hs_lead_status,
    MAX(phone) as hubspot_phone,
    MAX(inserted_at) as hubspot_inserted_at,
    jsonb_agg(to_jsonb(hubspot_contacts.*)) FILTER (WHERE hubspot_contacts.email IS NOT NULL) as hubspot_data
  FROM hubspot_contacts
  GROUP BY email
),
apollo_agg AS (
  -- Agrégation des données Apollo
  SELECT 
    email,
    (array_agg(id))[1] as apollo_id,
    MAX(first_name) as apollo_firstname,
    MAX(last_name) as apollo_lastname,
    MAX(company) as apollo_company,
    MAX(email_status) as email_status,
    MAX(stage) as apollo_stage,
    MAX(work_direct_phone) as apollo_phone,
    MAX(person_linkedin_url) as apollo_linkedin_url,
    MAX(city) as apollo_city,
    MAX(country) as apollo_country,
    MAX(industry) as apollo_industry,
    MAX(website) as apollo_website,
    MAX(nb_employees) as apollo_nb_employees,
    MAX(created_at) as apollo_inserted_at,
    jsonb_agg(to_jsonb(apollo_contacts.*)) FILTER (WHERE apollo_contacts.email IS NOT NULL) as apollo_data
  FROM apollo_contacts
  GROUP BY email
)
SELECT 
  -- Email unique (clé primaire)
  base_emails.email,
  
  -- Indicateurs de présence dans chaque source
  (crm_agg.email IS NOT NULL) as has_crm,
  (hubspot_agg.email IS NOT NULL) as has_hubspot,
  (apollo_agg.email IS NOT NULL) as has_apollo,
  
  -- Nombre de sources
  CASE 
    WHEN crm_agg.email IS NOT NULL THEN 1 ELSE 0 
  END + 
  CASE 
    WHEN hubspot_agg.email IS NOT NULL THEN 1 ELSE 0 
  END + 
  CASE 
    WHEN apollo_agg.email IS NOT NULL THEN 1 ELSE 0 
  END as source_count,
  
  -- Champs communs priorisés (CRM > HubSpot > Apollo)
  COALESCE(crm_agg.crm_firstname, hubspot_agg.hubspot_firstname, apollo_agg.apollo_firstname) as firstname,
  COALESCE(crm_agg.crm_name, hubspot_agg.hubspot_lastname, apollo_agg.apollo_lastname) as lastname,
  COALESCE(crm_agg.crm_company, hubspot_agg.hubspot_company, apollo_agg.apollo_company) as company,
  COALESCE(crm_agg.crm_mobile, crm_agg.crm_tel, hubspot_agg.hubspot_phone, apollo_agg.apollo_phone) as phone,
  COALESCE(crm_agg.crm_linkedin_url, apollo_agg.apollo_linkedin_url) as linkedin_url,
  COALESCE(crm_agg.crm_city, apollo_agg.apollo_city) as city,
  COALESCE(crm_agg.crm_country, apollo_agg.apollo_country) as country,
  COALESCE(crm_agg.crm_industrie, apollo_agg.apollo_industry) as industrie,
  COALESCE(crm_agg.crm_website, apollo_agg.apollo_website) as website,
  COALESCE(crm_agg.crm_nb_employees, apollo_agg.apollo_nb_employees::text) as nb_employees,
  
  -- IDs de chaque source
  crm_agg.crm_id,
  hubspot_agg.hubspot_id,
  apollo_agg.apollo_id,
  
  -- Statuts extraits
  crm_agg.data_section,
  crm_agg.contact_active,
  crm_agg.zoho_status,
  crm_agg.zoho_tag,
  crm_agg.apollo_status,
  hubspot_agg.lifecyclestage,
  hubspot_agg.hs_lead_status,
  apollo_agg.email_status,
  apollo_agg.apollo_stage,
  
  -- Date de dernière mise à jour (la plus récente)
  GREATEST(
    COALESCE(crm_agg.crm_updated_at, '1970-01-01'::timestamp),
    COALESCE(hubspot_agg.hubspot_inserted_at, '1970-01-01'::timestamp),
    COALESCE(apollo_agg.apollo_inserted_at, '1970-01-01'::timestamp)
  ) as last_updated,
  
  -- Données JSONB complètes de chaque source
  crm_agg.crm_data,
  hubspot_agg.hubspot_data,
  apollo_agg.apollo_data
  
FROM base_emails
LEFT JOIN crm_agg ON base_emails.email = crm_agg.email
LEFT JOIN hubspot_agg ON base_emails.email = hubspot_agg.email
LEFT JOIN apollo_agg ON base_emails.email = apollo_agg.email;

-- Créer un index unique sur email pour améliorer les performances
CREATE UNIQUE INDEX idx_unified_crm_detailed_view_email ON unified_crm_detailed_view(email);

-- Créer des index sur les colonnes fréquemment filtrées
CREATE INDEX idx_unified_crm_detailed_view_has_crm ON unified_crm_detailed_view(has_crm);
CREATE INDEX idx_unified_crm_detailed_view_has_hubspot ON unified_crm_detailed_view(has_hubspot);
CREATE INDEX idx_unified_crm_detailed_view_has_apollo ON unified_crm_detailed_view(has_apollo);
CREATE INDEX idx_unified_crm_detailed_view_source_count ON unified_crm_detailed_view(source_count);
CREATE INDEX idx_unified_crm_detailed_view_last_updated ON unified_crm_detailed_view(last_updated);
CREATE INDEX idx_unified_crm_detailed_view_company ON unified_crm_detailed_view(company);
CREATE INDEX idx_unified_crm_detailed_view_data_section ON unified_crm_detailed_view(data_section);
CREATE INDEX idx_unified_crm_detailed_view_zoho_status ON unified_crm_detailed_view(zoho_status);
CREATE INDEX idx_unified_crm_detailed_view_lifecyclestage ON unified_crm_detailed_view(lifecyclestage);

-- Créer un index GIN sur les colonnes JSONB pour recherche rapide
CREATE INDEX idx_unified_crm_detailed_view_crm_data_gin ON unified_crm_detailed_view USING gin(crm_data);
CREATE INDEX idx_unified_crm_detailed_view_hubspot_data_gin ON unified_crm_detailed_view USING gin(hubspot_data);
CREATE INDEX idx_unified_crm_detailed_view_apollo_data_gin ON unified_crm_detailed_view USING gin(apollo_data);

-- Fonction pour rafraîchir la vue matérialisée
CREATE OR REPLACE FUNCTION refresh_unified_crm_detailed_view()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY unified_crm_detailed_view;
END;
$$;

-- Commentaire sur la vue
COMMENT ON MATERIALIZED VIEW unified_crm_detailed_view IS 
'Vue matérialisée enrichie pour une vue 360° des prospects. 
Agrège les données de crm_contacts, hubspot_contacts et apollo_contacts avec priorisation des données CRM.
Doit être rafraîchie périodiquement via refresh_unified_crm_detailed_view().';

