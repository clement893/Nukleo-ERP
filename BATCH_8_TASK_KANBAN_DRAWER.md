# Batch 8 : Drawer pour les cartes de tâches dans TaskKanban

## ✅ Objectif
Permettre d'ouvrir les cartes de tâches dans le Kanban avec un Drawer (style Asana) pour consulter les détails, commentaires et documents.

## 📋 Modifications apportées

### 1. Ajout des imports nécessaires
- Import de `Drawer` depuis `@/components/ui/Drawer`
- Import de `Tabs` depuis `@/components/ui/Tabs`
- Import des icônes `Info`, `MessageSquare`, `Paperclip` depuis `lucide-react`

### 2. États ajoutés
- `showTaskDrawer` : Contrôle l'ouverture/fermeture du Drawer
- `taskDetails` : Stocke les détails complets de la tâche sélectionnée
- `loadingDetails` : Indique le chargement des détails

### 3. Fonctionnalité d'ouverture
- **`handleOpenTaskDetails(task)`** : 
  - Charge les détails complets de la tâche via `projectTasksAPI.get()`
  - Ouvre le Drawer avec les détails
  - Gère les erreurs avec toast notifications

### 4. Clic sur les cartes
- **Clic sur la carte** : Ouvre le Drawer avec les détails
- **Clic sur les boutons Edit/Delete** : N'ouvre pas le Drawer (stopPropagation)
- **Drag & Drop** : Fonctionne toujours normalement

### 5. Contenu du Drawer
Le Drawer affiche 3 onglets :
- **Informations** : Description, statut, priorité, échéance, heures estimées, assigné à
- **Commentaires** : Utilise `ProjectComments` (composant existant)
- **Documents** : Utilise `ProjectAttachments` (composant existant)

### 6. Structure technique
- Utilisation d'un `div` wrapper pour gérer le `onClick` avec événement
- `Card` à l'intérieur pour le style
- `stopPropagation` sur les boutons d'action pour éviter l'ouverture du Drawer

## 🎨 Expérience utilisateur

### Avant
- Les cartes de tâches étaient uniquement draggables
- Pour voir les détails, il fallait cliquer sur "Modifier" (ouvre un Modal)
- Pas de vue détaillée avec commentaires et documents

### Après
- **Clic sur la carte** : Ouvre un Drawer style Asana avec tous les détails
- **3 onglets** : Informations, Commentaires, Documents
- **Contexte visible** : Le Kanban reste visible en arrière-plan
- **Boutons d'action** : Edit et Delete fonctionnent toujours sans ouvrir le Drawer

## 🧪 Tests effectués
- ✅ Vérification TypeScript : Aucune erreur
- ✅ Vérification ESLint : Aucune erreur
- ✅ Compilation : Succès

## 📝 Notes techniques
- Le Drawer utilise `position="right"` et `size="xl"` (32rem)
- Les composants `ProjectComments` et `ProjectAttachments` sont réutilisés
- Le chargement des détails se fait via `projectTasksAPI.get(task.id)`
- Gestion des erreurs avec toast notifications

## 🔄 Compatibilité
- ✅ Compatible avec le drag & drop existant
- ✅ Compatible avec les boutons Edit/Delete
- ✅ Compatible avec `TaskTimer`
- ✅ Réutilise les composants existants (ProjectComments, ProjectAttachments)

## 📦 Fichiers modifiés
- `apps/web/src/components/projects/TaskKanban.tsx`

## 🚀 Améliorations futures possibles
- Badge avec nombre de commentaires/documents dans les onglets
- Animation de transition plus fluide
- Support du swipe sur mobile pour fermer
- Édition rapide depuis le Drawer
