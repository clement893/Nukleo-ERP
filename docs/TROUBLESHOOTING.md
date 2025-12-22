# 🔧 Guide de Dépannage

Guide pour résoudre les problèmes courants lors du développement avec le template.

## 📋 Table des Matières

- [Problèmes d'Installation](#problèmes-dinstallation)
- [Problèmes de Base de Données](#problèmes-de-base-de-données)
- [Problèmes Frontend](#problèmes-frontend)
- [Problèmes Backend](#problèmes-backend)
- [Problèmes de Build](#problèmes-de-build)
- [Problèmes de Tests](#problèmes-de-tests)

---

## 🔧 Problèmes d'Installation

### Erreur: pnpm non trouvé

```bash
# Installer pnpm globalement
npm install -g pnpm
```

### Erreur: Dépendances non installées

```bash
# Supprimer node_modules et réinstaller
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install
```

### Erreur: Python non trouvé

```bash
# Vérifier l'installation Python
python --version  # Doit être 3.11+

# Installer les dépendances Python
cd backend
pip install -r requirements.txt
```

---

## 🗄️ Problèmes de Base de Données

### Erreur: Connexion à la base de données échouée

1. Vérifier que PostgreSQL est démarré
2. Vérifier la variable `DATABASE_URL` dans `.env`
3. Vérifier les permissions de l'utilisateur

```bash
# Tester la connexion
psql $DATABASE_URL
```

### Erreur: Migrations échouées

```bash
# Vérifier l'état des migrations
cd backend
alembic current

# Appliquer les migrations
alembic upgrade head

# Si problème, créer une nouvelle migration
alembic revision --autogenerate -m "Fix migration"
```

---

## ⚛️ Problèmes Frontend

### Erreur: Module non trouvé

```bash
# Réinstaller les dépendances
cd apps/web
rm -rf node_modules .next
pnpm install
```

### Erreur: TypeScript

```bash
# Vérifier les types
pnpm type-check

# Nettoyer le cache TypeScript
rm -rf apps/web/.next
```

### Erreur: Build échoué

```bash
# Nettoyer et rebuilder
cd apps/web
rm -rf .next out
pnpm build
```

---

## 🐍 Problèmes Backend

### Erreur: Import non trouvé

```bash
# Vérifier l'installation des dépendances Python
cd backend
pip install -r requirements.txt
```

### Erreur: Port déjà utilisé

```bash
# Changer le port dans .env
PORT=8001
```

### Erreur: SECRET_KEY manquant

```bash
# Générer un SECRET_KEY
python -c 'import secrets; print(secrets.token_urlsafe(32))'

# Ajouter dans .env
SECRET_KEY=votre-secret-key-genere
```

---

## 🏗️ Problèmes de Build

### Erreur: Turborepo

```bash
# Nettoyer le cache Turborepo
rm -rf .turbo
pnpm build
```

### Erreur: Docker

```bash
# Rebuild les images
docker-compose down
docker-compose build --no-cache
docker-compose up
```

---

## 🧪 Problèmes de Tests

### Tests frontend échouent

```bash
# Nettoyer et réinstaller
cd apps/web
rm -rf node_modules .vitest
pnpm install
pnpm test
```

### Tests backend échouent

```bash
# Vérifier la base de données de test
cd backend
pytest --setup-show
```

---

## 📞 Besoin d'Aide ?

- Consulter la [documentation complète](./README.md)
- Ouvrir une [issue GitHub](https://github.com/clement893/MODELE-NEXTJS-FULLSTACK/issues)
- Vérifier les [guides de développement](./DEVELOPMENT.md)
