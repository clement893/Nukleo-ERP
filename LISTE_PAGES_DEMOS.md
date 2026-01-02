# 📋 Liste Complète des Pages Démos

Ce document répertorie toutes les pages de démonstration disponibles dans l'application Nukleo-ERP.

## 🎯 Pages Démos Publiques

### Page Demo Principale
- **`/[locale]/demo`** - Page de démonstration publique accessible sans authentification
  - Fichier: `apps/web/src/app/[locale]/demo/page.tsx`

---

## 🏢 Dashboard - Pages Démos

### Administration
- **`/[locale]/dashboard/admin-media-demo`** - Démo de gestion des médias
- **`/[locale]/dashboard/admin-teams-demo`** - Démo de gestion des équipes
- **`/[locale]/dashboard/admin-users-demo`** - Démo de gestion des utilisateurs

### Portail Employé
- **`/[locale]/portail-employe-demo`** - Page principale du portail employé (démo)
  - **`/[locale]/portail-employe-demo/taches`** - Mes tâches (démo)
  - **`/[locale]/portail-employe-demo/projets`** - Mes projets (démo)
  - **`/[locale]/portail-employe-demo/feuilles-de-temps`** - Mes feuilles de temps (démo)
  - **`/[locale]/portail-employe-demo/depenses`** - Mes comptes de dépenses (démo)
  - **`/[locale]/portail-employe-demo/vacances`** - Mes vacances (démo)
  - **`/[locale]/portail-employe-demo/leo`** - Mon Leo (démo)
  - **`/[locale]/portail-employe-demo/deadlines`** - Mes deadlines (démo)
  - **`/[locale]/portail-employe-demo/profil`** - Mon profil (démo)

### Gestion de Projets
- **`/[locale]/dashboard/projets-demo`** - Démo de gestion des projets
- **`/[locale]/dashboard/taches-demo`** - Démo de gestion des tâches
- **`/[locale]/dashboard/demo`** - Page démo de projet avec onglets (Overview, Tasks, Timeline, Files, Team, Activity)
  - Composants associés:
    - `apps/web/src/app/[locale]/dashboard/demo/components/OverviewTab.tsx`
    - `apps/web/src/app/[locale]/dashboard/demo/components/TasksTab.tsx`
    - `apps/web/src/app/[locale]/dashboard/demo/components/ProjectTabs.tsx`
    - `apps/web/src/app/[locale]/dashboard/demo/components/ProjectHeader.tsx`

### Clients & Contacts
- **`/[locale]/dashboard/clients-demo`** - Démo de gestion des clients
- **`/[locale]/dashboard/client-detail-demo`** - Démo de détail client
  - **`/[locale]/dashboard/client-detail-demo/[id]`** - Démo de détail client par ID
- **`/[locale]/dashboard/contacts-demo`** - Démo de gestion des contacts
- **`/[locale]/dashboard/contact-detail-demo`** - Démo de détail contact

### Entreprises & Réseau
- **`/[locale]/dashboard/entreprises-demo`** - Démo de gestion des entreprises
- **`/[locale]/dashboard/entreprise-detail-demo`** - Démo de détail entreprise
- **`/[locale]/dashboard/reseau-demo`** - Démo du module réseau

### Commercial
- **`/[locale]/dashboard/commercial-demo`** - Démo du module commercial
- **`/[locale]/dashboard/opportunites-demo`** - Démo de gestion des opportunités
- **`/[locale]/dashboard/soumissions-demo`** - Démo de gestion des soumissions
- **`/[locale]/dashboard/pipeline-demo`** - Démo de pipeline
- **`/[locale]/dashboard/pipelines-demo`** - Démo de pipelines (liste)
- **`/[locale]/dashboard/pipeline-client-demo`** - Démo de pipeline client
  - **`/[locale]/dashboard/pipeline-client-demo/[id]`** - Démo de détail pipeline client

### Finances
- **`/[locale]/dashboard/finances-demo`** - Démo du module finances
- **`/[locale]/dashboard/facturations-demo`** - Démo de gestion des facturations
- **`/[locale]/dashboard/compte-depenses-demo`** - Démo de gestion des comptes de dépenses
- **`/[locale]/dashboard/cashflow-management-demo`** - Démo de gestion du cashflow
- **`/[locale]/dashboard/prevision-financiere-demo`** - Démo de prévision financière
- **`/[locale]/dashboard/rapport-demo`** - Démo de rapport
- **`/[locale]/dashboard/rapport-revenus-demo`** - Démo de rapport de revenus
- **`/[locale]/dashboard/rapport-depenses-demo`** - Démo de rapport de dépenses

### Ressources Humaines
- **`/[locale]/dashboard/employes-demo`** - Démo de gestion des employés
- **`/[locale]/dashboard/feuilles-temps-demo`** - Démo de gestion des feuilles de temps
- **`/[locale]/dashboard/vacances-demo`** - Démo de gestion des vacances

### Agenda & Calendrier
- **`/[locale]/dashboard/calendrier-demo`** - Démo de calendrier
- **`/[locale]/dashboard/evenements-demo`** - Démo de gestion des événements
- **`/[locale]/dashboard/deadlines-demo`** - Démo de gestion des deadlines

### Management & Organisation
- **`/[locale]/dashboard/management-demo`** - Démo du module management
- **`/[locale]/dashboard/onboarding-demo`** - Démo d'onboarding
- **`/[locale]/dashboard/projects-demo`** - Démo de projets (liste)

### Interface & Navigation
- **`/[locale]/dashboard/sidebar-demo`** - Démo de sidebar
- **`/[locale]/dashboard/menu-demo`** - Démo de menu

### IA & Assistant
- **`/[locale]/dashboard/leo-demo`** - Démo de Leo (assistant IA)

### Tests
- **`/[locale]/dashboard/test/card-demo`** - Démo de composant Card
  - Fichier: `apps/web/src/app/[locale]/dashboard/test/card-demo/page.tsx`

---

## 📊 Statistiques

### Total des Pages Démos
- **Dashboard Démos**: ~45 pages
- **Portail Employé Démos**: 9 pages
- **Page Demo Publique**: 1 page
- **Total**: ~55 pages de démonstration

### Répartition par Module
- **Administration**: 3 pages
- **Portail Employé**: 9 pages
- **Projets & Tâches**: 4 pages
- **Clients & Contacts**: 4 pages
- **Entreprises & Réseau**: 3 pages
- **Commercial**: 6 pages
- **Finances**: 8 pages
- **Ressources Humaines**: 3 pages
- **Agenda**: 3 pages
- **Management**: 3 pages
- **Interface**: 2 pages
- **IA**: 1 page
- **Tests**: 1 page

---

## 🔍 Notes

- Toutes les pages démos sont accessibles via le préfixe `/[locale]/dashboard/*-demo` ou `/[locale]/portail-employe-demo/*`
- La page publique `/demo` est accessible sans authentification
- Les autres pages démos nécessitent généralement une authentification
- Certaines pages démos peuvent utiliser des données mockées ou des données réelles selon leur configuration

---

## 📝 Format des Routes

Toutes les routes suivent le pattern Next.js avec support multilingue:
- Format: `/[locale]/dashboard/[module]-demo` ou `/[locale]/portail-employe-demo/[page]`
- Locales supportées: `fr`, `en`, `ar`, `he` (selon configuration)
- Exemple: `/fr/dashboard/clients-demo` ou `/en/dashboard/clients-demo`
