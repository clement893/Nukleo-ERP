# Guide d'Utilisation - Implémentation Leo par Batches

Ce guide explique comment utiliser le plan d'implémentation par batches pour améliorer Leo.

---

## 🚀 Démarrage Rapide

### 1. Lire le Plan
Consultez `LEO_IMPLEMENTATION_PLAN.md` pour voir tous les batches et leurs dépendances.

### 2. Choisir un Batch
Commencez par le Batch 1 (modèles de données) et progressez dans l'ordre.

### 3. Créer une Branche
```bash
git checkout -b feature/leo-improvements-batch-1
```

### 4. Implémenter le Batch
Suivez les instructions du plan pour le batch choisi.

### 5. Vérifier le Code
Utilisez les scripts de vérification:
- **Linux/Mac:** `./scripts/verify-batch.sh 1`
- **Windows PowerShell:** `.\scripts\verify-batch.ps1 1`

### 6. Créer le Rapport
Copiez `BATCH_PROGRESS_TEMPLATE.md` vers `BATCH_1_PROGRESS.md` et remplissez-le.

### 7. Commit et Push
```bash
git add .
git commit -m "feat(leo): Batch 1 - Modèles de données"
git push origin feature/leo-improvements-batch-1
```

---

## 📋 Workflow Détaillé

### Étape 1: Préparation

```bash
# 1. S'assurer d'être à jour
git checkout main
git pull origin main

# 2. Créer une branche pour le batch
git checkout -b feature/leo-improvements-batch-X

# 3. Vérifier l'état actuel
./scripts/verify-batch.sh 0  # Vérification de base
```

### Étape 2: Développement

1. **Lire les spécifications** du batch dans `LEO_IMPLEMENTATION_PLAN.md`
2. **Consulter les exemples** dans `LEO_IMPROVEMENTS_EXAMPLE.md` si nécessaire
3. **Implémenter** les changements
4. **Tester localement** au fur et à mesure

### Étape 3: Vérifications Locales

#### Backend
```bash
cd backend

# Formatage
python -m black .
python -m isort .

# Type checking
python -m mypy app/ --ignore-missing-imports

# Tests
python -m pytest tests/ -v

# Migration (si applicable)
alembic upgrade head
alembic check
```

#### Frontend
```bash
cd apps/web

# Type checking
npm run type-check
# ou
pnpm type-check

# Linting
npm run lint

# Build
npm run build
```

### Étape 4: Script de Vérification Automatique

```bash
# Linux/Mac
./scripts/verify-batch.sh X

# Windows PowerShell
.\scripts\verify-batch.ps1 X
```

Le script vérifie:
- ✅ Syntaxe Python
- ✅ Types Python (mypy)
- ✅ Configuration Alembic
- ✅ Types TypeScript
- ✅ Build frontend

### Étape 5: Rapport de Progression

1. Copier le template:
   ```bash
   cp BATCH_PROGRESS_TEMPLATE.md BATCH_X_PROGRESS.md
   ```

2. Remplir le rapport avec:
   - Fichiers créés/modifiés
   - Vérifications effectuées
   - Problèmes rencontrés
   - Notes pour le batch suivant

3. Ajouter le rapport au commit:
   ```bash
   git add BATCH_X_PROGRESS.md
   ```

### Étape 6: Commit et Push

```bash
# Ajouter tous les fichiers
git add .

# Commit avec message descriptif
git commit -m "feat(leo): Batch X - [Description courte]

- [Changement 1]
- [Changement 2]
- [Changement 3]

Voir BATCH_X_PROGRESS.md pour les détails."

# Push
git push origin feature/leo-improvements-batch-X
```

### Étape 7: Créer une Pull Request (Optionnel)

Si vous travaillez en équipe:
1. Créer une PR sur GitHub/GitLab
2. Ajouter le rapport de progression dans la description
3. Attendre la review avant de merger

---

## 🔍 Dépannage

### Erreurs TypeScript

**Problème:** Erreurs de type dans les fichiers Leo

**Solutions:**
1. Vérifier les imports
2. Vérifier que tous les types sont définis
3. Utiliser `any` temporairement si nécessaire (à corriger plus tard)
4. Vérifier les dépendances dans `package.json`

```bash
cd apps/web
npm install  # ou pnpm install
npm run type-check
```

### Erreurs Python

**Problème:** Erreurs de syntaxe ou de type

**Solutions:**
1. Vérifier la syntaxe Python (version 3.10+)
2. Vérifier les imports
3. Vérifier les types avec mypy

```bash
cd backend
python -m py_compile app/**/*.py
python -m mypy app/ --ignore-missing-imports
```

### Erreurs de Migration Alembic

**Problème:** Migration ne s'applique pas

**Solutions:**
1. Vérifier la syntaxe SQL
2. Vérifier les contraintes
3. Tester sur une DB de test

```bash
cd backend
alembic check
alembic upgrade head --sql  # Voir le SQL généré
```

### Erreurs de Build Frontend

**Problème:** Build échoue

**Solutions:**
1. Vérifier les erreurs TypeScript
2. Vérifier les dépendances
3. Nettoyer le cache

```bash
cd apps/web
rm -rf node_modules .next dist
npm install  # ou pnpm install
npm run build
```

---

## 📊 Suivi de Progression

### Checklist Globale

Créez un fichier `PROGRESS.md` à la racine pour suivre la progression:

```markdown
# Progression Globale - Améliorations Leo

## Batches Complétés
- [x] Batch 1: Modèles de données
- [x] Batch 2: Schémas Pydantic
- [ ] Batch 3: Service Leo Agent
- [ ] Batch 4: Endpoint API (Partie 1)
- ...

## Batches en Cours
- Batch X: [Description] - [Développeur] - [Date de début]

## Blocages
- Aucun pour le moment
```

### Métriques

Suivez ces métriques pour chaque batch:
- Temps estimé vs réel
- Lignes de code ajoutées/modifiées
- Nombre de fichiers créés/modifiés
- Nombre d'erreurs rencontrées

---

## 🎯 Bonnes Pratiques

### 1. Petits Commits
- Commiter souvent
- Un commit par batch
- Messages de commit clairs

### 2. Tests Réguliers
- Tester après chaque changement majeur
- Vérifier que le build fonctionne
- Tester manuellement dans le navigateur

### 3. Documentation
- Commenter le code complexe
- Mettre à jour les rapports de progression
- Documenter les décisions techniques

### 4. Communication
- Partager les problèmes rencontrés
- Demander de l'aide si bloqué
- Mettre à jour la checklist globale

---

## 📝 Exemple de Workflow Complet

```bash
# 1. Préparation
git checkout main
git pull origin main
git checkout -b feature/leo-improvements-batch-1

# 2. Développement
# ... créer les fichiers ...

# 3. Vérifications
cd backend
python -m black .
python -m mypy app/models/leo_conversation.py --ignore-missing-imports
alembic revision --autogenerate -m "Add leo conversations"
alembic upgrade head

cd ../apps/web
npm run type-check
npm run build

# 4. Script automatique
cd ../..
./scripts/verify-batch.sh 1

# 5. Rapport
cp BATCH_PROGRESS_TEMPLATE.md BATCH_1_PROGRESS.md
# ... remplir le rapport ...

# 6. Commit
git add .
git commit -m "feat(leo): Batch 1 - Modèles de données"
git push origin feature/leo-improvements-batch-1
```

---

## 🔗 Ressources

- **Plan d'implémentation:** `LEO_IMPLEMENTATION_PLAN.md`
- **Exemples de code:** `LEO_IMPROVEMENTS_EXAMPLE.md`
- **Audit complet:** `AUDIT_LEO_AGENT_AI.md`
- **Résumé exécutif:** `AUDIT_LEO_RESUME.md`
- **Template de rapport:** `BATCH_PROGRESS_TEMPLATE.md`

---

## ❓ Questions Fréquentes

### Puis-je sauter un batch?
Non, chaque batch dépend du précédent. Suivez l'ordre défini.

### Que faire si un batch échoue?
1. Identifier le problème
2. Consulter la section Dépannage
3. Demander de l'aide si nécessaire
4. Documenter le problème dans le rapport

### Puis-je modifier le plan?
Oui, mais documentez les changements et mettez à jour le plan.

### Combien de temps par batch?
Cela dépend de la complexité, mais généralement 2-4 heures par batch.

---

**Dernière mise à jour:** 2025-01-27
