# Batch 5 : Upload et gestion des documents

## ✅ Objectif
Implémenter les fonctionnalités d'upload et de suppression des documents pour les tâches.

## 📋 Modifications apportées

### 1. Ajout des imports nécessaires
- Import de `useRef` depuis React pour gérer la référence du file input
- Import de l'icône `Plus` depuis `lucide-react`

### 2. Amélioration du composant `TaskDocumentsTab`
- **État d'upload** : Ajout de `uploading` pour gérer l'état de chargement pendant l'upload
- **État de suppression** : Ajout de `deletingIds` (Set) pour gérer les suppressions multiples
- **Référence du file input** : Utilisation de `useRef` pour accéder au file input

### 3. Fonctionnalités d'upload

#### `handleFileSelect(event)`
Gère la sélection et l'upload d'un fichier :
- ✅ Validation de la taille (max 50MB)
- ✅ Upload via `projectAttachmentsAPI.upload()`
- ✅ Rafraîchissement automatique de la liste après upload
- ✅ Gestion des erreurs avec toast notifications
- ✅ Reset du file input après upload

#### Interface utilisateur
- ✅ Bouton "Ajouter un document" avec icône Plus
- ✅ Input file caché déclenché par le bouton
- ✅ Indicateur de chargement pendant l'upload
- ✅ Compteur de documents dans le header
- ✅ Message informatif sur la taille maximale

### 4. Fonctionnalités de suppression

#### `handleDelete(attachmentId)`
Gère la suppression d'un document :
- ✅ Confirmation avant suppression
- ✅ Suppression via `projectAttachmentsAPI.delete()`
- ✅ Rafraîchissement automatique de la liste après suppression
- ✅ Gestion des erreurs avec toast notifications
- ✅ État de chargement par document (Set de IDs)

#### Interface utilisateur
- ✅ Bouton "Supprimer" sur chaque document
- ✅ Style rouge pour indiquer la dangerosité
- ✅ Indicateur de chargement pendant la suppression
- ✅ Désactivation des boutons pendant la suppression

### 5. UX/UI améliorée
- **Header avec compteur** : Affiche le nombre de documents
- **Boutons d'action** : Télécharger et Supprimer côte à côte
- **États désactivés** : Boutons désactivés pendant les opérations
- **Feedback utilisateur** : Messages de succès/erreur via toast notifications
- **Validation** : Vérification de la taille avant upload

## 🧪 Tests effectués
- ✅ Vérification TypeScript : Aucune erreur dans le fichier modifié
- ✅ Vérification ESLint : Aucune erreur
- ✅ Compilation : Succès

## 📝 Notes techniques
- Utilisation de `useRef` pour gérer la référence du file input
- Validation de la taille côté client (50MB max)
- Gestion des états multiples avec un Set pour les IDs en cours de suppression
- Le file input est réinitialisé après chaque upload réussi

## 🔒 Sécurité
- Validation de la taille côté client (50MB)
- Le backend doit également valider la taille et le type de fichier
- Confirmation requise avant suppression

## 🚀 Prochaines étapes
- **Batch 6** : Améliorations supplémentaires (projet associé, équipe, créé par, polish UX)

## 📦 Fichiers modifiés
- `apps/web/src/components/employes/EmployeePortalTasks.tsx`

## 🎯 Fonctionnalités complètes des documents
- ✅ Chargement et affichage
- ✅ Upload de nouveaux documents
- ✅ Téléchargement des documents
- ✅ Suppression des documents
- ✅ Affichage des métadonnées
- ✅ Gestion des erreurs et états de chargement
