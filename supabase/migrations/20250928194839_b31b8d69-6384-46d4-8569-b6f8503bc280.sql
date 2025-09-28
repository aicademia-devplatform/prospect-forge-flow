-- Fix Function Search Path Mutable warnings by updating existing functions
-- This addresses the SUPA_function_search_path_mutable findings

-- Update the two new functions we just created to have proper search_path
CREATE OR REPLACE FUNCTION public.get_apollo_contacts_only()
RETURNS TABLE (
    id uuid,
    email character varying,
    primary_email_last_verified_at timestamp with time zone,
    nb_employees integer
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = 'public'
AS $$
    SELECT 
        a.id,
        a.email,
        a.primary_email_last_verified_at,
        a.nb_employees
    FROM apollo_contacts a
    LEFT JOIN crm_contacts c ON a.email = c.email
$$;

CREATE OR REPLACE FUNCTION public.get_contacts_crm_apollo()
RETURNS TABLE (
    crm_id bigint,
    email character varying,
    crm_firstname character varying,
    crm_name character varying,
    crm_company character varying,
    crm_city character varying,
    crm_country character varying,
    crm_mobile character varying,
    crm_linkedin_url text,
    zoho_status character varying,
    apollo_status character varying,
    arlynk_status character varying,
    aicademia_high_status character varying,
    aicademia_low_status character varying,
    total_score numeric,
    contact_active character varying,
    crm_created_at timestamp without time zone,
    crm_updated_at timestamp without time zone,
    apollo_id uuid,
    apollo_firstname character varying,
    apollo_lastname character varying,
    apollo_title character varying,
    apollo_company character varying,
    apollo_email_status character varying,
    apollo_seniority character varying,
    apollo_departments text,
    apollo_contact_owner character varying,
    apollo_account_owner character varying,
    apollo_phone character varying,
    apollo_mobile character varying,
    apollo_nb_employees integer,
    apollo_industry character varying,
    apollo_linkedin_url text,
    apollo_company_linkedin text,
    apollo_website text,
    apollo_contact_id character varying,
    apollo_account_id character varying,
    apollo_stage character varying,
    apollo_lists text,
    apollo_last_contacted timestamp with time zone,
    apollo_email_sent boolean,
    apollo_email_open boolean,
    apollo_replied boolean,
    apollo_created_at timestamp with time zone,
    apollo_updated_at timestamp with time zone,
    apollo_last_sync timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = 'public'
AS $$
    SELECT 
        c.id AS crm_id,
        c.email,
        c.firstname AS crm_firstname,
        c.name AS crm_name,
        c.company AS crm_company,
        c.city AS crm_city,
        c.country AS crm_country,
        c.mobile AS crm_mobile,
        c.linkedin_url AS crm_linkedin_url,
        c.zoho_status,
        c.apollo_status,
        c.arlynk_status,
        c.aicademia_high_status,
        c.aicademia_low_status,
        c.total_score,
        c.contact_active,
        c.created_at AS crm_created_at,
        c.updated_at AS crm_updated_at,
        a.id AS apollo_id,
        a.first_name AS apollo_firstname,
        a.last_name AS apollo_lastname,
        a.title AS apollo_title,
        a.company AS apollo_company,
        a.email_status AS apollo_email_status,
        a.seniority AS apollo_seniority,
        a.departments AS apollo_departments,
        a.contact_owner AS apollo_contact_owner,
        a.account_owner AS apollo_account_owner,
        a.work_direct_phone AS apollo_phone,
        a.mobile_phone AS apollo_mobile,
        a.nb_employees AS apollo_nb_employees,
        a.industry AS apollo_industry,
        a.person_linkedin_url AS apollo_linkedin_url,
        a.company_linkedin_url AS apollo_company_linkedin,
        a.website AS apollo_website,
        a.apollo_contact_id,
        a.apollo_account_id,
        a.stage AS apollo_stage,
        a.lists AS apollo_lists,
        a.last_contacted AS apollo_last_contacted,
        a.email_sent AS apollo_email_sent,
        a.email_open AS apollo_email_open,
        a.replied AS apollo_replied,
        a.created_at AS apollo_created_at,
        a.updated_at AS apollo_updated_at,
        a.last_sync_at AS apollo_last_sync
    FROM crm_contacts c
    JOIN apollo_contacts a ON c.email = a.email
$$;

-- Update other existing functions to have proper search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
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

CREATE OR REPLACE FUNCTION public.update_apollo_contacts_updated_at()
RETURNS trigger
LANGUAGE plpgsql
STABLE
SET search_path = 'public'
AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.last_sync_at = NOW();
    RETURN NEW;
END;
$$;