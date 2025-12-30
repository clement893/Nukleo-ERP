# Module Themes

Module complet pour la gestion des thèmes et polices de thème.

## 📦 Structure

```
backend/app/modules/themes/
├── api/                 # Endpoints API
│   └── router.py        # Router unifié
└── README.md
```

## 🔗 Endpoints API

Tous les endpoints sont accessibles via `/v1/themes/`:

- `/v1/themes/` - Gestion des thèmes
- `/v1/themes/active` - Thème actif
- `/v1/themes/fonts` - Gestion des polices de thème

## 📝 Utilisation

### Backend

```python
from app.modules.themes.api import router as themes_router
```

### Frontend

```typescript
import { themesAPI } from '@/lib/api/themes';
import { themesKeys } from '@/lib/query/themes';
```

## 🔄 Migration

Ce module a été créé en isolant les endpoints themes et theme_fonts existants.

**Note**: Les endpoints originaux dans `app/api/v1/endpoints/` sont toujours utilisés pour maintenir la compatibilité.

---

**Créé le**: 30 décembre 2025  
**Statut**: ✅ Structure créée, migration en cours
