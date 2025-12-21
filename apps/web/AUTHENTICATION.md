# Authentification et Sécurité

Ce document décrit la configuration complète de l'authentification et de la sécurité pour l'application.

## 🔐 Configuration OAuth Google

### Prérequis

1. Créer un projet dans [Google Cloud Console](https://console.cloud.google.com/)
2. Activer l'API Google+ (ou Google Identity)
3. Créer des identifiants OAuth 2.0
4. Configurer les URI de redirection autorisés :
   - `http://localhost:3000/api/auth/callback/google` (développement)
   - `https://votre-domaine.com/api/auth/callback/google` (production)

### Variables d'environnement requises

```env
GOOGLE_CLIENT_ID=votre-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=votre-client-secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generer-avec-openssl-rand-base64-32
```

### Génération des secrets

```bash
# Générer NEXTAUTH_SECRET
openssl rand -base64 32

# Générer JWT_SECRET
openssl rand -base64 32
```

## 🎫 Gestion des Tokens JWT

### Types de tokens

1. **Access Token** : Token d'accès de courte durée (15 minutes par défaut)
2. **Refresh Token** : Token de rafraîchissement de longue durée (30 jours par défaut)

### Configuration

```env
JWT_SECRET=votre-secret-jwt
JWT_ISSUER=modele-app
JWT_AUDIENCE=modele-users
JWT_ACCESS_TOKEN_EXPIRES=15m
JWT_REFRESH_TOKEN_EXPIRES=30d
```

### Utilisation

```typescript
import { createAccessToken, verifyToken } from '@/lib/auth/jwt';

// Créer un token
const token = await createAccessToken({
  userId: 'user-id',
  email: 'user@example.com',
  role: 'user',
});

// Vérifier un token
const payload = await verifyToken(token);
```

## 🛡️ Middleware d'authentification

### Middleware Next.js

Le middleware `src/middleware.ts` protège automatiquement toutes les routes sauf :
- `/auth/*` (pages d'authentification)
- `/api/auth/*` (routes NextAuth)
- `/api/public/*` (routes publiques)

### Utilisation dans les API Routes

#### Route protégée simple

```typescript
import { withAuth } from '@/lib/auth/middleware';

async function handler(request: NextRequest, { user }: { user: TokenPayload }) {
  return NextResponse.json({ user });
}

export const GET = withAuth(handler);
```

#### Route avec contrôle de rôle

```typescript
import { withRole } from '@/lib/auth/middleware';

async function handler(request: NextRequest, { user }: { user: TokenPayload }) {
  return NextResponse.json({ message: 'Admin only' });
}

export const GET = withRole(['admin'], handler);
```

### Utilisation dans les Server Components

```typescript
import { auth } from '@/lib/auth';

export default async function Page() {
  const session = await auth();
  
  if (!session) {
    redirect('/auth/signin');
  }

  return <div>Hello {session.user.email}</div>;
}
```

## 📋 Variables d'environnement

### Validation automatique

Les variables d'environnement sont validées automatiquement au démarrage en développement.

### Scripts disponibles

```bash
# Valider les variables d'environnement
pnpm env:validate

# Afficher la documentation
pnpm env:docs

# Générer le fichier .env.example
pnpm env:generate
```

### Variables requises

| Variable | Description | Exemple |
|----------|-------------|---------|
| `NEXTAUTH_URL` | URL de base de l'application | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | Secret pour NextAuth | Généré avec openssl |
| `GOOGLE_CLIENT_ID` | ID client Google OAuth | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Secret client Google OAuth | `xxx` |
| `JWT_SECRET` | Secret pour JWT | Généré avec openssl |

### Variables optionnelles

| Variable | Description | Défaut |
|----------|-------------|--------|
| `JWT_ISSUER` | Émetteur JWT | `modele-app` |
| `JWT_AUDIENCE` | Audience JWT | `modele-users` |
| `JWT_ACCESS_TOKEN_EXPIRES` | Expiration access token | `15m` |
| `JWT_REFRESH_TOKEN_EXPIRES` | Expiration refresh token | `30d` |
| `ALLOWED_EMAIL_DOMAINS` | Domaines email autorisés | Tous |

## 🔒 Sécurité

### Bonnes pratiques implémentées

1. **Tokens JWT sécurisés** : Utilisation de `jose` pour la création et vérification
2. **Refresh tokens** : Rotation automatique des tokens d'accès
3. **HTTPS en production** : Tous les tokens sont transmis via HTTPS
4. **Validation des domaines** : Option pour restreindre les domaines email
5. **Expiration des tokens** : Tokens d'accès de courte durée
6. **Secrets sécurisés** : Génération aléatoire des secrets

### Protection CSRF

NextAuth gère automatiquement la protection CSRF pour toutes les routes d'authentification.

### Protection XSS

Les tokens sont stockés dans des cookies HTTP-only (via NextAuth) et ne sont pas accessibles depuis JavaScript côté client.

## 🧪 Tests

### Tester l'authentification Google

1. Démarrer l'application : `pnpm dev`
2. Visiter `/auth/signin`
3. Cliquer sur "Sign in with Google"
4. Sélectionner un compte Google
5. Vérifier la redirection vers la page d'origine

### Tester les routes protégées

```bash
# Sans authentification (devrait rediriger vers /auth/signin)
curl http://localhost:3000/api/protected

# Avec authentification (ajouter le token dans l'en-tête)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/protected
```

## 📚 Documentation supplémentaire

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)

## 🐛 Dépannage

### Erreur "Invalid credentials"

- Vérifier que `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET` sont corrects
- Vérifier que l'URI de redirection est configurée dans Google Cloud Console

### Erreur "NEXTAUTH_SECRET is not set"

- Générer un secret : `openssl rand -base64 32`
- Ajouter à `.env.local` : `NEXTAUTH_SECRET=votre-secret`

### Tokens expirés

- Les tokens d'accès expirent après 15 minutes
- Utiliser le refresh token pour obtenir un nouveau token d'accès
- Endpoint : `POST /api/auth/refresh`

