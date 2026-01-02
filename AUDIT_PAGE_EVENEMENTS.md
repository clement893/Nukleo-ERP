# Audit de la page Événements (`/fr/dashboard/agenda/evenements`)

**Date:** 2025-01-27  
**Page:** `/fr/dashboard/agenda/evenements`  
**Fichier:** `apps/web/src/app/[locale]/dashboard/agenda/evenements/page.tsx`

## Résumé exécutif

Après un refactor UI, cette page présente plusieurs fonctionnalités manquantes et des optimisations possibles. La page utilise actuellement une approche basique avec `useState` et `useEffect` au lieu de React Query, et plusieurs fonctionnalités communes aux autres pages du système ne sont pas implémentées.

---

## ✅ Fonctionnalités implémentées

1. **CRUD de base** ✅
   - Création d'événements via modal
   - Modification d'événements via modal
   - Suppression d'événements avec confirmation
   - Affichage dans une DataTable

2. **Filtrage** ✅
   - Filtre par type d'événement
   - Filtre par date (tous/à venir/passés)
   - Recherche par titre, description, lieu

3. **Affichage** ✅
   - DataTable avec colonnes : Titre, Date, Type, Lieu, Participants, Actions
   - Tri par date et heure
   - Pagination côté client (20 éléments par page)

---

## ❌ Fonctionnalités manquantes

### 1. **Migration vers React Query** ❌
**Problème:** La page utilise `useState` et `useEffect` pour charger les données au lieu de React Query.

**Impact:**
- Pas de cache automatique
- Pas de refetch automatique après mutations
- Pas de gestion optimiste des mises à jour
- Pas de synchronisation avec d'autres composants utilisant les mêmes données

**Solution:** Créer des hooks React Query (`useEvents`, `useCreateEvent`, `useUpdateEvent`, `useDeleteEvent`) similaires aux autres pages du système.

**Fichiers à créer/modifier:**
- `apps/web/src/lib/query/agenda.ts` (nouveau fichier)

---

### 2. **Export CSV/Excel** ❌
**Problème:** Aucune fonctionnalité d'export disponible.

**Impact:** Les utilisateurs ne peuvent pas exporter leurs événements pour analyse externe ou sauvegarde.

**Solution:** Ajouter un menu d'export dans le header avec options CSV et Excel, similaire aux pages `opportunites` et `clients`.

---

### 3. **Sélection multiple et actions en masse** ❌
**Problème:** Pas de possibilité de sélectionner plusieurs événements pour des actions groupées.

**Impact:** Les utilisateurs doivent supprimer/modifier les événements un par un.

**Solution:** 
- Ajouter des checkboxes pour sélection multiple
- Ajouter bouton "Sélectionner tout"
- Ajouter actions en masse : suppression groupée, changement de type groupé

---

### 4. **Menu contextuel (Dropdown)** ❌
**Problème:** Les actions (Modifier, Supprimer) sont directement dans la table, pas dans un menu contextuel.

**Impact:** Interface moins propre et moins cohérente avec le reste de l'application.

**Solution:** Remplacer les boutons d'action par un `Dropdown` avec icône `MoreVertical`, contenant :
- Voir les détails
- Modifier
- Dupliquer
- Supprimer

---

### 5. **Duplication d'événements** ❌
**Problème:** Pas de fonctionnalité pour dupliquer un événement existant.

**Impact:** Les utilisateurs doivent recréer manuellement des événements similaires.

**Solution:** Ajouter une action "Dupliquer" dans le menu contextuel qui crée une copie avec le titre modifié (ajout de " (copie)").

---

### 6. **Filtrage côté serveur** ❌
**Problème:** La page charge tous les événements (limit: 1000) et fait le filtrage côté client.

**Impact:**
- Performance dégradée avec beaucoup d'événements
- Charge inutile sur le réseau et le client
- Les filtres `start_date`, `end_date`, `event_type` de l'API ne sont pas utilisés

**Solution:** Utiliser les paramètres de l'API pour filtrer côté serveur :
- `start_date` et `end_date` pour le filtre de date
- `event_type` pour le filtre de type
- Implémenter une pagination côté serveur avec `skip` et `limit`

---

### 7. **Vue calendrier intégrée** ❌
**Problème:** La page n'affiche qu'une DataTable, pas de vue calendrier.

**Impact:** Les utilisateurs doivent aller sur la page calendrier pour voir les événements dans un contexte calendrier.

**Solution:** Ajouter un toggle pour basculer entre vue liste (DataTable) et vue calendrier (utiliser le composant `CalendarView` existant).

---

### 8. **Détails d'événement (Drawer)** ❌
**Problème:** Pas de drawer ou modal pour voir les détails complets d'un événement.

**Impact:** Les utilisateurs doivent modifier l'événement pour voir tous les détails.

**Solution:** Ajouter un drawer (comme pour les tâches) avec onglets :
- Informations (tous les détails)
- Modifier (formulaire d'édition)

---

### 9. **Debounce sur la recherche** ❌
**Problème:** La recherche se fait à chaque frappe sans debounce.

**Impact:** Performance dégradée avec beaucoup d'événements.

**Solution:** Utiliser le hook `useDebounce` pour attendre 300ms avant de filtrer.

---

### 10. **Gestion des erreurs améliorée** ⚠️
**Problème:** La gestion des erreurs est basique.

**Impact:** Les erreurs réseau ou API ne sont pas toujours bien gérées.

**Solution:** Améliorer la gestion des erreurs avec des messages plus spécifiques et un retry automatique pour les erreurs réseau.

---

## 🔧 Optimisations techniques

### 1. **Pagination côté serveur**
Actuellement, la pagination est uniquement côté client (20 éléments affichés sur les 1000 chargés). Implémenter une pagination côté serveur avec `skip` et `limit`.

### 2. **Infinite scroll ou pagination**
Pour améliorer l'UX, considérer un infinite scroll ou une pagination plus visible.

### 3. **Mise en cache intelligente**
Avec React Query, implémenter une stratégie de cache appropriée pour les événements (staleTime, gcTime).

### 4. **Optimistic updates**
Pour les mutations (create, update, delete), utiliser des mises à jour optimistes pour une meilleure UX.

---

## 🔗 Connexions non fonctionnelles

### 1. **Paramètres de filtrage API non utilisés**
L'API supporte `start_date`, `end_date`, et `event_type` mais ces paramètres ne sont pas utilisés dans `loadEvents()`. Le filtrage est fait entièrement côté client.

**Code actuel:**
```typescript
const allEvents = await agendaAPI.list({
  limit: 1000,
});
```

**Code attendu:**
```typescript
const events = await agendaAPI.list({
  start_date: filterDate === 'upcoming' ? new Date().toISOString().split('T')[0] : undefined,
  end_date: filterDate === 'past' ? new Date().toISOString().split('T')[0] : undefined,
  event_type: filterType !== 'all' ? filterType : undefined,
  limit: 20,
  skip: (page - 1) * 20,
});
```

### 2. **Hook React Query manquant**
Aucun hook React Query n'existe pour les événements, alors que le pattern est utilisé partout ailleurs dans l'application.

---

## 📊 Comparaison avec d'autres pages

En comparant avec les pages `opportunites` et `clients` qui ont été récemment refactorisées :

| Fonctionnalité | Événements | Opportunités | Clients |
|----------------|------------|--------------|---------|
| React Query | ❌ | ✅ | ✅ |
| Export CSV/Excel | ❌ | ✅ | ✅ |
| Sélection multiple | ❌ | ✅ | ✅ |
| Actions en masse | ❌ | ✅ | ✅ |
| Menu contextuel | ❌ | ✅ | ✅ |
| Duplication | ❌ | ✅ | ✅ |
| Filtrage serveur | ❌ | ✅ | ✅ |
| Debounce recherche | ❌ | ✅ | ✅ |

---

## 🎯 Priorités d'implémentation

### Priorité haute
1. Migration vers React Query
2. Filtrage côté serveur
3. Export CSV/Excel
4. Menu contextuel (Dropdown)

### Priorité moyenne
5. Sélection multiple et actions en masse
6. Duplication d'événements
7. Debounce sur la recherche
8. Drawer de détails

### Priorité basse
9. Vue calendrier intégrée
10. Optimistic updates

---

## 📝 Notes techniques

### Fichiers à créer
- `apps/web/src/lib/query/agenda.ts` - Hooks React Query pour les événements

### Fichiers à modifier
- `apps/web/src/app/[locale]/dashboard/agenda/evenements/page.tsx` - Migration complète vers React Query et ajout des fonctionnalités manquantes

### Composants à réutiliser
- `Dropdown` de `@/components/ui/Dropdown`
- `useDebounce` de `@/hooks/useDebounce`
- Pattern similaire aux pages `opportunites` et `clients`

---

## ✅ Conclusion

La page des événements fonctionne correctement pour les opérations CRUD de base, mais manque de nombreuses fonctionnalités modernes et optimisations présentes dans d'autres pages du système. Une refactorisation complète serait bénéfique pour :

1. **Performance** : Filtrage côté serveur et pagination
2. **UX** : Export, sélection multiple, menu contextuel
3. **Cohérence** : Utilisation de React Query comme les autres pages
4. **Maintenabilité** : Code plus moderne et aligné avec les patterns du projet

**Estimation:** ~2-3 jours de développement pour implémenter toutes les fonctionnalités manquantes.
