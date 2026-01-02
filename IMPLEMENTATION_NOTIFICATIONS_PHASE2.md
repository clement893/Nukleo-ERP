# Implémentation Notifications - Phase 2

## Date: 2026-01-01

## ✅ Notifications Implémentées

### 1. Échéance Approchante (Tâches)
- **Déclencheur** : Tâche avec échéance dans 1-3 jours
- **Destinataire** : L'assigné de la tâche
- **Type** : `WARNING`
- **Template** : `NotificationTemplates.task_due_soon()`
- **Implémentation** : Tâche Celery périodique `check_task_due_dates_task()`
- **Fichier** : `backend/app/tasks/task_due_alerts.py`

### 2. Tâche En Retard
- **Déclencheur** : Tâche avec échéance dépassée
- **Destinataire** : L'assigné ET le créateur
- **Type** : `ERROR`
- **Template** : `NotificationTemplates.task_overdue()`
- **Implémentation** : Tâche Celery périodique `check_task_due_dates_task()`
- **Fichier** : `backend/app/tasks/task_due_alerts.py`

### 3. Comptes de Dépenses - Soumis
- **Déclencheur** : Soumission d'un compte de dépenses
- **Destinataire** : Les administrateurs
- **Type** : `INFO`
- **Template** : `NotificationTemplates.expense_account_submitted()`
- **Fichier** : `backend/app/api/v1/endpoints/finances/compte_depenses.py` (ligne ~497)

### 4. Comptes de Dépenses - Approuvé
- **Déclencheur** : Approbation d'un compte de dépenses
- **Destinataire** : L'employé qui a soumis
- **Type** : `SUCCESS`
- **Template** : `NotificationTemplates.expense_account_approved()`
- **Fichier** : `backend/app/api/v1/endpoints/finances/compte_depenses.py` (ligne ~599)

### 5. Comptes de Dépenses - Rejeté
- **Déclencheur** : Rejet d'un compte de dépenses
- **Destinataire** : L'employé qui a soumis
- **Type** : `WARNING`
- **Template** : `NotificationTemplates.expense_account_rejected()`
- **Fichier** : `backend/app/api/v1/endpoints/finances/compte_depenses.py` (ligne ~703)

### 6. Facture Payée
- **Déclencheur** : Paiement complet d'une facture
- **Destinataire** : Le propriétaire du compte
- **Type** : `SUCCESS`
- **Template** : `NotificationTemplates.invoice_paid()`
- **Fichier** : `backend/app/api/v1/endpoints/finances/facturations.py` (ligne ~656)

### 7. Facture En Retard
- **Déclencheur** : Facture avec échéance dépassée
- **Destinataire** : Le propriétaire du compte
- **Type** : `ERROR`
- **Template** : `NotificationTemplates.invoice_overdue()`
- **Implémentation** : Tâche Celery périodique `check_invoice_due_dates_task()`
- **Fichier** : `backend/app/tasks/invoice_alerts.py`

### 8. Échéance de Paiement Approchante
- **Déclencheur** : Facture due dans 1-3 jours
- **Destinataire** : Le propriétaire du compte
- **Type** : `WARNING`
- **Implémentation** : Tâche Celery périodique `check_invoice_due_dates_task()`
- **Fichier** : `backend/app/tasks/invoice_alerts.py`

### 9. Opportunité Créée
- **Déclencheur** : Création d'une opportunité avec assigné
- **Destinataire** : L'utilisateur assigné
- **Type** : `INFO`
- **Template** : `NotificationTemplates.opportunity_created()`
- **Fichier** : `backend/app/api/v1/endpoints/commercial/opportunities.py` (ligne ~523)

### 10. Opportunité Gagnée
- **Déclencheur** : Changement de statut vers "won"
- **Destinataire** : L'assigné ET le créateur
- **Type** : `SUCCESS`
- **Template** : `NotificationTemplates.opportunity_won()`
- **Fichier** : `backend/app/api/v1/endpoints/commercial/opportunities.py` (ligne ~677)

### 11. Mention dans Commentaire
- **Déclencheur** : Mention d'un utilisateur (@username ou @email) dans un commentaire
- **Destinataire** : L'utilisateur mentionné
- **Type** : `INFO`
- **Template** : `NotificationTemplates.mention_in_comment()`
- **Détection** : Regex pattern `@(\w+(?:\.\w+)*@?\w*\.?\w*)`
- **Fichier** : `backend/app/api/v1/endpoints/project_comments.py` (ligne ~195)

---

## 📄 Page Dédiée Notifications

### Nouvelle Page : `/notifications`

**Fichier** : `apps/web/src/app/[locale]/notifications/page.tsx`

**Fonctionnalités** :
- ✅ Liste complète de toutes les notifications
- ✅ Filtres par statut (Toutes, Non lues, Lues)
- ✅ Filtres par type (Info, Succès, Avertissement, Erreur)
- ✅ Compteur de notifications non lues
- ✅ Action "Tout marquer comme lu"
- ✅ Lien vers les paramètres de notifications
- ✅ Design cohérent avec le reste de l'application

**Composants utilisés** :
- `NotificationList` : Composant réutilisable avec props pour filtres
- `PageHeader` : En-tête avec breadcrumbs
- `Card` : Conteneur pour les filtres et actions

---

## 🔧 Tâches Celery Créées

### 1. `check_task_due_dates_task()`
- **Fichier** : `backend/app/tasks/task_due_alerts.py`
- **Fréquence recommandée** : Quotidienne (8h AM)
- **Fonction** : Vérifie les échéances de tâches et crée des notifications pour :
  - Tâches dues dans 1-3 jours
  - Tâches en retard

### 2. `check_invoice_due_dates_task()`
- **Fichier** : `backend/app/tasks/invoice_alerts.py`
- **Fréquence recommandée** : Quotidienne (8h AM)
- **Fonction** : Vérifie les échéances de factures et crée des notifications pour :
  - Factures dues dans 1-3 jours
  - Factures en retard

---

## 📋 Templates Ajoutés

Tous les templates suivants ont été ajoutés à `backend/app/utils/notification_templates.py` :

1. `task_overdue()` - Tâche en retard
2. `timesheet_submitted()` - Feuille de temps soumise
3. `timesheet_approved()` - Feuille de temps approuvée
4. `timesheet_rejected()` - Feuille de temps rejetée
5. `expense_account_submitted()` - Compte de dépenses soumis
6. `expense_account_approved()` - Compte de dépenses approuvé
7. `expense_account_rejected()` - Compte de dépenses rejeté
8. `invoice_paid()` - Facture payée
9. `invoice_overdue()` - Facture en retard
10. `opportunity_created()` - Opportunité créée
11. `opportunity_won()` - Opportunité gagnée
12. `mention_in_comment()` - Mention dans commentaire

---

## ⚠️ Note sur les Feuilles de Temps

Les **feuilles de temps (time entries)** n'ont pas actuellement de système de soumission/approbation dans le codebase. Les templates ont été créés (`timesheet_submitted`, `timesheet_approved`, `timesheet_rejected`) mais ne sont pas encore utilisés.

**Pour implémenter** :
1. Ajouter un champ `status` au modèle `TimeEntry`
2. Créer des endpoints pour soumettre/approuver/rejeter
3. Instrumenter ces endpoints avec les notifications

---

## 📊 Statistiques Finales

### Notifications Implémentées (Total)
- **Phase 1** : 13 notifications
- **Phase 2** : 11 notifications
- **Total** : **24 notifications**

### Endpoints Instrumentés
- `project_tasks.py` : ✅
- `project_comments.py` : ✅
- `projects/__init__.py` : ✅
- `teams.py` : ✅
- `finances/tresorerie.py` : ✅
- `finances/compte_depenses.py` : ✅
- `finances/facturations.py` : ✅
- `commercial/opportunities.py` : ✅

### Tâches Celery
- `check_task_due_dates_task()` : ✅
- `check_invoice_due_dates_task()` : ✅
- `check_treasury_alerts_task()` : ✅ (Phase 1)

### Pages Frontend
- `/settings/notifications` : ✅ (Phase 1)
- `/notifications` : ✅ (Phase 2)

---

## 🚀 Configuration Celery Beat (Recommandée)

Pour activer les vérifications périodiques, ajouter dans la configuration Celery :

```python
from celery.schedules import crontab
from app.tasks.task_due_alerts import check_task_due_dates_task
from app.tasks.invoice_alerts import check_invoice_due_dates_task
from app.tasks.treasury_alert_tasks import check_treasury_alerts_task

celery_app.conf.beat_schedule = {
    'check-task-due-dates-daily': {
        'task': 'app.tasks.task_due_alerts.check_task_due_dates_task',
        'schedule': crontab(hour=8, minute=0),  # Daily at 8 AM
    },
    'check-invoice-due-dates-daily': {
        'task': 'app.tasks.invoice_alerts.check_invoice_due_dates_task',
        'schedule': crontab(hour=8, minute=0),  # Daily at 8 AM
    },
    'check-treasury-alerts-daily': {
        'task': 'app.tasks.treasury_alert_tasks.check_treasury_alerts_task',
        'schedule': crontab(hour=9, minute=0),  # Daily at 9 AM
    },
}
```

---

## ✅ Résumé

Toutes les notifications demandées ont été implémentées :
- ✅ Échéance approchante (tâches)
- ✅ Tâche en retard
- ✅ Comptes de dépenses (soumis/approuvé/rejeté)
- ✅ Facture payée/en retard
- ✅ Opportunités (créée/gagnée)
- ✅ Mention dans commentaire
- ✅ Page dédiée pour voir toutes les notifications

**Note** : Les feuilles de temps nécessitent d'abord l'ajout d'un système de soumission/approbation avant de pouvoir être instrumentées.
