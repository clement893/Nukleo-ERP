# Plan d'Implémentation Leo - Par Batches

**Objectif:** Implémenter les améliorations de Leo par petits batches, chaque batch étant testable et déployable sans casser le build.

---

## 📋 Structure des Batches

### Batch 1: Modèles de Données (Backend)
**Objectif:** Créer les modèles de base de données pour les conversations Leo

**Fichiers à créer/modifier:**
- `backend/app/models/leo_conversation.py` (nouveau)
- `backend/alembic/versions/XXXX_add_leo_conversations.py` (nouveau)

**Vérifications:**
- ✅ Pas d'erreurs Python (linting)
- ✅ Migration Alembic fonctionne
- ✅ Tests de base passent

**Commande de vérification:**
```bash
cd backend
python -m pytest tests/ -k leo -v || echo "No leo tests yet"
python -m mypy app/models/leo_conversation.py --ignore-missing-imports
alembic check
```

**Rapport attendu:**
- [ ] Modèles créés
- [ ] Migration créée et testée
- [ ] Pas d'erreurs de type
- [ ] Build backend OK

---

### Batch 2: Schémas Pydantic (Backend)
**Objectif:** Créer les schémas de validation pour l'API

**Fichiers à créer/modifier:**
- `backend/app/schemas/leo.py` (nouveau)

**Vérifications:**
- ✅ Pas d'erreurs Python
- ✅ Schémas valides

**Commande de vérification:**
```bash
cd backend
python -m mypy app/schemas/leo.py --ignore-missing-imports
python -c "from app.schemas.leo import *; print('Schemas OK')"
```

**Rapport attendu:**
- [ ] Schémas créés
- [ ] Pas d'erreurs de type
- [ ] Build backend OK

---

### Batch 3: Service Leo Agent (Backend)
**Objectif:** Créer le service principal pour gérer les interactions Leo

**Fichiers à créer/modifier:**
- `backend/app/services/leo_agent_service.py` (nouveau)

**Dépendances:** Batch 1, Batch 2

**Vérifications:**
- ✅ Pas d'erreurs Python
- ✅ Imports corrects
- ✅ Méthodes de base fonctionnent

**Commande de vérification:**
```bash
cd backend
python -m mypy app/services/leo_agent_service.py --ignore-missing-imports
python -c "from app.services.leo_agent_service import LeoAgentService; print('Service OK')"
```

**Rapport attendu:**
- [ ] Service créé
- [ ] Pas d'erreurs de type
- [ ] Build backend OK

---

### Batch 4: Endpoint API Backend (Partie 1)
**Objectif:** Créer l'endpoint de base pour les conversations

**Fichiers à créer/modifier:**
- `backend/app/api/v1/endpoints/leo_agent.py` (nouveau)
- `backend/app/api/v1/router.py` (modifier - ajouter le router)

**Dépendances:** Batch 1, Batch 2, Batch 3

**Vérifications:**
- ✅ Pas d'erreurs Python
- ✅ API démarre sans erreur
- ✅ Endpoints accessibles dans Swagger

**Commande de vérification:**
```bash
cd backend
python -m mypy app/api/v1/endpoints/leo_agent.py --ignore-missing-imports
# Démarrer le serveur et vérifier /docs
uvicorn app.main:app --reload --port 8000 &
sleep 5
curl http://localhost:8000/api/v1/openapi.json | jq '.paths | keys | .[] | select(. | contains("leo"))' || echo "Check manually"
pkill -f uvicorn
```

**Rapport attendu:**
- [ ] Endpoint créé
- [ ] Router enregistré
- [ ] Pas d'erreurs de type
- [ ] API démarre correctement
- [ ] Endpoints visibles dans Swagger

---

### Batch 5: Endpoint API Backend (Partie 2 - Query)
**Objectif:** Ajouter l'endpoint de query avec contexte utilisateur

**Fichiers à modifier:**
- `backend/app/api/v1/endpoints/leo_agent.py` (modifier)

**Dépendances:** Batch 4

**Vérifications:**
- ✅ Pas d'erreurs Python
- ✅ Endpoint fonctionne avec authentification
- ✅ Contexte utilisateur récupéré correctement

**Commande de vérification:**
```bash
cd backend
python -m mypy app/api/v1/endpoints/leo_agent.py --ignore-missing-imports
# Test manuel avec token JWT
```

**Rapport attendu:**
- [ ] Endpoint /query créé
- [ ] Contexte utilisateur fonctionne
- [ ] Pas d'erreurs de type
- [ ] Tests manuels OK

---

### Batch 6: Types TypeScript Frontend (Partie 1)
**Objectif:** Créer les types TypeScript pour les conversations

**Fichiers à créer/modifier:**
- `apps/web/src/lib/api/leo-agent.ts` (nouveau - types seulement)

**Vérifications:**
- ✅ Pas d'erreurs TypeScript
- ✅ Types compilent

**Commande de vérification:**
```bash
cd apps/web
npm run type-check || pnpm type-check || yarn type-check
# Ou
npx tsc --noEmit src/lib/api/leo-agent.ts
```

**Rapport attendu:**
- [ ] Types créés
- [ ] Pas d'erreurs TypeScript
- [ ] Build frontend OK

---

### Batch 7: API Client Frontend (Partie 1)
**Objectif:** Créer le client API pour les conversations

**Fichiers à modifier:**
- `apps/web/src/lib/api/leo-agent.ts` (modifier - ajouter fonctions de base)

**Dépendances:** Batch 6

**Vérifications:**
- ✅ Pas d'erreurs TypeScript
- ✅ Imports corrects
- ✅ Fonctions exportées

**Commande de vérification:**
```bash
cd apps/web
npm run type-check || pnpm type-check || yarn type-check
npm run build --dry-run 2>&1 | head -20 || echo "Build check"
```

**Rapport attendu:**
- [ ] Client API créé
- [ ] Pas d'erreurs TypeScript
- [ ] Build frontend OK

---

### Batch 8: Composants UI Frontend (Partie 1 - Structure)
**Objectif:** Créer la structure de base des composants

**Fichiers à créer/modifier:**
- `apps/web/src/components/leo/LeoChat.tsx` (nouveau - structure seulement)
- `apps/web/src/components/leo/LeoSidebar.tsx` (nouveau - structure seulement)

**Dépendances:** Batch 7

**Vérifications:**
- ✅ Pas d'erreurs TypeScript
- ✅ Composants compilent
- ✅ Pas d'erreurs de build

**Commande de vérification:**
```bash
cd apps/web
npm run type-check || pnpm type-check || yarn type-check
npm run build 2>&1 | grep -i error | head -10 || echo "No build errors"
```

**Rapport attendu:**
- [ ] Composants créés (structure)
- [ ] Pas d'erreurs TypeScript
- [ ] Build frontend OK

---

### Batch 9: Composants UI Frontend (Partie 2 - Fonctionnalités)
**Objectif:** Ajouter les fonctionnalités de base (chat, sidebar)

**Fichiers à modifier:**
- `apps/web/src/components/leo/LeoChat.tsx`
- `apps/web/src/components/leo/LeoSidebar.tsx`

**Dépendances:** Batch 8

**Vérifications:**
- ✅ Pas d'erreurs TypeScript
- ✅ Composants fonctionnent
- ✅ Pas d'erreurs de build

**Commande de vérification:**
```bash
cd apps/web
npm run type-check || pnpm type-check || yarn type-check
npm run build 2>&1 | grep -i error | head -10 || echo "No build errors"
```

**Rapport attendu:**
- [ ] Fonctionnalités ajoutées
- [ ] Pas d'erreurs TypeScript
- [ ] Build frontend OK
- [ ] Tests manuels OK

---

### Batch 10: Intégration Page Leo
**Objectif:** Intégrer les nouveaux composants dans la page Leo

**Fichiers à modifier:**
- `apps/web/src/app/[locale]/dashboard/leo/page.tsx`

**Dépendances:** Batch 9

**Vérifications:**
- ✅ Pas d'erreurs TypeScript
- ✅ Page compile
- ✅ Pas d'erreurs de build
- ✅ Page accessible dans le navigateur

**Commande de vérification:**
```bash
cd apps/web
npm run type-check || pnpm type-check || yarn type-check
npm run build 2>&1 | grep -i error | head -10 || echo "No build errors"
# Tester manuellement dans le navigateur
```

**Rapport attendu:**
- [ ] Page intégrée
- [ ] Pas d'erreurs TypeScript
- [ ] Build frontend OK
- [ ] Page fonctionne dans le navigateur

---

### Batch 11: Support Markdown
**Objectif:** Ajouter le support markdown dans les réponses

**Fichiers à modifier:**
- `apps/web/src/components/leo/LeoChat.tsx`

**Dépendances:** Batch 10

**Vérifications:**
- ✅ Pas d'erreurs TypeScript
- ✅ Markdown s'affiche correctement
- ✅ Pas d'erreurs de build

**Commande de vérification:**
```bash
cd apps/web
npm run type-check || pnpm type-check || yarn type-check
npm run build 2>&1 | grep -i error | head -10 || echo "No build errors"
```

**Rapport attendu:**
- [ ] Markdown supporté
- [ ] Pas d'erreurs TypeScript
- [ ] Build frontend OK
- [ ] Markdown s'affiche correctement

---

### Batch 12: Contexte Utilisateur Backend (Enrichissement)
**Objectif:** Enrichir le contexte utilisateur avec données ERP

**Fichiers à modifier:**
- `backend/app/services/leo_agent_service.py` (ajouter get_relevant_data)

**Dépendances:** Batch 5

**Vérifications:**
- ✅ Pas d'erreurs Python
- ✅ Données récupérées correctement
- ✅ Permissions respectées

**Commande de vérification:**
```bash
cd backend
python -m mypy app/services/leo_agent_service.py --ignore-missing-imports
python -m pytest tests/ -k leo -v || echo "No leo tests yet"
```

**Rapport attendu:**
- [ ] Contexte enrichi
- [ ] Pas d'erreurs de type
- [ ] Build backend OK
- [ ] Données récupérées correctement

---

### Batch 13: Intégration Données dans Query
**Objectif:** Intégrer les données réelles dans les réponses Leo

**Fichiers à modifier:**
- `backend/app/api/v1/endpoints/leo_agent.py`

**Dépendances:** Batch 12

**Vérifications:**
- ✅ Pas d'erreurs Python
- ✅ Données incluses dans le contexte
- ✅ Réponses plus précises

**Commande de vérification:**
```bash
cd backend
python -m mypy app/api/v1/endpoints/leo_agent.py --ignore-missing-imports
# Test manuel avec requête réelle
```

**Rapport attendu:**
- [ ] Données intégrées
- [ ] Pas d'erreurs de type
- [ ] Build backend OK
- [ ] Réponses incluent des données réelles

---

### Batch 14: Améliorations UX (Suggestions, Loading States)
**Objectif:** Améliorer l'expérience utilisateur

**Fichiers à modifier:**
- `apps/web/src/components/leo/LeoChat.tsx`
- `apps/web/src/components/leo/LeoSidebar.tsx`

**Dépendances:** Batch 11

**Vérifications:**
- ✅ Pas d'erreurs TypeScript
- ✅ UX améliorée
- ✅ Pas d'erreurs de build

**Commande de vérification:**
```bash
cd apps/web
npm run type-check || pnpm type-check || yarn type-check
npm run build 2>&1 | grep -i error | head -10 || echo "No build errors"
```

**Rapport attendu:**
- [ ] UX améliorée
- [ ] Pas d'erreurs TypeScript
- [ ] Build frontend OK
- [ ] Tests manuels OK

---

## 🔄 Workflow pour Chaque Batch

### 1. Préparation
```bash
# S'assurer d'être sur la branche de développement
git checkout -b feature/leo-improvements-batch-X

# Pull les dernières modifications
git pull origin main
```

### 2. Développement
- Implémenter les changements du batch
- Vérifier localement avec les commandes de vérification

### 3. Vérifications Avant Commit
```bash
# Backend
cd backend
python -m black . --check || python -m black .
python -m isort . --check || python -m isort .
python -m mypy app/ --ignore-missing-imports || echo "Type errors to fix"
python -m pytest tests/ -v || echo "Tests to add"

# Frontend
cd apps/web
npm run type-check || pnpm type-check || yarn type-check
npm run lint || pnpm lint || yarn lint
npm run build || pnpm build || yarn build
```

### 4. Commit et Push
```bash
git add .
git commit -m "feat(leo): Batch X - [Description]"
git push origin feature/leo-improvements-batch-X
```

### 5. Rapport de Progression
Créer un fichier `BATCH_X_PROGRESS.md` avec:
- ✅ Ce qui a été fait
- ✅ Tests effectués
- ✅ Résultats des vérifications
- ⚠️ Problèmes rencontrés (si applicable)
- 📝 Notes pour le batch suivant

---

## 📊 Checklist Globale

### Backend
- [ ] Batch 1: Modèles de données
- [ ] Batch 2: Schémas Pydantic
- [ ] Batch 3: Service Leo Agent
- [ ] Batch 4: Endpoint API (Partie 1)
- [ ] Batch 5: Endpoint API (Partie 2)
- [ ] Batch 12: Contexte utilisateur enrichi
- [ ] Batch 13: Intégration données

### Frontend
- [ ] Batch 6: Types TypeScript
- [ ] Batch 7: API Client
- [ ] Batch 8: Composants UI (Structure)
- [ ] Batch 9: Composants UI (Fonctionnalités)
- [ ] Batch 10: Intégration page
- [ ] Batch 11: Support Markdown
- [ ] Batch 14: Améliorations UX

---

## 🚨 Gestion des Erreurs

### Si erreur de build TypeScript:
1. Vérifier les types dans `leo-agent.ts`
2. Vérifier les imports
3. Vérifier que tous les types sont définis
4. Utiliser `any` temporairement si nécessaire (à corriger plus tard)

### Si erreur de build Python:
1. Vérifier les imports
2. Vérifier les types avec mypy
3. Vérifier la syntaxe Python
4. Vérifier les dépendances

### Si migration Alembic échoue:
1. Vérifier la syntaxe SQL
2. Vérifier les contraintes
3. Tester la migration sur une DB de test
4. Rollback si nécessaire

---

## 📝 Template de Rapport de Progression

```markdown
# Rapport de Progression - Batch X

**Date:** [Date]
**Batch:** [Numéro et nom]
**Développeur:** [Nom]

## ✅ Réalisations

- [ ] Fichiers créés/modifiés
- [ ] Fonctionnalités implémentées
- [ ] Tests effectués

## 🔍 Vérifications

### Backend
- [ ] Pas d'erreurs Python (linting)
- [ ] Pas d'erreurs de type (mypy)
- [ ] Migration Alembic OK
- [ ] API démarre correctement

### Frontend
- [ ] Pas d'erreurs TypeScript
- [ ] Pas d'erreurs de build
- [ ] Composants compilent
- [ ] Tests manuels OK

## ⚠️ Problèmes Rencontrés

[Aucun / Liste des problèmes]

## 📝 Notes pour le Batch Suivant

[Notes importantes]

## 🎯 Prochaines Étapes

- [ ] Batch X+1: [Description]
```

---

## 🎯 Objectif Final

À la fin de tous les batches:
- ✅ Leo peut accéder aux données ERP
- ✅ Conversations sauvegardées
- ✅ Contexte utilisateur enrichi
- ✅ Interface moderne avec sidebar
- ✅ Support markdown
- ✅ Pas d'erreurs de build
- ✅ Pas d'erreurs TypeScript
- ✅ Code prêt pour production

---

**Dernière mise à jour:** 2025-01-27
