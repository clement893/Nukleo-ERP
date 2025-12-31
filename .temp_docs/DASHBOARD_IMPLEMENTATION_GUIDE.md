# Dashboard Personnalisable - Guide d'Implémentation pour Cursor

## 📋 Vue d'ensemble

Ce document détaille l'implémentation complète du dashboard personnalisable pour Nukleo-ERP. Il est destiné à Cursor AI pour comprendre l'architecture, les modifications apportées, et comment maintenir/étendre le système.

---

## 🎯 Objectif

Remplacer le dashboard statique par un système de dashboard entièrement personnalisable avec :
- Widgets modulaires drag & drop
- Connexion aux APIs réelles
- Filtres globaux
- Configurations multiples
- Persistance locale et serveur

---

## 📁 Structure des Fichiers

### Nouveaux Fichiers Créés

```
apps/web/src/
├── app/[locale]/dashboard/
│   ├── page.tsx                          # ✅ MODIFIÉ - Dashboard principal (remplacé)
│   ├── page.tsx.backup                   # 📦 BACKUP - Ancienne version
│   └── personnalisable/
│       └── page.tsx                      # 🆕 CRÉÉ - Version originale (conservée)
│
├── components/dashboard/
│   ├── DashboardGrid.tsx                 # 🆕 Grille drag & drop
│   ├── DashboardToolbar.tsx              # 🆕 Barre d'outils
│   ├── DashboardFilters.tsx              # 🆕 Filtres globaux
│   ├── WidgetContainer.tsx               # 🆕 Conteneur de widget
│   ├── WidgetLibrary.tsx                 # 🆕 Bibliothèque modale
│   ├── README.md                         # 🆕 Documentation
│   └── widgets/
│       ├── OpportunitiesListWidget.tsx   # 🆕 Widget opportunités
│       ├── ClientsCountWidget.tsx        # 🆕 Widget clients
│       ├── ProjectsActiveWidget.tsx      # 🆕 Widget projets
│       ├── RevenueChartWidget.tsx        # 🆕 Widget revenus
│       ├── KPICustomWidget.tsx           # 🆕 Widget KPI
│       └── index.ts                      # 🆕 Export central
│
├── lib/dashboard/
│   ├── types.ts                          # 🆕 Types TypeScript
│   ├── store.ts                          # 🆕 Store Zustand
│   └── widgetRegistry.ts                 # 🆕 Registre widgets
│
├── lib/api/
│   ├── dashboard-opportunities.ts        # 🆕 API Opportunités
│   ├── dashboard-clients.ts              # 🆕 API Clients
│   ├── dashboard-projects.ts             # 🆕 API Projets
│   └── dashboard-revenue.ts              # 🆕 API Revenus
│
└── hooks/dashboard/
    └── useWidgetData.ts                  # 🆕 Hook données widgets
```

### Fichiers Modifiés

- `apps/web/package.json` - Ajout de `react-grid-layout` et `@types/react-grid-layout`
- `pnpm-lock.yaml` - Lockfile mis à jour

---

## 🏗️ Architecture Technique

### 1. Store Zustand (`lib/dashboard/store.ts`)

**Responsabilité** : Gestion de l'état global du dashboard

**État géré** :
- `configs: DashboardConfig[]` - Liste des configurations
- `activeConfigId: string | null` - Configuration active
- `isEditMode: boolean` - Mode édition on/off
- `globalFilters: GlobalFilters` - Filtres globaux

**Actions principales** :
```typescript
// Configurations
addConfig(config: DashboardConfig)
updateConfig(id: string, updates: Partial<DashboardConfig>)
deleteConfig(id: string)
setActiveConfig(id: string)

// Widgets
addWidget(widget: Omit<WidgetLayout, 'id'>)
updateWidget(id: string, updates: Partial<WidgetLayout>)
removeWidget(id: string)
updateWidgetPosition(id: string, x: number, y: number)
updateWidgetSize(id: string, w: number, h: number)

// Filtres
setGlobalFilters(filters: GlobalFilters)
clearGlobalFilters()

// Mode édition
setEditMode(isEditMode: boolean)
```

**Persistance** :
- Local : IndexedDB via `zustand/middleware/persist`
- Serveur : Méthodes `saveToServer()` et `loadFromServer()` (à implémenter)

### 2. Types TypeScript (`lib/dashboard/types.ts`)

**Types principaux** :

```typescript
// 20 types de widgets définis
type WidgetType = 
  | 'opportunities-list'
  | 'clients-count'
  | 'projects-active'
  | 'revenue-chart'
  | 'kpi-custom'
  // ... 15 autres

// Configuration d'un widget
interface WidgetConfig {
  title?: string;
  period?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  refresh_interval?: number;
  // ... autres configs
}

// Layout d'un widget dans la grille
interface WidgetLayout {
  id: string;
  widget_type: WidgetType;
  x: number;
  y: number;
  w: number;
  h: number;
  config: WidgetConfig;
}

// Configuration complète du dashboard
interface DashboardConfig {
  id: string;
  name: string;
  is_default: boolean;
  layouts: WidgetLayout[];
  created_at: string;
  updated_at: string;
}

// Filtres globaux
interface GlobalFilters {
  start_date?: string;
  end_date?: string;
  company_id?: number;
  employee_id?: number;
  project_id?: number;
}
```

### 3. Registre de Widgets (`lib/dashboard/widgetRegistry.ts`)

**Responsabilité** : Catalogue central de tous les widgets disponibles

**Structure** :
```typescript
interface WidgetDefinition {
  id: WidgetType;
  name: string;
  description: string;
  category: 'commercial' | 'projects' | 'finances' | 'performance' | 'team' | 'system';
  icon: LucideIcon;
  component: React.ComponentType<WidgetProps>;
  default_size: { w: number; h: number };
  min_size: { w: number; h: number };
  max_size: { w: number; h: number };
  configurable: boolean;
  in_development?: boolean;
}

export const widgetRegistry: Record<WidgetType, WidgetDefinition> = {
  'opportunities-list': { ... },
  'clients-count': { ... },
  // ... 18 autres widgets
};
```

### 4. Hook de Données (`hooks/dashboard/useWidgetData.ts`)

**Responsabilité** : Récupération et cache des données de widgets

**Fonctionnement** :
1. Utilise React Query pour le cache et la gestion d'état
2. Appelle les API clients spécifiques selon le type de widget
3. Applique les filtres globaux
4. Gère le refresh automatique
5. Fallback sur données factices en cas d'erreur

**Exemple d'utilisation** :
```typescript
const { data, isLoading, error } = useWidgetData({
  widgetType: 'opportunities-list',
  config: { period: 'month' },
  globalFilters: { company_id: 123 },
});
```

### 5. API Clients (`lib/api/dashboard-*.ts`)

**Responsabilité** : Communication avec le backend

**Modules créés** :
- `dashboard-opportunities.ts` - GET `/api/v1/commercial/opportunities`
- `dashboard-clients.ts` - GET `/api/v1/commercial/companies`
- `dashboard-projects.ts` - GET `/api/v1/projects`
- `dashboard-revenue.ts` - GET `/api/v1/finances/revenue`

**Pattern commun** :
```typescript
export async function fetchDashboardXXX(params?: { ... }): Promise<XXXResponse> {
  try {
    const response = await apiClient.get('/api/v1/...');
    return transformData(response.data);
  } catch (error) {
    console.error('Error fetching XXX:', error);
    // Fallback to sample data or empty response
    return fallbackData;
  }
}
```

**Gestion d'erreurs** :
- Try/catch sur chaque appel
- Fallback automatique sur données factices
- Logs dans la console pour debugging
- Transformation des données pour uniformiser les formats

---

## 🎨 Composants React

### 1. DashboardGrid

**Responsabilité** : Grille drag & drop avec react-grid-layout

**Props** : Aucune (utilise le store)

**Fonctionnalités** :
- Drag & drop des widgets
- Redimensionnement par les coins
- Responsive (12/8/6/4 colonnes)
- Animations fluides
- Placeholder pendant le drag

**Configuration react-grid-layout** :
```typescript
<ResponsiveGridLayout
  className="layout"
  layouts={{ lg: layouts }}
  breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
  cols={{ lg: 12, md: 8, sm: 6, xs: 4 }}
  rowHeight={150}
  isDraggable={isEditMode}
  isResizable={isEditMode}
  onLayoutChange={handleLayoutChange}
  draggableHandle=".widget-drag-handle"
/>
```

### 2. DashboardToolbar

**Responsabilité** : Barre d'outils en haut du dashboard

**Props** :
- `onAddWidget: () => void` - Callback pour ouvrir la bibliothèque

**Fonctionnalités** :
- Sélecteur de configuration
- Bouton "Personnaliser" / "Terminer"
- Bouton "Ajouter un widget"
- Composant DashboardFilters intégré
- Banner d'aide en mode édition

### 3. DashboardFilters

**Responsabilité** : Filtres globaux pour tous les widgets

**Fonctionnalités** :
- Date range picker avec presets (Today, Week, Month, Quarter, Year)
- Sélecteur de company/client
- Sélecteur d'employé
- Sélecteur de projet
- Indicateur de filtres actifs
- Bouton "Clear All"

**Chargement des options** :
```typescript
// Load companies
const companiesRes = await apiClient.get('/api/v1/commercial/companies');

// Load employees
const employeesRes = await apiClient.get('/api/v1/management/employees');

// Load projects
const projectsRes = await apiClient.get('/api/v1/projects');
```

### 4. WidgetContainer

**Responsabilité** : Conteneur wrapper pour chaque widget

**Props** :
- `id: string` - ID du widget
- `type: WidgetType` - Type de widget
- `config: WidgetConfig` - Configuration
- `isEditMode: boolean` - Mode édition

**Fonctionnalités** :
- Header avec icône et titre
- Boutons d'action (refresh, config, delete)
- Grip handle pour le drag
- Panel de configuration intégré
- Loading et error states

### 5. WidgetLibrary

**Responsabilité** : Modal pour ajouter des widgets

**Props** :
- `isOpen: boolean` - État ouvert/fermé
- `onClose: () => void` - Callback de fermeture

**Fonctionnalités** :
- Recherche par nom/description
- Filtres par catégorie
- Grille de widgets avec icônes
- Indication "In Development"
- Ajout en un clic

### 6. Widgets Individuels

**Pattern commun** :
```typescript
export function MyWidget({ id, config, globalFilters }: WidgetProps) {
  const { data, isLoading, error } = useWidgetData({
    widgetType: 'my-widget',
    config,
    globalFilters,
  });

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState />;

  return (
    <div className="h-full">
      {/* Render data */}
    </div>
  );
}
```

**Widgets implémentés** :

1. **OpportunitiesListWidget** - Liste des opportunités
   - Affiche nom, entreprise, montant, probabilité, étape
   - Liens cliquables vers les pages détaillées
   - Badges colorés pour les étapes

2. **ClientsCountWidget** - Compteur de clients
   - Nombre total de clients
   - Croissance en %
   - Comparaison période précédente
   - Icône et indicateur visuel

3. **ProjectsActiveWidget** - Projets actifs
   - Liste des projets avec progression
   - Barres de progression
   - Alertes de retard
   - Statuts colorés

4. **RevenueChartWidget** - Graphique des revenus
   - Graphique linéaire avec Recharts
   - Total et croissance
   - Tooltip interactif
   - Responsive

5. **KPICustomWidget** - KPI personnalisé
   - Valeur du KPI avec unité
   - Croissance vs période précédente
   - Progression vers objectif
   - Sparkline de tendance

---

## 🔄 Flux de Données

### 1. Initialisation du Dashboard

```
User accesses /dashboard
  ↓
DashboardPage component loads
  ↓
useEffect checks if configs exist
  ↓
If no configs:
  - Create default configuration
  - Add 5 default widgets
  - Set as active config
  ↓
Store persists to IndexedDB
  ↓
DashboardGrid renders widgets
```

### 2. Récupération de Données Widget

```
Widget component mounts
  ↓
useWidgetData hook called
  ↓
React Query checks cache
  ↓
If not cached or stale:
  - fetchWidgetData() called
  - API client fetches from backend
  - Data transformed and returned
  ↓
If error:
  - Fallback to sample data
  - Log error to console
  ↓
Data cached by React Query
  ↓
Widget renders with data
```

### 3. Drag & Drop

```
User enters edit mode
  ↓
DashboardGrid enables dragging
  ↓
User drags widget
  ↓
react-grid-layout handles drag
  ↓
onLayoutChange callback fired
  ↓
Store updates widget positions
  ↓
Store persists to IndexedDB
  ↓
Grid re-renders
```

### 4. Filtres Globaux

```
User opens filters panel
  ↓
DashboardFilters loads options from API
  ↓
User selects filters
  ↓
setGlobalFilters() called
  ↓
Store updates globalFilters
  ↓
All widgets re-fetch data with new filters
  ↓
React Query invalidates cache
  ↓
Widgets re-render with filtered data
```

---

## 🚀 Déploiement

### Modifications Apportées

1. **Page principale remplacée** :
   - `/app/[locale]/dashboard/page.tsx` - Nouveau dashboard personnalisable
   - `/app/[locale]/dashboard/page.tsx.backup` - Ancienne version sauvegardée

2. **Dépendances ajoutées** :
   ```json
   {
     "react-grid-layout": "^1.4.4",
     "@types/react-grid-layout": "^1.3.5"
   }
   ```

3. **Compatibilité Next.js 16** :
   - `export const dynamic = 'force-dynamic'` sur la page
   - `'use client'` sur tous les composants interactifs
   - ErrorBoundary wrapper

### Commandes de Build

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Start dev server
pnpm dev

# Type check
pnpm tsc --noEmit
```

---

## 🧪 Tests Recommandés

### Tests Manuels

1. **Navigation** :
   - [ ] Accéder à `/dashboard`
   - [ ] Vérifier que le dashboard personnalisable s'affiche
   - [ ] Vérifier que 5 widgets par défaut sont présents

2. **Drag & Drop** :
   - [ ] Cliquer sur "Personnaliser"
   - [ ] Glisser-déposer un widget
   - [ ] Redimensionner un widget par les coins
   - [ ] Vérifier que la position est sauvegardée

3. **Widgets** :
   - [ ] Vérifier que les données se chargent
   - [ ] Cliquer sur les liens dans OpportunitiesListWidget
   - [ ] Vérifier les graphiques dans RevenueChartWidget
   - [ ] Tester le refresh manuel

4. **Filtres Globaux** :
   - [ ] Ouvrir le panel de filtres
   - [ ] Sélectionner une date range
   - [ ] Sélectionner une company
   - [ ] Vérifier que tous les widgets se mettent à jour
   - [ ] Cliquer sur "Clear All"

5. **Bibliothèque de Widgets** :
   - [ ] Cliquer sur "Ajouter un widget"
   - [ ] Rechercher un widget
   - [ ] Filtrer par catégorie
   - [ ] Ajouter un widget
   - [ ] Vérifier qu'il apparaît dans la grille

6. **Responsive** :
   - [ ] Tester sur desktop (>1200px)
   - [ ] Tester sur tablet (768-1200px)
   - [ ] Tester sur mobile (<768px)

7. **Dark Mode** :
   - [ ] Activer le dark mode
   - [ ] Vérifier que tous les composants sont lisibles

### Tests Automatisés (À Implémenter)

```typescript
// Example with Jest + React Testing Library
describe('DashboardPage', () => {
  it('should render default widgets', () => {
    render(<DashboardPage />);
    expect(screen.getByText('Recent Opportunities')).toBeInTheDocument();
  });

  it('should enter edit mode', () => {
    render(<DashboardPage />);
    fireEvent.click(screen.getByText('Personnaliser'));
    expect(screen.getByText('Terminer')).toBeInTheDocument();
  });
});
```

---

## 🐛 Débogage

### Problèmes Courants

**1. Les widgets ne s'affichent pas**
- Vérifier la console pour les erreurs
- Vérifier que `widgetRegistry` contient le composant
- Vérifier que le type est bien défini dans `types.ts`

**2. Les données ne se chargent pas**
- Vérifier les appels API dans Network tab
- Vérifier les logs dans `useWidgetData`
- Vérifier que l'API backend est accessible
- Vérifier React Query DevTools

**3. Le drag & drop ne fonctionne pas**
- Vérifier que le mode édition est activé
- Vérifier que `react-grid-layout` est bien installé
- Vérifier les styles CSS

**4. Les filtres ne s'appliquent pas**
- Vérifier que `globalFilters` est bien passé aux widgets
- Vérifier que `useWidgetData` utilise les filtres
- Vérifier que React Query invalide le cache

### Outils de Débogage

1. **React Query DevTools** :
   ```typescript
   import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
   <ReactQueryDevtools initialIsOpen={false} />
   ```

2. **Zustand DevTools** :
   ```typescript
   import { devtools } from 'zustand/middleware';
   export const useDashboardStore = create<DashboardStore>()(
     devtools(persist(...))
   );
   ```

3. **Console Logs** :
   - Tous les API clients loguent les erreurs
   - `useWidgetData` logue les appels

---

## 📝 TODO - Prochaines Étapes

### Court Terme (1-2 semaines)

- [ ] Implémenter les 15 widgets restants
- [ ] Tester avec données de production réelles
- [ ] Optimiser les performances (memoization, lazy loading)
- [ ] Ajouter les tests unitaires

### Moyen Terme (3-4 semaines)

- [ ] Implémenter les layouts prédéfinis
- [ ] Ajouter l'export/import de configurations
- [ ] Migrer la persistance vers le backend
- [ ] Ajouter le partage de configurations entre utilisateurs

### Long Terme (2-3 mois)

- [ ] Ajouter des widgets avancés (BI, analytics)
- [ ] Implémenter les alertes et notifications
- [ ] Ajouter la personnalisation des couleurs/thèmes
- [ ] Créer un marketplace de widgets

---

## 🤝 Contribution

### Ajouter un Nouveau Widget

1. **Créer le composant** :
   ```typescript
   // apps/web/src/components/dashboard/widgets/MyWidget.tsx
   export function MyWidget({ id, config, globalFilters }: WidgetProps) {
     // Implementation
   }
   ```

2. **Ajouter au registre** :
   ```typescript
   // apps/web/src/lib/dashboard/widgetRegistry.ts
   'my-widget': {
     id: 'my-widget',
     name: 'My Widget',
     component: MyWidget,
     // ...
   }
   ```

3. **Ajouter le type** :
   ```typescript
   // apps/web/src/lib/dashboard/types.ts
   type WidgetType = ... | 'my-widget';
   ```

4. **Implémenter la récupération de données** :
   ```typescript
   // apps/web/src/hooks/dashboard/useWidgetData.ts
   case 'my-widget':
     return await fetchMyWidgetData(config, globalFilters);
   ```

### Standards de Code

- **TypeScript strict** : Pas de `any`, types explicites
- **Functional components** : Pas de class components
- **Hooks** : Utiliser les hooks React et custom hooks
- **Naming** : camelCase pour variables, PascalCase pour composants
- **Comments** : JSDoc pour les fonctions publiques
- **Styling** : Tailwind CSS uniquement

---

## 📚 Ressources

### Documentation Externe

- [React Grid Layout](https://github.com/react-grid-layout/react-grid-layout)
- [Zustand](https://github.com/pmndrs/zustand)
- [React Query](https://tanstack.com/query/latest)
- [Recharts](https://recharts.org/)
- [Next.js 16](https://nextjs.org/docs)

### Documentation Interne

- `apps/web/src/components/dashboard/README.md` - Documentation des composants
- `DASHBOARD_PERSONNALISABLE_LIVRAISON.md` - Document de livraison
- `PROPOSITION_DASHBOARD_PERSONNALISABLE.md` - Proposition initiale

---

## 📞 Support

Pour toute question ou problème :
1. Consulter ce guide d'implémentation
2. Vérifier la console pour les erreurs
3. Utiliser React Query DevTools
4. Contacter l'équipe de développement

---

**Créé par** : Manus AI  
**Date** : 31 décembre 2025  
**Version** : 2.0.0  
**Pour** : Cursor AI & Équipe de Développement
