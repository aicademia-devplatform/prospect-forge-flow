-- Ajouter un champ is_active à la table profiles
ALTER TABLE public.profiles 
ADD COLUMN is_active boolean NOT NULL DEFAULT true;

-- Créer un index pour améliorer les performances des requêtes sur le statut
CREATE INDEX idx_profiles_is_active ON public.profiles(is_active);

-- Politique RLS pour permettre aux admins de mettre à jour le statut
CREATE POLICY "Admins can update user status"
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));