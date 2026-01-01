# Batch 4 : Affichage des documents/pièces jointes

## ✅ Objectif
Implémenter l'affichage de la liste des documents/pièces jointes pour une tâche, avec toutes les métadonnées pertinentes.

## 📋 Modifications apportées

### 1. Ajout des imports nécessaires
- Import de `projectAttachmentsAPI` et `ProjectAttachment` depuis `@/lib/api/project-attachments`
- Import des icônes `FileText`, `Image`, `File`, `Download` depuis `lucide-react`

### 2. Composant `TaskDocumentsTab`
Composant principal qui gère :
- **Chargement des documents** : Utilise `projectAttachmentsAPI.list({ task_id })`
- **Affichage de la liste** : Affiche tous les documents avec leurs métadonnées
- **Gestion des états** : Loading, erreurs

### 3. Fonctionnalités implémentées

#### Affichage des documents
- ✅ Liste des documents avec toutes les informations
- ✅ Icônes selon le type de fichier (image, PDF, autre)
- ✅ Nom du fichier (original_filename ou filename)
- ✅ Taille formatée (B, KB, MB, GB)
- ✅ Auteur (qui a uploadé le document)
- ✅ Date d'upload formatée (relative ou absolue)
- ✅ Description du document (si disponible)

#### Téléchargement
- ✅ Bouton de téléchargement pour chaque document
- ✅ Ouverture dans un nouvel onglet via `file_url`

### 4. Fonctions utilitaires

#### `formatFileSize(bytes: number)`
Formate la taille du fichier en unités appropriées :
- B pour bytes
- KB pour kilooctets
- MB pour mégaoctets
- GB pour gigaoctets

#### `formatDate(dateString: string)`
Formate la date de manière relative :
- "Aujourd'hui" pour aujourd'hui
- "Hier" pour hier
- "Il y a Xj" pour les 7 derniers jours
- Date formatée pour les dates plus anciennes

#### `getFileIcon(contentType: string, filename: string)`
Détermine l'icône à afficher selon le type de fichier :
- Icône Image (bleue) pour les images
- Icône FileText (rouge) pour les PDF
- Icône File (gris) pour les autres types
- Vérifie d'abord le content_type, puis l'extension en fallback

### 5. UX/UI
- **Design cohérent** : Utilise les composants du design system
- **États de chargement** : Affichage d'un spinner pendant le chargement
- **État vide** : Message informatif quand il n'y a pas de documents
- **Hover effect** : Changement de couleur au survol
- **Layout responsive** : Design adaptatif avec flexbox
- **Truncate** : Nom de fichier tronqué si trop long

## 🧪 Tests effectués
- ✅ Vérification TypeScript : Aucune erreur
- ✅ Vérification ESLint : Aucune erreur
- ✅ Compilation : Succès

## 📝 Notes techniques
- Utilisation de `projectAttachmentsAPI.list()` pour charger les documents
- Les documents sont triés par date de création (ordre de l'API)
- Le téléchargement ouvre le fichier dans un nouvel onglet
- Les icônes sont déterminées par content_type et extension

## 🚀 Prochaines étapes
- **Batch 5** : Upload et gestion des documents (upload, suppression)
- **Batch 6** : Améliorations supplémentaires (projet associé, équipe, etc.)

## 📦 Fichiers modifiés
- `apps/web/src/components/employes/EmployeePortalTasks.tsx`

## 🔄 Améliorations futures possibles
- Badge dynamique avec le nombre de documents dans l'onglet
- Preview pour les images directement dans la liste
- Filtrage par type de fichier
- Tri par nom, date, taille
- Recherche dans les noms de fichiers
