# 🔒 Audit Complet : Système de Permissions et Séparation Portail Employé

**Date**: 2025-01-27  
**Sévérité**: ⚠️ **CRITIQUE** - Problème de sécurité et d'isolation

---

## 📋 Résumé Exécutif

Le portail employé souffre d'un **problème critique de séparation** avec la plateforme globale. Quand un employé clique sur un module activé dans son portail, il est redirigé vers le dashboard principal avec **accès à tous les modules** au lieu de rester dans son portail isolé. Ceci constitue une **faille de sécurité majeure** dans la gestion des permissions.

### Problème Principal

**Les modules ERP dans le portail employé utilisent des chemins `/dashboard/*` au lieu de `/portail-employe/[id]/*`**, ce qui cause:
- ❌ Redirection vers le dashboard principal
- ❌ Accès non autorisé à tous les modules
- ❌ Bypass complet du système de permissions du portail employé
- ❌ Absence d'isolation entre portail employé et plateforme globale

---

## 🔍 Analyse Détaillée

### 1. Problème de Routage (CRITIQUE)

#### Fichier: `apps/web/src/lib/constants/employee-portal-modules.ts`

**Problème**: Tous les `basePath` pointent vers `/dashboard/*` au lieu de `/portail-employe/[id]/*`

```typescript
// ❌ PROBLÈME: basePath pointe vers /dashboard au lieu de /portail-employe/[id]
export const EMPLOYEE_PORTAL_MODULES: EmployeePortalModule[] = [
  {
    id: 'dashboard',
    basePath: '/dashboard',  // ❌ Devrait être: `/portail-employe/[id]/dashboard`
  },
  {
    id: 'commercial',
    basePath: '/dashboard/commercial',  // ❌ Devrait être: `/portail-employe/[id]/modules/commercial`
    subPages: [
      { name: 'Opportunités', path: '/dashboard/commercial/opportunites' },  // ❌
    ],
  },
  {
    id: 'reseau',
    basePath: '/dashboard/reseau',  // ❌
    subPages: [
      { name: 'Contacts', path: '/dashboard/reseau/contacts' },  // ❌
    ],
  },
  // ... tous les autres modules ont le même problème
];
```

**Impact**: Quand un employé clique sur un module, il est redirigé vers `/dashboard/commercial` au lieu de `/portail-employe/123/modules/commercial`, ce qui le fait sortir du portail.

---

### 2. Navigation sans Protection (CRITIQUE)

#### Fichiers: 
- `apps/web/src/components/employes/EmployeePortalNavigation.tsx` (ligne 317)
- `apps/web/src/components/employes/EmployeePortalSidebar.tsx` (ligne 331)

**Problème**: Les liens utilisent directement `module.basePath` sans transformation ni vérification

```typescript
// ❌ PROBLÈME: Utilisation directe de module.basePath
<Link href={module.basePath} className={...}>
  {module.label}
</Link>

// ❌ PROBLÈME: Les subPages utilisent aussi directement le path
<Link href={subPage.path} className={...}>
  {subPage.name}
</Link>
```

**Impact**: Aucune protection pour empêcher les redirections vers le dashboard principal. Les liens fonctionnent mais sortent complètement du contexte du portail employé.

---

### 3. Absence de Routes pour Modules dans le Portail (CRITIQUE)

#### Structure actuelle: `apps/web/src/app/[locale]/portail-employe/[id]/`

```
portail-employe/[id]/
  ├── dashboard/
  ├── taches/
  ├── projets/
  ├── feuilles-de-temps/
  ├── leo/
  ├── deadlines/
  ├── depenses/
  ├── vacances/
  └── profil/
```

**Problème**: Il n'existe **AUCUNE route pour les modules ERP** (commercial, reseau, operations, etc.) dans le portail employé. Quand l'employé clique sur un module, il n'y a pas de page correspondante dans `/portail-employe/[id]/`, donc Next.js le redirige vers le dashboard principal.

**Impact**: Impossible pour un employé d'accéder aux modules depuis son portail car les routes n'existent pas.

---

### 4. Permissions Non Appliquées au Routage (HAUTE)

#### Fichier: `apps/web/src/components/auth/ProtectedRoute.tsx`

**Problème**: La logique de redirection (lignes 191-210) fonctionne dans un seul sens :
- ✅ Redirige les employés qui accèdent à `/dashboard` vers leur portail
- ❌ Ne protège PAS contre les employés qui cliquent sur des liens depuis le portail

```typescript
// ✅ Fonctionne: Si employé va sur /dashboard, il est redirigé
if (userForCheck && pathname && pathname.startsWith('/dashboard') && !pathname.startsWith('/portail-employe')) {
  const employee = await employeesAPI.getByUserId(userId);
  if (employee) {
    router.replace(`/portail-employe/${employee.id}/dashboard`);
  }
}

// ❌ MANQUE: Protection pour empêcher les employés d'accéder à /dashboard/* depuis leur portail
```

**Impact**: Les employés peuvent contourner la protection en cliquant directement sur des liens.

---

### 5. Middleware Insuffisant (MOYENNE)

#### Fichier: `apps/web/src/middleware.ts`

**Problème**: Le middleware ne vérifie pas si un utilisateur est un employé et tente d'accéder à `/dashboard/*` au lieu de `/portail-employe/*`.

**Impact**: Pas de protection côté serveur pour forcer les employés à rester dans leur portail.

---

### 6. Système de Permissions Fragmenté (MOYENNE)

#### Fichiers multiples:
- `apps/web/src/hooks/useEmployeePortalPermissions.ts`
- `apps/web/src/lib/portal/utils.ts`
- `apps/web/src/lib/constants/portal.ts`

**Problème**: Il existe **deux systèmes de navigation différents**:
1. `EMPLOYEE_PORTAL_NAVIGATION` (dans `portal.ts`) - pour le portail `/erp/*`
2. `EMPLOYEE_PORTAL_MODULES` (dans `employee-portal-modules.ts`) - pour le portail `/portail-employe/*`

Ces deux systèmes ne sont pas synchronisés et utilisent des chemins différents.

**Impact**: Confusion, duplication de code, incohérence dans les permissions.

---

## 🎯 Recommandations

### Phase 1: Correction Immédiate (URGENT)

#### 1.1 Créer une Fonction de Transformation de Chemins

**Fichier**: `apps/web/src/lib/constants/employee-portal-modules.ts`

```typescript
/**
 * Transforme un chemin de module en chemin pour le portail employé
 */
export function getEmployeePortalModulePath(
  employeeId: number,
  modulePath: string,
  locale: string = 'fr'
): string {
  // Si le chemin commence par /dashboard, /admin, etc., le transformer
  if (modulePath.startsWith('/dashboard')) {
    const pathWithoutDashboard = modulePath.replace('/dashboard', '');
    return `/${locale}/portail-employe/${employeeId}/modules${pathWithoutDashboard}`;
  }
  
  if (modulePath.startsWith('/admin')) {
    const pathWithoutAdmin = modulePath.replace('/admin', '');
    return `/${locale}/portail-employe/${employeeId}/admin${pathWithoutAdmin}`;
  }
  
  // Pour les autres chemins, ajouter le préfixe portail-employe
  return `/${locale}/portail-employe/${employeeId}${modulePath}`;
}

/**
 * Configuration des modules avec transformation dynamique
 */
export function getEmployeePortalModules(employeeId: number, locale: string = 'fr') {
  return EMPLOYEE_PORTAL_MODULES.map(module => ({
    ...module,
    basePath: getEmployeePortalModulePath(employeeId, module.basePath, locale),
    subPages: module.subPages?.map(subPage => ({
      ...subPage,
      path: getEmployeePortalModulePath(employeeId, subPage.path, locale),
    })),
  }));
}
```

#### 1.2 Mettre à Jour les Composants de Navigation

**Fichier**: `apps/web/src/components/employes/EmployeePortalNavigation.tsx`

```typescript
// ✅ CORRECTION: Utiliser la fonction de transformation
const transformedModules = useMemo(() => {
  return getEmployeePortalModules(employeeId, locale);
}, [employeeId, locale]);

// Dans le rendu:
<Link href={module.basePath}>  // module.basePath est maintenant transformé
  {module.label}
</Link>
```

**Fichier**: `apps/web/src/components/employes/EmployeePortalSidebar.tsx`

Même correction à appliquer.

---

### Phase 2: Création des Routes Manquantes (URGENT)

#### 2.1 Créer la Structure de Routes pour les Modules

**Structure à créer**:
```
apps/web/src/app/[locale]/portail-employe/[id]/
  ├── modules/
  │   ├── layout.tsx  (layout commun pour tous les modules)
  │   ├── commercial/
  │   │   ├── page.tsx
  │   │   └── opportunites/
  │   │       └── page.tsx
  │   ├── reseau/
  │   │   ├── page.tsx
  │   │   ├── contacts/
  │   │   │   └── page.tsx
  │   │   └── entreprises/
  │   │       └── page.tsx
  │   ├── operations/
  │   │   └── page.tsx
  │   ├── management/
  │   │   └── page.tsx
  │   ├── agenda/
  │   │   └── page.tsx
  │   └── finances/
  │       └── page.tsx
```

#### 2.2 Créer un Layout Commun pour les Modules

**Fichier**: `apps/web/src/app/[locale]/portail-employe/[id]/modules/layout.tsx`

```typescript
/**
 * Layout pour les modules ERP dans le portail employé
 * Vérifie les permissions et redirige si nécessaire
 */
'use client';

import { useParams } from 'next/navigation';
import { useEmployeePortalPermissions } from '@/hooks/useEmployeePortalPermissions';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function EmployeePortalModulesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const employeeId = params?.id ? parseInt(String(params.id)) : null;
  const router = useRouter();
  const { hasModuleAccess, loading } = useEmployeePortalPermissions({ employeeId });
  const pathname = usePathname();
  
  // Extraire le nom du module depuis le pathname
  const moduleName = pathname?.split('/modules/')[1]?.split('/')[0];
  
  useEffect(() => {
    if (!loading && moduleName && employeeId) {
      if (!hasModuleAccess(moduleName)) {
        // Rediriger vers le dashboard du portail si pas de permission
        router.replace(`/portail-employe/${employeeId}/dashboard?error=no_permission`);
      }
    }
  }, [loading, moduleName, employeeId, hasModuleAccess, router]);
  
  if (loading) {
    return <div>Chargement...</div>;
  }
  
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
```

#### 2.3 Créer des Pages Proxy ou Wrapper

**Option A: Pages Proxy (Recommandé pour migration rapide)**

**Fichier**: `apps/web/src/app/[locale]/portail-employe/[id]/modules/commercial/page.tsx`

```typescript
/**
 * Page proxy pour le module Commercial dans le portail employé
 * Charge le composant du module principal mais dans le contexte du portail
 */
'use client';

import { useParams } from 'next/navigation';
import { useEmployeePortalPermissions } from '@/hooks/useEmployeePortalPermissions';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Charger dynamiquement le composant du module commercial
const CommercialModule = dynamic(
  () => import('@/components/commercial/CommercialModule'),
  { ssr: false }
);

export default function EmployeePortalCommercialPage() {
  const params = useParams();
  const employeeId = params?.id ? parseInt(String(params.id)) : null;
  const router = useRouter();
  const { hasModuleAccess, loading } = useEmployeePortalPermissions({ employeeId });
  const [hasAccess, setHasAccess] = useState(false);
  
  useEffect(() => {
    if (!loading && employeeId) {
      if (!hasModuleAccess('commercial')) {
        router.replace(`/${params.locale}/portail-employe/${employeeId}/dashboard?error=no_permission`);
      } else {
        setHasAccess(true);
      }
    }
  }, [loading, employeeId, hasModuleAccess, router, params.locale]);
  
  if (loading || !hasAccess) {
    return <div>Chargement...</div>;
  }
  
  // Passer le contexte du portail employé au module
  return (
    <CommercialModule 
      employeePortalContext={{
        employeeId,
        isEmployeePortal: true,
      }}
    />
  );
}
```

**Option B: Composants Séparés (Recommandé pour long terme)**

Créer des composants spécifiques pour le portail employé qui wrap les composants existants avec le bon contexte et les bonnes permissions.

---

### Phase 3: Protection Renforcée (HAUTE PRIORITÉ)

#### 3.1 Améliorer ProtectedRoute pour les Employés

**Fichier**: `apps/web/src/components/auth/ProtectedRoute.tsx`

```typescript
// Ajouter une vérification au début de checkAuth()
const checkAuth = async () => {
  // ✅ NOUVEAU: Vérifier si l'utilisateur est un employé et bloque l'accès à /dashboard/*
  const userForCheck = fetchedUser || user;
  if (userForCheck && pathname) {
    try {
      const userId = typeof userForCheck.id === 'string' 
        ? parseInt(userForCheck.id, 10) 
        : userForCheck.id;
      
      const employee = await employeesAPI.getByUserId(userId);
      
      if (employee) {
        // Si c'est un employé, vérifier qu'il est dans le portail employé
        if (pathname.startsWith('/dashboard') && !pathname.startsWith('/portail-employe')) {
          logger.warn('Employee attempting to access main dashboard, redirecting to portal', {
            userId: userForCheck.id,
            employeeId: employee.id,
            pathname
          });
          router.replace(`/${locale}/portail-employe/${employee.id}/dashboard?error=employee_redirect`);
          return;
        }
      }
    } catch (err) {
      // Si check fails, continue normally (user might not be an employee)
      logger.debug('Employee check failed, continuing normally', { error: err });
    }
  }
  
  // ... reste du code existant
};
```

#### 3.2 Ajouter un Hook de Protection de Route

**Fichier**: `apps/web/src/hooks/useEmployeePortalRouteGuard.ts` (nouveau)

```typescript
/**
 * Hook pour protéger les routes du portail employé
 * Redirige automatiquement si l'utilisateur n'est pas dans le bon contexte
 */
import { useEffect } from 'react';
import { usePathname, useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { employeesAPI } from '@/lib/api/employees';
import { useEmployeePortalPermissions } from './useEmployeePortalPermissions';

export function useEmployeePortalRouteGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const { user } = useAuthStore();
  const employeeId = params?.id ? parseInt(String(params.id)) : null;
  const { hasModuleAccess } = useEmployeePortalPermissions({ employeeId });
  
  useEffect(() => {
    if (!user || !pathname) return;
    
    const checkRoute = async () => {
      // Si on est dans le portail employé
      if (pathname.startsWith('/portail-employe/')) {
        // Vérifier que l'employé a les permissions pour cette route
        if (pathname.includes('/modules/')) {
          const moduleName = pathname.split('/modules/')[1]?.split('/')[0];
          if (moduleName && employeeId) {
            if (!hasModuleAccess(moduleName)) {
              router.replace(`/${params.locale}/portail-employe/${employeeId}/dashboard?error=no_permission`);
            }
          }
        }
      } else {
        // Si on est dans /dashboard mais que l'utilisateur est un employé
        if (pathname.startsWith('/dashboard')) {
          try {
            const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
            const employee = await employeesAPI.getByUserId(userId);
            if (employee) {
              router.replace(`/${params.locale}/portail-employe/${employee.id}/dashboard?error=employee_redirect`);
            }
          } catch (err) {
            // User might not be an employee, continue
          }
        }
      }
    };
    
    checkRoute();
  }, [pathname, user, employeeId, hasModuleAccess, router, params.locale]);
}
```

---

### Phase 4: Refactoring Architectural (MOYENNE PRIORITÉ)

#### 4.1 Unifier le Système de Navigation

**Problème actuel**: Deux systèmes séparés (`EMPLOYEE_PORTAL_NAVIGATION` et `EMPLOYEE_PORTAL_MODULES`)

**Solution**: Créer un système unifié qui peut générer la navigation selon le contexte (portail employé vs ERP global).

**Fichier**: `apps/web/src/lib/navigation/employee-portal.ts` (nouveau)

```typescript
/**
 * Système unifié de navigation pour le portail employé
 */
export interface UnifiedEmployeePortalNavigation {
  id: string;
  label: string;
  path: string;
  portalPath: (employeeId: number, locale: string) => string;
  globalPath: string;
  module: string;
  permission: string;
  children?: UnifiedEmployeePortalNavigation[];
}

export function getEmployeePortalNavigation(
  employeeId: number,
  locale: string,
  mode: 'portal' | 'global' = 'portal'
): UnifiedEmployeePortalNavigation[] {
  // Générer la navigation selon le mode
  // ...
}
```

#### 4.2 Créer un Context Provider pour le Portail Employé

**Fichier**: `apps/web/src/contexts/EmployeePortalContext.tsx` (nouveau)

```typescript
/**
 * Context pour le portail employé
 * Fournit l'employeeId, les permissions, et les helpers de routage
 */
'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useParams } from 'next/navigation';
import { useEmployeePortalPermissions } from '@/hooks/useEmployeePortalPermissions';

interface EmployeePortalContextValue {
  employeeId: number;
  locale: string;
  permissions: ReturnType<typeof useEmployeePortalPermissions>;
  getModulePath: (modulePath: string) => string;
  hasModuleAccess: (moduleName: string) => boolean;
}

const EmployeePortalContext = createContext<EmployeePortalContextValue | null>(null);

export function EmployeePortalProvider({ children }: { children: ReactNode }) {
  const params = useParams();
  const employeeId = params?.id ? parseInt(String(params.id)) : null;
  const locale = (params?.locale as string) || 'fr';
  const permissions = useEmployeePortalPermissions({ employeeId });
  
  if (!employeeId) {
    throw new Error('EmployeePortalProvider must be used within a route with [id]');
  }
  
  const getModulePath = (modulePath: string) => {
    if (modulePath.startsWith('/dashboard')) {
      return `/${locale}/portail-employe/${employeeId}/modules${modulePath.replace('/dashboard', '')}`;
    }
    return `/${locale}/portail-employe/${employeeId}${modulePath}`;
  };
  
  const value: EmployeePortalContextValue = {
    employeeId,
    locale,
    permissions,
    getModulePath,
    hasModuleAccess: permissions.hasModuleAccess,
  };
  
  return (
    <EmployeePortalContext.Provider value={value}>
      {children}
    </EmployeePortalContext.Provider>
  );
}

export function useEmployeePortal() {
  const context = useContext(EmployeePortalContext);
  if (!context) {
    throw new Error('useEmployeePortal must be used within EmployeePortalProvider');
  }
  return context;
}
```

#### 4.3 Mettre à Jour le Layout Principal

**Fichier**: `apps/web/src/app/[locale]/portail-employe/layout.tsx`

```typescript
import { EmployeePortalProvider } from '@/contexts/EmployeePortalContext';

export default function EmployeePortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <EmployeePortalProvider>
      <EmployeePortalLayoutContent>{children}</EmployeePortalLayoutContent>
    </EmployeePortalProvider>
  );
}
```

---

### Phase 5: Tests et Validation (HAUTE PRIORITÉ)

#### 5.1 Tests de Routage

- ✅ Test: Employé ne peut pas accéder à `/dashboard/*` depuis le portail
- ✅ Test: Employé peut accéder à `/portail-employe/[id]/modules/*` si permission
- ✅ Test: Employé est redirigé vers son portail s'il tente d'accéder à `/dashboard`
- ✅ Test: Les liens dans la navigation pointent vers les bonnes routes

#### 5.2 Tests de Permissions

- ✅ Test: Module non autorisé n'apparaît pas dans la navigation
- ✅ Test: Module non autorisé renvoie une erreur si accès direct
- ✅ Test: Les permissions sont vérifiées à chaque navigation

---

## 📊 Priorisation

### 🔴 URGENT (À faire immédiatement)
1. ✅ Créer la fonction de transformation de chemins
2. ✅ Mettre à jour les composants de navigation
3. ✅ Créer les routes manquantes pour les modules
4. ✅ Améliorer ProtectedRoute pour bloquer les employés

### 🟠 HAUTE PRIORITÉ (Cette semaine)
5. ✅ Créer le hook useEmployeePortalRouteGuard
6. ✅ Ajouter les tests de routage
7. ✅ Documenter les changements

### 🟡 MOYENNE PRIORITÉ (Ce mois)
8. ✅ Unifier le système de navigation
9. ✅ Créer le EmployeePortalContext
10. ✅ Refactoriser les composants pour utiliser le context

---

## 🔐 Sécurité

### Risques Identifiés

1. **Bypass des Permissions** ⚠️ CRITIQUE
   - Les employés peuvent accéder à des modules non autorisés
   - Solution: Protection au niveau routage + vérification des permissions

2. **Fuite de Contexte** ⚠️ HAUTE
   - Les employés peuvent voir des données qu'ils ne devraient pas voir
   - Solution: Scoping des données au niveau backend + vérification des permissions

3. **Navigation Non Sécurisée** ⚠️ HAUTE
   - Les liens peuvent mener à des pages non autorisées
   - Solution: Transformation systématique des chemins + vérification des permissions

---

## 📝 Checklist de Mise en Œuvre

### Phase 1: Correction Immédiate
- [ ] Créer `getEmployeePortalModulePath()` dans `employee-portal-modules.ts`
- [ ] Mettre à jour `EmployeePortalNavigation.tsx`
- [ ] Mettre à jour `EmployeePortalSidebar.tsx`
- [ ] Tester que les liens pointent vers les bonnes routes

### Phase 2: Routes Manquantes
- [ ] Créer la structure `/portail-employe/[id]/modules/`
- [ ] Créer `modules/layout.tsx`
- [ ] Créer les pages pour chaque module (commercial, reseau, etc.)
- [ ] Tester l'accès aux modules depuis le portail

### Phase 3: Protection Renforcée
- [ ] Améliorer `ProtectedRoute.tsx`
- [ ] Créer `useEmployeePortalRouteGuard.ts`
- [ ] Intégrer le guard dans le layout
- [ ] Tester les redirections

### Phase 4: Refactoring
- [ ] Créer `EmployeePortalContext`
- [ ] Unifier le système de navigation
- [ ] Mettre à jour tous les composants
- [ ] Tests complets

---

## 🎯 Résultat Attendu

Après implémentation, un employé dans son portail devrait:

1. ✅ Voir uniquement les modules auxquels il a accès
2. ✅ Cliquer sur un module et rester dans `/portail-employe/[id]/modules/...`
3. ✅ Ne pas pouvoir accéder à `/dashboard/*` directement
4. ✅ Être redirigé automatiquement vers son portail s'il tente d'accéder au dashboard principal
5. ✅ Voir une erreur ou être redirigé s'il tente d'accéder à un module non autorisé

---

## 📚 Fichiers à Modifier

### Créer
- `apps/web/src/hooks/useEmployeePortalRouteGuard.ts`
- `apps/web/src/contexts/EmployeePortalContext.tsx`
- `apps/web/src/app/[locale]/portail-employe/[id]/modules/layout.tsx`
- `apps/web/src/app/[locale]/portail-employe/[id]/modules/commercial/page.tsx`
- `apps/web/src/app/[locale]/portail-employe/[id]/modules/reseau/page.tsx`
- `apps/web/src/app/[locale]/portail-employe/[id]/modules/operations/page.tsx`
- ... (autres modules)

### Modifier
- `apps/web/src/lib/constants/employee-portal-modules.ts`
- `apps/web/src/components/employes/EmployeePortalNavigation.tsx`
- `apps/web/src/components/employes/EmployeePortalSidebar.tsx`
- `apps/web/src/components/auth/ProtectedRoute.tsx`
- `apps/web/src/app/[locale]/portail-employe/layout.tsx`

---

**Fin de l'audit**
