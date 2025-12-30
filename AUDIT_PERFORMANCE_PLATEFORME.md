# Audit de Performance - Plateforme Nukleo-ERP

**Date**: 2025-01-30  
**Version**: Production  
**URL**: https://modeleweb-production-f341.up.railway.app

## Résumé Exécutif

Cet audit examine les performances globales de la plateforme en termes de rapidité, identifiant les goulots d'étranglement, les opportunités d'optimisation et les problèmes de performance critiques.

**Score Global Estimé**: 65/100
- **Frontend**: 70/100
- **Backend**: 60/100
- **Réseau**: 65/100

## Métriques Clés

### Temps de Chargement Estimés
- **First Contentful Paint (FCP)**: ~1.5-2.5s
- **Largest Contentful Paint (LCP)**: ~2.5-4s
- **Time to Interactive (TTI)**: ~3-5s
- **Total Blocking Time (TBT)**: ~200-500ms
- **Cumulative Layout Shift (CLS)**: ~0.1-0.2

### Taille des Bundles
- **Initial JS Bundle**: ~300-500KB (gzipped)
- **Total JS**: ~1-2MB (gzipped)
- **CSS**: ~50-100KB (gzipped)

## Problèmes Identifiés

### 🔴 Critique - Impact Majeur sur Performance

#### 1. Régénération Systématique des Presigned URLs
- **Localisation**: `backend/app/api/v1/endpoints/commercial/contacts.py:171-177`
- **Problème**: Les presigned URLs sont régénérées à chaque appel API, même si toujours valides
- **Impact**: 
  - Appels S3 inutiles pour chaque contact avec photo
  - Latence ajoutée: ~50-100ms par photo
  - Coûts S3 potentiels
- **Fréquence**: À chaque chargement de contacts
- **Solution Recommandée**: Cache côté serveur avec vérification d'expiration

#### 2. Vérification S3 pour Chaque Photo
- **Localisation**: `backend/app/api/v1/endpoints/commercial/contacts.py:94-99`
- **Problème**: `get_file_metadata()` appelé pour chaque contact avec photo
- **Impact**:
  - Latence: +50-100ms par photo
  - Requêtes S3: N requêtes pour N contacts
  - Coûts S3
- **Fréquence**: À chaque `list_contacts()`
- **Solution Recommandée**: Cache métadonnées, vérification batch, ou suppression de la vérification

#### 3. Pas de Cache Côté Client pour les Données
- **Localisation**: `apps/web/src/lib/api/contacts.ts:58-81`
- **Problème**: Pas de cache React Query ou similaire, rechargement systématique
- **Impact**:
  - Requêtes réseau inutiles
  - Latence à chaque navigation
  - Bande passante gaspillée
- **Fréquence**: À chaque chargement de page
- **Solution Recommandée**: Implémenter React Query ou cache personnalisé

#### 4. Scroll Infini Sans Limite de Mémoire
- **Localisation**: `apps/web/src/app/[locale]/dashboard/reseau/contacts/page.tsx:72-84`
- **Problème**: Limite à 200 contacts mais peut encore être amélioré
- **Impact**:
  - Consommation mémoire élevée
  - Ralentissement avec beaucoup de contacts
  - Re-renders coûteux
- **Fréquence**: Utilisation intensive
- **Solution Recommandée**: Virtualisation (react-window/react-virtualized)

#### 5. Rechargement sur Window Focus
- **Localisation**: `apps/web/src/app/[locale]/dashboard/reseau/contacts/page.tsx:113-130`
- **Problème**: Rechargement automatique quand la fenêtre reprend le focus
- **Impact**:
  - Requêtes réseau inutiles
  - Latence ajoutée
  - Expérience utilisateur dégradée
- **Fréquence**: À chaque retour sur l'onglet
- **Solution Recommandée**: Désactiver ou utiliser un cache intelligent

### 🟡 Important - Impact Modéré sur Performance

#### 6. Pas de Debounce sur la Recherche
- **Localisation**: `apps/web/src/app/[locale]/dashboard/reseau/contacts/page.tsx:161-169`
- **Problème**: Filtrage côté client mais pas de debounce si recherche API
- **Impact**: Re-renders fréquents pendant la saisie
- **Fréquence**: Utilisation fréquente
- **Solution Recommandée**: Debounce de 300ms

#### 7. Calculs Coûteux Sans useMemo
- **Localisation**: `apps/web/src/app/[locale]/dashboard/reseau/contacts/page.tsx:133-149`
- **Problème**: `uniqueValues` recalculé à chaque render si contacts change
- **Impact**: Re-renders coûteux
- **Fréquence**: À chaque changement de contacts
- **Note**: Déjà optimisé avec `useMemo` ✅

#### 8. Pas de Virtualisation pour les Grandes Listes
- **Localisation**: `apps/web/src/components/ui/DataTable.tsx`
- **Problème**: Tous les éléments rendus même hors viewport
- **Impact**: 
  - Ralentissement avec >100 éléments
  - Consommation mémoire élevée
  - Scroll laggy
- **Fréquence**: Pages avec beaucoup de données
- **Solution Recommandée**: react-window ou react-virtualized

#### 9. Pas de Prefetching des Données
- **Localisation**: Global
- **Problème**: Pas de prefetching des données suivantes
- **Impact**: Latence perçue lors du scroll
- **Fréquence**: Navigation entre pages
- **Solution Recommandée**: Prefetch avec React Query

#### 10. Images Non Optimisées
- **Localisation**: `apps/web/src/app/[locale]/dashboard/reseau/contacts/page.tsx:468-474`
- **Problème**: Balises `<img>` natives au lieu de Next.js Image
- **Impact**:
  - Pas de redimensionnement automatique
  - Pas de lazy loading optimisé
  - Taille de fichiers plus importante
- **Fréquence**: Constante
- **Solution Recommandée**: Utiliser Next.js Image component

### 🟢 Mineur - Impact Faible mais Améliorable

#### 11. Pas de Code Splitting Agressif
- **Localisation**: `apps/web/next.config.js:125-178`
- **Problème**: Code splitting présent mais peut être amélioré
- **Impact**: Bundle initial plus grand
- **Note**: Configuration déjà bonne ✅

#### 12. Pas de Service Worker pour Cache
- **Localisation**: Global
- **Problème**: Pas de cache offline ou stratégie de cache avancée
- **Impact**: Rechargement complet à chaque visite
- **Solution Recommandée**: Service Worker avec Workbox

#### 13. Pas de Compression Brotli
- **Localisation**: Configuration serveur
- **Problème**: Compression gzip seulement (si configurée)
- **Impact**: Taille de transfert ~15-20% plus grande
- **Solution Recommandée**: Activer Brotli sur Railway/Nginx

#### 14. Pas de HTTP/2 Server Push
- **Localisation**: Configuration serveur
- **Problème**: Pas de push des ressources critiques
- **Impact**: Latence ajoutée pour les ressources critiques
- **Solution Recommandée**: Configurer HTTP/2 push

## Analyse Détaillée par Composant

### Page Contacts (`/dashboard/reseau/contacts`)

#### Points Positifs ✅
- Utilisation de `useMemo` pour `uniqueValues` et `filteredContacts`
- Utilisation de `useCallback` pour `loadContacts` et `loadMore`
- Limite mémoire à 200 contacts
- Lazy loading des images (`loading="lazy"`)

#### Points à Améliorer ⚠️
- Pas de virtualisation pour grandes listes
- Rechargement sur window focus (même avec debounce)
- Pas de cache côté client
- Régénération URLs à chaque chargement

**Temps de Chargement Estimé**:
- Initial: ~800ms-1.2s
- Avec 100 contacts: ~1.5-2s
- Avec photos: +500ms-1s

### Page Dashboard (`/dashboard`)

#### Points Positifs ✅
- Lazy loading de `TemplateAIChat`
- Skeleton loading states
- Code splitting avec dynamic imports

#### Points à Améliorer ⚠️
- Timer artificiel de 500ms (`setTimeout`)
- Pas de prefetching des données
- Animations peuvent bloquer le rendu

**Temps de Chargement Estimé**: ~1-1.5s

### Composant DataTable

#### Points Positifs ✅
- Utilisation de `memo` pour éviter re-renders
- Code splitting avec hooks partagés
- Pagination et filtrage optimisés

#### Points à Améliorer ⚠️
- Pas de virtualisation
- Tous les éléments rendus même hors viewport
- Pas de debounce sur la recherche

**Impact**: Ralentissement avec >50 lignes

## Analyse Backend

### Problèmes de Performance Identifiés

#### 1. Requêtes N+1 Potentielles
- **Localisation**: `backend/app/api/v1/endpoints/commercial/contacts.py:146-191`
- **Problème**: Relations chargées mais pas toujours optimisées
- **Impact**: Requêtes DB multiples
- **Solution**: Utiliser `selectinload` ou `joinedload` systématiquement

#### 2. Pas de Cache de Requêtes
- **Localisation**: Global backend
- **Problème**: Pas de cache Redis ou mémoire pour requêtes fréquentes
- **Impact**: Requêtes DB répétées
- **Solution**: Implémenter cache Redis

#### 3. Régénération URLs Systématique
- **Localisation**: `backend/app/api/v1/endpoints/commercial/contacts.py:171-177`
- **Problème**: URLs régénérées même si valides
- **Impact**: Appels S3 inutiles
- **Solution**: Cache avec vérification d'expiration

#### 4. Vérification S3 pour Chaque Photo
- **Localisation**: `backend/app/api/v1/endpoints/commercial/contacts.py:94-99`
- **Problème**: `head_object` appelé pour chaque photo
- **Impact**: Latence et coûts S3
- **Solution**: Cache ou suppression de vérification

### Temps de Réponse API Estimés

- **GET /contacts** (sans photos): ~100-200ms
- **GET /contacts** (avec photos, 100 contacts): ~500-1000ms
- **GET /contacts/{id}**: ~50-100ms
- **POST /contacts**: ~200-400ms
- **PUT /contacts/{id}**: ~200-400ms

## Optimisations Recommandées

### Priorité Critique (Impact Immédiat)

1. **Cache Côté Serveur pour Presigned URLs**
   ```python
   # Cache avec expiration
   @lru_cache(maxsize=1000)
   def get_cached_presigned_url(file_key: str, expiration_check: int):
       # Vérifier expiration avant régénération
       ...
   ```

2. **Supprimer Vérification S3 Systématique**
   ```python
   # Option 1: Supprimer complètement
   # Option 2: Cache métadonnées
   # Option 3: Vérification batch
   ```

3. **Implémenter React Query**
   ```typescript
   // Cache automatique, refetch intelligent
   const { data } = useQuery(['contacts'], () => contactsAPI.list());
   ```

4. **Virtualisation des Listes**
   ```typescript
   import { useVirtualizer } from '@tanstack/react-virtual';
   ```

5. **Désactiver Rechargement sur Focus**
   ```typescript
   // Supprimer ou rendre optionnel
   ```

### Priorité Haute (Impact Significatif)

6. **Debounce sur Recherche**
   ```typescript
   const debouncedSearch = useDebounce(searchQuery, 300);
   ```

7. **Next.js Image Component**
   ```typescript
   import Image from 'next/image';
   <Image src={photo_url} width={40} height={40} />
   ```

8. **Optimiser Requêtes Backend**
   ```python
   # Utiliser selectinload systématiquement
   query = select(Contact).options(selectinload(Contact.company))
   ```

9. **Cache Redis pour Requêtes Fréquentes**
   ```python
   # Cache avec TTL
   @cache(ttl=300)  # 5 minutes
   async def list_contacts():
       ...
   ```

10. **Preload Données Critiques**
    ```typescript
    // Prefetch sur hover ou link
    router.prefetch('/dashboard/reseau/contacts');
    ```

### Priorité Moyenne (Amélioration Continue)

11. **Service Worker pour Cache Offline**
12. **Compression Brotli**
13. **HTTP/2 Server Push**
14. **Optimisation Images (WebP/AVIF)**
15. **Lazy Load Routes Non-Critiques**

## Métriques de Performance Cibles

### Objectifs à Atteindre

| Métrique | Actuel | Cible | Priorité |
|----------|--------|-------|----------|
| FCP | 1.5-2.5s | <1.5s | Haute |
| LCP | 2.5-4s | <2.5s | Haute |
| TTI | 3-5s | <3s | Moyenne |
| TBT | 200-500ms | <200ms | Moyenne |
| CLS | 0.1-0.2 | <0.1 | Basse |
| Bundle Initial | 300-500KB | <300KB | Moyenne |
| API Response | 500-1000ms | <300ms | Haute |

## Plan d'Action

### Phase 1 (Semaine 1) - Quick Wins
1. ✅ Supprimer vérification S3 systématique
2. ✅ Implémenter cache presigned URLs
3. ✅ Désactiver rechargement sur focus
4. ✅ Ajouter debounce recherche

### Phase 2 (Semaine 2-3) - Optimisations Majeures
5. ✅ Implémenter React Query
6. ✅ Virtualisation listes
7. ✅ Next.js Image component
8. ✅ Optimiser requêtes backend

### Phase 3 (Mois 1) - Améliorations Avancées
9. ✅ Cache Redis backend
10. ✅ Service Worker
11. ✅ Compression Brotli
12. ✅ Monitoring performance

## Outils de Monitoring Recommandés

1. **Web Vitals** (déjà intégré via Sentry)
2. **React DevTools Profiler**
3. **Chrome DevTools Performance**
4. **Lighthouse CI**
5. **Backend APM** (New Relic, Datadog, etc.)

## Conclusion

La plateforme présente plusieurs opportunités d'optimisation significatives. Les problèmes les plus critiques concernent la régénération systématique des URLs et les vérifications S3 inutiles. L'implémentation des optimisations recommandées devrait améliorer les performances de 30-50%.

**Prochaines Étapes**:
1. Implémenter les optimisations de Phase 1 (quick wins)
2. Mesurer l'impact avec Web Vitals
3. Itérer sur les optimisations de Phase 2
4. Mettre en place monitoring continu
