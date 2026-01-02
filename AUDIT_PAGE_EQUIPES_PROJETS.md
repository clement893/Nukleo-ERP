# Audit de la page Équipes - Module Projets

**URL**: `/fr/dashboard/projets/equipes`  
**Date**: 2024  
**Contexte**: Audit après refactor UI

## Résumé exécutif

La page Équipes du module Projets présente plusieurs problèmes d'architecture et de connexions non fonctionnelles. Les principales préoccupations concernent l'absence d'utilisation de React Query, des problèmes de mapping de données, et une gestion d'erreur incomplète.

---

## 🔴 Problèmes critiques

### 1. Absence d'utilisation de React Query

**Problème**: Les deux pages (liste et détail) utilisent des appels API directs avec `useState`/`useEffect` au lieu des hooks React Query disponibles.

**Localisation**: 
- `apps/web/src/app/[locale]/dashboard/projets/equipes/page.tsx` (lignes 134-195)
- `apps/web/src/app/[locale]/dashboard/projets/equipes/[slug]/page.tsx` (lignes 225-325)

**Code concerné**:
```typescript
// ❌ Actuel - Appels API directs
const [teams, setTeams] = useState<TeamWithStats[]>([]);
const loadTeams = async () => {
  const teamsResponse = await teamsAPI.list();
  // ...
};

// ✅ Devrait utiliser
const { data: teamsData, isLoading } = useTeams();
```

**Impact**: 
- Pas de cache automatique
- Pas d'invalidation automatique après mutations
- Rechargements inutiles à chaque navigation
- Performance dégradée
- Données potentiellement obsolètes

**Solution recommandée**: 
Utiliser les hooks React Query disponibles :
- `useTeams()` pour la liste des équipes
- `useTeam(teamId)` pour une équipe spécifique
- `useTeamMembers(teamId)` pour les membres
- Créer des hooks pour les tâches de projet si nécessaire

---

### 2. Problème de mapping assignee_id vs employee_id

**Problème**: Confusion entre `employee.id` et `assignee_id` (qui devrait être `user_id`) dans la page de détail.

**Localisation**: 
- `apps/web/src/app/[locale]/dashboard/projets/equipes/[slug]/page.tsx` (lignes 297-307, 344, 370)

**Code concerné**:
```typescript
// ❌ Problème : assignee_id devrait être user_id, pas employee.id
const currentTask = teamTasks.find(
  (t) => t.assignee_id === emp.id && t.status === 'in_progress'
);

// Plus tard dans handleDragEnd
newAssigneeId = employeeId; // employeeId est employee.id, pas user_id
await projectTasksAPI.update(taskId, {
  employee_assignee_id: newAssigneeId, // ✅ Correct ici car l'API accepte employee_id
});
```

**Impact**: 
- Les tâches peuvent ne pas être correctement associées aux employés
- Le drag & drop peut assigner des tâches à de mauvais utilisateurs
- Incohérence des données affichées

**Solution recommandée**: 
- Utiliser `employee.user_id` au lieu de `employee.id` pour la recherche de tâches
- Ou utiliser `employee_assignee_id` dans l'API qui fait le mapping automatiquement
- Documenter clairement la différence entre `assignee_id` (user_id) et `employee_assignee_id` (employee_id)

---

### 3. Création automatique d'équipes problématique

**Problème**: La logique de création automatique d'équipes peut causer des problèmes de performance et de cohérence.

**Localisation**: 
- `apps/web/src/app/[locale]/dashboard/projets/equipes/page.tsx` (lignes 65-132)
- `apps/web/src/app/[locale]/dashboard/projets/equipes/[slug]/page.tsx` (lignes 244-264)

**Code concerné**:
```typescript
const ensureTeamsExist = async (existingTeams: TeamType[]): Promise<TeamType[]> => {
  // Création automatique si équipe manquante
  for (const teamToCreate of teamsToCreate) {
    await teamsAPI.create({...});
  }
  await new Promise(resolve => setTimeout(resolve, 500)); // ⚠️ Hack avec timeout
  // ...
};
```

**Impact**: 
- Appels API supplémentaires à chaque chargement de page
- Race conditions possibles si plusieurs utilisateurs créent en même temps
- Timeout artificiel de 500ms pour attendre la création
- Performance dégradée
- Logique métier dans le composant UI

**Solution recommandée**: 
- Déplacer la création automatique côté backend (migration ou endpoint dédié)
- Ou utiliser un hook React Query avec `enabled` et gestion d'erreur 404
- Éviter les timeouts artificiels

---

## 🟡 Problèmes modérés

### 4. Pas de rafraîchissement après drag & drop

**Problème**: Après un drag & drop réussi, les données ne sont pas rechargées depuis le serveur, seulement mises à jour optimistiquement.

**Localisation**: 
- `apps/web/src/app/[locale]/dashboard/projets/equipes/[slug]/page.tsx` (lignes 333-418)

**Code concerné**:
```typescript
const handleDragEnd = async (event: DragEndEvent) => {
  // Optimistic update
  setTasks(prev => prev.map(...));
  
  // Update on server
  await projectTasksAPI.update(taskId, {...});
  
  // ❌ Pas de rechargement des données depuis le serveur
  // Les données peuvent être désynchronisées
};
```

**Impact**: 
- Données potentiellement désynchronisées avec le serveur
- Si d'autres utilisateurs modifient les mêmes tâches, les changements ne sont pas visibles
- Pas de validation que la mise à jour a réellement fonctionné côté serveur

**Solution recommandée**: 
- Utiliser React Query mutations avec `onSuccess` pour invalider et refetch
- Ou recharger explicitement les données après une mise à jour réussie

---

### 5. Gestion d'erreur incomplète

**Problème**: Certaines erreurs sont seulement loggées dans la console sans feedback utilisateur.

**Localisation**: 
- `apps/web/src/app/[locale]/dashboard/projets/equipes/page.tsx` (lignes 102-106)
- `apps/web/src/app/[locale]/dashboard/projets/equipes/[slug]/page.tsx` (lignes 284-286, 311-314)

**Code concerné**:
```typescript
} catch (err: any) {
  if (!(err?.response?.status === 400 && err?.response?.data?.detail?.includes('already exists'))) {
    console.error(`Erreur création équipe ${teamToCreate.name}:`, err);
    // ❌ Pas de toast d'erreur pour l'utilisateur
  }
}
```

**Impact**: 
- L'utilisateur ne sait pas si une opération a échoué
- Expérience utilisateur dégradée
- Debugging difficile

**Solution recommandée**: 
- Toujours afficher un toast d'erreur pour les erreurs non gérées
- Utiliser `handleApiError` de manière cohérente

---

### 6. Calculs de statistiques côté client

**Problème**: Les statistiques sont calculées côté client au lieu d'utiliser des endpoints dédiés.

**Localisation**: 
- `apps/web/src/app/[locale]/dashboard/projets/equipes/page.tsx` (lignes 150-182, 212-216)

**Code concerné**:
```typescript
// ❌ Calcul côté client
const totalTasks = tasks.length;
const inProgressTasks = tasks.filter((task: ProjectTask) => task.status === 'in_progress').length;
const completedTasks = tasks.filter((task: ProjectTask) => task.status === 'completed').length;

// Pour chaque équipe, on charge toutes les tâches juste pour compter
const tasks = await projectTasksAPI.list({ team_id: team.id });
```

**Impact**: 
- Charge toutes les tâches juste pour les compter
- Performance dégradée avec beaucoup de tâches
- Bandwidth inutile utilisé
- Temps de chargement plus long

**Solution recommandée**: 
- Créer un endpoint `/v1/teams/{team_id}/stats` qui retourne les statistiques
- Ou utiliser des paramètres de requête pour ne récupérer que les métadonnées nécessaires

---

### 7. Pas de gestion du mode "timeline"

**Problème**: Le mode "timeline" est défini dans le type mais jamais implémenté dans l'UI.

**Localisation**: 
- `apps/web/src/app/[locale]/dashboard/projets/equipes/[slug]/page.tsx` (ligne 47, 208)

**Code concerné**:
```typescript
type ViewMode = 'board' | 'capacity' | 'timeline';
const [viewMode, setViewMode] = useState<ViewMode>('board');

// ❌ Le mode timeline n'est jamais utilisé dans le rendu
```

**Impact**: 
- Fonctionnalité annoncée mais non disponible
- Code mort dans le composant
- Confusion pour les développeurs

**Solution recommandée**: 
- Implémenter le mode timeline ou le retirer du type

---

## 🟢 Améliorations suggérées

### 8. Pas de debounce sur les recherches

**Problème**: Si une fonctionnalité de recherche est ajoutée, il n'y a pas de debounce.

**Impact**: 
- Trop d'appels API si recherche en temps réel

**Solution recommandée**: 
- Ajouter un debounce de 300ms si recherche ajoutée

---

### 9. Pas de pagination pour les tâches

**Problème**: Toutes les tâches sont chargées d'un coup sans pagination.

**Localisation**: 
- `apps/web/src/app/[locale]/dashboard/projets/equipes/[slug]/page.tsx` (ligne 282)

**Impact**: 
- Performance dégradée avec beaucoup de tâches
- Temps de chargement long

**Solution recommandée**: 
- Implémenter la pagination ou le chargement infini pour les tâches

---

### 10. Capacité calculée de manière simpliste

**Problème**: Le calcul de capacité utilise une formule fixe (40h/semaine par employé) sans tenir compte des heures réelles.

**Localisation**: 
- `apps/web/src/app/[locale]/dashboard/projets/equipes/[slug]/page.tsx` (lignes 426-431)

**Code concerné**:
```typescript
const totalHoursPerWeek = employees.length * 40; // ⚠️ Fixe à 40h
const usedHours = tasks
  .filter(t => t.status === 'in_progress' || t.status === 'to_transfer')
  .reduce((sum, t) => sum + (t.estimated_hours || 0), 0);
```

**Impact**: 
- Calcul peu précis
- Ne tient pas compte des heures réelles travaillées
- Ne tient pas compte des contrats à temps partiel

**Solution recommandée**: 
- Utiliser les heures réelles des employés depuis la base de données
- Prendre en compte les contrats à temps partiel

---

## ✅ Fonctionnalités fonctionnelles

Les fonctionnalités suivantes sont correctement implémentées :

1. ✅ Affichage de la liste des équipes avec statistiques
2. ✅ Navigation vers la page de détail d'une équipe
3. ✅ Drag & drop des tâches (avec gestion d'erreur et rollback)
4. ✅ Affichage des membres d'équipe
5. ✅ Calcul et affichage des statistiques globales
6. ✅ Mode "board" et "capacity" fonctionnels
7. ✅ Gestion optimiste des mises à jour avec rollback en cas d'erreur
8. ✅ Connexion API backend fonctionnelle

---

## 📋 Checklist de correction

- [ ] Migrer vers React Query pour le cache et l'invalidation
- [ ] Corriger le mapping assignee_id vs employee_id
- [ ] Déplacer la création automatique d'équipes côté backend
- [ ] Ajouter le rafraîchissement après drag & drop
- [ ] Améliorer la gestion d'erreur (toasts pour toutes les erreurs)
- [ ] Créer un endpoint de statistiques pour éviter les calculs côté client
- [ ] Implémenter ou retirer le mode "timeline"
- [ ] Ajouter la pagination pour les tâches
- [ ] Améliorer le calcul de capacité avec données réelles

---

## 🔗 Fichiers concernés

### Frontend
- `apps/web/src/app/[locale]/dashboard/projets/equipes/page.tsx`
- `apps/web/src/app/[locale]/dashboard/projets/equipes/[slug]/page.tsx`
- `apps/web/src/lib/api/teams.ts`
- `apps/web/src/lib/api/project-tasks.ts`
- `apps/web/src/lib/query/queries.ts` (hooks disponibles mais non utilisés)

### Backend
- `backend/app/api/v1/endpoints/teams.py` ✅ (fonctionnel)
- `backend/app/api/v1/endpoints/project_tasks.py` ✅ (fonctionnel)

---

## Notes techniques

- Les hooks React Query (`useTeams`, `useTeam`, etc.) existent mais ne sont pas utilisés
- L'API backend supporte `employee_assignee_id` qui fait le mapping automatique vers `user_id`
- Le drag & drop utilise @dnd-kit et fonctionne correctement avec gestion d'erreur
- La création automatique d'équipes devrait idéalement être gérée par une migration ou un endpoint dédié

---

**Priorité de correction recommandée**:
1. 🔴 Migration vers React Query (critique pour performance)
2. 🔴 Correction du mapping assignee_id (critique pour fonctionnalité)
3. 🔴 Création automatique d'équipes (modéré mais impact performance)
4. 🟡 Rafraîchissement après drag & drop (modéré)
5. 🟡 Gestion d'erreur améliorée (modéré)
6. 🟡 Endpoint de statistiques (amélioration)
7. 🟢 Autres améliorations (optionnel)
