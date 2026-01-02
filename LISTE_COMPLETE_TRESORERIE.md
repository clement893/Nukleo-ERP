# Liste Complète - Module Trésorerie / Cashflow

**Date de génération:** 2025-01-15  
**Statut:** Module complet et fonctionnel

---

## 📋 Table des Matières

1. [Pages Frontend](#pages-frontend)
2. [API Backend](#api-backend)
3. [Modèles de Base de Données](#modèles-de-base-de-données)
4. [Schémas Pydantic](#schémas-pydantic)
5. [Client API Frontend](#client-api-frontend)
6. [Composants UI](#composants-ui)
7. [Migrations Base de Données](#migrations-base-de-données)
8. [Documentation](#documentation)
9. [Navigation & Routes](#navigation--routes)
10. [Fonctionnalités](#fonctionnalités)

---

## 📄 Pages Frontend

### 1. Page Principale de Trésorerie
**Fichier:** `apps/web/src/app/[locale]/dashboard/finances/tresorerie/page.tsx`  
**URL:** `/dashboard/finances/tresorerie`  
**Description:** Page principale de gestion de la trésorerie avec visualisation du cashflow hebdomadaire, statistiques, transactions et alertes.

**Fonctionnalités:**
- Affichage du cashflow hebdomadaire (graphique)
- Statistiques de trésorerie (solde actuel, entrées, sorties)
- Liste des transactions
- Alertes de trésorerie (solde faible, factures en retard)
- Intégration avec projets et employés pour générer des transactions simulées

### 2. Page Démo Trésorerie
**Fichier:** `apps/web/src/app/[locale]/dashboard/tresorerie-demo/page.tsx`  
**URL:** `/dashboard/tresorerie-demo`  
**Description:** Page de démonstration avec fonctionnalités d'import/export de transactions.

**Fonctionnalités:**
- Import de transactions (CSV, Excel, ZIP)
- Export de template d'import
- Prévisualisation avant import (dry-run)
- Gestion des erreurs et avertissements d'import
- Visualisation du cashflow

### 3. Page Démo Gestion Cashflow
**Fichier:** `apps/web/src/app/[locale]/dashboard/cashflow-management-demo/page.tsx` ⚠️ **NON CRÉÉE**  
**URL:** `/dashboard/cashflow-management-demo`  
**Description:** Page de démonstration pour la gestion de cashflow avec scénarios.  
**Statut:** Référencée dans le manifest mais le fichier n'existe pas encore.

---

## 🔌 API Backend

### Endpoint Principal
**Fichier:** `backend/app/api/v1/endpoints/finances/tresorerie.py`  
**Route de base:** `/api/v1/finances/tresorerie`  
**Tag:** `finances-tresorerie`

### Endpoints Disponibles

#### Comptes Bancaires (`/accounts`)
- `GET /accounts` - Lister tous les comptes bancaires
- `GET /accounts/{account_id}` - Obtenir un compte spécifique
- `POST /accounts` - Créer un nouveau compte bancaire
- `PUT /accounts/{account_id}` - Mettre à jour un compte bancaire
- `DELETE /accounts/{account_id}` - Supprimer un compte bancaire

**Fonctionnalités:**
- Calcul automatique du solde actuel (solde initial + entrées - sorties)
- Filtrage par statut actif/inactif
- Support de plusieurs types de comptes (checking, savings, credit, investment, other)

#### Catégories de Transactions (`/categories`)
- `GET /categories` - Lister toutes les catégories
- `GET /categories/{category_id}` - Obtenir une catégorie spécifique
- `POST /categories` - Créer une nouvelle catégorie
- `PUT /categories/{category_id}` - Mettre à jour une catégorie
- `DELETE /categories/{category_id}` - Supprimer une catégorie

**Fonctionnalités:**
- Catégories hiérarchiques (parent_id)
- Filtrage par type (entry/exit)
- Support de couleurs pour l'affichage
- Statut actif/inactif

#### Transactions (`/transactions`)
- `GET /transactions` - Lister toutes les transactions
- `GET /transactions/{transaction_id}` - Obtenir une transaction spécifique
- `POST /transactions` - Créer une nouvelle transaction
- `PUT /transactions/{transaction_id}` - Mettre à jour une transaction
- `DELETE /transactions/{transaction_id}` - Supprimer une transaction

**Filtres disponibles:**
- `bank_account_id` - Filtrer par compte bancaire
- `type` - Filtrer par type (entry/exit)
- `category_id` - Filtrer par catégorie
- `status` - Filtrer par statut (confirmed, pending, projected, cancelled)
- `date_from` / `date_to` - Filtrer par période
- `skip` / `limit` - Pagination

**Fonctionnalités:**
- Transactions récurrentes (is_recurring, recurring_parent_id)
- Liens vers factures, comptes de dépenses, projets
- Méthode de paiement et numéro de référence
- Statuts multiples (confirmé, en attente, projeté, annulé)

#### Cashflow (`/cashflow`)
- `GET /cashflow/weekly` - Obtenir le cashflow hebdomadaire

**Paramètres:**
- `bank_account_id` (optionnel) - Filtrer par compte
- `date_from` (optionnel) - Date de début
- `date_to` (optionnel) - Date de fin

**Retourne:**
- Liste des semaines avec entrées, sorties, solde
- Total des entrées et sorties
- Solde actuel
- Solde projeté (si applicable)

#### Statistiques (`/stats`)
- `GET /stats` - Obtenir les statistiques de trésorerie

**Paramètres:**
- `bank_account_id` (optionnel) - Filtrer par compte
- `period_days` (optionnel, défaut: 30) - Période en jours

**Retourne:**
- Total des entrées
- Total des sorties
- Solde actuel
- Solde projeté à 30 jours
- Pourcentage de variation

#### Prévisions (`/forecast`)
- `GET /forecast/invoices-to-bill` - Obtenir les factures à facturer
- `GET /forecast/detailed` - Prévision détaillée
- `GET /forecast/revenue` - Prévision de revenus

**Fonctionnalités:**
- Calcul de probabilité de paiement
- Identification des factures en retard
- Projection de revenus par semaine

#### Alertes (`/alerts`)
- `GET /alerts` - Obtenir les alertes de trésorerie

**Retourne:**
- Factures en retard
- Comptes avec solde faible
- Échéances à venir

**Paramètres:**
- `low_balance_threshold` (optionnel) - Seuil de solde faible
- `days_ahead` (optionnel) - Jours à l'avance pour les alertes

#### Intégrations (`/invoices`, `/expenses`)
- `GET /invoices` - Obtenir les factures liées à la trésorerie
- `GET /expenses` - Obtenir les comptes de dépenses liés

#### Import (`/import`)
- `POST /import` - Importer des transactions depuis un fichier

**Formats supportés:**
- CSV (.csv)
- Excel (.xlsx, .xls)
- ZIP (.zip) contenant CSV/Excel + instructions

**Paramètres:**
- `bank_account_id` (optionnel) - Compte bancaire cible
- `dry_run` (optionnel, défaut: false) - Mode prévisualisation

**Fonctionnalités:**
- Validation des données
- Détection automatique des colonnes
- Gestion des erreurs et avertissements
- Prévisualisation avant import réel

#### Template (`/import/template`)
- `GET /import/template` - Télécharger un template d'import

**Formats:**
- `format=zip` (défaut) - Archive ZIP avec CSV, Excel et instructions
- `format=csv` - Fichier CSV seul
- `format=excel` - Fichier Excel seul

---

## 🗄️ Modèles de Base de Données

### 1. BankAccount
**Fichier:** `backend/app/models/bank_account.py`  
**Table:** `bank_accounts`

**Colonnes:**
- `id` (Integer, PK)
- `user_id` (Integer, FK → users.id)
- `name` (String(255)) - Nom du compte
- `account_type` (Enum) - Type: checking, savings, credit, investment, other
- `bank_name` (String(255), nullable) - Nom de la banque
- `account_number` (String(100), nullable) - Numéro de compte
- `initial_balance` (Numeric(18,2)) - Solde initial
- `currency` (String(3), défaut: CAD) - Devise
- `is_active` (Boolean, défaut: true) - Statut actif
- `notes` (String(1000), nullable) - Notes
- `created_at` (DateTime)
- `updated_at` (DateTime)

**Relationships:**
- `user` → User
- `transactions` → Transaction[]

**Indexes:**
- `idx_bank_accounts_user_id`
- `idx_bank_accounts_is_active`
- `idx_bank_accounts_created_at`

### 2. Transaction
**Fichier:** `backend/app/models/transaction.py`  
**Table:** `transactions`

**Colonnes:**
- `id` (Integer, PK)
- `user_id` (Integer, FK → users.id)
- `bank_account_id` (Integer, FK → bank_accounts.id)
- `type` (String(20)) - "entry" ou "exit"
- `amount` (Numeric(18,2)) - Montant
- `date` (DateTime) - Date de la transaction
- `description` (String(500)) - Description
- `notes` (Text, nullable) - Notes supplémentaires
- `category_id` (Integer, FK → transaction_categories.id, nullable)
- `status` (Enum) - confirmed, pending, projected, cancelled
- `invoice_id` (Integer, FK → invoices.id, nullable)
- `expense_account_id` (Integer, FK → expense_accounts.id, nullable)
- `project_id` (Integer, FK → projects.id, nullable)
- `payment_method` (String(50), nullable) - Méthode de paiement
- `reference_number` (String(100), nullable) - Numéro de référence
- `is_recurring` (Boolean, défaut: false) - Transaction récurrente
- `recurring_parent_id` (Integer, FK → transactions.id, nullable)
- `created_at` (DateTime)
- `updated_at` (DateTime)

**Relationships:**
- `user` → User
- `bank_account` → BankAccount
- `category` → TransactionCategory
- `invoice` → Invoice
- `expense_account` → ExpenseAccount
- `project` → Project
- `recurring_parent` → Transaction (self-reference)

**Indexes:**
- `idx_transactions_bank_account_id`
- `idx_transactions_category_id`
- `idx_transactions_date`
- `idx_transactions_status`
- `idx_transactions_user_id`
- `idx_transactions_invoice_id`
- `idx_transactions_expense_account_id`
- `idx_transactions_project_id`
- `idx_transactions_created_at`

### 3. TransactionCategory
**Fichier:** `backend/app/models/transaction_category.py`  
**Table:** `transaction_categories`

**Colonnes:**
- `id` (Integer, PK)
- `user_id` (Integer, FK → users.id)
- `name` (String(255)) - Nom de la catégorie
- `type` (Enum) - "entry" ou "exit"
- `parent_id` (Integer, FK → transaction_categories.id, nullable) - Catégorie parente
- `is_active` (Boolean, défaut: true) - Statut actif
- `description` (String(1000), nullable) - Description
- `color` (String(7), nullable) - Couleur hexadécimale
- `created_at` (DateTime)
- `updated_at` (DateTime)

**Relationships:**
- `user` → User
- `parent` → TransactionCategory (self-reference)
- `children` → TransactionCategory[]
- `transactions` → Transaction[]

**Indexes:**
- `idx_transaction_categories_user_id`
- `idx_transaction_categories_type`
- `idx_transaction_categories_parent_id`
- `idx_transaction_categories_is_active`

---

## 📝 Schémas Pydantic

**Fichier:** `backend/app/schemas/tresorerie.py`

### Schémas de Comptes Bancaires
- `BankAccountBase` - Schéma de base
- `BankAccountCreate` - Création
- `BankAccountUpdate` - Mise à jour
- `BankAccountResponse` - Réponse API

### Schémas de Catégories
- `TransactionCategoryBase` - Schéma de base
- `TransactionCategoryCreate` - Création
- `TransactionCategoryUpdate` - Mise à jour
- `TransactionCategoryResponse` - Réponse API

### Schémas de Transactions
- `TransactionBase` - Schéma de base
- `TransactionCreate` - Création
- `TransactionUpdate` - Mise à jour
- `TransactionResponse` - Réponse API

### Schémas de Cashflow
- `CashflowWeek` - Données hebdomadaires
- `CashflowResponse` - Réponse cashflow

### Schémas de Statistiques
- `TreasuryStats` - Statistiques de trésorerie

### Schémas de Prévisions
- `InvoiceToBill` - Facture à facturer
- `RevenueForecast` - Prévision de revenus
- `ForecastResponse` - Réponse prévision détaillée

### Schémas d'Alertes
- `AlertResponse` - Réponse alertes

---

## 🌐 Client API Frontend

**Fichier:** `apps/web/src/lib/api/tresorerie.ts`

### Méthodes Disponibles

#### Comptes Bancaires
- `listBankAccounts(params?)` - Lister les comptes
- `getBankAccount(id)` - Obtenir un compte
- `createBankAccount(data)` - Créer un compte
- `updateBankAccount(id, data)` - Mettre à jour
- `deleteBankAccount(id)` - Supprimer

#### Catégories
- `listCategories(params?)` - Lister les catégories
- `createCategory(data)` - Créer une catégorie
- `updateCategory(id, data)` - Mettre à jour
- `deleteCategory(id)` - Supprimer

#### Transactions
- `listTransactions(params?)` - Lister les transactions
- `getTransaction(id)` - Obtenir une transaction
- `createTransaction(data)` - Créer une transaction
- `updateTransaction(id, data)` - Mettre à jour
- `deleteTransaction(id)` - Supprimer

#### Cashflow
- `getWeeklyCashflow(params?)` - Cashflow hebdomadaire
- `getStats(params?)` - Statistiques

#### Prévisions
- `getInvoicesToBill(params?)` - Factures à facturer
- `getDetailedForecast(params?)` - Prévision détaillée
- `getRevenueForecast(params?)` - Prévision de revenus

#### Alertes
- `getAlerts(params?)` - Obtenir les alertes

#### Intégrations
- `getInvoices(params?)` - Factures liées
- `getExpenses(params?)` - Dépenses liées

#### Import
- `importTransactions(file, params?)` - Importer des transactions
- `downloadImportTemplate(format?)` - Télécharger template

### Types TypeScript
- `BankAccount`, `BankAccountCreate`, `BankAccountUpdate`
- `TransactionCategory`, `TransactionCategoryCreate`, `TransactionCategoryUpdate`
- `Transaction`, `TransactionCreate`, `TransactionUpdate`
- `CashflowWeek`, `CashflowResponse`
- `TreasuryStats`
- `InvoiceToBill`, `RevenueForecast`, `ForecastResponse`
- `AlertResponse`

---

## 🎨 Composants UI

### 1. CashFlowWidget
**Fichier:** `apps/web/src/components/dashboard/widgets/CashFlowWidget.tsx`  
**Description:** Widget de dashboard affichant le cashflow mensuel.

**Fonctionnalités:**
- Affichage des revenus et dépenses par mois
- Graphique en barres
- Totaux (revenus, dépenses, net)
- Intégration avec API de revenus et comptes de dépenses

---

## 🔄 Migrations Base de Données

### Migration 066 - Création des Tables Trésorerie
**Fichier:** `backend/alembic/versions/066_create_treasury_tables.py`  
**Revision ID:** `066_treasury_tables`  
**Revises:** `065_convert_task_enums`

**Tables créées:**
1. `transaction_categories` - Catégories de transactions
2. `bank_accounts` - Comptes bancaires
3. `transactions` - Transactions

**Indexes créés:**
- Pour `transaction_categories`: user_id, type, parent_id, is_active
- Pour `bank_accounts`: user_id, is_active, created_at
- Pour `transactions`: bank_account_id, category_id, date, status, user_id, invoice_id, expense_account_id, project_id, created_at

**Note:** La migration suivante (`067_create_finance_invoices_tables`) référence cette migration.

---

## 📚 Documentation

### Documentation Technique
1. **GUIDE_IMPORT_TRESORERIE.md** - Guide complet d'import de transactions
   - Formats supportés (CSV, Excel, ZIP)
   - Format des colonnes
   - Exemples d'utilisation
   - Gestion des erreurs

2. **RAPPORT_TRESORERIE_MENU.md** - Rapport sur l'absence de la trésorerie dans le menu
   - Problème identifié
   - Solutions proposées
   - Checklist d'implémentation

3. **RAPPORT_FINAL_TRESORERIE.md** - Rapport final d'implémentation

4. **PLAN_IMPLEMENTATION_TRESORERIE.md** - Plan d'implémentation

5. **ANALYSE_TRESORERIE_MANQUANT.md** - Analyse initiale

### Documentation de Progrès (Batches)
- **BATCH_1_PROGRESS_TRESORERIE.md**
- **BATCH_2_PROGRESS_TRESORERIE.md**
- **BATCH_3_PROGRESS_TRESORERIE.md**
- **BATCH_4_PROGRESS_TRESORERIE.md**
- **BATCH_5_PROGRESS_TRESORERIE.md**
- **BATCH_IMPORT_PROGRESS_TRESORERIE.md**

### Rapports d'Avancement
- **RAPPORT_AVANCEMENT_TRESORERIE.md**

---

## 🧭 Navigation & Routes

### Navigation
**Fichier:** `apps/web/src/lib/navigation/index.tsx`

**Statut actuel:** La trésorerie est référencée dans la navigation mais pourrait ne pas être visible dans le menu principal.

**Référence trouvée:**
```typescript
{
  name: 'Trésorerie',
  href: '/dashboard/finances/tresorerie',
}
```

### Routes Configurées
- `/dashboard/finances/tresorerie` - Page principale
- `/dashboard/tresorerie-demo` - Page démo avec import
- `/dashboard/cashflow-management-demo` - Page démo cashflow

### Lien depuis Dashboard Finances
**Fichier:** `apps/web/src/app/[locale]/dashboard/finances/page.tsx`

**Référence trouvée (ligne 389-397):**
```tsx
<Link href="/fr/dashboard/finances/tresorerie">
  <h3 className="font-semibold mb-1">Trésorerie</h3>
  <p className="text-sm text-gray-600 dark:text-gray-400">Suivi du cashflow</p>
</Link>
```

---

## ✨ Fonctionnalités

### Fonctionnalités Principales

#### 1. Gestion des Comptes Bancaires
- ✅ Création, modification, suppression
- ✅ Types multiples (chèque, épargne, crédit, investissement, autre)
- ✅ Calcul automatique du solde actuel
- ✅ Support multi-devises
- ✅ Statut actif/inactif

#### 2. Gestion des Transactions
- ✅ CRUD complet
- ✅ Types: entrées (revenus) et sorties (dépenses)
- ✅ Statuts: confirmé, en attente, projeté, annulé
- ✅ Catégorisation hiérarchique
- ✅ Transactions récurrentes
- ✅ Liens vers factures, dépenses, projets
- ✅ Méthode de paiement et référence

#### 3. Cashflow
- ✅ Visualisation hebdomadaire
- ✅ Calcul automatique des soldes
- ✅ Projections futures
- ✅ Graphiques et visualisations

#### 4. Statistiques
- ✅ Totaux entrées/sorties
- ✅ Solde actuel
- ✅ Projections à 30 jours
- ✅ Calcul de variation

#### 5. Prévisions
- ✅ Factures à facturer
- ✅ Prévisions de revenus
- ✅ Probabilités de paiement
- ✅ Identification des factures en retard

#### 6. Alertes
- ✅ Factures en retard
- ✅ Comptes avec solde faible
- ✅ Échéances à venir

#### 7. Import/Export
- ✅ Import CSV, Excel, ZIP
- ✅ Template téléchargeable
- ✅ Mode prévisualisation (dry-run)
- ✅ Validation et gestion d'erreurs
- ✅ Détection automatique des colonnes

#### 8. Intégrations
- ✅ Liens avec factures (invoices)
- ✅ Liens avec comptes de dépenses (expense_accounts)
- ✅ Liens avec projets (projects)
- ✅ API pour récupérer les données liées

### Fonctionnalités Avancées

#### Transactions Récurrentes
- Support des transactions récurrentes avec parent/children
- Permet de créer des séries de transactions automatiques

#### Catégories Hiérarchiques
- Catégories avec parent/children
- Organisation en arborescence
- Couleurs personnalisables

#### Multi-Comptes
- Gestion de plusieurs comptes bancaires
- Filtrage par compte dans toutes les vues
- Agrégation multi-comptes

#### Projections
- Calcul de soldes projetés
- Prise en compte des transactions projetées
- Prévisions de revenus basées sur les factures

---

## 🔗 Intégrations avec Autres Modules

### Factures (Invoices)
- Lien transaction → facture (`invoice_id`)
- Récupération des factures pour prévisions
- Calcul automatique des revenus projetés

### Comptes de Dépenses (Expense Accounts)
- Lien transaction → compte de dépenses (`expense_account_id`)
- Récupération des dépenses pour intégration

### Projets (Projects)
- Lien transaction → projet (`project_id`)
- Génération de transactions depuis les budgets de projets (dans la page principale)

### Employés (Employees)
- Génération de transactions de salaires (dans la page principale)

---

## 📊 Structure des Données

### Calcul du Solde
Le solde actuel d'un compte bancaire est calculé comme suit:
```
solde_actuel = solde_initial + somme(entrées confirmées) - somme(sorties confirmées)
```

Les transactions annulées (`status = 'cancelled'`) ne sont pas prises en compte dans le calcul.

### Types de Transactions
- **entry** (entrée): Revenus, dépôts, recettes
- **exit** (sortie): Dépenses, retraits, paiements

### Statuts de Transactions
- **confirmed**: Transaction confirmée (réelle)
- **pending**: En attente de confirmation
- **projected**: Transaction projetée (future)
- **cancelled**: Transaction annulée

---

## 🚀 Points d'Amélioration Identifiés

### 1. Menu de Navigation
- ⚠️ La trésorerie n'est pas toujours visible dans le menu principal
- ✅ Solution: Ajouter explicitement dans `apps/web/src/lib/navigation/index.tsx`

### 2. Page Cashflow Management Demo
- ⚠️ Page référencée mais fichier non trouvé dans la recherche
- 🔍 À vérifier: `apps/web/src/app/[locale]/dashboard/cashflow-management-demo/page.tsx`

### 3. Widget Dashboard
- ✅ Widget CashFlowWidget existe mais pourrait être amélioré
- 💡 Suggestion: Intégrer avec l'API tresorerie au lieu de l'API revenue

---

## 📝 Notes Techniques

### Sécurité
- Toutes les requêtes sont filtrées par `user_id`
- Les utilisateurs ne peuvent accéder qu'à leurs propres données
- Validation des données côté serveur (Pydantic)

### Performance
- Indexes sur les colonnes fréquemment utilisées
- Pagination pour les listes de transactions
- Calculs optimisés pour les statistiques

### Extensibilité
- Support multi-devises
- Structure modulaire
- API RESTful standardisée

---

## ✅ Checklist de Vérification

- [x] Pages frontend créées
- [x] API backend complète
- [x] Modèles de base de données
- [x] Migrations créées
- [x] Client API frontend
- [x] Documentation
- [x] Composants UI
- [ ] Menu de navigation (à vérifier/améliorer)
- [x] Import/Export fonctionnel
- [x] Intégrations avec autres modules

---

## 📞 Endpoints API Complets

### Base URL
```
/api/v1/finances/tresorerie
```

### Liste Complète des Endpoints

```
GET    /accounts
POST   /accounts
GET    /accounts/{account_id}
PUT    /accounts/{account_id}
DELETE /accounts/{account_id}

GET    /categories
POST   /categories
GET    /categories/{category_id}
PUT    /categories/{category_id}
DELETE /categories/{category_id}

GET    /transactions
POST   /transactions
GET    /transactions/{transaction_id}
PUT    /transactions/{transaction_id}
DELETE /transactions/{transaction_id}

GET    /cashflow/weekly
GET    /stats
GET    /forecast/invoices-to-bill
GET    /forecast/detailed
GET    /forecast/revenue
GET    /alerts
GET    /invoices
GET    /expenses
POST   /import
GET    /import/template
```

---

**Fin du document**
