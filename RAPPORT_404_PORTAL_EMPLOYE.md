# Rapport d'Investigation : Erreurs 404 sur les Portails Employés

**Date** : 2026-01-02  
**URL problématique** : `https://modeleweb-production-f341.up.railway.app/fr/fr/portail-employe/17/projets`  
**Problème** : Double préfixe de locale `/fr/fr/` causant des erreurs 404

---

## 🔍 Problème Identifié

L'URL contient un **double préfixe de locale** : `/fr/fr/portail-employe/17/projets` au lieu de `/fr/portail-employe/17/projets`.

### Cause Racine

Le problème vient d'une **incompatibilité entre la gestion automatique des préfixes de locale par `next-intl` et l'ajout manuel du préfixe dans le code**.

1. **`next-intl` gère automatiquement les préfixes** via le middleware (`apps/web/src/middleware.ts`)
2. **Le code ajoute manuellement `/${locale}/`** dans plusieurs endroits
3. **Résultat** : Le middleware ajoute `/fr/` ET le code ajoute aussi `/fr/`, créant `/fr/fr/`

---

## 📍 Fichiers Affectés

### 1. Navigation et Redirections

**Fichiers avec liens manuels incluant le préfixe de locale :**

- `apps/web/src/app/[locale]/dashboard/management/employes/page.tsx` (lignes 719, 833)
  ```typescript
  router.push(`/${locale}/portail-employe/${employee.id}/dashboard`);
  ```

- `apps/web/src/app/[locale]/portail-employe/[id]/notifications/preferences/page.tsx` (lignes 24, 69)
  ```typescript
  router.push(`/${locale}/portail-employe`);
  router.push(`/${locale}/portail-employe/${employeeId}/notifications`);
  ```

- `apps/web/src/app/[locale]/portail-employe/[id]/notifications/page.tsx` (lignes 31, 150)
  ```typescript
  router.push(`/${locale}/portail-employe`);
  router.push(`/${locale}/portail-employe/${employeeId}/notifications/preferences`);
  ```

- `apps/web/src/components/employes/EmployeePortalSidebar.tsx` (ligne 411)
  ```typescript
  <Link href={`/${locale}/portail-employe/${employeeId}/dashboard`}>
  ```

- `apps/web/src/components/employes/EmployeeRowActions.tsx` (ligne 60)
  ```typescript
  router.push(`/${locale}/portail-employe/${employee.id}/dashboard`);
  ```

- `apps/web/src/app/[locale]/dashboard/management/employes/[id]/page.tsx` (ligne 184)
  ```typescript
  router.push(`/${locale}/portail-employe/${employee.id}`);
  ```

- `apps/web/src/hooks/useEmployeePortalRouteGuard.ts` (lignes 41, 58)
  ```typescript
  router.replace(`/${locale}/portail-employe/${employeeId}/dashboard?error=no_permission`);
  router.replace(`/${locale}/portail-employe/${employee.id}/dashboard?error=employee_redirect`);
  ```

### 2. Configuration i18n

**Fichier** : `apps/web/src/i18n/routing.ts`
- Configuration : `localePrefix: { mode: 'as-needed', prefixes: { fr: '/fr' } }`
- Le middleware `next-intl` ajoute automatiquement `/fr/` pour les routes françaises

**Fichier** : `apps/web/src/middleware.ts`
- Le middleware appelle `intlMiddleware(request)` qui gère automatiquement les préfixes
- Les redirections i18n sont retournées immédiatement (lignes 52-54)

### 3. Helpers de Navigation

**Fichier** : `apps/web/src/i18n/routing.ts` (ligne 58)
- Exporte des helpers typés : `Link`, `redirect`, `usePathname`, `useRouter` depuis `createNavigation(routing)`
- **Ces helpers devraient être utilisés** au lieu de `next/navigation` pour gérer automatiquement les préfixes

---

## 🔧 Solution Recommandée

### Option 1 : Utiliser les Helpers de Navigation de `next-intl` (Recommandé)

Remplacer tous les imports et usages de `next/navigation` par les helpers de `next-intl` :

**Avant :**
```typescript
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

router.push(`/${locale}/portail-employe/${id}/dashboard`);
<Link href={`/${locale}/portail-employe/${id}/dashboard`}>
```

**Après :**
```typescript
import { useRouter, usePathname, Link } from '@/i18n/routing';

router.push(`/portail-employe/${id}/dashboard`); // Sans préfixe de locale
<Link href={`/portail-employe/${id}/dashboard`}> // Sans préfixe de locale
```

Les helpers de `next-intl` ajoutent automatiquement le préfixe de locale approprié.

### Option 2 : Supprimer les Préfixes Manuels

Si on continue d'utiliser `next/navigation`, supprimer tous les préfixes `/${locale}/` manuels :

**Avant :**
```typescript
router.push(`/${locale}/portail-employe/${id}/dashboard`);
```

**Après :**
```typescript
router.push(`/portail-employe/${id}/dashboard`);
```

Le middleware `next-intl` ajoutera automatiquement le préfixe.

### Option 3 : Utiliser `useLocale()` et Construire les Chemins Correctement

```typescript
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';

const locale = useLocale();
const router = useRouter();

// Construire le chemin sans préfixe si c'est la locale par défaut
const path = locale === 'en' 
  ? `/portail-employe/${id}/dashboard`
  : `/${locale}/portail-employe/${id}/dashboard`;

router.push(path);
```

---

## 📋 Liste Complète des Fichiers à Corriger

1. ✅ `apps/web/src/app/[locale]/dashboard/management/employes/page.tsx`
2. ✅ `apps/web/src/app/[locale]/portail-employe/[id]/notifications/preferences/page.tsx`
3. ✅ `apps/web/src/app/[locale]/portail-employe/[id]/notifications/page.tsx`
4. ✅ `apps/web/src/components/employes/EmployeePortalSidebar.tsx`
5. ✅ `apps/web/src/components/employes/EmployeeRowActions.tsx`
6. ✅ `apps/web/src/app/[locale]/dashboard/management/employes/[id]/page.tsx`
7. ✅ `apps/web/src/hooks/useEmployeePortalRouteGuard.ts`
8. ✅ `apps/web/src/app/[locale]/auth/login/page.tsx` (ligne 89)
9. ✅ `apps/web/src/app/[locale]/auth/employee-login/page.tsx` (ligne 95)
10. ✅ `apps/web/src/components/employes/EmployeeDetail.tsx` (ligne 225)

---

## 🧪 Tests à Effectuer

Après correction, tester :

1. **Navigation depuis la page des employés** vers le portail employé
2. **Navigation interne** dans le portail employé (dashboard, projets, tâches, etc.)
3. **Redirections automatiques** (quand un employé accède au dashboard principal)
4. **Changement de locale** (si applicable)
5. **Liens directs** vers les pages du portail employé

---

## ⚠️ Notes Importantes

1. **Le middleware `next-intl` gère déjà les préfixes** - ne pas les ajouter manuellement
2. **Les helpers de `next-intl` sont préférés** pour la navigation
3. **Vérifier que `usePathname()` retourne le pathname avec le préfixe** (si on utilise les helpers de `next-intl`)
4. **Tester en production** car le comportement peut différer entre dev et prod

---

## 🔗 Références

- Documentation `next-intl` : https://next-intl-docs.vercel.app/docs/routing/navigation
- Fichier de configuration : `apps/web/src/i18n/routing.ts`
- Middleware : `apps/web/src/middleware.ts`
