# Liste des Notifications - Implémentées et Potentielles

## Date: 2026-01-01

---

## ✅ NOTIFICATIONS IMPLÉMENTÉES

### 📋 Tâches (Project Tasks)

#### 1. Tâche Assignée
- **Déclencheur** : Création d'une tâche avec assigné OU changement d'assigné
- **Destinataire** : L'utilisateur assigné à la tâche
- **Type** : `INFO`
- **Template** : `NotificationTemplates.task_assigned()`
- **Message** : "La tâche '{task_title}' vous a été assignée dans le projet {project_name}."
- **Action** : Lien vers `/dashboard/projects/tasks?task={task_id}`
- **Fichier** : `backend/app/api/v1/endpoints/project_tasks.py` (lignes 397-410, 615-625)

#### 2. Tâche Créée (Confirmation)
- **Déclencheur** : Création d'une nouvelle tâche
- **Destinataire** : Le créateur de la tâche
- **Type** : `SUCCESS`
- **Template** : `NotificationTemplates.task_created()`
- **Message** : "La tâche '{task_title}' a été créée dans le projet {project_name}."
- **Action** : Lien vers `/dashboard/projects/tasks?task={task_id}`
- **Fichier** : `backend/app/api/v1/endpoints/project_tasks.py` (lignes 412-422)

#### 3. Tâche Réassignée (Ancien Assigné)
- **Déclencheur** : Changement d'assigné d'une tâche
- **Destinataire** : L'ancien assigné (si différent du modificateur)
- **Type** : `INFO`
- **Message** : "La tâche '{task_title}' vous a été retirée."
- **Action** : Lien vers `/dashboard/projects/tasks?task={task_id}`
- **Fichier** : `backend/app/api/v1/endpoints/project_tasks.py` (lignes 630-640)

#### 4. Tâche Complétée
- **Déclencheur** : Changement de statut vers `COMPLETED`
- **Destinataire** : Le créateur de la tâche ET l'assigné (si différents)
- **Type** : `SUCCESS`
- **Template** : `NotificationTemplates.task_completed()`
- **Message** : "La tâche '{task_title}' a été complétée par {completer_name}."
- **Action** : Lien vers `/dashboard/projects/tasks?task={task_id}`
- **Fichier** : `backend/app/api/v1/endpoints/project_tasks.py` (lignes 642-670)

#### 5. Commentaire sur Tâche
- **Déclencheur** : Ajout d'un commentaire sur une tâche
- **Destinataire** : L'assigné de la tâche ET le créateur (si différents du commentateur)
- **Type** : `INFO`
- **Template** : `NotificationTemplates.task_comment()`
- **Message** : "{commenter_name} a commenté sur la tâche '{task_title}'."
- **Action** : Lien vers `/dashboard/projects/tasks?task={task_id}`
- **Fichier** : `backend/app/api/v1/endpoints/project_comments.py` (lignes 152-180)

#### 6. Réponse à Commentaire
- **Déclencheur** : Réponse à un commentaire existant
- **Destinataire** : L'auteur du commentaire parent
- **Type** : `INFO`
- **Message** : "{commenter_name} a répondu à votre commentaire sur la tâche '{task_title}'."
- **Action** : Lien vers `/dashboard/projects/tasks?task={task_id}`
- **Fichier** : `backend/app/api/v1/endpoints/project_comments.py` (lignes 181-193)

---

### 📁 Projets (Projects)

#### 7. Projet Créé (Confirmation)
- **Déclencheur** : Création d'un nouveau projet
- **Destinataire** : Le créateur du projet
- **Type** : `SUCCESS`
- **Template** : `NotificationTemplates.project_created()`
- **Message** : "Le projet '{project_name}' a été créé avec succès."
- **Action** : Lien vers `/dashboard/projects?project={project_id}`
- **Fichier** : `backend/app/api/v1/endpoints/projects/__init__.py` (lignes 1000-1008)

#### 8. Ajouté à un Projet
- **Déclencheur** : Assignation d'un responsable à un projet OU changement de responsable
- **Destinataire** : Le nouveau responsable
- **Type** : `INFO`
- **Template** : `NotificationTemplates.project_member_added()`
- **Message** : "Vous avez été ajouté au projet '{project_name}'."
- **Action** : Lien vers `/dashboard/projects?project={project_id}`
- **Fichier** : `backend/app/api/v1/endpoints/projects/__init__.py` (lignes 1009-1020, 1120-1132)

---

### 👥 Équipes (Teams)

#### 9. Ajouté à une Équipe
- **Déclencheur** : Ajout d'un membre à une équipe
- **Destinataire** : Le nouveau membre
- **Type** : `INFO`
- **Template** : `NotificationTemplates.team_member_added()`
- **Message** : "Vous avez été ajouté à l'équipe '{team_name}'."
- **Action** : Lien vers `/dashboard/teams?team={team_id}`
- **Fichier** : `backend/app/api/v1/endpoints/teams.py` (lignes 519-531)

---

### 💰 Trésorerie (Treasury)

#### 10. Transaction Importante
- **Déclencheur** : Création d'une transaction > $10,000
- **Destinataire** : Le créateur de la transaction
- **Type** : `INFO`
- **Message** : "Une transaction de {amount} $ a été créée sur le compte '{account_name}'."
- **Action** : Lien vers `/dashboard/finances/tresorerie?transaction={transaction_id}`
- **Fichier** : `backend/app/api/v1/endpoints/finances/tresorerie.py` (lignes 563-580)

#### 11. Solde Faible (Critique)
- **Déclencheur** : Solde d'un compte < $10,000 après une transaction OU vérification périodique
- **Destinataire** : Le propriétaire du compte
- **Type** : `WARNING`
- **Template** : `NotificationTemplates.treasury_low_balance()`
- **Message** : "Le compte '{account_name}' a un solde faible ({balance} $)."
- **Action** : Lien vers `/dashboard/finances/tresorerie?account={account_id}`
- **Fichier** : `backend/app/api/v1/endpoints/finances/tresorerie.py` (lignes 581-595), `backend/app/utils/treasury_alerts.py`

#### 12. Solde à Surveiller
- **Déclencheur** : Solde d'un compte < $50,000 (vérification périodique)
- **Destinataire** : Le propriétaire du compte
- **Type** : `WARNING`
- **Message** : "Le compte '{account_name}' a un solde de {balance} $."
- **Action** : Lien vers `/dashboard/finances/tresorerie?account={account_id}`
- **Fichier** : `backend/app/utils/treasury_alerts.py`

#### 13. Cashflow Négatif
- **Déclencheur** : 2+ semaines avec cashflow négatif sur les 4 dernières semaines (vérification périodique)
- **Destinataire** : Le propriétaire des comptes
- **Type** : `ERROR`
- **Template** : `NotificationTemplates.treasury_negative_cashflow()`
- **Message** : "{weeks_count} semaines sur les 4 dernières ont un cashflow négatif."
- **Action** : Lien vers `/dashboard/finances/tresorerie`
- **Fichier** : `backend/app/utils/treasury_alerts.py`

---

## 🔮 NOTIFICATIONS POTENTIELLES (Non Implémentées)

### 📋 Tâches - Améliorations

#### 14. Échéance Approchante
- **Déclencheur** : Tâche avec échéance dans 1-3 jours
- **Destinataire** : L'assigné de la tâche
- **Type** : `WARNING`
- **Template** : `NotificationTemplates.task_due_soon()` (existe déjà)
- **Message** : "La tâche '{task_title}' est due dans {days_until_due} jour(s)."
- **Action** : Lien vers `/dashboard/projects/tasks?task={task_id}`
- **Priorité** : ⭐⭐⭐ (Haute)
- **Implémentation** : Tâche Celery périodique pour vérifier les échéances

#### 15. Tâche En Retard
- **Déclencheur** : Tâche avec échéance dépassée
- **Destinataire** : L'assigné de la tâche ET le créateur
- **Type** : `ERROR`
- **Message** : "La tâche '{task_title}' est en retard de {days_overdue} jour(s)."
- **Action** : Lien vers `/dashboard/projects/tasks?task={task_id}`
- **Priorité** : ⭐⭐⭐ (Haute)

#### 16. Tâche Modifiée
- **Déclencheur** : Modification importante d'une tâche (priorité, description, etc.)
- **Destinataire** : L'assigné de la tâche
- **Type** : `INFO`
- **Message** : "La tâche '{task_title}' a été modifiée."
- **Action** : Lien vers `/dashboard/projects/tasks?task={task_id}`
- **Priorité** : ⭐⭐ (Moyenne)

#### 17. Tâche Supprimée
- **Déclencheur** : Suppression d'une tâche
- **Destinataire** : L'assigné de la tâche (si différent du suppresseur)
- **Type** : `INFO`
- **Message** : "La tâche '{task_title}' a été supprimée."
- **Priorité** : ⭐ (Basse)

---

### 📁 Projets - Améliorations

#### 18. Projet Modifié
- **Déclencheur** : Modification importante d'un projet
- **Destinataire** : Les membres de l'équipe du projet
- **Type** : `INFO`
- **Message** : "Le projet '{project_name}' a été modifié."
- **Action** : Lien vers `/dashboard/projects?project={project_id}`
- **Priorité** : ⭐⭐ (Moyenne)

#### 19. Projet Archivé
- **Déclencheur** : Archivage d'un projet
- **Destinataire** : Les membres de l'équipe du projet
- **Type** : `INFO`
- **Message** : "Le projet '{project_name}' a été archivé."
- **Action** : Lien vers `/dashboard/projects?project={project_id}`
- **Priorité** : ⭐⭐ (Moyenne)

#### 20. Projet Complété
- **Déclencheur** : Changement de statut vers `COMPLETED`
- **Destinataire** : Les membres de l'équipe du projet
- **Type** : `SUCCESS`
- **Message** : "Le projet '{project_name}' a été complété !"
- **Action** : Lien vers `/dashboard/projects?project={project_id}`
- **Priorité** : ⭐⭐⭐ (Haute)

#### 21. Membre Retiré d'un Projet
- **Déclencheur** : Retrait d'un responsable d'un projet
- **Destinataire** : Le responsable retiré
- **Type** : `INFO`
- **Message** : "Vous avez été retiré du projet '{project_name}'."
- **Priorité** : ⭐⭐ (Moyenne)

---

### 👥 Équipes - Améliorations

#### 22. Rôle Modifié
- **Déclencheur** : Changement de rôle d'un membre d'équipe
- **Destinataire** : Le membre dont le rôle a changé
- **Type** : `INFO`
- **Message** : "Votre rôle dans l'équipe '{team_name}' a été modifié en '{new_role}'."
- **Action** : Lien vers `/dashboard/teams?team={team_id}`
- **Priorité** : ⭐⭐ (Moyenne)

#### 23. Membre Retiré d'une Équipe
- **Déclencheur** : Retrait d'un membre d'une équipe
- **Destinataire** : Le membre retiré
- **Type** : `INFO`
- **Message** : "Vous avez été retiré de l'équipe '{team_name}'."
- **Action** : Lien vers `/dashboard/teams`
- **Priorité** : ⭐⭐ (Moyenne)

#### 24. Équipe Créée
- **Déclencheur** : Création d'une nouvelle équipe
- **Destinataire** : Le créateur de l'équipe
- **Type** : `SUCCESS`
- **Message** : "L'équipe '{team_name}' a été créée avec succès."
- **Action** : Lien vers `/dashboard/teams?team={team_id}`
- **Priorité** : ⭐ (Basse)

---

### 💰 Trésorerie - Améliorations

#### 25. Transaction Confirmée
- **Déclencheur** : Changement de statut d'une transaction vers `CONFIRMED`
- **Destinataire** : Le créateur de la transaction
- **Type** : `SUCCESS`
- **Message** : "La transaction '{description}' a été confirmée."
- **Action** : Lien vers `/dashboard/finances/tresorerie?transaction={transaction_id}`
- **Priorité** : ⭐⭐ (Moyenne)

#### 26. Transaction Annulée
- **Déclencheur** : Annulation d'une transaction
- **Destinataire** : Le créateur de la transaction
- **Type** : `WARNING`
- **Message** : "La transaction '{description}' a été annulée."
- **Action** : Lien vers `/dashboard/finances/tresorerie?transaction={transaction_id}`
- **Priorité** : ⭐⭐ (Moyenne)

#### 27. Échéance de Paiement Approchante
- **Déclencheur** : Facture avec échéance dans X jours
- **Destinataire** : Le propriétaire du compte
- **Type** : `WARNING`
- **Message** : "La facture '{invoice_number}' est due dans {days} jour(s)."
- **Action** : Lien vers `/dashboard/finances/facturations?invoice={invoice_id}`
- **Priorité** : ⭐⭐⭐ (Haute)

#### 28. Facture En Retard
- **Déclencheur** : Facture avec échéance dépassée
- **Destinataire** : Le propriétaire du compte
- **Type** : `ERROR`
- **Message** : "La facture '{invoice_number}' est en retard de {days} jour(s)."
- **Action** : Lien vers `/dashboard/finances/facturations?invoice={invoice_id}`
- **Priorité** : ⭐⭐⭐ (Haute)

#### 29. Revenu Projeté Non Confirmé
- **Déclencheur** : Revenu projeté avec date dépassée et non confirmé
- **Destinataire** : Le propriétaire du compte
- **Type** : `WARNING`
- **Message** : "{count} revenu(s) projeté(s) n'ont pas encore été confirmés."
- **Action** : Lien vers `/dashboard/finances/tresorerie`
- **Priorité** : ⭐⭐ (Moyenne)

#### 30. Dépense Anormale Détectée
- **Déclencheur** : Transaction de sortie > 3x la moyenne
- **Destinataire** : Le propriétaire du compte
- **Type** : `WARNING`
- **Message** : "Une dépense anormale de {amount} $ a été détectée."
- **Action** : Lien vers `/dashboard/finances/tresorerie?transaction={transaction_id}`
- **Priorité** : ⭐⭐ (Moyenne)

---

### 👤 Utilisateurs & Authentification

#### 31. Connexion depuis Nouveau Device
- **Déclencheur** : Connexion depuis un nouvel appareil/IP
- **Destinataire** : L'utilisateur
- **Type** : `WARNING`
- **Message** : "Connexion détectée depuis un nouvel appareil ({device_info})."
- **Action** : Lien vers `/settings/security`
- **Priorité** : ⭐⭐⭐ (Haute - Sécurité)

#### 32. Changement de Mot de Passe
- **Déclencheur** : Modification du mot de passe
- **Destinataire** : L'utilisateur
- **Type** : `SUCCESS`
- **Message** : "Votre mot de passe a été modifié avec succès."
- **Action** : Lien vers `/settings/security`
- **Priorité** : ⭐⭐⭐ (Haute - Sécurité)

#### 33. Tentative de Connexion Échouée
- **Déclencheur** : Plusieurs tentatives de connexion échouées
- **Destinataire** : L'utilisateur (si compte existe)
- **Type** : `ERROR`
- **Message** : "{count} tentatives de connexion échouées détectées."
- **Action** : Lien vers `/settings/security`
- **Priorité** : ⭐⭐⭐ (Haute - Sécurité)

---

### 📊 Feuilles de Temps (Time Entries)

#### 34. Feuille de Temps Soumise
- **Déclencheur** : Soumission d'une feuille de temps
- **Destinataire** : Le gestionnaire/approbateur
- **Type** : `INFO`
- **Message** : "{employee_name} a soumis sa feuille de temps pour la période {period}."
- **Action** : Lien vers `/dashboard/feuilles-de-temps?entry={entry_id}`
- **Priorité** : ⭐⭐⭐ (Haute)

#### 35. Feuille de Temps Approuvée
- **Déclencheur** : Approbation d'une feuille de temps
- **Destinataire** : L'employé qui a soumis
- **Type** : `SUCCESS`
- **Message** : "Votre feuille de temps pour la période {period} a été approuvée."
- **Action** : Lien vers `/dashboard/feuilles-de-temps?entry={entry_id}`
- **Priorité** : ⭐⭐⭐ (Haute)

#### 36. Feuille de Temps Rejetée
- **Déclencheur** : Rejet d'une feuille de temps
- **Destinataire** : L'employé qui a soumis
- **Type** : `WARNING`
- **Message** : "Votre feuille de temps pour la période {period} a été rejetée. Raison: {reason}."
- **Action** : Lien vers `/dashboard/feuilles-de-temps?entry={entry_id}`
- **Priorité** : ⭐⭐⭐ (Haute)

#### 37. Feuille de Temps En Retard
- **Déclencheur** : Feuille de temps non soumise après la date limite
- **Destinataire** : L'employé
- **Type** : `WARNING`
- **Message** : "Votre feuille de temps pour la période {period} est en retard."
- **Action** : Lien vers `/dashboard/feuilles-de-temps`
- **Priorité** : ⭐⭐ (Moyenne)

---

### 💳 Comptes de Dépenses (Expense Accounts)

#### 38. Compte de Dépenses Soumis
- **Déclencheur** : Soumission d'un compte de dépenses
- **Destinataire** : L'approbateur
- **Type** : `INFO`
- **Message** : "{employee_name} a soumis un compte de dépenses de {amount} $."
- **Action** : Lien vers `/dashboard/compte-depenses?account={account_id}`
- **Priorité** : ⭐⭐⭐ (Haute)

#### 39. Compte de Dépenses Approuvé
- **Déclencheur** : Approbation d'un compte de dépenses
- **Destinataire** : L'employé qui a soumis
- **Type** : `SUCCESS`
- **Message** : "Votre compte de dépenses de {amount} $ a été approuvé."
- **Action** : Lien vers `/dashboard/compte-depenses?account={account_id}`
- **Priorité** : ⭐⭐⭐ (Haute)

#### 40. Compte de Dépenses Rejeté
- **Déclencheur** : Rejet d'un compte de dépenses
- **Destinataire** : L'employé qui a soumis
- **Type** : `WARNING`
- **Message** : "Votre compte de dépenses de {amount} $ a été rejeté. Raison: {reason}."
- **Action** : Lien vers `/dashboard/compte-depenses?account={account_id}`
- **Priorité** : ⭐⭐⭐ (Haute)

#### 41. Demande de Clarification
- **Déclencheur** : Demande de clarification sur un compte de dépenses
- **Destinataire** : L'employé qui a soumis
- **Type** : `INFO`
- **Message** : "Une clarification est demandée pour votre compte de dépenses de {amount} $."
- **Action** : Lien vers `/dashboard/compte-depenses?account={account_id}`
- **Priorité** : ⭐⭐⭐ (Haute)

---

### 📄 Factures (Invoices)

#### 42. Facture Créée
- **Déclencheur** : Création d'une nouvelle facture
- **Destinataire** : Le créateur
- **Type** : `SUCCESS`
- **Message** : "La facture '{invoice_number}' a été créée."
- **Action** : Lien vers `/dashboard/finances/facturations?invoice={invoice_id}`
- **Priorité** : ⭐⭐ (Moyenne)

#### 43. Facture Envoyée
- **Déclencheur** : Envoi d'une facture au client
- **Destinataire** : Le créateur
- **Type** : `INFO`
- **Message** : "La facture '{invoice_number}' a été envoyée au client."
- **Action** : Lien vers `/dashboard/finances/facturations?invoice={invoice_id}`
- **Priorité** : ⭐⭐ (Moyenne)

#### 44. Facture Payée
- **Déclencheur** : Paiement reçu pour une facture
- **Destinataire** : Le créateur
- **Type** : `SUCCESS`
- **Message** : "La facture '{invoice_number}' a été payée ({amount} $)."
- **Action** : Lien vers `/dashboard/finances/facturations?invoice={invoice_id}`
- **Priorité** : ⭐⭐⭐ (Haute)

#### 45. Facture Partiellement Payée
- **Déclencheur** : Paiement partiel reçu
- **Destinataire** : Le créateur
- **Type** : `INFO`
- **Message** : "Un paiement partiel de {amount} $ a été reçu pour la facture '{invoice_number}'."
- **Action** : Lien vers `/dashboard/finances/facturations?invoice={invoice_id}`
- **Priorité** : ⭐⭐ (Moyenne)

---

### 📅 Événements & Agenda

#### 46. Événement Créé
- **Déclencheur** : Création d'un événement
- **Destinataire** : Les participants
- **Type** : `INFO`
- **Message** : "Un nouvel événement '{event_title}' a été créé pour le {date}."
- **Action** : Lien vers `/dashboard/agenda?event={event_id}`
- **Priorité** : ⭐⭐ (Moyenne)

#### 47. Événement Modifié
- **Déclencheur** : Modification d'un événement
- **Destinataire** : Les participants
- **Type** : `INFO`
- **Message** : "L'événement '{event_title}' a été modifié."
- **Action** : Lien vers `/dashboard/agenda?event={event_id}`
- **Priorité** : ⭐⭐ (Moyenne)

#### 48. Événement Annulé
- **Déclencheur** : Annulation d'un événement
- **Destinataire** : Les participants
- **Type** : `WARNING`
- **Message** : "L'événement '{event_title}' a été annulé."
- **Action** : Lien vers `/dashboard/agenda`
- **Priorité** : ⭐⭐ (Moyenne)

#### 49. Rappel d'Événement
- **Déclencheur** : Événement dans X heures/jours
- **Destinataire** : Les participants
- **Type** : `INFO`
- **Message** : "Rappel: L'événement '{event_title}' est dans {time}."
- **Action** : Lien vers `/dashboard/agenda?event={event_id}`
- **Priorité** : ⭐⭐ (Moyenne)

---

### 🏢 Clients & Opportunités

#### 50. Client Créé
- **Déclencheur** : Création d'un nouveau client
- **Destinataire** : Le créateur
- **Type** : `SUCCESS`
- **Message** : "Le client '{client_name}' a été créé."
- **Action** : Lien vers `/dashboard/clients?client={client_id}`
- **Priorité** : ⭐ (Basse)

#### 51. Opportunité Créée
- **Déclencheur** : Création d'une opportunité
- **Destinataire** : Le créateur ET l'assigné (si différent)
- **Type** : `INFO`
- **Message** : "Une nouvelle opportunité '{opportunity_name}' vous a été assignée."
- **Action** : Lien vers `/dashboard/opportunites?opportunity={opportunity_id}`
- **Priorité** : ⭐⭐⭐ (Haute)

#### 52. Opportunité Gagnée
- **Déclencheur** : Changement de statut vers "Gagnée"
- **Destinataire** : L'équipe commerciale
- **Type** : `SUCCESS`
- **Message** : "L'opportunité '{opportunity_name}' a été gagnée ! ({amount} $)"
- **Action** : Lien vers `/dashboard/opportunites?opportunity={opportunity_id}`
- **Priorité** : ⭐⭐⭐ (Haute)

#### 53. Opportunité Perdue
- **Déclencheur** : Changement de statut vers "Perdue"
- **Destinataire** : L'équipe commerciale
- **Type** : `WARNING`
- **Message** : "L'opportunité '{opportunity_name}' a été marquée comme perdue."
- **Action** : Lien vers `/dashboard/opportunites?opportunity={opportunity_id}`
- **Priorité** : ⭐⭐ (Moyenne)

---

### 📧 Communications

#### 54. Message Reçu
- **Déclencheur** : Réception d'un message/email
- **Destinataire** : Le destinataire
- **Type** : `INFO`
- **Message** : "Vous avez reçu un nouveau message de {sender_name}."
- **Action** : Lien vers `/dashboard/messages?message={message_id}`
- **Priorité** : ⭐⭐⭐ (Haute)

#### 55. Mention dans Commentaire
- **Déclencheur** : Mention d'un utilisateur (@username) dans un commentaire
- **Destinataire** : L'utilisateur mentionné
- **Type** : `INFO`
- **Message** : "{author_name} vous a mentionné dans un commentaire."
- **Action** : Lien vers le commentaire
- **Priorité** : ⭐⭐⭐ (Haute)

---

### 🔔 Système & Administration

#### 56. Mise à Jour Système
- **Déclencheur** : Nouvelle version de l'application
- **Destinataire** : Tous les utilisateurs ou admins
- **Type** : `INFO`
- **Message** : "Une nouvelle version de l'application est disponible."
- **Action** : Lien vers `/settings/general`
- **Priorité** : ⭐ (Basse)

#### 57. Maintenance Planifiée
- **Déclencheur** : Maintenance système planifiée
- **Destinataire** : Tous les utilisateurs
- **Type** : `WARNING`
- **Message** : "Une maintenance est planifiée le {date} de {start_time} à {end_time}."
- **Action** : Lien vers `/settings/general`
- **Priorité** : ⭐⭐⭐ (Haute)

#### 58. Quota Approchant
- **Déclencheur** : Utilisation proche de la limite (80%+)
- **Destinataire** : L'administrateur
- **Type** : `WARNING`
- **Message** : "Votre quota de {resource_type} approche de la limite ({usage}%)."
- **Action** : Lien vers `/settings/billing`
- **Priorité** : ⭐⭐ (Moyenne)

---

## 📊 Statistiques

### Notifications Implémentées
- **Total** : 13 notifications
- **Tâches** : 6
- **Projets** : 2
- **Équipes** : 1
- **Trésorerie** : 4

### Notifications Potentielles
- **Total** : 45+ notifications
- **Tâches** : 4
- **Projets** : 4
- **Équipes** : 3
- **Trésorerie** : 6
- **Authentification** : 3
- **Feuilles de Temps** : 4
- **Comptes de Dépenses** : 4
- **Factures** : 4
- **Événements** : 4
- **Clients/Opportunités** : 4
- **Communications** : 2
- **Système** : 3

---

## 🎯 Priorités d'Implémentation

### Priorité Haute (⭐⭐⭐)
1. Échéance Approchante (Tâches)
2. Tâche En Retard
3. Feuille de Temps Soumise/Approuvée/Rejetée
4. Compte de Dépenses Soumis/Approuvé/Rejeté
5. Facture Payée
6. Opportunité Créée/Gagnée
7. Mention dans Commentaire
8. Connexion depuis Nouveau Device
9. Échéance de Paiement Approchante
10. Facture En Retard

### Priorité Moyenne (⭐⭐)
1. Tâche Modifiée
2. Projet Modifié/Complété
3. Rôle Modifié (Équipes)
4. Transaction Confirmée/Annulée
5. Revenu Projeté Non Confirmé
6. Dépense Anormale Détectée
7. Événements (Créé/Modifié/Annulé/Rappel)
8. Opportunité Perdue

### Priorité Basse (⭐)
1. Tâche Supprimée
2. Projet Archivé
3. Équipe Créée
4. Client Créé
5. Mise à Jour Système

---

## 📝 Notes

- Les notifications sont créées de manière **non-bloquante** : les erreurs n'interrompent pas les opérations principales
- Toutes les notifications incluent des **actions** (liens) vers les pages pertinentes
- Les notifications utilisent le système **WebSocket** pour les mises à jour en temps réel
- Support **email** optionnel via Celery
- Les templates sont **réutilisables** et **standardisés**
