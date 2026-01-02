# Plan d'Implémentation - Module Trésorerie

**Date de création:** $(date)  
**Objectif:** Implémenter un module complet de gestion de trésorerie avec dépenses, revenus, prévisions et cashflow par semaine.

---

## 📋 Vue d'Ensemble

### Fonctionnalités Principales
- ✅ Dépenses réelles (comptes de dépenses, factures fournisseurs)
- ✅ Revenus réels (factures clients payées)
- ✅ Prévisions de facturation (factures à facturer)
- ✅ Cashflow par semaine (entrées/sorties/solde)
- ✅ Multi-comptes bancaires
- ✅ Transactions manuelles

---

## 🎯 Batch 1: Modèles de Données Backend

### Objectif
Créer les modèles SQLAlchemy pour la trésorerie.

### Tâches
1. ✅ Créer `backend/app/models/bank_account.py`
   - Modèle `BankAccount` (compte bancaire)
   - Champs: nom, type, solde initial, devise, actif, user_id

2. ✅ Créer `backend/app/models/transaction.py`
   - Modèle `Transaction` (transaction financière)
   - Champs: type (entree/sortie), montant, date, catégorie, compte bancaire, statut, description
   - Relations: bank_account, category, invoice (optionnel), expense_account (optionnel), project (optionnel)

3. ✅ Créer `backend/app/models/transaction_category.py`
   - Modèle `TransactionCategory` (catégories de transactions)
   - Champs: nom, type (entree/sortie), parent_id (hiérarchie), user_id

4. ✅ Créer migration Alembic
   - Tables: `bank_accounts`, `transactions`, `transaction_categories`
   - Indexes appropriés
   - Foreign keys

5. ✅ Mettre à jour `backend/app/models/__init__.py`
   - Importer les nouveaux modèles

### Vérifications
- ✅ Migration Alembic fonctionne
- ✅ Modèles peuvent être importés
- ✅ Relations SQLAlchemy fonctionnent
- ✅ Types TypeScript générés (si applicable)

### Livrables
- Modèles de données complets
- Migration Alembic testée
- Documentation des modèles

---

## 🎯 Batch 2: API Backend de Base

### Objectif
Créer les endpoints API CRUD pour les comptes bancaires et transactions.

### Tâches
1. ✅ Créer `backend/app/api/v1/endpoints/finances/tresorerie.py`
   - `GET /finances/tresorerie/accounts` - Liste des comptes
   - `POST /finances/tresorerie/accounts` - Créer un compte
   - `GET /finances/tresorerie/accounts/{id}` - Détails d'un compte
   - `PUT /finances/tresorerie/accounts/{id}` - Modifier un compte
   - `DELETE /finances/tresorerie/accounts/{id}` - Supprimer un compte

2. ✅ Endpoints Transactions
   - `GET /finances/tresorerie/transactions` - Liste des transactions (avec filtres)
   - `POST /finances/tresorerie/transactions` - Créer une transaction
   - `GET /finances/tresorerie/transactions/{id}` - Détails d'une transaction
   - `PUT /finances/tresorerie/transactions/{id}` - Modifier une transaction
   - `DELETE /finances/tresorerie/transactions/{id}` - Supprimer une transaction

3. ✅ Endpoints Catégories
   - `GET /finances/tresorerie/categories` - Liste des catégories
   - `POST /finances/tresorerie/categories` - Créer une catégorie
   - `PUT /finances/tresorerie/categories/{id}` - Modifier une catégorie
   - `DELETE /finances/tresorerie/categories/{id}` - Supprimer une catégorie

4. ✅ Créer les schemas Pydantic
   - `backend/app/schemas/tresorerie.py`
   - Schemas pour BankAccount, Transaction, TransactionCategory

5. ✅ Enregistrer le router dans `backend/app/api/v1/router.py`

### Vérifications
- ✅ Tous les endpoints répondent correctement
- ✅ Validation des données avec Pydantic
- ✅ Gestion des erreurs
- ✅ Authentification requise
- ✅ Tests manuels avec curl/Postman

### Livrables
- API REST complète et fonctionnelle
- Documentation des endpoints
- Schemas Pydantic validés

---

## 🎯 Batch 3: Intégration Factures et Dépenses

### Objectif
Connecter la trésorerie aux factures et comptes de dépenses existants.

### Tâches
1. ✅ Endpoint Cashflow
   - `GET /finances/tresorerie/cashflow` - Calcul du cashflow par semaine
   - Paramètres: date_debut, date_fin, compte_id (optionnel)
   - Retourne: entrées, sorties, solde par semaine

2. ✅ Intégration Factures (Invoice)
   - Détecter les factures payées (`Invoice.status == PAID`)
   - Créer automatiquement des transactions d'entrée pour factures payées
   - Endpoint: `GET /finances/tresorerie/invoices` - Factures liées à la trésorerie

3. ✅ Intégration Comptes de Dépenses (ExpenseAccount)
   - Détecter les comptes de dépenses approuvés (`ExpenseAccount.status == APPROVED`)
   - Créer automatiquement des transactions de sortie pour dépenses approuvées
   - Endpoint: `GET /finances/tresorerie/expenses` - Dépenses liées à la trésorerie

4. ✅ Calcul Solde Réel
   - Calculer le solde réel de chaque compte bancaire
   - Solde = solde_initial + somme(transactions entrées) - somme(transactions sorties)
   - Endpoint: `GET /finances/tresorerie/accounts/{id}/balance` - Solde actuel

5. ✅ Synchronisation Automatique
   - Service pour synchroniser factures/dépenses → transactions
   - Optionnel: tâche planifiée pour synchronisation automatique

### Vérifications
- ✅ Les factures payées apparaissent dans les entrées
- ✅ Les dépenses approuvées apparaissent dans les sorties
- ✅ Le calcul du solde est correct
- ✅ Le cashflow par semaine est calculé correctement

### Livrables
- Intégration complète avec les modules existants
- Calculs financiers validés
- Documentation de l'intégration

---

## 🎯 Batch 4: Calcul et Affichage Cashflow

### Objectif
Créer les endpoints et logique pour le cashflow par semaine.

### Tâches
1. ✅ Endpoint Cashflow Détaillé
   - `GET /finances/tresorerie/cashflow/weekly`
   - Paramètres: date_debut, date_fin, compte_id (optionnel)
   - Retourne: tableau de semaines avec entrées, sorties, solde, transactions détaillées

2. ✅ Endpoint Prévisions
   - `GET /finances/tresorerie/forecast`
   - Inclut les factures à facturer (non payées)
   - Inclut les dépenses prévues (non approuvées mais probables)
   - Retourne: prévisions par semaine

3. ✅ Calcul Solde Projeté
   - Calculer le solde projeté en incluant les prévisions
   - Solde projeté = solde réel + prévisions entrées - prévisions sorties

4. ✅ Endpoint Statistiques
   - `GET /finances/tresorerie/stats`
   - Total entrées (période)
   - Total sorties (période)
   - Solde actuel
   - Solde projeté (30 jours)
   - Variation vs période précédente

### Vérifications
- ✅ Les calculs de cashflow sont corrects
- ✅ Les prévisions sont réalistes
- ✅ Les statistiques sont cohérentes
- ✅ Performance acceptable (pas de requêtes N+1)

### Livrables
- Endpoints de cashflow complets
- Calculs validés mathématiquement
- Documentation des calculs

---

## 🎯 Batch 5: Prévisions Factures à Facturer

### Objectif
Ajouter la gestion des factures à facturer dans les prévisions.

### Tâches
1. ✅ Endpoint Factures à Facturer
   - `GET /finances/tresorerie/invoices/to-bill`
   - Factures en statut DRAFT ou OPEN
   - Filtrer par date d'échéance
   - Retourne: liste avec montant, date prévue, probabilité

2. ✅ Intégration dans Prévisions
   - Inclure les factures à facturer dans le calcul de prévisions
   - Pondérer par probabilité (facture draft = 50%, facture open = 80%)
   - Endpoint: `GET /finances/tresorerie/forecast/detailed`

3. ✅ Alertes Factures en Retard
   - Détecter les factures en retard (due_date < aujourd'hui)
   - Endpoint: `GET /finances/tresorerie/alerts/overdue-invoices`

4. ✅ Projection Revenus
   - Calculer les revenus prévus par semaine
   - Basé sur les factures à facturer et leur probabilité
   - Endpoint: `GET /finances/tresorerie/revenue/forecast`

### Vérifications
- ✅ Les factures à facturer sont correctement identifiées
- ✅ Les prévisions incluent les factures probables
- ✅ Les alertes fonctionnent correctement
- ✅ Les projections sont réalistes

### Livrables
- Gestion complète des prévisions
- Système d'alertes fonctionnel
- Documentation des prévisions

---

## 🎯 Batch 6: Frontend avec Données Réelles

### Objectif
Remplacer les données simulées par les données réelles de l'API.

### Tâches
1. ✅ Créer les types TypeScript
   - `apps/web/src/lib/api/tresorerie.ts`
   - Types: BankAccount, Transaction, TransactionCategory, CashflowWeek, Forecast

2. ✅ Créer les fonctions API
   - `getBankAccounts()`
   - `getTransactions(filters)`
   - `getCashflowWeekly(dateStart, dateEnd)`
   - `getForecast()`
   - `getStats()`
   - CRUD complet

3. ✅ Mettre à jour la page `tresorerie-demo`
   - Remplacer les données simulées par les appels API
   - Gérer les états de chargement
   - Gérer les erreurs

4. ✅ Afficher les Données Réelles
   - Solde réel des comptes
   - Transactions réelles
   - Cashflow réel par semaine
   - Prévisions basées sur factures/dépenses

5. ✅ Ajouter les Fonctionnalités Manquantes
   - Formulaire d'ajout de transaction
   - Formulaire d'ajout de compte bancaire
   - Filtres de recherche
   - Export CSV

### Vérifications
- ✅ Les données réelles s'affichent correctement
- ✅ Les formulaires fonctionnent
- ✅ Les filtres fonctionnent
- ✅ L'export fonctionne
- ✅ Pas d'erreurs TypeScript
- ✅ Performance acceptable

### Livrables
- Page de trésorerie fonctionnelle avec données réelles
- Formulaires complets
- Export fonctionnel
- Documentation utilisateur

---

## 📊 Checklist de Vérification par Batch

### Batch 1 ✅
- [ ] Migration Alembic créée et testée
- [ ] Modèles importables sans erreur
- [ ] Relations SQLAlchemy fonctionnent
- [ ] Types TypeScript générés (si applicable)

### Batch 2 ✅
- [ ] Tous les endpoints répondent
- [ ] Validation Pydantic fonctionne
- [ ] Authentification requise
- [ ] Tests manuels réussis

### Batch 3 ✅
- [ ] Factures intégrées
- [ ] Dépenses intégrées
- [ ] Calcul solde correct
- [ ] Cashflow calculé correctement

### Batch 4 ✅
- [ ] Cashflow par semaine fonctionne
- [ ] Prévisions calculées
- [ ] Statistiques cohérentes
- [ ] Performance acceptable

### Batch 5 ✅
- [ ] Factures à facturer identifiées
- [ ] Prévisions incluent factures
- [ ] Alertes fonctionnent
- [ ] Projections réalistes

### Batch 6 ✅
- [ ] Frontend utilise données réelles
- [ ] Formulaires fonctionnent
- [ ] Filtres fonctionnent
- [ ] Export fonctionne
- [ ] Pas d'erreurs TypeScript

---

## 🚀 Ordre d'Exécution

1. **Batch 1** → Fondations (modèles)
2. **Batch 2** → API de base
3. **Batch 3** → Intégration données existantes
4. **Batch 4** → Calculs cashflow
5. **Batch 5** → Prévisions
6. **Batch 6** → Frontend

---

## 📝 Notes Techniques

- Utiliser les modèles existants (`Invoice`, `ExpenseAccount`, `Project`)
- Respecter les conventions du projet (naming, structure)
- Tester chaque batch avant de passer au suivant
- Documenter chaque étape
- Créer des migrations Alembic pour chaque changement de schéma

---

**Prochaine étape:** Commencer Batch 1 - Modèles de Données
