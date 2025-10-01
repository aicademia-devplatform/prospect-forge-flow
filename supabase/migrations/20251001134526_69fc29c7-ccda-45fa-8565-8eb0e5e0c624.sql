-- Mettre à jour les politiques pour les profiles
-- Permettre aux managers de voir tous les profils
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins and managers can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Permettre aux managers de mettre à jour les profils
DROP POLICY IF EXISTS "Admins can update user status" ON public.profiles;
CREATE POLICY "Admins and managers can update profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Seuls les admins peuvent supprimer des profils
CREATE POLICY "Only admins can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Mettre à jour les politiques pour user_roles
-- Permettre aux managers de voir tous les rôles
DROP POLICY IF EXISTS "Admins can view all user roles" ON public.user_roles;
CREATE POLICY "Admins and managers can view all user roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Permettre aux managers de créer et modifier des rôles
DROP POLICY IF EXISTS "Admins can create user roles" ON public.user_roles;
CREATE POLICY "Admins and managers can create user roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

DROP POLICY IF EXISTS "Admins can update user roles" ON public.user_roles;
CREATE POLICY "Admins and managers can update user roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Seuls les admins peuvent supprimer des rôles
CREATE POLICY "Only admins can delete user roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Mettre à jour les politiques pour apollo_contacts et crm_contacts
-- Seuls les admins peuvent supprimer (modifier les policies existantes)
DROP POLICY IF EXISTS "Only managers and admins can delete apollo contacts" ON public.apollo_contacts;
CREATE POLICY "Only admins can delete apollo contacts"
ON public.apollo_contacts
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Only managers and admins can delete crm contacts" ON public.crm_contacts;
CREATE POLICY "Only admins can delete crm contacts"
ON public.crm_contacts
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Ajouter une politique pour permettre aux managers de voir l'historique d'import
DROP POLICY IF EXISTS "Sales can view their own imports" ON public.import_history;
CREATE POLICY "Users can view imports based on role"
ON public.import_history
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR 
  has_role(auth.uid(), 'manager'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);