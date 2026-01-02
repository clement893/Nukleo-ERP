# Proposition d'améliorations - Cartes de projets

## État actuel - Problèmes identifiés

### 1. **Design et présentation**
- Présentation assez dense avec beaucoup d'informations empilées
- Les actions (voir, éditer, supprimer) sont cachées par défaut (opacity-0) et seulement visibles au hover
- Barre de progression toujours à 0% (fonction non implémentée)
- Pas d'indicateurs visuels pour les dates importantes (deadline approchante)
- Information budgétaire basique sans visualisation du ratio dépensé/budget

### 2. **Organisation de l'information**
- Informations présentées de manière linéaire sans hiérarchie claire
- Pas de distinction visuelle entre informations critiques et secondaires
- Statuts de témoignage/portfolio non affichés alors qu'ils existent dans les données
- Responsable du projet non affiché

### 3. **Expérience utilisateur**
- Pas de feedback visuel pour les deadlines importantes
- Liens externes présentés de manière basique
- Pas d'indicateurs de statut visuels (bordure de couleur selon statut, etc.)

## Propositions d'améliorations

### Phase 1 : Améliorations visuelles et organisation (Priorité haute)

#### 1.1 Restructuration de la carte
- **Header amélioré** :
  - Titre plus proéminent avec meilleure hiérarchie
  - Badge de statut avec bordure de couleur correspondante
  - Indicateur visuel de deadline approchante (si < 7 jours : badge orange/rouge)
  
- **Section principale** :
  - Description limitée à 2 lignes avec "..." si tronquée
  - Informations critiques en haut (client, équipe, étape)
  - Informations secondaires regroupées (dates, année)

#### 1.2 Amélioration de la barre de progression
- **Barre de progression visuelle améliorée** :
  - Si progression disponible : afficher avec pourcentage
  - Si progression non disponible : afficher un placeholder ou "Non calculé"
  - Gradient de couleur selon le pourcentage (vert si > 80%, orange si 50-80%, rouge si < 50%)

#### 1.3 Amélioration de la section budget
- **Visualisation du budget** :
  - Afficher le budget total
  - Si dépensé disponible : afficher avec barre de progression (budget dépensé / budget total)
  - Badge de couleur selon le ratio (vert si < 80%, orange si 80-100%, rouge si > 100%)
  - Formater les montants de manière claire

#### 1.4 Amélioration des actions
- **Actions plus accessibles** :
  - Rendre les actions visibles par défaut avec opacité réduite
  - Augmenter l'opacité au hover
  - Ajouter des tooltips pour chaque action
  - Meilleur espacement et alignement

### Phase 2 : Fonctionnalités avancées (Priorité moyenne)

#### 2.1 Indicateurs visuels de deadline
- **Système d'alerte pour deadlines** :
  - Si deadline dans les 7 jours : badge orange "Échéance proche"
  - Si deadline dépassée : badge rouge "En retard"
  - Bordure de couleur sur la carte selon l'urgence

#### 2.2 Affichage des statuts supplémentaires
- **Badges pour témoignage et portfolio** :
  - Badge pour `temoignage_status` si disponible
  - Badge pour `portfolio_status` si disponible
  - Utiliser des couleurs distinctes pour chaque statut

#### 2.3 Affichage du responsable
- **Section responsable** :
  - Afficher le responsable du projet si disponible (`responsable_name`)
  - Icône utilisateur appropriée
  - Lien vers le profil si disponible

#### 2.4 Liens externes améliorés
- **Meilleure présentation des liens** :
  - Icônes distinctives pour chaque type de lien (Drive, Slack, Proposition, Échéancier)
  - Grouper les liens dans une section dédiée
  - Hover state amélioré avec preview de l'URL

### Phase 3 : Améliorations UX avancées (Priorité basse)

#### 3.1 Animation et transitions
- **Effets visuels** :
  - Animation de hover plus subtile (scale 1.01 au lieu de 1.02)
  - Transition smooth pour les changements d'état
  - Animation de la barre de progression lors du chargement

#### 3.2 Informations contextuelles
- **Tooltips et infos supplémentaires** :
  - Tooltip sur la date de création
  - Tooltip sur les dates de début/fin
  - Info-bulle pour expliquer les différents statuts

#### 3.3 Amélioration responsive
- **Adaptation mobile** :
  - Cartes plus compactes sur mobile
  - Réorganisation des informations pour petits écrans
  - Actions en menu déroulant sur mobile si nécessaire

## Détails d'implémentation suggérés

### Structure de carte améliorée

```
┌─────────────────────────────────────┐
│ [Badge Statut] [Deadline Alert]    │ ← Header avec statut
│ Nom du Projet                       │ ← Titre proéminent
│ Description (2 lignes max)          │ ← Description
├─────────────────────────────────────┤
│ 👥 Client: [Nom]                    │ ← Informations principales
│ 🎯 Équipe: [Nom]                    │
│ 📋 Étape: [Nom]                     │
│ 👤 Responsable: [Nom]               │ ← Nouveau
├─────────────────────────────────────┤
│ Progression: ████████░░ 80%         │ ← Barre améliorée
├─────────────────────────────────────┤
│ Budget: $10,000                     │ ← Budget avec visualisation
│ Dépensé: ████████░░ $8,000 (80%)   │
├─────────────────────────────────────┤
│ 📅 Dates et liens                   │ ← Dates et liens externes
│ [Badges témoignage/portfolio]       │ ← Nouveaux badges
├─────────────────────────────────────┤
│ [👁️ Voir] [✏️ Éditer] [🗑️ Supprimer]│ ← Actions visibles
└─────────────────────────────────────┘
```

### Couleurs et styles suggérés

- **Statuts** :
  - ACTIVE: Bleu (primary-500)
  - COMPLETED: Vert (success-500)
  - ARCHIVED: Gris (gray-500)
  - ON_HOLD: Orange (warning-500)

- **Deadline** :
  - Dans 7 jours: Orange (warning-500)
  - Dépassée: Rouge (danger-500)
  - Normale: Gris (gray-400)

- **Budget** :
  - < 80%: Vert (success-500)
  - 80-100%: Orange (warning-500)
  - > 100%: Rouge (danger-500)

## Priorisation

1. **Immédiat (Phase 1)** :
   - Restructuration de la carte
   - Amélioration de la barre de progression
   - Amélioration de la section budget
   - Actions plus accessibles

2. **Court terme (Phase 2)** :
   - Indicateurs de deadline
   - Affichage des statuts supplémentaires
   - Affichage du responsable
   - Liens externes améliorés

3. **Moyen terme (Phase 3)** :
   - Animations et transitions
   - Informations contextuelles
   - Amélioration responsive

## Notes techniques

- Utiliser les tokens de couleur du design system
- Respecter les classes glass-card et le style Nukleo
- S'assurer de la compatibilité avec le dark mode
- Tester avec différents types de projets (avec/sans budget, dates, etc.)
- Implémenter la fonction `calculateProgress` pour afficher la vraie progression
