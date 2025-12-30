# Module Leo

Module complet pour l'assistant IA Leo dans l'ERP Nukleo.

## 📦 Structure

```
backend/app/modules/leo/
├── models/              # Modèles SQLAlchemy
│   ├── leo_conversation.py
│   └── leo_documentation.py
├── schemas/             # Schémas Pydantic
│   ├── leo.py
│   └── leo_documentation.py
├── services/            # Services métier
│   └── agent_service.py
├── api/                 # Endpoints API
│   ├── router.py        # Router unifié
│   └── endpoints/
│       ├── agent.py
│       └── documentation.py
└── README.md
```

## 🔗 Endpoints API

Tous les endpoints sont accessibles via `/v1/ai/leo/`:

- `/v1/ai/leo/conversations` - Gestion des conversations
- `/v1/ai/leo/conversations/{id}` - Détails d'une conversation
- `/v1/ai/leo/conversations/{id}/messages` - Messages d'une conversation
- `/v1/ai/leo/query` - Envoyer une requête à Leo
- `/v1/ai/leo/leo-documentation` - Gestion de la documentation Leo
- `/v1/ai/leo/leo-documentation/{id}` - Détails d'une documentation
- `/v1/ai/leo/leo-documentation/active/context` - Contexte actif pour Leo

## 📝 Utilisation

### Backend

```python
from app.modules.leo.models import LeoConversation, LeoMessage, LeoDocumentation
from app.modules.leo.schemas import LeoQueryRequest, LeoQueryResponse
from app.modules.leo.services import LeoAgentService
```

### Frontend

```typescript
import { leoAPI } from '@/lib/api/leo';
import { leoKeys } from '@/lib/query/leo';
```

## 🎯 Fonctionnalités

- Gestion des conversations Leo
- Gestion des messages
- Contexte utilisateur enrichi
- Accès aux données ERP (projets, tâches, factures, entreprises, contacts)
- Intégration avec services IA (OpenAI, Anthropic)
- Gestion de la documentation pour Leo

## 🔄 Migration

Ce module a été complètement isolé :
- Modèles migrés vers `modules/leo/models/`
- Schémas migrés vers `modules/leo/schemas/`
- Services migrés vers `modules/leo/services/`
- Endpoints migrés vers `modules/leo/api/endpoints/`
- Router unifié dans `modules/leo/api/router.py`

**Note**: Les anciens fichiers dans `app/models/`, `app/schemas/`, et `app/api/v1/endpoints/` peuvent être supprimés une fois la migration validée.

---

**Créé le**: 30 décembre 2025  
**Statut**: ✅ Isolation complète terminée
