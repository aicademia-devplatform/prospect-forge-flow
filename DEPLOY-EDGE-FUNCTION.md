# 🚨 Déploiement manuel de l'Edge Function csv-import

Le service de déploiement Supabase rencontre actuellement des erreurs 500. Voici comment déployer manuellement :

## Option 1 : Via le Dashboard Supabase (RECOMMANDÉ)

1. **Accédez au Dashboard Supabase** :

   - URL : https://supabase.com/dashboard/project/hzcsalwomlnumwurozuz/functions

2. **Ouvrez l'Edge Function `csv-import`** :

   - Cliquez sur `csv-import` dans la liste des fonctions

3. **Copiez le code** :

   - Ouvrez le fichier `supabase/functions/csv-import/index.ts`
   - Copiez tout le contenu

4. **Remplacez le code dans le dashboard** :
   - Collez le code dans l'éditeur
   - Cliquez sur "Save" ou "Deploy"

## Option 2 : Attendre que le service se rétablisse

Le service Supabase peut avoir des problèmes temporaires. Réessayez dans 10-15 minutes :

```bash
npx supabase functions deploy csv-import --project-ref hzcsalwomlnumwurozuz
```

## Option 3 : Utiliser l'API Supabase Management

Si les deux options ci-dessus ne fonctionnent pas, contactez le support Supabase :
https://supabase.com/support

## 📝 Code à déployer

Le fichier se trouve dans : `supabase/functions/csv-import/index.ts`

### Vérifications après déploiement

1. Vérifiez que la fonction est bien déployée :

   ```bash
   npx supabase functions list --project-ref hzcsalwomlnumwurozuz
   ```

2. Testez l'importation avec un petit fichier CSV de test

3. Vérifiez les logs si nécessaire :
   ```bash
   npx supabase functions logs csv-import --project-ref hzcsalwomlnumwurozuz
   ```

## 🔍 Problème actuel

- **Erreur** : `Function deploy failed due to an internal error`
- **Code** : 500
- **Cause** : Problème interne du service Supabase
- **Solution temporaire** : Déploiement manuel via le dashboard

---

**Dernière tentative** : ${new Date().toISOString()}
**Statut** : En attente de résolution du service Supabase
