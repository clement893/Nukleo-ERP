# Plan d'Implémentation - Gestion de Projet Complète

## 📋 Vue d'ensemble

Ajouter un système complet de gestion de projet à Nukleo ERP avec tâches, planning, fichiers et suivi d'activité.

---

## 🎯 Fonctionnalités à implémenter

### 1. Gestion des Tâches (Tasks)

**Modèle Task :**
```python
class Task(Base):
    id: int
    project_id: int  # FK vers projects
    title: str
    description: text
    status: enum (TODO, IN_PROGRESS, IN_REVIEW, DONE)
    priority: enum (LOW, MEDIUM, HIGH, URGENT)
    assigned_to: int  # FK vers employees (optionnel)
    due_date: datetime (optionnel)
    estimated_hours: decimal (optionnel)
    actual_hours: decimal (optionnel)
    tags: string[] (optionnel)
    order: int  # Pour le tri dans le Kanban
    created_by: int  # FK vers users
    created_at: datetime
    updated_at: datetime
```

**API Endpoints :**
- `GET /v1/projects/{project_id}/tasks` - Liste des tâches
- `POST /v1/projects/{project_id}/tasks` - Créer une tâche
- `PUT /v1/tasks/{task_id}` - Modifier une tâche
- `DELETE /v1/tasks/{task_id}` - Supprimer une tâche
- `PATCH /v1/tasks/{task_id}/status` - Changer le statut
- `PATCH /v1/tasks/{task_id}/assign` - Assigner à quelqu'un
- `PATCH /v1/tasks/{task_id}/move` - Réordonner (drag & drop)

### 2. Planning / Calendrier

**Fonctionnalités :**
- Vue calendrier mensuelle des tâches (par due_date)
- Vue Gantt (timeline) des tâches
- Filtres par assigné, priorité, statut
- Drag & drop pour changer les dates

**Composants :**
- `ProjectCalendar.tsx` - Vue calendrier
- `ProjectGantt.tsx` - Vue Gantt (timeline)
- Utiliser une lib comme `react-big-calendar` ou `fullcalendar`

### 3. Fichiers / Documents

**Modèle ProjectFile :**
```python
class ProjectFile(Base):
    id: int
    project_id: int
    filename: str
    original_filename: str
    file_size: int
    mime_type: str
    storage_path: str  # S3 ou local
    uploaded_by: int
    uploaded_at: datetime
    description: text (optionnel)
```

**API Endpoints :**
- `GET /v1/projects/{project_id}/files` - Liste des fichiers
- `POST /v1/projects/{project_id}/files` - Upload fichier
- `GET /v1/files/{file_id}/download` - Télécharger
- `DELETE /v1/files/{file_id}` - Supprimer

### 4. Activité / Historique

**Modèle ProjectActivity :**
```python
class ProjectActivity(Base):
    id: int
    project_id: int
    user_id: int
    action_type: enum (CREATED, UPDATED, DELETED, COMMENTED, ASSIGNED, etc.)
    entity_type: enum (PROJECT, TASK, FILE, etc.)
    entity_id: int
    description: str  # "Jean a créé la tâche 'Design mockups'"
    metadata: jsonb  # Données supplémentaires
    created_at: datetime
```

**API Endpoints :**
- `GET /v1/projects/{project_id}/activity` - Historique d'activité

---

## 🎨 Interface Utilisateur

### Page Détail Projet (Onglets)

```
┌─────────────────────────────────────────────────────────┐
│  [←] Projet: École nationale de Cirque                  │
│  Status: ACTIVE | Étape: Planif à faire | Client: XYZ  │
├─────────────────────────────────────────────────────────┤
│  [Vue d'ensemble] [Tâches] [Planning] [Fichiers] [Activité] │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Contenu de l'onglet actif                             │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Onglet 1 : Vue d'ensemble

**Contenu :**
- Informations du projet (nom, description, client, dates)
- Statistiques rapides (tâches complétées, heures, budget)
- Membres de l'équipe
- Liens rapides (Drive, Slack, Proposal)
- Activité récente (5 dernières actions)

### Onglet 2 : Tâches (Kanban Board)

**Layout :**
```
┌─────────────────────────────────────────────────────────┐
│  [+ Nouvelle tâche]  [Filtres ▼]  [Vue: Kanban ▼]      │
├─────────────────────────────────────────────────────────┤
│  À FAIRE    │  EN COURS   │  EN REVUE   │  TERMINÉ     │
│  ─────────  │  ─────────  │  ─────────  │  ─────────   │
│  ┌────────┐ │  ┌────────┐ │  ┌────────┐ │  ┌────────┐  │
│  │ Task 1 │ │  │ Task 3 │ │  │ Task 5 │ │  │ Task 7 │  │
│  │ 🔴 HIGH│ │  │ 🟡 MED │ │  │ 🟢 LOW │ │  │ ✓ DONE │  │
│  │ @Jean  │ │  │ @Marie │ │  │ @Paul  │ │  │        │  │
│  │ 📅 15/01│ │  │ 📅 18/01│ │  │ 📅 20/01│ │  │        │  │
│  └────────┘ │  └────────┘ │  └────────┘ │  └────────┘  │
│  ┌────────┐ │             │             │             │
│  │ Task 2 │ │             │             │             │
│  └────────┘ │             │             │             │
└─────────────────────────────────────────────────────────┘
```

**Fonctionnalités :**
- Drag & drop entre colonnes
- Click sur tâche → Modal détails
- Filtres : Assigné, Priorité, Tags
- Vues alternatives : Liste, Tableau

### Onglet 3 : Planning

**Vue Calendrier :**
- Calendrier mensuel avec tâches
- Code couleur par priorité/statut
- Click sur jour → Créer tâche
- Click sur tâche → Détails

**Vue Gantt :**
- Timeline horizontale
- Barres pour chaque tâche
- Dépendances entre tâches (optionnel)

### Onglet 4 : Fichiers

**Layout :**
```
┌─────────────────────────────────────────────────────────┐
│  [📤 Upload]  [Rechercher...]  [Vue: Grille ▼]         │
├─────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐               │
│  │ 📄 Doc1 │  │ 📊 XLS  │  │ 🖼️ IMG  │               │
│  │ 2.5 MB  │  │ 1.2 MB  │  │ 450 KB  │               │
│  │ 15/01   │  │ 14/01   │  │ 13/01   │               │
│  └─────────┘  └─────────┘  └─────────┘               │
└─────────────────────────────────────────────────────────┘
```

### Onglet 5 : Activité

**Timeline :**
```
┌─────────────────────────────────────────────────────────┐
│  Aujourd'hui                                            │
│  ○ Jean a créé la tâche "Design mockups"  - 14:30     │
│  ○ Marie a uploadé "brief.pdf"            - 13:15     │
│                                                          │
│  Hier                                                    │
│  ○ Paul a complété la tâche "Setup"       - 16:45     │
│  ○ Jean a modifié le projet               - 10:20     │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 Stack Technique

### Backend
- **ORM:** SQLAlchemy
- **Migration:** Alembic
- **Validation:** Pydantic v2
- **Storage:** S3 (ou local pour dev)

### Frontend
- **Framework:** Next.js 14 + TypeScript
- **State:** React Query (TanStack Query)
- **UI:** Tailwind CSS + Glassmorphism
- **Drag & Drop:** @dnd-kit/core
- **Calendrier:** react-big-calendar ou fullcalendar
- **Gantt:** react-gantt-chart ou custom

---

## 📝 Ordre d'Implémentation

### Phase 1 : Backend Tasks (2-3h)
1. Créer modèle `Task` + migration
2. Créer schémas Pydantic
3. Créer API CRUD tasks
4. Tester avec Postman/curl

### Phase 2 : Frontend Tasks (3-4h)
1. Créer interface `Task` TypeScript
2. Créer API client `tasksAPI`
3. Créer composant `TaskCard`
4. Créer composant `TaskKanban`
5. Créer modal `TaskDetailsModal`
6. Intégrer dans page projet

### Phase 3 : Planning (2-3h)
1. Installer lib calendrier
2. Créer composant `ProjectCalendar`
3. Créer composant `ProjectGantt` (optionnel)
4. Intégrer dans page projet

### Phase 4 : Fichiers (2-3h)
1. Créer modèle `ProjectFile` + migration
2. Créer API upload/download
3. Créer composant `FileUploader`
4. Créer composant `FileGallery`
5. Intégrer dans page projet

### Phase 5 : Activité (1-2h)
1. Créer modèle `ProjectActivity` + migration
2. Créer API activity feed
3. Créer composant `ActivityTimeline`
4. Intégrer dans page projet
5. Ajouter hooks pour logger les actions

### Phase 6 : Polish & Tests (2-3h)
1. Tests unitaires backend
2. Tests E2E frontend
3. Optimisations performance
4. Documentation

**Temps total estimé : 12-18 heures**

---

## 🚀 Quick Start (MVP)

Si vous voulez un MVP rapide (4-6h), commencez par :

1. **Tasks uniquement** (sans fichiers ni activité)
2. **Vue Kanban simple** (4 colonnes)
3. **CRUD basique** (créer, modifier, supprimer)
4. **Assignation** (dropdown employés)
5. **Dates** (due_date uniquement)

Puis itérez avec :
- Planning (calendrier)
- Fichiers
- Activité

---

## 📦 Livrables

### Backend
- `backend/app/models/task.py`
- `backend/app/models/project_file.py`
- `backend/app/models/project_activity.py`
- `backend/app/schemas/task.py`
- `backend/app/schemas/project_file.py`
- `backend/app/schemas/project_activity.py`
- `backend/app/api/v1/endpoints/projects/tasks.py`
- `backend/app/api/v1/endpoints/projects/files.py`
- `backend/app/api/v1/endpoints/projects/activity.py`
- `backend/alembic/versions/055_add_tasks.py`
- `backend/alembic/versions/056_add_project_files.py`
- `backend/alembic/versions/057_add_project_activity.py`

### Frontend
- `apps/web/src/lib/api/tasks.ts`
- `apps/web/src/lib/api/projectFiles.ts`
- `apps/web/src/lib/api/projectActivity.ts`
- `apps/web/src/components/projects/TaskCard.tsx`
- `apps/web/src/components/projects/TaskKanban.tsx`
- `apps/web/src/components/projects/TaskDetailsModal.tsx`
- `apps/web/src/components/projects/ProjectCalendar.tsx`
- `apps/web/src/components/projects/ProjectGantt.tsx`
- `apps/web/src/components/projects/FileUploader.tsx`
- `apps/web/src/components/projects/FileGallery.tsx`
- `apps/web/src/components/projects/ActivityTimeline.tsx`
- `apps/web/src/app/[locale]/dashboard/projets/projets/[id]/page.tsx` (mise à jour)

---

## ✅ Checklist

### Backend
- [ ] Modèle Task créé
- [ ] Modèle ProjectFile créé
- [ ] Modèle ProjectActivity créé
- [ ] Migrations exécutées
- [ ] API Tasks CRUD fonctionnelle
- [ ] API Files upload/download fonctionnelle
- [ ] API Activity feed fonctionnelle
- [ ] Tests backend passent

### Frontend
- [ ] Interface Task TypeScript créée
- [ ] API client tasks créé
- [ ] Composant TaskKanban créé
- [ ] Composant TaskDetailsModal créé
- [ ] Composant ProjectCalendar créé
- [ ] Composant FileUploader créé
- [ ] Composant ActivityTimeline créé
- [ ] Page projet mise à jour avec onglets
- [ ] Tests E2E passent

### UX
- [ ] Drag & drop fonctionne
- [ ] Filtres fonctionnent
- [ ] Recherche fonctionne
- [ ] Animations fluides
- [ ] Responsive mobile
- [ ] Accessibilité (ARIA)

---

## 🎨 Design System

**Glassmorphism :**
- Utiliser les classes existantes `.glass-card`, `.glass-card-hover`
- Animations : `transition-all duration-300`
- Couleurs : Gradient blue-purple pour les accents

**Icônes Lucide React :**
- CheckCircle2 (tâche complétée)
- Circle (tâche non complétée)
- Clock (due date)
- User (assigné)
- Flag (priorité)
- Calendar (planning)
- FileText (fichiers)
- Activity (activité)

---

## 💡 Recommandations

1. **Commencez par le MVP** (Tasks + Kanban uniquement)
2. **Testez avec de vraies données** (créez 10-15 tâches)
3. **Itérez rapidement** (ajoutez une fonctionnalité à la fois)
4. **Documentez au fur et à mesure** (README, commentaires)
5. **Demandez du feedback** (testez avec des utilisateurs)

---

## 🔗 Ressources

**Libraries recommandées :**
- [@dnd-kit/core](https://dndkit.com/) - Drag & drop
- [react-big-calendar](https://github.com/jquense/react-big-calendar) - Calendrier
- [react-gantt-chart](https://github.com/MaTeMaTuK/gantt-task-react) - Gantt
- [react-dropzone](https://react-dropzone.js.org/) - Upload fichiers

**Inspiration :**
- Asana (gestion de tâches)
- Trello (Kanban)
- Monday.com (planning)
- ClickUp (tout-en-un)

---

**Voulez-vous que je commence l'implémentation ou préférez-vous implémenter via Cursor avec ce plan ?**
