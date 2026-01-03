# Audit de la page Événements - Agenda

**Date** : 2026-01-03  
**Page** : `/fr/dashboard/agenda/evenements`  
**Objectif** : Aligner le design avec les autres pages modernes (Contacts, Entreprises)

---

## 🔍 État Actuel

### Points Positifs ✅
- Fonctionnalités complètes (CRUD, recherche, filtres, export)
- Gestion de sélection multiple
- Drawer pour les détails avec onglets
- Export CSV/Excel
- Actions en lot (suppression, changement de type)

### Points à Améliorer ❌

#### 1. **Header / Hero Section**
- ❌ Utilise `PageHeader` avec breadcrumbs (ancien design)
- ❌ Pas de hero header avec gradient Nukleo
- ❌ Pas de style moderne avec `NukleoPageHeader`
- ✅ **Référence** : Pages Contacts/Entreprises utilisent `NukleoPageHeader` avec hero gradient

#### 2. **Stats Cards**
- ❌ Aucune stats card en haut de page
- ❌ Pas de vue d'ensemble des événements
- ✅ **Référence** : Pages Contacts/Entreprises ont des stats cards compactes

#### 3. **Filtres et Recherche**
- ❌ Utilise des `<select>` HTML natifs (peu stylisés)
- ❌ Pas de boutons de filtre rapide visuels
- ❌ Pas de badges pour les filtres actifs
- ✅ **Référence** : Pages Contacts/Entreprises utilisent des boutons de filtre avec badges

#### 4. **Vue des Données**
- ❌ Seulement une vue tableau (DataTable)
- ❌ Pas de vue galerie/liste comme les autres pages
- ❌ Pas de cartes visuelles pour les événements
- ✅ **Référence** : Pages Contacts/Entreprises ont vue galerie + liste

#### 5. **Design Général**
- ❌ Layout moins moderne
- ❌ Espacements moins cohérents
- ❌ Pas de glass-card styling cohérent partout
- ❌ Boutons moins stylisés

#### 6. **Composants Utilisés**
- ❌ `PageHeader` (ancien)
- ❌ `SearchBar` (peut être remplacé par input moderne)
- ❌ `DataTable` uniquement (pas de vue alternative)
- ✅ **Référence** : Pages modernes utilisent composants Nukleo

---

## 📋 Plan d'Action

### Phase 1 : Header et Hero Section
1. ✅ Remplacer `PageHeader` par `NukleoPageHeader`
2. ✅ Ajouter hero header avec gradient Nukleo (comme calendrier)
3. ✅ Ajouter bouton "Nouvel événement" dans le header
4. ✅ Supprimer les breadcrumbs (redondants avec navigation)

### Phase 2 : Stats Cards
1. ✅ Créer stats cards compactes (horizontal layout)
   - Total événements
   - Événements à venir
   - Événements passés
   - Par type (réunions, rendez-vous, etc.)
2. ✅ Placer les stats cards après le header
3. ✅ Utiliser le même style que Contacts/Entreprises

### Phase 3 : Filtres et Recherche
1. ✅ Remplacer les `<select>` par des boutons de filtre rapide
2. ✅ Ajouter badges pour les filtres actifs
3. ✅ Créer une section de filtres avec glass-card
4. ✅ Ajouter recherche avec icône Search (comme autres pages)
5. ✅ Ajouter toggle vue galerie/liste/tableau

### Phase 4 : Vue des Données
1. ✅ Créer vue galerie (cartes événements)
2. ✅ Créer vue liste (liste compacte)
3. ✅ Garder vue tableau (DataTable) comme option
4. ✅ Ajouter toggle entre les vues
5. ✅ Utiliser le même style de cartes que Contacts/Entreprises

### Phase 5 : Design et Cohérence
1. ✅ Uniformiser les espacements
2. ✅ Utiliser glass-card partout
3. ✅ Améliorer le styling des boutons
4. ✅ Ajouter EmptyState moderne
5. ✅ Ajouter skeletons de chargement cohérents

### Phase 6 : Améliorations UX
1. ✅ Ajouter favoris (étoile) sur les événements
2. ✅ Améliorer le drawer de détails
3. ✅ Ajouter actions rapides sur les cartes
4. ✅ Améliorer la navigation

---

## 🎨 Design Cible

### Structure de Page
```
┌─────────────────────────────────────────┐
│  Hero Header (gradient Nukleo)          │
│  - Titre "Événements"                   │
│  - Description                          │
│  - Bouton "Nouvel événement"            │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  Stats Cards (4 cartes horizontales)   │
│  - Total | À venir | Passés | Réunions │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  Filtres et Recherche                   │
│  - Barre de recherche                   │
│  - Boutons filtres rapides              │
│  - Toggle vue (Galerie/Liste/Tableau)  │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  Contenu (selon vue sélectionnée)      │
│  - Galerie : Grille de cartes           │
│  - Liste : Liste compacte               │
│  - Tableau : DataTable                  │
└─────────────────────────────────────────┘
```

### Style des Cartes Événements (Vue Galerie)
- Carte glass-card avec bordure
- Date en haut (badge coloré)
- Titre en gras
- Description tronquée
- Icônes pour lieu, participants, type
- Actions rapides (voir, modifier, supprimer)
- Hover effect avec scale

### Style des Cartes Événements (Vue Liste)
- Layout horizontal
- Icône de type à gauche
- Informations principales au centre
- Actions à droite
- Compact et lisible

---

## 📝 Checklist d'Implémentation

### Header
- [ ] Remplacer PageHeader par NukleoPageHeader
- [ ] Ajouter hero header avec gradient
- [ ] Ajouter bouton dans header
- [ ] Tester responsive

### Stats Cards
- [ ] Créer composant stats cards
- [ ] Calculer les stats (total, à venir, passés, par type)
- [ ] Styliser avec layout horizontal
- [ ] Ajouter icônes appropriées

### Filtres
- [ ] Créer section filtres glass-card
- [ ] Remplacer selects par boutons
- [ ] Ajouter badges filtres actifs
- [ ] Ajouter recherche avec icône
- [ ] Ajouter toggle vue

### Vue Galerie
- [ ] Créer composant EventCard
- [ ] Créer grille responsive
- [ ] Ajouter actions sur cartes
- [ ] Ajouter favoris
- [ ] Styliser avec glass-card

### Vue Liste
- [ ] Créer composant EventListItem
- [ ] Layout horizontal compact
- [ ] Ajouter actions
- [ ] Styliser cohérent

### Vue Tableau
- [ ] Garder DataTable existant
- [ ] Améliorer styling si nécessaire
- [ ] S'assurer cohérence

### Design Général
- [ ] Uniformiser espacements
- [ ] Ajouter EmptyState
- [ ] Améliorer skeletons
- [ ] Tester responsive
- [ ] Vérifier accessibilité

---

## 🚀 Priorités

### Priorité Haute (MVP)
1. Header avec NukleoPageHeader
2. Stats cards
3. Filtres améliorés
4. Vue galerie basique

### Priorité Moyenne
1. Vue liste
2. Améliorations UX (favoris, etc.)
3. Design polish

### Priorité Basse
1. Optimisations
2. Animations supplémentaires
3. Features avancées

---

## 📊 Comparaison avec Pages Références

| Élément | Événements (Actuel) | Contacts/Entreprises | Calendrier |
|---------|---------------------|----------------------|------------|
| Header | PageHeader | NukleoPageHeader | Hero gradient |
| Stats | ❌ | ✅ Compactes | ✅ Compactes |
| Filtres | Selects HTML | Boutons badges | Boutons badges |
| Vues | Tableau uniquement | Galerie + Liste | Calendrier |
| Design | Ancien | Moderne | Moderne |
| Cartes | ❌ | ✅ | N/A |

---

## 🎯 Objectifs Finaux

1. ✅ Design cohérent avec le reste de l'application
2. ✅ Meilleure UX avec vues multiples
3. ✅ Navigation plus intuitive
4. ✅ Performance maintenue
5. ✅ Responsive design
6. ✅ Accessibilité améliorée

---

## 📌 Notes Techniques

- Utiliser les mêmes composants que Contacts/Entreprises
- Réutiliser les patterns établis
- Maintenir les fonctionnalités existantes
- Tester avec données réelles
- Vérifier performance avec beaucoup d'événements
