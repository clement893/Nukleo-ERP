# Guide de Migration - Fonctionnalités Projets

## 📋 Migrations à Exécuter

Deux nouvelles migrations ont été créées pour ajouter les fonctionnalités de gestion de projet :

### Migration 063 : Ajout des dates de projet
**Fichier**: `backend/alembic/versions/063_add_project_dates.py`

**Changements**:
- Ajoute `start_date` (Date) à la table `projects`
- Ajoute `end_date` (Date) à la table `projects`
- Ajoute `deadline` (Date) à la table `projects`
- Crée les index correspondants

**Impact**: Aucun impact sur les données existantes (colonnes nullable)

### Migration 064 : Tables fichiers et commentaires
**Fichier**: `backend/alembic/versions/064_create_project_attachments_and_comments.py`

**Changements**:
- Crée la table `project_attachments` pour les fichiers attachés
- Crée la table `project_comments` pour les commentaires/discussions
- Ajoute les relations et index nécessaires

**Tables créées**:
- `project_attachments` : Fichiers attachés aux projets/tâches
- `project_comments` : Commentaires et discussions avec threading

## 🚀 Exécution des Migrations

### Sur Railway (Production)

Les migrations seront exécutées automatiquement lors du déploiement si Railway est configuré pour exécuter `alembic upgrade head` au démarrage.

Sinon, exécutez manuellement via Railway CLI ou le dashboard :

```bash
# Via Railway CLI
railway run alembic upgrade head

# Ou via SSH dans le conteneur
alembic upgrade head
```

### En Local (si base de données locale disponible)

```bash
cd backend
alembic upgrade head
```

### Vérification

Pour vérifier que les migrations ont été appliquées :

```bash
# Voir la version actuelle
alembic current

# Voir l'historique
alembic history

# Voir les migrations en attente
alembic heads
```

## ✅ Vérifications Post-Migration

### 1. Vérifier les colonnes ajoutées à `projects`

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name IN ('start_date', 'end_date', 'deadline');
```

### 2. Vérifier les nouvelles tables

```sql
-- Vérifier que project_attachments existe
SELECT COUNT(*) FROM project_attachments;

-- Vérifier que project_comments existe
SELECT COUNT(*) FROM project_comments;
```

### 3. Vérifier les index

```sql
-- Index sur project_attachments
SELECT indexname FROM pg_indexes WHERE tablename = 'project_attachments';

-- Index sur project_comments
SELECT indexname FROM pg_indexes WHERE tablename = 'project_comments';
```

## 🔍 Tests des Fonctionnalités

Après l'exécution des migrations, tester :

1. **Dates de projet** :
   - Créer/modifier un projet avec `start_date`, `end_date`, `deadline`
   - Vérifier l'affichage dans la page de détail
   - Vérifier l'apparition dans le calendrier

2. **Fichiers attachés** :
   - Uploader un fichier sur un projet
   - Uploader un fichier sur une tâche
   - Vérifier que le fichier de la tâche apparaît aussi dans le projet

3. **Commentaires** :
   - Ajouter un commentaire sur un projet
   - Ajouter un commentaire sur une tâche
   - Répondre à un commentaire (threading)
   - Modifier/supprimer un commentaire

4. **Vue Gantt** :
   - Ouvrir la vue Gantt d'un projet
   - Naviguer entre les semaines
   - Vérifier l'affichage des tâches avec dates

5. **Statistiques** :
   - Vérifier l'affichage des heures dépensées
   - Vérifier le calcul du budget heures
   - Vérifier le taux de complétion

## 📝 Notes Importantes

- Les migrations sont **idempotentes** (peuvent être exécutées plusieurs fois sans problème)
- Les colonnes de dates sont **nullable** (pas d'impact sur les projets existants)
- Les fichiers attachés aux tâches sont **automatiquement liés au projet parent** (logique dans l'endpoint)
- Les commentaires supportent le **threading** (réponses aux commentaires)

## 🐛 Dépannage

### Erreur de connexion à la base de données

Si vous obtenez une erreur de connexion :
- Vérifiez que la base de données est accessible
- Vérifiez les variables d'environnement (`DATABASE_URL`)
- Sur Railway, les migrations s'exécutent automatiquement au déploiement

### Erreur de migration

Si une migration échoue :
- Vérifiez les logs pour l'erreur exacte
- Vérifiez que la migration précédente a été appliquée
- Utilisez `alembic current` pour voir la version actuelle

### Rollback (si nécessaire)

```bash
# Revenir à la migration précédente
alembic downgrade -1

# Revenir à une version spécifique
alembic downgrade 062_create_employee_portal_permissions
```
