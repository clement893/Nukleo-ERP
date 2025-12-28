# Changelog

Tous les changements notables de ce projet seront documentés dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère à [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.0] - 2025-01-28

### Added
- **Structured Logging** - Replaced all `console.log` with structured logger (`logger.log`, `logger.error`, etc.)
- **Type Safety** - Replaced `any` types with specific TypeScript interfaces throughout the codebase
- **API Response Types** - Created `extractApiData` utility for type-safe API response handling
- **User Preferences Types** - Defined `UserPreferences` and `UserPreferenceValue` types
- **CSV Export** - Implemented CSV export for analytics, reports, and form submissions
- **Category Loading** - Added API integration for loading categories in post editor
- **Tag Input Component** - Implemented tag input with comma separation
- **Backend RBAC Integration** - Implemented user roles retrieval in onboarding endpoints
- **Admin Checks** - Added admin/ownership verification for scheduled tasks and backups
- **File Upload Support** - Implemented file uploads in feedback endpoints with S3 integration
- **User Context** - Added user team_id and roles retrieval for announcements
- **Database Optimizations** - Fixed N+1 query issues in CommentService and ClientService
- **Eager Loading** - Implemented `selectinload` for related entities (Team.members, Invoice.user, etc.)
- **Health Check Endpoints** - Added simple `/health/health` endpoint for deployment platforms
- **Hydration Hook** - Created `useHydrated` hook to prevent hydration issues
- **Frontend Tests** - Added unit tests for ApiError, ErrorDisplay, PreferencesManager, useHydrated
- **Backend Tests** - Added integration tests for onboarding, announcements, scheduled_tasks, backups
- **Migration Analysis** - Created script to analyze and validate Alembic migrations

### Changed
- **Logger Usage** - All `console.log` statements replaced with structured logger
- **API Client** - Improved type safety with `extractApiData` helper
- **Preferences Management** - Enhanced type safety with proper TypeScript interfaces
- **Comment Service** - Refactored to eliminate N+1 queries (single query with in-memory threading)
- **Client Service** - Added eager loading for user and subscription relationships
- **Health Checks** - Improved reliability with fallback responses and simpler endpoints
- **Protected Routes** - Enhanced with `useHydrated` hook to prevent hydration issues
- **Locale Sync** - Fixed hydration timing with `useHydrated` hook

### Fixed
- **Type Errors** - Fixed TypeScript errors related to `any` types
- **API Response Handling** - Fixed type extraction from API responses
- **N+1 Queries** - Eliminated N+1 query problems in comment and client services
- **Health Check Failures** - Fixed deployment health check failures on Railway
- **Hydration Issues** - Fixed frontend hydration problems with Zustand persist
- **Analytics Page** - Fixed property access errors (`metric.label` instead of `metric.name`)

### Documentation
- **PROGRESS_BATCH_1.md** - Console.log cleanup report
- **PROGRESS_BATCH_2.md** - API types improvement report
- **PROGRESS_BATCH_3.md** - Component types improvement report
- **PROGRESS_BATCH_4.md** - Frontend TODOs resolution report
- **PROGRESS_BATCH_5.md** - Backend TODOs resolution report
- **PROGRESS_BATCH_6.md** - Database optimization report
- **PROGRESS_BATCH_7.md** - Frontend tests report
- **PROGRESS_BATCH_8.md** - Backend tests report
- **PROGRESS_BATCH_9.md** - Migration analysis report
- **TEMPLATE_UPDATES.md** - Comprehensive template improvements documentation

---

## [1.1.0] - 2025-01-22

### Added
- **Système de thème avancé** avec 5 presets (Default, Modern, Corporate, Vibrant, Minimal)
- **CommandPalette** (⌘K) - Palette de commandes moderne avec recherche et navigation clavier
- **MultiSelect** - Sélection multiple avec tags et recherche
- **RichTextEditor** - Éditeur de texte riche avec barre d'outils
- **Storybook** - Configuration complète pour le développement de composants
- **Tests unitaires** - Tests pour composants critiques (Card, Select, Checkbox, Tabs, Textarea, CommandPalette, MultiSelect)
- **Documentation complète** - Guides pour hooks, utilitaires, tests, dépannage
- **Sentry** - Intégration pour le tracking d'erreurs (client, server, edge)
- **Performance** - Utilitaires de lazy loading et code splitting
- **i18n** - Configuration next-intl avec support FR/EN
- **Sécurité** - Headers de sécurité renforcés (CSP, HSTS, COEP, COOP, CORP)

### Changed
- **Refactorisation ThemeManager** - Divisé en plusieurs fichiers modulaires (constants, types, presets, utils, hooks)
- **Amélioration Button** - Classes CSS organisées pour meilleure lisibilité
- **Refactorisation ApiClient** - Méthode `request()` générique pour réduire la duplication
- **Refactorisation CommandPalette** - Logique extraite dans des hooks séparés
- **Migration vers thème** - Toast, KanbanBoard, Calendar, CRUDModal migrés vers le système de thème

### Fixed
- Corrections TypeScript dans ThemeManager (hexToRgb)
- Corrections dans Stepper (vérifications null)
- Corrections dans ApiClient (types ApiResponse)
- Corrections dans useEmail (extraction data)

### Documentation
- Ajout de `docs/HOOKS.md` - Documentation complète des hooks
- Ajout de `docs/UTILS.md` - Documentation des utilitaires
- Ajout de `docs/TESTING.md` - Guide des tests
- Ajout de `docs/TROUBLESHOOTING.md` - Guide de dépannage
- Amélioration de `CONTRIBUTING.md` - Guide de contribution complet
- Mise à jour de `CHANGELOG.md` - Historique complet

---

## [1.0.0] - 2025-12-21

### Added
- Release initiale du template MODELE-NEXTJS-FULLSTACK
- Frontend Next.js 16 avec React 19
- Backend FastAPI avec SQLAlchemy async
- Support PostgreSQL
- Support Redis pour le cache
- Système d'authentification JWT
- Configuration Docker Compose
- Configuration Railway pour le déploiement
- Pipeline CI/CD GitHub Actions
- Bibliothèque de composants complète (UI, sections, layout)
- Gestion d'état avec Zustand
- Client API avec intercepteurs
- Pages d'authentification (login, register)
- Page Dashboard
- Design responsive avec Tailwind CSS 3
- Configuration Nixpacks pour Railway
- Configuration pnpm workspace
- Documentation complète (README, CONTRIBUTING)
- Suite de tests backend avec pytest
- Configuration de tests frontend avec Vitest

### Fixed
- Configuration Tailwind CSS (migré de v4 à v3 pour compatibilité)
- Erreurs de build avec pnpm frozen-lockfile
- Erreurs TypeScript (variables non utilisées)
- Fichiers lib manquants (api.ts, store.ts)
- Configuration PostCSS pour Tailwind CSS

### Changed
- Mise à jour Tailwind CSS de v4 à v3 pour meilleure compatibilité Next.js
- Amélioration de la configuration de build pour Railway

### Security
- Authentification par token JWT
- Hachage de mot de passe avec bcrypt
- Protection CORS
- Gestion des variables d'environnement

---

## [Unreleased]

### Planned
- Configuration Alembic migrations
- Implémentation refresh token
- Fonctionnalité d'upload de fichiers
- Amélioration de la couverture de tests
- Rate limiting
- Protection CSRF
- Vérification d'email
- Fonctionnalité de réinitialisation de mot de passe

---

## [1.4.0] - 2025-12-22

### Added
- **CI/CD GitHub Actions** - Workflow complet avec tests et build automatiques
- **Guide de Migration** - Guide complet pour transformer le template en projet
- **Script post-install** - Vérification automatique après installation
- **Guide Démarrage Rapide** - Installation en 5 minutes
- **FAQ complète** - Réponses aux questions fréquentes
- **Guide de Personnalisation** - Comment personnaliser le template
- **Documentation utilisateur** - Analyse de ce qui manque pour les utilisateurs

### Changed
- **README amélioré** - Organisation de la documentation par catégories
- **Documentation structurée** - Guides organisés par niveau (débutant, avancé)

---

## [1.3.0] - 2025-12-22

### Added
- **Script setup.js** - Initialisation automatique du projet avec génération de secrets
- **Script rename-project.js** - Renommage automatique du projet
- **Dockerfiles** - Dockerfile pour frontend et backend
- **docker-compose.prod.yml** - Configuration Docker Compose pour production
- **Templates GitHub** - Templates pour issues, PR et Dependabot
- **TEMPLATE_USAGE.md** - Guide complet d'utilisation du template
- **docs/ENV_VARIABLES.md** - Documentation complète des variables d'environnement
- **docs/DEPLOYMENT.md** - Guide de déploiement en production
- **docs/TEMPLATE_WEAKNESSES.md** - Analyse des faiblesses du template

### Changed
- **Hardcodings remplacés** - "MODELE" remplacé par variables d'environnement
- **Configuration backend** - PROJECT_NAME et SENDGRID_FROM_NAME utilisent des variables
- **Configuration frontend** - BASE_URL utilise NEXT_PUBLIC_APP_URL
- **TODOs corrigés** - Remplacement des TODOs par des notes explicatives
- **Validation améliorée** - Script validate-env.js amélioré avec validation production
- **package.json** - Ajout des scripts `setup` et `rename`

### Security
- **Génération automatique de secrets** - Le script setup génère tous les secrets nécessaires
- **Validation stricte** - Validation renforcée des variables en production
- **PROJECT_NAME** - Variable d'environnement pour personnalisation

---

## [1.2.0] - 2025-12-22

### Changed
- **Documentation consolidée** - Réorganisation complète de la documentation
- **Nettoyage** - Suppression de 40+ fichiers d'analyse/tracking obsolètes
- **Structure** - Documentation organisée dans `docs/` avec index clair
- **README amélioré** - README principal optimisé pour un template

### Added
- **docs/README.md** - Index principal de la documentation
- **docs/DEVELOPMENT.md** - Guide de développement consolidé
- **docs/SECURITY.md** - Guide de sécurité
- **docs/COMPONENTS.md** - Documentation des composants
- **docs/TROUBLESHOOTING.md** - Guide de dépannage

### Removed
- Tous les fichiers d'analyse (`ANALYSE_*.md`)
- Fichiers de tracking (`BUGS_CORRIGES*.md`, `IMPROVEMENT*.md`)
- Rapports redondants (`CODE_REVIEW*.md`, `EVALUATION*.md`)
- Fichiers de développement interne (`PAGES_A_CONSTRUIRE.md`, `LISTE_FONCTIONNALITES.md`)

### Security
- **X-Frame-Options** : Corrigé de SAMEORIGIN à DENY
- **CSP** : Politique stricte en production (sans unsafe-eval)
- **Refresh tokens** : Expiration réduite de 7 à 5 jours
- **Logs** : Filtrage des informations sensibles amélioré

