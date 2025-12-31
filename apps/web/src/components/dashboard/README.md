# Dashboard Personnalisable - Nukleo ERP

## 📋 Vue d'ensemble

Système de dashboard entièrement personnalisable avec widgets modulaires et système drag & drop pour Nukleo ERP.

## 🎯 Fonctionnalités

- **Drag & Drop** : Réorganisez les widgets par glisser-déposer
- **Redimensionnement** : Ajustez la taille des widgets par les coins
- **20+ Widgets** : Opportunités, Clients, Projets, Finances, Performance, Équipe
- **Configurations multiples** : Créez plusieurs dashboards pour différents contextes
- **Filtres globaux** : Filtrez tous les widgets simultanément
- **Persistance locale** : Configuration sauvegardée automatiquement
- **Responsive** : Fonctionne sur desktop, tablet, mobile

## 🏗️ Architecture

```
src/
├── app/[locale]/dashboard/personnalisable/
│   └── page.tsx                          # Page principale
├── components/dashboard/
│   ├── DashboardGrid.tsx                 # Grille drag & drop
│   ├── DashboardToolbar.tsx              # Barre d'outils
│   ├── WidgetContainer.tsx               # Conteneur de widget
│   ├── WidgetLibrary.tsx                 # Bibliothèque de widgets
│   └── widgets/
│       ├── OpportunitiesListWidget.tsx   # Widget opportunités
│       ├── ClientsCountWidget.tsx        # Widget compteur clients
│       ├── ProjectsActiveWidget.tsx      # Widget projets actifs
│       ├── RevenueChartWidget.tsx        # Widget graphique revenus
│       ├── KPICustomWidget.tsx           # Widget KPI personnalisé
│       └── index.ts                      # Export des widgets
├── lib/dashboard/
│   ├── types.ts                          # Types TypeScript
│   ├── store.ts                          # Store Zustand
│   └── widgetRegistry.ts                 # Registre des widgets
└── hooks/dashboard/
    └── useWidgetData.ts                  # Hook de données
```

## 🚀 Utilisation

### Accéder au dashboard

```
/dashboard/personnalisable
```

### Ajouter un widget

1. Cliquez sur "Personnaliser"
2. Cliquez sur "Ajouter un widget"
3. Sélectionnez un widget dans la bibliothèque
4. Le widget apparaît en bas de la grille

### Réorganiser les widgets

1. Activez le mode édition ("Personnaliser")
2. Glissez-déposez les widgets
3. Redimensionnez par les coins
4. Cliquez sur "Terminer" pour sauvegarder

### Configurer un widget

1. Cliquez sur l'icône ⚙️ dans le header du widget
2. Modifiez le titre, la période, les filtres
3. Les changements sont sauvegardés automatiquement

## 🧩 Créer un nouveau widget

### 1. Créer le composant

```tsx
// src/components/dashboard/widgets/MyWidget.tsx
'use client';

import React from 'react';
import { useWidgetData } from '@/hooks/dashboard/useWidgetData';
import type { WidgetProps } from '@/lib/dashboard/types';

export function MyWidget({ id, config, globalFilters }: WidgetProps) {
  const { data, isLoading, error } = useWidgetData({
    widgetType: 'my-widget',
    config,
    globalFilters,
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error</div>;

  return (
    <div className="h-full">
      {/* Votre contenu */}
    </div>
  );
}
```

### 2. Ajouter au registre

```tsx
// src/lib/dashboard/widgetRegistry.ts
import { MyWidget } from '@/components/dashboard/widgets/MyWidget';

export const widgetRegistry: Record<WidgetType, WidgetDefinition> = {
  // ... autres widgets
  'my-widget': {
    id: 'my-widget',
    name: 'Mon Widget',
    description: 'Description de mon widget',
    category: 'custom',
    icon: Star,
    component: MyWidget,
    default_size: { w: 4, h: 2 },
    min_size: { w: 2, h: 1 },
    max_size: { w: 12, h: 4 },
    configurable: true,
  },
};
```

### 3. Ajouter le type

```tsx
// src/lib/dashboard/types.ts
export type WidgetType =
  | 'opportunities-list'
  | 'clients-count'
  // ... autres types
  | 'my-widget';
```

### 4. Implémenter la récupération de données

```tsx
// src/hooks/dashboard/useWidgetData.ts
async function fetchWidgetData(widgetType, config, globalFilters) {
  switch (widgetType) {
    case 'my-widget':
      return await fetch('/api/my-widget-data').then(r => r.json());
    // ... autres cas
  }
}
```

## 📦 Dépendances

- `react-grid-layout` : Système de grille drag & drop
- `recharts` : Graphiques React
- `zustand` : State management
- `@tanstack/react-query` : Cache et récupération de données

## 🎨 Design

- **Minimaliste** : Beaucoup d'espace blanc
- **Moderne** : Animations fluides
- **Cohérent** : Utilise Tailwind CSS
- **Accessible** : Support dark mode

## 🔧 Configuration

### Store Zustand

Le store gère :
- Configurations multiples
- Widgets actifs
- Mode édition
- Filtres globaux
- Persistance locale

### Types de widgets disponibles

#### Commercial
- `opportunities-list` : Liste des opportunités
- `opportunities-pipeline` : Pipeline commercial
- `clients-count` : Compteur de clients
- `clients-growth` : Croissance clients
- `testimonials-carousel` : Témoignages

#### Projets
- `projects-active` : Projets actifs
- `projects-status` : Statuts des projets
- `tasks-kanban` : Tâches kanban
- `tasks-list` : Liste des tâches

#### Finances
- `revenue-chart` : Graphique revenus
- `expenses-chart` : Graphique dépenses
- `cash-flow` : Trésorerie

#### Performance
- `kpi-custom` : KPI personnalisé
- `goals-progress` : Progression objectifs
- `growth-chart` : Croissance globale

#### Équipe
- `employees-count` : Nombre d'employés
- `workload-chart` : Charge de travail

#### Système
- `user-profile` : Profil utilisateur
- `notifications` : Notifications

## 🐛 Débogage

### Les widgets ne s'affichent pas

1. Vérifiez que le composant est bien importé dans `widgetRegistry.ts`
2. Vérifiez que le type est ajouté dans `types.ts`
3. Vérifiez la console pour les erreurs

### Le drag & drop ne fonctionne pas

1. Vérifiez que le mode édition est activé
2. Vérifiez que `react-grid-layout` est bien installé
3. Vérifiez les styles CSS

### Les données ne se chargent pas

1. Vérifiez l'implémentation dans `useWidgetData.ts`
2. Vérifiez les appels API
3. Vérifiez React Query DevTools

## 📝 TODO

- [ ] Implémenter les 15 widgets restants
- [ ] Ajouter les appels API réels
- [ ] Implémenter les filtres globaux
- [ ] Ajouter les layouts prédéfinis
- [ ] Ajouter l'export/import de configurations
- [ ] Ajouter les tests unitaires
- [ ] Ajouter la documentation utilisateur

## 🤝 Contribution

Pour ajouter un nouveau widget :
1. Créez le composant dans `widgets/`
2. Ajoutez-le au registre
3. Implémentez la récupération de données
4. Testez en local
5. Créez une Pull Request

## 📄 Licence

Propriétaire - Nukleo ERP
