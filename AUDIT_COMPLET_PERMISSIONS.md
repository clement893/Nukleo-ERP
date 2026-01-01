# 🔍 AUDIT COMPLET - PROBLÈME DE PERMISSIONS

## 📋 SYMPTÔMES RAPPORTÉS

1. **Délai dans l'application des permissions dans le portail employé**
   - Même avec un hard refresh
   
2. **Hard refresh fait disparaître les permissions**
   - Les permissions disparaissent visuellement
   - Mais elles réapparaissent plusieurs minutes plus tard
   - Les changements sont bien fait en BDD (confirmé)

3. **Les permissions ne sont pas instantanées**
   - Après sauvegarde, il y a toujours un délai

---

## 🔍 ANALYSE DU CODE ACTUEL

### 1. Flow de Sauvegarde (EmployeePortalPermissionsEditor)

**Fichier:** `apps/web/src/components/employes/EmployeePortalPermissionsEditor.tsx`

#### Étape 1: `savePermissions()` - Ligne 306

```typescript
const savePermissions = async (modules: Set<string>, clients: Set<number>) => {
  // 1. Sauvegarder l'ancien état pour rollback
  const oldModules = new Set(savedModules);
  const oldClients = new Set(savedClients);
  const cacheKey = getCacheKey(employeeId);
  const oldCachedData = cacheKey && cacheKey !== 'none' 
    ? permissionsCache.get(cacheKey)?.data || null 
    : null;
  
  try {
    // 2. DELETE toutes les permissions
    await employeePortalPermissionsAPI.deleteAllForEmployee(employeeId);
    
    // 3. CREATE nouvelles permissions
    if (newPermissions.length > 0) {
      await employeePortalPermissionsAPI.bulkCreate({...});
    }
    
    // 4. Mise à jour optimiste des états locaux
    setSavedModules(new Set(modules));
    setSavedClients(new Set(clients));
    
    // 5. ✅ Mise à jour du cache DIRECTEMENT
    if (cacheKey && cacheKey !== 'none') {
      const newSummary: EmployeePortalPermissionSummary = {
        user_id: null,
        employee_id: employeeId,
        pages: ['*'],
        modules: Array.from(modules),
        projects: [],
        clients: Array.from(clients),
        all_projects: false,
        all_clients: false,
      };
      setCachedPermissions(cacheKey, newSummary);
    }
    
    // 6. Dispatch événement
    Promise.resolve().then(() => {
      window.dispatchEvent(new CustomEvent('employee-portal-permissions-updated', {
        detail: { employeeId }
      }));
    });
  } catch (err) {
    // Rollback...
  }
}
```

**✅ Points positifs:**
- Cache mis à jour directement
- Événement dispatché
- Mise à jour optimiste des états

**❌ Problèmes potentiels:**
- L'événement est dispatché APRÈS la mise à jour du cache, mais les listeners peuvent ne pas être synchronisés
- Le cache est mis à jour AVANT que les autres composants ne soient notifiés

---

### 2. Flow de Chargement (EmployeePortalNavigation)

**Fichier:** `apps/web/src/components/employes/EmployeePortalNavigation.tsx`

#### Étape 1: Hook useEmployeePortalPermissions - Ligne 123

```typescript
const { hasModuleAccess, loading: permissionsLoading, reload: reloadPermissions } = useEmployeePortalPermissions({ employeeId });
```

#### Étape 2: Écoute de l'événement - Ligne 126

```typescript
useEffect(() => {
  const handlePermissionsUpdate = (event: CustomEvent) => {
    const eventEmployeeId = event.detail?.employeeId;
    if (eventEmployeeId === employeeId) {
      reloadPermissions(); // Appelle reload() du hook
    }
  };
  
  window.addEventListener('employee-portal-permissions-updated', handlePermissionsUpdate as EventListener);
  
  return () => {
    window.removeEventListener('employee-portal-permissions-updated', handlePermissionsUpdate as EventListener);
  };
}, [reloadPermissions, employeeId]);
```

**✅ Points positifs:**
- Écoute l'événement
- Appelle `reloadPermissions()`

**❌ Problèmes potentiels:**
- `reloadPermissions` est dans les dépendances du useEffect, ce qui peut causer des re-renders
- Le reload peut ne pas être synchronisé avec la mise à jour du cache

---

### 3. Hook useEmployeePortalPermissions

**Fichier:** `apps/web/src/hooks/useEmployeePortalPermissions.ts`

#### Étape 1: Écoute de l'événement - Ligne 175

```typescript
useEffect(() => {
  if (!employeeId) return;
  
  const handlePermissionsUpdate = (event: CustomEvent) => {
    const eventEmployeeId = event.detail?.employeeId;
    if (eventEmployeeId === employeeId) {
      // Invalider le cache pour cet employé
      const currentCacheKey = getCacheKey(employeeId);
      if (currentCacheKey && currentCacheKey !== 'none') {
        permissionsCache.delete(currentCacheKey); // ❌ PROBLÈME ICI
      }
      // Recharger les permissions depuis le serveur
      initialLoadRef.current = false;
      setReloadTrigger(prev => prev + 1);
    }
  };
  
  window.addEventListener('employee-portal-permissions-updated', handlePermissionsUpdate as EventListener);
  
  return () => {
    window.removeEventListener('employee-portal-permissions-updated', handlePermissionsUpdate as EventListener);
  };
}, [employeeId]);
```

**❌ PROBLÈME CRITIQUE IDENTIFIÉ:**

Le hook **INVALIDE LE CACHE** quand il reçoit l'événement `employee-portal-permissions-updated`, mais `savePermissions()` vient juste de **METTRE À JOUR LE CACHE** avec les nouvelles données !

**Séquence problématique:**
```
1. savePermissions() met à jour le cache avec nouvelles données
2. savePermissions() dispatche l'événement
3. useEmployeePortalPermissions reçoit l'événement
4. useEmployeePortalPermissions INVALIDE LE CACHE (supprime les nouvelles données !)
5. useEmployeePortalPermissions recharge depuis le serveur (avec délai)
```

C'est pourquoi il y a un délai ! Le cache est invalidé juste après avoir été mis à jour.

---

#### Étape 2: loadPermissions() - Ligne 64

```typescript
const loadPermissions = async () => {
  if (employeeId) {
    const currentCache = getCachedPermissions(cacheKey);
    
    // Si on a un cache valide et que c'est le premier chargement, utiliser le cache et ne pas recharger
    if (currentCache && !initialLoadRef.current) {
      setPermissions(currentCache);
      initialLoadRef.current = true;
      setLoading(false);
      return; // Ne pas recharger si on a un cache valide au premier chargement
    }
    
    try {
      if (!currentCache) {
        setLoading(true);
      }
      setError(null);
      const summary = await employeePortalPermissionsAPI.getSummaryForEmployee(employeeId);
      setPermissions(summary);
      setCachedPermissions(cacheKey, summary);
      initialLoadRef.current = true;
    } catch (err) {
      // ...
    } finally {
      setLoading(false);
    }
  }
}
```

**❌ PROBLÈME:**

Quand `reload()` est appelé, il invalide le cache puis déclenche `loadPermissions()`. Mais si le cache vient d'être mis à jour par `savePermissions()`, il est invalidé puis rechargé depuis le serveur, ce qui cause un délai.

---

### 4. Flow de Chargement (EmployeePortalPermissionsEditor.loadData)

**Fichier:** `apps/web/src/components/employes/EmployeePortalPermissionsEditor.tsx`

#### loadData() - Ligne 58

```typescript
const loadData = async () => {
  try {
    const cacheKey = getCacheKey(employeeId);
    const cachedSummary = cacheKey && cacheKey !== 'none' ? getCachedPermissions(cacheKey) : null;
    
    // Si on a un cache valide, l'utiliser immédiatement
    if (cachedSummary) {
      // Afficher immédiatement avec les données du cache
      // ... mise à jour de l'UI ...
      setLoading(false);
      
      // Charger les détails en arrière-plan
      Promise.all([...]).then(([freshSummary, permissionsData]) => {
        // Mettre à jour avec les données fraîches
      });
      
      return; // Sortir tôt
    }
    
    // Pas de cache, charger normalement
    // ...
  }
}
```

**✅ Points positifs:**
- Utilise le cache si disponible
- Affiche immédiatement

**❌ Problèmes potentiels:**
- Le chargement en arrière-plan peut écraser les données du cache
- Pas de vérification si les données fraîches sont différentes

---

## 🐛 PROBLÈMES IDENTIFIÉS

### PROBLÈME #1: INVALIDATION DU CACHE APRÈS SAUVEGARDE (CRITIQUE)

**Localisation:** `useEmployeePortalPermissions.ts` ligne 185

**Description:**
Quand `savePermissions()` met à jour le cache puis dispatche l'événement, le hook `useEmployeePortalPermissions` **invalide le cache** au lieu de l'utiliser. Cela force un rechargement depuis le serveur, causant un délai.

**Solution:**
Ne PAS invalider le cache dans `handlePermissionsUpdate`. Au lieu de cela, **utiliser directement le cache** qui vient d'être mis à jour, ou **recharger depuis le serveur mais utiliser le cache en attendant**.

---

### PROBLÈME #2: RACE CONDITION ENTRE CACHE ET ÉVÉNEMENT

**Description:**
Il y a une race condition entre:
1. La mise à jour du cache dans `savePermissions()`
2. L'invalidation du cache dans `handlePermissionsUpdate()`

Si l'événement arrive avant que le cache ne soit mis à jour, ou si le cache est invalidé après avoir été mis à jour, on perd les données.

---

### PROBLÈME #3: HARD REFRESH = CACHE VIDE

**Description:**
Après un hard refresh, le cache JavaScript est vidé (car il est en mémoire). Donc `loadData()` et `loadPermissions()` doivent charger depuis le serveur. Si le serveur met du temps à répondre, il y a un délai.

**Solution possible:**
Utiliser `localStorage` ou `sessionStorage` pour persister le cache entre les rafraîchissements.

---

### PROBLÈME #4: DOUBLE INVALIDATION

**Description:**
- `EmployeePortalNavigation` appelle `reloadPermissions()` qui invalide le cache
- `useEmployeePortalPermissions` invalide aussi le cache dans `handlePermissionsUpdate`

C'est redondant et peut causer des problèmes.

---

## 🔧 SOLUTIONS PROPOSÉES

### SOLUTION 1: Ne pas invalider le cache dans handlePermissionsUpdate

**Fichier:** `apps/web/src/hooks/useEmployeePortalPermissions.ts`

```typescript
useEffect(() => {
  if (!employeeId) return;
  
  const handlePermissionsUpdate = (event: CustomEvent) => {
    const eventEmployeeId = event.detail?.employeeId;
    if (eventEmployeeId === employeeId) {
      // ✅ NE PAS INVALIDER LE CACHE
      // Le cache vient d'être mis à jour par savePermissions()
      // Vérifier si le cache existe et l'utiliser directement
      const currentCacheKey = getCacheKey(employeeId);
      const cachedData = currentCacheKey && currentCacheKey !== 'none' 
        ? getCachedPermissions(currentCacheKey) 
        : null;
      
      if (cachedData) {
        // Utiliser le cache directement
        setPermissions(cachedData);
        setLoading(false);
      } else {
        // Pas de cache, recharger depuis le serveur
        initialLoadRef.current = false;
        setReloadTrigger(prev => prev + 1);
      }
    }
  };
  
  window.addEventListener('employee-portal-permissions-updated', handlePermissionsUpdate as EventListener);
  
  return () => {
    window.removeEventListener('employee-portal-permissions-updated', handlePermissionsUpdate as EventListener);
  };
}, [employeeId]);
```

---

### SOLUTION 2: Utiliser le cache directement au lieu de reload

**Fichier:** `apps/web/src/components/employes/EmployeePortalNavigation.tsx`

Au lieu d'appeler `reloadPermissions()` qui invalide le cache, utiliser directement le cache mis à jour.

```typescript
useEffect(() => {
  const handlePermissionsUpdate = (event: CustomEvent) => {
    const eventEmployeeId = event.detail?.employeeId;
    if (eventEmployeeId === employeeId) {
      // Ne pas appeler reloadPermissions() car ça invalide le cache
      // Le hook devrait automatiquement utiliser le cache mis à jour
      // Forcer un re-render en changeant une dépendance si nécessaire
    }
  };
  
  window.addEventListener('employee-portal-permissions-updated', handlePermissionsUpdate as EventListener);
  
  return () => {
    window.removeEventListener('employee-portal-permissions-updated', handlePermissionsUpdate as EventListener);
  };
}, [employeeId]); // Retirer reloadPermissions des dépendances
```

---

### SOLUTION 3: Persister le cache dans sessionStorage

**Fichier:** `apps/web/src/hooks/useEmployeePortalPermissions.ts`

```typescript
// Sauvegarder le cache dans sessionStorage pour persister entre les rafraîchissements
function setCachedPermissions(key: string, data: EmployeePortalPermissionSummary): void {
  permissionsCache.set(key, {
    data,
    timestamp: Date.now(),
  });
  
  // ✅ Persister dans sessionStorage
  try {
    sessionStorage.setItem(`perm_cache_${key}`, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
  } catch (e) {
    // Ignorer si sessionStorage n'est pas disponible
  }
}

function getCachedPermissions(key: string): EmployeePortalPermissionSummary | null {
  // Vérifier le cache en mémoire d'abord
  const cached = permissionsCache.get(key);
  if (cached) {
    const now = Date.now();
    if (now - cached.timestamp > CACHE_DURATION) {
      permissionsCache.delete(key);
    } else {
      return cached.data;
    }
  }
  
  // ✅ Vérifier sessionStorage si le cache mémoire est vide
  try {
    const stored = sessionStorage.getItem(`perm_cache_${key}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      const now = Date.now();
      if (now - parsed.timestamp <= CACHE_DURATION) {
        // Restaurer dans le cache mémoire
        permissionsCache.set(key, parsed);
        return parsed.data;
      } else {
        sessionStorage.removeItem(`perm_cache_${key}`);
      }
    }
  } catch (e) {
    // Ignorer si sessionStorage n'est pas disponible
  }
  
  return null;
}
```

---

## 🎯 SOLUTION RECOMMANDÉE (Combo)

Combiner les solutions 1 et 3:
1. Ne PAS invalider le cache dans `handlePermissionsUpdate`
2. Utiliser directement le cache mis à jour
3. Persister le cache dans `sessionStorage` pour les hard refresh

---

## 📊 TEST PLAN

Pour vérifier que les solutions fonctionnent:

1. **Test 1: Sauvegarde immédiate**
   - Modifier les permissions
   - Vérifier que le portail se met à jour immédiatement (sans délai)

2. **Test 2: Hard refresh**
   - Modifier les permissions
   - Faire un hard refresh
   - Vérifier que les permissions sont toujours visibles (grâce à sessionStorage)

3. **Test 3: Navigation**
   - Modifier les permissions dans l'éditeur
   - Ouvrir le portail employé dans un autre onglet
   - Vérifier que les permissions sont à jour

---

## 🔍 POINTS À VÉRIFIER

1. ✅ Le cache est bien mis à jour dans `savePermissions()`
2. ❌ Le cache est invalidé dans `handlePermissionsUpdate()` (PROBLÈME)
3. ✅ L'événement est bien dispatché
4. ✅ Les composants écoutent l'événement
5. ❌ Le cache n'est pas persistant entre les rafraîchissements (PROBLÈME pour hard refresh)

---

## 📝 RÉSUMÉ

**Problème principal:** Le hook `useEmployeePortalPermissions` **invalide le cache** quand il reçoit l'événement `employee-portal-permissions-updated`, alors que `savePermissions()` vient juste de **mettre à jour le cache** avec les nouvelles données. Cela force un rechargement depuis le serveur, causant un délai.

**Solution:** Ne pas invalider le cache dans `handlePermissionsUpdate`, mais plutôt utiliser directement le cache mis à jour. Si le cache n'existe pas, alors recharger depuis le serveur.
