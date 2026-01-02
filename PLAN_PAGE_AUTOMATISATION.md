# Plan d'Implémentation - Page d'Automatisation

## Vue d'ensemble

Création d'une page d'automatisation dans les paramètres (`/settings/automation`) permettant aux utilisateurs de créer, gérer et surveiller des automatisations pour leur ERP Nukleo.

## Objectifs

1. **Créer une interface utilisateur complète** pour gérer les automatisations
2. **Intégrer avec l'API backend existante** (scheduled_tasks)
3. **Fournir des fonctionnalités d'automatisation** basées sur des règles et des tâches planifiées
4. **Offrir une expérience utilisateur intuitive** pour créer et gérer des automatisations

---

## Structure des fichiers à créer

### Frontend

```
apps/web/src/app/[locale]/settings/automation/
  └── page.tsx                    # Page principale d'automatisation

apps/web/src/components/settings/
  ├── AutomationSettings.tsx      # Composant principal d'automatisation
  ├── AutomationRulesList.tsx     # Liste des règles d'automatisation
  ├── AutomationRuleForm.tsx      # Formulaire de création/édition de règle
  ├── ScheduledTasksList.tsx      # Liste des tâches planifiées
  ├── ScheduledTaskForm.tsx       # Formulaire de création/édition de tâche
  └── AutomationTemplates.tsx     # Templates d'automatisation prédéfinis

apps/web/src/lib/api/
  └── automation.ts               # Client API pour les automatisations
```

### Backend (si nécessaire)

```
backend/app/api/v1/endpoints/
  └── automation_rules.py         # Endpoints pour les règles d'automatisation (nouveau)
```

---

## Fonctionnalités principales

### 1. **Règles d'Automatisation** (Event-based)

#### Types de déclencheurs (Triggers)
- **Événements utilisateur**
  - Création/Modification/Suppression d'utilisateur
  - Connexion/Déconnexion
  - Changement de rôle/permissions

- **Événements projets**
  - Création/Modification/Suppression de projet
  - Changement de statut de projet
  - Ajout de membre à un projet

- **Événements clients**
  - Création/Modification de client
  - Nouveau contact ajouté
  - Changement de statut

- **Événements facturation**
  - Facture créée/payée
  - Paiement reçu
  - Échéance approchante

- **Événements tâches**
  - Tâche créée/complétée
  - Échéance approchante
  - Assignation de tâche

#### Types d'actions
- **Notifications**
  - Envoyer une notification in-app
  - Envoyer un email
  - Envoyer un SMS (si configuré)

- **Création/Modification de données**
  - Créer une tâche
  - Créer un projet
  - Mettre à jour un champ
  - Créer un contact

- **Intégrations**
  - Appeler un webhook
  - Synchroniser avec un service externe
  - Créer un enregistrement dans un autre système

#### Conditions
- Opérateurs : égal, différent, contient, supérieur, inférieur, entre
- Combinaisons : ET, OU
- Champs personnalisés

### 2. **Tâches Planifiées** (Scheduled Tasks)

#### Types de tâches
- **Email**
  - Envoi d'emails récurrents
  - Rappels automatiques
  - Rapports périodiques

- **Rapport**
  - Génération de rapports
  - Export de données
  - Statistiques

- **Synchronisation**
  - Sync avec services externes
  - Backup de données
  - Mise à jour de cache

- **Personnalisé**
  - Tâches définies par l'utilisateur
  - Scripts personnalisés

#### Planification
- **Une fois** : Exécution unique à une date/heure précise
- **Quotidien** : Répétition quotidienne
- **Hebdomadaire** : Répétition hebdomadaire (jours spécifiques)
- **Mensuel** : Répétition mensuelle (jour du mois)
- **Cron** : Expression cron personnalisée

### 3. **Templates d'Automatisation**

Templates prédéfinis pour démarrer rapidement :
- **Rapport mensuel automatique**
  - Déclencheur : Premier jour du mois
  - Action : Générer et envoyer un rapport mensuel

- **Rappel d'échéance de facture**
  - Déclencheur : 7 jours avant échéance
  - Action : Envoyer un email de rappel

- **Bienvenue nouveau client**
  - Déclencheur : Création d'un nouveau client
  - Action : Envoyer un email de bienvenue

- **Notification de tâche assignée**
  - Déclencheur : Assignation d'une tâche
  - Action : Notifier l'utilisateur assigné

- **Rapport hebdomadaire d'équipe**
  - Déclencheur : Chaque lundi
  - Action : Générer un rapport d'activité hebdomadaire

---

## Interface utilisateur

### Structure de la page

```
┌─────────────────────────────────────────────────────────┐
│  Paramètres > Automatisation                             │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  [Onglets]                                                │
│  ┌─────────────┬─────────────┬─────────────┐            │
│  │ Règles      │ Tâches      │ Templates   │            │
│  └─────────────┴─────────────┴─────────────┘            │
│                                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │ [+ Nouvelle règle]  [Filtres]  [Recherche]       │  │
│  ├───────────────────────────────────────────────────┤  │
│  │                                                   │  │
│  │  [Carte Règle 1]                                   │  │
│  │  ┌─────────────────────────────────────────────┐ │  │
│  │  │ ✓ Envoyez un email quand un nouveau client  │ │  │
│  │  │   est créé                                    │ │  │
│  │  │   Déclencheur: client.created                │ │  │
│  │  │   Action: email.send                          │ │  │
│  │  │   Dernière exécution: Il y a 2h              │ │  │
│  │  │   [Activer/Désactiver] [Modifier] [Supprimer]│ │  │
│  │  └─────────────────────────────────────────────┘ │  │
│  │                                                   │  │
│  │  [Carte Règle 2]                                   │  │
│  │  ...                                               │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Composants UI

#### 1. **AutomationSettings.tsx** (Composant principal)
- Gestion des onglets (Règles, Tâches, Templates)
- État global des automatisations
- Intégration avec l'API

#### 2. **AutomationRulesList.tsx**
- Affichage de la liste des règles
- Filtres (actif/inactif, type de déclencheur)
- Recherche
- Statistiques (nombre d'exécutions)

#### 3. **AutomationRuleForm.tsx**
- Formulaire de création/édition
- Sélection du déclencheur
- Configuration des conditions
- Sélection des actions
- Prévisualisation de la règle

#### 4. **ScheduledTasksList.tsx**
- Liste des tâches planifiées
- Statut (en attente, en cours, terminée, échouée)
- Prochaine exécution
- Historique d'exécution

#### 5. **ScheduledTaskForm.tsx**
- Formulaire de création/édition
- Sélection du type de tâche
- Configuration de la planification
- Paramètres de la tâche

#### 6. **AutomationTemplates.tsx**
- Galerie de templates
- Prévisualisation
- Application d'un template

---

## Intégration API

### Endpoints existants à utiliser

```
GET    /api/v1/scheduled-tasks              # Liste des tâches
POST   /api/v1/scheduled-tasks              # Créer une tâche
GET    /api/v1/scheduled-tasks/{id}         # Détails d'une tâche
PUT    /api/v1/scheduled-tasks/{id}         # Modifier une tâche
DELETE /api/v1/scheduled-tasks/{id}         # Supprimer une tâche
GET    /api/v1/scheduled-tasks/{id}/logs   # Logs d'exécution
```

### Endpoints à créer (si nécessaire)

```
GET    /api/v1/automation-rules             # Liste des règles
POST   /api/v1/automation-rules             # Créer une règle
GET    /api/v1/automation-rules/{id}         # Détails d'une règle
PUT    /api/v1/automation-rules/{id}         # Modifier une règle
DELETE /api/v1/automation-rules/{id}         # Supprimer une règle
POST   /api/v1/automation-rules/{id}/test    # Tester une règle
GET    /api/v1/automation-rules/{id}/stats   # Statistiques d'une règle
GET    /api/v1/automation-templates          # Liste des templates
```

---

## Modèle de données

### AutomationRule (Frontend)

```typescript
interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  trigger: {
    event: string;
    conditions?: Array<{
      field: string;
      operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'between';
      value: string | number | boolean;
    }>;
  };
  actions: Array<{
    type: string;
    config: Record<string, unknown>;
  }>;
  createdAt: string;
  updatedAt: string;
  lastTriggered?: string;
  triggerCount: number;
  userId: number;
}
```

### ScheduledTask (déjà existant dans le backend)

```python
class ScheduledTask:
    id: int
    name: str
    description: Optional[str]
    task_type: TaskType  # EMAIL, REPORT, SYNC, CUSTOM
    scheduled_at: datetime
    recurrence: Optional[str]  # 'daily', 'weekly', 'monthly', 'cron'
    recurrence_config: Optional[dict]
    status: TaskStatus  # PENDING, RUNNING, COMPLETED, FAILED, CANCELLED
    task_data: Optional[dict]
    result_data: Optional[dict]
    user_id: Optional[int]
```

---

## Étapes d'implémentation

### Phase 1 : Structure de base (Jour 1-2)

1. **Créer la page principale**
   - `apps/web/src/app/[locale]/settings/automation/page.tsx`
   - Structure de base avec onglets
   - Intégration avec le layout des paramètres

2. **Ajouter la navigation**
   - Mettre à jour `SettingsNavigation.tsx`
   - Ajouter l'icône et le lien vers `/settings/automation`
   - Mettre à jour le sitemap

3. **Créer le client API**
   - `apps/web/src/lib/api/automation.ts`
   - Fonctions pour interagir avec l'API backend
   - Gestion des erreurs

### Phase 2 : Tâches planifiées (Jour 3-4)

1. **Composant ScheduledTasksList**
   - Affichage de la liste
   - Filtres et recherche
   - Actions (créer, modifier, supprimer, activer/désactiver)

2. **Composant ScheduledTaskForm**
   - Formulaire de création/édition
   - Sélection du type de tâche
   - Configuration de la planification
   - Validation

3. **Intégration avec l'API**
   - Utiliser les endpoints existants
   - Gestion des états (loading, error, success)
   - Refresh automatique

### Phase 3 : Règles d'automatisation (Jour 5-7)

1. **Composant AutomationRulesList**
   - Affichage de la liste
   - Filtres et recherche
   - Statistiques

2. **Composant AutomationRuleForm**
   - Sélection du déclencheur
   - Configuration des conditions
   - Sélection des actions
   - Prévisualisation

3. **Backend (si nécessaire)**
   - Créer les endpoints pour les règles
   - Modèle de données
   - Service de gestion des règles

### Phase 4 : Templates (Jour 8)

1. **Composant AutomationTemplates**
   - Galerie de templates
   - Prévisualisation
   - Application d'un template

2. **Templates prédéfinis**
   - Définir les templates de base
   - Configuration JSON

### Phase 5 : Améliorations et polish (Jour 9-10)

1. **Tests**
   - Tests unitaires des composants
   - Tests d'intégration API
   - Tests E2E (si applicable)

2. **Documentation**
   - Documentation des composants
   - Guide utilisateur
   - Exemples d'utilisation

3. **Optimisations**
   - Performance
   - Accessibilité
   - Responsive design

---

## Design et UX

### Principes de design

1. **Simplicité**
   - Interface claire et intuitive
   - Formulaires guidés
   - Messages d'aide contextuels

2. **Feedback visuel**
   - États de chargement
   - Messages de succès/erreur
   - Indicateurs de statut

3. **Accessibilité**
   - Navigation au clavier
   - ARIA labels
   - Contraste des couleurs

### Style visuel

- Utiliser le design system existant
- Cards pour les règles/tâches
- Badges pour les statuts
- Icônes Lucide React
- Couleurs cohérentes avec le thème

---

## Traductions

Ajouter les traductions dans les fichiers de locale :

```json
{
  "settings": {
    "automation": {
      "title": "Automatisation",
      "description": "Gérez vos automatisations et tâches planifiées",
      "rules": {
        "title": "Règles d'automatisation",
        "create": "Créer une règle",
        "edit": "Modifier la règle",
        "delete": "Supprimer la règle",
        "enable": "Activer",
        "disable": "Désactiver"
      },
      "tasks": {
        "title": "Tâches planifiées",
        "create": "Créer une tâche",
        "edit": "Modifier la tâche",
        "delete": "Supprimer la tâche"
      },
      "templates": {
        "title": "Templates",
        "apply": "Appliquer le template"
      }
    }
  }
}
```

---

## Sécurité et permissions

1. **Permissions**
   - Vérifier les permissions utilisateur
   - Seuls les utilisateurs autorisés peuvent créer/modifier des automatisations
   - Limiter l'accès aux tâches système

2. **Validation**
   - Valider les données côté client et serveur
   - Limiter les types d'actions possibles
   - Sanitizer les entrées utilisateur

3. **Rate limiting**
   - Limiter le nombre d'automatisations par utilisateur
   - Limiter la fréquence d'exécution

---

## Métriques et monitoring

1. **Statistiques**
   - Nombre d'exécutions par règle/tâche
   - Taux de succès/échec
   - Temps d'exécution moyen

2. **Logs**
   - Historique des exécutions
   - Logs d'erreurs
   - Audit trail

---

## Tests

### Tests unitaires
- Composants React
- Fonctions utilitaires
- Client API

### Tests d'intégration
- Flux complet de création d'automatisation
- Exécution de règles
- Planification de tâches

### Tests E2E
- Scénarios utilisateur complets
- Création et exécution d'automatisations

---

## Dépendances

### Frontend
- React Query (déjà utilisé)
- Lucide React (déjà utilisé)
- Composants UI existants

### Backend
- Modèle ScheduledTask (existant)
- Service ScheduledTaskService (existant)
- Endpoints API (existants pour les tâches)

---

## Notes importantes

1. **Compatibilité**
   - S'assurer que les automatisations ne cassent pas les fonctionnalités existantes
   - Gérer les erreurs gracieusement

2. **Performance**
   - Pagination pour les listes longues
   - Lazy loading des détails
   - Cache des données fréquemment utilisées

3. **Évolutivité**
   - Architecture modulaire
   - Facile à étendre avec de nouveaux types de déclencheurs/actions
   - API extensible

---

## Prochaines étapes après l'implémentation

1. **Améliorations futures**
   - Éditeur visuel de workflows (drag & drop)
   - Plus de types de déclencheurs/actions
   - Intégrations avec plus de services externes
   - Marketplace de templates

2. **Analytics**
   - Dashboard d'analytics des automatisations
   - Recommandations d'automatisations
   - Optimisation automatique

---

## Checklist de livraison

- [ ] Page d'automatisation créée
- [ ] Navigation mise à jour
- [ ] Composants UI créés
- [ ] Intégration API fonctionnelle
- [ ] Gestion des tâches planifiées
- [ ] Gestion des règles d'automatisation
- [ ] Templates disponibles
- [ ] Traductions ajoutées
- [ ] Tests écrits
- [ ] Documentation complète
- [ ] Code review effectué
- [ ] Déploiement validé

---

**Date de création** : 2024
**Auteur** : Plan d'implémentation pour la page d'automatisation
**Version** : 1.0
