# 📄 Liste Complète des Pages du Site

**Template**: MODELE-NEXTJS-FULLSTACK  
**Framework**: Next.js 16 (App Router)  
**Date**: January 2025

---

## 🌍 Pages Internationalisées (`/[locale]/`)

Les pages suivantes sont accessibles avec les locales `/fr` et `/en` :

### Page d'Accueil
- **Route**: `/` ou `/[locale]/`
- **Fichier**: `apps/web/src/app/[locale]/page.tsx`
- **Description**: Page d'accueil principale du site

---

## 🔐 Pages d'Authentification (`/auth`)

### Connexion
- **Route**: `/auth/login`
- **Fichier**: `apps/web/src/app/auth/login/page.tsx`
- **Description**: Page de connexion utilisateur

### Inscription
- **Route**: `/auth/register`
- **Fichier**: `apps/web/src/app/auth/register/page.tsx`
- **Description**: Page d'inscription utilisateur

### Sign In (Alternative)
- **Route**: `/auth/signin`
- **Fichier**: `apps/web/src/app/auth/signin/page.tsx`
- **Description**: Page alternative de connexion

### Callback OAuth
- **Route**: `/auth/callback`
- **Fichier**: `apps/web/src/app/auth/callback/page.tsx`
- **Description**: Page de callback pour OAuth (Google, GitHub, etc.)

---

## 📊 Tableau de Bord (`/dashboard`)

### Dashboard Principal
- **Route**: `/dashboard`
- **Fichier**: `apps/web/src/app/dashboard/page.tsx`
- **Description**: Tableau de bord principal utilisateur

### Projets
- **Route**: `/dashboard/projects`
- **Fichier**: `apps/web/src/app/dashboard/projects/page.tsx`
- **Description**: Gestion des projets utilisateur

### Utilisateurs
- **Route**: `/dashboard/users`
- **Fichier**: `apps/web/src/app/dashboard/users/page.tsx`
- **Description**: Gestion des utilisateurs (admin)

### Paramètres
- **Route**: `/dashboard/settings`
- **Fichier**: `apps/web/src/app/dashboard/settings/page.tsx`
- **Description**: Paramètres utilisateur

### Thème
- **Route**: `/dashboard/theme`
- **Fichier**: `apps/web/src/app/dashboard/theme/page.tsx`
- **Description**: Personnalisation du thème

### Devenir Super Admin
- **Route**: `/dashboard/become-superadmin`
- **Fichier**: `apps/web/src/app/dashboard/become-superadmin/page.tsx`
- **Description**: Page pour devenir super administrateur

---

## 👥 Administration (`/admin`)

### Administration Principale
- **Route**: `/admin`
- **Fichier**: `apps/web/src/app/admin/page.tsx`
- **Description**: Page principale d'administration

### Invitations
- **Route**: `/admin/invitations`
- **Fichier**: `apps/web/src/app/admin/invitations/page.tsx`
- **Description**: Gestion des invitations utilisateur

### RBAC (Role-Based Access Control)
- **Route**: `/admin/rbac`
- **Fichier**: `apps/web/src/app/admin/rbac/page.tsx`
- **Description**: Gestion des rôles et permissions

### Équipes
- **Route**: `/admin/teams`
- **Fichier**: `apps/web/src/app/admin/teams/page.tsx`
- **Description**: Gestion des équipes

### Thèmes
- **Route**: `/admin/themes`
- **Fichier**: `apps/web/src/app/admin/themes/page.tsx`
- **Description**: Gestion des thèmes système

---

## 💳 Abonnements (`/subscriptions`)

### Abonnements
- **Route**: `/subscriptions`
- **Fichier**: `apps/web/src/app/subscriptions/page.tsx`
- **Description**: Gestion des abonnements

### Succès d'Abonnement
- **Route**: `/subscriptions/success`
- **Fichier**: `apps/web/src/app/subscriptions/success/page.tsx`
- **Description**: Page de confirmation après abonnement

---

## 💰 Tarification (`/pricing`)

### Page de Tarification
- **Route**: `/pricing`
- **Fichier**: `apps/web/src/app/pricing/page.tsx`
- **Description**: Page présentant les plans et tarifs

---

## 🎨 Composants (`/components`)

### Page Principale des Composants
- **Route**: `/components`
- **Fichier**: `apps/web/src/app/components/page.tsx`
- **Description**: Index de tous les composants disponibles

### Composants par Catégorie

#### Activity
- **Route**: `/components/activity`
- **Fichier**: `apps/web/src/app/components/activity/page.tsx`
- **Description**: Composants de suivi d'activité

#### Admin
- **Route**: `/components/admin`
- **Fichier**: `apps/web/src/app/components/admin/page.tsx`
- **Description**: Composants d'administration

#### Advanced
- **Route**: `/components/advanced`
- **Fichier**: `apps/web/src/app/components/advanced/page.tsx`
- **Description**: Composants avancés

#### Analytics
- **Route**: `/components/analytics`
- **Fichier**: `apps/web/src/app/components/analytics/page.tsx`
- **Description**: Composants d'analytics et reporting

#### Auth
- **Route**: `/components/auth`
- **Fichier**: `apps/web/src/app/components/auth/page.tsx`
- **Description**: Composants d'authentification

#### Billing
- **Route**: `/components/billing`
- **Fichier**: `apps/web/src/app/components/billing/page.tsx`
- **Description**: Composants de facturation

#### Charts
- **Route**: `/components/charts`
- **Fichier**: `apps/web/src/app/components/charts/page.tsx`
- **Description**: Composants de graphiques

#### Collaboration
- **Route**: `/components/collaboration`
- **Fichier**: `apps/web/src/app/components/collaboration/page.tsx`
- **Description**: Composants de collaboration

#### Data
- **Route**: `/components/data`
- **Fichier**: `apps/web/src/app/components/data/page.tsx`
- **Description**: Composants d'affichage de données

#### Errors
- **Route**: `/components/errors`
- **Fichier**: `apps/web/src/app/components/errors/page.tsx`
- **Description**: Composants de gestion d'erreurs

#### Feedback
- **Route**: `/components/feedback`
- **Fichier**: `apps/web/src/app/components/feedback/page.tsx`
- **Description**: Composants de feedback (alerts, toasts, etc.)

#### Forms
- **Route**: `/components/forms`
- **Fichier**: `apps/web/src/app/components/forms/page.tsx`
- **Description**: Composants de formulaires

#### i18n
- **Route**: `/components/i18n`
- **Fichier**: `apps/web/src/app/components/i18n/page.tsx`
- **Description**: Composants d'internationalisation

#### Integrations
- **Route**: `/components/integrations`
- **Fichier**: `apps/web/src/app/components/integrations/page.tsx`
- **Description**: Composants d'intégrations

#### Layout
- **Route**: `/components/layout`
- **Fichier**: `apps/web/src/app/components/layout/page.tsx`
- **Description**: Composants de mise en page

#### Media
- **Route**: `/components/media`
- **Fichier**: `apps/web/src/app/components/media/page.tsx`
- **Description**: Composants média (images, vidéos)

#### Monitoring
- **Route**: `/components/monitoring`
- **Fichier**: `apps/web/src/app/components/monitoring/page.tsx`
- **Description**: Composants de monitoring et performance

#### Navigation
- **Route**: `/components/navigation`
- **Fichier**: `apps/web/src/app/components/navigation/page.tsx`
- **Description**: Composants de navigation

#### Notifications
- **Route**: `/components/notifications`
- **Fichier**: `apps/web/src/app/components/notifications/page.tsx`
- **Description**: Composants de notifications

#### Performance
- **Route**: `/components/performance`
- **Fichier**: `apps/web/src/app/components/performance/page.tsx`
- **Description**: Composants d'optimisation de performance

#### Settings
- **Route**: `/components/settings`
- **Fichier**: `apps/web/src/app/components/settings/page.tsx`
- **Description**: Composants de paramètres

#### Theme
- **Route**: `/components/theme`
- **Fichier**: `apps/web/src/app/components/theme/page.tsx`
- **Description**: Composants de thème

#### Utils
- **Route**: `/components/utils`
- **Fichier**: `apps/web/src/app/components/utils/page.tsx`
- **Description**: Composants utilitaires

#### Workflow
- **Route**: `/components/workflow`
- **Fichier**: `apps/web/src/app/components/workflow/page.tsx`
- **Description**: Composants de workflow

---

## 📊 Monitoring (`/monitoring`)

### Monitoring Principal
- **Route**: `/monitoring`
- **Fichier**: `apps/web/src/app/monitoring/page.tsx`
- **Description**: Dashboard de monitoring système

### Erreurs
- **Route**: `/monitoring/errors`
- **Fichier**: `apps/web/src/app/monitoring/errors/page.tsx`
- **Description**: Suivi des erreurs

### Performance
- **Route**: `/monitoring/performance`
- **Fichier**: `apps/web/src/app/monitoring/performance/page.tsx`
- **Description**: Métriques de performance

---

## 💡 Exemples (`/examples`)

### Exemples Principaux
- **Route**: `/examples`
- **Fichier**: `apps/web/src/app/examples/page.tsx`
- **Description**: Page d'exemples d'utilisation

### Dashboard Example
- **Route**: `/examples/dashboard`
- **Fichier**: `apps/web/src/app/examples/dashboard/page.tsx`
- **Description**: Exemple de tableau de bord

### Onboarding Example
- **Route**: `/examples/onboarding`
- **Fichier**: `apps/web/src/app/examples/onboarding/page.tsx`
- **Description**: Exemple de processus d'onboarding

### Settings Example
- **Route**: `/examples/settings`
- **Fichier**: `apps/web/src/app/examples/settings/page.tsx`
- **Description**: Exemple de page de paramètres

---

## 🧪 Pages de Test

### Test Sentry
- **Route**: `/test-sentry`
- **Fichier**: `apps/web/src/app/test-sentry/page.tsx`
- **Description**: Page de test pour Sentry (error tracking)

### Test Email
- **Route**: `/email/test`
- **Fichier**: `apps/web/src/app/email/test/page.tsx`
- **Description**: Page de test pour l'envoi d'emails

### Test AI
- **Route**: `/ai/test`
- **Fichier**: `apps/web/src/app/ai/test/page.tsx`
- **Description**: Page de test pour les fonctionnalités AI

---

## 📤 Upload

### Upload de Fichiers
- **Route**: `/upload`
- **Fichier**: `apps/web/src/app/upload/page.tsx`
- **Description**: Page d'upload de fichiers

---

## 📚 Documentation

### Documentation
- **Route**: `/docs`
- **Fichier**: `apps/web/src/app/docs/page.tsx`
- **Description**: Documentation du projet

---

## 🗺️ Sitemap

### Sitemap XML
- **Route**: `/sitemap`
- **Fichier**: `apps/web/src/app/sitemap/page.tsx` ou `sitemap.ts`
- **Description**: Génération automatique du sitemap

---

## 📊 Statistiques

### Total des Pages

| Catégorie | Nombre |
|-----------|--------|
| **Pages Internationalisées** | 1 |
| **Authentification** | 4 |
| **Dashboard** | 6 |
| **Administration** | 5 |
| **Abonnements** | 2 |
| **Tarification** | 1 |
| **Composants (Showcase)** | 25 |
| **Monitoring** | 3 |
| **Exemples** | 4 |
| **Tests** | 3 |
| **Upload** | 1 |
| **Documentation** | 1 |
| **Sitemap** | 1 |
| **TOTAL** | **57 pages** |

---

## 🔗 Routes Principales par Catégorie

### Pages Publiques
- `/` - Accueil
- `/pricing` - Tarification
- `/auth/login` - Connexion
- `/auth/register` - Inscription
- `/components` - Showcase des composants

### Pages Authentifiées
- `/dashboard` - Tableau de bord
- `/dashboard/projects` - Projets
- `/dashboard/settings` - Paramètres
- `/subscriptions` - Abonnements

### Pages Admin
- `/admin` - Administration
- `/admin/teams` - Gestion des équipes
- `/admin/rbac` - Rôles et permissions
- `/admin/invitations` - Invitations

### Pages de Monitoring
- `/monitoring` - Monitoring système
- `/monitoring/errors` - Erreurs
- `/monitoring/performance` - Performance

### Pages de Test
- `/test-sentry` - Test Sentry
- `/email/test` - Test Email
- `/ai/test` - Test AI

---

## 🌐 Internationalisation

Toutes les pages principales sont disponibles en :
- **Français**: `/fr/[route]`
- **Anglais**: `/en/[route]`

Exemples :
- `/fr/dashboard` - Tableau de bord en français
- `/en/dashboard` - Dashboard in English
- `/fr/components` - Composants en français
- `/en/components` - Components in English

---

## 📝 Notes

- Les pages dans `/components` sont des **showcase pages** pour présenter les composants
- Les pages dans `/examples` sont des **exemples d'implémentation**
- Les pages dans `/admin` nécessitent des **permissions administrateur**
- Les pages dans `/dashboard` nécessitent une **authentification**
- Les pages de test (`/test-sentry`, `/email/test`, `/ai/test`) sont pour le développement

---

**Dernière mise à jour**: January 2025  
**Total**: 57 pages

