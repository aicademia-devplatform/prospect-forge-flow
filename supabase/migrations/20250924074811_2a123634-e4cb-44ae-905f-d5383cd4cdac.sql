-- Enable RLS on main CRM tables that will be accessed by users
ALTER TABLE public.apollo_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for apollo_contacts based on user roles
CREATE POLICY "Sales can view all apollo contacts"
ON public.apollo_contacts
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'sales') OR 
  public.has_role(auth.uid(), 'manager') OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Sales can create apollo contacts"
ON public.apollo_contacts
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'sales') OR 
  public.has_role(auth.uid(), 'manager') OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Sales can update apollo contacts"
ON public.apollo_contacts
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'sales') OR 
  public.has_role(auth.uid(), 'manager') OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Only managers and admins can delete apollo contacts"
ON public.apollo_contacts
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'manager') OR 
  public.has_role(auth.uid(), 'admin')
);

-- Create RLS policies for crm_contacts based on user roles
CREATE POLICY "Sales can view all crm contacts"
ON public.crm_contacts
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'sales') OR 
  public.has_role(auth.uid(), 'manager') OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Sales can create crm contacts"
ON public.crm_contacts
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'sales') OR 
  public.has_role(auth.uid(), 'manager') OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Sales can update crm contacts"
ON public.crm_contacts
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'sales') OR 
  public.has_role(auth.uid(), 'manager') OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Only managers and admins can delete crm contacts"
ON public.crm_contacts
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'manager') OR 
  public.has_role(auth.uid(), 'admin')
);

-- Allow profiles table to be inserted during user registration
CREATE POLICY "System can insert profiles during registration"
ON public.profiles
FOR INSERT
WITH CHECK (true);