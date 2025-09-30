-- Create a separate table for processed prospects (traités)
CREATE TABLE public.prospects_traites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_assignment_id UUID NOT NULL,
  sales_user_id UUID NOT NULL,
  source_table CHARACTER VARYING NOT NULL,
  source_id CHARACTER VARYING NOT NULL,
  lead_email CHARACTER VARYING NOT NULL,
  custom_table_name CHARACTER VARYING,
  custom_data JSONB,
  assigned_by UUID,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes_sales TEXT,
  statut_prospect CHARACTER VARYING,
  date_action TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.prospects_traites ENABLE ROW LEVEL SECURITY;

-- Create policies for prospects_traites
CREATE POLICY "Sales can view their own processed prospects" 
ON public.prospects_traites 
FOR SELECT 
USING (sales_user_id = auth.uid() OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Sales can create processed prospects" 
ON public.prospects_traites 
FOR INSERT 
WITH CHECK (sales_user_id = auth.uid() OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Sales can update their own processed prospects" 
ON public.prospects_traites 
FOR UPDATE 
USING (sales_user_id = auth.uid() OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Managers and admins can delete processed prospects" 
ON public.prospects_traites 
FOR DELETE 
USING (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_prospects_traites_updated_at
BEFORE UPDATE ON public.prospects_traites
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Remove boucle column from sales_assignments since we're using separate tables
ALTER TABLE public.sales_assignments DROP COLUMN IF EXISTS boucle;