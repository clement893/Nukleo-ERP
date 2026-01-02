# Audit de la Page Calendrier

**Date**: 2025-01-27  
**Page**: `/fr/dashboard/agenda/calendrier`  
**Fichier**: `apps/web/src/app/[locale]/dashboard/agenda/calendrier/page.tsx`

## 📋 Résumé Exécutif

La page calendrier affiche correctement les événements (jours fériés, vacances, événements, anniversaires, dates d'embauche) mais plusieurs fonctionnalités essentielles ne sont pas implémentées ou non fonctionnelles, notamment la création/édition/suppression d'événements, les vues semaine/jour, et l'interaction avec les événements.

---

## 🔴 Problèmes Critiques

### 1. **Bouton "Nouvel événement" Non Fonctionnel**
**Problème**: Le bouton "Nouvel événement" dans le header n'a pas de handler `onClick`.

**Code concerné**: 
```typescript
// Ligne 299-302
<Button className="bg-white text-[#523DC9] hover:bg-white/90">
  <Plus className="w-4 h-4 mr-2" />
  Nouvel événement
</Button>
```

**Impact**: 
- Impossible de créer un nouvel événement depuis cette page
- Bouton présent mais inutile

**Recommandation**: 
- Ajouter un handler `onClick` qui ouvre un modal de création
- Créer un composant `EventForm` ou utiliser un modal existant
- Utiliser `agendaAPI.create()` pour créer l'événement

**API disponible**: ✅ `agendaAPI.create()` existe et fonctionne  
**Hook disponible**: ❌ Pas de hook React Query (fichier `agenda.ts` existe mais vide)

---

### 2. **Pas de Fonctionnalité d'Édition d'Événement**
**Problème**: Impossible d'éditer un événement existant depuis le calendrier.

**Code concerné**: 
- Aucun bouton "Éditer" sur les événements
- Les événements ne sont pas cliquables pour voir les détails

**Impact**: 
- Impossible de modifier un événement après création
- Doit être fait manuellement via API ou base de données

**Recommandation**: 
- Rendre les événements cliquables pour ouvrir un modal de détails
- Ajouter un bouton "Éditer" dans le modal de détails
- Utiliser `agendaAPI.update()` pour modifier l'événement

**API disponible**: ✅ `agendaAPI.update()` existe et fonctionne

---

### 3. **Pas de Fonctionnalité de Suppression d'Événement**
**Problème**: Impossible de supprimer un événement depuis le calendrier.

**Code concerné**: 
- Aucun bouton "Supprimer" sur les événements
- Pas de modal de détails pour accéder à la suppression

**Impact**: 
- Impossible de supprimer un événement
- Doit être fait manuellement via API ou base de données

**Recommandation**: 
- Ajouter un bouton "Supprimer" dans le modal de détails
- Utiliser `agendaAPI.delete()` pour supprimer l'événement
- Ajouter une confirmation avant suppression

**API disponible**: ✅ `agendaAPI.delete()` existe et fonctionne

---

### 4. **Vues Semaine et Jour Non Implémentées**
**Problème**: Les boutons "Semaine" et "Jour" changent le state `viewMode` mais seule la vue "Mois" est implémentée.

**Code concerné**: 
```typescript
// Ligne 376-378
<Button variant={viewMode === 'month' ? 'primary' : 'outline'} onClick={() => setViewMode('month')}>Mois</Button>
<Button variant={viewMode === 'week' ? 'primary' : 'outline'} onClick={() => setViewMode('week')}>Semaine</Button>
<Button variant={viewMode === 'day' ? 'primary' : 'outline'} onClick={() => setViewMode('day')}>Jour</Button>
```

**Impact**: 
- Les boutons changent le state mais rien ne se passe visuellement
- Utilisateurs confus car les boutons semblent fonctionner mais rien ne change

**Recommandation**: 
- Implémenter la vue semaine (affichage des 7 jours de la semaine)
- Implémenter la vue jour (affichage détaillé d'un seul jour)
- Ou désactiver les boutons si non implémentés

---

### 5. **Événements Non Cliquables**
**Problème**: Les événements affichés dans le calendrier ne sont pas cliquables pour voir les détails.

**Code concerné**: 
```typescript
// Ligne 419-426
{day.events.slice(0, 3).map(event => (
  <div
    key={event.id}
    className="text-xs px-2 py-1 rounded truncate"
    style={{ backgroundColor: event.color + '20', color: event.color }}
  >
    {event.title}
  </div>
))}
```

**Impact**: 
- Impossible de voir les détails d'un événement (description, heure, lieu, participants)
- Pas d'interaction avec les événements

**Recommandation**: 
- Rendre les événements cliquables
- Ouvrir un modal avec les détails complets de l'événement
- Afficher description, heure, lieu, participants, type, etc.

---

### 6. **Pas de Modal de Détails d'Événement**
**Problème**: Aucun modal pour afficher les détails d'un événement.

**Impact**: 
- Impossible de voir les informations complètes d'un événement
- Pas d'accès à la description, heure, lieu, participants

**Recommandation**: 
- Créer un modal `EventDetailModal` ou utiliser `DayEventsModal` existant
- Afficher toutes les informations de l'événement
- Permettre édition et suppression depuis ce modal

**Composant disponible**: ✅ `DayEventsModal` existe dans `apps/web/src/components/agenda/DayEventsModal.tsx` mais n'est pas utilisé

---

## ⚠️ Fonctionnalités Manquantes

### 7. **Pas de React Query Hooks**
**Problème**: Le fichier `apps/web/src/lib/query/agenda.ts` existe mais ne contient pas de hooks React Query.

**Code concerné**: 
```typescript
// apps/web/src/lib/query/agenda.ts
// Note: Agenda currently doesn't have dedicated React Query hooks
// This file is prepared for future implementation
```

**Impact**: 
- Pas de cache automatique des événements
- Pas de refetch automatique après mutations
- Gestion manuelle du state avec `useState` et `useEffect`

**Recommandation**: 
- Créer `useCalendarEvents()` hook pour lister les événements
- Créer `useCreateCalendarEvent()` hook pour créer
- Créer `useUpdateCalendarEvent()` hook pour modifier
- Créer `useDeleteCalendarEvent()` hook pour supprimer
- Utiliser ces hooks dans la page au lieu de `useState` et `useEffect`

---

### 8. **Pas de Rafraîchissement Après Mutations**
**Problème**: Après création/modification/suppression d'un événement, le calendrier n'est pas rafraîchi automatiquement.

**Code concerné**: 
- La fonction `loadCalendarData()` n'est appelée qu'une fois dans `useEffect`
- Pas de refetch après mutations

**Impact**: 
- Les nouveaux événements n'apparaissent pas immédiatement
- Les modifications ne sont pas visibles sans rechargement de la page

**Recommandation**: 
- Utiliser React Query pour gérer le cache et le refetch automatique
- Ou appeler `loadCalendarData()` après chaque mutation

---

### 9. **Pas de Filtrage par Date**
**Problème**: L'API supporte le filtrage par `start_date` et `end_date` mais ces paramètres ne sont pas utilisés.

**Code concerné**: 
```typescript
// Ligne 156
const apiEvents = await agendaAPI.list();
// Devrait être:
const apiEvents = await agendaAPI.list({ 
  start_date: startOfMonth, 
  end_date: endOfMonth 
});
```

**Impact**: 
- Tous les événements sont chargés même ceux hors du mois affiché
- Performance dégradée avec beaucoup d'événements

**Recommandation**: 
- Calculer `start_date` et `end_date` basés sur la vue actuelle (mois, semaine, jour)
- Passer ces paramètres à `agendaAPI.list()`
- Améliorer les performances en ne chargeant que les événements nécessaires

---

### 10. **Composant CalendarView Non Utilisé**
**Problème**: Un composant `CalendarView` complet existe dans `apps/web/src/components/agenda/CalendarView.tsx` mais n'est pas utilisé dans la page.

**Code concerné**: 
- La page implémente son propre calendrier au lieu d'utiliser `CalendarView`
- `CalendarView` a plus de fonctionnalités (modals, formulaires, etc.)

**Impact**: 
- Code dupliqué
- Fonctionnalités avancées non disponibles
- Maintenance plus difficile

**Recommandation**: 
- Utiliser le composant `CalendarView` existant au lieu de réimplémenter
- Ou migrer les fonctionnalités de `CalendarView` vers la page actuelle

---

### 11. **Pas de Gestion d'Erreurs pour les Mutations**
**Problème**: Pas de gestion d'erreurs pour les opérations CRUD (création, modification, suppression).

**Impact**: 
- Erreurs silencieuses
- Pas de feedback utilisateur en cas d'échec

**Recommandation**: 
- Ajouter try/catch pour toutes les opérations API
- Afficher des toasts d'erreur avec `useToast()`
- Utiliser `handleApiError()` pour formater les erreurs

---

### 12. **Pas de Formulaire d'Événement**
**Problème**: Pas de composant de formulaire pour créer/éditer des événements.

**Impact**: 
- Impossible de créer/éditer des événements même si les modals existent

**Recommandation**: 
- Créer un composant `EventForm` ou utiliser celui existant dans `CalendarView`
- Formulaire avec champs : titre, description, date, heure, type, lieu, participants, couleur

**Composant disponible**: ✅ `EventForm` existe dans `apps/web/src/components/agenda/EventForm.tsx` (probablement)

---

### 13. **Données Non Affichées**
**Problème**: Plusieurs champs disponibles dans l'API ne sont pas affichés dans le calendrier.

**Champs non affichés**:
- `description` - Description de l'événement
- `time` - Heure de l'événement
- `location` - Lieu de l'événement
- `attendees` - Participants
- `end_date` - Date de fin (pour événements multi-jours)

**Impact**: 
- Informations importantes cachées
- Contexte limité sur chaque événement

**Recommandation**: 
- Afficher l'heure dans les événements du calendrier
- Afficher le lieu et les participants dans le modal de détails
- Gérer les événements multi-jours avec `end_date`

---

### 14. **Pas de Support des Événements Multi-Jours**
**Problème**: Les événements avec `end_date` ne sont pas correctement affichés sur plusieurs jours.

**Code concerné**: 
```typescript
// Ligne 250
const dayEvents = filteredEvents.filter(e => e.date === dateStr);
// Ne prend pas en compte end_date
```

**Impact**: 
- Les événements multi-jours n'apparaissent que sur le premier jour
- Vacances et événements longs mal affichés

**Recommandation**: 
- Filtrer les événements pour inclure ceux dont la date est entre `date` et `end_date`
- Afficher les événements multi-jours sur tous les jours concernés

---

### 15. **Pas de Navigation Vers Aujourd'hui**
**Problème**: Le bouton "Aujourd'hui" existe mais ne fonctionne pas correctement si on est dans un autre mois.

**Code concerné**: 
```typescript
// Ligne 265-267
const goToToday = () => {
  setCurrentDate(new Date());
};
```

**Impact**: 
- Si on est dans un autre mois, le bouton "Aujourd'hui" ne change pas la vue

**Recommandation**: 
- S'assurer que `goToToday()` change bien le mois affiché
- Recharger les données si nécessaire

---

## 🔗 Connexions API Non Utilisées

### 16. **Hook useCalendarEvents Non Créé**
**Problème**: Pas de hook React Query pour lister les événements.

**Code disponible**: 
- `agendaAPI.list()` existe mais utilisé directement avec `useEffect`

**Impact**: 
- Pas de cache automatique
- Pas de refetch automatique
- Gestion manuelle du state

**Recommandation**: 
- Créer `useCalendarEvents()` hook dans `apps/web/src/lib/query/agenda.ts`
- Utiliser `useQuery` de React Query

---

### 17. **Hook useCreateCalendarEvent Non Créé**
**Problème**: Pas de hook React Query pour créer des événements.

**Code disponible**: 
- `agendaAPI.create()` existe mais jamais utilisé

**Impact**: 
- Fonctionnalité de création complètement absente
- Code disponible mais non connecté

**Recommandation**: 
- Créer `useCreateCalendarEvent()` hook
- Utiliser `useMutation` de React Query
- Invalider le cache après création

---

### 18. **Hook useUpdateCalendarEvent Non Créé**
**Problème**: Pas de hook React Query pour modifier des événements.

**Code disponible**: 
- `agendaAPI.update()` existe mais jamais utilisé

**Impact**: 
- Fonctionnalité d'édition complètement absente
- Code disponible mais non connecté

**Recommandation**: 
- Créer `useUpdateCalendarEvent()` hook
- Utiliser `useMutation` de React Query
- Invalider le cache après modification

---

### 19. **Hook useDeleteCalendarEvent Non Créé**
**Problème**: Pas de hook React Query pour supprimer des événements.

**Code disponible**: 
- `agendaAPI.delete()` existe mais jamais utilisé

**Impact**: 
- Fonctionnalité de suppression complètement absente
- Code disponible mais non connecté

**Recommandation**: 
- Créer `useDeleteCalendarEvent()` hook
- Utiliser `useMutation` de React Query
- Invalider le cache après suppression

---

## 📊 Données Manquantes dans l'Affichage

### 20. **Heure Non Affichée**
**Problème**: Le champ `time` n'est pas affiché dans les événements du calendrier.

**Impact**: 
- Impossible de voir l'heure d'un événement sans ouvrir les détails
- Informations importantes cachées

**Recommandation**: 
- Afficher l'heure dans les événements du calendrier
- Format: "HH:MM - Titre"

---

### 21. **Description Non Affichée**
**Problème**: Le champ `description` n'est jamais affiché.

**Impact**: 
- Impossible de voir la description d'un événement
- Informations importantes cachées

**Recommandation**: 
- Afficher la description dans le modal de détails
- Ou dans un tooltip au survol

---

### 22. **Lieu et Participants Non Affichés**
**Problème**: Les champs `location` et `attendees` ne sont jamais affichés.

**Impact**: 
- Impossible de voir le lieu et les participants d'un événement
- Informations importantes cachées

**Recommandation**: 
- Afficher le lieu et les participants dans le modal de détails
- Utiliser des icônes appropriées (MapPin, User)

---

## 🎨 Améliorations UX Suggérées

### 23. **Tooltip sur les Événements**
**Problème**: Pas de tooltip pour voir rapidement les détails d'un événement.

**Recommandation**: 
- Ajouter un tooltip au survol des événements
- Afficher titre, heure, lieu, description

---

### 24. **Drag and Drop**
**Problème**: Impossible de déplacer un événement en le glissant-déposant.

**Recommandation**: 
- Implémenter drag and drop pour déplacer les événements
- Mettre à jour la date automatiquement

---

### 25. **Export du Calendrier**
**Problème**: Pas de fonctionnalité d'export (iCal, PDF, etc.).

**Recommandation**: 
- Ajouter bouton "Exporter" dans le header
- Export vers iCal, PDF, ou Excel

---

## ✅ Fonctionnalités Bien Implémentées

1. ✅ **Affichage du calendrier mensuel** - Fonctionne correctement
2. ✅ **Jours fériés** - Calculés et affichés correctement
3. ✅ **Vacances d'été** - Affichées correctement
4. ✅ **Vacances approuvées** - Chargées depuis l'API et affichées
5. ✅ **Événements** - Chargés depuis l'API et affichés
6. ✅ **Anniversaires** - Calculés depuis les employés et affichés
7. ✅ **Dates d'embauche** - Calculées depuis les employés et affichées
8. ✅ **Filtres** - Fonctionnent correctement (tous, jours fériés, vacances, événements, etc.)
9. ✅ **Navigation mois** - Précédent/Suivant fonctionne
10. ✅ **Statistiques** - Calculées et affichées correctement
11. ✅ **UI moderne et responsive** - Bien fait

---

## 📝 Plan d'Action Recommandé

### Priorité HAUTE
1. **Créer les hooks React Query** - `useCalendarEvents`, `useCreateCalendarEvent`, `useUpdateCalendarEvent`, `useDeleteCalendarEvent`
2. **Rendre le bouton "Nouvel événement" fonctionnel** - Ajouter handler onClick et modal
3. **Rendre les événements cliquables** - Ouvrir modal de détails au clic
4. **Ajouter fonctionnalité d'édition** - Modal avec formulaire pour modifier
5. **Ajouter fonctionnalité de suppression** - Bouton supprimer avec confirmation

### Priorité MOYENNE
6. **Implémenter vues Semaine et Jour** - Ou désactiver les boutons
7. **Ajouter filtrage par date** - Utiliser start_date et end_date dans l'API
8. **Gérer événements multi-jours** - Afficher sur tous les jours entre date et end_date
9. **Afficher données manquantes** - Heure, description, lieu, participants
10. **Rafraîchissement automatique** - Utiliser React Query pour refetch après mutations

### Priorité BASSE
11. **Utiliser CalendarView existant** - Ou migrer les fonctionnalités
12. **Ajouter tooltips** - Sur les événements pour voir rapidement les détails
13. **Ajouter drag and drop** - Pour déplacer les événements
14. **Ajouter export** - iCal, PDF, Excel

---

## 🔧 Modifications Nécessaires

### 1. Créer les Hooks React Query

**Fichier**: `apps/web/src/lib/query/agenda.ts`

Ajouter les hooks suivants:
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agendaAPI, type CalendarEventCreate, type CalendarEventUpdate } from '@/lib/api/agenda';

export function useCalendarEvents(params?: {
  start_date?: string;
  end_date?: string;
  event_type?: string;
}) {
  return useQuery({
    queryKey: agendaKeys.eventsByDateRange(params?.start_date || '', params?.end_date || ''),
    queryFn: () => agendaAPI.list(params),
  });
}

export function useCreateCalendarEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CalendarEventCreate) => agendaAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agendaKeys.events() });
    },
  });
}

export function useUpdateCalendarEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CalendarEventUpdate }) => 
      agendaAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agendaKeys.events() });
    },
  });
}

export function useDeleteCalendarEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => agendaAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agendaKeys.events() });
    },
  });
}
```

---

## 📌 Conclusion

La page calendrier affiche correctement les événements mais manque de fonctionnalités interactives essentielles :
- **Création** d'événement (bouton présent mais non fonctionnel)
- **Édition** d'événement (absente)
- **Suppression** d'événement (absente)
- **Vues Semaine/Jour** (boutons présents mais non implémentés)
- **Événements cliquables** (absents)
- **React Query hooks** (fichier existe mais vide)

Les connexions API de base fonctionnent (liste, récupération), mais les fonctionnalités CRUD complètes ne sont pas implémentées dans l'interface. Les composants `CalendarView` et `DayEventsModal` existent mais ne sont pas utilisés dans cette page. L'API supporte toutes les opérations nécessaires mais elles ne sont pas connectées à l'interface utilisateur.
