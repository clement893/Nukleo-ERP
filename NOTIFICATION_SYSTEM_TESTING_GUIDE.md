# Notification System - Testing Guide

## 📋 Vue d'Ensemble

Ce guide décrit comment tester le système de notifications après chaque lot d'implémentation.

---

## 🧪 Tests par Lot

### Batch 1: Modèle de Base de Données

#### Test Migration
```bash
cd backend
# Créer migration
alembic revision --autogenerate -m "add_notifications_table"

# Appliquer migration
alembic upgrade head

# Vérifier dans la DB
psql -d your_database -c "\d notifications"
```

#### Test Modèle
```python
# Dans Python shell
from app.core.database import SessionLocal
from app.models.notification import Notification
from app.models.user import User

db = SessionLocal()
# Créer une notification de test
user = db.query(User).first()
notification = Notification(
    user_id=user.id,
    title="Test Notification",
    message="This is a test",
    notification_type="info"
)
db.add(notification)
db.commit()
print(f"Created notification: {notification.id}")
```

**Résultat attendu:** Notification créée avec succès, ID généré.

---

### Batch 2: Schémas et Service

#### Test Schémas
```python
from app.schemas.notification import NotificationCreate, NotificationResponse

# Test création
data = NotificationCreate(
    title="Test",
    message="Test message",
    notification_type="info"
)
print(data.dict())

# Test réponse
response = NotificationResponse(
    id=1,
    user_id=1,
    title="Test",
    message="Test",
    notification_type="info",
    read=False,
    created_at="2025-01-01T00:00:00Z"
)
print(response.dict())
```

#### Test Service
```python
from app.services.notification_service import NotificationService
from app.core.database import SessionLocal

db = SessionLocal()
service = NotificationService(db)

# Créer notification
notification = service.create_notification(
    user_id=1,
    title="Test",
    message="Test message",
    notification_type="info"
)
print(f"Created: {notification.id}")

# Récupérer notifications
notifications = service.get_user_notifications(user_id=1)
print(f"Count: {len(notifications)}")

# Marquer comme lue
service.mark_as_read(notification.id, user_id=1)
print("Marked as read")
```

**Résultat attendu:** Toutes les opérations réussissent sans erreur.

---

### Batch 3: API Endpoints

#### Test avec curl
```bash
# Obtenir token d'authentification d'abord
TOKEN="your_jwt_token"

# Lister les notifications
curl -X GET "http://localhost:8000/api/v1/notifications" \
  -H "Authorization: Bearer $TOKEN"

# Obtenir le nombre de non lues
curl -X GET "http://localhost:8000/api/v1/notifications/unread-count" \
  -H "Authorization: Bearer $TOKEN"

# Marquer comme lue
curl -X PATCH "http://localhost:8000/api/v1/notifications/1/read" \
  -H "Authorization: Bearer $TOKEN"

# Marquer toutes comme lues
curl -X PATCH "http://localhost:8000/api/v1/notifications/read-all" \
  -H "Authorization: Bearer $TOKEN"

# Supprimer
curl -X DELETE "http://localhost:8000/api/v1/notifications/1" \
  -H "Authorization: Bearer $TOKEN"
```

#### Test avec Swagger UI
1. Démarrer le serveur: `cd backend && uvicorn app.main:app --reload`
2. Ouvrir `http://localhost:8000/docs`
3. Tester chaque endpoint dans l'interface Swagger

**Résultat attendu:** Tous les endpoints répondent correctement, codes HTTP appropriés.

---

### Batch 4: Tasks Celery

#### Test Task
```python
from app.tasks.notification_tasks import send_notification_task

# Envoyer notification
result = send_notification_task.delay(
    user_id="1",
    title="Test Task",
    message="Test message from Celery",
    notification_type="info",
    email_notification=False
)

# Attendre résultat
print(result.get(timeout=10))
```

#### Vérifier en DB
```python
from app.core.database import SessionLocal
from app.models.notification import Notification

db = SessionLocal()
notifications = db.query(Notification).filter_by(user_id=1).all()
print(f"Notifications: {len(notifications)}")
```

**Résultat attendu:** Notification créée en DB après exécution de la task.

---

### Batch 5-6: Types TypeScript et API Client

#### Test TypeScript
```bash
cd apps/web
npm run type-check
```

#### Test API Client (dans console navigateur)
```typescript
import { notificationsAPI } from '@/lib/api/notifications';

// Tester les fonctions
const notifications = await notificationsAPI.getNotifications();
console.log('Notifications:', notifications);

const count = await notificationsAPI.getUnreadCount();
console.log('Unread count:', count);
```

**Résultat attendu:** Pas d'erreurs TypeScript, fonctions exportées correctement.

---

### Batch 7: Hook React

#### Test Hook (dans composant de test)
```tsx
import { useNotifications } from '@/hooks/useNotifications';

function TestComponent() {
  const { 
    notifications, 
    loading, 
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification 
  } = useNotifications();

  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      <p>Count: {notifications.length}</p>
    </div>
  );
}
```

**Résultat attendu:** Hook fonctionne, données chargées, pas d'erreurs.

---

### Batch 8: WebSocket

#### Test Connexion WebSocket
```javascript
// Dans console navigateur
const ws = new WebSocket('ws://localhost:8000/api/v1/ws/notifications?token=YOUR_TOKEN');

ws.onopen = () => {
  console.log('Connected');
  ws.send(JSON.stringify({ type: 'ping' }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};

ws.onerror = (error) => {
  console.error('Error:', error);
};
```

#### Test Notification Temps Réel
1. Ouvrir deux onglets du navigateur
2. Se connecter au WebSocket dans les deux
3. Créer une notification via API
4. Vérifier que les deux clients reçoivent la notification

**Résultat attendu:** Connexion réussie, messages reçus en temps réel.

---

### Batch 9-10: Composants et Pages

#### Test Composants
1. Démarrer le serveur de développement: `npm run dev`
2. Naviguer vers `/profile/notifications`
3. Vérifier que NotificationCenter s'affiche
4. Tester les interactions:
   - Marquer comme lue
   - Supprimer
   - Marquer toutes comme lues

#### Test NotificationBell
1. Vérifier que le badge s'affiche dans le navbar
2. Cliquer sur la cloche
3. Vérifier que le dropdown s'ouvre
4. Tester les interactions

**Résultat attendu:** UI fonctionnelle, toutes les interactions marchent.

---

### Batch 11-12: Tests Automatisés

#### Tests Backend
```bash
cd backend
pytest tests/test_notification_model.py -v
pytest tests/test_notification_service.py -v
pytest tests/test_notification_api.py -v
```

#### Tests Frontend
```bash
cd apps/web
npm run test -- NotificationCenter
npm run test -- NotificationBell
npm run test -- useNotifications
```

**Résultat attendu:** Tous les tests passent.

---

## 🔍 Tests d'Intégration Complets

### Scénario 1: Création et Affichage
1. Créer une notification via API backend
2. Vérifier qu'elle apparaît dans le frontend
3. Vérifier que le badge de compteur se met à jour
4. Vérifier que WebSocket envoie la notification

### Scénario 2: Marquer comme Lue
1. Créer une notification non lue
2. Cliquer sur "Mark as read" dans l'UI
3. Vérifier que l'API est appelée
4. Vérifier que la notification disparaît de la liste "unread"
5. Vérifier que le compteur diminue

### Scénario 3: Suppression
1. Créer une notification
2. Cliquer sur "Delete"
3. Vérifier que l'API est appelée
4. Vérifier que la notification disparaît de la liste

### Scénario 4: Temps Réel
1. Ouvrir l'application dans deux navigateurs
2. Se connecter avec le même utilisateur
3. Créer une notification via API
4. Vérifier que les deux navigateurs reçoivent la notification en temps réel

---

## 🐛 Tests de Gestion d'Erreurs

### Test Connexion API Échouée
1. Arrêter le serveur backend
2. Essayer de charger les notifications
3. Vérifier que l'erreur est gérée gracieusement

### Test WebSocket Déconnecté
1. Se connecter au WebSocket
2. Déconnecter le serveur
3. Vérifier que la reconnexion automatique fonctionne

### Test Données Invalides
1. Envoyer des données invalides à l'API
2. Vérifier que les erreurs de validation sont retournées

---

## ✅ Checklist de Test Finale

- [ ] Migration Alembic fonctionne
- [ ] Modèle peut créer/lire notifications
- [ ] Service fonctionne correctement
- [ ] Tous les endpoints API fonctionnent
- [ ] Tasks Celery créent des notifications
- [ ] Types TypeScript corrects
- [ ] API client fonctionne
- [ ] Hook React fonctionne
- [ ] WebSocket se connecte et reçoit des messages
- [ ] Composants UI fonctionnent
- [ ] Pages se chargent correctement
- [ ] Tests automatisés passent
- [ ] Gestion d'erreurs fonctionne
- [ ] Performance acceptable (< 500ms pour API calls)

---

**Dernière mise à jour:** [DATE]

