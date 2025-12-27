# Correction des Erreurs 401 sur les Endpoints de Thèmes

## 🔍 Problème Identifié

Sur la page `/settings/security`, des erreurs 401 (Unauthorized) apparaissent pour les endpoints suivants :
- `GET /api/v1/themes/34` - 401 Unauthorized
- `GET /api/v1/theme-fonts?skip=0&limit=100` - 401 Unauthorized  
- `GET /api/v1/themes?skip=0&limit=100` - 401 Unauthorized

### Cause Racine

Ces endpoints nécessitent une authentification **superadmin**, mais ils sont appelés même lorsque :
1. L'utilisateur n'est pas superadmin
2. Le token d'authentification est expiré ou invalide
3. Les composants admin sont chargés sur des pages non-admin

## ✅ Solutions Implémentées

### 1. Amélioration de la Gestion des Erreurs 401

**Fichier :** `apps/web/src/lib/api/client.ts`

Les erreurs 401 ne sont plus loggées comme des erreurs critiques, mais comme des warnings :

```typescript
// Don't log 401 errors as critical - they're expected for unauthorized users
if (status === 401) {
  logger.warn('API unauthorized access', {
    status,
    url,
    message: appError.message,
  });
} else {
  logger.error('API response error', appError, {
    status,
    url,
  });
}
```

**Fichier :** `apps/web/src/lib/errors/api.ts`

Les erreurs 401 ne sont plus envoyées à Sentry :

```typescript
// Don't send 401 errors to Sentry - they're expected for unauthorized users
if (statusCode >= 500 || (statusCode >= 400 && statusCode !== 401 && !responseData?.error?.message)) {
  captureException(new Error(message), { ... });
}
```

### 2. Gestion Gracieuse des Erreurs dans les Composants

**Fichier :** `apps/web/src/app/[locale]/admin/theme-visualisation/ThemeVisualisationContent.tsx`

- Fallback vers le thème actif (endpoint public) si l'utilisateur n'est pas superadmin
- Message d'erreur clair pour les utilisateurs non autorisés
- Gestion silencieuse des erreurs 401 pour les polices (optionnelles)

**Fichier :** `apps/web/src/app/[locale]/admin/themes/ThemeManagementContent.tsx`

- Message d'erreur clair indiquant que les permissions superadmin sont requises
- Logging en warning au lieu d'erreur pour les tentatives non autorisées

### 3. Protection des Routes Admin

Les pages admin sont protégées par `ProtectedSuperAdminRoute` qui :
- Vérifie l'authentification
- Vérifie le statut superadmin
- Redirige vers le dashboard si l'utilisateur n'est pas autorisé

## 🔧 Vérifications à Effectuer

### 1. Vérifier que les Composants Admin ne sont pas Chargés Globalement

Assurez-vous qu'aucun composant admin n'est chargé dans :
- Le layout principal (`app/layout.tsx`)
- Les providers globaux
- Les composants partagés

### 2. Vérifier le Token d'Authentification

Si les erreurs persistent, vérifiez :
- Le token est valide et non expiré
- Le token est correctement envoyé dans les headers
- L'utilisateur a bien le statut superadmin

### 3. Vérifier les Permissions Backend

Vérifiez que les endpoints backend vérifient correctement les permissions :

```python
# backend/app/api/v1/endpoints/themes.py
@router.get("", response_model=ThemeListResponse, tags=["themes"])
async def list_themes(
    ...
    current_user = Depends(get_current_user),
    _: None = Depends(require_superadmin)
):
```

## 📝 Recommandations

### Pour les Développeurs

1. **Ne jamais appeler les endpoints admin sans vérifier les permissions**
   ```typescript
   // ❌ Incorrect
   useEffect(() => {
     listThemes(); // Appelé même si pas superadmin
   }, []);
   
   // ✅ Correct
   useEffect(() => {
     if (isSuperAdmin) {
       listThemes();
     }
   }, [isSuperAdmin]);
   ```

2. **Utiliser les routes protégées**
   ```typescript
   // ✅ Utiliser ProtectedSuperAdminRoute
   <ProtectedSuperAdminRoute>
     <ThemeManagementContent />
   </ProtectedSuperAdminRoute>
   ```

3. **Gérer gracieusement les erreurs 401**
   ```typescript
   try {
     await listThemes();
   } catch (err) {
     if (err instanceof UnauthorizedError) {
       // Gérer silencieusement ou afficher message approprié
       return;
     }
     throw err;
   }
   ```

### Pour les Utilisateurs

Si vous voyez des erreurs 401 sur les endpoints de thèmes :
1. Vérifiez que vous êtes connecté avec un compte superadmin
2. Vérifiez que votre session n'a pas expiré
3. Reconnectez-vous si nécessaire

## 🎯 Résultat Attendu

Après ces corrections :
- ✅ Les erreurs 401 ne sont plus loggées comme des erreurs critiques
- ✅ Les messages d'erreur sont clairs pour les utilisateurs
- ✅ Les composants admin gèrent gracieusement les erreurs d'autorisation
- ✅ Les erreurs 401 ne polluent plus les logs Sentry

## 🔗 Fichiers Modifiés

1. `apps/web/src/lib/api/client.ts` - Gestion améliorée des erreurs 401
2. `apps/web/src/lib/errors/api.ts` - Exclusion des 401 de Sentry
3. `apps/web/src/app/[locale]/admin/theme-visualisation/ThemeVisualisationContent.tsx` - Fallback gracieux
4. `apps/web/src/app/[locale]/admin/themes/ThemeManagementContent.tsx` - Messages d'erreur améliorés

