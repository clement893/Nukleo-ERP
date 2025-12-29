# Templates de Modules ERP

Templates prêts à l'emploi pour créer rapidement des modules ERP.

## 📦 Modules Disponibles

### 1. CRM (Customer Relationship Management)
**Localisation**: `templates/modules/crm/`

Module complet pour la gestion de la relation client.

**Fonctionnalités**:
- ✅ Gestion des leads (prospects)
- ✅ Gestion des contacts
- ✅ Gestion des deals (affaires)
- ✅ Pipeline de vente
- ✅ Historique des interactions

**Utilisation**:
```bash
# Copier le template dans votre projet
cp -r templates/modules/crm backend/app/modules/

# Générer les types TypeScript
npm run generate:types

# Créer les migrations
cd backend
alembic revision --autogenerate -m "Add CRM module"
alembic upgrade head
```

### 2. Facturation (Billing)
**Localisation**: `templates/modules/billing/`

Module complet pour la gestion de la facturation.

**Fonctionnalités**:
- ✅ Gestion des factures
- ✅ Gestion des paiements
- ✅ Gestion des produits/services
- ✅ Génération de factures PDF
- ✅ Suivi des paiements

**Utilisation**:
```bash
# Copier le template dans votre projet
cp -r templates/modules/billing backend/app/modules/

# Générer les types TypeScript
npm run generate:types

# Créer les migrations
cd backend
alembic revision --autogenerate -m "Add Billing module"
alembic upgrade head
```

### 3. Modules Opérations
**Localisation**: `templates/modules/projets/`

Module complet pour la gestion des projets, clients et équipes.

**Fonctionnalités**:
- ✅ Gestion des projets
- ✅ Gestion des clients
- ✅ Gestion des équipes
- ✅ Suivi des projets
- ✅ Attribution des tâches

**Utilisation**:
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

### 4. Employés
**Localisation**: `templates/modules/employes/`

Module complet pour la gestion des employés, feuilles de temps, onboarding, vacances et calendrier.

**Fonctionnalités**:
- ✅ Gestion des employés
- ✅ Feuilles de temps
- ✅ Onboarding
- ✅ Gestion des vacances
- ✅ Calendrier des événements

**Utilisation**:
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

### 5. Agenda
**Localisation**: `templates/modules/agenda/`

Module complet pour la gestion de l'agenda, événements, absences/vacances et deadlines.

**Fonctionnalités**:
- ✅ Calendrier
- ✅ Gestion des événements
- ✅ Gestion des absences/vacances
- ✅ Gestion des deadlines

**Utilisation**:
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

## 🚀 Créer un Nouveau Module

1. **Créer la structure**:
```
backend/app/modules/votre_module/
├── models/          # Modèles SQLAlchemy
├── schemas/         # Schemas Pydantic
├── api/            # Endpoints FastAPI
└── services/       # Logique métier
```

2. **Suivre les conventions**:
- Modèles dans `models/`
- Schemas dans `schemas/`
- Endpoints dans `api/endpoints/`
- Services dans `services/`

3. **Générer les types**:
```bash
npm run generate:types
```

4. **Créer les migrations**:
```bash
cd backend
alembic revision --autogenerate -m "Add votre_module"
alembic upgrade head
```

## 📝 Structure Recommandée

Chaque module devrait contenir:

- **Models**: Définition des entités de base de données
- **Schemas**: Validation et sérialisation des données
- **API**: Endpoints REST pour le module
- **Services**: Logique métier réutilisable
- **Tests**: Tests unitaires et d'intégration

## 🔗 Intégration Frontend

Après avoir créé un module backend:

1. Générer les types: `npm run generate:types`
2. Créer les pages Next.js correspondantes
3. Utiliser les hooks réutilisables (`useForm`, `usePagination`, etc.)
4. Utiliser les composants UI de la bibliothèque

## 📚 Exemples

Consultez les templates existants pour voir des exemples complets:
- `templates/modules/crm/` - Module CRM complet
- `templates/modules/billing/` - Module Facturation complet
- `templates/modules/projets/` - Modules Opérations complet
- `templates/modules/employes/` - Module Employés complet
- `templates/modules/agenda/` - Module Agenda complet

