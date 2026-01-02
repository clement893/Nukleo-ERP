# Plan : Conversion du Wizard de Création de Soumission en Page Pleine

## 📋 Objectif
Convertir le wizard de création de soumission d'une modal à une page pleine pour améliorer l'expérience utilisateur et offrir plus d'espace pour la saisie.

## 🎯 Avantages
- **Plus d'espace** : Meilleure visibilité et prise en main
- **Navigation améliorée** : URL dédiée, possibilité de partager/bookmark
- **Meilleure UX** : Focus total sur la création, moins de distractions
- **Responsive** : Meilleure adaptation mobile/tablette
- **Historique navigateur** : Possibilité de revenir en arrière

## 📐 Architecture Actuelle

### Composants existants
- `SubmissionWizard` : Composant principal du wizard (7 étapes)
- `SubmissionCoverPage`, `SubmissionContext`, `SubmissionIntroduction`, `SubmissionMandate`, `SubmissionProcess`, `SubmissionBudget`, `SubmissionTeam` : Composants d'étapes
- `LeoAssistant` : Assistant IA intégré
- Page actuelle : `/dashboard/commercial/soumissions` avec modal

### Structure actuelle
```
/dashboard/commercial/soumissions
  └── Modal (SubmissionWizard)
```

## 🏗️ Architecture Proposée

### Nouvelle structure
```
/dashboard/commercial/soumissions
  └── Bouton "Nouvelle soumission" → Navigation vers page dédiée

/dashboard/commercial/soumissions/nouvelle
  └── Page pleine avec SubmissionWizard
```

## 📝 Plan d'Implémentation

### Phase 1 : Création de la Route et Page (1-2h)

#### 1.1 Créer la nouvelle route
- **Fichier** : `apps/web/src/app/[locale]/dashboard/commercial/soumissions/nouvelle/page.tsx`
- **Actions** :
  - Créer la page avec `PageContainer`
  - Intégrer le `SubmissionWizard` en mode page pleine
  - Gérer les états de chargement et erreurs
  - Ajouter breadcrumbs : Accueil > Commercial > Soumissions > Nouvelle soumission

#### 1.2 Adapter le composant SubmissionWizard
- **Fichier** : `apps/web/src/components/commercial/SubmissionWizard.tsx`
- **Modifications** :
  - Ajouter une prop `mode?: 'modal' | 'page'` (rétrocompatibilité)
  - Adapter le layout pour mode page :
    - Header fixe avec titre et breadcrumbs
    - Zone de contenu scrollable
    - Footer fixe avec navigation
  - Ajuster les styles pour mode page pleine
  - Conserver le mode modal pour l'édition si nécessaire

### Phase 2 : Navigation et Routing (30min)

#### 2.1 Mettre à jour la page soumissions
- **Fichier** : `apps/web/src/app/[locale]/dashboard/commercial/soumissions/page.tsx`
- **Modifications** :
  - Remplacer l'ouverture de modal par navigation vers `/dashboard/commercial/soumissions/nouvelle`
  - Supprimer ou garder la modal pour l'édition (à décider)
  - Gérer le retour après création/annulation

#### 2.2 Gestion de la navigation
- Après création réussie : Rediriger vers `/dashboard/commercial/soumissions` ou la page de détail
- Après annulation : Retour à `/dashboard/commercial/soumissions`
- Après sauvegarde brouillon : Option de rester sur la page ou retourner à la liste

### Phase 3 : Amélioration du Layout (1-2h)

#### 3.1 Header de la page
- **Éléments** :
  - Titre : "Nouvelle soumission"
  - Breadcrumbs
  - Bouton "Annuler" / "Retour"
  - Indicateur de progression (optionnel dans header)

#### 3.2 Zone de contenu
- **Layout** :
  - Sidebar gauche (optionnelle) : Navigation rapide entre étapes
  - Zone principale : Contenu de l'étape actuelle
  - Sidebar droite (optionnelle) : Leo Assistant en mode fixe ou collapsible

#### 3.3 Footer
- **Éléments** :
  - Bouton "Précédent" / "Annuler"
  - Bouton "Sauvegarder le brouillon"
  - Bouton "Suivant" / "Créer la soumission"
  - Indicateur de progression

### Phase 4 : Responsive et Mobile (1h)

#### 4.1 Adaptation mobile
- **Modifications** :
  - Sidebar en overlay/drawer sur mobile
  - Navigation par swipe entre étapes (optionnel)
  - Footer sticky optimisé pour mobile
  - Leo Assistant en modal/drawer sur mobile

#### 4.2 Breakpoints
- Desktop (> 1024px) : Layout complet avec sidebars
- Tablet (768px - 1024px) : Layout simplifié, sidebars optionnelles
- Mobile (< 768px) : Layout vertical, navigation simplifiée

### Phase 5 : Améliorations UX (1-2h)

#### 5.1 Sauvegarde automatique
- Sauvegarde automatique du brouillon toutes les X secondes
- Indicateur visuel de sauvegarde
- Restauration automatique au retour sur la page

#### 5.2 Navigation améliorée
- Menu latéral avec aperçu de toutes les étapes
- Indicateur de complétion par étape
- Validation visuelle des champs requis

#### 5.3 Gestion des erreurs
- Validation en temps réel
- Messages d'erreur contextuels
- Prévention de la perte de données (confirmation avant navigation)

### Phase 6 : Tests et Polish (1h)

#### 6.1 Tests
- Navigation entre étapes
- Sauvegarde et restauration
- Création complète
- Gestion des erreurs
- Responsive sur différents appareils

#### 6.2 Polish
- Animations de transition
- Loading states
- Feedback utilisateur
- Accessibilité (ARIA, keyboard navigation)

## 🎨 Design Proposé

### Layout Desktop
```
┌─────────────────────────────────────────────────────────┐
│ Header: Titre + Breadcrumbs + Bouton Annuler            │
├──────────┬──────────────────────────────┬──────────────┤
│          │                              │              │
│ Sidebar  │   Zone de contenu           │  Leo        │
│ Navigation│   (Étape actuelle)          │  Assistant  │
│          │                              │              │
│          │                              │              │
├──────────┴──────────────────────────────┴──────────────┤
│ Footer: Précédent | Sauvegarder | Suivant/Créer        │
└─────────────────────────────────────────────────────────┘
```

### Layout Mobile
```
┌─────────────────────────┐
│ Header: Titre + Menu    │
├─────────────────────────┤
│                         │
│   Zone de contenu       │
│   (Étape actuelle)      │
│                         │
│                         │
├─────────────────────────┤
│ Footer: Nav + Actions   │
└─────────────────────────┘
```

## 📁 Fichiers à Modifier/Créer

### Nouveaux fichiers
1. `apps/web/src/app/[locale]/dashboard/commercial/soumissions/nouvelle/page.tsx`
2. `apps/web/src/app/[locale]/dashboard/commercial/soumissions/nouvelle/loading.tsx` (optionnel)
3. `apps/web/src/app/[locale]/dashboard/commercial/soumissions/nouvelle/error.tsx` (optionnel)

### Fichiers à modifier
1. `apps/web/src/components/commercial/SubmissionWizard.tsx`
   - Ajouter prop `mode`
   - Adapter layout conditionnel
   - Améliorer responsive

2. `apps/web/src/app/[locale]/dashboard/commercial/soumissions/page.tsx`
   - Remplacer modal par navigation
   - Gérer le retour après création

3. `apps/web/src/components/commercial/submission/*.tsx` (si nécessaire)
   - Ajuster styles pour page pleine

## 🔄 Migration et Rétrocompatibilité

### Option 1 : Mode hybride (recommandé)
- Garder le mode modal pour l'édition
- Utiliser le mode page pour la création
- Prop `mode?: 'modal' | 'page'` dans SubmissionWizard

### Option 2 : Migration complète
- Supprimer complètement le mode modal
- Tout passer en page pleine (création + édition)

## ⚠️ Points d'Attention

1. **État du formulaire** : Gérer la persistance entre les navigations
2. **URLs dynamiques** : Gérer les paramètres d'URL si nécessaire (étape, draft_id)
3. **Performance** : Optimiser le chargement des données (companies, etc.)
4. **Accessibilité** : S'assurer que la navigation clavier fonctionne
5. **SEO** : Meta tags appropriés (bien que page privée)

## 📊 Estimation Totale

- **Phase 1** : 1-2h
- **Phase 2** : 30min
- **Phase 3** : 1-2h
- **Phase 4** : 1h
- **Phase 5** : 1-2h
- **Phase 6** : 1h

**Total estimé** : 5-8 heures

## ✅ Critères de Succès

- [ ] Le wizard s'affiche en page pleine
- [ ] Navigation fluide entre les étapes
- [ ] Responsive sur mobile/tablette/desktop
- [ ] Sauvegarde de brouillon fonctionnelle
- [ ] Création de soumission fonctionnelle
- [ ] Retour à la liste après création/annulation
- [ ] Rétrocompatibilité avec mode modal (si option 1)
- [ ] Tests passés
- [ ] Accessibilité respectée

## 🚀 Prochaines Étapes

1. Valider le plan avec l'équipe
2. Créer les issues GitHub pour chaque phase
3. Commencer par la Phase 1 (route et page)
4. Itérer et tester au fur et à mesure
