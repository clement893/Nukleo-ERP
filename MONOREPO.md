# Structure Monorepo Optimisée

Ce document décrit la structure et la configuration optimisée du monorepo MODELE-NEXTJS-FULLSTACK.

## 📁 Structure du Monorepo

```
MODELE-NEXTJS-FULLSTACK/
├── apps/
│   └── web/              # Application Next.js 16
├── backend/              # Application FastAPI
├── packages/
│   └── types/            # Types TypeScript partagés
├── scripts/              # Scripts de développement
├── turbo.json            # Configuration Turborepo
├── pnpm-workspace.yaml   # Configuration workspace pnpm
├── .npmrc                # Configuration pnpm
└── package.json          # Configuration racine
```

## 🚀 Turborepo - Configuration Optimisée

### Cache Efficace

Le cache Turborepo est configuré pour :

- **Cache distant** : Activé pour partager le cache entre les environnements CI/CD
- **Outputs optimisés** : Seuls les fichiers nécessaires sont mis en cache
- **Dépendances globales** : Fichiers de configuration surveillés pour invalidation

### Pipeline de Build

```json
{
  "build": {
    "dependsOn": ["^build"],  // Build les dépendances d'abord
    "outputs": ["dist/**", ".next/**", "build/**"],
    "cache": true
  }
}
```

**Ordre de build automatique :**
1. `@modele/types` (package partagé)
2. `@modele/web` (dépend de `@modele/types`)

### Scripts Parallélisés

- `build` : Build parallèle avec dépendances respectées
- `test` : Tests en parallèle
- `lint` : Linting en parallèle
- `type-check` : Vérification TypeScript en parallèle

## 📦 Packages Partagés

### @modele/types

Package de types TypeScript partagés entre frontend et backend.

**Configuration :**
- Build avec TypeScript
- Exports ESM et CommonJS
- Types déclarations incluses

**Utilisation :**
```typescript
import type { User, ApiResponse } from '@modele/types';
```

**Build :**
```bash
pnpm --filter @modele/types build
```

## 🔧 Gestion des Dépendances Workspace

### Configuration pnpm (.npmrc)

- **link-workspace-packages** : Active le linking automatique
- **public-hoist-pattern** : Hoist des dépendances communes (eslint, prettier, typescript)
- **auto-install-peers** : Installation automatique des peer dependencies

### Protocol Workspace

Toutes les dépendances internes utilisent le protocol `workspace:*` :

```json
{
  "dependencies": {
    "@modele/types": "workspace:*"
  }
}
```

### Vérification des Dépendances

```bash
# Vérifier les dépendances workspace
pnpm workspace:check

# Vérifier avec script dédié
node scripts/check-workspace.js
```

## 📝 Scripts Disponibles

### Build

```bash
# Build complet (avec cache)
pnpm build

# Build spécifique
pnpm build:web
pnpm build:types

# Build propre (sans cache)
pnpm build:clean
```

### Développement

```bash
# Développement parallèle
pnpm dev

# Développement complet (frontend + backend)
pnpm dev:full
```

### Tests

```bash
# Tests unitaires (parallèle)
pnpm test

# Tests spécifiques
pnpm test:web
pnpm test:e2e
```

### Linting & Formatage

```bash
# Lint (parallèle)
pnpm lint
pnpm lint:fix

# Formatage
pnpm format
pnpm format:check
```

### Vérification TypeScript

```bash
# Type check (parallèle)
pnpm type-check
```

### Nettoyage

```bash
# Nettoyer les builds
pnpm clean

# Nettoyer tout (node_modules inclus)
pnpm clean:all
```

### Workspace

```bash
# Mettre à jour toutes les dépendances
pnpm workspace:upgrade

# Lister les dépendances
pnpm workspace:check
```

## 🎯 Optimisations Implémentées

### 1. Cache Turborepo

- ✅ Cache distant activé
- ✅ Outputs optimisés (exclusion de `.next/cache`)
- ✅ Invalidation intelligente basée sur les dépendances

### 2. Build Parallèle

- ✅ Dépendances respectées (`dependsOn: ["^build"]`)
- ✅ Build parallèle des packages indépendants
- ✅ Cache partagé entre les builds

### 3. Gestion des Dépendances

- ✅ Protocol workspace pour toutes les dépendances internes
- ✅ Hoisting optimisé des dépendances communes
- ✅ Auto-installation des peer dependencies

### 4. Scripts Optimisés

- ✅ Scripts parallélisés avec `--parallel`
- ✅ Filtrage par package avec `--filter`
- ✅ Scripts de vérification et nettoyage

## 🔍 Vérification de la Configuration

### Vérifier les dépendances workspace

```bash
node scripts/check-workspace.js
```

Ce script vérifie :
- ✅ Toutes les dépendances workspace existent
- ✅ Le protocol workspace est utilisé
- ✅ L'ordre de build est correct

### Vérifier le cache Turborepo

```bash
# Voir les statistiques de cache
turbo run build --dry-run

# Nettoyer le cache
pnpm clean
```

## 📊 Performance

### Temps de Build (estimations)

- **Premier build** : ~2-3 minutes
- **Build avec cache** : ~10-30 secondes
- **Build incrémental** : ~5-15 secondes

### Cache Hit Rate

Avec la configuration optimisée, le cache hit rate devrait être >80% pour les builds incrémentaux.

## 🐛 Dépannage

### Le cache ne fonctionne pas

```bash
# Vérifier la configuration
cat turbo.json

# Nettoyer le cache
rm -rf .turbo
pnpm build
```

### Dépendances workspace non résolues

```bash
# Réinstaller les dépendances
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Vérifier la configuration workspace
cat pnpm-workspace.yaml
cat .npmrc
```

### Build échoue avec dépendances

```bash
# Vérifier l'ordre de build
node scripts/check-workspace.js

# Build séquentiel pour debug
turbo run build --no-cache
```

## 📚 Ressources

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [pnpm Workspace Documentation](https://pnpm.io/workspaces)
- [Monorepo Best Practices](https://monorepo.tools/)

