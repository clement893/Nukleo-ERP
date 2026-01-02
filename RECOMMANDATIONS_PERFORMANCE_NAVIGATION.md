# Recommandations Performance Navigation

## Problèmes identifiés

### 1. **Absence de prefetching explicite sur les liens**
- Les composants `Link` n'utilisent pas `prefetch={true}` explicitement
- Pas de prefetch au survol des liens de navigation
- Les routes ne sont pas préchargées avant le clic

### 2. **Trop de `force-dynamic`**
- Empêche le caching côté serveur
- Force le re-rendu à chaque navigation
- Impact négatif sur les performances

### 3. **Pas de transitions visuelles**
- Pas de loading states pendant la navigation
- Pas de feedback visuel immédiat lors du clic
- L'utilisateur ne sait pas si la navigation est en cours

### 4. **Composants chargés dynamiquement avec `ssr: false`**
- Ralentit le chargement initial
- Pas de contenu visible pendant le chargement
- Mauvaise expérience utilisateur

### 5. **Absence de Suspense boundaries**
- Pas de gestion optimale du chargement
- Pas de fallbacks pendant le chargement des composants

### 6. **Pas de prefetching intelligent**
- Pas de préchargement des routes fréquemment visitées
- Pas de détection des liens visibles dans le viewport

---

## Solutions recommandées

### ✅ Priorité HAUTE

#### 1. **Activer le prefetching sur tous les liens de navigation**

**Fichiers à modifier:**
- `apps/web/src/components/layout/Sidebar.tsx`
- `apps/web/src/components/ui/Sidebar.tsx`
- `apps/web/src/components/ui/ButtonLink.tsx`

**Solution:**
```tsx
// Dans Sidebar.tsx, ligne 228
<Link 
  key={item.href} 
  href={item.href} 
  prefetch={true}  // ← Ajouter
  className={className}
>
  {content}
</Link>
```

**Bénéfices:**
- Précharge les routes au survol (Next.js le fait automatiquement)
- Navigation instantanée après le premier chargement
- Améliore significativement la perception de vitesse

---

#### 2. **Ajouter un prefetching au survol pour les liens de navigation**

**Créer un composant wrapper optimisé:**

```tsx
// apps/web/src/components/navigation/OptimizedLink.tsx
'use client';

import { Link } from '@/i18n/routing';
import { useRouter } from '@/i18n/routing';
import { useEffect, useRef } from 'react';

interface OptimizedLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  prefetch?: boolean;
  onMouseEnter?: () => void;
}

export function OptimizedLink({ 
  href, 
  children, 
  className,
  prefetch = true,
  onMouseEnter,
  ...props 
}: OptimizedLinkProps) {
  const router = useRouter();
  const prefetchedRef = useRef(false);

  const handleMouseEnter = () => {
    if (prefetch && !prefetchedRef.current) {
      router.prefetch(href);
      prefetchedRef.current = true;
    }
    onMouseEnter?.();
  };

  return (
    <Link
      href={href}
      prefetch={prefetch}
      className={className}
      onMouseEnter={handleMouseEnter}
      {...props}
    >
      {children}
    </Link>
  );
}
```

---

#### 3. **Ajouter des transitions de page avec loading states**

**Créer un composant de transition:**

```tsx
// apps/web/src/components/navigation/PageTransition.tsx
'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loading } from '@/components/ui';

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setDisplayChildren(children);
      setIsLoading(false);
    }, 150); // Délai minimal pour la transition

    return () => clearTimeout(timer);
  }, [pathname, children]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading />
      </div>
    );
  }

  return (
    <div 
      className="animate-fadeIn"
      style={{
        animation: 'fadeIn 0.2s ease-in-out',
      }}
    >
      {displayChildren}
    </div>
  );
}
```

**Ajouter dans `DashboardLayout.tsx`:**
```tsx
import { PageTransition } from '@/components/navigation/PageTransition';

// Dans le main:
<main>
  <PageTransition>
    {children}
  </PageTransition>
</main>
```

---

#### 4. **Réduire l'utilisation de `force-dynamic`**

**Stratégie:**
- Utiliser `force-dynamic` uniquement pour les pages qui nécessitent des données en temps réel
- Utiliser `revalidate` pour les pages qui peuvent être mises en cache
- Utiliser `dynamic = 'auto'` par défaut

**Exemple:**
```tsx
// Au lieu de:
export const dynamic = 'force-dynamic';

// Utiliser:
export const revalidate = 60; // Cache pendant 60 secondes
// ou
export const dynamic = 'auto'; // Laisser Next.js décider
```

---

### ✅ Priorité MOYENNE

#### 5. **Optimiser les imports dynamiques**

**Problème actuel:**
```tsx
const Sidebar = dynamicImport(() => import('@/components/ui/Sidebar'), { 
  ssr: false,  // ← Problème
  loading: () => <div>Loading...</div> 
});
```

**Solution:**
```tsx
const Sidebar = dynamicImport(() => import('@/components/ui/Sidebar'), { 
  ssr: true,  // ← Activer SSR pour le contenu initial
  loading: () => (
    <div className="flex items-center justify-center p-4">
      <Loading size="sm" />
    </div>
  )
});
```

---

#### 6. **Ajouter des Suspense boundaries**

**Dans les layouts:**
```tsx
import { Suspense } from 'react';
import { Loading } from '@/components/ui';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<Loading />}>
      {children}
    </Suspense>
  );
}
```

---

#### 7. **Prefetching intelligent des routes fréquentes**

**Créer un hook:**
```tsx
// apps/web/src/hooks/usePrefetchRoutes.ts
'use client';

import { useEffect } from 'react';
import { useRouter } from '@/i18n/routing';

const FREQUENT_ROUTES = [
  '/dashboard',
  '/dashboard/projets',
  '/dashboard/equipes',
  '/dashboard/leo',
];

export function usePrefetchRoutes() {
  const router = useRouter();

  useEffect(() => {
    // Prefetch les routes fréquentes après un délai
    const timer = setTimeout(() => {
      FREQUENT_ROUTES.forEach(route => {
        router.prefetch(route);
      });
    }, 2000); // Après 2 secondes d'inactivité

    return () => clearTimeout(timer);
  }, [router]);
}
```

**Utiliser dans `DashboardLayout.tsx`:**
```tsx
import { usePrefetchRoutes } from '@/hooks/usePrefetchRoutes';

function DashboardLayoutContent({ children }: DashboardLayoutProps) {
  usePrefetchRoutes(); // ← Ajouter
  // ... reste du code
}
```

---

#### 8. **Optimiser les requêtes de données**

**Utiliser React Query avec prefetching:**
```tsx
// Dans les composants de navigation
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

const handleLinkHover = (href: string) => {
  // Précharger les données nécessaires pour cette route
  if (href === '/dashboard/projets') {
    queryClient.prefetchQuery({
      queryKey: ['projects'],
      queryFn: () => projectsAPI.list(),
    });
  }
};
```

---

### ✅ Priorité BASSE (Améliorations supplémentaires)

#### 9. **Ajouter un indicateur de progression**

**Utiliser nprogress ou similaire:**
```tsx
// apps/web/src/components/navigation/ProgressBar.tsx
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function ProgressBar() {
  const pathname = usePathname();

  useEffect(() => {
    // Simuler une barre de progression
    const progressBar = document.getElementById('navigation-progress');
    if (progressBar) {
      progressBar.style.width = '0%';
      setTimeout(() => {
        progressBar.style.width = '100%';
      }, 10);
      setTimeout(() => {
        progressBar.style.width = '0%';
      }, 300);
    }
  }, [pathname]);

  return (
    <div
      id="navigation-progress"
      className="fixed top-0 left-0 h-1 bg-gradient-to-r from-[#5F2B75] via-[#523DC9] to-[#6B1817] z-50 transition-all duration-300"
      style={{ width: '0%' }}
    />
  );
}
```

---

#### 10. **Optimiser les animations CSS**

**Ajouter dans le CSS global:**
```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.2s ease-out;
}

/* Optimiser les transitions */
* {
  will-change: auto; /* Ne pas forcer will-change partout */
}

/* Optimiser les transitions de navigation */
[data-navigation-active] {
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

#### 11. **Lazy loading des composants lourds**

**Pour les composants non critiques:**
```tsx
const HeavyComponent = dynamic(
  () => import('./HeavyComponent'),
  {
    loading: () => <Skeleton />,
    ssr: false, // Seulement si vraiment nécessaire
  }
);
```

---

## Plan d'implémentation

### Phase 1 - Quick Wins (1-2h)
1. ✅ Ajouter `prefetch={true}` sur tous les liens de navigation
2. ✅ Réduire `force-dynamic` où possible
3. ✅ Ajouter un indicateur de progression simple

### Phase 2 - Améliorations moyennes (3-4h)
4. ✅ Créer le composant `OptimizedLink`
5. ✅ Ajouter les transitions de page
6. ✅ Optimiser les imports dynamiques

### Phase 3 - Optimisations avancées (4-6h)
7. ✅ Implémenter le prefetching intelligent
8. ✅ Ajouter les Suspense boundaries
9. ✅ Optimiser les requêtes avec React Query prefetching

---

## Métriques à surveiller

- **Time to Interactive (TTI)**: < 3s
- **First Contentful Paint (FCP)**: < 1.5s
- **Navigation delay**: < 100ms
- **Perceived performance**: Feedback visuel immédiat

---

## Notes importantes

1. **Next.js prefetch par défaut**: Next.js précharge automatiquement les liens visibles dans le viewport. Assurez-vous que les liens sont bien visibles.

2. **Mobile vs Desktop**: Le prefetching peut être désactivé sur mobile pour économiser la bande passante. Next.js le gère automatiquement.

3. **Testing**: Tester sur des connexions lentes pour valider les améliorations.

4. **Monitoring**: Utiliser les DevTools de Chrome (Network tab) pour vérifier le prefetching.
