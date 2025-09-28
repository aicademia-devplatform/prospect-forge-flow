-- Créer une table pour les assignations de sales avec tables personnalisables
CREATE TABLE public.sales_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sales_user_id UUID NOT NULL,
  lead_email VARCHAR NOT NULL,
  source_table VARCHAR NOT NULL, -- 'apollo_contacts' ou 'crm_contacts'
  source_id VARCHAR NOT NULL, -- ID du lead dans la table source
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_by UUID,
  custom_table_name VARCHAR, -- Nom de la table personnalisée du sales
  custom_data JSONB, -- Données personnalisées ajoutées par le sales
  status VARCHAR DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Créer une table pour la configuration des colonnes personnalisées de chaque sales
CREATE TABLE public.sales_table_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sales_user_id UUID NOT NULL,
  table_name VARCHAR NOT NULL,
  column_config JSONB NOT NULL DEFAULT '[]', -- Configuration des colonnes personnalisées
  table_settings JSONB DEFAULT '{}', -- Paramètres généraux de la table
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(sales_user_id, table_name)
);

-- Enable RLS
ALTER TABLE public.sales_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_table_config ENABLE ROW LEVEL SECURITY;

-- RLS policies pour sales_assignments
CREATE POLICY "Sales can view their own assignments" 
ON public.sales_assignments 
FOR SELECT 
USING (sales_user_id = auth.uid() OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Sales can manage their own assignments" 
ON public.sales_assignments 
FOR ALL 
USING (sales_user_id = auth.uid() OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Managers and admins can create assignments" 
ON public.sales_assignments 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'sales'::app_role) OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- RLS policies pour sales_table_config
CREATE POLICY "Sales can manage their own table config" 
ON public.sales_table_config 
FOR ALL 
USING (sales_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- Triggers pour updated_at
CREATE TRIGGER update_sales_assignments_updated_at
BEFORE UPDATE ON public.sales_assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_table_config_updated_at
BEFORE UPDATE ON public.sales_table_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index pour performance
CREATE INDEX idx_sales_assignments_sales_user_id ON public.sales_assignments(sales_user_id);
CREATE INDEX idx_sales_assignments_email ON public.sales_assignments(lead_email);
CREATE INDEX idx_sales_table_config_user_table ON public.sales_table_config(sales_user_id, table_name);