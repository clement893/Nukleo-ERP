# 🔍 Diagnostic des Erreurs RBAC (403 Forbidden)

## 📋 Résumé des Erreurs

Vous rencontrez des erreurs `403 (Forbidden)` sur les endpoints RBAC :
- `/v1/rbac/users/3/roles` → `403 Forbidden`
- `/v1/rbac/roles?skip=0&limit=100` → `403 Forbidden`
- `/v1/rbac/permissions` → `403 Forbidden`
- `/v1/rbac/users/3/permissions` → `403 Forbidden`
- `/v1/rbac/users/3/permissions/custom` → `403 Forbidden`

Et dans l'interface utilisateur :
- "Aucune permission disponible à ajouter"
- "Aucune rôle disponible"

## 🔎 Causes Probables

Ces erreurs indiquent que **votre compte utilisateur n'a pas les permissions nécessaires** pour accéder aux endpoints RBAC. Les causes possibles sont :

1. **Le rôle `superadmin` n'est pas assigné à votre compte**
   - Le système RBAC vérifie si vous avez le rôle `superadmin` pour vous accorder `admin:*` (toutes les permissions)
   - Sans ce rôle, vous n'avez pas accès aux endpoints RBAC

2. **Les données RBAC ne sont pas initialisées dans la base de données**
   - Les rôles et permissions par défaut n'ont peut-être pas été créés
   - Les permissions nécessaires (`roles:read`, `permissions:read`, `users:read`) n'existent peut-être pas

3. **Le token JWT a expiré** (erreur `401 Unauthorized` pour `/v1/users/preferences`)
   - Cela peut causer des problèmes d'authentification

## 🛠️ Solution : Diagnostic et Correction

### Étape 1 : Diagnostiquer le Problème

Exécutez le script de diagnostic pour identifier le problème :

```bash
cd backend
python scripts/diagnose_rbac.py --user-email VOTRE_EMAIL@example.com
```

Ce script va :
- ✅ Lister tous les rôles dans la base de données
- ✅ Lister toutes les permissions
- ✅ Vérifier les rôles et permissions de votre compte
- ✅ Tester les permissions nécessaires pour les endpoints RBAC
- ✅ Identifier si vous avez le rôle `superadmin`

### Étape 2 : Corriger le Problème

#### Option A : Si les données RBAC ne sont pas initialisées

Exécutez le script de seeding pour créer les rôles et permissions par défaut :

```bash
cd backend
python scripts/fix_rbac_user.py --user-email VOTRE_EMAIL@example.com --seed-data --assign-superadmin
```

#### Option B : Si seulement le rôle superadmin manque

Assignez simplement le rôle superadmin à votre compte :

```bash
cd backend
python scripts/fix_rbac_user.py --user-email VOTRE_EMAIL@example.com --assign-superadmin
```

### Étape 3 : Vérifier la Correction

Réexécutez le diagnostic pour confirmer que tout est correct :

```bash
cd backend
python scripts/diagnose_rbac.py --user-email VOTRE_EMAIL@example.com
```

Vous devriez voir :
- ✅ `Superadmin role: ✅ YES`
- ✅ Toutes les permissions nécessaires retournent `✅`

## 🔐 Comment Fonctionne le Système RBAC

### Permissions Requises pour les Endpoints RBAC

- **`GET /rbac/roles`** → Requiert `roles:read`
- **`GET /rbac/permissions`** → Requiert `permissions:read`
- **`GET /rbac/users/{id}/roles`** → Requiert `users:read` (si ce n'est pas votre propre compte)
- **`GET /rbac/users/{id}/permissions`** → Requiert `users:read` (si ce n'est pas votre propre compte)

### Rôle Superadmin

Le rôle `superadmin` accorde automatiquement la permission `admin:*`, qui **donne accès à toutes les permissions**, y compris :
- `roles:read`, `roles:create`, `roles:update`, `roles:delete`
- `permissions:read`, `permissions:create`, `permissions:update`, `permissions:delete`
- `users:read`, `users:create`, `users:update`, `users:delete`
- Et toutes les autres permissions du système

### Gestion des Wildcards

Le système gère les permissions wildcard :
- **`admin:*`** → Accorde toutes les permissions
- **`users:*`** → Accorde toutes les permissions liées aux utilisateurs (`users:read`, `users:create`, etc.)
- **`roles:*`** → Accorde toutes les permissions liées aux rôles

## ⚠️ Erreur CSS MIME Type

L'erreur `Refused to execute script from '...css' because its MIME type ('text/css') is not executable` est un **avertissement du navigateur** et n'affecte pas le fonctionnement de l'application. C'est souvent causé par :
- Des extensions de navigateur (comme Grammarly)
- Des configurations de serveur qui servent incorrectement les fichiers CSS

Cette erreur peut être ignorée en toute sécurité.

## 📝 Notes Importantes

1. **Après avoir assigné le rôle superadmin**, vous devrez peut-être vous **reconnecter** pour que le nouveau token JWT reflète vos nouvelles permissions.

2. **Le seeding est idempotent** : vous pouvez l'exécuter plusieurs fois sans créer de doublons.

3. **Les rôles système** (`is_system=True`) ne peuvent pas être supprimés, mais leurs permissions peuvent être modifiées.

4. **Sécurité** : Assurez-vous que seul le dernier superadmin ne peut pas être retiré (protection implémentée dans le backend).

## 🆘 Si le Problème Persiste

Si après avoir exécuté ces scripts le problème persiste :

1. Vérifiez les logs du backend pour voir les erreurs exactes
2. Vérifiez que votre token JWT n'a pas expiré (reconnectez-vous)
3. Vérifiez que la migration `022_add_user_permissions_table` a été exécutée
4. Contactez le support avec les résultats du script de diagnostic
