# Module Projects

Module complet pour la gestion des projets.

## 📦 Structure

```
backend/app/modules/projects/
├── api/                 # Endpoints API
│   └── router.py        # Router unifié
└── README.md
```

## 🔗 Endpoints API

Tous les endpoints sont accessibles via `/v1/projects/`:

- `/v1/projects/` - Liste des projets
- `/v1/projects/{id}` - Détails d'un projet
- `/v1/projects/` (POST) - Créer un projet
- `/v1/projects/{id}` (PUT) - Mettre à jour un projet
- `/v1/projects/{id}` (DELETE) - Supprimer un projet

## 📝 Utilisation

### Backend

```python
from app.modules.projects.api import router as projects_router
```

### Frontend

```typescript
import { projectsAPI } from '@/lib/api/projects';
import { projectsKeys } from '@/lib/query/projects';
```

## 🔄 Migration

Ce module a été créé en isolant les endpoints projects existants.

**Note**: L'endpoint original dans `app/api/v1/endpoints/projects.py` est toujours utilisé pour maintenir la compatibilité.

---

**Créé le**: 30 décembre 2025  
**Statut**: ✅ Structure créée, migration en cours
