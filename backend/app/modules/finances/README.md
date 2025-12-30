# Module Finances

Module complet pour la gestion des opérations financières : facturations, rapports et comptes de dépenses.

## 📦 Structure

```
backend/app/modules/finances/
├── api/                 # Endpoints API
│   └── router.py        # Router unifié
└── README.md
```

## 🔗 Endpoints API

Tous les endpoints sont accessibles via `/v1/finances/`:

- `/v1/finances/facturations` - Gestion des facturations
- `/v1/finances/rapport` - Gestion des rapports financiers
- `/v1/finances/compte-depenses` - Gestion des comptes de dépenses

## 📝 Utilisation

### Backend

```python
from app.modules.finances.api import router as finances_router
```

### Frontend

```typescript
import { financesAPI } from '@/lib/api/finances';
import { financesKeys } from '@/lib/query/finances';
```

## 🔄 Migration

Ce module a été créé en isolant les endpoints finances existants. Les endpoints sont actuellement des stubs et nécessitent une implémentation complète.

**Note**: Les endpoints originaux dans `app/api/v1/endpoints/finances/` sont toujours utilisés pour maintenir la compatibilité.

---

**Créé le**: 30 décembre 2025  
**Statut**: ✅ Structure créée, endpoints à implémenter
