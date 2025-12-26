# 🛠️ Plan d'Implémentation des Corrections

**Date**: 2025-01-25  
**Status**: En cours

---

## 📋 Vue d'Ensemble

Ce document détaille le plan d'implémentation pour corriger tous les problèmes identifiés dans `CODEBASE_AUDIT.md`.

---

## 🎯 Batch 1: Unification de `get_current_user` (CRITIQUE)

### Objectif
Unifier les 3 implémentations de `get_current_user` en une seule source de vérité.

### Problème Actuel
- `backend/app/api/v1/endpoints/auth.py` - Utilisé par `two_factor.py`
- `backend/app/dependencies/__init__.py` - Non utilisé actuellement
- `backend/app/dependencies.py` - Utilisé par la plupart des endpoints

### Solution
1. **Garder**: `backend/app/dependencies.py` comme source principale (utilisé partout)
2. **Garder**: `backend/app/api/v1/endpoints/auth.py` pour endpoints auth internes
3. **Fusionner**: `backend/app/dependencies/__init__.py` dans `dependencies.py` (tenancy dependencies)
4. **Mettre à jour**: `two_factor.py` pour utiliser `dependencies.py`

### Étapes
1. Vérifier que `dependencies.py` a toutes les fonctionnalités nécessaires
2. Fusionner les dépendances tenancy de `dependencies/__init__.py` dans `dependencies.py`
3. Mettre à jour `two_factor.py` pour utiliser `dependencies.py`
4. Supprimer `dependencies/__init__.py` ou le transformer en module spécialisé
5. Vérifier que tous les imports fonctionnent
6. Tests

### Fichiers à Modifier
- `backend/app/dependencies.py` - Ajouter dépendances tenancy
- `backend/app/api/v1/endpoints/two_factor.py` - Changer import
- `backend/app/dependencies/__init__.py` - Supprimer ou transformer

---

## 🎯 Batch 2: Amélioration Exception Handling (IMPORTANT)

### Objectif
Remplacer les `except Exception` génériques par des exceptions spécifiques.

### Fichiers Affectés
- `backend/app/api/v1/endpoints/admin.py` - 4 occurrences
- `backend/app/core/tenant_database_manager.py` - 3 occurrences
- `backend/app/main.py` - 4 occurrences
- `backend/app/api/v1/endpoints/auth.py` - 1 occurrence

### Étapes par Fichier

#### `admin.py`
- Ligne 137: Capturer `ValueError`, `IntegrityError` spécifiquement
- Ligne 273: Capturer `ValueError`, `IntegrityError` spécifiquement
- Ligne 496: Capturer `ValueError`, `IntegrityError` spécifiquement
- Ligne 542: Capturer `ValueError`, `IntegrityError` spécifiquement

#### `tenant_database_manager.py`
- Ligne 140: Capturer `OperationalError`, `ProgrammingError` pour DB
- Ligne 170: Capturer `OperationalError`, `ProgrammingError` pour DB
- Ligne 326: Capturer `OperationalError`, `ProgrammingError` pour DB

#### `main.py`
- Ligne 55: Capturer exceptions spécifiques pour cache
- Ligne 65: Capturer exceptions spécifiques pour DB
- Ligne 77: Capturer exceptions spécifiques pour indexes
- Ligne 86: Capturer exceptions spécifiques pour shutdown

#### `auth.py`
- Ligne 139: Capturer `SQLAlchemyError` spécifiquement

### Stratégie
- Remplacer `except Exception` par exceptions spécifiques
- Garder `except Exception` seulement comme dernier recours avec logging approprié
- Ajouter logging détaillé pour chaque type d'erreur

---

## 🎯 Batch 3: Implémentation TODOs (IMPORTANT)

### Objectif
Implémenter ou documenter les fonctionnalités manquantes.

### TODOs à Traiter

#### 1. Backup Code Verification (`two_factor.py` ligne 165)
**Action**: Implémenter vérification des backup codes
- Créer modèle `TwoFactorBackupCode` si nécessaire
- Ajouter méthode `verify_backup_code()` dans service 2FA
- Intégrer dans endpoint de vérification

#### 2. Backup File Deletion (`backup_service.py` ligne 167)
**Action**: Implémenter suppression physique des fichiers backup
- Vérifier où sont stockés les fichiers (local/S3/etc.)
- Ajouter méthode `delete_backup_file()` dans service
- Intégrer dans `delete_backup()`

### Étapes
1. Analyser les modèles/services existants
2. Implémenter fonctionnalités manquantes
3. Ajouter tests si nécessaire
4. Documenter les changements

---

## 🎯 Batch 4: Nettoyage Code Obsolète Frontend (MINEUR)

### Objectif
Supprimer les fichiers dupliqués dans `apps/web/src/app/components/`.

### Étapes
1. Vérifier que les routes fonctionnent avec `[locale]`
2. Vérifier qu'aucun import ne référence `app/components`
3. Créer backup (git commit)
4. Supprimer `apps/web/src/app/components/`
5. Vérifier que le build fonctionne
6. Tests

### Vérifications Préalables
```bash
# Vérifier imports
grep -r "from.*app/components" apps/web/src
grep -r "from.*@/app/components" apps/web/src

# Vérifier routes
# Tester: http://localhost:3000/en/components
```

---

## 🎯 Batch 5: Migration theme_preference (MINEUR)

### Objectif
Planifier et documenter la migration pour supprimer `theme_preference`.

### Étapes
1. Documenter la timeline de dépréciation
2. Créer migration Alembic pour supprimer colonne
3. Retirer du schéma API dans version majeure
4. Mettre à jour documentation

### Note
Cette tâche peut être reportée à une version majeure future.

---

## 📊 Ordre d'Exécution

1. ✅ **Batch 1** - Unification `get_current_user` (CRITIQUE)
2. ✅ **Batch 2** - Exception Handling (IMPORTANT)
3. ✅ **Batch 3** - TODOs (IMPORTANT)
4. ✅ **Batch 4** - Nettoyage Frontend (MINEUR)
5. ⏸️ **Batch 5** - Migration theme_preference (MINEUR - optionnel)

---

## ✅ Critères de Succès

- [ ] Une seule source de vérité pour `get_current_user`
- [ ] Toutes les exceptions sont spécifiques avec logging approprié
- [ ] Tous les TODOs sont implémentés ou documentés
- [ ] Code obsolète supprimé
- [ ] Tous les tests passent
- [ ] Aucune régression introduite

---

## 🔄 Processus de Push

Chaque batch sera :
1. Implémenté complètement
2. Testé localement
3. Commit avec message descriptif
4. Push vers le dépôt

---

**Prochaine Étape**: Commencer Batch 1

