# Checklist d'Exécution des Migrations

## ✅ Migrations Créées

1. **063_add_project_dates.py**
   - Ajoute `start_date`, `end_date`, `deadline` à `projects`
   - Colonnes nullable (pas d'impact sur données existantes)

2. **064_create_project_attachments_and_comments.py**
   - Crée `project_attachments` table
   - Crée `project_comments` table
   - Ajoute index et relations

## 🚀 Exécution Automatique

Les migrations s'exécutent **automatiquement** lors du déploiement sur Railway via `backend/entrypoint.sh` :

```bash
# Ligne 62-78 de entrypoint.sh
if [ -n "$DATABASE_URL" ]; then
    echo "Running database migrations..."
    alembic upgrade head || echo "Warning: Migrations failed"
fi
```

## ✅ Vérification Post-Déploiement

### 1. Vérifier les logs Railway

Après le déploiement, vérifier les logs pour confirmer l'exécution :

```bash
railway logs
```

Rechercher :
```
Running database migrations...
INFO  [alembic.runtime.migration] Running upgrade 062_create_employee_portal_permissions -> 063_add_project_dates
INFO  [alembic.runtime.migration] Running upgrade 063_add_project_dates -> 064_create_project_attachments_and_comments
```

### 2. Vérifier via l'API

Tester les nouveaux endpoints :

```bash
# Tester l'endpoint des attachments
curl -X GET "https://modeleweb-production-f341.up.railway.app/api/v1/project-attachments?project_id=470" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Tester l'endpoint des commentaires
curl -X GET "https://modeleweb-production-f341.up.railway.app/api/v1/project-comments?project_id=470" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Vérifier dans l'interface

1. Ouvrir un projet : `/dashboard/projets/470`
2. Vérifier les nouveaux onglets : Fichiers, Discussions, Gantt, Statistiques
3. Tester l'upload d'un fichier
4. Tester l'ajout d'un commentaire
5. Vérifier la vue Gantt
6. Vérifier les statistiques

## 🔧 Exécution Manuelle (si nécessaire)

Si les migrations ne s'exécutent pas automatiquement :

```bash
# Via Railway CLI
railway run alembic upgrade head

# Ou via SSH dans le conteneur
railway shell
cd backend
alembic upgrade head
```

## 📊 Vérification de l'État de la Base de Données

### Vérifier les colonnes ajoutées

```sql
-- Vérifier les colonnes de dates dans projects
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'projects'
AND column_name IN ('start_date', 'end_date', 'deadline');
```

### Vérifier les nouvelles tables

```sql
-- Vérifier que project_attachments existe
SELECT COUNT(*) as attachment_count FROM project_attachments;

-- Vérifier que project_comments existe
SELECT COUNT(*) as comment_count FROM project_comments;
```

### Vérifier les index

```sql
-- Index sur project_attachments
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'project_attachments';

-- Index sur project_comments
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'project_comments';
```

## ✅ Checklist Complète

- [ ] Migrations créées et commitées
- [ ] Code pushé sur GitHub
- [ ] Déploiement Railway déclenché
- [ ] Migrations exécutées (vérifier logs)
- [ ] Tables créées (vérifier SQL)
- [ ] Colonnes ajoutées (vérifier SQL)
- [ ] Endpoints API fonctionnels
- [ ] Interface frontend accessible
- [ ] Upload fichiers fonctionne
- [ ] Commentaires fonctionnent
- [ ] Vue Gantt fonctionne
- [ ] Statistiques fonctionnent

## 🐛 Dépannage

### Migration échoue

1. Vérifier les logs Railway
2. Vérifier la connexion à la base de données
3. Vérifier que la migration précédente est appliquée
4. Rollback si nécessaire : `alembic downgrade -1`

### Tables non créées

1. Vérifier que les migrations ont été exécutées
2. Vérifier les permissions de la base de données
3. Vérifier les logs pour erreurs spécifiques

### Endpoints ne fonctionnent pas

1. Vérifier que les modèles sont importés dans `__init__.py`
2. Vérifier que les routers sont enregistrés
3. Vérifier les logs du serveur backend
