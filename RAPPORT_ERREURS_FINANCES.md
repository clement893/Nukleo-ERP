# Rapport d'Investigation - Erreurs sur les Pages Finances

**Date**: 2026-01-02  
**Pages affectées**:
- https://modeleweb-production-f341.up.railway.app/fr/dashboard/finances/revenus
- https://modeleweb-production-f341.up.railway.app/fr/dashboard/finances/depenses

## 🔴 Problèmes Identifiés

### 1. Migration 073 Non Exécutée (CRITIQUE)

**Erreur**: `Database schema is out of date. Please run migration 073 to update the transactions table schema (add currency column and rename date to transaction_date).`

**Cause**:
- Le modèle `Transaction` utilise `transaction_date` (ligne 53 de `backend/app/models/transaction.py`)
- Le modèle `Transaction` utilise `currency` (ligne 47 de `backend/app/models/transaction.py`)
- La base de données en production a encore l'ancien schéma avec:
  - Colonne `date` au lieu de `transaction_date`
  - Pas de colonne `currency`

**Fichiers affectés**:
- `backend/app/api/v1/endpoints/finances/transactions.py` (lignes 65, 67, 69)
- `backend/app/api/v1/endpoints/finances/tresorerie.py` (lignes 779, 780, 800, 808, 907, 908, 1001, 1002, 1022, 1023)

**Migration existante**:
- `backend/alembic/versions/073_add_currency_to_transactions.py` existe et devrait:
  - Renommer `date` → `transaction_date`
  - Ajouter la colonne `currency` avec valeur par défaut 'CAD'
  - Ajouter d'autres colonnes manquantes (invoice_number, expected_payment_date, client_id, client_name, tax_amount, category_id)

**Solution requise**:
```bash
# Exécuter la migration en production
alembic upgrade head
# ou spécifiquement
alembic upgrade 073
```

---

### 2. Utilisation de `bank_account_id` Non Défini (ERREUR)

**Problème**: Le code utilise `Transaction.bank_account_id` mais cette colonne n'existe pas dans le modèle.

**Fichiers affectés**:
- `backend/app/api/v1/endpoints/finances/tresorerie.py`:
  - Ligne 77: `Transaction.bank_account_id == account.id`
  - Ligne 84: `Transaction.bank_account_id == account.id`
  - Ligne 170: `Transaction.bank_account_id == account.id`
  - Ligne 177: `Transaction.bank_account_id == account.id`
  - Ligne 242: `Transaction.bank_account_id == account.id`
  - Ligne 249: `Transaction.bank_account_id == account.id`
  - Ligne 481: `query = query.where(Transaction.bank_account_id == bank_account_id)`
  - Ligne 524: `BankAccount.id == transaction_data.bank_account_id`
  - Ligne 588: `Transaction.bank_account_id == account.id`
  - Ligne 595: `Transaction.bank_account_id == account.id`
  - Ligne 914: `query = query.where(Transaction.bank_account_id == bank_account_id)`
  - Ligne 1008: `projected_query = projected_query.where(Transaction.bank_account_id == bank_account_id)`
  - Ligne 1029: `prev_query = prev_query.where(Transaction.bank_account_id == bank_account_id)`

**Note**: Il y a un commentaire à la ligne 785 qui reconnaît ce problème:
```python
# Note: Transaction model doesn't have bank_account_id field
# Filtering by bank_account_id is not supported for Transaction model
```

Mais le code utilise quand même `bank_account_id` dans d'autres endroits, ce qui causera des erreurs SQL.

**Impact**: Ces requêtes échoueront avec une erreur `column "bank_account_id" does not exist` si elles sont exécutées.

---

### 3. Erreur "Error calculating treasury stats"

**Endpoint**: `GET /api/v1/finances/treasury/stats`

**Cause**: L'erreur se produit dans `get_treasury_stats()` (ligne 890-1057 de `tresorerie.py`) probablement à cause de:
1. L'utilisation de `Transaction.transaction_date` qui n'existe pas encore (problème #1)
2. L'utilisation de `Transaction.bank_account_id` qui n'existe pas (problème #2)

**Stack trace**:
```
[ERROR] API response error InternalServerError: Error calculating treasury stats
```

---

## 📋 Actions Recommandées

### Priorité 1 (CRITIQUE - Bloque les pages)
1. **Exécuter la migration 073 en production**
   - Vérifier que la migration est idempotente (elle l'est)
   - Exécuter: `alembic upgrade head` ou `alembic upgrade 073`
   - Vérifier que les colonnes `transaction_date` et `currency` existent après la migration

### Priorité 2 (ERREUR - Causera des problèmes)
2. **Corriger l'utilisation de `bank_account_id`**
   - Option A: Ajouter la colonne `bank_account_id` au modèle Transaction et créer une migration
   - Option B: Retirer toutes les références à `Transaction.bank_account_id` et utiliser une logique alternative
   - Option C: Ajouter une vérification conditionnelle avant d'utiliser `bank_account_id`

### Priorité 3 (AMÉLIORATION)
3. **Améliorer la gestion d'erreurs**
   - Capturer spécifiquement les erreurs de schéma dans `get_treasury_stats()`
   - Retourner un message d'erreur plus explicite indiquant la migration manquante

---

## 🔍 Détails Techniques

### Schéma Actuel vs Attendu

**Actuel (en production)**:
```sql
transactions:
  - date (DateTime)  ❌ Devrait être transaction_date
  - (pas de colonne currency) ❌
```

**Attendu (après migration 073)**:
```sql
transactions:
  - transaction_date (DateTime) ✅
  - currency (String(3), default='CAD') ✅
  - invoice_number (String(100), nullable) ✅
  - expected_payment_date (DateTime, nullable) ✅
  - client_id (Integer, nullable) ✅
  - client_name (String(200), nullable) ✅
  - tax_amount (Numeric(10, 2), nullable) ✅
  - category_id (Integer, nullable) ✅
```

### Modèle Transaction (backend/app/models/transaction.py)

Le modèle définit:
- `transaction_date` (ligne 53) ✅
- `currency` (ligne 47) ✅
- **PAS** de `bank_account_id` ❌

Mais le code dans `tresorerie.py` utilise `bank_account_id` à plusieurs endroits.

---

## 📝 Notes

- La migration 073 est idempotente et peut être exécutée plusieurs fois sans problème
- La migration vérifie l'existence des colonnes avant de les ajouter/renommer
- Le problème de `bank_account_id` nécessite une décision architecturale: est-ce que les transactions doivent être liées à des comptes bancaires spécifiques?

---

## ✅ Vérification Post-Migration

Après avoir exécuté la migration 073, vérifier:

```sql
-- Vérifier que transaction_date existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'transactions' 
AND column_name IN ('transaction_date', 'date', 'currency');

-- Devrait retourner:
-- transaction_date | timestamp with time zone
-- currency | character varying(3)
-- (pas de 'date')
```

---

**Rapport généré automatiquement**  
**Status**: 🔴 CRITIQUE - Action requise immédiatement
