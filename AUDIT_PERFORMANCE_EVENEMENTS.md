# Audit de Performance - Page Événements

**Date:** 2025-01-27  
**Page:** `/fr/dashboard/agenda/evenements`  
**Fichier:** `apps/web/src/app/[locale]/dashboard/agenda/evenements/page.tsx`

## 🔴 Problèmes Critiques

### 1. **Chargement excessif de données (limit: 1000)**
**Ligne:** 75  
**Problème:** La page charge jusqu'à 1000 événements d'un coup pour la recherche côté client.

**Impact:**
- Temps de chargement initial élevé
- Consommation mémoire excessive
- Latence réseau importante
- Expérience utilisateur dégradée

**Solution:**
- Implémenter pagination côté serveur avec `skip` et `limit`
- Utiliser `useInfiniteEvents` pour le scroll infini
- Limiter à 50-100 événements par page
- Faire la recherche côté serveur si possible

**Gain estimé:** 70-80% de réduction du temps de chargement

---

### 2. **Recalculations inutiles à chaque render**
**Lignes:** 63-65, 340-348  
**Problème:** `today`, `todayString` et `formatDate` sont recalculés à chaque render.

**Impact:**
- Recalculs inutiles à chaque interaction
- Performance dégradée lors du scroll/interactions

**Solution:**
```typescript
// Utiliser useMemo pour todayString
const todayString = useMemo(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.toISOString().split('T')[0];
}, []); // Ne change qu'une fois par jour

// Mémoriser formatDate avec useCallback
const formatDate = useCallback((dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}, []);
```

**Gain estimé:** 10-15% d'amélioration des performances de rendu

---

## 🟠 Problèmes Majeurs

### 3. **Handlers non mémorisés**
**Lignes:** 127-330  
**Problème:** Tous les handlers (`handleCreate`, `handleUpdate`, `handleDelete`, etc.) sont recréés à chaque render.

**Impact:**
- Re-renders inutiles des composants enfants
- Re-création des fonctions à chaque render
- Performance dégradée lors des interactions

**Solution:**
```typescript
const handleCreate = useCallback(async (eventData: Omit<DayEvent, 'id'>) => {
  // ... code existant
}, [createEventMutation, showToast]);

const handleUpdate = useCallback(async (_eventId: string, eventData: Partial<DayEvent>) => {
  // ... code existant
}, [selectedEvent, updateEventMutation, showToast]);

const handleDelete = useCallback(async (event: CalendarEvent) => {
  // ... code existant
}, [deleteEventMutation, showToast]);
```

**Gain estimé:** 20-30% de réduction des re-renders

---

### 4. **Colonnes de table recréées à chaque render**
**Lignes:** 362-474  
**Problème:** Le tableau `columns` est recréé à chaque render, causant des re-renders de DataTable.

**Impact:**
- Re-render complet de la DataTable à chaque changement d'état
- Performance dégradée avec beaucoup de lignes

**Solution:**
```typescript
const columns: Column<CalendarEvent>[] = useMemo(() => [
  // ... colonnes
], [selectedEvents, eventTypeLabels, toggleEventSelection, handleViewDetails, handleDuplicate, handleDelete]);
```

**Gain estimé:** 30-40% de réduction des re-renders de la table

---

### 5. **Recherche côté client sur 1000 événements**
**Lignes:** 99-109  
**Problème:** La recherche filtre côté client sur potentiellement 1000 événements.

**Impact:**
- Latence lors de la saisie (même avec debounce)
- Performance dégradée avec beaucoup d'événements
- Pas de pagination efficace

**Solution:**
- Implémenter recherche côté serveur via API
- Utiliser pagination avec recherche
- Limiter les résultats à 50-100 par page

**Gain estimé:** 60-70% d'amélioration de la réactivité de la recherche

---

### 6. **Tri côté client sur tous les événements**
**Lignes:** 112-124  
**Problème:** Le tri est fait côté client sur tous les événements filtrés.

**Impact:**
- Latence lors du changement de tri
- Performance dégradée avec beaucoup d'événements

**Solution:**
- Faire le tri côté serveur via paramètres API
- Utiliser `order_by` dans la requête API

**Gain estimé:** 50-60% d'amélioration du temps de tri

---

## 🟡 Problèmes Moyens

### 7. **Export traite tous les événements triés**
**Lignes:** 273-311  
**Problème:** L'export traite tous les événements triés, peut être lent avec beaucoup de données.

**Impact:**
- Latence lors de l'export avec beaucoup d'événements
- Blocage potentiel de l'UI

**Solution:**
- Utiliser Web Workers pour l'export
- Limiter l'export aux événements filtrés/visibles
- Ajouter un indicateur de progression

**Gain estimé:** 40-50% d'amélioration de la réactivité lors de l'export

---

### 8. **Actions en masse sans limite de concurrence**
**Lignes:** 215-248  
**Problème:** Les actions en masse font toutes les requêtes en parallèle sans limite.

**Impact:**
- Surcharge du serveur avec beaucoup d'événements sélectionnés
- Risque de timeouts
- Expérience utilisateur dégradée

**Solution:**
- Limiter à 10-20 requêtes parallèles maximum
- Utiliser un batch API si disponible
- Ajouter un indicateur de progression

**Gain estimé:** 30-40% d'amélioration de la fiabilité

---

### 9. **Pas de React.memo sur les composants**
**Problème:** Les composants enfants ne sont pas mémorisés.

**Impact:**
- Re-renders inutiles des composants enfants
- Performance dégradée lors des interactions

**Solution:**
- Utiliser `React.memo` sur les composants enfants
- Mémoriser les props passées aux composants

**Gain estimé:** 15-20% de réduction des re-renders

---

### 10. **eventTypeLabels recréé à chaque render**
**Ligne:** 351-359  
**Problème:** `eventTypeLabels` est recréé à chaque render alors qu'il est constant.

**Solution:**
```typescript
const eventTypeLabels: Record<string, string> = useMemo(() => ({
  meeting: 'Réunion',
  appointment: 'Rendez-vous',
  // ...
}), []);
```

**Gain estimé:** 5% d'amélioration (mineur mais bonnes pratiques)

---

## 🔵 Optimisations Recommandées

### 11. **Virtualisation de la table**
**Problème:** La DataTable rend tous les éléments même ceux non visibles.

**Solution:**
- Utiliser `react-window` ou `react-virtualized` pour la virtualisation
- Ne rendre que les lignes visibles

**Gain estimé:** 50-70% d'amélioration avec beaucoup de lignes

---

### 12. **Lazy loading des modals/drawer**
**Problème:** Les modals et drawer sont toujours montés même quand fermés.

**Solution:**
- Utiliser `lazy` et `Suspense` pour charger les composants modaux
- Ne monter que quand nécessaire

**Gain estimé:** 10-15% de réduction du bundle initial

---

### 13. **Optimistic updates**
**Problème:** Les mutations attendent la réponse serveur avant de mettre à jour l'UI.

**Solution:**
- Implémenter des mises à jour optimistes
- Rollback en cas d'erreur

**Gain estimé:** 80-90% d'amélioration de la perception de la vitesse

---

### 14. **Cache React Query optimisé**
**Problème:** Le cache peut être amélioré avec des stratégies plus agressives.

**Solution:**
- Augmenter `staleTime` pour les données peu changeantes
- Utiliser `keepPreviousData` pour les transitions
- Implémenter prefetching

**Gain estimé:** 20-30% de réduction des requêtes réseau

---

## 📊 Métriques de Performance Actuelles (Estimées)

| Métrique | Valeur Actuelle | Cible | Amélioration Nécessaire |
|----------|----------------|-------|------------------------|
| **Temps de chargement initial** | ~2-3s (1000 événements) | <1s | 60-70% |
| **Temps de recherche** | ~100-200ms (1000 événements) | <50ms | 50-75% |
| **Temps de tri** | ~50-100ms (1000 événements) | <20ms | 60-80% |
| **Re-renders par interaction** | 5-10 | 1-2 | 70-80% |
| **Mémoire utilisée** | ~10-15MB (1000 événements) | <5MB | 50-70% |
| **Temps d'export** | ~500ms-1s (1000 événements) | <200ms | 60-80% |

---

## 🎯 Plan d'Optimisation Priorisé

### Phase 1 - Quick Wins (1-2h)
1. ✅ Mémoriser `todayString` avec `useMemo`
2. ✅ Mémoriser `formatDate` avec `useCallback`
3. ✅ Mémoriser `eventTypeLabels` avec `useMemo`
4. ✅ Mémoriser les handlers avec `useCallback`
5. ✅ Mémoriser les colonnes avec `useMemo`

**Gain estimé:** 30-40% d'amélioration globale

---

### Phase 2 - Optimisations Majeures (3-4h)
6. ✅ Implémenter pagination côté serveur
7. ✅ Limiter le chargement à 50-100 événements
8. ✅ Implémenter recherche côté serveur
9. ✅ Implémenter tri côté serveur
10. ✅ Limiter les actions en masse (batch de 10-20)

**Gain estimé:** 60-70% d'amélioration globale

---

### Phase 3 - Optimisations Avancées (4-6h)
11. ✅ Virtualisation de la table
12. ✅ Lazy loading des modals
13. ✅ Optimistic updates
14. ✅ Web Workers pour l'export
15. ✅ React.memo sur les composants enfants

**Gain estimé:** 20-30% d'amélioration supplémentaire

---

## 📝 Code d'Exemple - Optimisations

### Exemple 1: Handlers mémorisés
```typescript
const handleCreate = useCallback(async (eventData: Omit<DayEvent, 'id'>) => {
  try {
    const eventDate = eventData.date || new Date();
    const dateString: string = eventDate.toISOString().split('T')[0] ?? '';
    const createData: CalendarEventCreate = {
      title: eventData.title,
      description: eventData.description,
      date: dateString,
      end_date: eventData.endDate?.toISOString().split('T')[0],
      time: eventData.time,
      type: eventData.type || 'other',
      location: eventData.location,
      attendees: eventData.attendees,
      color: eventData.color,
    };

    await createEventMutation.mutateAsync(createData);
    setShowCreateModal(false);
    showToast({
      message: 'Événement créé avec succès',
      type: 'success',
    });
  } catch (err) {
    const appError = handleApiError(err);
    showToast({
      message: appError.message || 'Erreur lors de la création de l\'événement',
      type: 'error',
    });
    throw err;
  }
}, [createEventMutation, showToast]);
```

### Exemple 2: Pagination côté serveur
```typescript
const [page, setPage] = useState(1);
const pageSize = 50;

const { data: events = [], isLoading, error } = useEvents({
  ...apiParams,
  skip: (page - 1) * pageSize,
  limit: pageSize,
});
```

### Exemple 3: Colonnes mémorisées
```typescript
const columns: Column<CalendarEvent>[] = useMemo(() => [
  {
    key: 'select',
    label: '',
    render: (_value, event) => (
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleEventSelection(event.id);
        }}
        className="flex items-center justify-center"
      >
        {selectedEvents.has(event.id) ? (
          <CheckSquareIcon className="w-4 h-4 text-primary" />
        ) : (
          <Square className="w-4 h-4 text-gray-400" />
        )}
      </button>
    ),
  },
  // ... autres colonnes
], [selectedEvents, toggleEventSelection, handleViewDetails, handleDuplicate, handleDelete]);
```

---

## ✅ Conclusion

La page des événements présente plusieurs opportunités d'optimisation de performance. Les optimisations de la Phase 1 peuvent être implémentées rapidement et apporteront une amélioration significative. Les optimisations des Phases 2 et 3 nécessitent plus de travail mais apporteront des gains encore plus importants.

**Gain total estimé:** 70-85% d'amélioration des performances après toutes les optimisations.

**Priorité:** Implémenter au minimum la Phase 1 pour une amélioration immédiate et visible.
