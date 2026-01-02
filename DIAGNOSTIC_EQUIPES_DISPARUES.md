# Diagnostic : Pages Équipes Disparues

**Date** : 2024  
**URL affectée** : https://modeleweb-production-f341.up.railway.app/fr/dashboard/projets/equipes  
**Statut** : 🔍 En investigation

---

## 🔍 Constatations

### ✅ Ce qui fonctionne

1. **Page existe** : `apps/web/src/app/[locale]/dashboard/projets/equipes/page.tsx` ✅
2. **Menu de navigation** : L'item "Équipes" est présent dans le menu (ligne 182-184 de `navigation/index.tsx`) ✅
3. **Hooks React Query** : `useTeams()` et `useCreateTeam()` sont définis dans `queries.ts` ✅
4. **API Teams** : Les endpoints API existent dans `@/lib/api/teams.ts` ✅

### ⚠️ Problèmes potentiels identifiés

#### 1. Incohérence dans les imports de `queries.ts`

**Fichier** : `apps/web/src/lib/query/queries.ts`

Il y a **deux imports différents** pour teamsAPI :

```typescript
import { 
  teamsAPI,  // ← De @/lib/api (ligne 12)
  ...
} from '@/lib/api';

import { teamsAPI as teamsAPIClient } from '@/lib/api/teams';  // ← De @/lib/api/teams (ligne 15)
```

**Problème** : `useTeams()` utilise `teamsAPI.list()` (ligne 217) qui vient de `@/lib/api`, mais les autres hooks utilisent `teamsAPIClient` de `@/lib/api/teams`.

**Impact** : Possible incohérence dans le format de réponse de l'API.

#### 2. Format de réponse API

La page `equipes/page.tsx` s'attend à recevoir les données dans un format spécifique :

```typescript
const teamsData = useMemo(() => {
  if (!teamsResponse) return null;
  if (Array.isArray(teamsResponse)) {
    return teamsResponse;
  }
  if (teamsResponse && typeof teamsResponse === 'object' && 'data' in teamsResponse) {
    const data = extractApiData<{ teams: TeamType[]; total: number }>(teamsResponse as any);
    return data?.teams || [];
  }
  return [];
}, [teamsResponse]);
```

**Problème** : Si `teamsAPI.list()` de `@/lib/api` retourne un format différent de `teamsAPIClient.list()` de `@/lib/api/teams`, cela peut causer des erreurs.

---

## 🔧 Solutions Recommandées

### Solution 1 : Uniformiser l'utilisation de teamsAPI

**Fichier** : `apps/web/src/lib/query/queries.ts`

Modifier `useTeams()` pour utiliser `teamsAPIClient` comme les autres hooks :

```typescript
export function useTeams() {
  return useQuery({
    queryKey: queryKeys.teams.all,
    queryFn: async () => {
      const response = await teamsAPIClient.list();
      return extractApiData(response);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
```

### Solution 2 : Vérifier les erreurs de build

**Action** : Vérifier les logs de build/deploiement pour voir s'il y a des erreurs TypeScript ou de compilation.

**Commandes à exécuter** :
```bash
# Vérifier les erreurs TypeScript
npm run type-check

# Vérifier les erreurs de build
npm run build
```

### Solution 3 : Vérifier les erreurs dans la console navigateur

**Action** : Ouvrir la console du navigateur (F12) sur la page `/dashboard/projets/equipes` et vérifier :
- Erreurs JavaScript
- Erreurs de réseau (requêtes API échouées)
- Erreurs React (boundary errors)

### Solution 4 : Vérifier l'authentification

**Problème potentiel** : La page affiche "Verifying authentication..." et reste bloquée.

**Vérifications** :
1. Le token d'authentification est-il valide ?
2. L'utilisateur a-t-il les permissions nécessaires ?
3. Y a-t-il des erreurs CORS ou d'authentification dans les logs backend ?

---

## 📋 Checklist de Diagnostic

- [ ] Vérifier les logs de build/deploiement Railway
- [ ] Vérifier la console navigateur pour erreurs JavaScript
- [ ] Vérifier les requêtes réseau (onglet Network) pour voir si `/v1/teams` est appelé
- [ ] Vérifier les logs backend pour erreurs API
- [ ] Tester l'endpoint API directement : `GET /v1/teams`
- [ ] Vérifier que l'utilisateur est bien authentifié
- [ ] Vérifier les permissions RBAC pour l'accès aux équipes
- [ ] Uniformiser l'utilisation de `teamsAPIClient` dans `useTeams()`

---

## 🎯 Actions Immédiates

### 1. Corriger `useTeams()` dans `queries.ts`

**Fichier** : `apps/web/src/lib/query/queries.ts` (ligne 214-219)

**Changement** :
```typescript
// AVANT
export function useTeams() {
  return useQuery({
    queryKey: queryKeys.teams.all,
    queryFn: () => teamsAPI.list(),
  });
}

// APRÈS
export function useTeams() {
  return useQuery({
    queryKey: queryKeys.teams.all,
    queryFn: async () => {
      const response = await teamsAPIClient.list();
      return extractApiData(response);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
```

### 2. Vérifier les logs Railway

**Action** : Aller dans Railway → Service → Logs et chercher :
- Erreurs de build
- Erreurs runtime
- Erreurs API `/v1/teams`

### 3. Tester l'endpoint API

**Action** : Tester directement l'endpoint :
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://modeleweb-production-f341.up.railway.app/api/v1/teams
```

---

## 🔍 Hypothèses

### Hypothèse 1 : Erreur de build
- **Cause** : Erreur TypeScript ou de compilation non détectée
- **Solution** : Vérifier les logs de build

### Hypothèse 2 : Erreur API
- **Cause** : L'endpoint `/v1/teams` retourne une erreur ou un format incorrect
- **Solution** : Vérifier les logs backend et tester l'endpoint

### Hypothèse 3 : Problème d'authentification
- **Cause** : L'utilisateur n'est pas authentifié ou le token est expiré
- **Solution** : Vérifier l'authentification et les permissions

### Hypothèse 4 : Incohérence dans les imports
- **Cause** : `teamsAPI.list()` retourne un format différent de ce que la page attend
- **Solution** : Uniformiser avec `teamsAPIClient` (Solution 1)

---

## 📝 Notes

- La page semble bloquée sur "Verifying authentication..." selon le contenu web fourni
- Cela suggère un problème d'authentification ou de chargement initial
- Le menu contient bien "Équipes", donc le problème n'est pas dans la navigation
- Le code de la page semble correct, donc le problème est probablement dans :
  - L'authentification
  - L'API backend
  - Le format de réponse de l'API

---

## ✅ Conclusion

**Problème probable** : 
1. Erreur d'authentification (page bloquée sur "Verifying authentication...")
2. Incohérence dans l'utilisation de `teamsAPI` vs `teamsAPIClient`

**Action recommandée** : 
1. Corriger `useTeams()` pour utiliser `teamsAPIClient` (Solution 1)
2. Vérifier les logs Railway pour erreurs d'authentification/API
3. Tester l'endpoint API directement
