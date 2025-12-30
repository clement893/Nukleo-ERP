# Module Client Portal

Module complet pour le portail client : tableau de bord, factures, projets, tickets et commandes.

## 📦 Structure

```
backend/app/modules/client_portal/
├── api/                 # Endpoints API
│   └── router.py        # Router unifié
└── README.md
```

## 🔗 Endpoints API

Tous les endpoints sont accessibles via `/v1/client/`:

- `/v1/client/dashboard` - Tableau de bord client
- `/v1/client/invoices` - Gestion des factures client
- `/v1/client/projects` - Gestion des projets client
- `/v1/client/tickets` - Gestion des tickets client
- `/v1/client/orders` - Gestion des commandes client

## 📝 Utilisation

### Backend

```python
from app.modules.client_portal.api import router as client_portal_router
```

### Frontend

```typescript
import { clientPortalAPI } from '@/lib/api/client-portal';
import { clientPortalKeys } from '@/lib/query/client-portal';
```

## 🔄 Migration

Ce module a été créé en isolant les endpoints client portal existants.

**Note**: Les endpoints originaux dans `app/api/v1/endpoints/client/` sont toujours utilisés pour maintenir la compatibilité.

---

**Créé le**: 30 décembre 2025  
**Statut**: ✅ Structure créée, migration en cours
