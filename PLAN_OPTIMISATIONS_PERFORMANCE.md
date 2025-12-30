# Plan d'Implémentation des Optimisations de Performance

**Date de Début**: 2025-01-30  
**Stratégie**: Implémentation par batches avec push à chaque étape

## Structure des Batches

### Batch 1: Quick Wins Backend (Critique) ✅ COMPLÉTÉ
**Objectif**: Réduire la latence backend de 50-70%  
**Temps estimé**: 1-2 heures  
**Impact**: 🔴 Critique  
**Statut**: ✅ Terminé et pushé (commit: 3aac0d43)

- [x] 1.1 Supprimer vérification S3 systématique dans `regenerate_photo_url`
- [x] 1.2 Implémenter cache pour presigned URLs (LRU cache)
- [x] 1.3 Optimiser la régénération des URLs (vérifier expiration avant régénération)
- [x] 1.4 Tests et validation

**Fichiers modifiés**:
- `backend/app/api/v1/endpoints/commercial/contacts.py`

**Résultats**:
- Cache LRU avec max 1000 entrées
- Régénération seulement si expiration < 1h
- Suppression vérification S3 (économie 50-100ms par photo)

---

### Batch 2: Quick Wins Frontend (Important) ✅ COMPLÉTÉ
**Objectif**: Améliorer l'expérience utilisateur immédiate  
**Temps estimé**: 1 heure  
**Impact**: 🟡 Important  
**Statut**: ✅ Terminé et pushé (commit: 33b9a451)

- [x] 2.1 Ajouter debounce sur la recherche (300ms)
- [x] 2.2 Désactiver rechargement automatique sur window focus
- [x] 2.3 Améliorer la gestion d'erreur des images (onError handler)
- [x] 2.4 Tests et validation

**Fichiers modifiés**:
- `apps/web/src/app/[locale]/dashboard/reseau/contacts/page.tsx`

**Résultats**:
- Debounce 300ms sur recherche (réduit re-renders)
- Rechargement sur focus désactivé (évite requêtes inutiles)
- ContactAvatar a déjà gestion d'erreur complète avec retry

---

### Batch 3: Cache Côté Client avec React Query (Critique)
**Objectif**: Éliminer les requêtes réseau inutiles  
**Temps estimé**: 2-3 heures  
**Impact**: 🔴 Critique

- [ ] 3.1 Vérifier installation React Query (déjà dans package.json)
- [ ] 3.2 Configurer QueryClient avec cache approprié
- [ ] 3.3 Migrer `contactsAPI.list` vers `useQuery`
- [ ] 3.4 Migrer autres endpoints critiques vers React Query
- [ ] 3.5 Tests et validation

**Fichiers à modifier**:
- `apps/web/src/lib/query/queryClient.ts` (créer/configurer)
- `apps/web/src/app/[locale]/dashboard/reseau/contacts/page.tsx`
- `apps/web/src/lib/api/contacts.ts`

---

### Batch 4: Virtualisation des Listes (Important)
**Objectif**: Améliorer les performances avec grandes listes  
**Temps estimé**: 2-3 heures  
**Impact**: 🟡 Important

- [ ] 4.1 Installer `@tanstack/react-virtual`
- [ ] 4.2 Créer composant DataTable virtualisé
- [ ] 4.3 Migrer page contacts vers virtualisation
- [ ] 4.4 Tests de performance avec grandes listes
- [ ] 4.5 Tests et validation

**Fichiers à modifier**:
- `apps/web/src/components/ui/DataTable.tsx`
- `apps/web/src/app/[locale]/dashboard/reseau/contacts/page.tsx`
- `apps/web/package.json` (ajout dépendance)

---

### Batch 5: Optimisation Images (Moyen)
**Objectif**: Réduire la taille des images et améliorer le chargement  
**Temps estimé**: 1-2 heures  
**Impact**: 🟢 Moyen

- [ ] 5.1 Remplacer `<img>` par Next.js `Image` component
- [ ] 5.2 Ajouter placeholder/skeleton pour images
- [ ] 5.3 Configurer optimisation images Next.js
- [ ] 5.4 Tests et validation

**Fichiers à modifier**:
- `apps/web/src/app/[locale]/dashboard/reseau/contacts/page.tsx`
- `apps/web/src/components/commercial/ContactsGallery.tsx`
- `apps/web/next.config.js` (si nécessaire)

---

### Batch 6: Optimisations Backend Avancées (Moyen)
**Objectif**: Réduire les requêtes DB et améliorer le cache  
**Temps estimé**: 2-3 heures  
**Impact**: 🟢 Moyen

- [ ] 6.1 Implémenter cache Redis pour requêtes fréquentes
- [ ] 6.2 Optimiser requêtes avec `selectinload` systématique
- [ ] 6.3 Ajouter cache sur endpoints critiques
- [ ] 6.4 Tests et validation

**Fichiers à modifier**:
- `backend/app/core/cache.py` (créer/configurer)
- `backend/app/api/v1/endpoints/commercial/contacts.py`
- `backend/requirements.txt` (ajout redis si nécessaire)

---

## Ordre d'Exécution Recommandé

1. **Batch 1** → Impact immédiat backend (50-70% réduction latence)
2. **Batch 2** → Amélioration UX immédiate
3. **Batch 3** → Impact majeur sur requêtes réseau
4. **Batch 4** → Performance avec grandes listes
5. **Batch 5** → Optimisation images
6. **Batch 6** → Optimisations avancées

## Critères de Validation par Batch

### Batch 1
- ✅ Temps de réponse API réduit de 50%+
- ✅ Pas d'appels S3 inutiles
- ✅ Cache fonctionnel

### Batch 2
- ✅ Recherche debounced fonctionnelle
- ✅ Pas de rechargement sur focus
- ✅ Images cassées gérées proprement

### Batch 3
- ✅ Requêtes mises en cache
- ✅ Refetch intelligent fonctionnel
- ✅ Pas de requêtes dupliquées

### Batch 4
- ✅ Performance stable avec 1000+ éléments
- ✅ Scroll fluide
- ✅ Mémoire optimisée

### Batch 5
- ✅ Images optimisées (WebP/AVIF)
- ✅ Placeholder visible pendant chargement
- ✅ Taille réduite

### Batch 6
- ✅ Cache Redis fonctionnel
- ✅ Requêtes DB optimisées
- ✅ Latence réduite

## Notes d'Implémentation

- Chaque batch doit être testé avant de passer au suivant
- Push Git après chaque batch validé
- Mesurer les métriques avant/après chaque batch
- Documenter les changements dans les commits

## Métriques à Surveiller

- Temps de réponse API (backend)
- Temps de chargement page (frontend)
- Nombre de requêtes réseau
- Taille des bundles
- Web Vitals (FCP, LCP, TTI, TBT, CLS)
