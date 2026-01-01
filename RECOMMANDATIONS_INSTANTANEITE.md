# 🚀 RECOMMANDATIONS POUR L'INSTANTANÉITÉ

## 🎯 OBJECTIF
Rendre les mises à jour des permissions **instantanées** (ou presque) dans l'interface, sans délai perceptible.

---

## ✅ SOLUTION 1: Invalider le cache immédiatement après sauvegarde

### Problème actuel
Le cache n'est invalidé que via l'événement, ce qui peut causer un délai.

### Solution
Invalider le cache **directement** dans `savePermissions()` avant de dispatcher l'événement.

**Fichier:** `apps/web/src/components/employes/EmployeePortalPermissionsEditor.tsx`

```typescript
// Dans savePermissions(), après setSavedModules/setSavedClients:
import { permissionsCache, getCacheKey } from '@/hooks/useEmployeePortalPermissions';

const savePermissions = async (modules: Set<string>, clients: Set<number>) => {
  try {
    // ... code existant ...
    
    // Mettre à jour les états sauvegardés
    setSavedModules(new Set(modules));
    setSavedClients(new Set(clients));
    
    // ✅ NOUVEAU: Invalider le cache IMMÉDIATEMENT
    const cacheKey = getCacheKey(employeeId);
    if (cacheKey && cacheKey !== 'none') {
      permissionsCache.delete(cacheKey);
    }
    
    // Déclencher l'événement (les listeners invalideront aussi, mais c'est OK)
    Promise.resolve().then(() => {
      window.dispatchEvent(new CustomEvent('employee-portal-permissions-updated', {
        detail: { employeeId }
      }));
    });
  } catch (err) {
    // ... error handling ...
  }
};
```

**Impact:** ⚡ Cache invalidé **immédiatement**, pas besoin d'attendre l'événement.

---

## ✅ SOLUTION 2: Exporter les fonctions de cache depuis le hook

### Problème actuel
Le cache est privé dans le hook, on ne peut pas l'invalider depuis l'éditeur.

### Solution
Exporter les fonctions de gestion du cache.

**Fichier:** `apps/web/src/hooks/useEmployeePortalPermissions.ts`

```typescript
// Exporter les fonctions de cache
export const permissionsCache = new Map<string, { data: EmployeePortalPermissionSummary; timestamp: number }>();
export const CACHE_DURATION = 60 * 1000; // 1 minute

export function getCacheKey(employeeId?: number, userId?: number | string): string {
  if (employeeId) return `employee:${employeeId}`;
  if (userId) return `user:${userId}`;
  return 'none';
}

export function invalidateCache(employeeId?: number, userId?: number | string): void {
  const key = getCacheKey(employeeId, userId);
  if (key && key !== 'none') {
    permissionsCache.delete(key);
  }
}
```

**Impact:** 🔧 Permet d'invalider le cache depuis n'importe où.

---

## ✅ SOLUTION 3: Utiliser Promise.resolve() au lieu de setTimeout(0)

### Problème actuel
`setTimeout(..., 0)` peut causer des race conditions et des délais imprévisibles.

### Solution
Utiliser `Promise.resolve().then()` qui est plus prévisible.

**Fichier:** `apps/web/src/components/employes/EmployeePortalPermissionsEditor.tsx`

```typescript
// Remplacer setTimeout par Promise.resolve()
Promise.resolve().then(() => {
  window.dispatchEvent(new CustomEvent('employee-portal-permissions-updated', {
    detail: { employeeId }
  }));
});
```

**Impact:** ⚡ Événement dispatché plus rapidement et de manière plus prévisible.

---

## ✅ SOLUTION 4: Réduire la durée du cache à 10 secondes

### Problème actuel
Cache de 60 secondes = trop long pour des mises à jour en temps réel.

### Solution
Réduire à 10-30 secondes pour un meilleur équilibre performance/fraîcheur.

**Fichier:** `apps/web/src/hooks/useEmployeePortalPermissions.ts`

```typescript
const CACHE_DURATION = 10 * 1000; // 10 secondes au lieu de 60
```

**Impact:** ⚡ Cache expire plus rapidement, données plus fraîches.

---

## ✅ SOLUTION 5: Mettre à jour le cache avec les nouvelles données après sauvegarde

### Problème actuel
Le cache est invalidé, mais on doit attendre le rechargement depuis le serveur.

### Solution
Mettre à jour le cache **directement** avec les nouvelles données après sauvegarde.

**Fichier:** `apps/web/src/components/employes/EmployeePortalPermissionsEditor.tsx`

```typescript
import { setCachedPermissions, getCacheKey } from '@/hooks/useEmployeePortalPermissions';

const savePermissions = async (modules: Set<string>, clients: Set<number>) => {
  try {
    // ... code existant (delete + bulkCreate) ...
    
    // Mettre à jour les états sauvegardés
    setSavedModules(new Set(modules));
    setSavedClients(new Set(clients));
    
    // ✅ NOUVEAU: Mettre à jour le cache avec les nouvelles données
    const cacheKey = getCacheKey(employeeId);
    if (cacheKey && cacheKey !== 'none') {
      const newSummary: EmployeePortalPermissionSummary = {
        user_id: null,
        employee_id: employeeId,
        pages: ['*'], // Pages de base toujours accessibles
        modules: Array.from(modules),
        projects: [],
        clients: Array.from(clients),
        all_projects: false,
        all_clients: false,
      };
      setCachedPermissions(cacheKey, newSummary);
    }
    
    // Déclencher l'événement
    Promise.resolve().then(() => {
      window.dispatchEvent(new CustomEvent('employee-portal-permissions-updated', {
        detail: { employeeId }
      }));
    });
  } catch (err) {
    // ... error handling ...
  }
};
```

**Impact:** ⚡⚡⚡ **INSTANTANÉ** - Le cache contient immédiatement les nouvelles données, pas besoin d'attendre le serveur.

---

## ✅ SOLUTION 6: Exporter setCachedPermissions depuis le hook

### Problème actuel
`setCachedPermissions` est privée dans le hook.

### Solution
L'exporter pour pouvoir l'utiliser dans l'éditeur.

**Fichier:** `apps/web/src/hooks/useEmployeePortalPermissions.ts`

```typescript
export function setCachedPermissions(key: string, data: EmployeePortalPermissionSummary): void {
  permissionsCache.set(key, {
    data,
    timestamp: Date.now(),
  });
}
```

**Impact:** 🔧 Permet de mettre à jour le cache depuis l'éditeur.

---

## ✅ SOLUTION 7: Supprimer le préchargement inutile dans layout.tsx

### Problème actuel
Le préchargement ne met pas à jour le cache du hook, donc inutile.

### Solution
Supprimer le préchargement ou le rendre utile.

**Fichier:** `apps/web/src/app/[locale]/portail-employe/layout.tsx`

```typescript
// Option 1: Supprimer complètement
const [employeeData] = await Promise.all([
  employeesAPI.get(employeeId),
  // ❌ Supprimer: employeePortalPermissionsAPI.getSummaryForEmployee(employeeId).catch(() => null),
]);

// Option 2: Garder mais ne pas précharger (le hook le fera)
// Juste charger l'employé
const employeeData = await employeesAPI.get(employeeId);
```

**Impact:** ⚡ Évite un appel API inutile.

---

## ✅ SOLUTION 8: Centraliser l'invalidation dans le hook uniquement

### Problème actuel
Double invalidation (hook + navigation).

### Solution
L'invalidation dans `EmployeePortalNavigation` n'est pas nécessaire si le hook le fait déjà.

**Fichier:** `apps/web/src/components/employes/EmployeePortalNavigation.tsx`

```typescript
// Simplifier: juste appeler reloadPermissions(), pas besoin d'invalider manuellement
useEffect(() => {
  const handlePermissionsUpdate = (event: CustomEvent) => {
    const eventEmployeeId = event.detail?.employeeId;
    if (eventEmployeeId === employeeId) {
      // Le hook invalide déjà le cache, on a juste besoin de recharger
      reloadPermissions();
    }
  };
  
  window.addEventListener('employee-portal-permissions-updated', handlePermissionsUpdate as EventListener);
  
  return () => {
    window.removeEventListener('employee-portal-permissions-updated', handlePermissionsUpdate as EventListener);
  };
}, [reloadPermissions, employeeId]);
```

**Impact:** 🔧 Code plus simple, moins de duplication.

---

## 🎯 SOLUTION RECOMMANDÉE (Combo)

**Pour une instantanéité maximale, combiner:**

1. ✅ **Solution 5** (Mettre à jour le cache directement) - **INSTANTANÉ**
2. ✅ **Solution 2** (Exporter les fonctions de cache) - **NÉCESSAIRE**
3. ✅ **Solution 3** (Promise.resolve au lieu de setTimeout) - **AMÉLIORATION**
4. ✅ **Solution 4** (Réduire cache à 10s) - **BONUS**

**Résultat attendu:**
- ⚡ **0ms de délai** dans l'éditeur (mise à jour optimiste)
- ⚡ **0ms de délai** dans le portail (cache mis à jour directement)
- ⚡ **Pas d'appel API** nécessaire pour voir les changements
- ⚡ **Synchronisation automatique** via l'événement pour les autres composants

---

## 📊 COMPARAISON AVANT/APRÈS

### Avant
```
Sauvegarde → API (400ms) → Événement (16ms) → Invalidation cache → Rechargement API (200ms) → Affichage
Total: ~616ms
```

### Après (avec Solution 5)
```
Sauvegarde → API (400ms) → Mise à jour cache (0ms) → Événement (0ms) → Affichage immédiat
Total: ~400ms (et l'UI est déjà à jour avant même la fin de l'API)
```

**Gain:** ⚡ **216ms de délai en moins** + **affichage instantané** dans l'UI.

---

## 🚨 POINT D'ATTENTION

**Important:** Si l'API échoue après la mise à jour du cache, il faut:
1. Restaurer l'ancien état
2. Invalider le cache
3. Recharger depuis le serveur

**Solution:**
```typescript
const savePermissions = async (modules: Set<string>, clients: Set<number>) => {
  // Sauvegarder l'ancien état
  const oldModules = new Set(savedModules);
  const oldClients = new Set(savedClients);
  const oldCacheKey = getCacheKey(employeeId);
  const oldCachedData = oldCacheKey ? getCachedPermissions(oldCacheKey) : null;
  
  try {
    // Mise à jour optimiste
    setSavedModules(new Set(modules));
    setSavedClients(new Set(clients));
    
    // Mise à jour du cache
    if (oldCacheKey && oldCacheKey !== 'none') {
      const newSummary = { /* ... */ };
      setCachedPermissions(oldCacheKey, newSummary);
    }
    
    // Appels API
    await employeePortalPermissionsAPI.deleteAllForEmployee(employeeId);
    if (newPermissions.length > 0) {
      await employeePortalPermissionsAPI.bulkCreate({...});
    }
    
    // ✅ Succès - les données sont déjà à jour
  } catch (err) {
    // ❌ Erreur - restaurer l'ancien état
    setSavedModules(oldModules);
    setSavedClients(oldClients);
    
    if (oldCacheKey && oldCacheKey !== 'none' && oldCachedData) {
      setCachedPermissions(oldCacheKey, oldCachedData);
    }
    
    throw err;
  }
};
```

---

## ✅ CHECKLIST D'IMPLÉMENTATION

- [ ] Exporter `permissionsCache`, `getCacheKey`, `setCachedPermissions`, `invalidateCache` depuis le hook
- [ ] Importer ces fonctions dans `EmployeePortalPermissionsEditor`
- [ ] Mettre à jour le cache directement après `setSavedModules/setSavedClients`
- [ ] Remplacer `setTimeout(0)` par `Promise.resolve().then()`
- [ ] Réduire `CACHE_DURATION` à 10 secondes
- [ ] Ajouter la gestion d'erreur pour restaurer l'ancien cache en cas d'échec API
- [ ] Supprimer le préchargement inutile dans `layout.tsx`
- [ ] Tester que les permissions s'affichent instantanément après sauvegarde
- [ ] Tester que le hard refresh charge bien les bonnes permissions depuis la BDD

---

## 🎉 RÉSULTAT FINAL ATTENDU

- ✅ **Sauvegarde instantanée** dans l'UI (mise à jour optimiste)
- ✅ **Portail mis à jour instantanément** (cache mis à jour directement)
- ✅ **Pas de délai perceptible** pour l'utilisateur
- ✅ **Synchronisation automatique** entre tous les composants
- ✅ **Robuste** en cas d'erreur API (rollback automatique)
