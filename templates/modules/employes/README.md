# Module Employés

Module complet pour la gestion des employés, feuilles de temps, onboarding, vacances et calendrier.

## 📦 Fonctionnalités

- ✅ Gestion des employés
- ✅ Feuilles de temps
- ✅ Onboarding
- ✅ Gestion des vacances
- ✅ Calendrier des événements

## 🚀 Utilisation

```bash
# Copier le template dans votre projet
cp -r templates/modules/employes backend/app/modules/

# Générer les types TypeScript
npm run generate:types

# Créer les migrations
cd backend
alembic revision --autogenerate -m "Add Employés module"
alembic upgrade head
```

## 📝 Structure

```
backend/app/modules/employes/
├── models/          # Modèles SQLAlchemy
│   └── employe.py
├── schemas/         # Schemas Pydantic
│   └── employe.py
├── api/            # Endpoints FastAPI
│   └── endpoints/
│       ├── employes.py
│       ├── feuilles_temps.py
│       ├── onboarding.py
│       ├── vacances.py
│       └── calendrier.py
└── services/       # Logique métier
    ├── employe_service.py
    ├── feuille_temps_service.py
    ├── onboarding_service.py
    ├── vacances_service.py
    └── calendrier_service.py
```

## 🔗 Intégration Frontend

Les pages frontend sont disponibles dans :
- `/dashboard/management` - Page d'accueil du module
- `/dashboard/management/employes` - Liste des employés
- `/dashboard/management/feuilles-temps` - Feuilles de temps
- `/dashboard/management/onboarding` - Onboarding
- `/dashboard/management/vacances` - Gestion des vacances
- `/dashboard/management/calendrier` - Calendrier

## 📚 Prochaines Étapes

1. Créer les modèles de base de données dans `models/`
2. Créer les schémas Pydantic dans `schemas/`
3. Créer les endpoints API dans `api/endpoints/`
4. Créer les services métier dans `services/`
5. Implémenter les fonctionnalités dans les pages frontend
