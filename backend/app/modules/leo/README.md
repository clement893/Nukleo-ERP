# Leo Module

Module isolé pour l'assistant IA Leo dans l'ERP Nukleo.

## 📁 Structure

```
modules/leo/
├── __init__.py
├── services/
│   ├── __init__.py
│   └── agent_service.py      # Service métier pour Leo
├── api/
│   ├── __init__.py
│   ├── router.py             # Router principal du module
│   └── endpoints/
│       ├── __init__.py
│       └── agent.py          # Endpoints API pour Leo
└── README.md                  # Ce fichier
```

## 🎯 Fonctionnalités

- Gestion des conversations Leo
- Gestion des messages
- Contexte utilisateur enrichi
- Accès aux données ERP (projets, tâches, factures, entreprises, contacts)
- Intégration avec services IA (OpenAI, Anthropic)

## 📦 Dépendances

### Dépendances Partagées (Autorisées)
- `app.models.user.User` - Authentification
- `app.models.leo_conversation.*` - Modèles de données Leo
- `app.models.project.*` - Données ERP
- `app.services.rbac_service.RBACService` - Permissions
- `app.services.ai_service.AIService` - Services IA
- `app.services.documentation_service` - Documentation

### Dépendances Inter-Modules (À Éviter)
- ❌ Ne pas importer directement d'autres modules métier
- ✅ Utiliser uniquement les services partagés

## 🔌 API

Le module expose un router FastAPI sous le préfixe `/ai/leo`:

- `GET /ai/leo/conversations` - Liste des conversations
- `GET /ai/leo/conversations/{id}` - Détails d'une conversation
- `GET /ai/leo/conversations/{id}/messages` - Messages d'une conversation
- `POST /ai/leo/query` - Envoyer une requête à Leo

## 🚀 Utilisation

Le router est automatiquement enregistré dans `app/api/v1/router.py`:

```python
from app.modules.leo.api import router as leo_router
api_router.include_router(leo_router)
```

## 📝 Notes

- Les modèles de données (`LeoConversation`, `LeoMessage`) restent dans `app/models/` pour cohérence avec le reste du projet
- Les schémas Pydantic restent dans `app/schemas/` pour cohérence
- Cette structure suit les meilleures pratiques de monorepo avec isolation progressive

## 🔄 Migration

Ce module a été migré depuis:
- `app/services/leo_agent_service.py` → `modules/leo/services/agent_service.py`
- `app/api/v1/endpoints/leo_agent.py` → `modules/leo/api/endpoints/agent.py`

Les anciens fichiers peuvent être supprimés une fois la migration validée.
