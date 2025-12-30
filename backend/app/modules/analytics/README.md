# Module Analytics

Module complet pour les analytics, insights et rapports.

## 📦 Structure

```
backend/app/modules/analytics/
├── api/                 # Endpoints API
│   └── router.py        # Router unifié
└── README.md
```

## 🔗 Endpoints API

Tous les endpoints sont accessibles via `/v1/analytics/`:

- `/v1/analytics/` - Métriques analytics
- `/v1/analytics/insights` - Insights et analyses
- `/v1/analytics/reports` - Rapports

## 📝 Utilisation

### Backend

```python
from app.modules.analytics.api import router as analytics_router
```

### Frontend

```typescript
import { analyticsModuleAPI } from '@/lib/api/analytics-unified';
import { analyticsKeys } from '@/lib/query/analytics';
```

## 🔄 Migration

Ce module a été créé en isolant les endpoints analytics, insights et reports existants.

**Note**: Les endpoints originaux dans `app/api/v1/endpoints/` sont toujours utilisés pour maintenir la compatibilité.

---

**Créé le**: 30 décembre 2025  
**Statut**: ✅ Structure créée, migration en cours
