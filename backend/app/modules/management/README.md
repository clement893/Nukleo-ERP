# Module Management

Module complet pour la gestion organisationnelle : équipes et employés.

## 📦 Structure

```
backend/app/modules/management/
├── api/                 # Endpoints API
│   └── router.py        # Router unifié
└── README.md
```

## 🔗 Endpoints API

Tous les endpoints sont accessibles via `/v1/management/`:

- `/v1/management/teams` - Gestion des équipes
- `/v1/management/employees` - Gestion des employés

## 📝 Utilisation

### Backend

```python
from app.modules.management.api import router as management_router
```

### Frontend

```typescript
import { managementAPI } from '@/lib/api/management';
import { managementKeys } from '@/lib/query/management';
```

## 🔄 Migration

Ce module a été créé en isolant les endpoints teams et employees existants.

**Note**: Les endpoints originaux dans `app/api/v1/endpoints/` sont toujours utilisés pour maintenir la compatibilité.

---

**Créé le**: 30 décembre 2025  
**Statut**: ✅ Structure créée, migration en cours
