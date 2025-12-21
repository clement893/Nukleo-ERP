# Guide de Développement

Ce document décrit les outils de développement disponibles dans ce projet.

## 📚 Storybook

Storybook est configuré pour documenter et tester les composants UI de manière isolée.

### Installation

Les dépendances Storybook sont déjà dans `package.json`. Si nécessaire :

```bash
pnpm install
```

### Utilisation

```bash
# Démarrer Storybook en mode développement
pnpm storybook

# Build Storybook pour production
pnpm build-storybook
```

Storybook sera accessible sur `http://localhost:6006`

### Créer une Story

Créez un fichier `.stories.tsx` à côté de votre composant :

```typescript
// Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import Button from './Button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    children: 'Button',
    variant: 'primary',
  },
};
```

### Stories existantes

- `Button.stories.tsx` - Exemples pour le composant Button
- `Input.stories.tsx` - Exemples pour le composant Input

## 🎭 Tests E2E avec Playwright

Playwright est configuré pour les tests end-to-end.

### Installation

```bash
# Installer les dépendances
pnpm install

# Installer les navigateurs Playwright
pnpm exec playwright install --with-deps
```

### Utilisation

```bash
# Lancer tous les tests E2E
pnpm test:e2e

# Lancer les tests avec UI interactive
pnpm test:e2e:ui

# Lancer les tests en mode debug
pnpm test:e2e:debug

# Lancer les tests sur un navigateur spécifique
pnpm exec playwright test --project=chromium
```

### Tests existants

- `e2e/homepage.spec.ts` - Tests de la page d'accueil
- `e2e/auth.spec.ts` - Tests d'authentification

### Configuration

La configuration Playwright se trouve dans `playwright.config.ts`. Elle inclut :

- Tests sur Chrome, Firefox, Safari
- Tests sur mobile (Chrome Mobile, Safari Mobile)
- Serveur de développement automatique
- Screenshots et traces en cas d'échec

## 🔄 CI/CD avec GitHub Actions

Deux workflows GitHub Actions sont configurés :

### 1. CI (`.github/workflows/ci.yml`)

Exécuté sur chaque push et pull request :

- **Lint & Type Check** : Vérifie le code avec ESLint et TypeScript
- **Unit Tests** : Exécute les tests Vitest
- **Build** : Vérifie que l'application se build correctement
- **E2E Tests** : Exécute les tests Playwright

### 2. Deploy (`.github/workflows/deploy.yml`)

Exécuté uniquement sur la branche `main` :

- Déploie automatiquement sur Railway
- Nécessite le secret `RAILWAY_TOKEN` dans GitHub

### Configuration des secrets GitHub

1. Allez dans Settings > Secrets and variables > Actions
2. Ajoutez les secrets suivants :
   - `RAILWAY_TOKEN` : Token d'API Railway
   - `NEXT_PUBLIC_API_URL` : URL de l'API (optionnel, pour les tests)

## 🚂 Déploiement Railway

### Scripts de déploiement

Deux scripts sont disponibles :

**Linux/Mac :**
```bash
chmod +x scripts/deploy-railway.sh
./scripts/deploy-railway.sh
```

**Windows PowerShell :**
```powershell
.\scripts\deploy-railway.ps1
```

### Déploiement manuel

```bash
# Installer Railway CLI
npm install -g @railway/cli

# Se connecter
railway login

# Aller dans le répertoire du projet
cd apps/web

# Déployer
railway up
```

### Configuration Railway

Le projet utilise Nixpacks pour le build automatique. Assurez-vous que :

1. Le service Railway pointe vers `apps/web`
2. Les variables d'environnement sont configurées :
   - `NEXT_PUBLIC_API_URL`
   - `DATABASE_URL` (si nécessaire)
   - Autres variables selon vos besoins

### Variables d'environnement Railway

Configurez ces variables dans le dashboard Railway :

- `NEXT_PUBLIC_API_URL` - URL de votre API backend
- `NODE_ENV=production`
- Toutes les autres variables nécessaires à votre application

## 🧪 Tests

### Tests unitaires (Vitest)

```bash
# Lancer tous les tests
pnpm test

# Lancer avec UI
pnpm test:ui

# Lancer en mode watch
pnpm test --watch
```

### Tests E2E (Playwright)

Voir la section Playwright ci-dessus.

## 📝 Linting et Formatage

```bash
# Linter le code
pnpm lint

# Formater le code
pnpm format

# Vérifier les types TypeScript
pnpm type-check
```

## 🏗️ Build

```bash
# Build de production
pnpm build

# Démarrer en production
pnpm start
```

## 📦 Structure des outils

```
.
├── .github/
│   └── workflows/
│       ├── ci.yml          # CI automatique
│       └── deploy.yml      # Déploiement Railway
├── apps/web/
│   ├── .storybook/         # Configuration Storybook
│   ├── e2e/                # Tests Playwright
│   │   ├── homepage.spec.ts
│   │   └── auth.spec.ts
│   ├── playwright.config.ts
│   └── src/
│       └── components/
│           └── ui/
│               ├── Button.stories.tsx
│               └── Input.stories.tsx
└── scripts/
    ├── deploy-railway.sh   # Script déploiement (Linux/Mac)
    └── deploy-railway.ps1  # Script déploiement (Windows)
```

## 🚀 Workflow de développement recommandé

1. **Développement local**
   ```bash
   pnpm dev
   ```

2. **Tester les composants**
   ```bash
   pnpm storybook
   ```

3. **Tests unitaires**
   ```bash
   pnpm test --watch
   ```

4. **Tests E2E**
   ```bash
   pnpm test:e2e:ui
   ```

5. **Vérifier avant commit**
   ```bash
   pnpm lint
   pnpm type-check
   pnpm test
   ```

6. **Commit et push**
   - Le CI s'exécutera automatiquement
   - Si sur `main`, le déploiement Railway se déclenchera

## 📚 Ressources

- [Storybook Documentation](https://storybook.js.org/docs)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Railway Documentation](https://docs.railway.app/)

