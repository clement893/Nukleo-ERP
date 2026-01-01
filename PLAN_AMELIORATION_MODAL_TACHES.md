# Plan d'amélioration du modal de détails des tâches

## Vue d'ensemble

Améliorer le modal de détails des tâches dans le portail employé pour inclure les commentaires, documents et autres informations utiles.

## État actuel

Le modal actuel affiche :
- Titre de la tâche
- Description
- Statut et priorité
- Échéance
- Heures estimées
- Dates (création, modification, début, fin)
- Assigné à

## Objectifs

1. ✅ Ajouter une section **Commentaires** avec possibilité de commenter et répondre
2. ✅ Ajouter une section **Documents/Pièces jointes** avec affichage et upload
3. ✅ Améliorer la présentation avec un design en onglets/sections
4. 🔄 (Optionnel) Ajouter d'autres améliorations suggérées

---

## Phase 1 : Restructuration du modal en sections/onglets

### 1.1 Structure proposée

**Onglet 1 : Informations générales** (par défaut)
- Description
- Statut, priorité, échéance
- Heures estimées
- Dates importantes
- Assigné à
- Projet associé (si disponible)

**Onglet 2 : Commentaires**
- Liste des commentaires (chronologique)
- Formulaire pour ajouter un commentaire
- Support des réponses (threading)
- Édition/suppression de ses propres commentaires

**Onglet 3 : Documents**
- Liste des pièces jointes
- Upload de nouveaux documents
- Téléchargement/visualisation
- Suppression (si permissions)

### 1.2 Composants nécessaires

- `Tabs` component (déjà disponible dans le design system)
- Section réutilisable pour chaque onglet
- Composant de liste de commentaires (réutiliser `CommentThread` ou créer un composant simplifié)
- Composant de liste de documents avec upload

---

## Phase 2 : Implémentation des Commentaires

### 2.1 API déjà disponible
- ✅ `projectCommentsAPI.list({ task_id })` - Liste des commentaires
- ✅ `projectCommentsAPI.create({ task_id, content, parent_id? })` - Créer un commentaire
- ✅ `projectCommentsAPI.update(id, { content })` - Modifier un commentaire
- ✅ `projectCommentsAPI.delete(id)` - Supprimer un commentaire

### 2.2 Fonctionnalités à implémenter

**Affichage :**
- Liste des commentaires triés par date (plus récents en premier ou plus anciens ?)
- Affichage de l'auteur avec avatar/nom
- Support du threading (réponses imbriquées)
- Indicateur si commentaire modifié
- Timestamp relatif ("il y a 2 heures")

**Actions :**
- Formulaire pour ajouter un commentaire (textarea + bouton)
- Bouton "Répondre" sur chaque commentaire
- Édition de ses propres commentaires
- Suppression de ses propres commentaires
- (Optionnel) Réactions/émojis

### 2.3 Design

```
┌─────────────────────────────────────┐
│ Commentaires (3)                    │
├─────────────────────────────────────┤
│                                     │
│ [Avatar] Jean Dupont                │
│ il y a 2 heures                     │
│ ───────────────────────────────────│
│ Excellent travail sur cette tâche ! │
│                                     │
│ [Répondre] [Modifier] [Supprimer]  │
│                                     │
│   └─ [Avatar] Marie Martin          │
│      il y a 1 heure                 │
│      ──────────────────────────────│
│      Merci !                        │
│                                     │
├─────────────────────────────────────┤
│ [Textarea pour nouveau commentaire]│
│ [Publier]                           │
└─────────────────────────────────────┘
```

---

## Phase 3 : Implémentation des Documents/Pièces jointes

### 3.1 API déjà disponible
- ✅ `projectAttachmentsAPI.list({ task_id })` - Liste des documents
- ✅ `projectAttachmentsAPI.upload(file, { task_id, description? })` - Upload
- ✅ `projectAttachmentsAPI.delete(id)` - Supprimer

### 3.2 Fonctionnalités à implémenter

**Affichage :**
- Liste des documents avec :
  - Icône selon le type de fichier
  - Nom du fichier
  - Taille formatée (KB, MB)
  - Date d'upload
  - Auteur (qui a uploadé)
  - Description (si disponible)

**Actions :**
- Bouton "Ajouter un document" (ouvre un file picker)
- Upload avec barre de progression
- Téléchargement au clic sur le fichier
- Preview pour images/PDF (optionnel)
- Suppression (si permissions)

### 3.3 Design

```
┌─────────────────────────────────────┐
│ Documents (5)                       │
├─────────────────────────────────────┤
│                                     │
│ [📄] rapport.pdf                    │
│      2.5 MB · Uploadé par Jean      │
│      il y a 3 jours                 │
│      [⬇️ Télécharger] [🗑️]         │
│                                     │
│ [🖼️] screenshot.png                 │
│      450 KB · Uploadé par Marie     │
│      il y a 1 jour                  │
│      [⬇️ Télécharger] [👁️ Preview]│
│                                     │
├─────────────────────────────────────┤
│ [+ Ajouter un document]             │
└─────────────────────────────────────┘
```

---

## Phase 4 : Autres améliorations suggérées

### 4.1 Informations supplémentaires
- **Projet associé** : Lien vers le projet si `project_id` existe
- **Équipe** : Afficher l'équipe de la tâche
- **Créé par** : Qui a créé la tâche (en plus de "Assigné à")
- **Temps passé** : Si `TimeEntry` est lié aux tâches, afficher le temps total passé
- **Sous-tâches** : Si des sous-tâches existent (à vérifier dans le modèle)

### 4.2 Améliorations UX
- **Raccourcis clavier** : `Escape` pour fermer, `Cmd/Ctrl + Enter` pour soumettre commentaire
- **Auto-refresh** : Rafraîchir les commentaires toutes les X secondes (optionnel)
- **Notifications** : Notifier quand un nouveau commentaire est ajouté (optionnel)
- **Mode lecture seule** : Si l'utilisateur n'a pas les permissions pour modifier

### 4.3 Responsive
- S'assurer que le modal et les onglets sont adaptés mobile
- Liste de documents en grille sur desktop, liste sur mobile
- Formulaire de commentaire adaptatif

---

## Plan d'implémentation

### Étape 1 : Restructuration du modal (2-3h)
1. Créer une structure avec `Tabs`
2. Déplacer les informations existantes dans l'onglet "Informations"
3. Créer les onglets "Commentaires" et "Documents" (vides pour l'instant)
4. Tester la navigation entre onglets

### Étape 2 : Section Commentaires (4-5h)
1. Créer un composant `TaskComments` ou réutiliser `CommentThread`
2. Intégrer `projectCommentsAPI.list()` pour charger les commentaires
3. Implémenter le formulaire d'ajout de commentaire
4. Implémenter les actions (répondre, éditer, supprimer)
5. Gérer le rafraîchissement après actions

### Étape 3 : Section Documents (4-5h)
1. Créer un composant `TaskAttachments`
2. Intégrer `projectAttachmentsAPI.list()` pour charger les documents
3. Implémenter l'affichage de la liste
4. Implémenter l'upload de fichiers
5. Implémenter le téléchargement et la suppression

### Étape 4 : Améliorations supplémentaires (2-3h)
1. Ajouter les informations manquantes (projet, équipe, créé par)
2. Améliorer le design et la mise en page
3. Tests et ajustements
4. Gestion des erreurs et états de chargement

### Étape 5 : Tests et polish (2h)
1. Tests sur différents navigateurs
2. Tests responsive
3. Ajustements finaux UX/UI
4. Documentation

**Estimation totale : 14-18h de développement**

---

## Décisions techniques

### Composants à réutiliser
- ✅ `Tabs` du design system
- ✅ `Modal` (déjà utilisé)
- ✅ `Button`, `Loading`, `Alert` (déjà utilisés)
- ✅ `CommentThread` ou créer un composant simplifié
- ✅ API clients existants (`projectCommentsAPI`, `projectAttachmentsAPI`)

### Composants à créer
- `TaskDetailsTabs` : Wrapper pour les onglets
- `TaskCommentsSection` : Section commentaires complète
- `TaskAttachmentsSection` : Section documents complète
- `AttachmentList` : Liste des pièces jointes avec actions

### Gestion d'état
- Utiliser `useState` pour les données locales (commentaires, documents)
- Recharger les données après chaque action (create/update/delete)
- Gérer les états de chargement par section

---

## Questions ouvertes

1. **Ordre des commentaires** : Plus récents en premier ou plus anciens ?
2. **Permissions** : Qui peut supprimer/modifier les commentaires ? (seulement l'auteur ou aussi les admins ?)
3. **Limite de taille** : Quelle taille max pour les documents uploadés ?
4. **Types de fichiers** : Quels types de fichiers autoriser ?
5. **Preview** : Implémenter un preview pour images/PDF dès maintenant ou plus tard ?
6. **Auto-refresh** : Activer le rafraîchissement automatique des commentaires ?
7. **Notifications** : Notifications en temps réel pour nouveaux commentaires ?

---

## Priorisation

### MVP (Minimum Viable Product)
1. ✅ Restructuration en onglets
2. ✅ Section Commentaires (affichage + ajout)
3. ✅ Section Documents (affichage + upload)
4. ✅ Améliorations informations générales

### Phase 2 (Améliorations)
- Threading des commentaires (réponses)
- Édition/suppression commentaires
- Preview des documents
- Temps passé sur la tâche

### Phase 3 (Nice to have)
- Réactions/émojis sur commentaires
- Auto-refresh
- Notifications en temps réel
- Sous-tâches

---

## Notes

- Les APIs backend existent déjà, pas besoin de développement backend
- Réutiliser au maximum les composants existants du design system
- Suivre les patterns déjà établis dans l'application
- Tester sur mobile dès le début
- Prévoir la gestion des erreurs et états de chargement
