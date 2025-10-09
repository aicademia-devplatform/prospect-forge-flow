-- Créer les politiques RLS pour hubspot_contacts
-- Politique pour admin - suppression
CREATE POLICY "Admin delete hubspot" 
ON public.hubspot_contacts 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Politique pour tous les rôles - insertion
CREATE POLICY "All roles insert hubspot" 
ON public.hubspot_contacts 
FOR INSERT 
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'sdr'::app_role) OR 
  has_role(auth.uid(), 'sales'::app_role) OR 
  has_role(auth.uid(), 'marketing'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Politique pour tous les rôles - mise à jour
CREATE POLICY "All roles update hubspot" 
ON public.hubspot_contacts 
FOR UPDATE 
TO authenticated
USING (
  has_role(auth.uid(), 'sdr'::app_role) OR 
  has_role(auth.uid(), 'sales'::app_role) OR 
  has_role(auth.uid(), 'marketing'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Politique pour tous les rôles - lecture
CREATE POLICY "All roles view hubspot" 
ON public.hubspot_contacts 
FOR SELECT 
TO authenticated
USING (
  has_role(auth.uid(), 'sdr'::app_role) OR 
  has_role(auth.uid(), 'sales'::app_role) OR 
  has_role(auth.uid(), 'marketing'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);