-- Supprimer d'abord la vue existante
DROP VIEW IF EXISTS public.sdr_statistics;

-- Ajouter la colonne manager_id à sales_assignments
ALTER TABLE sales_assignments 
ADD COLUMN IF NOT EXISTS manager_id uuid REFERENCES auth.users(id);

-- Mettre à jour les assignations existantes avec le manager (celui qui a assigné)
UPDATE sales_assignments 
SET manager_id = assigned_by 
WHERE manager_id IS NULL AND assigned_by IS NOT NULL;

-- Créer la vue sdr_statistics pour les statistiques de l'équipe SDR
CREATE VIEW public.sdr_statistics AS
SELECT 
  sa.sales_user_id as sdr_id,
  p.email as sdr_email,
  p.first_name,
  p.last_name,
  sa.manager_id,
  COUNT(DISTINCT sa.id) as total_assigned_prospects,
  COUNT(DISTINCT CASE 
    WHEN pt.created_at::date = CURRENT_DATE 
    THEN pt.id 
  END) as prospects_contacted_today,
  COUNT(DISTINCT pt.id) as prospects_validated,
  GREATEST(
    MAX(sa.assigned_at),
    MAX(pt.created_at),
    MAX(pr.created_at)
  ) as last_activity
FROM sales_assignments sa
LEFT JOIN profiles p ON p.id = sa.sales_user_id
LEFT JOIN prospects_traites pt ON pt.sdr_id = sa.sales_user_id
LEFT JOIN prospects_a_rappeler pr ON pr.sdr_id = sa.sales_user_id
WHERE sa.status = 'active'
GROUP BY sa.sales_user_id, p.email, p.first_name, p.last_name, sa.manager_id;