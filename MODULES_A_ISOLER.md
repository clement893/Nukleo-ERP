# Modules à Isoler - Plan d'Isolation Complète

**Date**: 30 décembre 2025  
**Objectif**: Identifier tous les modules métier à isoler pour une architecture modulaire complète

---

## 📊 État Actuel de l'Isolation

### ✅ Modules Déjà Isolés (Partiellement)

| Module | Backend | Frontend | Statut | Priorité |
|--------|---------|----------|--------|----------|
| **Réseau** | ✅ Endpoints isolés | ✅ Composants isolés | ✅ **Bien isolé** | - |
| **Commercial** | ⚠️ Endpoints groupés | ✅ Composants isolés | ⚠️ **Partiel** | 🔴 Haute |
| **ERP** | ⚠️ Endpoints groupés | ✅ Composants isolés | ⚠️ **Partiel** | 🔴 Haute |
| **Finances** | ⚠️ Endpoints groupés | ✅ Pages isolées | ⚠️ **Partiel** | 🟡 Moyenne |
| **Client Portal** | ⚠️ Endpoints groupés | ✅ Composants isolés | ⚠️ **Partiel** | 🟡 Moyenne |
| **Agenda** | ⚠️ Endpoints groupés | ✅ Composants isolés | ⚠️ **Partiel** | 🟡 Moyenne |
| **Leo** | ⚠️ Endpoints dispersés | ✅ Composants isolés | ⚠️ **Partiel** | 🔴 Haute |

### ❌ Modules Non Isolés (Endpoints Individuels)

| Module | Backend | Frontend | Statut | Priorité |
|--------|---------|----------|--------|----------|
| **Projects** | ❌ Endpoint unique | ✅ Pages isolées | ❌ **Non isolé** | 🟡 Moyenne |
| **Themes** | ❌ Endpoints dispersés | ✅ Composants isolés | ❌ **Non isolé** | 🟢 Faible |
| **Users** | ❌ Endpoint unique | ⚠️ Composants dispersés | ❌ **Non isolé** | 🟡 Moyenne |
| **Teams** | ❌ Endpoint unique | ✅ Composants isolés | ❌ **Non isolé** | 🟡 Moyenne |
| **RBAC** | ❌ Endpoint unique | ✅ Composants isolés | ❌ **Non isolé** | 🟡 Moyenne |
| **Subscriptions** | ❌ Endpoint unique | ✅ Composants isolés | ❌ **Non isolé** | 🟡 Moyenne |
| **Content (CMS)** | ❌ Endpoints dispersés | ✅ Composants isolés | ❌ **Non isolé** | 🟡 Moyenne |
| **Analytics** | ❌ Endpoint unique | ✅ Composants isolés | ❌ **Non isolé** | 🟢 Faible |
| **Management** | ❌ Endpoints dispersés | ✅ Pages isolées | ❌ **Non isolé** | 🟡 Moyenne |

---

## 🎯 Modules Métier Principaux à Isoler

### 🔴 Priorité Haute (Modules Core Business)

#### 1. **Module Commercial** ⚠️ Partiellement Isolé

**État actuel**:
- ✅ Endpoints groupés dans `backend/app/api/v1/endpoints/commercial/`
- ✅ Composants isolés dans `apps/web/src/components/commercial/`
- ❌ Modèles dispersés dans `backend/app/models/` (Contact, Company)
- ❌ Services dispersés dans `backend/app/services/`

**À isoler**:
```
backend/app/modules/commercial/
├── models/
│   ├── contact.py
│   ├── company.py
│   ├── opportunity.py
│   ├── quote.py
│   └── submission.py
├── schemas/
│   ├── contact.py
│   ├── company.py
│   └── ...
├── services/
│   ├── contact_service.py
│   ├── company_service.py
│   └── ...
├── api/
│   └── router.py  # Regroupe tous les endpoints commerciaux
└── tests/
```

**Frontend**:
- ✅ Déjà bien isolé (`components/commercial/`)
- ⚠️ Créer `lib/api/commercial.ts` unifié
- ⚠️ Créer `lib/query/commercial.ts` unifié

**Complexité**: 🟡 Moyenne (5-7 jours)

---

#### 2. **Module ERP** ⚠️ Partiellement Isolé

**État actuel**:
- ✅ Endpoints groupés dans `backend/app/api/v1/endpoints/erp/`
- ✅ Composants isolés dans `apps/web/src/components/erp/`
- ❌ Modèles dispersés (probablement)
- ❌ Services dispersés

**À isoler**:
```
backend/app/modules/erp/
├── models/
│   ├── erp_client.py
│   ├── erp_order.py
│   ├── erp_invoice.py
│   └── erp_inventory.py
├── schemas/
├── services/
│   └── erp_service.py
├── api/
│   └── router.py
└── tests/
```

**Complexité**: 🟡 Moyenne (5-7 jours)

---

#### 3. **Module Leo (AI Agent)** ⚠️ Partiellement Isolé

**État actuel**:
- ⚠️ Endpoints dispersés (`leo_agent.py`, `leo_documentation.py`)
- ✅ Composants isolés dans `apps/web/src/components/leo/`
- ⚠️ Modèles dans `backend/app/models/` (leo_conversation, leo_documentation)
- ⚠️ Services dans `backend/app/services/` (leo_agent_service)

**À isoler**:
```
backend/app/modules/leo/
├── models/
│   ├── conversation.py
│   └── documentation.py
├── schemas/
├── services/
│   └── agent_service.py
├── api/
│   └── router.py  # Regroupe leo_agent + leo_documentation
└── tests/
```

**Complexité**: 🟡 Moyenne (4-6 jours)

---

### 🟡 Priorité Moyenne (Modules Importants)

#### 4. **Module Finances** ⚠️ Partiellement Isolé

**État actuel**:
- ✅ Endpoints groupés dans `backend/app/api/v1/endpoints/finances/`
- ✅ Pages isolées dans `apps/web/src/app/[locale]/dashboard/finances/`
- ❌ Composants probablement dispersés

**À isoler**:
```
backend/app/modules/finances/
├── models/
├── schemas/
├── services/
├── api/
│   └── router.py
└── tests/
```

**Complexité**: 🟢 Faible (3-4 jours)

---

#### 5. **Module Projects** ❌ Non Isolé

**État actuel**:
- ❌ Endpoint unique `projects.py`
- ✅ Pages isolées dans `apps/web/src/app/[locale]/dashboard/projets/`
- ⚠️ Composants probablement dispersés

**À isoler**:
```
backend/app/modules/projects/
├── models/
│   └── project.py
├── schemas/
├── services/
├── api/
│   └── router.py
└── tests/
```

**Complexité**: 🟡 Moyenne (4-5 jours)

---

#### 6. **Module Content/CMS** ❌ Non Isolé

**État actuel**:
- ❌ Endpoints dispersés (`pages.py`, `posts.py`, `templates.py`, `menus.py`)
- ✅ Composants isolés dans `apps/web/src/components/cms/`, `content/`, `blog/`

**À isoler**:
```
backend/app/modules/content/
├── models/
│   ├── page.py
│   ├── post.py
│   ├── template.py
│   └── menu.py
├── schemas/
├── services/
├── api/
│   └── router.py  # Regroupe tous les endpoints CMS
└── tests/
```

**Complexité**: 🔴 Élevée (7-10 jours - beaucoup d'endpoints)

---

#### 7. **Module Management** ❌ Non Isolé

**État actuel**:
- ❌ Endpoints dispersés (`employees.py`, `project_tasks.py`, etc.)
- ✅ Pages isolées dans `apps/web/src/app/[locale]/dashboard/management/`

**À isoler**:
```
backend/app/modules/management/
├── models/
│   ├── employee.py
│   └── time_sheet.py
├── schemas/
├── services/
├── api/
│   └── router.py
└── tests/
```

**Complexité**: 🟡 Moyenne (5-6 jours)

---

#### 8. **Module Client Portal** ⚠️ Partiellement Isolé

**État actuel**:
- ✅ Endpoints groupés dans `backend/app/api/v1/endpoints/client/`
- ✅ Composants isolés dans `apps/web/src/components/client/`

**À isoler**:
```
backend/app/modules/client-portal/
├── models/  # Probablement partagés avec ERP
├── schemas/
├── services/
├── api/
│   └── router.py
└── tests/
```

**Complexité**: 🟢 Faible (3-4 jours)

---

#### 9. **Module Agenda** ⚠️ Partiellement Isolé

**État actuel**:
- ✅ Endpoints groupés dans `backend/app/api/v1/endpoints/agenda/`
- ✅ Composants isolés dans `apps/web/src/components/agenda/`

**À isoler**:
```
backend/app/modules/agenda/
├── models/
│   └── calendar_event.py
├── schemas/
├── services/
├── api/
│   └── router.py
└── tests/
```

**Complexité**: 🟢 Faible (3-4 jours)

---

### 🟢 Priorité Faible (Modules Utilitaires)

#### 10. **Module Themes** ❌ Non Isolé

**État actuel**:
- ❌ Endpoints dispersés (`themes.py`, `theme_fonts.py`)
- ✅ Composants isolés dans `apps/web/src/components/theme/`

**Complexité**: 🟢 Faible (2-3 jours)

#### 11. **Module Analytics** ❌ Non Isolé

**État actuel**:
- ❌ Endpoint unique `analytics.py`
- ✅ Composants isolés dans `apps/web/src/components/analytics/`

**Complexité**: 🟢 Faible (2-3 jours)

---

## 📋 Modules Système (À Garder dans Core)

Ces modules sont **système** et doivent rester dans `app/core/` ou `app/shared/`:

- ✅ **Auth** - Authentification (core)
- ✅ **Users** - Gestion utilisateurs (shared)
- ✅ **Teams** - Gestion équipes (shared)
- ✅ **RBAC** - Permissions (core)
- ✅ **Settings** - Paramètres système (core)
- ✅ **Notifications** - Système de notifications (shared)
- ✅ **Media** - Gestion fichiers (shared)
- ✅ **Subscriptions** - Gestion abonnements (shared - peut être isolé si besoin)

**Raison**: Ces modules sont utilisés par TOUS les autres modules, donc doivent rester accessibles.

---

## 🎯 Plan d'Isolation Recommandé

### Phase 1: Modules Core Business (2-3 mois)

1. ✅ **Commercial** (5-7 jours)
2. ✅ **ERP** (5-7 jours)
3. ✅ **Leo** (4-6 jours)

**Total**: ~15-20 jours de travail

### Phase 2: Modules Importants (1-2 mois)

4. ✅ **Finances** (3-4 jours)
5. ✅ **Projects** (4-5 jours)
6. ✅ **Management** (5-6 jours)
7. ✅ **Client Portal** (3-4 jours)
8. ✅ **Agenda** (3-4 jours)

**Total**: ~20-25 jours de travail

### Phase 3: Modules CMS et Utilitaires (1 mois)

9. ✅ **Content/CMS** (7-10 jours)
10. ✅ **Themes** (2-3 jours)
11. ✅ **Analytics** (2-3 jours)

**Total**: ~11-16 jours de travail

---

## 📊 Résumé par Priorité

### 🔴 Priorité Haute (3 modules)
- Commercial
- ERP
- Leo

### 🟡 Priorité Moyenne (6 modules)
- Finances
- Projects
- Content/CMS
- Management
- Client Portal
- Agenda

### 🟢 Priorité Faible (2 modules)
- Themes
- Analytics

### ⚪ Modules Système (À garder dans core)
- Auth, Users, Teams, RBAC, Settings, Notifications, Media, Subscriptions

---

## 🏗️ Structure Modulaire Cible

```
backend/app/
├── core/                        ✅ Code système partagé
│   ├── database.py
│   ├── config.py
│   ├── permissions.py
│   └── auth.py
│
├── shared/                      ✅ Code partagé entre modules
│   ├── models/
│   │   ├── user.py
│   │   ├── team.py
│   │   └── notification.py
│   └── services/
│       └── media_service.py
│
└── modules/                     ✅ Modules métier isolés
    ├── commercial/
    │   ├── models/
    │   ├── services/
    │   ├── api/
    │   └── tests/
    ├── erp/
    ├── leo/
    ├── reseau/                  ✅ Déjà isolé
    ├── finances/
    ├── projects/
    ├── content/
    ├── management/
    ├── client-portal/
    └── agenda/
```

---

## ✅ Checklist d'Isolation par Module

Pour chaque module, vérifier:

### Backend
- [ ] Créer `backend/app/modules/nom_module/`
- [ ] Déplacer modèles dans `modules/nom_module/models/`
- [ ] Déplacer schémas dans `modules/nom_module/schemas/`
- [ ] Déplacer services dans `modules/nom_module/services/`
- [ ] Créer router unifié dans `modules/nom_module/api/router.py`
- [ ] Enregistrer dans `app/api/v1/router.py`
- [ ] Créer tests dans `modules/nom_module/tests/`

### Frontend
- [ ] Vérifier composants isolés dans `components/nom_module/`
- [ ] Créer client API unifié dans `lib/api/nom_module.ts`
- [ ] Créer hooks React Query dans `lib/query/nom_module.ts`
- [ ] Vérifier pages isolées dans `app/[locale]/dashboard/nom_module/`

### Documentation
- [ ] Créer `modules/nom_module/README.md`
- [ ] Documenter les dépendances
- [ ] Documenter l'API publique

---

## 🎯 Recommandation Finale

**Ordre d'isolation recommandé**:

1. **Commercial** (exemple le plus important, beaucoup utilisé)
2. **ERP** (module métier critique)
3. **Leo** (module récent, plus facile à migrer)
4. **Finances** (petit module, bon pour valider la méthode)
5. **Projects** (module moyen)
6. **Management** (module moyen)
7. **Client Portal** (petit module)
8. **Agenda** (petit module)
9. **Content/CMS** (gros module, à faire en dernier)
10. **Themes** et **Analytics** (modules utilitaires)

**Durée totale estimée**: 3-4 mois de travail pour une équipe de 2-3 développeurs

---

**Document créé par**: Assistant IA  
**Date**: 30 décembre 2025  
**Prochaine étape**: Commencer l'isolation du module Commercial
