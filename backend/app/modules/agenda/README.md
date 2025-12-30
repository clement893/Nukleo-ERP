# Module Agenda

Module complet pour la gestion du calendrier et des événements.

## 📦 Structure

```
backend/app/modules/agenda/
├── api/                 # Endpoints API
│   └── router.py        # Router unifié
└── README.md
```

## 🔗 Endpoints API

Tous les endpoints sont accessibles via `/v1/agenda/`:

- `/v1/agenda/events` - Gestion des événements du calendrier
- `/v1/agenda/events/{id}` - Détails d'un événement
- `/v1/agenda/events` (POST) - Créer un événement
- `/v1/agenda/events/{id}` (PUT) - Mettre à jour un événement
- `/v1/agenda/events/{id}` (DELETE) - Supprimer un événement

## 📝 Utilisation

### Backend

```python
from app.modules.agenda.api import router as agenda_router
```

### Frontend

```typescript
import { agendaAPI } from '@/lib/api/agenda';
import { agendaKeys } from '@/lib/query/agenda';
```

## 🔄 Migration

Ce module a été créé en isolant les endpoints agenda existants.

**Note**: L'endpoint original dans `app/api/v1/endpoints/agenda/events.py` est toujours utilisé pour maintenir la compatibilité.

---

**Créé le**: 30 décembre 2025  
**Statut**: ✅ Structure créée, migration en cours
