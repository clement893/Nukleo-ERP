# 📚 Documentation: Systèmes de Navigation du Portail Employé

**Date**: 2025-01-27  
**Statut**: Documentation officielle

---

## 📋 Vue d'Ensemble

Le système de portail employé utilise **deux systèmes de navigation différents** pour des contextes différents. Cette documentation explique pourquoi et comment ils sont utilisés.

---

## 🎯 Les Deux Systèmes

### 1. EMPLOYEE_PORTAL_MODULES (Système Principal) ✅

**Fichier**: `apps/web/src/lib/constants/employee-portal-modules.ts`

**Usage**: Navigation dans le portail employé (`/portail-employe/[id]/*`)

**Routes**: Les chemins sont transformés de `/dashboard/*` vers `/portail-employe/[id]/modules/*`

**Utilisé par**:
- `EmployeePortalNavigation.tsx` (composant navigation simple)
- `EmployeePortalSidebar.tsx` (sidebar principale du portail)

**Fonctionnalités**:
- Transformation automatique des chemins via `getEmployeePortalModules()`
- Vérification des permissions via `useEmployeePortalPermissions`
- Support des sous-pages (subPages)
- Filtrage basé sur les permissions de l'employé

**Structure**:
```typescript
export const EMPLOYEE_PORTAL_MODULES: EmployeePortalModule[] = [
  {
    id: 'commercial',
    label: 'Module Commercial',
    basePath: '/dashboard/commercial',  // Transformé en /portail-employe/[id]/modules/commercial
    subPages: [...],
  },
  // ...
];
```

**Transformation**:
- `/dashboard/commercial` → `/portail-employe/[id]/modules/commercial`
- `/admin/users` → `/portail-employe/[id]/admin/users`
- `/settings` → `/portail-employe/[id]/settings`

---

### 2. EMPLOYEE_PORTAL_NAVIGATION (Système Secondaire) ⚠️

**Fichier**: `apps/web/src/lib/constants/portal.ts`

**Usage**: Navigation pour le portail ERP global (`/erp/*`) - **NON UTILISÉ dans le portail employé actuel**

**Routes**: Routes directes `/erp/*`

**Utilisé par**:
- `ERPNavigation.tsx` (composant pour portail ERP global - non utilisé dans portail employé)

**Note**: Ce système est **prévu pour un futur portail ERP global** mais n'est **PAS utilisé** dans le portail employé actuel (`/portail-employe/[id]/*`).

**Structure**:
```typescript
export const EMPLOYEE_PORTAL_NAVIGATION: EmployeePortalNavigation[] = [
  {
    id: 'orders',
    label: 'Orders',
    path: '/erp/orders',  // Routes /erp/* (non utilisées actuellement)
    module: 'orders',
  },
  // ...
];
```

---

## 🔄 Pourquoi Deux Systèmes ?

### Historique

1. **EMPLOYEE_PORTAL_NAVIGATION** (`/erp/*`):
   - Système initial prévu pour un portail ERP global
   - Routes directes `/erp/*`
   - Système RBAC standard
   - **Non implémenté/utilisé actuellement**

2. **EMPLOYEE_PORTAL_MODULES** (`/portail-employe/[id]/*`):
   - Système actuel du portail employé
   - Routes avec ID employé: `/portail-employe/[id]/*`
   - Système de permissions dédié au portail employé
   - **Actuellement utilisé**

### Raison

Les deux systèmes coexistent car:
- `EMPLOYEE_PORTAL_NAVIGATION` est prévu pour un futur portail ERP global (`/erp/*`)
- `EMPLOYEE_PORTAL_MODULES` est le système actuel du portail employé (`/portail-employe/[id]/*`)
- Ils servent des objectifs différents (portail global vs portail individuel)

---

## ✅ Quelle Utiliser ?

### Pour le Portail Employé (`/portail-employe/[id]/*`)

**✅ UTILISER**: `EMPLOYEE_PORTAL_MODULES`

**Composants**:
- `EmployeePortalNavigation`
- `EmployeePortalSidebar`

**Fonctions**:
- `getEmployeePortalModules(employeeId, locale)`
- `getEmployeePortalModulePath(employeeId, modulePath, locale)`

**Exemple**:
```typescript
import { getEmployeePortalModules } from '@/lib/constants/employee-portal-modules';

const modules = getEmployeePortalModules(employeeId, 'fr');
// modules[0].basePath = '/fr/portail-employe/123/modules/commercial'
```

---

### Pour le Portail ERP Global (`/erp/*`) - Futur

**⚠️ UTILISER**: `EMPLOYEE_PORTAL_NAVIGATION` (quand implémenté)

**Composants**:
- `ERPNavigation`

**Note**: Ce système n'est **PAS encore utilisé** dans l'application actuelle.

---

## 📝 Recommandations

### Développeurs

1. **Pour le portail employé**: Toujours utiliser `EMPLOYEE_PORTAL_MODULES`
2. **Ne pas mélanger**: Ne pas utiliser `EMPLOYEE_PORTAL_NAVIGATION` dans le portail employé
3. **Vérifier les permissions**: Utiliser `useEmployeePortalPermissions` avec `employeeId`

### Maintenance

1. **Garder les deux systèmes séparés**: Ils servent des objectifs différents
2. **Documenter les changements**: Mettre à jour cette doc si un système change
3. **Considérer l'unification future**: Si les deux systèmes convergent, unifier

---

## 🔍 Comment Identifier le Bon Système

### Dans le Code

**Si vous voyez**:
- `/portail-employe/[id]/*` → Utiliser `EMPLOYEE_PORTAL_MODULES`
- `/erp/*` → Utiliser `EMPLOYEE_PORTAL_NAVIGATION` (futur)

**Si vous voyez**:
- `EmployeePortalNavigation` ou `EmployeePortalSidebar` → Utiliser `EMPLOYEE_PORTAL_MODULES`
- `ERPNavigation` → Utiliser `EMPLOYEE_PORTAL_NAVIGATION` (futur)

---

## 📊 Comparaison

| Aspect | EMPLOYEE_PORTAL_MODULES | EMPLOYEE_PORTAL_NAVIGATION |
|--------|------------------------|----------------------------|
| Routes | `/portail-employe/[id]/*` | `/erp/*` |
| Statut | ✅ Actuellement utilisé | ⚠️ Prévu pour futur |
| Permissions | Système dédié portail employé | RBAC standard |
| Transformation | Oui (via fonctions) | Non (routes directes) |
| Composants | `EmployeePortalNavigation`, `EmployeePortalSidebar` | `ERPNavigation` |
| Contexte | Portail individuel employé | Portail ERP global |

---

## 🔗 Références

- `apps/web/src/lib/constants/employee-portal-modules.ts` - Définition EMPLOYEE_PORTAL_MODULES
- `apps/web/src/lib/constants/portal.ts` - Définition EMPLOYEE_PORTAL_NAVIGATION
- `apps/web/src/components/employes/EmployeePortalNavigation.tsx` - Utilisation MODULES
- `apps/web/src/components/employes/EmployeePortalSidebar.tsx` - Utilisation MODULES
- `apps/web/src/components/erp/ERPNavigation.tsx` - Utilisation NAVIGATION (futur)

---

**Fin de la documentation**
