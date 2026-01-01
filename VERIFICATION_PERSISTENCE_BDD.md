# ✅ VÉRIFICATION: Les permissions sont-elles sauvegardées en BDD?

## 🔍 ANALYSE DU FLOW DE SAUVEGARDE

### Étape 1: Frontend - Appel API
**Fichier:** `apps/web/src/components/employes/EmployeePortalPermissionsEditor.tsx`

**Fonction `savePermissions()` (ligne 278):**
```typescript
const savePermissions = async (modules: Set<string>, clients: Set<number>) => {
  // 1. Suppression de toutes les permissions existantes
  await employeePortalPermissionsAPI.deleteAllForEmployee(employeeId);
  
  // 2. Création des nouvelles permissions
  if (newPermissions.length > 0) {
    await employeePortalPermissionsAPI.bulkCreate({
      employee_id: employeeId,
      permissions: newPermissions,
    });
  }
  
  // 3. Mise à jour optimiste de l'état local
  setSavedModules(new Set(modules));
  setSavedClients(new Set(clients));
}
```

**✅ Les appels API sont bien `await`, donc on attend la réponse du serveur avant de continuer.**

---

### Étape 2: Backend - Suppression (DELETE)
**Fichier:** `backend/app/api/v1/endpoints/employee_portal_permissions.py` (ligne 404)

**Endpoint:** `DELETE /v1/employees/{employee_id}/employee-portal-permissions`

```python
@router.delete("/employees/{employee_id}/employee-portal-permissions", status_code=status.HTTP_204_NO_CONTENT)
async def delete_all_employee_portal_permissions(
    employee_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # 1. Sélection de toutes les permissions
    result = await db.execute(
        select(EmployeePortalPermission).where(
            EmployeePortalPermission.employee_id == employee_id
        )
    )
    permissions = result.scalars().all()
    
    # 2. Suppression de chaque permission
    for perm in permissions:
        await db.delete(perm)
    
    # 3. ✅ COMMIT EN BASE DE DONNÉES
    await db.commit()
    
    return None
```

**✅ `await db.commit()` est bien appelé, donc les suppressions sont PERSISTÉES en BDD.**

---

### Étape 3: Backend - Création (POST)
**Fichier:** `backend/app/api/v1/endpoints/employee_portal_permissions.py` (ligne 203)

**Endpoint:** `POST /v1/employee-portal-permissions/bulk`

```python
@router.post("/employee-portal-permissions/bulk", response_model=List[EmployeePortalPermissionResponse], status_code=status.HTTP_201_CREATED)
async def bulk_create_employee_portal_permissions(
    bulk_data: BulkEmployeePortalPermissionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    created_permissions = []
    
    for perm_data in bulk_data.permissions:
        # Vérification des doublons
        existing = await db.execute(...)
        if existing.scalar_one_or_none():
            continue  # Skip duplicates
        
        # Création de l'objet
        permission = EmployeePortalPermission(**perm_dict)
        db.add(permission)  # Ajout à la session
        created_permissions.append(permission)
    
    # ✅ COMMIT EN BASE DE DONNÉES
    await db.commit()
    
    # Refresh pour obtenir les IDs générés
    for perm in created_permissions:
        await db.refresh(perm)
    
    return [EmployeePortalPermissionResponse.model_validate(p) for p in created_permissions]
```

**✅ `await db.commit()` est bien appelé, donc les créations sont PERSISTÉES en BDD.**

---

## 🔐 GARANTIES DE PERSISTENCE

### 1. Transactions SQLAlchemy
- SQLAlchemy utilise des transactions par défaut
- `db.commit()` valide la transaction et écrit en BDD
- Si une erreur survient, la transaction est rollback automatiquement

### 2. Ordre d'exécution
```
1. DELETE → commit() → ✅ Persisté
2. POST → commit() → ✅ Persisté
```

**Les deux opérations sont séquentielles et chacune est commitée individuellement.**

### 3. Gestion des erreurs
Si une erreur survient:
- SQLAlchemy fait un rollback automatique
- L'exception est remontée au frontend
- Le frontend affiche un message d'erreur
- Les états locaux ne sont PAS mis à jour (car l'erreur est catchée)

---

## 🧪 TEST DE VÉRIFICATION

Pour vérifier que les permissions sont bien en BDD:

### Option 1: Requête SQL directe
```sql
SELECT * FROM employee_portal_permissions 
WHERE employee_id = 18;
```

### Option 2: Via l'API
```bash
GET /api/v1/employees/18/employee-portal-permissions/summary
```

### Option 3: Via le frontend
- Ouvrir les DevTools → Network
- Vérifier que les appels API retournent `200` ou `201`
- Vérifier la réponse contient les permissions créées

---

## ⚠️ POINTS D'ATTENTION

### 1. Cache frontend
**Problème:** Le cache frontend peut contenir des données obsolètes même si la BDD est à jour.

**Solution:** Le cache est invalidé via l'événement `employee-portal-permissions-updated`, mais il y a un délai.

### 2. Hard refresh
**Problème:** Après un hard refresh, le cache est vidé, mais le hook peut utiliser un cache valide (< 60s) qui contient les anciennes données.

**Solution:** Le cache devrait être invalidé immédiatement après sauvegarde.

### 3. Race conditions
**Problème:** Si plusieurs onglets sont ouverts, ils peuvent avoir des caches différents.

**Solution:** Utiliser un mécanisme de synchronisation (BroadcastChannel API ou localStorage events).

---

## ✅ CONCLUSION

**OUI, les permissions SONT bien sauvegardées en base de données.**

**Preuves:**
1. ✅ `deleteAllForEmployee()` fait `await db.commit()` (ligne 423)
2. ✅ `bulkCreate()` fait `await db.commit()` (ligne 249)
3. ✅ Les appels API sont `await` dans le frontend
4. ✅ Les erreurs sont gérées et remontées

**Le problème n'est PAS la persistance en BDD, mais:**
- Le cache frontend qui peut être obsolète
- Le délai entre la sauvegarde et l'invalidation du cache
- Le hard refresh qui peut utiliser un cache valide mais obsolète

**Recommandation:** Invalider le cache immédiatement après `savePermissions()` pour garantir que les nouvelles données sont chargées depuis la BDD.
