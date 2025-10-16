<!-- 544d8de1-60ee-4eaf-9a68-b81981389967 59f26e22-d6b4-4088-99d4-4b66dda9cce9 -->
# Plan: Transformer /datasources/crm_contacts en Vue Unifiée 360°

## Objectif

Remplacer la vue actuelle de `/datasources/crm_contacts` par une vue unifiée qui affiche les **22,239 prospects** agrégés depuis CRM, HubSpot et Apollo, avec filtres avancés, colonnes configurables et édition inline.

## 1. Créer un hook unifié pour CRM 360°

**Fichier**: `src/hooks/useUnifiedCRMData.ts`

Nouveau hook qui :

- Interroge `unified_prospects_view` (vue SQL matérialisée)
- Supporte la pagination serveur
- Gère les filtres multiples :
  - **Filtres par source** : CRM, HubSpot, Apollo (checkboxes)
  - **Filtres par statut CRM** : zoho_status, apollo_status, data_section
  - **Filtres par statut HubSpot** : lifecyclestage, hs_lead_status, hs_pipeline
  - **Filtres par statut Apollo** : email_status, stage, lists
  - **Filtres avancés** : date range, company, industry, nb_employees
- Recherche full-text sur email, nom, prénom, company
- Tri par toutes les colonnes
- Retourne les métadonnées de source (has_crm, has_hubspot, has_apollo)

## 2. Étendre la vue SQL avec données détaillées

**Migration SQL** : Créer une vue enrichie `unified_crm_detailed_view`

La vue actuelle `unified_prospects_view` contient uniquement les champs communs. Il faut :

- Ajouter un JSONB `crm_data` avec toutes les colonnes de `crm_contacts`
- Ajouter un JSONB `hubspot_data` avec toutes les colonnes de `hubspot_contacts`
- Ajouter un JSONB `apollo_data` avec toutes les colonnes de `apollo_contacts`
- Extraire les statuts clés en colonnes indexées :
  - `zoho_status`, `apollo_status`, `data_section` (depuis CRM)
  - `lifecyclestage`, `hs_lead_status` (depuis HubSpot)
  - `email_status`, `stage` (depuis Apollo)

Cela permettra :

- Filtrage rapide par statut (colonnes indexées)
- Accès aux données brutes pour l'édition inline (JSONB)
- Colonnes configurables selon la source

## 3. Modifier DataSourceTable pour utiliser la vue unifiée

**Fichier**: `src/pages/DataSourceTable.tsx`

Modifications :

- Détecter si `tableName === 'crm_contacts'`
- Si oui, utiliser le nouveau hook `useUnifiedCRMData` au lieu de `useTableData`
- Passer un paramètre `isUnifiedView={true}` à `TableView`

## 4. Adapter TableView pour la vue unifiée

**Fichier**: `src/components/TableView.tsx`

Ajouts pour le mode unifié :

- **Nouveaux filtres dans TableFilters** :
  - Section "Sources de données" avec checkboxes (CRM, HubSpot, Apollo)
  - Section "Statuts CRM" (zoho_status, apollo_status, data_section)
  - Section "Statuts HubSpot" (lifecyclestage, hs_lead_status)
  - Section "Statuts Apollo" (email_status, stage)
- **Badges visuels de source** :
  - Dans chaque ligne, afficher des petits badges colorés (CRM/HS/AP)
  - Position : à côté de l'email
- **Colonnes configurables par source** :
  - Bouton "Configurer colonnes" qui ouvre un dialog
  - 3 onglets : CRM, HubSpot, Apollo
  - Cocher les colonnes à afficher par source
  - Sauvegarder la config dans localStorage
- **Édition inline intelligente** :
  - Si la donnée vient de CRM → éditable, sauvegarde dans `crm_contacts`
  - Si la donnée vient de HubSpot ou Apollo → lecture seule avec tooltip "Géré par [source]"
  - Afficher un petit indicateur visuel (icône) de la source prioritaire

## 5. Créer le composant de filtres avancés

**Fichier**: `src/components/UnifiedCRMFilters.tsx`

Nouveau composant de filtres avec :

- **Section Sources** : Checkboxes CRM/HubSpot/Apollo
- **Section Statuts CRM** : Selects pour zoho_status, apollo_status, data_section
- **Section Statuts HubSpot** : Selects pour lifecyclestage, hs_lead_status
- **Section Statuts Apollo** : Selects pour email_status, stage
- **Section Entreprise** : Filtres company, industry, nb_employees (range)
- **Section Dates** : Date range picker pour last_updated
- Bouton "Réinitialiser" pour clear tous les filtres
- Compteur de filtres actifs

## 6. Adapter l'édition inline pour multi-sources

**Modifications dans TableView.tsx** :

Logique d'édition :

1. Identifier la source de la donnée affichée (via priorité CRM > HubSpot > Apollo)
2. Si source = CRM et utilisateur a les droits → éditable
3. Si source = HubSpot ou Apollo → afficher tooltip "Cette donnée provient de [source] et ne peut être modifiée ici"
4. Lors de la sauvegarde :

   - Récupérer l'ID du contact dans `crm_contacts` (via jointure)
   - Mettre à jour uniquement la table `crm_contacts`
   - Rafraîchir la vue matérialisée (optionnel, ou attendre le refresh automatique)

## 7. Créer un système de colonnes dynamiques

**Fichier**: `src/components/ColumnConfigurator.tsx`

Dialog pour configurer les colonnes :

- 3 onglets : Colonnes CRM, Colonnes HubSpot, Colonnes Apollo
- Chaque onglet liste toutes les colonnes disponibles de la source
- Checkboxes pour activer/désactiver
- Drag & drop pour réordonner
- Bouton "Réinitialiser" pour config par défaut
- Sauvegarder dans localStorage : `unified_crm_columns_config`

Format de config :

```typescript
{
  crm: ['email', 'firstname', 'company', 'zoho_status', ...],
  hubspot: ['lifecyclestage', 'hs_lead_status', ...],
  apollo: ['email_status', 'stage', ...]
}
```

## 8. Optimiser les performances

- **Index SQL** : Ajouter des index sur les colonnes de statut dans la vue
- **Cache React Query** : 1 minute de staleTime pour les données, 5 minutes pour les stats
- **Pagination serveur** : Toujours paginer côté serveur (jamais charger les 22k lignes)
- **Debounce** : 300ms pour la recherche
- **Lazy loading** : Charger les colonnes supplémentaires uniquement si configurées

## 9. Mise à jour de la vue matérialisée

**Fichier**: Migration SQL pour auto-refresh

Créer un trigger ou cron job pour rafraîchir la vue :

- Option 1 : Trigger sur INSERT/UPDATE/DELETE de crm_contacts, hubspot_contacts, apollo_contacts
- Option 2 : Cron job toutes les 5 minutes
- Option 3 : Bouton "Rafraîchir" dans l'UI qui appelle une edge function

Recommandation : **Option 3** pour commencer (contrôle manuel), puis Option 2 pour automatisation.

## Fichiers à créer

1. `src/hooks/useUnifiedCRMData.ts` - Hook pour vue unifiée avec filtres avancés
2. `src/components/UnifiedCRMFilters.tsx` - Composant de filtres multi-sources
3. `src/components/ColumnConfigurator.tsx` - Dialog de configuration des colonnes
4. `supabase/migrations/[timestamp]_unified_crm_detailed_view.sql` - Vue enrichie

## Fichiers à modifier

1. `src/pages/DataSourceTable.tsx` - Détecter CRM et utiliser vue unifiée
2. `src/components/TableView.tsx` - Ajouter mode unifié avec badges et édition conditionnelle
3. `src/components/TableFilters.tsx` - Intégrer UnifiedCRMFilters si mode unifié
4. `src/hooks/useTableData.ts` - Optionnel : adapter pour supporter la vue unifiée

## Structure technique

### Vue SQL enrichie (simplifié)

```sql
CREATE MATERIALIZED VIEW unified_crm_detailed_view AS
SELECT 
  email, firstname, lastname, company, ..., -- Champs communs
  has_crm, has_hubspot, has_apollo, source_count,
  -- Statuts clés extraits
  crm_data->>'zoho_status' as zoho_status,
  hubspot_data->>'lifecyclestage' as lifecyclestage,
  apollo_data->>'email_status' as apollo_email_status,
  -- Données brutes
  crm_data, hubspot_data, apollo_data
FROM unified_prospects_view
LEFT JOIN crm_contacts ON ...
LEFT JOIN hubspot_contacts ON ...
LEFT JOIN apollo_contacts ON ...;
```

### Hook unifié (signature)

```typescript
useUnifiedCRMData({
  page: number;
  pageSize: number;
  searchTerm: string;
  sourceFilters: ('crm' | 'hubspot' | 'apollo')[];
  statusFilters: {
    zoho_status?: string[];
    lifecyclestage?: string[];
    email_status?: string[];
  };
  dateRange?: { from: Date; to: Date };
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
})
```

## Notes importantes

1. **Backward compatibility** : La route `/datasources/apollo_contacts` et `/datasources/hubspot_contacts` restent inchangées
2. **Performance** : Toujours utiliser la pagination serveur (ne jamais charger 22k lignes)
3. **Édition** : Seulement les données CRM sont éditables inline
4. **Rafraîchissement** : Ajouter un bouton visible pour rafraîchir la vue matérialisée
5. **Migration progressive** : Garder l'ancienne vue CRM accessible via un toggle si nécessaire (phase de transition)

## Ordre d'implémentation recommandé

1. Créer la vue SQL enrichie avec statuts extraits
2. Créer le hook `useUnifiedCRMData`
3. Modifier `DataSourceTable` pour détecter CRM
4. Adapter `TableView` pour badges de source
5. Créer `UnifiedCRMFilters`
6. Implémenter l'édition conditionnelle
7. Créer `ColumnConfigurator`
8. Tests et optimisations

### To-dos

- [ ] Créer la vue SQL enrichie unified_crm_detailed_view avec statuts et données JSONB
- [ ] Créer le hook useUnifiedCRMData avec filtres multi-sources et statuts
- [ ] Modifier DataSourceTable pour détecter crm_contacts et utiliser la vue unifiée
- [ ] Adapter TableView pour badges de source et édition conditionnelle
- [ ] Créer UnifiedCRMFilters avec tous les filtres par source et statut
- [ ] Créer ColumnConfigurator pour colonnes dynamiques par source
- [ ] Implémenter l'édition inline intelligente (CRM éditable, autres lecture seule)
- [ ] Ajouter bouton rafraîchir pour la vue matérialisée