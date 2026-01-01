# Batch 2 : Implémentation de la section Commentaires

## ✅ Objectif
Implémenter la fonctionnalité complète de commentaires pour les tâches : chargement, affichage et ajout de commentaires.

## 📋 Modifications apportées

### 1. Ajout des imports nécessaires
- Import de `projectCommentsAPI` et `ProjectComment` depuis `@/lib/api/project-comments`
- Import de `Avatar` pour afficher les avatars des utilisateurs
- Import de `useAuthStore` pour obtenir l'utilisateur actuel
- Import de l'icône `Send` depuis `lucide-react`

### 2. Composant `TaskCommentsTab`
Composant principal qui gère :
- **Chargement des commentaires** : Utilise `projectCommentsAPI.list({ task_id })`
- **Organisation des commentaires** : Sépare les commentaires de niveau supérieur et leurs réponses
- **Affichage de la liste** : Affiche tous les commentaires avec leurs réponses imbriquées
- **Formulaire d'ajout** : Permet d'ajouter un nouveau commentaire
- **Gestion des états** : Loading, erreurs, soumission

### 3. Composant `TaskCommentItem`
Composant pour afficher un commentaire individuel :
- **Affichage du commentaire** : Avatar, nom d'utilisateur, date relative, contenu
- **Indicateur de modification** : Affiche "(modifié)" si le commentaire a été édité
- **Formulaire de réponse** : Permet de répondre à un commentaire (threading)
- **Affichage des réponses** : Affiche les réponses de manière imbriquée avec une bordure gauche

### 4. Fonctionnalités implémentées

#### Chargement et affichage
- ✅ Chargement automatique des commentaires au montage du composant
- ✅ Organisation hiérarchique (commentaires principaux + réponses)
- ✅ Affichage avec avatars et noms d'utilisateurs
- ✅ Formatage des dates relatives ("Il y a 2h", "Il y a 3j", etc.)
- ✅ Indicateur visuel pour les commentaires modifiés

#### Ajout de commentaires
- ✅ Formulaire avec textarea
- ✅ Bouton de soumission
- ✅ Raccourci clavier (Cmd/Ctrl + Entrée)
- ✅ Rafraîchissement automatique après ajout
- ✅ Gestion des erreurs avec toast notifications

#### Réponses (threading)
- ✅ Bouton "Répondre" sur chaque commentaire
- ✅ Formulaire de réponse avec annulation
- ✅ Affichage imbriqué des réponses
- ✅ Rafraîchissement après ajout d'une réponse

### 5. UX/UI
- **Design cohérent** : Utilise les composants du design system
- **États de chargement** : Affichage d'un spinner pendant le chargement
- **État vide** : Message informatif quand il n'y a pas de commentaires
- **Scroll** : Zone scrollable pour les commentaires (max-height: 400px)
- **Responsive** : Design adaptatif

## 🧪 Tests effectués
- ✅ Vérification TypeScript : Aucune erreur
- ✅ Vérification ESLint : Aucune erreur
- ✅ Compilation : Succès

## 📝 Notes techniques
- Utilisation de `projectCommentsAPI` spécifique aux tâches/projets
- Les commentaires sont organisés en mémoire (top-level + replies)
- Le rafraîchissement se fait après chaque action (create)
- `currentUserId` est préparé pour le Batch 3 (édition/suppression)

## 🚀 Prochaines étapes
- **Batch 3** : Actions sur commentaires (éditer, supprimer ses propres commentaires)
- **Batch 4** : Afficher les documents/pièces jointes
- **Batch 5** : Upload et gestion des documents

## 📦 Fichiers modifiés
- `apps/web/src/components/employes/EmployeePortalTasks.tsx`

## 🔄 Améliorations futures possibles
- Badge dynamique avec le nombre de commentaires dans l'onglet
- Auto-refresh périodique des commentaires
- Notifications en temps réel
- Réactions/émojis sur les commentaires
- Mentions d'utilisateurs (@username)
