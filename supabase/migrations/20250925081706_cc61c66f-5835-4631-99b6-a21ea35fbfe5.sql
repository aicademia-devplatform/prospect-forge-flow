-- Activer les publications en temps réel pour la table crm_contacts
ALTER TABLE crm_contacts REPLICA IDENTITY FULL;

-- Ajouter la table à la publication supabase_realtime
ALTER PUBLICATION supabase_realtime ADD TABLE crm_contacts;

-- Activer aussi pour apollo_contacts si nécessaire
ALTER TABLE apollo_contacts REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE apollo_contacts;