# Plan : Système de Widgets pour la Section Management

## 📋 Vue d'ensemble

Ajouter un système de widgets personnalisables à la page `/dashboard/management`, similaire au dashboard principal, mais avec des widgets spécifiques au management (employés, feuilles de temps, vacances, dépenses, etc.).

## 🎯 Objectifs

1. **Créer un système de widgets modulaire** pour la section management
2. **Permettre la personnalisation** du layout (drag & drop)
3. **Fournir des widgets spécifiques** au management
4. **Maintenir la cohérence** avec le design system existant
5. **Optimiser les performances** avec chargement lazy et cache

## 📦 Structure des fichiers à créer/modifier

### Nouveaux fichiers à créer

```
apps/web/src/
├── components/
│   └── management/
│       ├── widgets/
│       │   ├── ManagementWidgetLibrary.tsx      # Bibliothèque de widgets management
│       │   ├── ManagementWidgetGrid.tsx         # Grille de widgets avec drag & drop
│       │   ├── ManagementWidgetToolbar.tsx      # Barre d'outils pour widgets
│       │   └── widgets/
│       │       ├── EmployeesStatsWidget.tsx     # Widget statistiques employés
│       │       ├── TimeTrackingWidget.tsx       # Widget suivi du temps
│       │       ├── VacationCalendarWidget.tsx  # Widget calendrier vacances
│       │       ├── PendingRequestsWidget.tsx    # Widget demandes en attente
│       │       ├── TeamCapacityWidget.tsx      # Widget capacité équipe
│       │       ├── HoursChartWidget.tsx         # Widget graphique heures
│       │       ├── RecentActivityWidget.tsx     # Widget activité récente
│       │       └── ExpenseSummaryWidget.tsx     # Widget résumé dépenses
│       └── ManagementDashboard.tsx              # Composant dashboard principal
├── lib/
│   └── management/
│       ├── store.ts                             # Store Zustand pour config widgets
│       └── types.ts                             # Types TypeScript pour widgets
└── hooks/
    └── management/
        └── useManagementWidgets.ts              # Hook pour données widgets
```

### Fichiers à modifier

```
apps/web/src/app/[locale]/dashboard/management/page.tsx  # Intégrer le système de widgets
```

## 🧩 Composants à créer

### 1. ManagementWidgetLibrary.tsx
**Rôle** : Bibliothèque de widgets disponibles pour la section management

**Fonctionnalités** :
- Liste des widgets disponibles avec descriptions
- Catégories de widgets (Statistiques, Calendrier, Graphiques, Liste)
- Prévisualisation des widgets
- Filtres par catégorie

**Widgets disponibles** :
- **Statistiques** :
  - `employees-stats` : Statistiques employés (total, actifs, nouveaux)
  - `time-tracking-summary` : Résumé suivi du temps
  - `vacation-overview` : Vue d'ensemble vacances
  - `expense-summary` : Résumé dépenses

- **Graphiques** :
  - `hours-chart` : Graphique heures travaillées (ligne/timeline)
  - `team-capacity-chart` : Graphique capacité équipe
  - `vacation-calendar` : Calendrier des vacances
  - `time-distribution` : Distribution du temps par projet/tâche

- **Listes** :
  - `pending-requests` : Demandes en attente (vacances, dépenses)
  - `recent-employees` : Employés récemment ajoutés
  - `upcoming-vacations` : Vacances à venir
  - `recent-time-entries` : Dernières entrées de temps

- **Calendrier** :
  - `vacation-calendar-view` : Vue calendrier des vacances
  - `team-availability` : Disponibilité équipe

### 2. ManagementWidgetGrid.tsx
**Rôle** : Grille responsive avec drag & drop pour organiser les widgets

**Fonctionnalités** :
- Layout responsive (grid system)
- Drag & drop avec react-grid-layout ou @dnd-kit
- Sauvegarde automatique de la configuration
- Redimensionnement des widgets
- Mode édition/visualisation

**Dépendances** :
- `react-grid-layout` ou `@dnd-kit/core` + `@dnd-kit/sortable`
- Store Zustand pour persister la configuration

### 3. ManagementWidgetToolbar.tsx
**Rôle** : Barre d'outils pour gérer les widgets

**Fonctionnalités** :
- Bouton "Ajouter un widget" (ouvre la bibliothèque)
- Bouton "Réinitialiser le layout"
- Bouton "Mode édition" (toggle)
- Filtres globaux (période, équipe, etc.)
- Export/Import configuration

### 4. Widgets individuels

#### EmployeesStatsWidget.tsx
**Données** :
- Total employés
- Employés actifs
- Nouveaux employés (ce mois)
- Employés en congé
- Taux de rotation

**Affichage** :
- Cards avec statistiques
- Graphique mini (évolution)
- Lien vers page employés

#### TimeTrackingWidget.tsx
**Données** :
- Heures totales (semaine/mois)
- Heures moyennes par employé
- Projets les plus actifs
- Distribution heures par projet

**Affichage** :
- Graphique en barres ou ligne
- Liste des projets avec heures
- Comparaison période précédente

#### VacationCalendarWidget.tsx
**Données** :
- Vacances approuvées
- Vacances en attente
- Vacances à venir (30 jours)
- Jours de congé restants par employé

**Affichage** :
- Calendrier mensuel avec marqueurs
- Liste des vacances à venir
- Badges de statut

#### PendingRequestsWidget.tsx
**Données** :
- Demandes de vacances en attente
- Demandes de dépenses en attente
- Demandes d'ajustement de temps

**Affichage** :
- Liste avec actions rapides (approuver/rejeter)
- Filtres par type
- Badges de priorité

#### TeamCapacityWidget.tsx
**Données** :
- Capacité totale équipe
- Charge actuelle
- Disponibilité par équipe
- Projets assignés

**Affichage** :
- Graphique de capacité (gauge)
- Liste des équipes avec statut
- Alertes surcharge

#### HoursChartWidget.tsx
**Données** :
- Heures par jour/semaine/mois
- Tendances
- Comparaison périodes

**Affichage** :
- Graphique ligne/barre
- Sélecteur de période
- Indicateurs de tendance

#### RecentActivityWidget.tsx
**Données** :
- Dernières actions (employés ajoutés, vacances approuvées, etc.)
- Timeline d'activité

**Affichage** :
- Timeline verticale
- Filtres par type d'activité
- Lien vers détails

#### ExpenseSummaryWidget.tsx
**Données** :
- Total dépenses (mois)
- Dépenses par catégorie
- Dépenses en attente d'approbation
- Budget vs réel

**Affichage** :
- Graphique en secteurs (catégories)
- Cards avec totaux
- Liste dépenses récentes

## 🔧 Implémentation technique

### 1. Store Zustand (lib/management/store.ts)

```typescript
interface ManagementWidgetConfig {
  id: string;
  widget_type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  config?: Record<string, unknown>;
}

interface ManagementDashboardConfig {
  id: string;
  name: string;
  layouts: ManagementWidgetConfig[];
  filters?: {
    period?: 'week' | 'month' | 'quarter' | 'year';
    team_id?: number;
  };
}

interface ManagementDashboardStore {
  configs: ManagementDashboardConfig[];
  activeConfig: string | null;
  isEditMode: boolean;
  addWidget: (widget: ManagementWidgetConfig) => void;
  removeWidget: (id: string) => void;
  updateWidget: (id: string, updates: Partial<ManagementWidgetConfig>) => void;
  setEditMode: (enabled: boolean) => void;
  saveConfig: () => Promise<void>;
  loadConfig: () => Promise<void>;
}
```

### 2. Types (lib/management/types.ts)

```typescript
export type ManagementWidgetType =
  | 'employees-stats'
  | 'time-tracking-summary'
  | 'vacation-overview'
  | 'expense-summary'
  | 'hours-chart'
  | 'team-capacity-chart'
  | 'vacation-calendar'
  | 'time-distribution'
  | 'pending-requests'
  | 'recent-employees'
  | 'upcoming-vacations'
  | 'recent-time-entries'
  | 'vacation-calendar-view'
  | 'team-availability';

export interface ManagementWidgetProps {
  widgetId: string;
  config?: Record<string, unknown>;
  onConfigChange?: (config: Record<string, unknown>) => void;
}
```

### 3. Hook useManagementWidgets.ts

```typescript
export function useManagementWidgets(widgetType: ManagementWidgetType) {
  // Fetch data based on widget type
  // Handle loading states
  // Cache data
  // Return formatted data for widget
}
```

## 📊 Intégration dans la page management

### Modification de page.tsx

1. **Remplacer le contenu statique** par le système de widgets
2. **Conserver le header** avec le gradient
3. **Ajouter la toolbar** de widgets
4. **Intégrer la grille** de widgets
5. **Ajouter la bibliothèque** de widgets (modal)

### Structure de la page

```tsx
<PageContainer>
  {/* Header existant */}
  <HeroHeader />
  
  {/* Toolbar widgets */}
  <ManagementWidgetToolbar />
  
  {/* Grid widgets */}
  <ManagementWidgetGrid />
  
  {/* Library modal */}
  <ManagementWidgetLibrary />
</PageContainer>
```

## 🎨 Design & UX

### Principes de design
- **Cohérence** : Utiliser le même style que le dashboard principal
- **Glass morphism** : Cards avec effet glass-card
- **Responsive** : Adaptation mobile/tablette/desktop
- **Accessibilité** : ARIA labels, navigation clavier
- **Performance** : Lazy loading, memoization

### États des widgets
- **Loading** : Skeleton loaders
- **Error** : Messages d'erreur avec retry
- **Empty** : États vides avec CTA
- **Success** : Affichage des données

## 📈 Données & API

### Endpoints nécessaires (si pas existants)

```
GET /v1/management/dashboard/stats
GET /v1/management/employees/stats
GET /v1/management/time-tracking/summary
GET /v1/management/vacations/calendar
GET /v1/management/expenses/summary
GET /v1/management/widgets/config
POST /v1/management/widgets/config
```

### Cache strategy
- Cache côté client (React Query)
- Cache côté serveur (5 minutes)
- Invalidation sur actions (création/modification)

## 🚀 Plan d'implémentation

### Phase 1 : Infrastructure (Semaine 1)
- [ ] Créer la structure de fichiers
- [ ] Implémenter le store Zustand
- [ ] Créer les types TypeScript
- [ ] Créer le hook useManagementWidgets
- [ ] Créer ManagementWidgetGrid (sans drag & drop)

### Phase 2 : Widgets de base (Semaine 2)
- [ ] EmployeesStatsWidget
- [ ] TimeTrackingWidget
- [ ] VacationCalendarWidget
- [ ] PendingRequestsWidget
- [ ] Intégrer dans la page management

### Phase 3 : Widgets avancés (Semaine 3)
- [ ] TeamCapacityWidget
- [ ] HoursChartWidget
- [ ] RecentActivityWidget
- [ ] ExpenseSummaryWidget

### Phase 4 : Fonctionnalités avancées (Semaine 4)
- [ ] Drag & drop (react-grid-layout)
- [ ] ManagementWidgetLibrary
- [ ] ManagementWidgetToolbar
- [ ] Sauvegarde configuration (localStorage + API)
- [ ] Mode édition

### Phase 5 : Polish & Optimisation (Semaine 5)
- [ ] Tests unitaires
- [ ] Optimisation performances
- [ ] Accessibilité
- [ ] Documentation
- [ ] Tests utilisateurs

## ✅ Critères de succès

1. **Fonctionnalité** : Tous les widgets affichent les bonnes données
2. **Performance** : Chargement < 2s, interactions fluides
3. **UX** : Interface intuitive, drag & drop fonctionnel
4. **Responsive** : Fonctionne sur mobile/tablette/desktop
5. **Accessibilité** : Score WCAG AA minimum
6. **Maintenabilité** : Code bien structuré, documenté

## 📝 Notes supplémentaires

- **Réutiliser** les composants UI existants (Card, StatsCard, etc.)
- **S'inspirer** du système de widgets du dashboard principal
- **Éviter** la duplication de code
- **Prioriser** les widgets les plus utilisés en premier
- **Considérer** les permissions utilisateur pour afficher/masquer widgets
