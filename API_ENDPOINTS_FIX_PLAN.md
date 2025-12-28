# Plan de Correction des Endpoints API

**Date de création:** 2025-01-28  
**Basé sur:** `API_ENDPOINTS_AUDIT_REPORT.md`  
**Objectif:** Corriger tous les problèmes d'endpoints API identifiés dans l'audit

---

## 📋 Vue d'ensemble

### Problèmes identifiés

1. **10 appels `fetch()` qui devraient utiliser `apiClient`**
2. **147 appels `apiClient` sans endpoints correspondants** (beaucoup sont des faux positifs dus à la normalisation)
3. **Endpoints manquants réels** à créer dans le backend
4. **Chemins incorrects** avec doublons de préfixes

### Stratégie globale

- ✅ Corriger par petits batches pour éviter les erreurs de build
- ✅ Valider TypeScript et build après chaque batch
- ✅ Créer un rapport de progression après chaque batch
- ✅ Push après chaque batch
- ✅ Mettre à jour la documentation à la fin

---

## 🔧 Batch 1: Correction des fetch() qui devraient utiliser apiClient

**Priorité:** Haute | **Risque:** Faible | **Effort:** Faible | **Durée estimée:** 30min

### Objectif
Remplacer tous les appels `fetch()` par `apiClient` dans le frontend.

### Fichiers à modifier

1. `apps/web/src/app/[locale]/admin/settings/AdminSettingsContent.tsx`
   - Remplacer `fetch('/api/v1/users/me')` par `apiClient.put('/v1/users/me')`

2. `apps/web/src/app/[locale]/docs/page.tsx`
   - Remplacer `fetch('/api/v1/users')` par `apiClient.get('/v1/users')`

3. `apps/web/src/app/[locale]/upload/page.tsx`
   - Remplacer `fetch('/api/upload/validate')` par `apiClient.post('/v1/media/validate')` ou créer endpoint

4. `apps/web/src/hooks/useCSRF.ts`
   - Vérifier si endpoint CSRF existe, sinon créer ou utiliser alternative

5. `apps/web/src/lib/security/csrf.ts`
   - Vérifier si endpoint CSRF existe, sinon créer ou utiliser alternative

6. `apps/web/src/lib/utils/rateLimiter.ts`
   - Remplacer `fetch('/api/users')` par `apiClient.get('/v1/users')`

### Actions

1. Identifier chaque `fetch()` dans les fichiers listés
2. Remplacer par `apiClient` avec la méthode appropriée
3. Ajouter les imports nécessaires
4. Vérifier que les endpoints existent dans le backend
5. Tester chaque modification

### Validation

- ✅ `cd apps/web && pnpm type-check` - Aucune erreur TypeScript
- ✅ `cd apps/web && pnpm build` - Build réussi
- ✅ Vérifier que tous les `fetch()` identifiés sont remplacés

### Fichiers de rapport
- `PROGRESS_API_FIX_BATCH_1.md` - Rapport de progression

---

## 🔧 Batch 2: Correction des chemins avec doublons de préfixes

**Priorité:** Haute | **Risque:** Moyen | **Effort:** Moyen | **Durée estimée:** 1h

### Objectif
Corriger les chemins qui ont des doublons de préfixes (ex: `/api/v1/announcements/announcements/...`).

### Problèmes identifiés

1. **Announcements:**
   - `/api/v1/announcements/announcements/${id}/dismiss` → `/v1/announcements/${id}/dismiss`

2. **Backups:**
   - `/api/v1/backups/backups/${id}/restore` → `/v1/backups/${id}/restore`
   - `/api/v1/backups/backups/${id}` → `/v1/backups/${id}`

3. **Comments:**
   - `/api/v1/comments/comments` → `/v1/comments`
   - `/api/v1/comments/comments/${id}` → `/v1/comments/${id}`

4. **Documentation:**
   - `/api/v1/documentation/documentation/articles/${id}/feedback` → `/v1/documentation/articles/${id}/feedback`

5. **Email Templates:**
   - `/api/v1/email-templates/email-templates/${id}` → `/v1/email-templates/${id}`

6. **Favorites:**
   - `/api/v1/favorites/favorites` → `/v1/favorites`

7. **Feature Flags:**
   - `/api/v1/feature-flags/feature-flags/${id}` → `/v1/feature-flags/${id}`

8. **Onboarding:**
   - `/api/v1/onboarding/onboarding/initialize` → `/v1/onboarding/initialize`
   - `/api/v1/onboarding/onboarding/steps/${key}/complete` → `/v1/onboarding/steps/${key}/complete`

9. **Scheduled Tasks:**
   - `/api/v1/scheduled-tasks/scheduled-tasks/${id}` → `/v1/scheduled-tasks/${id}`

10. **Shares:**
    - `/api/v1/shares/shares` → `/v1/shares`
    - `/api/v1/shares/shares/${id}` → `/v1/shares/${id}`

11. **Tags:**
    - `/api/v1/tags/tags/${id}` → `/v1/tags/${id}`

12. **Templates:**
    - `/api/v1/templates/templates/${id}` → `/v1/templates/${id}`

13. **Versions:**
    - `/api/v1/versions/versions/${id}/restore` → `/v1/versions/${id}/restore`
    - `/api/v1/versions/versions/${entityType}/${entityId}/compare` → `/v1/versions/${entityType}/${entityId}/compare`

### Actions

1. Identifier tous les fichiers avec des chemins dupliqués
2. Corriger chaque chemin pour enlever le doublon
3. Vérifier que les endpoints backend existent avec les bons chemins
4. Tester chaque modification

### Validation

- ✅ `cd apps/web && pnpm type-check` - Aucune erreur TypeScript
- ✅ `cd apps/web && pnpm build` - Build réussi
- ✅ Vérifier que tous les chemins sont corrects

### Fichiers de rapport
- `PROGRESS_API_FIX_BATCH_2.md` - Rapport de progression

---

## 🔧 Batch 3: Création des endpoints manquants (Partie 1 - Critiques)

**Priorité:** Haute | **Risque:** Moyen | **Effort:** Élevé | **Durée estimée:** 2h

### Objectif
Créer les endpoints backend manquants qui sont critiques pour le fonctionnement de l'application.

### Endpoints à créer

1. **GET `/v1/tags/categories/tree`**
   - Fichier: `backend/app/api/v1/endpoints/tags.py`
   - Description: Retourner l'arbre hiérarchique des catégories
   - Utilisé dans: `apps/web/src/app/[locale]/content/categories/page.tsx`

2. **GET `/v1/users/preferences/notifications`**
   - Fichier: `backend/app/api/v1/endpoints/user_preferences.py`
   - Description: Récupérer les préférences de notifications d'un utilisateur
   - Utilisé dans: `apps/web/src/app/[locale]/profile/notifications/page.tsx`

3. **PUT `/v1/users/preferences/notifications`**
   - Fichier: `backend/app/api/v1/endpoints/user_preferences.py`
   - Description: Mettre à jour les préférences de notifications
   - Utilisé dans: `apps/web/src/app/[locale]/profile/notifications/page.tsx`

4. **GET `/v1/admin/tenancy/config`**
   - Fichier: `backend/app/api/v1/endpoints/admin.py` ou nouveau fichier
   - Description: Récupérer la configuration de tenancy
   - Utilisé dans: `apps/web/src/app/[locale]/admin/tenancy/TenancyContent.tsx`

5. **PUT `/v1/admin/tenancy/config`**
   - Fichier: `backend/app/api/v1/endpoints/admin.py` ou nouveau fichier
   - Description: Mettre à jour la configuration de tenancy
   - Utilisé dans: `apps/web/src/app/[locale]/admin/tenancy/TenancyContent.tsx`

6. **POST `/v1/media/validate`** (si nécessaire)
   - Fichier: `backend/app/api/v1/endpoints/media.py`
   - Description: Valider un fichier avant upload
   - Utilisé dans: `apps/web/src/app/[locale]/upload/page.tsx`

### Actions

1. Créer chaque endpoint dans le fichier approprié
2. Ajouter les schémas Pydantic nécessaires
3. Ajouter la documentation OpenAPI
4. Ajouter les vérifications de permissions nécessaires
5. Tester chaque endpoint

### Validation

- ✅ `cd backend && python -m py_compile app/api/v1/endpoints/*.py` - Aucune erreur Python
- ✅ Vérifier que les endpoints répondent correctement
- ✅ `cd apps/web && pnpm type-check` - Aucune erreur TypeScript

### Fichiers de rapport
- `PROGRESS_API_FIX_BATCH_3.md` - Rapport de progression

---

## 🔧 Batch 4: Création des endpoints manquants (Partie 2 - Non-critiques)

**Priorité:** Moyenne | **Risque:** Faible | **Effort:** Moyen | **Durée estimée:** 1.5h

### Objectif
Créer les endpoints backend manquants qui sont moins critiques mais toujours nécessaires.

### Endpoints à créer

1. **GET `/v1/rbac/roles`** (avec pagination)
   - Fichier: `backend/app/api/v1/endpoints/rbac.py`
   - Description: Liste des rôles avec pagination (skip/limit)
   - Utilisé dans: `apps/web/src/components/admin/TeamManagement.tsx`

2. **PUT `/v1/scheduled-tasks/${id}`**
   - Fichier: `backend/app/api/v1/endpoints/scheduled_tasks.py`
   - Description: Mettre à jour une tâche planifiée
   - Utilisé dans: `apps/web/src/app/[locale]/content/schedule/page.tsx`

3. **DELETE `/v1/scheduled-tasks/${id}`**
   - Fichier: `backend/app/api/v1/endpoints/scheduled_tasks.py`
   - Description: Supprimer une tâche planifiée
   - Utilisé dans: `apps/web/src/app/[locale]/content/schedule/page.tsx`

4. **PUT `/v1/content/schedule/${id}/toggle`**
   - Fichier: `backend/app/api/v1/endpoints/scheduled_tasks.py` ou nouveau fichier
   - Description: Activer/désactiver une tâche planifiée
   - Utilisé dans: `apps/web/src/app/[locale]/content/schedule/page.tsx`

5. **PUT `/v1/tags/${id}`**
   - Fichier: `backend/app/api/v1/endpoints/tags.py`
   - Description: Mettre à jour un tag
   - Utilisé dans: `apps/web/src/app/[locale]/content/tags/page.tsx`

6. **DELETE `/v1/tags/${id}`**
   - Fichier: `backend/app/api/v1/endpoints/tags.py`
   - Description: Supprimer un tag
   - Utilisé dans: `apps/web/src/app/[locale]/content/tags/page.tsx`

7. **GET `/v1/tags/`** (liste)
   - Fichier: `backend/app/api/v1/endpoints/tags.py`
   - Description: Liste des tags
   - Utilisé dans: `apps/web/src/app/[locale]/content/tags/page.tsx`

### Actions

1. Créer chaque endpoint dans le fichier approprié
2. Ajouter les schémas Pydantic nécessaires
3. Ajouter la documentation OpenAPI
4. Ajouter les vérifications de permissions nécessaires
5. Tester chaque endpoint

### Validation

- ✅ `cd backend && python -m py_compile app/api/v1/endpoints/*.py` - Aucune erreur Python
- ✅ Vérifier que les endpoints répondent correctement
- ✅ `cd apps/web && pnpm type-check` - Aucune erreur TypeScript

### Fichiers de rapport
- `PROGRESS_API_FIX_BATCH_4.md` - Rapport de progression

---

## 🔧 Batch 5: Correction des chemins d'authentification

**Priorité:** Haute | **Risque:** Faible | **Effort:** Faible | **Durée estimée:** 30min

### Objectif
Corriger les chemins d'authentification pour qu'ils correspondent aux endpoints backend.

### Problèmes identifiés

Dans `apps/web/src/lib/api.ts`:
- `POST /v1/auth/refresh` → Vérifier le chemin réel dans `auth.py`
- `POST /v1/auth/login` → Vérifier le chemin réel dans `auth.py`
- `POST /v1/auth/register` → Vérifier le chemin réel dans `auth.py`
- `POST /v1/auth/logout` → Vérifier le chemin réel dans `auth.py`
- `GET /v1/auth/google` → Vérifier le chemin réel dans `auth.py`

### Actions

1. Vérifier les chemins réels dans `backend/app/api/v1/endpoints/auth.py`
2. Corriger les chemins dans `apps/web/src/lib/api.ts`
3. Vérifier que tous les appels fonctionnent

### Validation

- ✅ `cd apps/web && pnpm type-check` - Aucune erreur TypeScript
- ✅ `cd apps/web && pnpm build` - Build réussi
- ✅ Vérifier que l'authentification fonctionne

### Fichiers de rapport
- `PROGRESS_API_FIX_BATCH_5.md` - Rapport de progression

---

## 🔧 Batch 6: Correction des endpoints DELETE manquants

**Priorité:** Moyenne | **Risque:** Faible | **Effort:** Faible | **Durée estimée:** 45min

### Objectif
Vérifier et créer les endpoints DELETE manquants identifiés dans l'audit.

### Endpoints à vérifier/créer

1. **DELETE `/v1/media/${id}`**
   - Fichier: `backend/app/api/v1/endpoints/media.py`
   - Utilisé dans: `apps/web/src/lib/api/media.ts`

2. **DELETE `/v1/notifications/${id}`**
   - Fichier: `backend/app/api/v1/endpoints/notifications.py` (peut-être déjà existant)
   - Utilisé dans: `apps/web/src/lib/api/notifications.ts`

3. **DELETE `/v1/pages/${id}`**
   - Fichier: `backend/app/api/v1/endpoints/pages.py`
   - Utilisé dans: `apps/web/src/lib/api/pages.ts`
   - Note: L'endpoint existe peut-être avec `/pages/{slug}` au lieu de `/{id}`

4. **DELETE `/v1/posts/${id}`**
   - Fichier: `backend/app/api/v1/endpoints/posts.py`
   - Utilisé dans: `apps/web/src/lib/api/posts.ts`
   - Note: L'endpoint existe peut-être avec `/posts/{slug}` au lieu de `/{id}`

5. **DELETE `/v1/reports/${id}`**
   - Fichier: `backend/app/api/v1/endpoints/reports.py`
   - Utilisé dans: `apps/web/src/lib/api/reports.ts`

### Actions

1. Vérifier si chaque endpoint existe déjà (peut-être avec un chemin différent)
2. Créer les endpoints manquants
3. Corriger les appels frontend si nécessaire
4. Tester chaque endpoint

### Validation

- ✅ `cd backend && python -m py_compile app/api/v1/endpoints/*.py` - Aucune erreur Python
- ✅ Vérifier que les endpoints répondent correctement
- ✅ `cd apps/web && pnpm type-check` - Aucune erreur TypeScript

### Fichiers de rapport
- `PROGRESS_API_FIX_BATCH_6.md` - Rapport de progression

---

## 🔧 Batch 7: Vérification et correction des endpoints RBAC

**Priorité:** Moyenne | **Risque:** Faible | **Effort:** Faible | **Durée estimée:** 30min

### Objectif
Vérifier que tous les endpoints RBAC utilisés dans le frontend existent dans le backend.

### Endpoints à vérifier

Dans `apps/web/src/lib/api/rbac.ts`:
1. **DELETE `/v1/rbac/roles/${roleId}`** - Vérifier si existe
2. **DELETE `/v1/rbac/roles/${roleId}/permissions/${permissionId}`** - Vérifier si existe
3. **DELETE `/v1/rbac/users/${userId}/roles/${roleId}`** - Vérifier si existe
4. **DELETE `/v1/rbac/users/${userId}/permissions/custom/${permissionId}`** - Vérifier si existe

### Actions

1. Vérifier chaque endpoint dans `backend/app/api/v1/endpoints/rbac.py`
2. Créer les endpoints manquants
3. Corriger les chemins si nécessaire
4. Tester chaque endpoint

### Validation

- ✅ `cd backend && python -m py_compile app/api/v1/endpoints/rbac.py` - Aucune erreur Python
- ✅ Vérifier que les endpoints répondent correctement
- ✅ `cd apps/web && pnpm type-check` - Aucune erreur TypeScript

### Fichiers de rapport
- `PROGRESS_API_FIX_BATCH_7.md` - Rapport de progression

---

## 🔧 Batch 8: Vérification finale et tests

**Priorité:** Haute | **Risque:** Faible | **Effort:** Moyen | **Durée estimée:** 1h

### Objectif
Vérifier que tous les problèmes identifiés sont résolus et tester l'application.

### Actions

1. Relancer l'audit pour vérifier les problèmes restants
2. Tester les fonctionnalités critiques
3. Vérifier qu'il n'y a pas de régressions
4. Corriger les derniers problèmes identifiés

### Validation

- ✅ `cd apps/web && pnpm type-check` - Aucune erreur TypeScript
- ✅ `cd apps/web && pnpm build` - Build réussi
- ✅ `cd backend && python -m py_compile app/api/v1/endpoints/*.py` - Aucune erreur Python
- ✅ Relancer `node scripts/audit-api-endpoints.js` - Vérifier que les problèmes sont résolus

### Fichiers de rapport
- `PROGRESS_API_FIX_BATCH_8.md` - Rapport de progression

---

## 🔧 Batch 9: Mise à jour de la documentation

**Priorité:** Haute | **Risque:** Très Faible | **Effort:** Moyen | **Durée estimée:** 1h

### Objectif
Mettre à jour toute la documentation pour refléter les corrections apportées.

### Fichiers à mettre à jour

1. **README.md**
   - Ajouter une note sur les corrections d'endpoints API
   - Mettre à jour les exemples d'utilisation de l'API

2. **docs/DEVELOPMENT.md**
   - Ajouter une section sur l'utilisation de `apiClient` vs `fetch()`
   - Documenter les bonnes pratiques pour les appels API

3. **docs/API_CONNECTION_CHECKER.md**
   - Mettre à jour avec les nouveaux endpoints
   - Ajouter des exemples de tests

4. **API_ENDPOINTS_AUDIT_REPORT.md**
   - Ajouter une section "Corrections appliquées"
   - Documenter les endpoints créés

5. **TEMPLATE_UPDATES.md**
   - Ajouter une section sur les corrections d'endpoints API
   - Documenter les améliorations apportées

6. **CHANGELOG.md**
   - Ajouter une entrée pour les corrections d'endpoints API

### Actions

1. Réviser tous les fichiers de documentation
2. Mettre à jour les exemples de code
3. Ajouter des notes sur les améliorations récentes
4. Vérifier que tous les liens fonctionnent

### Validation

- ✅ Tous les fichiers de documentation sont à jour
- ✅ Les exemples de code fonctionnent
- ✅ Les liens sont valides

### Fichiers de rapport
- `PROGRESS_API_FIX_BATCH_9.md` - Rapport de progression

---

## ✅ Checklist de Validation Globale

### Avant chaque Batch

- [ ] Lire le plan du batch
- [ ] Vérifier les prérequis
- [ ] Créer une branche si nécessaire

### Après chaque Batch

- [ ] Vérifier TypeScript: `cd apps/web && pnpm type-check`
- [ ] Vérifier Build: `cd apps/web && pnpm build`
- [ ] Vérifier Python: `cd backend && python -m py_compile app/api/v1/endpoints/*.py`
- [ ] Créer le rapport de progression
- [ ] Commit et push les changements
- [ ] Marquer le batch comme complété

### Validation Finale

- [ ] Tous les batches sont complétés
- [ ] Aucune erreur TypeScript
- [ ] Build réussi
- [ ] Tous les endpoints fonctionnent
- [ ] Documentation mise à jour
- [ ] Audit final passé

---

## 📊 Estimation Totale

- **Durée totale estimée:** ~8 heures
- **Nombre de batches:** 9
- **Risque global:** Faible (corrections incrémentales)
- **Impact:** Amélioration significative de la cohérence API

---

## 🔗 Liens Utiles

- [API_ENDPOINTS_AUDIT_REPORT.md](./API_ENDPOINTS_AUDIT_REPORT.md) - Rapport d'audit complet
- [CODE_FIX_PLAN.md](./CODE_FIX_PLAN.md) - Plan de correction précédent (référence)
- [BATCH_EXECUTION_GUIDE.md](./BATCH_EXECUTION_GUIDE.md) - Guide d'exécution des batches

---

**Plan créé le:** 2025-01-28  
**Version:** 1.0.0
