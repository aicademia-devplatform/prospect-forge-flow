-- Créer la table pour suivre les modifications des prospects
CREATE TABLE IF NOT EXISTS public.prospect_modifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_email VARCHAR NOT NULL,
  modified_by UUID NOT NULL,
  modified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  modified_fields JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE public.prospect_modifications ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux sales de voir leurs modifications et celles des autres
CREATE POLICY "Sales can view all modifications"
ON public.prospect_modifications
FOR SELECT
USING (
  has_role(auth.uid(), 'sales'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Politique pour permettre aux sales de créer des modifications
CREATE POLICY "Sales can create modifications"
ON public.prospect_modifications
FOR INSERT
WITH CHECK (
  modified_by = auth.uid() OR
  has_role(auth.uid(), 'manager'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Index pour améliorer les performances
CREATE INDEX idx_prospect_modifications_email ON public.prospect_modifications(lead_email);
CREATE INDEX idx_prospect_modifications_modified_by ON public.prospect_modifications(modified_by);
CREATE INDEX idx_prospect_modifications_modified_at ON public.prospect_modifications(modified_at DESC);