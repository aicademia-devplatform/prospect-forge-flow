-- Create prospects_a_rappeler table
CREATE TABLE IF NOT EXISTS public.prospects_a_rappeler (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sales_user_id UUID NOT NULL,
  source_table VARCHAR NOT NULL,
  source_id VARCHAR NOT NULL,
  lead_email VARCHAR NOT NULL,
  assigned_by UUID,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  callback_date TIMESTAMP WITH TIME ZONE NOT NULL,
  statut_prospect VARCHAR,
  notes_sales TEXT,
  date_action TIMESTAMP WITH TIME ZONE,
  custom_data JSONB,
  custom_table_name VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(sales_user_id, lead_email)
);

-- Enable Row Level Security
ALTER TABLE public.prospects_a_rappeler ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for prospects_a_rappeler
CREATE POLICY "Sales can view their own callback prospects"
ON public.prospects_a_rappeler
FOR SELECT
USING (
  sales_user_id = auth.uid() 
  OR has_role(auth.uid(), 'manager'::app_role) 
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Sales can create callback prospects"
ON public.prospects_a_rappeler
FOR INSERT
WITH CHECK (
  sales_user_id = auth.uid() 
  OR has_role(auth.uid(), 'manager'::app_role) 
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Sales can update their own callback prospects"
ON public.prospects_a_rappeler
FOR UPDATE
USING (
  sales_user_id = auth.uid() 
  OR has_role(auth.uid(), 'manager'::app_role) 
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Managers and admins can delete callback prospects"
ON public.prospects_a_rappeler
FOR DELETE
USING (
  has_role(auth.uid(), 'manager'::app_role) 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Create trigger for automatic updated_at update
CREATE TRIGGER update_prospects_a_rappeler_updated_at
BEFORE UPDATE ON public.prospects_a_rappeler
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_prospects_a_rappeler_sales_user ON public.prospects_a_rappeler(sales_user_id);
CREATE INDEX idx_prospects_a_rappeler_email ON public.prospects_a_rappeler(lead_email);
CREATE INDEX idx_prospects_a_rappeler_callback_date ON public.prospects_a_rappeler(callback_date);