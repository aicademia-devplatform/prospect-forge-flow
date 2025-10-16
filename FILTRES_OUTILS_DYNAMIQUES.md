# Filtres Outils Dynamiques - Documentation

## Vue d'ensemble

Ce système permet aux utilisateurs de filtrer les contacts CRM par outil (Systeme.io, Brevo, Zoho, HubSpot, Apollo) avec des filtres dynamiques qui se révèlent de manière fluide au clic sur un badge.

## Architecture

### 1. Edge Function: tool-filter-options

**Fichier**: `supabase/functions/tool-filter-options/index.ts`

Cette fonction récupère les valeurs distinctes des colonnes de la base de données pour alimenter les options de sélection dynamiques.

**Colonnes interrogées**:
- **Systeme.io**: `systemeio_list`
- **Brevo**: `brevo_tag`, `brevo_unsuscribe`
- **Zoho**: `zoho_status`, `zoho_tag`, `zoho_updated_by`, `zoho_product_interest`, `zoho_status_2`
- **HubSpot**: `hubspot_lead_status`, `hubspot_life_cycle_phase`, `hubspot_buy_role`
- **Apollo**: `apollo_status`, `apollo_list`

**Optimisations**:
- Limite de 100 valeurs max par colonne
- Tri alphabétique des valeurs
- Gestion des valeurs nulles/vides
- Cas spécial pour les booléens (brevo_unsuscribe)

### 2. Composant Frontend: ToolFilters

**Fichier**: `src/components/ToolFilters.tsx`

#### États
- `toolCounts`: Compteurs de contacts par outil
- `selectedTools`: Set des outils sélectionnés pour affichage des filtres
- `filterOptions`: Options dynamiques récupérées depuis l'edge function
- `loadingOptions`: État de chargement des options

#### Fonctionnalités

##### Badges cliquables
- Clic sur un badge → **active le filtre wildcard (%)** ET affiche les filtres avancés de l'outil
- Badge actif → couleur distinctive + icône X (indique qu'**au moins un filtre** de cet outil est actif)
- Reclic sur un badge actif → désactive **tous les filtres** de cet outil ET cache les filtres avancés
- Compteurs en temps réel pour chaque outil
- **Comportement cumulatif** : filtre général (wildcard) + filtres spécifiques optionnels
- **Badge intelligent** : reste en highlight tant qu'un filtre de l'outil est actif (wildcard ou spécifique)

##### Filtres animés (Framer Motion)
- Animation fluide d'entrée/sortie (height + opacity)
- Durée: 0.3s avec easing "easeInOut"
- Loader pendant le chargement des options

##### Filtres par outil

**Systeme.io**:
- Select pour `systemeio_list` (options dynamiques)

**Brevo**:
- Select pour `brevo_tag` (options dynamiques)
- Checkbox pour `brevo_unsuscribe`
- Slider pour `brevo_open_number_min` (0-50, affichage de la valeur en temps réel)
- Slider pour `brevo_click_number_min` (0-30, affichage de la valeur en temps réel)

**Zoho**:
- Select pour `zoho_tag` (options dynamiques)
- Select pour `zoho_updated_by` (options dynamiques)
- Select pour `zoho_product_interest` (options dynamiques)
- Select pour `zoho_status_2` (options dynamiques)

**HubSpot**:
- Select pour `hubspot_lead_status` (options dynamiques)
- Select pour `hubspot_life_cycle_phase` (options dynamiques)
- Select pour `hubspot_buy_role` (options dynamiques)

**Apollo**:
- Select pour `apollo_status` (options dynamiques)
- Select pour `apollo_list` (options dynamiques)

### 3. Backend: table-data

**Fichier**: `supabase/functions/table-data/index.ts`

Les filtres utilisent déjà la logique `ILIKE` pour la recherche flexible (non-stricte), aucune modification n'était nécessaire.

## Flux de données

1. **Montage du composant** → Chargement des compteurs depuis `tool-counts` + Synchronisation de `selectedTools` avec les filtres wildcard actifs
2. **Clic sur badge** → 
   - **Si badge inactif** : Active le filtre wildcard (%) + Ajoute l'outil à `selectedTools`
   - **Si badge actif** : Désactive le filtre wildcard + Retire l'outil de `selectedTools`
3. **Changement de selectedTools** → Appel de `tool-filter-options` avec la liste des outils
4. **Réception des options** → Mise à jour de `filterOptions`
5. **Affichage des filtres** → Animation avec Framer Motion
6. **Sélection d'une valeur dans les filtres avancés** → Remplace ou complète le filtre wildcard → Mise à jour de `filters` → Propagation à `TableView`
7. **Filtrage des données** → Appel à `table-data` avec les filtres appliqués (wildcard + filtres spécifiques)

## UX et Design

### Couleurs par outil
- **Systeme.io**: Bleu (bg-blue-500)
- **Brevo**: Violet (bg-purple-500)
- **Zoho**: Vert (bg-green-500)
- **HubSpot**: Orange (bg-orange-500)
- **Apollo**: Indigo (bg-indigo-500)

### Interaction
- Hover: Scale 1.05 sur les badges
- Active: Badge coloré + icône X
- Transition smooth de 300ms
- **Sliders interactifs** :
  - Affichage de la valeur actuelle dans un badge coloré (violet pour Brevo)
  - Échelle 0-50 pour les ouvertures, 0-30 pour les clics
  - Labels min/max affichés sous le slider
  - Feedback visuel immédiat lors du glissement

### Gestion des états
- **Chargement initial**: Spinner sur les compteurs
- **Chargement options**: Loader + message "Chargement des options..."
- **Aucune valeur**: Message "Aucune valeur disponible" dans le Select
- **Filtres actifs**: Compteur dans le bouton "Réinitialiser"

## Points d'attention

1. **Performance**: Limite de 100 options par Select pour éviter les problèmes de performance
2. **Cache**: Les options sont rechargées à chaque changement de sélection d'outils
3. **Flexibilité**: Recherche ILIKE (contient) au lieu d'égalité stricte
4. **Accessibilité**: Labels associés, placeholders explicites
5. **Responsive**: Grid 2 colonnes pour les inputs numériques de Brevo

## Déploiement

```bash
# Déployer la nouvelle edge function
npx supabase functions deploy tool-filter-options

# Vérifier le déploiement
# Dashboard: https://supabase.com/dashboard/project/hzcsalwomlnumwurozuz/functions
```

## Exemples d'utilisation

### Filtrer tous les contacts Brevo
1. Cliquer sur le badge "Brevo"
2. **Immédiatement** : Les données sont filtrées pour n'afficher que les contacts ayant un `brevo_tag` (filtre wildcard %)
3. Les filtres avancés apparaissent avec animation
4. *Optionnel* : Affiner avec un tag spécifique, un nombre d'ouvertures minimum, etc.

### Filtrer les contacts Brevo avec un tag spécifique et plus de 5 ouvertures
1. Cliquer sur le badge "Brevo" → **Filtre wildcard activé** (tous les contacts Brevo)
2. Les filtres avancés apparaissent avec animation
3. Sélectionner un tag spécifique dans le Select → **Remplace le filtre wildcard**
4. Saisir "5" dans "Ouvertures min" → **Ajoute un filtre supplémentaire**
5. Les données affichent uniquement les contacts Brevo avec ce tag ET 5+ ouvertures

### Filtrer plusieurs outils simultanément
1. Cliquer sur "Zoho" → **Filtre wildcard activé pour Zoho**
2. Cliquer sur "HubSpot" → **Filtre wildcard activé pour HubSpot**
3. Les deux sections de filtres apparaissent
4. **Résultat** : Contacts ayant des données Zoho ET HubSpot (logique AND)
5. Configurer les filtres spécifiques pour affiner

### Réinitialiser les filtres
- Bouton "Réinitialiser" dans l'en-tête du composant
- Affiche le nombre de filtres actifs
- Réinitialise tous les filtres d'un coup

## Améliorations futures possibles

1. **Cache client**: Mémoriser les options pour éviter les re-fetch
2. **Recherche dans Select**: Ajouter la capacité de rechercher dans les listes longues
3. **Filtres multiples**: Permettre la sélection multiple dans certains Selects
4. **Export de configuration**: Sauvegarder des ensembles de filtres prédéfinis
5. **Analytics**: Tracker les filtres les plus utilisés

