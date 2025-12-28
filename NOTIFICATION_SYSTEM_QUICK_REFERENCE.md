# Notification System - Quick Reference Guide

## 📋 Vue d'Ensemble Rapide

Plan d'implémentation en **13 lots** pour ajouter un système de notifications complet.

## 🎯 Objectifs par Lot

| Lot | Nom | Objectif Principal | Validation |
|-----|-----|-------------------|------------|
| 1 | Modèle DB | Créer table `notifications` | `alembic upgrade head` |
| 2 | Schémas & Service | Validation Pydantic + logique métier | `python -c "from app.services..."` |
| 3 | API Endpoints | Routes FastAPI CRUD | `/docs` Swagger |
| 4 | Tasks Celery | Connecter tasks au modèle | Import test |
| 5 | Types TS | Types TypeScript alignés | `npm run type-check` |
| 6 | API Client | Fonctions API frontend | `npm run type-check` |
| 7 | Hook React | `useNotifications` hook | `npm run type-check` |
| 8 | WebSocket | Connexion temps réel | `npm run build` |
| 9 | Composants | Connecter UI au backend | `npm run build` |
| 10 | Pages | Pages de notifications | `npm run build` |
| 11 | Tests Backend | Tests Python | `pytest` |
| 12 | Tests Frontend | Tests React | `npm run test` |
| 13 | Documentation | Docs finales | Lint check |

## ✅ Checklist Avant Chaque Commit

```bash
# Backend
cd backend
alembic upgrade head  # Si migration
python -c "from app.models.notification import Notification; print('OK')"  # Test import
flake8 app/models/notification.py  # Lint

# Frontend  
cd apps/web
npm run type-check  # TypeScript
npm run build  # Build
npm run lint  # Lint
```

## 🚨 Erreurs Communes à Éviter

1. **Types TypeScript non alignés** → Vérifier `apps/web/src/types/notification.ts`
2. **Migration Alembic échoue** → Vérifier `alembic upgrade head`
3. **Import errors** → Vérifier `__init__.py` files
4. **Build errors** → Vérifier tous les imports/exports
5. **WebSocket ne fonctionne pas** → Vérifier authentification token

## 📝 Format Commit Message

```
feat(notifications): [BATCH X] Description courte

- Détail 1
- Détail 2

Closes #[issue]
```

## 🔗 Fichiers Clés

### Backend
- `backend/app/models/notification.py` - Modèle DB
- `backend/app/schemas/notification.py` - Validation
- `backend/app/services/notification_service.py` - Logique métier
- `backend/app/api/v1/endpoints/notifications.py` - API routes
- `backend/app/tasks/notification_tasks.py` - Celery tasks

### Frontend
- `apps/web/src/types/notification.ts` - Types TS
- `apps/web/src/lib/api/notifications.ts` - API client
- `apps/web/src/hooks/useNotifications.ts` - Hook React
- `apps/web/src/lib/websocket/notificationSocket.ts` - WebSocket
- `apps/web/src/components/notifications/` - Composants UI

## 📊 Structure de la Table Notifications

```sql
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) NOT NULL,  -- info, success, warning, error
    read BOOLEAN DEFAULT FALSE,
    action_url VARCHAR(500),
    action_label VARCHAR(100),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
```

## 🧪 Tests Rapides

### Test Backend
```python
# Test création notification
from app.services.notification_service import NotificationService
service = NotificationService()
notification = service.create_notification(
    user_id=1,
    title="Test",
    message="Test message",
    notification_type="info"
)
assert notification.id is not None
```

### Test Frontend
```typescript
// Test hook
import { useNotifications } from '@/hooks/useNotifications';
// Utiliser dans un composant de test
```

## 📦 Commandes Git par Lot

```bash
# Après chaque lot
git add .
git commit -m "feat(notifications): [BATCH X] Description"
git push origin main

# Créer rapport
# Créer NOTIFICATION_BATCH_X_PROGRESS_REPORT.md
```

## 🎯 Progression

- [ ] Batch 1: Modèle DB
- [ ] Batch 2: Schémas & Service
- [ ] Batch 3: API Endpoints
- [ ] Batch 4: Tasks Celery
- [ ] Batch 5: Types TS
- [ ] Batch 6: API Client
- [ ] Batch 7: Hook React
- [ ] Batch 8: WebSocket
- [ ] Batch 9: Composants
- [ ] Batch 10: Pages
- [ ] Batch 11: Tests Backend
- [ ] Batch 12: Tests Frontend
- [ ] Batch 13: Documentation

---

**Dernière mise à jour:** [DATE]

