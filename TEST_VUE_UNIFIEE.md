# 🧪 Guide de Test - Vue Unifiée 360°

## Démarrage Rapide

```bash
# Démarrer l'application
npm run dev

# Dans un autre terminal, vérifier que Supabase fonctionne
# (si vous utilisez Supabase local)
```

## Tests Fonctionnels

### ✅ Test 1 : Accès et Affichage Initial

**Objectif** : Vérifier que la vue unifiée charge correctement

**Étapes** :
1. Se connecter à l'application
2. Naviguer vers **Data Sources** (menu latéral)
3. Cliquer sur **CRM Contacts**
4. Observer l'affichage

**Résultat attendu** :
- ✅ Le tableau affiche ~22,000+ prospects
- ✅ Les badges de source (CRM, HS, AP) apparaissent à côté des emails
- ✅ Le bouton "Rafraîchir vue" est visible
- ✅ Temps de chargement < 500ms

**Capture d'écran attendue** :
```
Email                        | Prénom | Nom    | Entreprise      | ...
─────────────────────────────────────────────────────────────────────
test@example.com [CRM] [HS]  | John   | Doe    | Acme Corp       | ...
jane@company.fr [CRM] [AP]   | Jane   | Smith  | TechCo          | ...
```

---

### ✅ Test 2 : Filtrage par Source

**Objectif** : Vérifier que les filtres de source fonctionnent

**Étapes** :
1. Cliquer sur **Filtres** (bouton en haut à droite)
2. Scroller jusqu'à la section "Filtres avancés"
3. Cocher **HubSpot uniquement**
4. Observer le résultat

**Résultat attendu** :
- ✅ Seuls ~54 prospects avec badge HS s'affichent
- ✅ Le compteur de pagination change
- ✅ Un badge "1 actif" apparaît sur le bouton Filtres

**Test avancé** :
5. Cocher aussi **CRM**
6. Observer que les prospects avec CRM OU HubSpot s'affichent (~22,125 prospects)
7. Décocher **CRM**, garder **Apollo** et **HubSpot**
8. Observer ~688 prospects (54 + 634)

---

### ✅ Test 3 : Filtrage par Statut CRM

**Objectif** : Vérifier les filtres de statut Zoho

**Étapes** :
1. Ouvrir les filtres
2. Dans "Statuts CRM", sélectionner **Zoho Status** = **"Prospect chaud"**
3. Observer le résultat

**Résultat attendu** :
- ✅ Seuls les prospects avec zoho_status = "Prospect chaud" s'affichent
- ✅ Le compteur de filtres actifs augmente
- ✅ Pagination ajustée selon le nombre de résultats

**Test combiné** :
4. Ajouter **Data Section** = **"Apollo"**
5. Vérifier que les deux filtres sont cumulatifs (ET logique)
6. Cliquer sur **Réinitialiser** dans le panneau des filtres
7. Vérifier que tous les filtres sont effacés

---

### ✅ Test 4 : Filtrage par Statut HubSpot

**Objectif** : Vérifier les filtres HubSpot

**Étapes** :
1. Ouvrir les filtres
2. Cocher **HubSpot** dans les sources
3. Dans "Statuts HubSpot", sélectionner **Lifecycle Stage** = **"lead"**
4. Observer le résultat

**Résultat attendu** :
- ✅ Seuls les prospects HubSpot avec lifecyclestage = "lead" s'affichent
- ✅ Nombre de résultats < 54 (sous-ensemble)

---

### ✅ Test 5 : Recherche Full-Text

**Objectif** : Vérifier la recherche globale

**Étapes** :
1. Dans la barre de recherche, taper **"acme"**
2. Attendre 300ms (debounce)
3. Observer le résultat

**Résultat attendu** :
- ✅ Les résultats sont filtrés (email, nom, prénom ou entreprise contenant "acme")
- ✅ Les badges de source sont toujours visibles
- ✅ Pas de lag pendant la saisie (debounce actif)

**Test avancé** :
4. Cliquer sur l'icône de recherche avancée
5. Sélectionner uniquement **Email** et **Company**
6. Taper **"@gmail.com"**
7. Vérifier que seuls les emails Gmail apparaissent

---

### ✅ Test 6 : Édition Inline

**Objectif** : Vérifier l'édition optimiste

**Étapes** :
1. Double-cliquer sur une cellule éditable (ex: **firstname**)
2. Modifier la valeur (ex: "Jean" → "Jean-Paul")
3. Appuyer sur **Entrée**
4. Observer le comportement

**Résultat attendu** :
- ✅ Animation verte immédiate (feedback visuel)
- ✅ Toast de succès : "Modification sauvegardée"
- ✅ La valeur reste changée après refresh
- ✅ Pas de flash/rechargement de page

**Test d'erreur** :
5. Double-cliquer sur **nb_employees**
6. Entrer un texte invalide (ex: "abc")
7. Appuyer sur Entrée
8. Vérifier qu'un toast d'erreur s'affiche

---

### ✅ Test 7 : Configuration des Colonnes

**Objectif** : Vérifier le configurateur de colonnes

**Étapes** :
1. Cliquer sur **Colonnes**
2. Aller dans l'onglet **HubSpot**
3. Cocher **hs_analytics_num_visits**
4. Cliquer sur **Appliquer**
5. Observer le tableau

**Résultat attendu** :
- ✅ Une nouvelle colonne "Nb Visites" apparaît
- ✅ La configuration est sauvegardée (localStorage)
- ✅ Après refresh de page, la colonne est toujours visible

**Test de réinitialisation** :
6. Rouvrir le configurateur
7. Cliquer sur **Réinitialiser**
8. Appliquer
9. Vérifier que les colonnes par défaut sont restaurées

---

### ✅ Test 8 : Rafraîchissement de la Vue

**Objectif** : Vérifier le bouton de refresh

**Étapes** :
1. Cliquer sur **Rafraîchir vue**
2. Observer les toasts
3. Attendre 2 secondes

**Résultat attendu** :
- ✅ Toast "Rafraîchissement en cours..."
- ✅ Toast "Vue rafraîchie" après 2s
- ✅ Les données sont rechargées automatiquement
- ✅ Aucune erreur dans la console

**Test d'erreur** :
4. Couper la connexion réseau
5. Cliquer sur "Rafraîchir vue"
6. Vérifier qu'un toast d'erreur s'affiche
7. Vérifier qu'un refetch est tenté automatiquement

---

### ✅ Test 9 : Tri des Colonnes

**Objectif** : Vérifier le tri multi-colonnes

**Étapes** :
1. Cliquer sur l'en-tête **Company**
2. Observer l'ordre (ASC)
3. Recliquer (DESC)
4. Recliquer (pas de tri)

**Résultat attendu** :
- ✅ Les prospects sont triés par entreprise
- ✅ L'icône de tri change (↑ / ↓)
- ✅ Le tri est appliqué côté serveur (pas de lag)

---

### ✅ Test 10 : Pagination

**Objectif** : Vérifier la navigation entre les pages

**Étapes** :
1. Observer la pagination en bas du tableau
2. Cliquer sur **Page 2**
3. Observer le chargement
4. Changer la taille de page à **50**

**Résultat attendu** :
- ✅ Les 25 lignes suivantes s'affichent
- ✅ Indicateur de chargement pendant la requête
- ✅ Le compteur "26-50 sur 22,239" se met à jour
- ✅ Les badges de source sont toujours visibles

---

### ✅ Test 11 : Export de Données

**Objectif** : Vérifier l'export Excel

**Étapes** :
1. Cliquer sur le bouton **Exporter** (icône download bleue)
2. Sélectionner **Page actuelle**
3. Cliquer sur **Exporter**
4. Observer le téléchargement

**Résultat attendu** :
- ✅ Un fichier `.xlsx` est téléchargé
- ✅ Le fichier contient les 25 lignes de la page
- ✅ Les colonnes visibles sont exportées
- ✅ Les badges de source ne sont pas dans l'export (uniquement les données)

**Test avancé** :
5. Appliquer un filtre (ex: Zoho Status = "Prospect chaud")
6. Exporter **Données filtrées**
7. Vérifier que l'export contient uniquement les prospects filtrés

---

### ✅ Test 12 : Sélection Multiple

**Objectif** : Vérifier la sélection de prospects

**Étapes** :
1. Cocher 3 prospects
2. Observer le bandeau de sélection
3. Cliquer sur **Assigner** (si disponible)

**Résultat attendu** :
- ✅ Le bandeau "3 prospects sélectionnés" apparaît
- ✅ Les lignes sont surlignées
- ✅ Les actions en masse sont disponibles

---

### ✅ Test 13 : Responsive Design

**Objectif** : Vérifier l'affichage mobile

**Étapes** :
1. Ouvrir les DevTools (F12)
2. Activer le mode responsive (Ctrl+Shift+M)
3. Tester en 375px (iPhone SE)
4. Tester en 768px (iPad)

**Résultat attendu** :
- ✅ Le tableau est scrollable horizontalement
- ✅ Les filtres s'adaptent (colonnes → lignes)
- ✅ Les badges de source restent visibles
- ✅ Pas de débordement horizontal

---

### ✅ Test 14 : Performance et Cache

**Objectif** : Vérifier le cache React Query

**Étapes** :
1. Charger la page 1 (observer le temps)
2. Aller sur page 2
3. Revenir sur page 1
4. Observer le temps de chargement

**Résultat attendu** :
- ✅ Page 1 (1ère fois) : ~300ms
- ✅ Page 2 : ~300ms
- ✅ Page 1 (2ème fois) : **instantané** (cache)
- ✅ Aucun loader affiché (données en cache)

**Test de stale time** :
5. Attendre 60 secondes
6. Changer de page
7. Observer que les données sont refetch en background

---

### ✅ Test 15 : Gestion des Erreurs

**Objectif** : Vérifier la résilience

**Étapes** :
1. Couper la connexion réseau
2. Essayer de charger une page
3. Observer le comportement

**Résultat attendu** :
- ✅ Message d'erreur clair
- ✅ Option de retry
- ✅ Pas de crash de l'application
- ✅ Les données en cache restent affichées

---

## Tests SQL Directs

### Vérifier le Nombre de Prospects
```sql
SELECT COUNT(*) FROM unified_crm_detailed_view;
-- Attendu: 22239
```

### Vérifier les Sources
```sql
SELECT 
  COUNT(CASE WHEN has_crm THEN 1 END) as crm_count,
  COUNT(CASE WHEN has_hubspot THEN 1 END) as hubspot_count,
  COUNT(CASE WHEN has_apollo THEN 1 END) as apollo_count
FROM unified_crm_detailed_view;
-- Attendu: crm=22125, hubspot=54, apollo=634
```

### Tester un Filtre
```sql
SELECT * FROM unified_crm_detailed_view
WHERE zoho_status = 'Prospect chaud'
AND has_hubspot = true
LIMIT 10;
```

### Rafraîchir Manuellement
```sql
SELECT refresh_unified_view();
-- ou
REFRESH MATERIALIZED VIEW CONCURRENTLY unified_crm_detailed_view;
```

---

## Checklist Complète

### Fonctionnalités Core
- [ ] Affichage des 22k+ prospects
- [ ] Badges de source visibles
- [ ] Pagination fonctionnelle
- [ ] Recherche full-text
- [ ] Tri des colonnes

### Filtres
- [ ] Filtrage par source (CRM/HS/AP)
- [ ] Filtrage par statut CRM
- [ ] Filtrage par statut HubSpot
- [ ] Filtrage par statut Apollo
- [ ] Réinitialisation des filtres

### Édition
- [ ] Édition inline fonctionnelle
- [ ] Animation de feedback
- [ ] Toast de succès/erreur
- [ ] Mise à jour optimiste

### Configuration
- [ ] Configurateur de colonnes
- [ ] Sauvegarde localStorage
- [ ] Réinitialisation config

### Actions
- [ ] Rafraîchir la vue
- [ ] Exporter en Excel
- [ ] Sélection multiple
- [ ] Navigation détails

### Performance
- [ ] Cache React Query
- [ ] Debounce recherche
- [ ] Pagination serveur
- [ ] Temps de chargement < 500ms

### UX
- [ ] Responsive design
- [ ] Tooltips informatifs
- [ ] Gestion des erreurs
- [ ] Feedback visuel

---

## Résolution de Problèmes

### Problème : "No data available"
**Solution** :
1. Vérifier que la vue existe : `SELECT * FROM unified_crm_detailed_view LIMIT 1;`
2. Rafraîchir la vue : `SELECT refresh_unified_view();`
3. Vérifier les permissions RLS

### Problème : Badges de source manquants
**Solution** :
1. Vérifier que `isUnifiedView` est `true` dans `DataSourceTable`
2. Vérifier que les colonnes `has_crm`, `has_hubspot`, `has_apollo` existent
3. Inspecter les données dans la console : `console.log(row)`

### Problème : Filtres ne fonctionnent pas
**Solution** :
1. Vérifier les index SQL sur les colonnes de statut
2. Vérifier que `statusFilters` est passé au hook
3. Regarder la requête SQL dans la console réseau

### Problème : "Failed to refresh view"
**Solution** :
1. Vérifier que la fonction `refresh_unified_view()` existe
2. Vérifier les permissions : `GRANT EXECUTE ON FUNCTION refresh_unified_view() TO authenticated;`
3. Tester manuellement en SQL

---

## Métriques de Performance Attendues

| Action | Temps Attendu | Méthode de Mesure |
|--------|---------------|-------------------|
| Chargement initial | < 500ms | DevTools Network |
| Recherche (debounced) | < 400ms | Console timestamps |
| Filtrage | < 300ms | React Query devtools |
| Tri | < 300ms | Network tab |
| Édition inline | < 200ms | Animation feedback |
| Rafraîchissement vue | 2-5s | Edge function logs |
| Export Excel | 1-3s | Temps de téléchargement |

---

## Logs à Vérifier

### Console Navigateur
```
Fetching unified CRM data with params: {...}
Received unified CRM data: { data: [...], count: 22239 }
Row updated successfully: { rowId: "12345", updates: {...} }
```

### Supabase Logs (Edge Functions)
```
Refreshing unified view for user: abc-123
Vue matérialisée rafraîchie avec succès
```

### Network Tab
- Requête POST vers `unified_crm_detailed_view` : 200 OK
- Temps de réponse : < 500ms
- Payload : Filtres et pagination

---

## Conclusion

Si tous les tests passent ✅, la vue unifiée est prête pour la production !

**Prochaines étapes** :
1. Tests utilisateurs réels
2. Monitoring des performances en prod
3. Feedback et itérations


