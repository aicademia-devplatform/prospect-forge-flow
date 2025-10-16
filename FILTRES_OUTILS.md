# Filtres Outils Avancés - Documentation

## Vue d'ensemble

Les filtres outils avancés permettent de filtrer les contacts CRM par les différents outils marketing et CRM utilisés (Systeme.io, Brevo, Zoho, HubSpot, Apollo). Chaque outil dispose de ses propres filtres stratégiques et affiche un compteur du nombre de leads présents.

## Fonctionnalités

### 1. Bouton "Plus de filtres"

- Accessible depuis la section des filtres avancés dans TableView
- Affiche un badge avec le nombre de filtres d'outils actifs
- Repliable avec icône de chevron pour montrer/cacher les filtres d'outils

### 2. Filtres par outil

#### Systeme.io
- **systemeio_list** : Filtrer par liste Systeme.io
- **systemeio_status** : Filtrer par statut Systeme.io

#### Brevo
- **brevo_tag** : Filtrer par tag
- **brevo_status** : Filtrer par statut
- **brevo_unsuscribe** : Filtrer les désabonnés uniquement (checkbox)
- **brevo_open_number_min** : Nombre minimum d'ouvertures
- **brevo_click_number_min** : Nombre minimum de clics

#### Zoho
- **zoho_status** : Filtrer par statut (multi-select, séparés par virgules)
- **zoho_tag** : Filtrer par tag
- **zoho_updated_by** : Filtrer par utilisateur ayant mis à jour
- **zoho_product_interest** : Filtrer par intérêt produit
- **zoho_status_2** : Filtrer par statut secondaire

#### HubSpot
- **hubspot_status** : Filtrer par statut
- **hubspot_lead_status** : Filtrer par lead status
- **hubspot_life_cycle_phase** : Filtrer par phase du cycle de vie
- **hubspot_buy_role** : Filtrer par rôle d'achat

#### Apollo
- **apollo_status** : Filtrer par statut Apollo
- **apollo_list** : Filtrer par liste Apollo

### 3. Compteurs par outil

Un badge affiche le nombre de contacts ayant des données pour chaque outil :
- Systeme.io : Contacts avec `systemeio_list` OU `systemeio_status`
- Brevo : Contacts avec `brevo_tag` OU `brevo_status`
- Zoho : Contacts avec `zoho_status` OU `zoho_tag`
- HubSpot : Contacts avec `hubspot_status` OU `hubspot_lead_status`
- Apollo : Contacts avec `apollo_status` OU `apollo_list`

## Fichiers créés

### 1. `src/components/ToolFilters.tsx`
Composant principal gérant l'interface des filtres d'outils avec :
- Accordéons repliables pour chaque outil
- Badges de compteurs en haut
- Bouton de réinitialisation
- Gestion de l'état local des filtres

### 2. `supabase/functions/tool-counts/index.ts`
Edge function Supabase pour récupérer les compteurs de leads par outil.

Endpoint : `tool-counts`

**Requête** :
```json
{
  "tableName": "crm_contacts"
}
```

**Réponse** :
```json
{
  "counts": {
    "systemeio": 1234,
    "brevo": 5678,
    "zoho": 3456,
    "hubspot": 2345,
    "apollo": 4567
  },
  "success": true
}
```

## Fichiers modifiés

### 1. `src/components/TableFilters.tsx`
Ajout de :
- Import de `ToolFilters` et `ToolFilterValues`
- Props `toolFilters`, `onToolFiltersChange`, `onToolFiltersReset`
- Bouton "Plus de filtres" avec badge de compteur
- Section repliable affichant `ToolFilters`
- Calcul du nombre de filtres d'outils actifs

### 2. `src/hooks/useTableData.ts`
Extension de l'interface `UseTableDataParams` :
- Ajout de tous les champs de `ToolFilterValues` dans `advancedFilters`

### 3. `supabase/functions/table-data/index.ts`
Ajout de la logique de filtrage SQL pour chaque outil :
- Filtres Systeme.io (ILIKE pour recherche partielle)
- Filtres Brevo (ILIKE + égalité pour booléens + comparaison >= pour nombres)
- Filtres Zoho (OR conditions pour multi-select, ILIKE pour le reste)
- Filtres HubSpot (ILIKE)
- Filtres Apollo (ILIKE)

### 4. `src/components/TableView.tsx`
Intégration complète :
- Import de `ToolFilterValues`
- État `toolFilters` avec `useState`
- Fonctions `handleToolFiltersChange` et `handleToolFiltersReset`
- Fusion de `advancedFilters` et `toolFilters` dans `mergedFilters`
- Passage de `mergedFilters` à `useTableData` et `useUnifiedCRMData`
- Props toolFilters passés à `TableFilters`

## Architecture technique

### Flux de données

1. **Utilisateur ouvre "Plus de filtres"** → Affichage de `ToolFilters`
2. **Utilisateur sélectionne des filtres** → `onToolFiltersChange` mise à jour de `toolFilters` dans `TableView`
3. **Fusion des filtres** → `mergedFilters = { ...advancedFilters, ...toolFilters }`
4. **Appel useTableData** → Envoi de `mergedFilters` à l'edge function `table-data`
5. **Edge function** → Application des filtres SQL côté serveur
6. **Résultats filtrés** → Affichage dans le tableau

### Compteurs

1. **Montage de `ToolFilters`** → Appel de l'edge function `tool-counts`
2. **Calcul côté serveur** → Comptage avec `COUNT(*) FILTER (WHERE ...)`
3. **Affichage** → Badges avec les compteurs formatés en français

## Utilisation

### Dans l'interface utilisateur

1. Ouvrir les filtres avancés en cliquant sur le bouton "Filtres"
2. Cliquer sur "Plus de filtres" pour afficher les filtres d'outils
3. Déplier l'accordéon de l'outil souhaité (Systeme.io, Brevo, Zoho, HubSpot, Apollo)
4. Remplir les champs de filtres souhaités
5. Les filtres sont appliqués automatiquement
6. Le badge sur "Plus de filtres" indique le nombre de filtres actifs
7. Cliquer sur "Réinitialiser" dans `ToolFilters` pour supprimer tous les filtres d'outils

### Exemple de filtrage

**Filtrer les contacts Brevo désabonnés avec au moins 5 ouvertures :**
1. Ouvrir "Plus de filtres"
2. Déplier l'accordéon "Brevo"
3. Cocher "Désabonné uniquement"
4. Entrer "5" dans "Ouvertures minimum"
5. Le tableau affiche uniquement les contacts correspondants

**Filtrer les contacts Zoho avec plusieurs statuts :**
1. Ouvrir "Plus de filtres"
2. Déplier l'accordéon "Zoho"
3. Entrer dans "Statut" : "Hot Lead, Warm Lead, Prospect"
4. Les contacts avec l'un de ces statuts sont affichés

## Performance

- **Filtrage côté serveur** : Toute la logique de filtrage est exécutée dans PostgreSQL pour des performances optimales
- **Cache React Query** : Les résultats sont mis en cache avec `useQuery`
- **Compteurs chargés une fois** : Les compteurs sont récupérés au montage du composant
- **Debouncing** : Le searchTerm utilise `useDebounce` pour limiter les requêtes

## Extensibilité

Pour ajouter un nouvel outil :

1. **Ajouter les champs dans `ToolFilterValues`** (`src/components/ToolFilters.tsx`)
2. **Ajouter l'accordéon dans `ToolFilters`** avec les champs de filtres appropriés
3. **Ajouter le compteur dans `tool-counts`** edge function
4. **Ajouter les filtres SQL dans `table-data`** edge function
5. **Ajouter les types dans `UseTableDataParams`** (`src/hooks/useTableData.ts`)
6. **Ajouter les types dans `QueryParams`** (`supabase/functions/table-data/index.ts`)

## Notes importantes

- **Uniquement pour crm_contacts** : Les filtres d'outils ne sont affichés que pour la table `crm_contacts`
- **Recherche partielle** : La plupart des filtres utilisent `ILIKE` pour une recherche partielle (insensible à la casse)
- **Multi-select Zoho** : Le filtre `zoho_status` accepte plusieurs valeurs séparées par des virgules
- **Filtres cumulatifs** : Les filtres d'outils se cumulent avec les filtres avancés standards


