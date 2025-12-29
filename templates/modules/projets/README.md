# Modules Opérations

Module complet pour la gestion des projets, clients et équipes.

## 📦 Fonctionnalités

- ✅ Gestion des projets
- ✅ Gestion des clients
- ✅ Gestion des équipes
- ✅ Suivi des projets
- ✅ Attribution des tâches

## 🚀 Utilisation

```bash
# Copier le template dans votre projet
cp -r templates/modules/projets backend/app/modules/

# Générer les types TypeScript
npm run generate:types

# Créer les migrations
cd backend
alembic revision --autogenerate -m "Add Projets module"
alembic upgrade head
```

## 📝 Structure

```
backend/app/modules/projets/
├── models/          # Modèles SQLAlchemy
│   ├── project.py
│   ├── client.py
│   └── team.py
├── schemas/         # Schemas Pydantic
│   ├── project.py
│   ├── client.py
│   └── team.py
├── api/            # Endpoints FastAPI
│   └── endpoints/
│       ├── projects.py
│       ├── clients.py
│       └── teams.py
└── services/       # Logique métier
    ├── project_service.py
    ├── client_service.py
    └── team_service.py
```

## 🔗 Intégration Frontend

Les pages frontend sont disponibles dans :
- `/dashboard/projets` - Page d'accueil du module
- `/dashboard/projets/projets` - Liste des projets
- `/dashboard/projets/clients` - Liste des clients
- `/dashboard/projets/equipes` - Liste des équipes

## 📚 Prochaines Étapes

1. Créer les modèles de base de données dans `models/`
2. Créer les schémas Pydantic dans `schemas/`
3. Créer les endpoints API dans `api/endpoints/`
4. Créer les services métier dans `services/`
5. Implémenter les fonctionnalités dans les pages frontend
