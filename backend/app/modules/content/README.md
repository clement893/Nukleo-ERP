# Module Content/CMS

Module complet pour la gestion de contenu : posts, pages, médias, formulaires, menus, templates et tags.

## 📦 Structure

```
backend/app/modules/content/
├── api/                 # Endpoints API
│   └── router.py        # Router unifié
└── README.md
```

## 🔗 Endpoints API

Tous les endpoints sont accessibles via `/v1/content/`:

- `/v1/content/posts` - Gestion des posts de blog
- `/v1/content/pages` - Gestion des pages CMS
- `/v1/content/media` - Gestion de la bibliothèque média
- `/v1/content/forms` - Gestion des formulaires dynamiques
- `/v1/content/menus` - Gestion des menus de navigation
- `/v1/content/templates` - Gestion des templates de contenu
- `/v1/content/tags` - Gestion des tags et catégories

## 📝 Utilisation

### Backend

```python
from app.modules.content.api import router as content_router
```

### Frontend

```typescript
import { contentAPI } from '@/lib/api/content';
import { contentKeys } from '@/lib/query/content';
```

## 🔄 Migration

Ce module a été créé en isolant les endpoints content/CMS existants.

**Note**: Les endpoints originaux dans `app/api/v1/endpoints/` sont toujours utilisés pour maintenir la compatibilité.

---

**Créé le**: 30 décembre 2025  
**Statut**: ✅ Structure créée, migration en cours
