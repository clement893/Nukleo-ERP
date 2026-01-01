# 📋 RAPPORT COMPLET DU FLOW DES PERMISSIONS EMPLOYÉ

## 🔄 FLOW COMPLET DE SAUVEGARDE

### Étape 1: Action Utilisateur (EmployeePortalPermissionsEditor.tsx)
**Fichier:** `apps/web/src/components/employes/EmployeePortalPermissionsEditor.tsx`

**Actions possibles:**
- `handleModuleToggle(moduleId)` - Ligne 232
- `handleAddClient(client)` - Ligne 253
- `handleRemoveClient(clientId)` - Ligne 267

**Flow:**
1. Mise à jour immédiate de l'état local (`setSelectedModules`, `setSelectedClients`)
2. Appel immédiat à `savePermissions(newSet, newClientsSet)`

---

### Étape 2: Sauvegarde (savePermissions)
**Fichier:** `apps/web/src/components/employes/EmployeePortalPermissionsEditor.tsx` (Ligne 278)

**Séquence d'exécution:**
```
1. deleteAllForEmployee(employeeId) 
   → API: DELETE /v1/employees/{employee_id}/employee-portal-permissions
   → Backend: Supprime toutes les permissions de l'employé dans la DB
   → ⏱️ Temps: ~100-300ms

2. bulkCreate({ employee_id, permissions })
   → API: POST /v1/employee-portal-permissions/bulk
   → Backend: Crée toutes les nouvelles permissions dans la DB
   → ⏱️ Temps: ~200-500ms

3. setSavedModules(new Set(modules)) 
   → Mise à jour optimiste de l'état React
   → ⏱️ Temps: Immédiat

4. setSavedClients(new Set(clients))
   → Mise à jour optimiste de l'état React
   → ⏱️ Temps: Immédiat

5. setTimeout(() => {
     window.dispatchEvent(new CustomEvent('employee-portal-permissions-updated', {
       detail: { employeeId }
     }));
   }, 0);
   → Déclenche l'événement après le prochain tick
   → ⏱️ Temps: ~0-16ms (next tick)
```

**⚠️ PROBLÈME IDENTIFIÉ:**
- Le cache dans `useEmployeePortalPermissions` n'est PAS invalidé ici
- L'événement est dispatché mais le cache peut toujours contenir les anciennes données
- Le `setTimeout(0)` peut causer des race conditions si plusieurs composants écoutent

---

### Étape 3: Backend - Suppression (delete_all_employee_portal_permissions)
**Fichier:** `backend/app/api/v1/endpoints/employee_portal_permissions.py` (Ligne 404)

**Flow:**
```
1. Vérification des permissions admin
2. SELECT toutes les permissions WHERE employee_id = X
3. DELETE chaque permission
4. COMMIT transaction
```

**⏱️ Durée estimée:** 50-200ms

---

### Étape 4: Backend - Création (bulk_create_employee_portal_permissions)
**Fichier:** `backend/app/api/v1/endpoints/employee_portal_permissions.py` (Ligne 203)

**Flow:**
```
1. Vérification des permissions admin
2. Pour chaque permission:
   - Vérification des doublons
   - Conversion avec model_dump(exclude_none=True, by_alias=True)
   - Création de l'objet EmployeePortalPermission
   - db.add(permission)
3. COMMIT transaction
4. REFRESH chaque permission créée
5. Retourne la liste des permissions créées
```

**⏱️ Durée estimée:** 100-500ms (selon le nombre de permissions)

---

## 🔄 FLOW COMPLET DE CHARGEMENT

### Étape 1: Initialisation (layout.tsx)
**Fichier:** `apps/web/src/app/[locale]/portail-employe/layout.tsx` (Ligne 32)

**Flow:**
```
1. useEffect au montage du composant
2. Promise.all([
     employeesAPI.get(employeeId),
     employeePortalPermissionsAPI.getSummaryForEmployee(employeeId).catch(() => null)
   ])
3. Précharge les permissions en arrière-plan
```

**⚠️ PROBLÈME IDENTIFIÉ:**
- Le préchargement dans `layout.tsx` ne met PAS à jour le cache du hook `useEmployeePortalPermissions`
- Le cache est géré uniquement dans le hook, pas par l'API client
- Donc le préchargement est inutile pour le cache

---

### Étape 2: Hook useEmployeePortalPermissions
**Fichier:** `apps/web/src/hooks/useEmployeePortalPermissions.ts`

#### 2.1: Initialisation (Ligne 44)
```
1. Calcul de cacheKey = getCacheKey(employeeId, user?.id)
   → Format: "employee:18" ou "user:123"

2. Vérification du cache: getCachedPermissions(cacheKey)
   → Si cache existe ET < 60 secondes → retourne les données
   → Sinon → retourne null

3. useState initial:
   - permissions = cachedPermissions (ou null)
   - loading = !cachedPermissions (false si cache, true sinon)
```

#### 2.2: Chargement (loadPermissions - Ligne 57)
```
SI employeeId fourni:
  1. Vérifier le cache à nouveau (currentCache)
  2. SI cache valide ET premier chargement (initialLoadRef.current === false):
     → Utiliser le cache
     → setPermissions(currentCache)
     → setLoading(false)
     → initialLoadRef.current = true
     → RETURN (ne fait PAS d'appel API)
  
  3. SINON:
     → Si pas de cache → setLoading(true)
     → Appel API: getSummaryForEmployee(employeeId)
     → setPermissions(summary)
     → setCachedPermissions(cacheKey, summary) // MET EN CACHE
     → initialLoadRef.current = true
     → setLoading(false)

SINON SI user?.id:
  → Même logique avec getSummary(userId)

SINON:
  → Permissions par défaut (pages: ['*'])
```

#### 2.3: useEffect de chargement (Ligne 161)
```
useEffect(() => {
  loadPermissions();
}, [user?.id, employeeId, reloadTrigger]);
```

**⚠️ PROBLÈME IDENTIFIÉ:**
- Le `reloadTrigger` est incrémenté pour forcer un rechargement
- Mais si le cache est valide (< 60s), il sera utilisé même après un reload
- Le `reload()` invalide le cache AVANT d'incrémenter le trigger

---

### Étape 3: Écoute des événements (useEmployeePortalPermissions)
**Fichier:** `apps/web/src/hooks/useEmployeePortalPermissions.ts` (Ligne 175)

**Flow:**
```
useEffect(() => {
  SI employeeId existe:
    handlePermissionsUpdate = (event) => {
      SI event.detail.employeeId === employeeId:
        1. Invalider le cache: permissionsCache.delete(cacheKey)
        2. initialLoadRef.current = false
        3. setReloadTrigger(prev => prev + 1)
        → Déclenche un rechargement via useEffect
    }
    
    window.addEventListener('employee-portal-permissions-updated', ...)
    
    return () => window.removeEventListener(...)
}, [employeeId])
```

**⚠️ PROBLÈME IDENTIFIÉ:**
- Le cache est invalidé, mais le `reloadTrigger` peut être déclenché AVANT que `savePermissions` ait fini
- Race condition possible si l'événement arrive avant la fin de la transaction DB

---

### Étape 4: EmployeePortalNavigation
**Fichier:** `apps/web/src/components/employes/EmployeePortalNavigation.tsx` (Ligne 120)

**Flow:**
```
1. useEmployeePortalPermissions({ employeeId })
   → Charge les permissions via le hook

2. useEffect écoute 'employee-portal-permissions-updated' (Ligne 126)
   → SI event.detail.employeeId === employeeId:
     → reloadPermissions() (appelle reload() du hook)

3. Filtrage des modules (Ligne 170):
   enabledModules = EMPLOYEE_PORTAL_MODULES.filter(module => {
     SI permissionsLoading: return false
     SINON: return hasModuleAccess(module.id)
   })
```

**⚠️ PROBLÈME IDENTIFIÉ:**
- Si `permissionsLoading` est true, aucun module n'est affiché
- Le rechargement peut prendre du temps si le cache est invalide
- Pas de feedback visuel pendant le rechargement

---

## 💾 SYSTÈME DE CACHE

### Cache en mémoire (useEmployeePortalPermissions.ts)
**Fichier:** `apps/web/src/hooks/useEmployeePortalPermissions.ts` (Ligne 14-42)

**Structure:**
```typescript
const permissionsCache = new Map<string, {
  data: EmployeePortalPermissionSummary,
  timestamp: number
}>();

const CACHE_DURATION = 60 * 1000; // 60 secondes = 1 minute
```

**Clés de cache:**
- Format: `"employee:18"` ou `"user:123"`
- Générées par: `getCacheKey(employeeId?, userId?)`

**Fonctions:**
1. `getCachedPermissions(key)` - Récupère le cache si valide (< 60s)
2. `setCachedPermissions(key, data)` - Met en cache avec timestamp actuel
3. `permissionsCache.delete(key)` - Invalide le cache

**⚠️ PROBLÈMES IDENTIFIÉS:**
1. **Cache non partagé:** Le préchargement dans `layout.tsx` ne met pas à jour ce cache
2. **Durée fixe:** 60 secondes peut être trop long pour des mises à jour en temps réel
3. **Pas de cache côté API:** Chaque appel API va au serveur, même si le cache frontend est valide
4. **Invalidation manuelle:** Le cache n'est invalidé que via `reload()` ou l'événement, pas automatiquement après sauvegarde

---

## 🔗 FLOW COMPLET: SAUVEGARDE → AFFICHAGE

### Scénario: Admin modifie les permissions de l'employé 18

```
1. [EmployeePortalPermissionsEditor] handleModuleToggle('projects')
   ⏱️ T0: État local mis à jour immédiatement

2. [EmployeePortalPermissionsEditor] savePermissions()
   ⏱️ T0+10ms: deleteAllForEmployee(18) appelé
   ⏱️ T0+150ms: deleteAllForEmployee(18) terminé (DB commité)
   ⏱️ T0+160ms: bulkCreate() appelé
   ⏱️ T0+400ms: bulkCreate() terminé (DB commité)
   ⏱️ T0+410ms: setSavedModules() appelé (optimistic update)
   ⏱️ T0+411ms: setSavedClients() appelé (optimistic update)
   ⏱️ T0+412ms: setTimeout(() => dispatchEvent(...), 0) programmé

3. [Event Loop] setTimeout callback
   ⏱️ T0+428ms: window.dispatchEvent('employee-portal-permissions-updated', { employeeId: 18 })

4. [useEmployeePortalPermissions] handlePermissionsUpdate()
   ⏱️ T0+429ms: permissionsCache.delete('employee:18')
   ⏱️ T0+430ms: initialLoadRef.current = false
   ⏱️ T0+431ms: setReloadTrigger(prev => prev + 1)

5. [useEmployeePortalPermissions] useEffect([reloadTrigger])
   ⏱️ T0+432ms: loadPermissions() appelé
   ⏱️ T0+433ms: currentCache = null (vient d'être supprimé)
   ⏱️ T0+434ms: setLoading(true)
   ⏱️ T0+435ms: API call: getSummaryForEmployee(18)
   ⏱️ T0+600ms: API response reçue
   ⏱️ T0+601ms: setPermissions(summary)
   ⏱️ T0+602ms: setCachedPermissions('employee:18', summary)
   ⏱️ T0+603ms: setLoading(false)

6. [EmployeePortalNavigation] useEffect([reloadPermissions])
   ⏱️ T0+432ms: reloadPermissions() appelé (en parallèle)
   ⏱️ T0+433ms: permissionsCache.delete('employee:18') (déjà fait)
   ⏱️ T0+434ms: setReloadTrigger(prev => prev + 1) (déjà fait)
   → Double invalidation, mais pas de problème

7. [EmployeePortalNavigation] Render
   ⏱️ T0+604ms: permissionsLoading = false
   ⏱️ T0+605ms: hasModuleAccess('projects') = true
   ⏱️ T0+606ms: Module "Projets" affiché dans la navigation
```

**⏱️ TEMPS TOTAL: ~600ms entre la sauvegarde et l'affichage**

---

## 🐛 PROBLÈMES IDENTIFIÉS

### Problème 1: Cache non invalidé immédiatement
**Localisation:** `EmployeePortalPermissionsEditor.savePermissions()`

**Description:**
- Le cache n'est pas invalidé dans `savePermissions()`
- L'invalidation se fait uniquement via l'événement
- Si l'événement n'est pas capturé ou arrive trop tard, le cache reste obsolète

**Impact:**
- Les permissions peuvent ne pas se mettre à jour dans le portail
- Le hard refresh peut montrer les anciennes permissions si le cache est encore valide

**Solution suggérée:**
```typescript
// Dans savePermissions(), après setSavedModules/setSavedClients:
const cacheKey = getCacheKey(employeeId);
if (cacheKey && cacheKey !== 'none') {
  permissionsCache.delete(cacheKey);
}
```

---

### Problème 2: Préchargement inutile
**Localisation:** `layout.tsx` ligne 45

**Description:**
- Le préchargement dans `layout.tsx` ne met pas à jour le cache du hook
- Le hook a son propre cache qui n'est pas partagé avec l'API client
- Donc le préchargement est inutile

**Impact:**
- Double appel API (préchargement + hook)
- Pas de gain de performance

**Solution suggérée:**
- Supprimer le préchargement OU
- Créer un cache partagé au niveau de l'API client

---

### Problème 3: Race condition avec setTimeout(0)
**Localisation:** `EmployeePortalPermissionsEditor.savePermissions()` ligne 337

**Description:**
- `setTimeout(..., 0)` peut causer des race conditions
- Si plusieurs composants écoutent l'événement, ils peuvent tous invalider le cache en même temps
- L'événement peut arriver avant que React ait fini de traiter les state updates

**Impact:**
- Comportement imprévisible
- Cache peut être invalidé plusieurs fois
- Rechargements multiples

**Solution suggérée:**
```typescript
// Utiliser requestAnimationFrame ou Promise.resolve().then()
Promise.resolve().then(() => {
  window.dispatchEvent(new CustomEvent('employee-portal-permissions-updated', {
    detail: { employeeId }
  }));
});
```

---

### Problème 4: Cache trop long (60 secondes)
**Localisation:** `useEmployeePortalPermissions.ts` ligne 16

**Description:**
- Le cache dure 60 secondes
- Si on modifie les permissions, le cache peut encore être valide pendant 60 secondes
- Même après invalidation manuelle, si on recharge la page, le cache peut être utilisé

**Impact:**
- Les permissions peuvent ne pas se mettre à jour immédiatement
- Hard refresh peut montrer les anciennes permissions

**Solution suggérée:**
- Réduire à 10-30 secondes
- OU invalider automatiquement après sauvegarde
- OU utiliser un cache avec version/timestamp

---

### Problème 5: Double invalidation
**Localisation:** `useEmployeePortalPermissions.ts` ligne 175 et `EmployeePortalNavigation.tsx` ligne 126

**Description:**
- Les deux composants écoutent l'événement et invalident le cache
- `useEmployeePortalPermissions` invalide dans `handlePermissionsUpdate`
- `EmployeePortalNavigation` appelle `reloadPermissions()` qui invalide aussi

**Impact:**
- Pas de problème fonctionnel, mais inefficace
- Double appel à `permissionsCache.delete()`

**Solution suggérée:**
- `EmployeePortalNavigation` ne devrait pas appeler `reloadPermissions()` si le hook le fait déjà
- OU centraliser l'invalidation dans le hook uniquement

---

### Problème 6: loadData() utilise summaryData mais peut être obsolète
**Localisation:** `EmployeePortalPermissionsEditor.loadData()` ligne 57

**Description:**
- `loadData()` utilise `summaryData` comme source principale
- Mais si `summaryData` vient du cache, il peut être obsolète
- Le cache n'est pas invalidé dans `loadData()`

**Impact:**
- Après un hard refresh, les permissions peuvent ne pas se charger correctement
- Les badges "Actif" peuvent ne pas apparaître

**Solution suggérée:**
- Invalider le cache avant de charger dans `loadData()`
- OU forcer un rechargement depuis le serveur

---

## 📊 RÉSUMÉ DES CACHES ET DURÉES

| Composant | Cache | Durée | Invalidation |
|-----------|-------|-------|--------------|
| `useEmployeePortalPermissions` | Map en mémoire | 60 secondes | Manuelle via `reload()` ou événement |
| `layout.tsx` préchargement | Aucun | N/A | N/A |
| API Client | Aucun | N/A | N/A |
| Backend | Aucun | N/A | N/A |

---

## 🔧 RECOMMANDATIONS

1. **Invalider le cache immédiatement après sauvegarde**
   - Dans `savePermissions()`, invalider le cache avant de dispatcher l'événement

2. **Réduire la durée du cache**
   - Passer de 60 secondes à 10-30 secondes

3. **Centraliser l'invalidation**
   - Un seul point d'invalidation (dans le hook)
   - Les autres composants ne font que déclencher le rechargement

4. **Supprimer le préchargement inutile**
   - Le préchargement dans `layout.tsx` ne sert à rien si le cache n'est pas partagé

5. **Utiliser un mécanisme de version/timestamp**
   - Ajouter un timestamp de dernière modification dans le summary
   - Comparer avec le cache pour savoir s'il est obsolète

6. **Améliorer la gestion des événements**
   - Utiliser `Promise.resolve().then()` au lieu de `setTimeout(0)`
   - OU utiliser un EventEmitter dédié

7. **Ajouter des logs de debug**
   - Logger chaque étape du flow pour faciliter le debugging
   - Logger les invalidations de cache

---

## 📝 NOTES FINALES

- Le flow fonctionne en théorie, mais il y a plusieurs points de friction
- Le cache est la principale source de problèmes
- Les race conditions peuvent causer des comportements imprévisibles
- Le hard refresh peut montrer les anciennes permissions si le cache est encore valide
