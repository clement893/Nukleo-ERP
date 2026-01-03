# Plan : Système de Widgets par Modules avec Bibliothèque Complète

## 🎯 Objectifs

1. **Bibliothèque complète de widgets** accessible sur le dashboard principal
2. **Filtrage par module** sur les pages d'accueil des modules (commercial, projets, finances, etc.)
3. **Widgets multi-modules** : un widget peut être attribué à plusieurs modules
4. **Widgets graphiques génériques** disponibles globalement mais filtrables par module
5. **Expansion de la bibliothèque** avec plus de widgets graphiques

---

## 📋 Phase 1 : Extension du Système de Types

### 1.1 Ajouter le concept de "Modules" aux types

**Fichier**: `apps/web/src/lib/dashboard/types.ts`

```typescript
/**
 * Modules disponibles dans l'application
 */
export type DashboardModule = 
  | 'commercial'
  | 'projects' 
  | 'finances'
  | 'team'
  | 'system'
  | 'global'; // Pour les widgets accessibles partout

/**
 * Extension de WidgetDefinition pour inclure les modules
 */
export interface WidgetDefinition {
  id: WidgetType;
  name: string;
  description: string;
  category: WidgetCategory;
  modules: DashboardModule[]; // Nouveau : liste des modules où le widget est disponible
  icon: LucideIcon;
  component: ComponentType<WidgetProps>;
  default_size: { w: number; h: number };
  min_size: { w: number; h: number };
  max_size?: { w: number; h: number };
  configurable: boolean;
  config_schema?: any;
  is_global?: boolean; // Nouveau : true pour widgets graphiques génériques accessibles partout
}
```

### 1.2 Créer une fonction utilitaire pour filtrer par module

**Fichier**: `apps/web/src/lib/dashboard/widgetRegistry.ts`

```typescript
/**
 * Filtre les widgets par module
 */
export function getWidgetsByModule(
  module: DashboardModule | 'all',
  registry: Record<WidgetType, WidgetDefinition> = widgetRegistry
): Record<WidgetType, WidgetDefinition> {
  if (module === 'all') return registry;
  
  return Object.fromEntries(
    Object.entries(registry).filter(([_, widget]) => 
      widget.modules.includes(module) || 
      widget.modules.includes('global') ||
      widget.is_global === true
    )
  ) as Record<WidgetType, WidgetDefinition>;
}

/**
 * Obtient tous les widgets globaux (graphiques génériques)
 */
export function getGlobalWidgets(
  registry: Record<WidgetType, WidgetDefinition> = widgetRegistry
): Record<WidgetType, WidgetDefinition> {
  return Object.fromEntries(
    Object.entries(registry).filter(([_, widget]) => 
      widget.is_global === true || widget.modules.includes('global')
    )
  ) as Record<WidgetType, WidgetDefinition>;
}
```

---

## 📊 Phase 2 : Création de Nouveaux Widgets Graphiques

### 2.1 Widgets graphiques génériques à créer

#### A. **BarChartWidget** (Générique)
- **Type**: `bar-chart-generic`
- **Modules**: `['global']`
- **Description**: Graphique en barres générique avec données personnalisables
- **Fichier**: `apps/web/src/components/dashboard/widgets/BarChartWidget.tsx`
- **Config**: 
  - `data_source`: API endpoint ou données statiques
  - `x_axis_field`: champ pour axe X
  - `y_axis_field`: champ pour axe Y
  - `title`: titre du graphique
  - `colors`: palette de couleurs

#### B. **LineChartWidget** (Générique)
- **Type**: `line-chart-generic`
- **Modules**: `['global']`
- **Description**: Graphique linéaire générique avec données temporelles
- **Fichier**: `apps/web/src/components/dashboard/widgets/LineChartWidget.tsx`

#### C. **PieChartWidget** (Générique)
- **Type**: `pie-chart-generic`
- **Modules**: `['global']`
- **Description**: Graphique circulaire pour répartition
- **Fichier**: `apps/web/src/components/dashboard/widgets/PieChartWidget.tsx`

#### D. **AreaChartWidget** (Générique)
- **Type**: `area-chart-generic`
- **Modules**: `['global']`
- **Description**: Graphique en aires empilées
- **Fichier**: `apps/web/src/components/dashboard/widgets/AreaChartWidget.tsx`

#### E. **TableWidget** (Générique)
- **Type**: `table-generic`
- **Modules**: `['global']`
- **Description**: Tableau de données générique avec tri et pagination
- **Fichier**: `apps/web/src/components/dashboard/widgets/TableWidget.tsx`

#### F. **MetricCardWidget** (Générique)
- **Type**: `metric-card-generic`
- **Modules**: `['global']`
- **Description**: Carte métrique avec valeur, label, et évolution
- **Fichier**: `apps/web/src/components/dashboard/widgets/MetricCardWidget.tsx`

### 2.2 Widgets commerciaux graphiques spécifiques à créer

#### A. **CommercialRevenueChartWidget**
- **Type**: `commercial-revenue-chart`
- **Modules**: `['commercial', 'finances']`
- **Description**: Graphique de revenus commerciaux par période
- **Fichier**: `apps/web/src/components/dashboard/widgets/CommercialRevenueChartWidget.tsx`

#### B. **CommercialConversionFunnelWidget**
- **Type**: `commercial-conversion-funnel`
- **Modules**: `['commercial']`
- **Description**: Entonnoir de conversion commercial (leads → opportunités → devis → ventes)
- **Fichier**: `apps/web/src/components/dashboard/widgets/CommercialConversionFunnelWidget.tsx`

#### C. **CommercialWinRateWidget**
- **Type**: `commercial-win-rate`
- **Modules**: `['commercial']`
- **Description**: Taux de réussite commercial par période/pipeline
- **Fichier**: `apps/web/src/components/dashboard/widgets/CommercialWinRateWidget.tsx`

---

## 🔄 Phase 3 : Mise à Jour du Registre de Widgets

### 3.1 Ajouter la propriété `modules` à tous les widgets existants

**Fichier**: `apps/web/src/lib/dashboard/widgetRegistry.ts`

**Exemple de migration pour widgets commerciaux**:
```typescript
'opportunities-list': {
  id: 'opportunities-list',
  name: 'Liste des Opportunités',
  description: 'Affiche la liste des opportunités récentes avec leurs détails',
  category: 'commercial',
  modules: ['commercial'], // ← NOUVEAU
  icon: TrendingUp,
  component: OpportunitiesListWidget,
  // ... reste identique
},
```

**Exemple pour widgets multi-modules**:
```typescript
'revenue-chart': {
  id: 'revenue-chart',
  name: 'Revenus',
  description: 'Graphique d\'évolution des revenus',
  category: 'finances',
  modules: ['finances', 'commercial'], // ← Multi-module
  icon: DollarSign,
  component: RevenueChartWidget,
  // ...
},
```

**Exemple pour widgets graphiques globaux**:
```typescript
'bar-chart-generic': {
  id: 'bar-chart-generic',
  name: 'Graphique en Barres',
  description: 'Graphique en barres générique avec données personnalisables',
  category: 'performance',
  modules: ['global'], // ← Accessible partout
  is_global: true, // ← Flag pour widgets graphiques génériques
  icon: BarChart3,
  component: BarChartWidget,
  // ...
},
```

### 3.2 Catégoriser tous les widgets existants

**Widgets commerciaux** (`modules: ['commercial']`):
- opportunities-list
- opportunities-pipeline
- opportunities-needing-action
- clients-count
- clients-growth
- testimonials-carousel
- quotes-list
- submissions-list
- commercial-stats
- commercial-revenue-chart (nouveau)
- commercial-conversion-funnel (nouveau)
- commercial-win-rate (nouveau)

**Widgets projets** (`modules: ['projects']`):
- projects-active
- projects-status
- tasks-kanban
- tasks-list

**Widgets finances** (`modules: ['finances']`):
- revenue-chart (`modules: ['finances', 'commercial']`)
- expenses-chart
- cash-flow

**Widgets équipe** (`modules: ['team']`):
- employees-count
- workload-chart

**Widgets performance** (`modules: ['global']` ou spécifiques):
- kpi-custom (`modules: ['global']`)
- goals-progress (`modules: ['global']`)
- growth-chart (`modules: ['global']`)

**Widgets système** (`modules: ['system']`):
- user-profile
- notifications

**Widgets graphiques génériques** (`modules: ['global']`, `is_global: true`):
- bar-chart-generic (nouveau)
- line-chart-generic (nouveau)
- pie-chart-generic (nouveau)
- area-chart-generic (nouveau)
- table-generic (nouveau)
- metric-card-generic (nouveau)

---

## 🎨 Phase 4 : Mise à Jour de WidgetLibrary

### 4.1 Ajouter le filtrage par module

**Fichier**: `apps/web/src/components/dashboard/WidgetLibrary.tsx`

**Modifications**:

```typescript
interface WidgetLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  module?: DashboardModule | 'all'; // ← NOUVEAU : module contextuel
  hasModuleAccess?: (module: string) => boolean;
}

export function WidgetLibrary({ isOpen, onClose, module = 'all', hasModuleAccess }: WidgetLibraryProps) {
  // ... code existant ...

  // Filter widgets based on module and permissions
  const filteredRegistry = useMemo(() => {
    let registry = widgetRegistry;
    
    // Filtrage par module si spécifié
    if (module && module !== 'all') {
      registry = getWidgetsByModule(module, registry);
    }
    
    // Filtrage par permissions si fourni
    if (hasModuleAccess) {
      registry = getFilteredWidgetRegistry(hasModuleAccess, registry);
    }
    
    return registry;
  }, [module, hasModuleAccess]);

  // ... reste du code ...
}
```

### 4.2 Ajouter un indicateur visuel pour les widgets globaux

Dans la grille de widgets, ajouter un badge "Global" pour les widgets avec `is_global: true`:

```typescript
{widget.is_global && (
  <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
    Global
  </span>
)}
```

---

## 📍 Phase 5 : Mise à Jour des Pages de Modules

### 5.1 Dashboard Commercial

**Fichier**: `apps/web/src/app/[locale]/dashboard/commercial/page.tsx`

**Modifications**:

```typescript
function CommercialDashboardContent() {
  // ... code existant ...

  return (
    <div className="h-screen flex flex-col gradient-bg-subtle">
      <DashboardToolbar onAddWidget={() => setIsLibraryOpen(true)} />
      
      <div className="flex-1 overflow-auto p-6 spacing-generous">
        <DashboardGrid />
      </div>

      {/* Widget Library avec filtre module commercial */}
      <WidgetLibrary
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        module="commercial" // ← NOUVEAU : filtre automatique
      />

      <QuickActions />
    </div>
  );
}
```

### 5.2 Dashboard Projets (à créer ou mettre à jour)

**Fichier**: `apps/web/src/app/[locale]/dashboard/projects/page.tsx`

```typescript
<WidgetLibrary
  isOpen={isLibraryOpen}
  onClose={() => setIsLibraryOpen(false)}
  module="projects" // ← Filtre module projets
/>
```

### 5.3 Dashboard Finances (à créer ou mettre à jour)

**Fichier**: `apps/web/src/app/[locale]/dashboard/finances/page.tsx`

```typescript
<WidgetLibrary
  isOpen={isLibraryOpen}
  onClose={() => setIsLibraryOpen(false)}
  module="finances" // ← Filtre module finances
/>
```

### 5.4 Dashboard Principal (tous les widgets)

**Fichier**: `apps/web/src/app/[locale]/dashboard/page.tsx`

```typescript
<WidgetLibrary
  isOpen={isLibraryOpen}
  onClose={() => setIsLibraryOpen(false)}
  module="all" // ← Tous les widgets disponibles
/>
```

---

## 🛠️ Phase 6 : Création des Composants de Widgets Graphiques

### 6.1 Structure commune pour widgets graphiques génériques

**Fichier**: `apps/web/src/components/dashboard/widgets/shared/GenericChartWidget.tsx`

Composant de base réutilisable pour tous les widgets graphiques génériques avec:
- Chargement de données depuis API ou config statique
- Configuration des axes (X, Y)
- Personnalisation des couleurs
- Export de données
- Responsive design

### 6.2 Implémentation des widgets graphiques

Utiliser Recharts (déjà présent) pour tous les widgets graphiques.

**Structure recommandée**:
```
apps/web/src/components/dashboard/widgets/
├── BarChartWidget.tsx
├── LineChartWidget.tsx
├── PieChartWidget.tsx
├── AreaChartWidget.tsx
├── TableWidget.tsx
├── MetricCardWidget.tsx
├── CommercialRevenueChartWidget.tsx
├── CommercialConversionFunnelWidget.tsx
├── CommercialWinRateWidget.tsx
└── shared/
    ├── GenericChartWidget.tsx
    └── ChartConfig.tsx
```

---

## 📝 Phase 7 : Migration et Rétrocompatibilité

### 7.1 Script de migration pour widgets existants

Créer un script utilitaire pour migrer automatiquement tous les widgets existants avec leur module par défaut basé sur leur catégorie:

```typescript
// scripts/migrate-widget-modules.ts
const categoryToModuleMap: Record<WidgetCategory, DashboardModule> = {
  commercial: 'commercial',
  projects: 'projects',
  finances: 'finances',
  performance: 'global',
  team: 'team',
  system: 'system',
};

// Migrer tous les widgets existants
```

### 7.2 Valeurs par défaut pour widgets existants

Si un widget n'a pas de propriété `modules`, utiliser sa catégorie comme module par défaut pour la rétrocompatibilité.

---

## ✅ Checklist d'Implémentation

### Priorité Haute (MVP)
- [ ] Phase 1 : Extension des types avec `modules` et `is_global`
- [ ] Phase 3.1 : Ajout de `modules` aux widgets commerciaux existants
- [ ] Phase 4.1 : Mise à jour de WidgetLibrary avec filtrage par module
- [ ] Phase 5.1 : Mise à jour du dashboard commercial avec `module="commercial"`

### Priorité Moyenne
- [ ] Phase 2.1 : Création de 2-3 widgets graphiques génériques (BarChart, LineChart, PieChart)
- [ ] Phase 3.2 : Catégorisation complète de tous les widgets existants
- [ ] Phase 6.1 : Création du composant GenericChartWidget réutilisable
- [ ] Phase 5.2-5.4 : Mise à jour des autres dashboards

### Priorité Basse (Améliorations)
- [ ] Phase 2.1 : Création des widgets graphiques restants
- [ ] Phase 2.2 : Création des widgets commerciaux graphiques spécifiques
- [ ] Phase 4.2 : Indicateur visuel "Global" dans WidgetLibrary
- [ ] Phase 7 : Scripts de migration et documentation

---

## 🎯 Résultat Attendu

### Dashboard Commercial (`/dashboard/commercial`)
- ✅ Affiche uniquement les widgets avec `modules: ['commercial']` ou `modules: ['global']`
- ✅ Les widgets graphiques génériques (`is_global: true`) sont disponibles
- ✅ Les widgets multi-modules (ex: revenue-chart avec `modules: ['commercial', 'finances']`) sont disponibles

### Dashboard Principal (`/dashboard`)
- ✅ Affiche TOUS les widgets disponibles (pas de filtre)
- ✅ Bibliothèque complète avec toutes les catégories
- ✅ Tous les widgets graphiques génériques accessibles

### Bibliothèque de Widgets
- ✅ Filtrage automatique selon le contexte (module)
- ✅ Recherche et filtres par catégorie fonctionnels
- ✅ Indicateur visuel pour widgets globaux
- ✅ Support des widgets multi-modules

---

## 📚 Notes Techniques

1. **Rétrocompatibilité**: Les widgets sans propriété `modules` utilisent leur catégorie comme module par défaut
2. **Performance**: Le filtrage par module est fait côté client (useMemo pour optimisation)
3. **Extensibilité**: Facile d'ajouter de nouveaux modules dans le futur
4. **Réutilisabilité**: Les widgets graphiques génériques utilisent un composant de base commun
5. **Type Safety**: TypeScript garantit la cohérence des modules

---

## 🔄 Prochaines Étapes

Une fois ce plan validé, l'implémentation peut commencer par:
1. La Phase 1 (types) - Fondation
2. La Phase 3.1 (migration widgets commerciaux) - Impact immédiat
3. La Phase 4.1 + 5.1 (WidgetLibrary + Dashboard Commercial) - Fonctionnalité visible

Les widgets graphiques peuvent être ajoutés progressivement selon les besoins.
