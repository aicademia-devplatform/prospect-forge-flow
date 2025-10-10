-- Correction du problème de sécurité : Security Definer View
-- Solution : Recréer les vues avec SECURITY INVOKER pour qu'elles respectent les politiques RLS de l'utilisateur

-- 1. Supprimer et recréer sales_sdr_prospects_view avec security_invoker=on
DROP VIEW IF EXISTS sales_sdr_prospects_view CASCADE;

CREATE VIEW sales_sdr_prospects_view 
WITH (security_invoker=on)
AS
SELECT 
  pt.id,
  pt.lead_email,
  pt.source_table,
  pt.source_id,
  pt.sales_user_id,
  pt.notes_sales,
  pt.statut_prospect,
  pt.date_action,
  pt.completed_at,
  pt.sdr_id,
  p.email AS sdr_email,
  p.first_name AS sdr_first_name,
  p.last_name AS sdr_last_name,
  'traites'::text AS prospect_type,
  pt.created_at
FROM prospects_traites pt
LEFT JOIN profiles p ON pt.sdr_id = p.id
WHERE pt.sdr_id IS NOT NULL

UNION ALL

SELECT 
  pr.id,
  pr.lead_email,
  pr.source_table,
  pr.source_id,
  pr.sales_user_id,
  pr.notes_sales,
  pr.statut_prospect,
  pr.date_action,
  NULL::timestamp with time zone AS completed_at,
  pr.sdr_id,
  p.email AS sdr_email,
  p.first_name AS sdr_first_name,
  p.last_name AS sdr_last_name,
  'rappeler'::text AS prospect_type,
  pr.created_at
FROM prospects_a_rappeler pr
LEFT JOIN profiles p ON pr.sdr_id = p.id
WHERE pr.sdr_id IS NOT NULL;

-- Ajouter un commentaire
COMMENT ON VIEW sales_sdr_prospects_view IS 
'Vue sécurisée avec SECURITY INVOKER qui respecte les politiques RLS de l''utilisateur qui interroge la vue.';

-- 2. Supprimer et recréer sdr_statistics avec security_invoker=on
DROP VIEW IF EXISTS sdr_statistics CASCADE;

CREATE VIEW sdr_statistics
WITH (security_invoker=on)
AS
SELECT 
  sa.sales_user_id AS sdr_id,
  p.email AS sdr_email,
  p.first_name,
  p.last_name,
  sa.manager_id,
  count(DISTINCT sa.id) AS total_assigned_prospects,
  count(DISTINCT
    CASE
      WHEN (pt.created_at)::date = CURRENT_DATE THEN pt.id
      ELSE NULL::uuid
    END) AS prospects_contacted_today,
  count(DISTINCT pt.id) AS prospects_validated,
  GREATEST(max(sa.assigned_at), max(pt.created_at), max(pr.created_at)) AS last_activity
FROM sales_assignments sa
LEFT JOIN profiles p ON p.id = sa.sales_user_id
LEFT JOIN prospects_traites pt ON pt.sdr_id = sa.sales_user_id
LEFT JOIN prospects_a_rappeler pr ON pr.sdr_id = sa.sales_user_id
WHERE sa.status = 'active'
GROUP BY sa.sales_user_id, p.email, p.first_name, p.last_name, sa.manager_id;

-- Ajouter un commentaire
COMMENT ON VIEW sdr_statistics IS 
'Vue sécurisée avec SECURITY INVOKER qui respecte les politiques RLS de l''utilisateur qui interroge la vue.';