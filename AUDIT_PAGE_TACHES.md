# Audit de la page Tâches après refactor UI

**Page audité** : `/fr/dashboard/projets/taches`  
**Date** : 2025-01-27  
**URL de production** : https://modeleweb-production-f341.up.railway.app/fr/dashboard/projets/taches

## 📋 Résumé exécutif

Après analyse du code de la page tâches, plusieurs fonctionnalités existantes au niveau API et hooks React Query ne sont **pas implémentées dans l'interface utilisateur**. De plus, certaines connexions sont **non fonctionnelles**.

---

## ✅ Fonctionnalités implémentées

1. ✅ **Liste des tâches** avec pagination infinie (`useInfiniteProjectTasks`)
2. ✅ **Suppression** de tâches (`useDeleteProjectTask`)
3. ✅ **Visualisation** des détails via Drawer (`useProjectTask`)
4. ✅ **Recherche** textuelle
5. ✅ **Filtres** par statut (Tous, À faire, En cours, Bloqué, Terminé)
6. ✅ **Groupement** par projet, assigné, équipe
7. ✅ **Vues** liste et kanban
8. ✅ **Stats** (total, à faire, en cours, bloqué, terminé)
9. ✅ **Commentaires** et **Documents** dans le drawer

---

## ❌ Fonctionnalités manquantes (API/hooks existants mais UI manquante)

### 1. **Création de tâches** 🔴 CRITIQUE

**API disponible** : ✅ `projectTasksAPI.create(task)`  
**Hook disponible** : ✅ `useCreateProjectTask()`  
**UI manquante** : ❌ Le bouton "Nouvelle tâche" existe mais ne fait rien (ligne 234)

**Impact** : Les utilisateurs ne peuvent pas créer de nouvelles tâches depuis l'interface.

**Code problématique** :
```typescript
// Ligne 232-235
<Button className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm">
  <Plus className="w-4 h-4 mr-2" />
  Nouvelle tâche
</Button>
// ❌ Pas de onClick handler, pas de modal
```

**Recommandation** : Créer un composant `TaskForm` et ajouter un modal de création.

---

### 2. **Modification de tâches** 🟡 IMPORTANT

**API disponible** : ✅ `projectTasksAPI.update(id, data)`  
**Hook disponible** : ✅ `useUpdateProjectTask()`  
**UI manquante** : ❌ Aucun bouton pour modifier une tâche depuis la liste

**Impact** : Les utilisateurs ne peuvent modifier les tâches que via le drawer, mais il n'y a pas de formulaire d'édition dans le drawer.

**Code existant** :
- Le drawer affiche les informations en lecture seule
- Aucun formulaire d'édition n'est présent dans les onglets du drawer

**Recommandation** : Ajouter un onglet "Modifier" dans le drawer ou un bouton "Modifier" dans la liste.

---

### 3. **Export CSV/Excel** 🟡 IMPORTANT

**Composants disponibles** : ✅ `ExportButton`, `DataExporter`  
**UI manquante** : ❌ Aucun bouton d'export dans l'interface

**Impact** : Les utilisateurs ne peuvent pas exporter la liste des tâches.

**Recommandation** : Ajouter un bouton d'export dans le header avec dropdown (CSV, Excel).

---

### 4. **Sélection multiple et actions en masse** 🟢 MOYEN

**UI manquante** : ❌ Pas de checkboxes pour sélection multiple  
**Actions manquantes** : ❌ Pas de suppression en masse, pas de changement de statut en masse

**Impact** : Les utilisateurs doivent modifier/supprimer les tâches une par une.

**Recommandation** : Ajouter des checkboxes et une barre d'actions en masse.

---

### 5. **Menu contextuel (Dropdown)** 🟢 MOYEN

**Composant disponible** : ✅ `Dropdown`  
**UI manquante** : ❌ Pas de menu avec toutes les actions (Voir, Modifier, Dupliquer, Supprimer)

**Impact** : L'interface est moins intuitive et les actions sont dispersées.

**Recommandation** : Ajouter un menu contextuel avec icône `MoreVertical` pour chaque tâche.

---

### 6. **Duplication de tâches** 🟢 MOYEN

**API disponible** : ✅ `projectTasksAPI.create()` peut être utilisé pour dupliquer  
**UI manquante** : ❌ Pas de fonctionnalité de duplication

**Impact** : Les utilisateurs doivent créer manuellement une nouvelle tâche similaire.

**Recommandation** : Ajouter une action "Dupliquer" dans le menu contextuel.

---

### 7. **Filtres avancés** 🟢 MOYEN

**API disponible** : ✅ `projectTasksAPI.list()` accepte `team_id`, `project_id`, `assignee_id`, `priority`  
**UI manquante** : ❌ Pas de filtres par équipe, projet, assigné, priorité

**Impact** : Les utilisateurs ne peuvent filtrer que par statut, pas par autres critères.

**Recommandation** : Ajouter des filtres MultiSelect pour équipe, projet, assigné, priorité.

---

### 8. **Modification rapide du statut** 🟢 MOYEN

**API disponible** : ✅ `projectTasksAPI.update()`  
**Hook disponible** : ✅ `useUpdateProjectTask()`  
**UI manquante** : ❌ Pas de changement de statut rapide depuis la liste (drag & drop ou boutons)

**Impact** : Les utilisateurs doivent ouvrir le drawer pour changer le statut.

**Recommandation** : Ajouter des boutons de changement de statut rapide ou drag & drop dans la vue kanban.

---

## 🔴 Connexions non fonctionnelles

### 1. **Bouton "Nouvelle tâche" non fonctionnel** 🔴 CRITIQUE

**Problème** : Le bouton "Nouvelle tâche" existe mais n'a pas de handler `onClick`.

**Code problématique** :
```typescript
// Ligne 232-235
<Button className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm">
  <Plus className="w-4 h-4 mr-2" />
  Nouvelle tâche
</Button>
// ❌ Pas de onClick={() => setShowCreateModal(true)}
```

**Solution** : Ajouter un handler pour ouvrir un modal de création.

---

### 2. **Drawer en lecture seule** 🟡 IMPORTANT

**Problème** : Le drawer affiche les informations mais ne permet pas de les modifier.

**Code problématique** :
- Les onglets "Informations", "Commentaires", "Documents" sont en lecture seule
- Aucun formulaire d'édition n'est présent

**Solution** : Ajouter un onglet "Modifier" ou rendre les champs éditables dans l'onglet "Informations".

---

### 3. **Vue Kanban non interactive** 🟡 IMPORTANT

**Problème** : La vue kanban affiche les tâches mais ne permet pas de les déplacer entre les colonnes.

**Impact** : Les utilisateurs ne peuvent pas utiliser le drag & drop pour changer le statut.

**Solution** : Implémenter le drag & drop avec `@dnd-kit` pour permettre le changement de statut par glisser-déposer.

---

## 📊 Statistiques

- **Fonctionnalités implémentées** : 9/17 (53%)
- **Fonctionnalités manquantes** : 8/17 (47%)
- **Connexions non fonctionnelles** : 3

---

## 🎯 Priorités d'implémentation

### Priorité 1 (Critique)
1. ✅ Créer le composant `TaskForm` et modal de création
2. ✅ Rendre le bouton "Nouvelle tâche" fonctionnel
3. ✅ Ajouter la modification de tâches (dans le drawer ou via bouton)

### Priorité 2 (Important)
4. ✅ Ajouter l'export CSV/Excel
5. ✅ Rendre la vue kanban interactive avec drag & drop
6. ✅ Ajouter le menu contextuel (Dropdown)

### Priorité 3 (Moyen)
7. ✅ Ajouter la sélection multiple et actions en masse
8. ✅ Ajouter la duplication
9. ✅ Ajouter les filtres avancés (équipe, projet, assigné, priorité)

---

## 📝 Notes techniques

### Hooks React Query disponibles mais non utilisés
- `useCreateProjectTask()` - Non utilisé (pas de modal de création)
- `useUpdateProjectTask()` - Utilisé seulement pour le statut dans certaines pages, pas dans cette page

### APIs disponibles mais non utilisées
- `projectTasksAPI.create()` - Non utilisé
- `projectTasksAPI.update()` - Utilisé indirectement via le hook mais pas de UI dédiée

### Composants UI disponibles mais non utilisés
- `Dropdown` - Non utilisé pour les actions
- `ExportButton` - Non utilisé
- `DataExporter` - Non utilisé
- `Modal` - Utilisé pour le drawer mais pas pour créer/modifier

### Composants manquants
- `TaskForm` - N'existe pas, doit être créé

---

## 🔗 Références

- **API Tasks** : `apps/web/src/lib/api/project-tasks.ts`
- **Hooks Tasks** : `apps/web/src/lib/query/project-tasks.ts`
- **Page Tasks** : `apps/web/src/app/[locale]/dashboard/projets/taches/page.tsx`
- **Composant Drawer** : `apps/web/src/components/ui/Drawer.tsx`

---

## ✅ Checklist d'implémentation

- [ ] Créer le composant `TaskForm` pour créer/modifier des tâches
- [ ] Ajouter un modal de création avec `TaskForm`
- [ ] Rendre le bouton "Nouvelle tâche" fonctionnel
- [ ] Ajouter un onglet "Modifier" dans le drawer ou un bouton "Modifier" dans la liste
- [ ] Ajouter bouton d'export CSV/Excel dans le header
- [ ] Implémenter drag & drop dans la vue kanban pour changer le statut
- [ ] Ajouter menu contextuel (Dropdown) avec toutes les actions
- [ ] Ajouter sélection multiple avec checkboxes
- [ ] Ajouter actions en masse (suppression, changement de statut)
- [ ] Ajouter fonctionnalité de duplication
- [ ] Ajouter filtres avancés (équipe, projet, assigné, priorité)

---

**Fin du rapport d'audit**
