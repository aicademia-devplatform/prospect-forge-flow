# Logique d'importation des prospects

## Vue d'ensemble

Ce document explique le flux d'importation des prospects (via CSV ou Google Sheets) et comment les données sont réparties entre les différentes tables de la base de données.

## Objectif

Lorsqu'un SDR importe des prospects, les données doivent :
1. **Stocker les informations du contact** (nom, prénom, email, etc.) dans `crm_contacts` (table de référence centralisée)
2. **Créer l'assignation** au SDR dans `sales_assignments` (si prospect à traiter) ou `prospects_traites` (si déjà traité)
3. **Maintenir le lien** entre les deux par `lead_email` → `email`

## Architecture des tables

### 1. `crm_contacts` (Table de référence centrale)
**Rôle** : Stocke TOUTES les informations du contact (données métier)

**Colonnes principales** :
- `id` : ID unique du contact
- `email` : Email du contact (clé unique)
- `firstname`, `name` : Nom et prénom
- `company`, `nb_employees` : Informations entreprise
- `tel_pro`, `mobile`, `tel` : Coordonnées
- `linkedin_url`, `linkedin_company_url` : Réseaux sociaux
- `address`, `city`, `departement`, `country` : Localisation
- Tous les champs métier (statuts, scores, tags, etc.)

### 2. `sales_assignments` (Assignations actives)
**Rôle** : Prospects actuellement assignés aux SDR, en cours de traitement

**Colonnes principales** :
- `id` : ID unique de l'assignation
- `sales_user_id` : ID du SDR assigné
- `sdr_id` : ID du SDR (doublon pour compatibilité)
- `lead_email` : Email du prospect (lien vers `crm_contacts.email`)
- `source_table` : Table source (`crm_contacts`, `apollo_contacts`, etc.)
- `source_id` : ID dans la table source
- `statut_prospect` : Statut actuel (null si pas encore traité)
- `notes_sales` : Notes du SDR
- `date_action` : Date de la prochaine action
- `custom_data` : Données supplémentaires en JSON
- `assigned_by` : ID de l'utilisateur qui a fait l'assignation
- `assigned_at` : Date d'assignation

### 3. `prospects_traites` (Archive des prospects traités)
**Rôle** : Prospects qui ont été traités (complétés) par le SDR

**Colonnes principales** : Mêmes que `sales_assignments`, plus :
- `completed_at` : Date de complétion
- `original_assignment_id` : ID de l'assignation d'origine

## Flux d'importation

### Étape 1 : Upload du fichier (CSV ou Google Sheets)
- L'utilisateur sélectionne un fichier CSV/Excel ou fournit une URL Google Sheets
- Le système parse le fichier et extrait les en-têtes et les lignes

### Étape 2 : Mapping des colonnes
- L'utilisateur mappe les colonnes du fichier vers les champs de la base de données
- Le système suggère automatiquement des mappings basés sur les noms de colonnes

### Étape 3 : Traitement des données

#### Pour `targetTable = 'prospects'` :

```typescript
Pour chaque ligne du fichier:
  1. Extraire l'email (champ obligatoire)
  
  2. Séparer les données en 2 catégories:
     
     a) Données du contact (vont dans crm_contacts):
        - email, firstname, name
        - address, city, departement, country
        - tel_pro, tel, mobile, mobile_2
        - company, nb_employees, linkedin_function
        - industrie, linkedin_url, linkedin_company_url, company_website
        - Tous les champs métier (tags, statuts, scores)
     
     b) Données d'assignation (vont dans sales_assignments/prospects_traites):
        - statut_prospect
        - notes_sales
        - date_action
        - Tous les autres champs → custom_data (JSON)
  
  3. Upsert dans crm_contacts:
     - Créer ou mettre à jour le contact avec les données du contact
     - Récupérer l'ID du contact créé/mis à jour
  
  4. Créer l'assignation:
     
     Si statut_prospect est défini (prospect déjà traité):
       → Insérer dans prospects_traites
       → Renseigner completed_at et assigned_at
     
     Sinon (prospect à traiter):
       → Insérer dans sales_assignments
       → Le SDR devra le traiter via l'interface
  
  5. Renseigner l'assignation avec:
     - lead_email: email du prospect
     - sales_user_id: ID du SDR qui importe
     - sdr_id: ID du SDR (pour compatibilité)
     - assigned_by: ID du SDR qui importe
     - source_table: 'crm_contacts'
     - source_id: ID du contact dans crm_contacts
     - statut_prospect, notes_sales, date_action (si fournis)
     - custom_data: tous les autres champs non mappés
```

#### Pour `targetTable = 'crm_contacts'` ou `'apollo_contacts'` :
- Import direct dans la table cible
- Upsert par batch de 100 lignes
- Utilise `email` comme clé de conflit

## Exemples de mapping

### Exemple 1 : Import basique
```csv
email,firstname,name,company,statut_prospect
john.doe@example.com,John,Doe,Acme Corp,
jane.smith@example.com,Jane,Smith,Tech Inc,RDV prévu
```

**Résultat** :
1. `crm_contacts` :
   - john.doe@example.com : {firstname: 'John', name: 'Doe', company: 'Acme Corp'}
   - jane.smith@example.com : {firstname: 'Jane', name: 'Smith', company: 'Tech Inc'}

2. `sales_assignments` :
   - john.doe@example.com (à traiter, pas de statut)

3. `prospects_traites` :
   - jane.smith@example.com (statut: 'RDV prévu')

### Exemple 2 : Import avec champs custom
```csv
email,firstname,name,company,score_prospect,source_campaign,statut_prospect,notes_sales
john@example.com,John,Doe,Acme,85,LinkedIn Q4,,
```

**Résultat** :
1. `crm_contacts` :
   - john@example.com : {firstname: 'John', name: 'Doe', company: 'Acme'}

2. `sales_assignments` :
   - john@example.com
   - custom_data: {score_prospect: 85, source_campaign: 'LinkedIn Q4'}

## Restrictions par rôle

### SDR (Sales Development Representative)
- **Import autorisé** : `prospects` uniquement
- **Assignation** : À lui-même automatiquement
- **Objectif** : Import de ses propres prospects à traiter

### Sales / Marketing
- **Import autorisé** : `prospects`, `crm_contacts`
- **Assignation** : Peut assigner à lui-même ou à d'autres (selon permissions)
- **Objectif** : Import de données CRM ou de prospects

### Admin
- **Import autorisé** : `prospects`, `crm_contacts`, `apollo_contacts`
- **Assignation** : Tous pouvoirs
- **Objectif** : Gestion complète des données

## Gestion des doublons

### Dans crm_contacts
- **Clé unique** : `email`
- **Stratégie** : Upsert (mise à jour si existe, création sinon)
- **Comportement** : Les nouvelles données écrasent les anciennes pour le même email

### Dans sales_assignments / prospects_traites
- **Clé unique** : Aucune (plusieurs assignations possibles pour le même email)
- **Stratégie** : Insertion (permet l'historique)
- **Comportement** : Chaque import crée une nouvelle assignation

## Notification et suivi

### Notification in-app
- Créée dans la table `notifications`
- Type : `import_success` ou `import_failed`
- Contient le nombre de lignes importées et échouées

### Notification email
- Envoyée à l'email du profil utilisateur
- Contient un résumé de l'import
- Utilise SMTP (Gmail)

### Historique
- Enregistré dans `import_history`
- Contient :
  - Fichier source
  - Nombre de lignes (total, succès, échecs)
  - Mapping des colonnes
  - Détails des erreurs
  - Statut (pending, completed, failed)

## Dépannage

### Erreur : "Email manquant pour le prospect"
**Cause** : Le champ `lead_email` n'est pas mappé ou est vide
**Solution** : Mapper correctement le champ email dans l'étape de mapping

### Erreur : "Error upserting contact"
**Cause** : Violation de contrainte dans `crm_contacts` (email invalide, champ requis manquant, etc.)
**Solution** : Vérifier les données du fichier source

### Import bloqué en statut "pending"
**Cause** : Erreur dans le traitement en arrière-plan
**Solution** : Vérifier les logs de l'edge function `csv-import`

## Code source

### Edge Function
- **Fichier** : `supabase/functions/csv-import/index.ts`
- **Fonction** : Traite les imports (lignes 127-227)

### Composants frontend
- **CSV** : `src/components/import/CSVUploader.tsx`
- **Google Sheets** : `src/components/import/GoogleSheetsImporter.tsx`
- **Mapping** : `src/components/import/ColumnMapper.tsx`

## Schéma visuel

```
┌─────────────────────┐
│  Fichier CSV/Excel  │
│  ou Google Sheets   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Parse & Extract   │
│  (headers + rows)   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Column Mapping UI  │
│ (utilisateur mappe) │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Edge Function      │
│  csv-import         │
└──────────┬──────────┘
           │
           ├──────────────────────────────────────┐
           │                                      │
           ▼                                      ▼
┌─────────────────────┐              ┌─────────────────────┐
│   crm_contacts      │              │ sales_assignments   │
│  (données contact)  │              │   ou                │
│                     │              │ prospects_traites   │
│  • email            │◄─────────────│  • lead_email       │
│  • firstname        │     Lien     │  • source_id        │
│  • name             │              │  • statut_prospect  │
│  • company          │              │  • notes_sales      │
│  • tel_pro          │              │  • custom_data      │
│  • ...              │              │  • sdr_id           │
└─────────────────────┘              └─────────────────────┘
```

## Évolutions futures possibles

1. **Validation avancée** : Validation des emails, téléphones, etc.
2. **Dédoublonnage intelligent** : Détection des doublons avant import
3. **Import asynchrone** : File d'attente pour gros volumes
4. **Rollback** : Annuler un import si erreur
5. **Preview avant import** : Montrer un aperçu des données transformées
6. **Enrichissement automatique** : Compléter les données manquantes via API externes


