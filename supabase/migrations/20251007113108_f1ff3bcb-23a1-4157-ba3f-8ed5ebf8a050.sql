-- Ajouter une colonne sdr_id dans prospects_traites pour identifier le SDR
ALTER TABLE public.prospects_traites 
ADD COLUMN IF NOT EXISTS sdr_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Ajouter une colonne sdr_id dans prospects_a_rappeler pour identifier le SDR  
ALTER TABLE public.prospects_a_rappeler
ADD COLUMN IF NOT EXISTS sdr_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_prospects_traites_sdr_id ON public.prospects_traites(sdr_id);
CREATE INDEX IF NOT EXISTS idx_prospects_a_rappeler_sdr_id ON public.prospects_a_rappeler(sdr_id);

-- Créer une vue pour les Sales qui affiche tous les prospects traités par les SDR avec leurs informations
CREATE OR REPLACE VIEW public.sales_sdr_prospects_view AS
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
  p.email as sdr_email,
  p.first_name as sdr_first_name,
  p.last_name as sdr_last_name,
  'traites' as prospect_type,
  pt.created_at
FROM public.prospects_traites pt
LEFT JOIN public.profiles p ON pt.sdr_id = p.id
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
  NULL as completed_at,
  pr.sdr_id,
  p.email as sdr_email,
  p.first_name as sdr_first_name,
  p.last_name as sdr_last_name,
  'rappeler' as prospect_type,
  pr.created_at
FROM public.prospects_a_rappeler pr
LEFT JOIN public.profiles p ON pr.sdr_id = p.id
WHERE pr.sdr_id IS NOT NULL;

-- Accorder les permissions de lecture sur la vue
GRANT SELECT ON public.sales_sdr_prospects_view TO authenticated;