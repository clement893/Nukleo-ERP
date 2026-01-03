# Plan d'Implémentation des Widgets Manquants

## Statut Global
- **Widgets à créer:** ~40 widgets
- **Widgets créés:** 0/40
- **Page Admin créée:** ✅

## Structure des Widgets

Chaque widget suit cette structure:
1. Créer le composant dans `apps/web/src/components/dashboard/widgets/`
2. Ajouter le type dans `apps/web/src/lib/dashboard/types.ts` (WidgetType)
3. Ajouter au registre dans `apps/web/src/lib/dashboard/widgetRegistry.ts`
4. Ajouter aux collections dans `apps/web/src/lib/dashboard/widgetCollections.ts`
5. Exporter dans `apps/web/src/components/dashboard/widgets/index.ts`

## Modules et Widgets

### 📊 COMMERCIAL (10 widgets à créer)

#### Priorité HAUTE
- [ ] `revenue-commercial-chart` - Évolution CA/Revenus
- [ ] `conversion-funnel-chart` - Entonnoir de conversion
- [ ] `quotes-status-pie` - Répartition devis par statut

#### Priorité MOYENNE
- [ ] `opportunities-timeline` - Timeline des opportunités
- [ ] `opportunities-by-source` - Répartition par source
- [ ] `clients-by-type` - Répartition clients par type
- [ ] `win-rate-trend` - Taux de réussite dans le temps
- [ ] `revenue-forecast` - Prévisions de revenus
- [ ] `average-deal-size` - Taille moyenne des deals
- [ ] `sales-velocity` - Vélocité de vente

### 📁 PROJETS (10 widgets à créer)

#### Priorité HAUTE
- [ ] `budget-vs-actual` - Budget vs Dépensé
- [ ] `projects-timeline` - Timeline des projets
- [ ] `tasks-completion-trend` - Tendance complétion tâches

#### Priorité MOYENNE
- [ ] `projects-progress-chart` - Progression des projets
- [ ] `projects-by-status-bar` - Projets par statut (BarChart)
- [ ] `workload-by-project` - Charge par projet
- [ ] `tasks-by-priority` - Tâches par priorité
- [ ] `project-health-score` - Score de santé
- [ ] `resource-allocation` - Allocation ressources
- [ ] `milestones-timeline` - Timeline des jalons

### 💰 FINANCES (10 widgets à créer)

#### Priorité HAUTE
- [ ] `revenue-vs-expenses` - Revenus vs Dépenses
- [ ] `expenses-by-category` - Dépenses par catégorie
- [ ] `cash-flow-forecast` - Prévision trésorerie

#### Priorité MOYENNE
- [ ] `profit-margin-chart` - Évolution des marges
- [ ] `revenue-by-source` - Revenus par source
- [ ] `invoices-status` - État des factures
- [ ] `financial-forecast` - Prévisions financières
- [ ] `aging-receivables` - Analyse créances
- [ ] `break-even-analysis` - Seuil de rentabilité
- [ ] `financial-ratios` - Ratios financiers

### 👥 ÉQUIPE (10 widgets à créer)

#### Priorité HAUTE
- [ ] `team-growth-timeline` - Évolution effectif
- [ ] `employees-by-department` - Répartition par département

#### Priorité MOYENNE
- [ ] `productivity-trend` - Tendance productivité
- [ ] `employees-by-role` - Répartition par rôle
- [ ] `skills-matrix` - Matrice compétences
- [ ] `workload-balance` - Équilibre charge
- [ ] `attendance-tracking` - Suivi présence
- [ ] `performance-reviews` - Aperçu évaluations
- [ ] `training-completion` - Complétion formations
- [ ] `employee-satisfaction` - Satisfaction employés

### 🎯 GLOBAL (2 widgets à créer)
- [ ] `dashboard-scorecard` - Tableau de bord complet
- [ ] `trend-analysis` - Analyse de tendances

## Notes Techniques

- Utiliser `useWidgetData` hook pour les données
- Utiliser Recharts pour les graphiques
- Suivre le pattern des widgets existants
- Utiliser EmptyState pour les états vides
- Utiliser SkeletonWidget pour les chargements

## Prochaines Étapes

1. Créer les widgets de priorité HAUTE par module
2. Tester chaque widget
3. Ajouter au registre et collections
4. Continuer avec priorité MOYENNE
5. Finaliser avec GLOBAL
