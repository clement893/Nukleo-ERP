# Plan d'Amélioration - Leo Context Service

## 🎯 Objectif
Rendre Leo vraiment "sharp" en lui donnant accès à TOUTES les données pertinentes de l'ERP avec une structure claire et organisée.

## 📊 État Actuel

### ✅ Données Actuellement Supportées
- ✅ Contacts
- ✅ Entreprises (Companies)
- ✅ Opportunités
- ✅ Projets
- ✅ Employés
- ✅ Pipelines

### ❌ Données Manquantes (Critiques)
- ❌ **Tâches** (ProjectTask) - "quelles sont nos tâches en cours?"
- ❌ **Demandes de vacances** (VacationRequest) - "quelles sont les demandes de vacances en attente?"
- ❌ **Comptes de dépenses** (ExpenseAccount) - "quels sont les comptes de dépenses approuvés?"
- ❌ **Feuilles de temps** (TimeEntry)
- ❌ **Devis** (Quote)
- ❌ **Factures** (Invoice)
- ❌ **Transactions** (Transaction)
- ❌ **Événements calendrier** (CalendarEvent)

## 🏗️ Structure Proposée

### Phase 1: Architecture Modulaire (FONDATION)

#### 1.1 Organisation par Modules
```
leo_context_service.py
├── Module: COMMERCIAL
│   ├── Contacts
│   ├── Entreprises
│   ├── Opportunités
│   ├── Pipelines
│   └── Devis
│
├── Module: PROJETS
│   ├── Projets
│   ├── Tâches (ProjectTask) ⚠️ MANQUANT
│   ├── Feuilles de temps (TimeEntry) ⚠️ MANQUANT
│   └── Budgets
│
├── Module: RESSOURCES HUMAINES
│   ├── Employés
│   ├── Demandes de vacances (VacationRequest) ⚠️ MANQUANT
│   └── Équipes
│
├── Module: FINANCES
│   ├── Factures (Invoice) ⚠️ MANQUANT
│   ├── Transactions (Transaction) ⚠️ MANQUANT
│   ├── Comptes de dépenses (ExpenseAccount) ⚠️ MANQUANT
│   └── Comptes bancaires
│
└── Module: ORGANISATION
    ├── Événements calendrier (CalendarEvent) ⚠️ MANQUANT
    └── Fichiers
```

#### 1.2 Structure de Code Proposée
```python
class LeoContextService:
    # Méthodes par module
    async def get_commercial_data(...)
    async def get_project_data(...)
    async def get_hr_data(...)
    async def get_finance_data(...)
    async def get_organization_data(...)
    
    # Méthodes spécifiques
    async def get_relevant_tasks(...)  # NOUVEAU
    async def get_relevant_vacation_requests(...)  # NOUVEAU
    async def get_relevant_expense_accounts(...)  # NOUVEAU
    async def get_relevant_time_entries(...)  # NOUVEAU
    async def get_relevant_invoices(...)  # NOUVEAU
    async def get_relevant_transactions(...)  # NOUVEAU
    async def get_relevant_calendar_events(...)  # NOUVEAU
```

### Phase 2: Détection Intelligente (ANALYSE)

#### 2.1 Mots-clés Élargis
```python
task_keywords = [
    "tâche", "task", "tache", "taches", "tâches",
    "en cours", "à faire", "todo", "doing", "done",
    "assigné", "assignee", "assignation"
]

vacation_keywords = [
    "vacance", "vacances", "congé", "congés", "holiday", "holidays",
    "demande", "demandes", "request", "requests",
    "en attente", "pending", "approuvé", "approved", "refusé", "rejected"
]

expense_keywords = [
    "dépense", "dépenses", "expense", "expenses",
    "compte de dépense", "expense account",
    "approuvé", "approved", "en attente", "pending",
    "remboursement", "reimbursement"
]
```

#### 2.2 Détection de Statuts
- Détection automatique des statuts dans les requêtes
- Exemples: "en cours", "en attente", "approuvé", "terminé"
- Filtrage intelligent basé sur le contexte

### Phase 3: Format de Contexte Optimisé (PRÉSENTATION)

#### 3.1 Structure Hiérarchique
```
=== MODULE: PROJETS ===
├── Projets (12)
│   ├── Projet A [EN COURS]
│   └── Projet B [TERMINÉ]
│
└── Tâches (45)
    ├── Tâche 1 [EN COURS] - Assignée à: Jean
    ├── Tâche 2 [À FAIRE] - Projet: Projet A
    └── Tâche 3 [TERMINÉE]

=== MODULE: RESSOURCES HUMAINES ===
└── Demandes de vacances (8)
    ├── Jean Dupont [EN ATTENTE] - 15-20 Janvier
    ├── Marie Martin [APPROUVÉE] - 1-5 Février
    └── ...

=== MODULE: FINANCES ===
└── Comptes de dépenses (23)
    ├── Dépense A [APPROUVÉE] - 150€
    ├── Dépense B [EN ATTENTE] - 75€
    └── ...
```

#### 3.2 Format Simplifié pour Comptage
```
RÉSUMÉ: 
PROJETS: 12 | TÂCHES EN COURS: 15 | VACANCES EN ATTENTE: 3 | DÉPENSES APPROUVÉES: 8
```

### Phase 4: Implémentation Progressive

#### Étape 1: Tâches (ProjectTask) - PRIORITÉ HAUTE
- ✅ Ajouter détection "tâche", "task", "en cours"
- ✅ Implémenter `get_relevant_tasks()`
- ✅ Filtrer par statut (TODO, IN_PROGRESS, DONE)
- ✅ Filtrer par projet si mentionné
- ✅ Filtrer par assigné si mentionné

#### Étape 2: Demandes de Vacances (VacationRequest) - PRIORITÉ HAUTE
- ✅ Ajouter détection "vacance", "congé", "demande"
- ✅ Implémenter `get_relevant_vacation_requests()`
- ✅ Filtrer par statut (PENDING, APPROVED, REJECTED)
- ✅ Filtrer par employé si mentionné

#### Étape 3: Comptes de Dépenses (ExpenseAccount) - PRIORITÉ HAUTE
- ✅ Ajouter détection "dépense", "expense", "compte"
- ✅ Implémenter `get_relevant_expense_accounts()`
- ✅ Filtrer par statut (PENDING, APPROVED, REJECTED)
- ✅ Filtrer par montant si mentionné

#### Étape 4: Autres Modules (PRIORITÉ MOYENNE)
- Feuilles de temps (TimeEntry)
- Factures (Invoice)
- Transactions (Transaction)
- Événements calendrier (CalendarEvent)

## 🔧 Améliorations Techniques

### 1. Système de Cache Intelligent
- Cache des requêtes fréquentes (5 minutes)
- Invalidation automatique lors de modifications
- Cache par tenant

### 2. Pagination et Limites
- Limites adaptatives selon le type de requête
- Pour comptage: limite élevée (500+)
- Pour détails: limite modérée (20-50)

### 3. Logging et Debug
- Logs détaillés pour chaque requête
- Traçabilité des données récupérées
- Métriques de performance

### 4. Gestion d'Erreurs Robuste
- Fallback gracieux si un module échoue
- Messages d'erreur clairs
- Continuité de service même en cas d'erreur partielle

## 📝 Checklist d'Implémentation

### Tâches (ProjectTask)
- [ ] Ajouter lazy import `_get_project_task_model()`
- [ ] Ajouter mots-clés dans `analyze_query()`
- [ ] Implémenter `get_relevant_tasks()`
- [ ] Ajouter dans `get_relevant_data()`
- [ ] Ajouter dans `build_context_string()`
- [ ] Tester avec "quelles sont nos tâches en cours?"

### Demandes de Vacances (VacationRequest)
- [ ] Ajouter lazy import `_get_vacation_request_model()`
- [ ] Ajouter mots-clés dans `analyze_query()`
- [ ] Implémenter `get_relevant_vacation_requests()`
- [ ] Ajouter dans `get_relevant_data()`
- [ ] Ajouter dans `build_context_string()`
- [ ] Tester avec "quelles sont les demandes de vacances en attente?"

### Comptes de Dépenses (ExpenseAccount)
- [ ] Ajouter lazy import `_get_expense_account_model()`
- [ ] Ajouter mots-clés dans `analyze_query()`
- [ ] Implémenter `get_relevant_expense_accounts()`
- [ ] Ajouter dans `get_relevant_data()`
- [ ] Ajouter dans `build_context_string()`
- [ ] Tester avec "quels sont les comptes de dépenses approuvés?"

## 🎨 Amélioration UX

### Format de Réponse Optimisé
- Groupement par module
- Statuts visuellement distincts
- Compteurs clairs
- Liens directs vers les pages

### Exemple de Contexte Généré
```
=== PROJETS ===
Projets: 12 | Tâches: 45 (15 en cours, 20 à faire, 10 terminées)

Tâches en cours (15):
- [EN COURS] Créer dashboard - Projet: Site Web - Assigné: Jean
- [EN COURS] Développer API - Projet: Application Mobile - Assigné: Marie
...

=== RESSOURCES HUMAINES ===
Demandes de vacances: 8 (3 en attente, 4 approuvées, 1 refusée)

En attente (3):
- Jean Dupont: 15-20 Janvier 2024
- Marie Martin: 1-5 Février 2024
...

=== FINANCES ===
Comptes de dépenses: 23 (8 approuvés, 12 en attente, 3 refusés)

Approuvés (8):
- Repas client: 150€ - Jean Dupont
- Transport: 75€ - Marie Martin
...
```

## 🚀 Plan d'Exécution

### Sprint 1 (Immédiat)
1. Implémenter Tâches (ProjectTask)
2. Implémenter Demandes de Vacances (VacationRequest)
3. Implémenter Comptes de Dépenses (ExpenseAccount)

### Sprint 2 (Court terme)
4. Implémenter Feuilles de temps (TimeEntry)
5. Implémenter Factures (Invoice)
6. Améliorer format de contexte

### Sprint 3 (Moyen terme)
7. Implémenter Transactions (Transaction)
8. Implémenter Événements calendrier (CalendarEvent)
9. Optimisations et cache

## 📊 Métriques de Succès

- ✅ Leo trouve 100% des données demandées
- ✅ Réponses précises et complètes
- ✅ Temps de réponse < 2 secondes
- ✅ 0 erreur "je n'ai rien trouvé" pour données existantes
- ✅ Liens cliquables fonctionnels
- ✅ Format de réponse clair et organisé
