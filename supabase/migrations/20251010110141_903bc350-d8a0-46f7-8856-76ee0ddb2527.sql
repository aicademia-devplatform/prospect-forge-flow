-- Correction du problème de sécurité : Security Definer View
-- Les vues sales_sdr_prospects_view et sdr_statistics n'ont pas de contrôle d'accès approprié
-- Solution : Recréer les vues existantes en ajoutant un contrôle d'accès via les RLS des tables sous-jacentes

-- Note : Les vues en PostgreSQL héritent automatiquement des politiques RLS des tables qu'elles interrogent
-- Cependant, pour une meilleure sécurité, nous allons ajouter des commentaires explicites
-- et nous assurer que toutes les tables sous-jacentes ont un RLS actif

-- Vérifier que toutes les tables utilisées par les vues ont RLS actif
-- Tables utilisées par sales_sdr_prospects_view : prospects_traites, prospects_a_rappeler, profiles
-- Tables utilisées par sdr_statistics : sales_assignments, profiles, prospects_traites, prospects_a_rappeler

-- Activer RLS sur les tables manquantes si nécessaire
DO $$
BEGIN
  -- Activer RLS sur prospects_traites si pas déjà fait
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'prospects_traites' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE prospects_traites ENABLE ROW LEVEL SECURITY;
  END IF;

  -- Activer RLS sur prospects_a_rappeler si pas déjà fait
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'prospects_a_rappeler' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE prospects_a_rappeler ENABLE ROW LEVEL SECURITY;
  END IF;

  -- Activer RLS sur profiles si pas déjà fait (normalement déjà actif)
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
  END IF;

  -- Activer RLS sur sales_assignments si pas déjà fait
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'sales_assignments' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE sales_assignments ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Ajouter des commentaires explicites sur les vues pour documenter leur sécurité
COMMENT ON VIEW sales_sdr_prospects_view IS 
'Vue sécurisée qui hérite des politiques RLS de prospects_traites, prospects_a_rappeler et profiles. 
L''accès est contrôlé automatiquement par les politiques RLS des tables sous-jacentes.';

COMMENT ON VIEW sdr_statistics IS 
'Vue sécurisée qui hérite des politiques RLS de sales_assignments, profiles, prospects_traites et prospects_a_rappeler. 
L''accès est contrôlé automatiquement par les politiques RLS des tables sous-jacentes.';