# 🔧 Plan de Troubleshooting - Edge Function csv-import

## 🚨 Problème identifié

**Erreur** : `Function deploy failed due to an internal error` (500)
**Cause** : Problème côté serveur Supabase, pas de notre code
**Confirmation** : Même une fonction simplifiée échoue avec la même erreur

## ✅ Tests effectués

1. **Fonction complète** : ❌ Erreur 500
2. **Fonction simplifiée** : ❌ Erreur 500 (même erreur)
3. **Code corrigé** : ✅ Prêt (gestion d'erreur ajoutée)

## 🎯 Solutions par ordre de priorité

### 1. Déploiement via Dashboard Supabase (RECOMMANDÉ)

**Avantages** :

- ✅ Contourne les problèmes du CLI
- ✅ Interface graphique stable
- ✅ Déploiement immédiat

**Étapes** :

1. Allez sur : https://supabase.com/dashboard/project/hzcsalwomlnumwurozuz/functions
2. Cliquez sur `csv-import`
3. Copiez le contenu de `supabase/functions/csv-import/index.ts`
4. Collez dans l'éditeur
5. Cliquez sur "Deploy"

### 2. Attendre la résolution du service

**Indicateurs** :

- Erreur 500 persistante
- Même erreur avec fonction simplifiée
- Problème côté serveur Supabase

**Actions** :

- Réessayer dans 15-30 minutes
- Surveiller le statut : https://status.supabase.com/

### 3. Support Supabase

**Si le problème persiste** :

- Créer un ticket : https://supabase.com/support
- Mentionner : "Function deploy failed due to an internal error (500)"
- Inclure le project-ref : `hzcsalwomlnumwurozuz`

## 📋 Code prêt pour déploiement

### Fichier principal

- **Chemin** : `supabase/functions/csv-import/index.ts`
- **Statut** : ✅ Corrigé avec gestion d'erreur robuste
- **Fonctionnalités** :
  - ✅ Extraction automatique des colonnes de statut
  - ✅ Assignation au SDR sélectionné
  - ✅ Routage intelligent (avec/sans statut)
  - ✅ Gestion des doublons
  - ✅ Messages d'erreur détaillés

### Fichier de test

- **Chemin** : `supabase/functions/csv-import-simple/index.ts`
- **Statut** : ✅ Créé pour tester le déploiement
- **Usage** : Test de connectivité uniquement

## 🔍 Vérifications post-déploiement

### 1. Test de base

```bash
# Vérifier que la fonction est déployée
npx supabase functions list --project-ref hzcsalwomlnumwurozuz
```

### 2. Test d'import

- Utiliser `test-prospects-with-status.csv`
- Vérifier les logs dans le dashboard
- Contrôler les données dans `prospects_traites`

### 3. Test d'historique

- Ouvrir ProspectDetails pour un prospect importé
- Vérifier l'affichage des statuts importés
- Contrôler le badge "Importé"

## 📊 État actuel

| Composant     | Statut        | Action requise              |
| ------------- | ------------- | --------------------------- |
| Edge Function | ✅ Prêt       | Déploiement via dashboard   |
| Interface     | ✅ Prêt       | Aucune                      |
| Tests         | ✅ Prêt       | Aucune                      |
| CLI Supabase  | ❌ Erreur 500 | Contournement via dashboard |

## 🎯 Prochaine étape

**Déployer via Dashboard Supabase** - c'est la solution la plus fiable actuellement.

---

**Dernière mise à jour** : ${new Date().toISOString()}
**Statut** : En attente de déploiement via dashboard
