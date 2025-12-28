# Plan d'Implémentation du Système de Notifications

## 📋 Vue d'ensemble

Ce document décrit le plan d'implémentation par lots pour ajouter un système de notifications complet et fonctionnel au template Next.js Fullstack, en évitant les erreurs de build et TypeScript.

**État actuel:**
- ✅ Composants frontend existants (NotificationCenter, NotificationBell)
- ✅ WebSocket endpoint partiellement implémenté
- ✅ Celery tasks pour envoi de notifications
- ❌ Modèle de base de données manquant
- ❌ API endpoints manquants
- ❌ Hooks frontend manquants
- ❌ Intégration WebSocket incomplète

---

## 🎯 Objectifs

1. Créer un modèle de base de données pour stocker les notifications
2. Implémenter les API endpoints CRUD pour les notifications
3. Connecter le frontend au backend
4. Intégrer WebSocket pour les notifications en temps réel
5. Ajouter des tests et documentation
6. S'assurer qu'il n'y a pas d'erreurs TypeScript ou de build

---

## 📦 Plan par Lots

### **BATCH 1: Modèle de Base de Données et Migration**
**Objectif:** Créer le modèle Notification et la migration Alembic

**Tâches:**
1. Créer `backend/app/models/notification.py` avec:
   - Modèle SQLAlchemy Notification
   - Champs: id, user_id, title, message, type, read, action_url, action_label, metadata (JSON), created_at, updated_at
   - Indexes appropriés
   - Relations avec User

2. Créer migration Alembic `backend/alembic/versions/XXX_add_notifications_table.py`
   - Table `notifications`
   - Indexes: user_id, read, created_at, type
   - Foreign key vers users

3. Mettre à jour `backend/app/models/__init__.py` pour exporter Notification

4. Mettre à jour `backend/DATABASE_SCHEMA.md` avec la documentation

**Tests:**
- Migration up/down fonctionne
- Modèle peut être importé sans erreur
- Relations fonctionnent

**Validation:**
```bash
cd backend
alembic upgrade head
python -c "from app.models.notification import Notification; print('OK')"
```

---

### **BATCH 2: Schémas Pydantic et Service Backend**
**Objectif:** Créer les schémas de validation et le service métier

**Tâches:**
1. Créer `backend/app/schemas/notification.py` avec:
   - NotificationBase
   - NotificationCreate
   - NotificationUpdate
   - NotificationResponse
   - NotificationListResponse

2. Créer `backend/app/services/notification_service.py` avec:
   - create_notification()
   - get_user_notifications()
   - mark_as_read()
   - mark_all_as_read()
   - delete_notification()
   - get_unread_count()

**Tests:**
- Schémas valident correctement
- Service peut être importé
- Pas d'erreurs de syntaxe Python

**Validation:**
```bash
cd backend
python -c "from app.schemas.notification import NotificationCreate; print('OK')"
python -c "from app.services.notification_service import NotificationService; print('OK')"
```

---

### **BATCH 3: API Endpoints Backend**
**Objectif:** Créer les routes FastAPI pour les notifications

**Tâches:**
1. Créer `backend/app/api/v1/endpoints/notifications.py` avec:
   - GET `/notifications` - Liste des notifications utilisateur
   - GET `/notifications/unread-count` - Nombre de non lues
   - GET `/notifications/{id}` - Détails d'une notification
   - PATCH `/notifications/{id}/read` - Marquer comme lue
   - PATCH `/notifications/read-all` - Marquer toutes comme lues
   - DELETE `/notifications/{id}` - Supprimer une notification
   - POST `/notifications` - Créer une notification (admin)

2. Enregistrer le router dans `backend/app/api/v1/router.py`

3. Ajouter authentification et permissions appropriées

**Tests:**
- Routes peuvent être importées
- Pas d'erreurs de syntaxe
- Swagger docs générés

**Validation:**
```bash
cd backend
python -c "from app.api.v1.endpoints import notifications; print('OK')"
# Démarrer le serveur et vérifier /docs
```

---

### **BATCH 4: Mise à Jour des Tasks Celery**
**Objectif:** Connecter les tasks Celery au modèle de base de données

**Tâches:**
1. Mettre à jour `backend/app/tasks/notification_tasks.py`:
   - Utiliser NotificationService pour créer les notifications en DB
   - Envoyer WebSocket après création en DB
   - Gérer les erreurs proprement

2. Créer helper function pour envoyer des notifications depuis le code

**Tests:**
- Task peut être appelée sans erreur
- Notification créée en DB
- WebSocket envoyé

**Validation:**
```bash
cd backend
python -c "from app.tasks.notification_tasks import send_notification_task; print('OK')"
```

---

### **BATCH 5: Types TypeScript Frontend**
**Objectif:** Créer les types TypeScript correspondants

**Tâches:**
1. Créer `apps/web/src/types/notification.ts` avec:
   - Interface Notification (alignée avec le backend)
   - NotificationType enum
   - NotificationCreate, NotificationUpdate types

2. Mettre à jour `apps/web/src/components/notifications/NotificationCenter.tsx`:
   - Utiliser les types depuis `@/types/notification`
   - S'assurer que les types correspondent au backend

**Tests:**
- Pas d'erreurs TypeScript
- Types exportés correctement

**Validation:**
```bash
cd apps/web
npm run type-check
# ou
pnpm type-check
```

---

### **BATCH 6: API Client Frontend**
**Objectif:** Créer les fonctions API pour communiquer avec le backend

**Tâches:**
1. Créer `apps/web/src/lib/api/notifications.ts` avec:
   - getNotifications()
   - getUnreadCount()
   - markAsRead()
   - markAllAsRead()
   - deleteNotification()
   - createNotification() (admin)

2. Utiliser `apiClient` depuis `@/lib/api`

**Tests:**
- Pas d'erreurs TypeScript
- Fonctions exportées correctement

**Validation:**
```bash
cd apps/web
npm run type-check
```

---

### **BATCH 7: Hook React useNotifications**
**Objectif:** Créer un hook personnalisé pour gérer les notifications

**Tâches:**
1. Créer `apps/web/src/hooks/useNotifications.ts` avec:
   - État pour les notifications
   - Fonctions pour fetch, mark as read, delete
   - Gestion du loading et des erreurs
   - Option pour polling automatique

2. Créer `apps/web/src/hooks/useNotificationCount.ts` pour le badge

**Tests:**
- Hook peut être importé
- Pas d'erreurs TypeScript

**Validation:**
```bash
cd apps/web
npm run type-check
```

---

### **BATCH 8: Intégration WebSocket Frontend**
**Objectif:** Connecter le frontend au WebSocket pour les notifications temps réel

**Tâches:**
1. Créer `apps/web/src/lib/websocket/notificationSocket.ts`:
   - Gestion de la connexion WebSocket
   - Reconnexion automatique
   - Écoute des messages de notification
   - Callbacks pour mise à jour de l'état

2. Intégrer dans `useNotifications` hook

3. Gérer l'authentification WebSocket (token)

**Tests:**
- WebSocket se connecte sans erreur
- Messages reçus correctement
- Pas d'erreurs TypeScript

**Validation:**
```bash
cd apps/web
npm run type-check
npm run build  # Vérifier pas d'erreurs
```

---

### **BATCH 9: Intégration des Composants**
**Objectif:** Connecter les composants existants au backend

**Tâches:**
1. Mettre à jour `apps/web/src/components/notifications/NotificationBell.tsx`:
   - Utiliser `useNotifications` hook
   - Utiliser `useNotificationCount` pour le badge
   - Connecter les callbacks

2. Mettre à jour `apps/web/src/components/notifications/NotificationCenter.tsx`:
   - Utiliser `useNotifications` hook
   - Connecter toutes les actions

3. Ajouter NotificationBell dans le layout/navbar principal

**Tests:**
- Composants se chargent sans erreur
- Pas d'erreurs TypeScript
- Build réussit

**Validation:**
```bash
cd apps/web
npm run type-check
npm run build
```

---

### **BATCH 10: Pages et Routes**
**Objectif:** Créer/mettre à jour les pages de notifications

**Tâches:**
1. Mettre à jour `apps/web/src/app/[locale]/profile/notifications/page.tsx`:
   - Utiliser `useNotifications`
   - Afficher NotificationCenter
   - Gérer les états de chargement

2. Vérifier `apps/web/src/app/[locale]/settings/notifications/page.tsx`:
   - S'assurer qu'elle utilise les bons hooks/API

**Tests:**
- Pages se chargent sans erreur
- Pas d'erreurs TypeScript
- Build réussit

**Validation:**
```bash
cd apps/web
npm run build
```

---

### **BATCH 11: Tests Backend**
**Objectif:** Ajouter des tests pour le backend

**Tâches:**
1. Créer `backend/tests/test_notification_model.py`:
   - Test création notification
   - Test relations

2. Créer `backend/tests/test_notification_service.py`:
   - Test toutes les méthodes du service

3. Créer `backend/tests/test_notification_api.py`:
   - Test tous les endpoints
   - Test authentification
   - Test permissions

**Tests:**
- Tous les tests passent

**Validation:**
```bash
cd backend
pytest tests/test_notification_*.py -v
```

---

### **BATCH 12: Tests Frontend**
**Objectif:** Ajouter des tests pour le frontend

**Tâches:**
1. Mettre à jour `apps/web/src/components/notifications/__tests__/NotificationCenter.test.tsx`:
   - Tests avec mock API
   - Tests d'interactions

2. Mettre à jour `apps/web/src/components/notifications/__tests__/NotificationBell.test.tsx`:
   - Tests avec mock hook

3. Créer `apps/web/src/hooks/__tests__/useNotifications.test.ts`:
   - Tests du hook

**Tests:**
- Tous les tests passent

**Validation:**
```bash
cd apps/web
npm run test
```

---

### **BATCH 13: Documentation et Finalisation**
**Objectif:** Documenter et finaliser

**Tâches:**
1. Mettre à jour `backend/API_ENDPOINTS.md`:
   - Documenter les endpoints de notifications

2. Mettre à jour `apps/web/src/components/notifications/README.md`:
   - Documentation complète avec exemples

3. Créer `NOTIFICATION_SYSTEM_TESTING.md`:
   - Guide de test manuel
   - Exemples d'utilisation

4. Vérifier tous les imports/exports
5. Vérifier qu'il n'y a pas d'erreurs de lint

**Tests:**
- Documentation complète
- Pas d'erreurs de lint

**Validation:**
```bash
cd backend
flake8 app/models/notification.py app/api/v1/endpoints/notifications.py app/services/notification_service.py
cd apps/web
npm run lint
```

---

## 🔍 Checklist de Validation par Lot

Avant de passer au lot suivant, vérifier:

- [ ] Pas d'erreurs TypeScript (`npm run type-check`)
- [ ] Pas d'erreurs de build (`npm run build`)
- [ ] Pas d'erreurs Python (`python -m py_compile`)
- [ ] Migration Alembic fonctionne (si applicable)
- [ ] Imports/exports corrects
- [ ] Code formaté (Prettier/Black)
- [ ] Tests passent (si ajoutés)

---

## 📝 Format des Rapports de Progrès

Pour chaque lot, créer un fichier `NOTIFICATION_BATCH_X_PROGRESS_REPORT.md` avec:

```markdown
# Notification System - Batch X Progress Report

## Date: [DATE]

## Lot: [NOM DU LOT]

## Tâches Complétées
- [ ] Tâche 1
- [ ] Tâche 2
...

## Tests Effectués
- Test 1: ✅/❌
- Test 2: ✅/❌
...

## Erreurs Rencontrées
- Erreur 1: [Description] - Résolu ✅
- Erreur 2: [Description] - En cours ⏳

## Prochaines Étapes
- [ ] Lot suivant: [NOM]

## Notes
[Notes additionnelles]
```

---

## 🚀 Commandes de Test Rapides

### Backend
```bash
cd backend
# Migration
alembic upgrade head

# Test imports
python -c "from app.models.notification import Notification; print('OK')"
python -c "from app.api.v1.endpoints import notifications; print('OK')"

# Tests
pytest tests/test_notification_*.py -v

# Lint
flake8 app/models/notification.py app/api/v1/endpoints/notifications.py
```

### Frontend
```bash
cd apps/web
# Type check
npm run type-check
# ou
pnpm type-check

# Build
npm run build
# ou
pnpm build

# Tests
npm run test
# ou
pnpm test

# Lint
npm run lint
# ou
pnpm lint
```

---

## ⚠️ Points d'Attention

1. **Types TypeScript:** S'assurer que les types correspondent exactement au backend
2. **Authentification:** Tous les endpoints doivent vérifier l'authentification
3. **Permissions:** Vérifier que les utilisateurs ne peuvent accéder qu'à leurs notifications
4. **WebSocket:** Gérer les reconnexions et les erreurs de connexion
5. **Performance:** Pagination pour les listes de notifications
6. **Sécurité:** Validation des données côté backend et frontend

---

## 📚 Références

- Modèles existants: `backend/app/models/user.py`, `backend/app/models/announcement.py`
- API existante: `backend/app/api/v1/endpoints/users.py`
- Composants existants: `apps/web/src/components/notifications/`
- WebSocket: `backend/app/api/v1/endpoints/websocket.py`

---

**Dernière mise à jour:** [DATE]
**Statut:** Plan créé, prêt pour implémentation

