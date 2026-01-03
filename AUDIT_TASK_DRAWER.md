# Audit - Modal/Drawer de Tâche (Task Drawer)

## 📋 Contexte

Audit de la modal/drawer de tâche dans le composant `TaskKanban.tsx` qui s'ouvre actuellement **à droite** (`position="right"`).

## 🔍 Analyse de l'implémentation actuelle

### Structure actuelle

**Fichier:** `apps/web/src/components/projects/TaskKanban.tsx`

**Caractéristiques:**
- Position: `right` (à droite)
- Taille: `xl` (32rem / 512px)
- Composant: `Drawer` réutilisable
- Organisation: Tabs (Informations, Commentaires, Documents)

### État actuel du drawer

```tsx
<Drawer
  isOpen={showTaskDrawer}
  onClose={() => {
    setShowTaskDrawer(false);
    setTaskDetails(null);
  }}
  title={taskDetails?.title || ''}
  position="right"
  size="xl"
  closeOnOverlayClick={true}
  closeOnEscape={true}
>
  <Tabs
    tabs={[
      { id: 'info', label: 'Informations', icon: Info, content: ... },
      { id: 'comments', label: 'Commentaires', icon: MessageSquare, content: ... },
      { id: 'documents', label: 'Documents', icon: Paperclip, content: ... },
    ]}
  />
</Drawer>
```

### Contenu de l'onglet "Informations"

- Description (si présente)
- Statut (texte uniquement)
- Priorité (badge coloré)
- Échéance (formatée)
- Heures estimées
- Assigné à (nom)

**Problèmes identifiés:**
- ❌ Pas d'édition inline
- ❌ Pas de champ titre éditable
- ❌ Pas de sous-tâches
- ❌ Pas de tags/labels
- ❌ Pas de checklist
- ❌ Pas d'historique d'activité
- ❌ Pas de dépendances
- ❌ Pas de temps passé (seulement estimé)
- ❌ Informations en lecture seule

## 🎯 Comparaison avec Asana (Meilleures pratiques)

### 1. **Position et taille**

**Asana:**
- Drawer à **droite** (correct ✅)
- Largeur adaptative: ~600-800px sur desktop
- Overlay semi-transparent
- Animation fluide (ease-out cubic-bezier)

**Notre implémentation:**
- ✅ Position droite
- ⚠️ Taille fixe 512px (peut être trop étroit)
- ✅ Overlay présent
- ✅ Animation présente

### 2. **Header (En-tête)**

**Asana:**
- Titre éditable directement (clic pour éditer)
- Bouton "Like" (cœur)
- Menu d'actions (3 points) avec:
  - Dupliquer
  - Déplacer
  - Supprimer
  - Créer un modèle
  - Partager
- Bouton de fermeture visible
- Badge de statut visible dans le header
- Avatar assigné visible

**Notre implémentation:**
- ❌ Titre non éditable (texte statique)
- ❌ Pas de menu d'actions
- ✅ Bouton fermeture présent
- ❌ Statut/priorité pas dans le header

### 3. **Corps du drawer**

**Asana - Organisation:**
- Sections verticales (pas de tabs!)
- Scroll vertical avec sections collantes
- Sections principales:
  1. **Assigné et date d'échéance** (inline, éditable)
  2. **Description** (éditeur riche)
  3. **Sous-tâches** (checklist)
  4. **Commentaires** (avec mentions @)
  5. **Attachments** (documents)
  6. **Tags/Labels** (étiquettes)
  7. **Dépendances** (liens vers autres tâches)
  8. **Heures** (estimées et réelles)
  9. **Historique d'activité** (timeline)
  10. **Champs personnalisés**

**Notre implémentation:**
- ⚠️ Organisation en tabs (moins intuitif que sections)
- ✅ Description présente
- ✅ Commentaires présents
- ✅ Documents présents
- ❌ Pas de sous-tâches
- ❌ Pas de tags
- ❌ Pas de dépendances
- ❌ Pas d'historique
- ❌ Pas d'édition inline

### 4. **Édition inline**

**Asana:**
- Clic sur n'importe quel champ pour éditer
- Sauvegarde automatique (debounced)
- Indicateur visuel de sauvegarde
- Annulation avec ESC
- Entrée pour sauvegarder

**Notre implémentation:**
- ❌ Pas d'édition inline (tous les champs en lecture seule)

### 5. **Champs métadonnées**

**Asana:**
- Assigné: Avatar + dropdown de sélection
- Date d'échéance: Calendrier inline
- Statut: Dropdown avec couleurs
- Priorité: Dropdown/segments
- Tags: Multi-select avec création rapide
- Projet: Lien cliquable vers le projet
- Section/Liste: Indication du contexte

**Notre implémentation:**
- ❌ Champs en lecture seule
- ⚠️ Pas de liens vers le projet
- ⚠️ Pas de section/liste visible

### 6. **Actions rapides**

**Asana:**
- Boutons d'action visibles:
  - "Compléter" (si non complété)
  - "Commencer" (si non commencé)
  - "Dupliquer"
  - "Supprimer"
- Raccourcis clavier:
  - `Space` pour compléter/décompléter
  - `E` pour éditer la description
  - `Cmd/Ctrl + Enter` pour ajouter commentaire

**Notre implémentation:**
- ❌ Pas d'actions rapides visibles
- ❌ Pas de raccourcis clavier

### 7. **Sous-tâches (Checklist)**

**Asana:**
- Liste de sous-tâches avec checkboxes
- Ajout rapide avec "+ Ajouter une sous-tâche"
- Réorganisation par drag & drop
- Indicateur de progression (X/Y complétées)

**Notre implémentation:**
- ❌ Pas de sous-tâches

### 8. **Commentaires**

**Asana:**
- Zone de commentaire en haut (toujours visible)
- Mentions @ pour taguer des utilisateurs
- Formatage riche (bold, italic, links)
- Pièces jointes dans les commentaires
- Réactions (emoji)
- Épinglage de commentaires

**Notre implémentation:**
- ✅ Commentaires présents
- ⚠️ Probablement basique (à vérifier)

### 9. **Documents/Attachments**

**Asana:**
- Zone de drop & drop
- Preview des images
- Intégration avec Google Drive, Dropbox, etc.
- Organisation par type

**Notre implémentation:**
- ✅ Documents présents (composant ProjectAttachments)

### 10. **Navigation**

**Asana:**
- Navigation précédent/suivant dans le drawer
- Raccourcis clavier: `J`/`K` pour naviguer
- Historique de navigation

**Notre implémentation:**
- ❌ Pas de navigation entre tâches

## 📊 Tableau comparatif

| Feature | Asana | Notre implémentation | Priorité |
|---------|-------|---------------------|----------|
| Position drawer | Droite ✅ | Droite ✅ | - |
| Largeur | 600-800px | 512px ⚠️ | Moyenne |
| Titre éditable | Oui ✅ | Non ❌ | **Haute** |
| Édition inline | Oui ✅ | Non ❌ | **Haute** |
| Sections vs Tabs | Sections ✅ | Tabs ⚠️ | Haute |
| Sous-tâches | Oui ✅ | Non ❌ | Haute |
| Tags/Labels | Oui ✅ | Non ❌ | Moyenne |
| Dépendances | Oui ✅ | Non ❌ | Moyenne |
| Historique activité | Oui ✅ | Non ❌ | Moyenne |
| Actions rapides | Oui ✅ | Non ❌ | **Haute** |
| Menu actions (3 points) | Oui ✅ | Non ❌ | **Haute** |
| Raccourcis clavier | Oui ✅ | Non ❌ | Moyenne |
| Navigation tâches | Oui ✅ | Non ❌ | Basse |
| Description éditable | Riche ✅ | Lecture seule ❌ | **Haute** |
| Heures réelles | Oui ✅ | Non ⚠️ | Moyenne |

## 🎨 Recommandations d'amélioration

### Priorité HAUTE 🔴

#### 1. **Changer de Tabs vers Sections verticales**
- ✅ Plus intuitif (Asana, Linear, Jira)
- ✅ Meilleure visibilité du contenu
- ✅ Navigation plus fluide
- ✅ Meilleure UX mobile

#### 2. **Édition inline des champs**
- Titre éditable dans le header
- Statut/priorité/assigné/date éditable inline
- Sauvegarde automatique (debounced)
- Indicateur de sauvegarde

#### 3. **Header amélioré**
- Titre éditable
- Menu d'actions (3 points) avec:
  - Dupliquer
  - Supprimer
  - Déplacer vers un projet
- Badge statut/priorité visible
- Avatar assigné

#### 4. **Actions rapides**
- Bouton "Compléter" / "Marquer comme terminé"
- Bouton "Commencer"
- Visible dans le header ou une barre d'actions

### Priorité MOYENNE 🟡

#### 5. **Sous-tâches (Checklist)**
- Liste de sous-tâches avec checkboxes
- Ajout rapide
- Réorganisation par drag & drop
- Indicateur de progression

#### 6. **Tags/Labels**
- Système de tags colorés
- Multi-select avec création rapide
- Filtrage par tags

#### 7. **Largeur du drawer**
- Augmenter à 600-640px minimum
- Ou rendre adaptatif (600px desktop, full mobile)

#### 8. **Description éditable**
- Éditeur riche ou markdown
- Preview mode / Edit mode
- Formatage de base

### Priorité BASSE 🟢

#### 9. **Historique d'activité**
- Timeline des modifications
- Qui a fait quoi et quand
- Filtrable

#### 10. **Dépendances**
- Lien vers autres tâches
- Graphique de dépendances
- Blocage visuel

#### 11. **Navigation entre tâches**
- Flèches précédent/suivant
- Raccourcis clavier J/K

#### 12. **Heures réelles**
- Temps passé affiché
- Intégration avec le timer

## 🔧 Structure proposée (sections verticales)

```
┌─────────────────────────────────────────┐
│ [Titre éditable]          [⚙️] [✕]     │ ← Header
├─────────────────────────────────────────┤
│                                         │
│ ┌─ Assigné & Échéance ───────────────┐ │
│ │ 👤 [Avatar] [Nom]      📅 [Date]   │ │ ← Éditable inline
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─ Description ──────────────────────┐ │
│ │ [Éditeur riche]                    │ │ ← Éditable
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─ Sous-tâches (5/10) ───────────────┐ │
│ │ ☐ Sous-tâche 1                     │ │
│ │ ☑ Sous-tâche 2                     │ │
│ │ ☐ Sous-tâche 3                     │ │
│ │ [+ Ajouter une sous-tâche]         │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─ Tags ─────────────────────────────┐ │
│ │ [🏷️ Tag1] [🏷️ Tag2] [+ Ajouter]   │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─ Commentaires ─────────────────────┐ │
│ │ [Zone de commentaire]              │ │
│ │ ───────────────────────────────────│ │
│ │ [Liste des commentaires]           │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─ Documents ────────────────────────┐ │
│ │ [Liste des fichiers]               │ │
│ │ [Zone de drop & drop]              │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─ Métadonnées ──────────────────────┐ │
│ │ Statut: [Dropdown]                 │ │
│ │ Priorité: [Dropdown]               │ │
│ │ Projet: [Lien]                     │ │
│ │ Heures estimées: [Input]           │ │
│ │ Heures réelles: [Affichage]        │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─ Historique ───────────────────────┐ │
│ │ [Timeline des activités]           │ │
│ └─────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

## 📝 Checklist d'implémentation

### Phase 1: Refactoring structure (Priorité haute)
- [ ] Remplacer les tabs par des sections verticales
- [ ] Réorganiser le layout avec scroll vertical
- [ ] Augmenter la largeur du drawer à 600-640px
- [ ] Améliorer le header avec menu d'actions

### Phase 2: Édition inline (Priorité haute)
- [ ] Titre éditable dans le header
- [ ] Champs assigné/date/statut/priorité éditable inline
- [ ] Sauvegarde automatique avec debounce
- [ ] Indicateur de sauvegarde
- [ ] Gestion des erreurs

### Phase 3: Features principales (Priorité moyenne)
- [ ] Sous-tâches (checklist)
- [ ] Tags/Labels
- [ ] Description éditable (éditeur riche ou markdown)
- [ ] Actions rapides (compléter, commencer)

### Phase 4: Améliorations (Priorité basse)
- [ ] Historique d'activité
- [ ] Dépendances
- [ ] Navigation entre tâches
- [ ] Raccourcis clavier

## 🎯 Résumé exécutif

**Points forts actuels:**
- ✅ Structure de base solide avec composant Drawer réutilisable
- ✅ Tabs fonctionnels
- ✅ Commentaires et documents intégrés
- ✅ Accessibilité de base (focus trap, aria)

**Points à améliorer:**
- 🔴 **Critique**: Pas d'édition inline (tout en lecture seule)
- 🔴 **Critique**: Organisation en tabs (moins intuitif)
- 🔴 **Critique**: Pas d'actions rapides
- 🟡 **Important**: Pas de sous-tâches
- 🟡 **Important**: Largeur peut être augmentée
- 🟢 **Souhaitable**: Tags, dépendances, historique

**Impact utilisateur:**
- Amélioration majeure de l'UX avec édition inline
- Meilleure efficacité avec actions rapides
- Plus intuitif avec sections verticales
- Plus complet avec sous-tâches et tags

**Effort estimé:**
- Phase 1: 2-3 jours
- Phase 2: 3-4 jours
- Phase 3: 4-5 jours
- Phase 4: 3-4 jours
- **Total: 12-16 jours** (2-3 semaines)