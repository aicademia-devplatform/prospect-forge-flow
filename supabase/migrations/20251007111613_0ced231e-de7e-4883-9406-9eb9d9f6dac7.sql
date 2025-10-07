-- Ajouter une colonne manager_id dans user_roles pour la hiérarchie
ALTER TABLE public.user_roles
ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Ajouter un index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_user_roles_manager_id ON public.user_roles(manager_id);

-- Créer une vue pour les statistiques des SDR par manager
CREATE OR REPLACE VIEW public.sdr_statistics AS
SELECT 
  ur.manager_id,
  ur.user_id as sdr_id,
  p.email as sdr_email,
  p.first_name,
  p.last_name,
  -- Prospects assignés au total
  COUNT(DISTINCT sa.id) as total_assigned_prospects,
  -- Prospects contactés aujourd'hui
  COUNT(DISTINCT CASE 
    WHEN pm.created_at::date = CURRENT_DATE 
    THEN pm.lead_email 
  END) as prospects_contacted_today,
  -- Prospects traités (validés)
  COUNT(DISTINCT pt.id) as prospects_validated,
  -- Dernière activité
  MAX(pm.created_at) as last_activity
FROM public.user_roles ur
JOIN public.profiles p ON p.id = ur.user_id
LEFT JOIN public.sales_assignments sa ON sa.sales_user_id = ur.user_id
LEFT JOIN public.prospects_traites pt ON pt.lead_email = sa.lead_email AND pt.sales_user_id = ur.user_id
LEFT JOIN public.prospect_modifications pm ON pm.modified_by = ur.user_id
WHERE ur.role = 'sdr'
GROUP BY ur.manager_id, ur.user_id, p.email, p.first_name, p.last_name;

-- Créer une fonction pour obtenir les statistiques d'un manager
CREATE OR REPLACE FUNCTION public.get_manager_team_stats(manager_user_id UUID)
RETURNS TABLE (
  sdr_id UUID,
  sdr_email TEXT,
  sdr_name TEXT,
  total_assigned_prospects BIGINT,
  prospects_contacted_today BIGINT,
  prospects_validated BIGINT,
  last_activity TIMESTAMP WITH TIME ZONE
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    sdr_id,
    sdr_email,
    COALESCE(first_name || ' ' || last_name, sdr_email) as sdr_name,
    total_assigned_prospects,
    prospects_contacted_today,
    prospects_validated,
    last_activity
  FROM public.sdr_statistics
  WHERE manager_id = manager_user_id
  ORDER BY last_activity DESC NULLS LAST;
$$;

-- Mettre à jour la fonction d'invitation pour inclure le manager_id
CREATE OR REPLACE FUNCTION public.assign_manager_to_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Si l'utilisateur qui assigne (assigned_by) est un sales, définir comme manager
  IF NEW.assigned_by IS NOT NULL THEN
    DECLARE
      assigner_role app_role;
    BEGIN
      SELECT role INTO assigner_role
      FROM public.user_roles
      WHERE user_id = NEW.assigned_by;
      
      IF assigner_role IN ('sales', 'marketing', 'admin') THEN
        NEW.manager_id := NEW.assigned_by;
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Créer un trigger pour assigner automatiquement le manager
DROP TRIGGER IF EXISTS set_manager_on_role_assignment ON public.user_roles;
CREATE TRIGGER set_manager_on_role_assignment
  BEFORE INSERT ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_manager_to_new_user();