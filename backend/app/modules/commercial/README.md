# Module Commercial

Module complet pour la gestion des opérations commerciales : contacts, entreprises, opportunités, devis et soumissions.

## 📦 Structure

```
backend/app/modules/commercial/
├── models/              # Modèles SQLAlchemy
│   ├── contact.py
│   ├── company.py
│   ├── pipeline.py
│   ├── quote.py
│   └── submission.py
├── schemas/             # Schémas Pydantic
│   ├── contact.py
│   ├── company.py
│   ├── opportunity.py
│   ├── pipeline.py
│   ├── quote.py
│   └── submission.py
├── api/                 # Endpoints API
│   └── router.py        # Router unifié
└── README.md
```

## 🔗 Endpoints API

Tous les endpoints sont accessibles via `/v1/commercial/`:

- `/v1/commercial/contacts` - Gestion des contacts
- `/v1/commercial/companies` - Gestion des entreprises
- `/v1/commercial/opportunities` - Gestion des opportunités
- `/v1/commercial/quotes` - Gestion des devis
- `/v1/commercial/submissions` - Gestion des soumissions

## 📝 Utilisation

### Backend

```python
from app.modules.commercial.models import Contact, Company
from app.modules.commercial.schemas import ContactCreate, ContactUpdate
```

### Frontend

```typescript
import { commercialAPI } from '@/lib/api/commercial';
import { useContacts, useCompanies } from '@/lib/query/commercial';
```

## 🔄 Migration

Ce module a été créé en isolant les endpoints commerciaux existants. Les modèles et schémas sont copiés dans le module pour isolation complète.

**Note**: Les modèles originaux dans `app/models/` sont toujours utilisés pour maintenir la compatibilité. Une migration complète nécessiterait de mettre à jour tous les imports.

---

**Créé le**: 30 décembre 2025  
**Statut**: ✅ Structure créée, migration en cours
