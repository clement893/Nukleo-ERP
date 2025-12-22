# 📚 Index de Documentation - Template SaaS Next.js 16

## Vue d'ensemble

Ce document répertorie toute la documentation disponible pour le template SaaS Next.js 16. Utilisez cet index pour naviguer rapidement vers la documentation dont vous avez besoin.

---

## 🚀 Démarrage Rapide

- **[Guide de Démarrage](../GUIDE_DEMARRAGE.md)** - Guide complet pour démarrer avec le projet
- **[Getting Started](../GETTING_STARTED.md)** - Guide d'installation et configuration
- **[README Principal](../README.md)** - Vue d'ensemble du projet

---

## 🎨 Composants UI

### Documentation Générale

- **[README Composants UI](../apps/web/src/components/ui/README.md)** - Vue d'ensemble de la bibliothèque de composants
- **[Documentation API](../apps/web/src/app/components/docs/API.md)** - Documentation complète de tous les composants
- **[Guide d'Accessibilité](../apps/web/src/components/ui/ACCESSIBILITY.md)** - Standards d'accessibilité WCAG 2.1
- **[CHANGELOG](../apps/web/src/components/ui/CHANGELOG.md)** - Historique des versions et changements

### Composants Spécifiques

- **[CommandPalette](../apps/web/src/components/ui/CommandPalette.tsx)** - Palette de commandes ⌘K
- **[MultiSelect](../apps/web/src/components/ui/MultiSelect.tsx)** - Sélection multiple avec tags
- **[RichTextEditor](../apps/web/src/components/ui/RichTextEditor.tsx)** - Éditeur de texte riche

---

## 🎨 Système de Thème

- **[README Thème](../apps/web/src/components/theme/README.md)** - Documentation complète du système de thème
- **[ThemeManager](../apps/web/src/components/theme/ThemeManager.tsx)** - Composant de gestion du thème
- **[ComponentGallery](../apps/web/src/components/theme/ComponentGallery.tsx)** - Galerie de composants pour visualiser le thème

### Fonctionnalités

- ✅ **5 Presets de Thème** - Default, Modern, Corporate, Vibrant, Minimal
- ✅ **Personnalisation Complète** - Couleurs, polices, bordures
- ✅ **Persistance** - Sauvegarde automatique dans localStorage
- ✅ **Variables CSS** - Application globale via CSS variables

---

## 📚 Storybook

- **[README Storybook](../apps/web/.storybook/README.md)** - Guide complet de Storybook
- **[Configuration Main](../apps/web/.storybook/main.ts)** - Configuration principale
- **[Configuration Preview](../apps/web/.storybook/preview.tsx)** - Configuration preview

### Commandes

```bash
cd apps/web
pnpm storybook          # Lancer Storybook
pnpm build-storybook    # Build de production
```

---

## 🎯 Exemples SaaS

- **[README Exemples](../apps/web/src/app/examples/README.md)** - Documentation des exemples SaaS

### Pages Disponibles

- **[Dashboard](../apps/web/src/app/examples/dashboard/page.tsx)** - Dashboard complet
- **[Settings](../apps/web/src/app/examples/settings/page.tsx)** - Page de paramètres
- **[Onboarding](../apps/web/src/app/examples/onboarding/page.tsx)** - Flow d'onboarding

---

## 🧪 Tests

- **[README Tests](../apps/web/src/components/ui/__tests__/README.md)** - Guide des tests
- **[Tests CommandPalette](../apps/web/src/components/ui/__tests__/CommandPalette.test.tsx)** - Tests pour CommandPalette
- **[Tests MultiSelect](../apps/web/src/components/ui/__tests__/MultiSelect.test.tsx)** - Tests pour MultiSelect

### Commandes

```bash
pnpm test              # Lancer tous les tests
pnpm test:ui           # Tests avec interface
pnpm test:coverage     # Couverture de code
```

---

## 🔧 Développement

- **[Development Guide](../DEVELOPMENT.md)** - Guide de développement
- **[Contributing](../CONTRIBUTING.md)** - Guide de contribution
- **[Monorepo](../MONOREPO.md)** - Documentation du monorepo

---

## 📧 Backend & API

- **[Backend README](../backend/README.md)** - Documentation du backend FastAPI
- **[Email System](../docs/EMAIL_SYSTEM.md)** - Système d'email SendGrid
- **[SendGrid Setup](../docs/SENDGRID_SETUP.md)** - Configuration SendGrid

---

## 📊 Évaluations & Audits

- **[Évaluation Template SaaS](../EVALUATION_SAAS_TEMPLATE.md)** - Évaluation complète du template
- **[Résumé Améliorations](../RESUME_AMELIORATIONS.md)** - Résumé de toutes les améliorations
- **[Audit Performance](../docs/PERFORMANCE_AUDIT.md)** - Audit de performance
- **[Audit Sécurité](../docs/SECURITY_AUDIT.md)** - Audit de sécurité

---

## 🚀 Déploiement

- **[README Template SaaS](../README_TEMPLATE_SAAS.md)** - Documentation complète du template
- **[Vérification](../VERIFICATION.md)** - Checklist de vérification
- **[Guide Démarrage](../GUIDE_DEMARRAGE.md)** - Guide de démarrage rapide

---

## 📖 Guides par Thème

### Pour les Développeurs Frontend

1. **[README Composants UI](../apps/web/src/components/ui/README.md)** - Comprendre les composants
2. **[Documentation API](../apps/web/src/app/components/docs/API.md)** - Référence complète
3. **[Guide Thème](../apps/web/src/components/theme/README.md)** - Personnaliser le thème
4. **[Exemples SaaS](../apps/web/src/app/examples/README.md)** - Exemples pratiques

### Pour les Développeurs Backend

1. **[Backend README](../backend/README.md)** - Documentation FastAPI
2. **[Email System](../docs/EMAIL_SYSTEM.md)** - Système d'email
3. **[API Documentation](../README.md#api-endpoints)** - Endpoints API

### Pour les Designers

1. **[Guide Thème](../apps/web/src/components/theme/README.md)** - Système de thème
2. **[Guide Accessibilité](../apps/web/src/components/ui/ACCESSIBILITY.md)** - Standards d'accessibilité
3. **[Exemples SaaS](../apps/web/src/app/examples/README.md)** - Exemples visuels

### Pour les Testeurs

1. **[README Tests](../apps/web/src/components/ui/__tests__/README.md)** - Guide des tests
2. **[Tests Unitaires](../apps/web/src/components/ui/__tests__/)** - Tests existants
3. **[Storybook](../apps/web/.storybook/README.md)** - Tests visuels

---

## 🔍 Recherche Rapide

### Par Composant

- **Button** → [API.md](../apps/web/src/app/components/docs/API.md#button)
- **Input** → [API.md](../apps/web/src/app/components/docs/API.md#input)
- **CommandPalette** → [API.md](../apps/web/src/app/components/docs/API.md#commandpalette)
- **MultiSelect** → [API.md](../apps/web/src/app/components/docs/API.md#multiselect)
- **RichTextEditor** → [API.md](../apps/web/src/app/components/docs/API.md#richtexteditor)

### Par Fonctionnalité

- **Thème** → [README Thème](../apps/web/src/components/theme/README.md)
- **Accessibilité** → [ACCESSIBILITY.md](../apps/web/src/components/ui/ACCESSIBILITY.md)
- **Tests** → [README Tests](../apps/web/src/components/ui/__tests__/README.md)
- **Storybook** → [README Storybook](../apps/web/.storybook/README.md)

### Par Page

- **Dashboard** → [examples/dashboard](../apps/web/src/app/examples/dashboard/page.tsx)
- **Settings** → [examples/settings](../apps/web/src/app/examples/settings/page.tsx)
- **Onboarding** → [examples/onboarding](../apps/web/src/app/examples/onboarding/page.tsx)

---

## 📝 Mise à Jour de la Documentation

Pour mettre à jour cette documentation :

1. Modifier le fichier concerné
2. Mettre à jour cet index si nécessaire
3. Commiter avec le message : `docs: mettre à jour [nom du fichier]`

---

## 🤝 Contribution

Pour contribuer à la documentation :

1. Lire le [Guide de Contribution](../CONTRIBUTING.md)
2. Suivre les standards de documentation
3. Ajouter des exemples pratiques
4. Mettre à jour cet index

---

**Dernière mise à jour** : 2025-01-22

**Version** : 1.0.0

