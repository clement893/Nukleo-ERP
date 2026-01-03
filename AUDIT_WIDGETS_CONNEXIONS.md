# Audit des Widgets - Connexions aux API

## Date de l'audit
2024-12-19

## Résumé Exécutif

Cet audit examine tous les widgets du dashboard et vérifie leurs connexions aux API backend. L'objectif est d'identifier:
1. Les widgets connectés avec des endpoints API fonctionnels
2. Les widgets utilisant uniquement des données fallback (non connectés)
3. Les widgets sans implémentation de connexion API
4. Les problèmes de connexion potentiels

---

## Architecture Générale

### Hook de données: `useWidgetData`

**Fichier:** `apps/web/src/hooks/dashboard/useWidgetData.ts`

Tous les widgets utilisent le hook `useWidgetData` qui:
- Utilise `@tanstack/react-query` pour la gestion du cache et des requêtes
- Appelle `fetchWidgetData()` qui route vers des fonctions API spécifiques
- Retourne des données fallback en cas d'erreur
- Gère le cache avec un `staleTime` de 5 minutes par défaut

### Registre des Widgets

**Fichier:** `apps/web/src/lib/dashboard/widgetRegistry.ts`

Le registre définit 27 widgets au total, répartis en 6 catégories:
- **Commercial** (9 widgets)
- **Projects** (4 widgets)
- **Finances** (3 widgets)
- **Performance** (3 widgets)
- **Team** (2 widgets)
- **System** (2 widgets)
- **Custom** (1 widget)

---

## Widgets par Catégorie

### 🟢 COMMERCIAL (9 widgets)

#### 1. `opportunities-list` ✅ CONNECTÉ
- **Composant:** `OpportunitiesListWidget`
- **API:** `fetchDashboardOpportunities()` → `/v1/commercial/opportunities`
- **Endpoint Backend:** `/v1/commercial/opportunities?limit=5&offset=0`
- **Status:** ✅ Fonctionnel
- **Fallback:** Oui (tableau vide)
- **Modules:** `['commercial']`

#### 2. `opportunities-pipeline` ❌ NON CONNECTÉ
- **Composant:** `OpportunitiesPipelineWidget`
- **API:** ❌ Pas d'implémentation dans `useWidgetData`
- **Status:** ❌ Utilise données fallback uniquement
- **Fallback:** Oui (`{ message: 'Widget data not implemented yet' }`)
- **Modules:** `['commercial']`
- **⚠️ ACTION REQUISE:** Implémenter la connexion API

#### 3. `opportunities-needing-action` ❌ NON CONNECTÉ
- **Composant:** `OpportunitiesNeedingActionWidget`
- **API:** ❌ Pas d'implémentation dans `useWidgetData`
- **Status:** ❌ Utilise données fallback uniquement
- **Fallback:** Oui
- **Modules:** `['commercial']`
- **⚠️ ACTION REQUISE:** Implémenter la connexion API

#### 4. `clients-count` ✅ CONNECTÉ
- **Composant:** `ClientsCountWidget`
- **API:** `fetchClientsStats()` → `/v1/projects/clients`
- **Endpoint Backend:** `/v1/projects/clients?limit=10000`
- **Status:** ✅ Fonctionnel (utilise endpoint clients)
- **Fallback:** Oui (count: 0, growth: 0)
- **Modules:** `['commercial']`

#### 5. `clients-growth` ❌ NON CONNECTÉ
- **Composant:** `ClientsGrowthWidget`
- **API:** ❌ Pas d'implémentation dans `useWidgetData`
- **Status:** ❌ Utilise données fallback uniquement
- **Fallback:** Oui
- **Modules:** `['commercial']`
- **⚠️ ACTION REQUISE:** Implémenter la connexion API

#### 6. `testimonials-carousel` ❌ NON CONNECTÉ
- **Composant:** `TestimonialsCarouselWidget`
- **API:** ❌ Pas d'implémentation dans `useWidgetData`
- **Status:** ❌ Utilise données fallback uniquement
- **Fallback:** Oui
- **Modules:** `['commercial']`
- **⚠️ ACTION REQUISE:** Implémenter la connexion API (endpoint `/v1/commercial/testimonials` existe)

#### 7. `quotes-list` ❌ NON CONNECTÉ
- **Composant:** `QuotesWidget`
- **API:** ❌ Pas d'implémentation dans `useWidgetData`
- **Status:** ❌ Utilise données fallback uniquement
- **Fallback:** Oui
- **Modules:** `['commercial']`
- **⚠️ ACTION REQUISE:** Implémenter la connexion API (endpoint `/v1/commercial/quotes` existe)

#### 8. `submissions-list` ❌ NON CONNECTÉ
- **Composant:** `SubmissionsWidget`
- **API:** ❌ Pas d'implémentation dans `useWidgetData`
- **Status:** ❌ Utilise données fallback uniquement
- **Fallback:** Oui
- **Modules:** `['commercial']`
- **⚠️ ACTION REQUISE:** Implémenter la connexion API (endpoint `/v1/commercial/submissions` existe)

#### 9. `commercial-stats` ❌ NON CONNECTÉ
- **Composant:** `CommercialStatsWidget`
- **API:** ❌ Pas d'implémentation dans `useWidgetData`
- **Status:** ❌ Utilise données fallback uniquement
- **Fallback:** Oui
- **Modules:** `['commercial']`
- **⚠️ ACTION REQUISE:** Implémenter la connexion API

---

### 🟢 PROJECTS (4 widgets)

#### 10. `projects-active` ✅ CONNECTÉ
- **Composant:** `ProjectsActiveWidget`
- **API:** `fetchDashboardProjects()` → `/v1/projects`
- **Endpoint Backend:** `/v1/projects?limit=5&offset=0&status=ACTIVE`
- **Status:** ✅ Fonctionnel
- **Fallback:** Oui (tableau vide)
- **Modules:** `['projects']`

#### 11. `projects-status` ❌ NON CONNECTÉ
- **Composant:** `ProjectsStatusWidget`
- **API:** ❌ Pas d'implémentation dans `useWidgetData`
- **Status:** ❌ Utilise données fallback uniquement
- **Fallback:** Oui
- **Modules:** `['projects']`
- **⚠️ ACTION REQUISE:** Implémenter la connexion API

#### 12. `tasks-kanban` ❌ NON CONNECTÉ
- **Composant:** `TasksKanbanWidget`
- **API:** ❌ Pas d'implémentation dans `useWidgetData`
- **Status:** ❌ Utilise données fallback uniquement
- **Fallback:** Oui
- **Modules:** `['projects']`
- **⚠️ ACTION REQUISE:** Implémenter la connexion API (endpoint `/v1/project-tasks` existe)

#### 13. `tasks-list` ✅ CONNECTÉ (API directe)
- **Composant:** `TasksListWidget`
- **API:** `projectTasksAPI.list()` → `/v1/project-tasks` (appel direct, PAS via `useWidgetData`)
- **Endpoint Backend:** `/v1/project-tasks`
- **Status:** ✅ Fonctionnel (utilise `useEffect` + API directe)
- **Note:** ⚠️ N'utilise PAS `useWidgetData`, appelle API directement
- **Modules:** `['projects']`

---

### 🟢 FINANCES (3 widgets)

#### 14. `revenue-chart` ✅ CONNECTÉ
- **Composant:** `RevenueChartWidget`
- **API:** `fetchDashboardRevenue()` → `/v1/finances/revenue/stats`
- **Endpoint Backend:** `/v1/finances/revenue/stats?period=month&months=6`
- **Status:** ✅ Fonctionnel
- **Fallback:** Oui (tableau vide, total: 0)
- **Modules:** `['finances', 'commercial']`

#### 15. `expenses-chart` ✅ CONNECTÉ (API directe)
- **Composant:** `ExpensesChartWidget`
- **API:** `expenseAccountsAPI.list()` → `/v1/finances/compte-depenses` (appel direct, PAS via `useWidgetData`)
- **Endpoint Backend:** `/v1/finances/compte-depenses`
- **Status:** ✅ Fonctionnel (utilise `useEffect` + API directe)
- **Note:** ⚠️ N'utilise PAS `useWidgetData`, appelle API directement
- **Modules:** `['finances']`

#### 16. `cash-flow` ❌ NON CONNECTÉ
- **Composant:** `CashFlowWidget`
- **API:** ❌ Pas d'implémentation dans `useWidgetData`
- **Status:** ❌ Utilise données fallback uniquement
- **Fallback:** Oui
- **Modules:** `['finances']`
- **⚠️ ACTION REQUISE:** Implémenter la connexion API (endpoint `/v1/finances/tresorerie` existe)

---

### 🟡 PERFORMANCE (3 widgets)

#### 17. `kpi-custom` ⚠️ STATIQUE
- **Composant:** `KPICustomWidget`
- **API:** ❌ Pas d'appel API (données configurées localement)
- **Status:** ⚠️ Widget statique/configuré par l'utilisateur
- **Fallback:** Oui (value: 0)
- **Modules:** `['global']`
- **Note:** Widget configurable, pas besoin d'API

#### 18. `goals-progress` ❌ NON CONNECTÉ
- **Composant:** `GoalsProgressWidget`
- **API:** ❌ Pas d'implémentation dans `useWidgetData`
- **Status:** ❌ Utilise données fallback uniquement
- **Fallback:** Oui
- **Modules:** `['global']`
- **⚠️ ACTION REQUISE:** Implémenter la connexion API

#### 19. `growth-chart` ❌ NON CONNECTÉ
- **Composant:** `GrowthChartWidget`
- **API:** ❌ Pas d'implémentation dans `useWidgetData`
- **Status:** ❌ Utilise données fallback uniquement
- **Fallback:** Oui
- **Modules:** `['global']`
- **⚠️ ACTION REQUISE:** Implémenter la connexion API

---

### 🟡 TEAM (2 widgets)

#### 20. `employees-count` ❌ NON CONNECTÉ
- **Composant:** `EmployeesCountWidget`
- **API:** ❌ Pas d'implémentation dans `useWidgetData`
- **Status:** ❌ Utilise données fallback uniquement
- **Fallback:** Oui
- **Modules:** `['team']`
- **⚠️ ACTION REQUISE:** Implémenter la connexion API (endpoint `/v1/employees` existe)

#### 21. `workload-chart` ❌ NON CONNECTÉ
- **Composant:** `WorkloadChartWidget`
- **API:** ❌ Pas d'implémentation dans `useWidgetData`
- **Status:** ❌ Utilise données fallback uniquement
- **Fallback:** Oui
- **Modules:** `['team']`
- **⚠️ ACTION REQUISE:** Implémenter la connexion API

---

### 🔵 SYSTEM (2 widgets)

#### 22. `user-profile` ⚠️ STATIQUE
- **Composant:** `UserProfileWidget`
- **API:** ❌ Pas d'implémentation dans `useWidgetData` (probablement utilise `useAuth`)
- **Status:** ⚠️ Probablement utilise `useAuth` hook directement
- **Fallback:** Non applicable
- **Modules:** `['system']`
- **Note:** Vérifier si utilise `useAuth` directement

#### 23. `notifications` ✅ CONNECTÉ (API directe)
- **Composant:** `NotificationsWidget`
- **API:** `notificationsAPI.getNotifications()` + `notificationsAPI.getUnreadCount()` → `/v1/notifications` (appel direct, PAS via `useWidgetData`)
- **Endpoint Backend:** `/v1/notifications`
- **Status:** ✅ Fonctionnel (utilise `useEffect` + API directe avec refresh toutes les 30s)
- **Note:** ⚠️ N'utilise PAS `useWidgetData`, appelle API directement
- **Modules:** `['system']`

#### 24. `custom` ⚠️ CUSTOM
- **Composant:** `CustomWidget`
- **API:** Variable selon configuration
- **Status:** ⚠️ Widget personnalisé utilisateur
- **Modules:** `['global']`
- **Note:** Géré par endpoint `/v1/custom-widgets`

---

## Résumé des Connexions

### ✅ Widgets Connectés (7)
1. `opportunities-list` ✅ (via `useWidgetData`)
2. `clients-count` ✅ (via `useWidgetData`)
3. `projects-active` ✅ (via `useWidgetData`)
4. `revenue-chart` ✅ (via `useWidgetData`)
5. `tasks-list` ✅ (API directe, PAS via `useWidgetData`)
6. `expenses-chart` ✅ (API directe, PAS via `useWidgetData`)
7. `notifications` ✅ (API directe, PAS via `useWidgetData`)

### ❌ Widgets NON Connectés (16)
1. `opportunities-pipeline` ❌
2. `opportunities-needing-action` ❌
3. `clients-growth` ❌
4. `testimonials-carousel` ❌
5. `quotes-list` ❌
6. `submissions-list` ❌
7. `commercial-stats` ❌
8. `projects-status` ❌
9. `tasks-kanban` ❌
10. `tasks-list` ✅ (déplacé vers connecté)
11. `expenses-chart` ✅ (déplacé vers connecté)
12. `cash-flow` ❌
13. `goals-progress` ❌
14. `growth-chart` ❌
15. `employees-count` ❌
16. `workload-chart` ❌
17. `notifications` ✅ (déplacé vers connecté)
18. `custom` ⚠️ (géré séparément)

### ⚠️ Widgets Statiques/Spéciaux (3)
1. `kpi-custom` ⚠️ (pas besoin d'API)
2. `user-profile` ⚠️ (probablement utilise `useAuth`)
3. `custom` ⚠️ (géré par endpoint custom-widgets)

---

## Fonctions API Disponibles

### Fichiers API Dashboard
- ✅ `dashboard-opportunities.ts` - Utilisé
- ✅ `dashboard-clients.ts` - Utilisé
- ✅ `dashboard-projects.ts` - Utilisé
- ✅ `dashboard-revenue.ts` - Utilisé

### Endpoints Backend Disponibles (non utilisés par widgets)
- `/v1/commercial/quotes` - Disponible mais non utilisé
- `/v1/commercial/submissions` - Disponible mais non utilisé
- `/v1/commercial/testimonials` - Disponible mais non utilisé
- `/v1/project-tasks` - Disponible mais non utilisé
- `/v1/finances/tresorerie` - Disponible mais non utilisé
- `/v1/employees` - Disponible mais non utilisé
- `/v1/notifications` - Disponible mais non utilisé

---

## Problèmes Identifiés

### 🔴 Critique
1. **71% des widgets (17/24) ne sont pas connectés aux API**
2. **Données fallback seulement:** La majorité des widgets affichent des données vides ou factices
3. **Expérience utilisateur dégradée:** Les widgets n'affichent pas de vraies données

### 🟡 Moyen
1. **Incohérence d'architecture:** 
   - 4 widgets utilisent `useWidgetData` (architecture standard)
   - 3 widgets appellent API directement via `useEffect` (`tasks-list`, `expenses-chart`, `notifications`)
   - ⚠️ **Recommandation:** Unifier l'architecture - tous les widgets devraient utiliser `useWidgetData`
2. **Incohérence:** Certains widgets du même module sont connectés, d'autres non
3. **Endpoints disponibles non utilisés:** Plusieurs endpoints backend existent mais ne sont pas utilisés par les widgets

### 🟢 Mineur
1. **Documentation manquante:** Pas de documentation claire sur quels widgets sont connectés
2. **Tests manquants:** Pas de tests pour vérifier les connexions API

### Notes sur l'Architecture
- **Pattern standard:** Utiliser `useWidgetData` hook qui gère cache, erreurs, et fallback
- **Pattern alternatif observé:** Appels API directs via `useEffect` (3 widgets)
- **Recommandation:** Migrer les 3 widgets avec appels directs vers `useWidgetData` pour uniformiser l'architecture

---

## Recommandations

### Priorité Haute 🔴
1. **Implémenter les connexions API pour les widgets commerciaux prioritaires:**
   - `quotes-list` → `/v1/commercial/quotes`
   - `submissions-list` → `/v1/commercial/submissions`
   - `testimonials-carousel` → `/v1/commercial/testimonials`
   - `opportunities-pipeline` → `/v1/commercial/opportunities` (avec filtres pipeline)

2. **Implémenter les connexions API pour les widgets projets:**
   - `tasks-list` → `/v1/project-tasks`
   - `tasks-kanban` → `/v1/project-tasks` (avec groupement par statut)
   - `projects-status` → `/v1/projects` (avec agrégation par statut)

3. **Implémenter les connexions API pour les widgets finances:**
   - `cash-flow` → `/v1/finances/tresorerie`
   - `expenses-chart` → `/v1/finances/compte-depenses` (à vérifier)

### Priorité Moyenne 🟡
4. **Implémenter les connexions API pour les widgets team:**
   - `employees-count` → `/v1/employees` (avec comptage)
   - `workload-chart` → Endpoint à créer (charge de travail par employé)

5. **Vérifier et documenter les widgets système:**
   - `notifications` → Vérifier si utilise `useNotifications` hook
   - `user-profile` → Vérifier si utilise `useAuth` hook

### Priorité Basse 🟢
6. **Documentation:**
   - Ajouter des commentaires dans `useWidgetData.ts` pour chaque widget
   - Créer une documentation des endpoints utilisés

7. **Tests:**
   - Ajouter des tests unitaires pour chaque fonction API
   - Ajouter des tests d'intégration pour les widgets connectés

---

## Plan d'Action Suggéré

### Phase 1: Commercial (Priorité 1)
- [ ] `quotes-list`
- [ ] `submissions-list`
- [ ] `testimonials-carousel`
- [ ] `opportunities-pipeline`
- [ ] `opportunities-needing-action`

### Phase 2: Projects (Priorité 2)
- [ ] `tasks-list`
- [ ] `tasks-kanban`
- [ ] `projects-status`

### Phase 3: Finances (Priorité 3)
- [ ] `cash-flow`
- [ ] `expenses-chart`

### Phase 4: Team & Performance (Priorité 4)
- [ ] `employees-count`
- [ ] `workload-chart`
- [ ] `goals-progress`
- [ ] `growth-chart`

### Phase 5: Documentation & Tests (Priorité 5)
- [ ] Documentation des connexions
- [ ] Tests unitaires
- [ ] Tests d'intégration

---

## Notes Techniques

### Structure des Fonctions API
Les fonctions API dashboard suivent ce pattern:
```typescript
export async function fetchDashboardX(params?: {...}): Promise<XResponse> {
  // Appel API avec apiClient
  // Extraction avec extractApiData
  // Gestion d'erreur avec fallback
}
```

### Gestion des Erreurs
Tous les widgets utilisent des données fallback en cas d'erreur API:
- Tableaux vides pour les listes
- Valeurs à zéro pour les compteurs
- Messages d'erreur logués mais non affichés à l'utilisateur

### Cache
- Cache React Query avec `staleTime` de 5 minutes
- `refetchInterval` configurable par widget
- Invalidation manuelle possible avec `useWidgetRefresh`

---

## Conclusion

**Statut Global:** 🟡 **MOYEN**

**7 widgets sur 24 (29%)** sont connectés aux API backend, mais il y a une **incohérence d'architecture**: 4 widgets utilisent `useWidgetData` (architecture standard) tandis que 3 widgets (`tasks-list`, `expenses-chart`, `notifications`) appellent les API directement via `useEffect`. Cette incohérence devrait être corrigée pour maintenir une architecture uniforme.

La majorité des widgets (17/24 = 71%) affichent encore des données fallback vides, ce qui impacte l'expérience utilisateur du dashboard.

**Actions immédiates recommandées:**
1. Connecter les widgets commerciaux prioritaires (quotes, submissions, testimonials)
2. Connecter les widgets projets (tasks)
3. Connecter les widgets finances (cash-flow)
