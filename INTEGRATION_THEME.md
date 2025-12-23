# Guide d'Intégration - Système de Gestion des Thèmes Globaux

Ce guide explique comment intégrer le système de gestion des thèmes globaux dans votre application.

## 📋 Vue d'ensemble

Le système permet au superadmin (ou développeur) de configurer un thème global qui s'applique à tous les utilisateurs de la plateforme. Le thème est stocké en base de données et appliqué automatiquement via des variables CSS.

## 🚀 Étapes d'intégration

### 1. Backend - Configuration de la base de données

#### 1.1 Créer la migration Alembic

```bash
cd backend
alembic revision --autogenerate -m "Create themes table"
alembic upgrade head
```

#### 1.2 Vérifier la configuration

Assurez-vous que votre fichier `backend/.env` contient :

```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/dbname
SECRET_KEY=your-secret-key
FRONTEND_URL=http://localhost:3000
```

#### 1.3 Démarrer le serveur FastAPI

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend - Intégration dans Next.js

#### 2.1 Ajouter le GlobalThemeProvider dans le layout

Modifiez votre fichier `apps/web/src/app/layout.tsx` :

```tsx
import { GlobalThemeProvider } from '@/lib/theme/global-theme-provider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <GlobalThemeProvider>
          {children}
        </GlobalThemeProvider>
      </body>
    </html>
  );
}
```

#### 2.2 Utiliser les variables CSS du thème

Dans vos fichiers CSS ou composants, utilisez les variables CSS générées :

```css
/* styles/globals.css */
.container {
  background-color: var(--color-background);
  color: var(--color-foreground);
  border: 1px solid var(--color-border);
  padding: var(--spacing-md);
  border-radius: var(--border-radius-lg);
}

.button-primary {
  background-color: var(--color-primary);
  color: var(--color-primary-foreground);
}
```

#### 2.3 Créer une page admin pour gérer les thèmes

Créez `apps/web/src/app/admin/themes/page.tsx` :

```tsx
'use client';

import { ThemeManager } from '@/components/admin/themes/ThemeManager';
import { useAuth } from '@/hooks/useAuth'; // Ajustez selon votre hook d'auth

export default function AdminThemesPage() {
  const { token, user } = useAuth();
  
  // Vérifier que l'utilisateur est superadmin
  if (!user?.is_superadmin) {
    return <div>Accès refusé</div>;
  }
  
  return (
    <div className="container mx-auto py-8">
      <ThemeManager authToken={token} />
    </div>
  );
}
```

### 3. Configuration d'un thème initial

#### 3.1 Via l'interface admin

1. Connectez-vous en tant que superadmin
2. Accédez à `/admin/themes`
3. Cliquez sur "Create New Theme"
4. Utilisez l'exemple de configuration JSON fourni dans `examples/theme-config-example.json`

#### 3.2 Via l'API directement

```bash
curl -X POST http://localhost:8000/api/v1/themes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "default-light",
    "display_name": "Default Light Theme",
    "description": "Theme clair par défaut",
    "config": {
      "color": {
        "background": "#ffffff",
        "foreground": "#000000",
        "primary": "#0070f3"
      }
    },
    "is_active": true
  }'
```

### 4. Exemples de configuration de thème

#### Thème clair (Light)

Voir `examples/theme-config-example.json`

#### Thème sombre (Dark)

Voir `examples/theme-config-dark.json`

#### Structure de configuration recommandée

```json
{
  "color": {
    "background": "#ffffff",
    "foreground": "#000000",
    "primary": "#0070f3",
    "secondary": "#6b7280",
    "accent": "#f59e0b",
    "border": "#e5e7eb"
  },
  "spacing": {
    "unit": "8px",
    "sm": "8px",
    "md": "16px",
    "lg": "24px"
  },
  "typography": {
    "font-family": {
      "sans": "Inter, sans-serif"
    },
    "font-size": {
      "base": "16px"
    }
  }
}
```

## 🔧 Personnalisation

### Adapter l'authentification

Le fichier `backend/app/api/dependencies.py` contient des placeholders pour l'authentification. Adaptez-les selon votre système :

```python
# Remplacer MockUser par votre modèle User réel
from app.models.user import User

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    # Votre logique d'authentification
    user = db.query(User).filter(User.id == user_id).first()
    return user
```

### Adapter le frontend

Dans `apps/web/src/lib/api/theme.ts`, la fonction `getAuthToken()` utilise `localStorage`. Adaptez selon votre système d'authentification :

```typescript
function getAuthToken(): string {
  // Exemple avec NextAuth
  const session = useSession();
  return session.data?.accessToken || '';
  
  // Ou avec un contexte React
  const { token } = useAuth();
  return token || '';
}
```

## 📝 Notes importantes

1. **Un seul thème actif** : Seul un thème peut être actif à la fois. L'activation d'un nouveau thème désactive automatiquement l'ancien.

2. **Rafraîchissement automatique** : Le `GlobalThemeProvider` rafraîchit automatiquement le thème toutes les 5 minutes. Les utilisateurs verront les changements sans recharger la page.

3. **Variables CSS** : Les variables CSS sont appliquées au niveau du document root (`:root`), ce qui permet de les utiliser partout dans votre application.

4. **Format JSON** : La configuration doit être un JSON valide. Le formulaire admin valide le JSON avant la soumission.

5. **Sécurité** : Seuls les superadmins peuvent créer, modifier, activer ou supprimer des thèmes. L'endpoint `/api/v1/themes/active` est public pour permettre le chargement du thème sans authentification.

## 🐛 Dépannage

### Le thème ne s'applique pas

1. Vérifiez que le `GlobalThemeProvider` est bien enveloppé autour de votre application
2. Vérifiez la console du navigateur pour les erreurs
3. Vérifiez que l'API backend répond correctement à `/api/v1/themes/active`
4. Vérifiez que les variables CSS sont bien définies dans le document root

### Erreur 401/403 lors de la gestion des thèmes

1. Vérifiez que vous êtes connecté en tant que superadmin
2. Vérifiez que le token d'authentification est valide
3. Vérifiez que l'endpoint backend est correctement configuré

### La migration Alembic échoue

1. Vérifiez que la base de données est accessible
2. Vérifiez que la `DATABASE_URL` est correcte dans `.env`
3. Vérifiez que vous avez les permissions nécessaires sur la base de données

## 📚 Documentation complète

Pour plus de détails, consultez :
- [THEME_MANAGEMENT.md](./docs/THEME_MANAGEMENT.md) - Documentation complète du système
- [Exemples de configuration](./examples/) - Exemples de configurations de thème

## ✅ Checklist d'intégration

- [ ] Migration Alembic créée et exécutée
- [ ] Backend démarré et accessible
- [ ] `GlobalThemeProvider` ajouté au layout
- [ ] Page admin créée pour gérer les thèmes
- [ ] Premier thème créé et activé
- [ ] Variables CSS utilisées dans les composants
- [ ] Authentification configurée correctement
- [ ] Tests effectués avec différents thèmes

---

**Félicitations !** Votre système de gestion des thèmes globaux est maintenant intégré ! 🎨

