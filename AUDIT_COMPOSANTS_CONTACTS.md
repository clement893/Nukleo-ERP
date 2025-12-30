# Audit d'utilisation des composants - Page Contacts

**Page analysée**: `/apps/web/src/app/[locale]/dashboard/reseau/contacts/page.tsx`  
**Date**: 2024

## ✅ Composants bien utilisés

La page utilise correctement plusieurs composants réutilisables :

1. **Layout Components**
   - ✅ `PageHeader` - En-tête avec breadcrumbs
   - ✅ `MotionDiv` - Animations

2. **UI Components**
   - ✅ `Card` - Conteneurs de contenu
   - ✅ `Button` - Boutons d'action
   - ✅ `Badge` - Badges de statut/filtres
   - ✅ `Alert` - Messages d'erreur
   - ✅ `Loading` - Indicateurs de chargement
   - ✅ `Modal` - Modales de création/édition
   - ✅ `DataTable` - Tableau de données

3. **Commercial Components**
   - ✅ `ContactsGallery` - Vue galerie
   - ✅ `ContactForm` - Formulaire de contact
   - ✅ `ContactAvatar` - Avatar avec gestion d'erreur

## ⚠️ Code inline qui devrait être des composants

### 1. Barre de recherche (lignes 618-639)
**Problème**: Code HTML/JSX inline alors qu'un composant `SearchBar` existe déjà.

**Code actuel**:
```tsx
<div className="relative">
  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
    <Search className="w-4 h-4" />
  </div>
  <input
    type="text"
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    placeholder="Rechercher par nom, email, téléphone, entreprise..."
    className="w-full pl-10 pr-10 py-2 text-sm border border-border rounded-md..."
  />
  {searchQuery && (
    <button onClick={() => setSearchQuery('')} ...>
      <X className="w-4 h-4" />
    </button>
  )}
</div>
```

**Solution**: Utiliser `SearchBar` de `@/components/ui/SearchBar.tsx`
- ✅ Composant existe déjà
- ✅ Supporte `onSearch` callback
- ✅ Gère le bouton clear
- ⚠️ Nécessite adaptation pour utiliser `value` contrôlé au lieu de state interne

### 2. Badges de filtres actifs (lignes 642-714)
**Problème**: Logique répétitive pour afficher/supprimer les filtres.

**Code actuel**: ~70 lignes de JSX répétitif

**Solution**: Créer `FilterBadges` component
```tsx
interface FilterBadgesProps {
  filters: Record<string, string>;
  onRemoveFilter: (key: string) => void;
  onClearAll: () => void;
  labels?: Record<string, string>;
}
```

### 3. Sélecteurs de filtres (lignes 719-777)
**Problème**: 4 `<select>` inline avec styles répétés.

**Code actuel**: ~60 lignes de JSX répétitif

**Solution**: Utiliser `Select` de `@/components/ui/Select.tsx` ou créer `FilterSelect`
- ✅ `Select` existe déjà
- ⚠️ Nécessite wrapper pour simplifier l'usage

### 4. Compteur de contacts (lignes 592-616)
**Problème**: Logique de comptage inline avec styles complexes.

**Code actuel**: ~25 lignes avec logique conditionnelle

**Solution**: Créer `ContactCounter` component
```tsx
interface ContactCounterProps {
  filtered: number;
  total: number;
  showFilteredBadge?: boolean;
}
```

### 5. Toggle de vue (lignes 782-807)
**Problème**: Boutons toggle inline avec logique de style.

**Code actuel**: ~25 lignes

**Solution**: Créer `ViewModeToggle` component réutilisable
```tsx
interface ViewModeToggleProps {
  value: 'list' | 'gallery';
  onChange: (mode: 'list' | 'gallery') => void;
}
```

### 6. Actions rapides (email/téléphone dans colonnes)
**Problème**: Code répété dans les colonnes `email` et `phone`.

**Code actuel**: ~40 lignes répétitives

**Solution**: Créer `ContactActionLink` component
```tsx
interface ContactActionLinkProps {
  type: 'email' | 'phone';
  value: string;
  contact: Contact;
}
```

## 📊 Métriques

- **Lignes de code**: ~1042 lignes
- **Composants utilisés**: 11 composants réutilisables
- **Code inline réutilisable**: ~250 lignes (24%)
- **Composants manquants**: 6 composants identifiés

## 🎯 Recommandations prioritaires

### Priorité 1 - Impact élevé, effort faible
1. **Utiliser `SearchBar`** existant (adaptation mineure nécessaire)
   - Gain: ~20 lignes
   - Réutilisabilité: ✅

2. **Créer `FilterBadges`** component
   - Gain: ~70 lignes
   - Réutilisabilité: ✅✅ (utilisable sur autres pages)

### Priorité 2 - Impact moyen, effort moyen
3. **Créer `ViewModeToggle`** component
   - Gain: ~25 lignes
   - Réutilisabilité: ✅✅ (utilisable sur autres pages avec vues multiples)

4. **Créer `ContactCounter`** component
   - Gain: ~25 lignes
   - Réutilisabilité: ✅ (spécifique aux contacts mais utile)

### Priorité 3 - Impact faible, effort élevé
5. **Créer `FilterSelect`** wrapper
   - Gain: ~60 lignes
   - Réutilisabilité: ✅✅ (utilisable partout)

6. **Créer `ContactActionLink`** component
   - Gain: ~40 lignes
   - Réutilisabilité: ✅ (spécifique aux contacts)

## 💡 Bénéfices attendus

### Maintenabilité
- ✅ Code plus lisible (réduction de ~250 lignes)
- ✅ Logique centralisée dans composants
- ✅ Tests unitaires plus faciles

### Réutilisabilité
- ✅ Composants réutilisables sur autres pages
- ✅ Cohérence UI/UX entre pages
- ✅ Moins de duplication

### Performance
- ⚠️ Impact minimal (même nombre de composants React)
- ✅ Meilleure tree-shaking possible

## 🔧 Plan d'action suggéré

1. **Phase 1** (30 min)
   - Adapter `SearchBar` pour valeur contrôlée
   - Remplacer la barre de recherche inline

2. **Phase 2** (1h)
   - Créer `FilterBadges` component
   - Créer `ContactCounter` component
   - Remplacer le code inline

3. **Phase 3** (1h)
   - Créer `ViewModeToggle` component
   - Créer `ContactActionLink` component
   - Remplacer le code inline

**Total estimé**: ~2h30 pour refactoriser complètement

## ✅ Conclusion

La page utilise **bien** les composants principaux (DataTable, Modal, Card, etc.), mais contient **~24% de code inline** qui pourrait être extrait en composants réutilisables.

**Score actuel**: 7/10
**Score après refactoring**: 9.5/10

Les améliorations proposées amélioreront la maintenabilité et la réutilisabilité sans impacter les performances.
