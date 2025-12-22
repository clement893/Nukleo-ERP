# Changelog

Tous les changements notables de ce projet seront documentés dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère à [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

