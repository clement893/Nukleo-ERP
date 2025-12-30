# Module ERP

Module complet pour la gestion des opérations ERP/Employee Portal : commandes, factures, clients, inventaire et rapports.

## 📦 Structure

```
backend/app/modules/erp/
├── schemas/             # Schémas Pydantic (réexportés depuis app.schemas.erp)
│   └── __init__.py
├── api/                 # Endpoints API
│   └── router.py        # Router unifié
└── README.md
```

## 🔗 Endpoints API

Tous les endpoints sont accessibles via `/v1/erp/`:

- `/v1/erp/orders` - Gestion des commandes
- `/v1/erp/invoices` - Gestion des factures
- `/v1/erp/clients` - Gestion des clients
- `/v1/erp/inventory` - Gestion de l'inventaire
- `/v1/erp/reports` - Gestion des rapports
- `/v1/erp/dashboard` - Tableau de bord ERP

## 📝 Utilisation

### Backend

```python
from app.modules.erp.schemas import ERPInvoiceResponse, ERPDashboardStats
from app.modules.erp.api import router as erp_router
```

### Frontend

```typescript
import { erpAPI } from '@/lib/api/erp';
import { erpKeys } from '@/lib/query/erp';
```

## 🔄 Migration

Ce module a été créé en isolant les endpoints ERP existants. Les schémas sont réexportés depuis `app.schemas.erp` pour éviter la duplication.

**Note**: Le module ERP utilise les modèles existants (Invoice, Project, etc.) et les convertit en format ERP via le service `ERPService`.

---

**Créé le**: 30 décembre 2025  
**Statut**: ✅ Structure créée, migration en cours
