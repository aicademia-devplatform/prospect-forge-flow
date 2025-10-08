-- Table pour les prospects validés avec rendez-vous
CREATE TABLE public.prospects_valides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_traite_id UUID NOT NULL,
  sales_user_id UUID NOT NULL,
  sdr_id UUID NOT NULL,
  source_table VARCHAR NOT NULL,
  source_id VARCHAR NOT NULL,
  lead_email VARCHAR NOT NULL,
  custom_table_name VARCHAR,
  custom_data JSONB,
  assigned_by UUID,
  assigned_at TIMESTAMPTZ,
  notes_sales TEXT,
  statut_prospect VARCHAR,
  date_action TIMESTAMPTZ,
  commentaire_validation TEXT,
  rdv_date TIMESTAMPTZ NOT NULL,
  rdv_notes TEXT,
  validated_by UUID NOT NULL,
  validated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table pour les prospects rejetés/archivés
CREATE TABLE public.prospects_archives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_traite_id UUID,
  sales_user_id UUID NOT NULL,
  sdr_id UUID,
  source_table VARCHAR NOT NULL,
  source_id VARCHAR NOT NULL,
  lead_email VARCHAR NOT NULL,
  custom_table_name VARCHAR,
  custom_data JSONB,
  assigned_by UUID,
  assigned_at TIMESTAMPTZ,
  notes_sales TEXT,
  statut_prospect VARCHAR,
  date_action TIMESTAMPTZ,
  commentaire_rejet TEXT NOT NULL,
  raison_rejet VARCHAR,
  rejected_by UUID NOT NULL,
  rejected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.prospects_valides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospects_archives ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour prospects_valides
CREATE POLICY "Sales and higher can view validated prospects"
  ON public.prospects_valides FOR SELECT
  USING (
    has_role(auth.uid(), 'sales'::app_role) OR
    has_role(auth.uid(), 'marketing'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Sales and higher can insert validated prospects"
  ON public.prospects_valides FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'sales'::app_role) OR
    has_role(auth.uid(), 'marketing'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Sales and higher can update validated prospects"
  ON public.prospects_valides FOR UPDATE
  USING (
    has_role(auth.uid(), 'sales'::app_role) OR
    has_role(auth.uid(), 'marketing'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role)
  );

-- RLS Policies pour prospects_archives
CREATE POLICY "Sales and higher can view archived prospects"
  ON public.prospects_archives FOR SELECT
  USING (
    has_role(auth.uid(), 'sales'::app_role) OR
    has_role(auth.uid(), 'marketing'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Sales and higher can insert archived prospects"
  ON public.prospects_archives FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'sales'::app_role) OR
    has_role(auth.uid(), 'marketing'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Sales and higher can update archived prospects"
  ON public.prospects_archives FOR UPDATE
  USING (
    has_role(auth.uid(), 'sales'::app_role) OR
    has_role(auth.uid(), 'marketing'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Index pour performance
CREATE INDEX idx_prospects_valides_sales_user ON public.prospects_valides(sales_user_id);
CREATE INDEX idx_prospects_valides_email ON public.prospects_valides(lead_email);
CREATE INDEX idx_prospects_valides_rdv_date ON public.prospects_valides(rdv_date);
CREATE INDEX idx_prospects_archives_sales_user ON public.prospects_archives(sales_user_id);
CREATE INDEX idx_prospects_archives_email ON public.prospects_archives(lead_email);