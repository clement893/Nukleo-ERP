# Module Agenda

Module complet pour la gestion de l'agenda, événements, absences/vacances et deadlines.

## 📦 Fonctionnalités

- ✅ Calendrier
- ✅ Gestion des événements
- ✅ Gestion des absences/vacances
- ✅ Gestion des deadlines

## 🚀 Utilisation

```bash
# Copier le template dans votre projet
cp -r templates/modules/agenda backend/app/modules/

# Générer les types TypeScript
npm run generate:types

# Créer les migrations
cd backend
alembic revision --autogenerate -m "Add Agenda module"
alembic upgrade head
```

## 📝 Structure

```
backend/app/modules/agenda/
├── models/          # Modèles SQLAlchemy
│   ├── evenement.py
│   ├── absence.py
│   └── deadline.py
├── schemas/         # Schemas Pydantic
│   ├── evenement.py
│   ├── absence.py
│   └── deadline.py
├── api/            # Endpoints FastAPI
│   └── endpoints/
│       ├── evenements.py
│       ├── absences.py
│       └── deadlines.py
└── services/       # Logique métier
    ├── evenement_service.py
    ├── absence_service.py
    └── deadline_service.py
```

## 🔗 Intégration Frontend

Les pages frontend sont disponibles dans :
- `/dashboard/agenda` - Page d'accueil du module
- `/dashboard/agenda/calendrier` - Calendrier
- `/dashboard/agenda/evenements` - Gestion des événements
- `/dashboard/agenda/absences-vacances` - Gestion des absences/vacances
- `/dashboard/agenda/deadlines` - Gestion des deadlines

## 📚 Prochaines Étapes

1. Créer les modèles de base de données dans `models/`
2. Créer les schémas Pydantic dans `schemas/`
3. Créer les endpoints API dans `api/endpoints/`
4. Créer les services métier dans `services/`
5. Implémenter les fonctionnalités dans les pages frontend
