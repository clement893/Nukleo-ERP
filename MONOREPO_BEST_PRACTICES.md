# Meilleures Pratiques pour Monorepos

**Date:** 2025-01-27  
**Contexte:** Nukleo-ERP - Monorepo Fullstack (FastAPI + Next.js)

---

## 🎯 Principes Fondamentaux

### 1. **Séparation par Domaine Fonctionnel, pas par Type Technique**

❌ **Mauvaise pratique:**
```
backend/app/
├── models/          # Tous les modèles mélangés
├── services/        # Tous les services mélangés
└── api/             # Tous les endpoints mélangés
```

✅ **Bonne pratique:**
```
backend/app/
├── modules/
│   ├── leo/
│   │   ├── models/
│   │   ├── services/
│   │   └── api/
│   ├── commercial/
│   │   ├── models/
│   │   ├── services/
│   │   └── api/
│   └── erp/
│       ├── models/
│       ├── services/
│       └── api/
└── core/            # Code partagé (auth, database, etc.)
```

---

## 📦 Structure Recommandée pour Monorepo

### Structure Globale

```
monorepo/
├── apps/                    # Applications déployables
│   ├── web/                # Frontend Next.js
│   └── admin/              # Admin panel (optionnel)
│
├── packages/                # Packages partagés
│   ├── types/              # Types TypeScript partagés
│   ├── ui/                 # Composants UI partagés (optionnel)
│   └── utils/              # Utilitaires partagés (optionnel)
│
├── backend/                 # Backend FastAPI
│   ├── app/
│   │   ├── core/           # Configuration partagée
│   │   ├── modules/         # Modules métier isolés
│   │   │   ├── leo/
│   │   │   ├── commercial/
│   │   │   └── erp/
│   │   └── shared/          # Code partagé entre modules
│   │       ├── models/      # Modèles partagés (User, etc.)
│   │       └── services/    # Services partagés (auth, etc.)
│   └── alembic/             # Migrations DB
│
├── scripts/                 # Scripts d'automatisation
├── docs/                    # Documentation
└── templates/               # Templates de modules
```

---

## 🏗️ Architecture Modulaire (Backend)

### Niveau 1: Modules Isolés (Recommandé pour nouveaux modules)

```
backend/app/modules/leo/
├── __init__.py
├── models/                  # Modèles spécifiques au module
│   ├── __init__.py
│   ├── conversation.py
│   └── documentation.py
├── schemas/                 # Schémas Pydantic spécifiques
│   ├── __init__.py
│   ├── conversation.py
│   └── documentation.py
├── services/                # Logique métier du module
│   ├── __init__.py
│   └── agent_service.py
├── api/                     # Endpoints API du module
│   ├── __init__.py
│   ├── router.py           # Router principal du module
│   └── endpoints/
│       ├── __init__.py
│       ├── agent.py
│       └── documentation.py
└── tests/                   # Tests spécifiques au module
    └── test_agent_service.py
```

**Avantages:**
- ✅ Isolation complète
- ✅ Facile à extraire/remplacer
- ✅ Tests isolés
- ✅ Dépendances claires

**Dépendances autorisées:**
- `app.core.*` - Configuration partagée
- `app.shared.models.*` - Modèles partagés (User, etc.)
- `app.shared.services.*` - Services partagés (auth, rbac, etc.)

---

### Niveau 2: Modules Partiels (Pragmatique pour migration)

```
backend/app/modules/leo/
├── api/
│   └── router.py          # Router isolé
└── services/
    └── agent_service.py    # Service isolé

# Modèles et schémas restent dans app/models/ et app/schemas/
```

**Avantages:**
- ✅ Cohérent avec structure existante
- ✅ Migration progressive possible
- ✅ Moins de refactoring

**Inconvénients:**
- ⚠️ Modèles toujours dispersés
- ⚠️ Pas complètement isolé

---

### Niveau 3: Endpoints Groupés (Actuel)

```
backend/app/api/v1/endpoints/
├── leo_agent.py
├── leo_documentation.py
├── commercial/
│   └── contacts.py
└── erp/
    └── clients.py
```

**Avantages:**
- ✅ Cohérent avec structure actuelle
- ✅ Aucun changement nécessaire

**Inconvénients:**
- ❌ Pas isolé
- ❌ Modèles/services dispersés
- ❌ Difficile à maintenir à grande échelle

---

## 🎨 Frontend: Organisation par Feature

### Structure Recommandée

```
apps/web/src/
├── app/                     # Next.js App Router
│   └── [locale]/
│       └── dashboard/
│           ├── leo/         # Feature Leo
│           ├── commercial/  # Feature Commercial
│           └── erp/         # Feature ERP
│
├── components/
│   ├── ui/                  # Composants UI de base
│   ├── leo/                 # Composants spécifiques Leo
│   ├── commercial/          # Composants spécifiques Commercial
│   └── shared/               # Composants partagés
│
├── lib/
│   ├── api/
│   │   ├── client.ts        # Client API partagé
│   │   ├── leo-agent.ts     # API Leo
│   │   └── commercial.ts   # API Commercial
│   └── utils/               # Utilitaires partagés
│
└── hooks/
    ├── useLeo.ts            # Hooks spécifiques Leo
    └── shared/              # Hooks partagés
```

**Principe:** Un dossier par feature, composants colocalisés avec leur logique.

---

## 📋 Règles d'Or pour Monorepos

### 1. **Colocalisation**
> "Keep related code close together"

✅ **Bon:**
```
modules/leo/
├── models/conversation.py
├── services/agent_service.py
└── api/endpoints/agent.py
```

❌ **Mauvais:**
```
models/leo_conversation.py
services/leo_agent_service.py
api/endpoints/leo_agent.py
```

---

### 2. **Dépendances Unidirectionnelles**
> "Modules should depend on shared code, not on each other"

✅ **Bon:**
```
leo/ → shared/models/User
commercial/ → shared/models/User
erp/ → shared/models/User
```

❌ **Mauvais:**
```
leo/ → commercial/models/Contact
commercial/ → erp/models/Order
```

---

### 3. **API Publique Claire**
> "Expose only what's necessary"

✅ **Bon:**
```python
# modules/leo/api/router.py
router = APIRouter(prefix="/ai/leo", tags=["leo-agent"])

# app/api/v1/router.py
from app.modules.leo.api import router as leo_router
api_router.include_router(leo_router)
```

❌ **Mauvais:**
```python
# Import direct des services internes
from app.modules.leo.services.agent_service import LeoAgentService
```

---

### 4. **Tests Isolés**
> "Each module should have its own test suite"

```
modules/leo/
├── tests/
│   ├── test_models.py
│   ├── test_services.py
│   └── test_api.py
```

---

## 🔄 Migration Progressive

### Stratégie Recommandée

#### Phase 1: Nouveaux Modules (Isolation Complète)
Tous les nouveaux modules suivent la structure modulaire complète:
```
modules/new_feature/
├── models/
├── services/
└── api/
```

#### Phase 2: Migration des Modules Existants
Migrer progressivement les modules existants:
1. Créer `modules/leo/`
2. Déplacer endpoints et services
3. Garder modèles dans `app/models/` temporairement
4. Migrer modèles progressivement

#### Phase 3: Refactoring Complet
Une fois tous les modules migrés, refactorer complètement.

---

## 📊 Comparaison: Monorepo vs Multi-Repo

### Monorepo (Votre Cas)

**Avantages:**
- ✅ Partage de code facile
- ✅ Refactoring cross-module
- ✅ Versioning synchronisé
- ✅ CI/CD simplifié
- ✅ Dépendances gérées centralement

**Inconvénients:**
- ⚠️ Build plus lent (mitigé par Turborepo)
- ⚠️ Permissions granulaires difficiles
- ⚠️ Déploiement couplé (mitigé par services séparés)

**Quand utiliser:**
- Applications liées fonctionnellement
- Partage de code fréquent
- Équipe unifiée
- Déploiement coordonné

---

## 🛠️ Outils Recommandés

### 1. **Turborepo** (Déjà utilisé ✅)
- Builds parallèles
- Caching intelligent
- Task orchestration

### 2. **pnpm Workspaces** (Déjà utilisé ✅)
- Gestion des dépendances
- Hoisting optimisé
- Workspace protocol

### 3. **Changesets** (Recommandé)
- Versioning sémantique
- Changelog automatique
- Release management

### 4. **Nx** (Alternative à Turborepo)
- Plus de fonctionnalités
- Graph de dépendances
- Plus complexe

---

## 📝 Checklist pour Nouveau Module

### Backend

- [ ] Créer `backend/app/modules/nom_module/`
- [ ] Structure: `models/`, `services/`, `api/`
- [ ] Router isolé dans `api/router.py`
- [ ] Enregistrer dans `app/api/v1/router.py`
- [ ] Tests dans `modules/nom_module/tests/`
- [ ] Documentation dans `modules/nom_module/README.md`

### Frontend

- [ ] Créer `apps/web/src/components/nom_module/`
- [ ] Créer `apps/web/src/lib/api/nom_module.ts`
- [ ] Créer `apps/web/src/app/[locale]/dashboard/nom_module/`
- [ ] Hooks dans `apps/web/src/hooks/useNomModule.ts`

### Partagé

- [ ] Types dans `packages/types/src/nom_module.ts`
- [ ] Exports dans `packages/types/src/index.ts`

---

## 🎯 Recommandation pour Leo

### Option Recommandée: **Isolation Progressive**

1. **Court terme:** Créer `modules/leo/` avec endpoints et services
2. **Moyen terme:** Migrer modèles et schémas
3. **Long terme:** Structure complètement isolée

**Avantages:**
- ✅ Cohérent avec structure actuelle
- ✅ Migration progressive sans casser
- ✅ Exemple pour autres modules
- ✅ Amélioration continue

---

## 📚 Références

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Monorepo Best Practices](https://monorepo.tools/)
- [Nx Documentation](https://nx.dev/)

---

## ✅ Conclusion

**Pour votre monorepo, la meilleure pratique est:**

1. **Nouveaux modules:** Structure modulaire complète (`modules/nom_module/`)
2. **Modules existants:** Migration progressive vers structure modulaire
3. **Code partagé:** Dans `core/` et `shared/`
4. **Frontend:** Organisation par feature, colocalisation

**Leo devrait suivre cette structure modulaire pour être un exemple de bonnes pratiques.**

---

**Statut:** Guide de référence  
**Dernière mise à jour:** 2025-01-27
