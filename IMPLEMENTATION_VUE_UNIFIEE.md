# Implémentation de la Vue Unifiée 360° - CRM Contacts

## 📊 Résumé

La vue unifiée `/datasources/crm_contacts` a été transformée en une vue 360° affichant **22,239 prospects** agrégés depuis 3 sources de données :
- **CRM Contacts** : 22,125 contacts
- **HubSpot** : 54 contacts
- **Apollo** : 634 contacts

## ✅ Fonctionnalités Implémentées

### 1. Vue SQL Enrichie (`unified_crm_detailed_view`)
- Vue matérialisée combinant CRM, HubSpot et Apollo
- Données détaillées stockées en JSONB pour chaque source
- Statuts clés extraits et indexés pour filtrage rapide
- Index optimisés pour les recherches multi-sources
- **Migration** : `create_unified_crm_detailed_view_fixed`

**Colonnes clés** :
- `email`, `firstname`, `lastname`, `company`, `industrie`
- `has_crm`, `has_hubspot`, `has_apollo`, `source_count`
- `crm_id`, `hubspot_id`, `apollo_id` (pour édition)
- Statuts CRM : `zoho_status`, `crm_apollo_status`, `data_section`
- Statuts HubSpot : `lifecyclestage`, `hs_lead_status`, `hs_pipeline`
- Statuts Apollo : `apollo_email_status`, `apollo_stage`, `apollo_lists`
- Données brutes : `crm_data`, `hubspot_data`, `apollo_data` (JSONB)

### 2. Hook React Unifié (`useUnifiedCRMData`)
**Fichier** : `src/hooks/useUnifiedCRMData.ts`

**Fonctionnalités** :
- Pagination serveur (évite de charger les 22k lignes)
- Recherche full-text débounced (300ms)
- Filtres multi-sources (CRM, HubSpot, Apollo)
- Filtres par statut pour chaque source
- Filtres avancés (entreprise, industrie, nb employés, dates)
- Mise à jour optimiste avec rollback
- Cache React Query (60s staleTime, 5min gcTime)

### 3. Composant de Filtres Avancés (`UnifiedCRMFilters`)
**Fichier** : `src/components/UnifiedCRMFilters.tsx`

**Sections de filtres** :
- **Sources de données** : Checkboxes CRM/HubSpot/Apollo
- **Statuts CRM** : Zoho Status, Apollo Status, Data Section
- **Statuts HubSpot** : Lifecycle Stage, Lead Status, Pipeline
- **Statuts Apollo** : Email Status, Stage, Lists
- Compteur de filtres actifs
- Bouton "Réinitialiser"

### 4. Configurateur de Colonnes (`ColumnConfigurator`)
**Fichier** : `src/components/ColumnConfigurator.tsx`

**Fonctionnalités** :
- 3 onglets (CRM, HubSpot, Apollo)
- Sélection des colonnes à afficher par source
- Sauvegarde dans localStorage
- Configuration par défaut réinitialisable
- Compteur de colonnes actives par source

### 5. Badges de Source Visuels
**Implémentation** : `src/components/TableView.tsx`

- Badges colorés affichés à côté de l'email :
  - **CRM** : Badge bleu
  - **HS** (HubSpot) : Badge orange
  - **AP** (Apollo) : Badge violet
- Affichage conditionnel selon les sources disponibles

### 6. Bouton de Rafraîchissement de la Vue
**Fichier Edge Function** : `supabase/functions/refresh-unified-view/index.ts`  
**Fonction SQL** : `refresh_unified_view()`

**Fonctionnalités** :
- Bouton visible uniquement en mode unifié
- Appelle une edge function sécurisée
- Rafraîchit la vue matérialisée de manière concurrente
- Toast de confirmation
- Permissions : `GRANT EXECUTE ON FUNCTION refresh_unified_view() TO authenticated`

### 7. Détection Automatique du Mode Unifié
**Fichier** : `src/pages/DataSourceTable.tsx`

```typescript
const isUnifiedView = tableName === 'crm_contacts';
<TableView tableName={tableName} onBack={...} isUnifiedView={isUnifiedView} />
```

### 8. Édition Inline Intelligente
**Implémentation** : `src/components/TableView.tsx`

**Logique d'édition** :
- Mode unifié : Utilise `optimisticUpdate` du hook unifié
- Les modifications sont sauvegardées dans `crm_contacts` (table prioritaire)
- Les colonnes CRM sont éditables
- Les colonnes HubSpot/Apollo sont en lecture seule (future amélioration)
- Feedback visuel instantané (animation verte)

### 9. Support Dual-Mode dans TableView
**Fichier** : `src/components/TableView.tsx`

**Logique de sélection** :
```typescript
const standardData = useTableData({ ... });
const unifiedData = useUnifiedCRMData({ ... });
const { data, totalCount, loading, ... } = isUnifiedView ? unifiedData : standardData;
```

**Avantages** :
- Rétrocompatibilité : Apollo et HubSpot utilisent le mode standard
- Pas de régression pour les vues existantes
- Transition progressive possible

## 📁 Fichiers Créés

1. `src/hooks/useUnifiedCRMData.ts` - Hook pour vue unifiée
2. `src/components/UnifiedCRMFilters.tsx` - Filtres multi-sources
3. `src/components/ColumnConfigurator.tsx` - Configuration colonnes
4. `supabase/functions/refresh-unified-view/index.ts` - Edge function refresh
5. `supabase/migrations/[timestamp]_create_unified_crm_detailed_view_fixed.sql` - Vue SQL
6. `supabase/migrations/[timestamp]_create_refresh_unified_view_function.sql` - Fonction SQL

## 📝 Fichiers Modifiés

1. `src/pages/DataSourceTable.tsx` - Détection mode unifié
2. `src/components/TableView.tsx` - Support dual-mode + badges + filtres

## 🚀 Utilisation

### Accéder à la Vue Unifiée
Naviguer vers : `/datasources/crm_contacts`

### Filtrer par Source
1. Ouvrir les filtres (bouton "Filtres")
2. Section "Filtres avancés" apparaît automatiquement
3. Cocher les sources désirées (CRM, HubSpot, Apollo)

### Filtrer par Statut
1. Sélectionner un statut dans les dropdowns
2. Les filtres sont cumulatifs
3. Utiliser "Réinitialiser" pour tout effacer

### Configurer les Colonnes
1. Cliquer sur "Colonnes"
2. Sélectionner l'onglet de la source
3. Cocher/décocher les colonnes
4. "Appliquer" pour sauvegarder

### Rafraîchir la Vue
1. Cliquer sur "Rafraîchir vue"
2. Attendre la confirmation (2s)
3. Les données sont automatiquement rechargées

## 🔧 Configuration

### Colonnes par Défaut

**CRM** (10 colonnes) :
- email, firstname, name, company, mobile, tel
- zoho_status, data_section, city, industrie

**HubSpot** (4 colonnes) :
- lifecyclestage, hs_lead_status, hs_pipeline, hs_analytics_revenue

**Apollo** (4 colonnes) :
- email_status, stage, lists, seniority

### Cache et Performance

- **Stale Time** : 60 secondes (données considérées comme fraîches)
- **GC Time** : 5 minutes (données gardées en cache)
- **Debounce** : 300ms pour la recherche
- **Pagination** : 25 lignes par défaut (configurable)

### Index SQL

- Index unique sur `email_normalized`
- Index sur tous les IDs sources (crm_id, hubspot_id, apollo_id)
- Index sur tous les statuts (zoho_status, lifecyclestage, email_status, etc.)
- Index composé sur `(has_crm, has_hubspot, has_apollo)`
- Index sur `last_updated` pour tri par date

## 🎯 Performance

### Temps de Chargement Estimés

- **Première page** : ~200-300ms (25 lignes)
- **Recherche** : ~300-500ms (avec debounce)
- **Filtrage** : ~200-400ms (index optimisés)
- **Rafraîchissement vue** : ~2-5s (CONCURRENTLY)

### Optimisations Appliquées

✅ Pagination serveur (jamais 22k lignes en mémoire)  
✅ Index sur colonnes de filtrage  
✅ Debounce sur recherche  
✅ React Query cache  
✅ Mise à jour optimiste  
✅ Vue matérialisée (pré-calcul)

## 🔐 Sécurité

- Row Level Security (RLS) appliquée sur `crm_contacts`
- Authentification requise pour rafraîchir la vue
- Edge functions sécurisées (vérification user)
- Service role key utilisée uniquement côté serveur

## 📊 Statistiques de la Vue

```sql
Total prospects : 22,239
├─ CRM Contacts : 22,125 (99.5%)
├─ HubSpot      : 54 (0.2%)
└─ Apollo       : 634 (2.8%)
```

**Note** : Un prospect peut être dans plusieurs sources (agrégation par email).

## 🎨 Design

- **Badges de source** : Affichés à côté de l'email
- **Couleurs cohérentes** :
  - CRM : Bleu (`bg-blue-100 text-blue-700`)
  - HubSpot : Orange (`bg-orange-100 text-orange-700`)
  - Apollo : Violet (`bg-purple-100 text-purple-700`)
- **Animation** : Pulse verte lors de la sauvegarde
- **Tooltips** : Sur tous les boutons et actions

## 🚧 Limitations Connues

1. **Édition multi-source** : Seules les données CRM sont éditables inline
2. **Rafraîchissement manuel** : La vue n'est pas auto-rafraîchie (nécessite clic)
3. **Drag & drop colonnes** : Non implémenté dans ColumnConfigurator
4. **Export** : Exporte uniquement les colonnes visibles (pas toutes les sources)

## 🔮 Améliorations Futures

1. **Auto-refresh** : Cron job pour rafraîchir la vue toutes les 5 minutes
2. **Édition conditionnelle** : Tooltip "Géré par HubSpot" sur colonnes non-CRM
3. **Colonnes calculées** : Score de complétude, dernière interaction, etc.
4. **Filtres date range** : Sélecteur de plage de dates dans les filtres avancés
5. **Export multi-sources** : Option pour exporter toutes les colonnes de toutes les sources
6. **Vue détaillée enrichie** : Onglets par source dans `ContactDetails.tsx`

## 🧪 Tests Recommandés

### Test 1 : Affichage de base
1. Aller sur `/datasources/crm_contacts`
2. Vérifier que les 22k+ prospects s'affichent
3. Vérifier les badges de source (CRM, HS, AP)

### Test 2 : Filtrage par source
1. Ouvrir les filtres
2. Cocher "HubSpot" uniquement
3. Vérifier que seuls les 54 prospects HubSpot apparaissent

### Test 3 : Filtrage par statut
1. Filtrer par "Zoho Status" = "Prospect chaud"
2. Vérifier que le compteur se met à jour
3. Réinitialiser les filtres

### Test 4 : Édition inline
1. Double-cliquer sur une cellule éditable
2. Modifier la valeur
3. Appuyer sur Entrée
4. Vérifier l'animation verte et le toast de succès

### Test 5 : Configuration colonnes
1. Cliquer sur "Colonnes"
2. Onglet "HubSpot"
3. Cocher "hs_analytics_num_visits"
4. Appliquer
5. Vérifier que la colonne apparaît

### Test 6 : Rafraîchissement
1. Cliquer sur "Rafraîchir vue"
2. Attendre le toast "Vue rafraîchie"
3. Vérifier que les données sont à jour

## 📚 Documentation Supabase

### Requête Exemple
```typescript
const { data, error } = await supabase
  .from('unified_crm_detailed_view' as any)
  .select('*')
  .eq('has_hubspot', true)
  .in('lifecyclestage', ['lead', 'customer'])
  .range(0, 24);
```

### Rafraîchir la Vue (SQL)
```sql
SELECT refresh_unified_view();
-- ou
REFRESH MATERIALIZED VIEW CONCURRENTLY unified_crm_detailed_view;
```

## 🎉 Conclusion

La vue unifiée 360° est maintenant opérationnelle pour `/datasources/crm_contacts`. Elle offre :
- Vue complète des 22k+ prospects
- Filtrage avancé multi-sources
- Édition inline optimiste
- Performance optimisée
- Expérience utilisateur fluide

**Prochaine étape** : Tester en production et recueillir les retours utilisateurs pour les améliorations futures.


