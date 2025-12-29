# Optimisations des Builds

Ce document décrit les optimisations appliquées pour accélérer les builds Docker sur Railway.

## Temps de build actuel
- **Avant optimisations** : ~367 secondes (6.1 minutes)
- **Après optimisations** : ~280-300 secondes (4.5-5 minutes) estimé
- **Objectif** : Réduire à ~200-250 secondes (3.5-4 minutes)

## Optimisations appliquées

### 1. Élimination du double type check ✅
**Gain estimé** : ~15-20 secondes

**Problème** : Le type check était effectué deux fois :
- Dans `prebuild` script : `(SKIP_TYPE_CHECK=true || pnpm type-check)`
- Dans `validate-build.js` : Type check complet

**Solution** :
- Supprimé le type check du script `prebuild`
- Conservé uniquement le type check dans `validate-build.js` (avant le build)
- Ajouté `skipLibCheck: true` dans `next.config.js` pour accélérer le type check

**Fichiers modifiés** :
- `apps/web/package.json` : Script `prebuild` simplifié
- `apps/web/next.config.js` : Ajout de `skipLibCheck: true`

### 2. Optimisation des build traces ✅
**Gain estimé** : ~50 secondes

**Problème** : Les build traces prenaient ~50 secondes malgré `buildTraces: false` dans `next.config.js`

**Solution** :
- `buildTraces: false` déjà présent dans `next.config.js`
- Ajout de `ENV NEXT_PRIVATE_STANDALONE=true` dans Dockerfile pour forcer le mode standalone
- Ajout de `ENV NEXT_PRIVATE_SKIP_TRACE=1` pour désactiver complètement les build traces
- Les build traces sont désactivées dans le mode standalone

**Fichiers modifiés** :
- `Dockerfile` : Ajout de `ENV NEXT_PRIVATE_STANDALONE=true` et `ENV NEXT_PRIVATE_SKIP_TRACE=1`
- `apps/web/next.config.js` : Documentation mise à jour

### 3. Optimisation des installations pnpm ✅
**Gain estimé** : ~5-10 secondes

**Problème** : Plusieurs `pnpm install` redondants dans le Dockerfile

**Solution** :
- Supprimé le `pnpm install` après la construction du package types (non nécessaire)
- Utilisé `--frozen-lockfile` quand possible pour des installations plus rapides
- Conservé `--prefer-offline` pour utiliser le cache Railway

**Fichiers modifiés** :
- `Dockerfile` : Optimisation des étapes `pnpm install`

### 4. Cache TypeScript amélioré ✅
**Gain estimé** : ~5-10 secondes

**Solution** :
- `incremental: true` déjà activé dans `tsconfig.json`
- `tsBuildInfoFile` configuré pour utiliser le cache `.next/cache/`
- `skipLibCheck: true` pour éviter la vérification des types des node_modules

**Fichiers modifiés** :
- `apps/web/tsconfig.json` : Déjà optimisé
- `apps/web/next.config.js` : Ajout de `skipLibCheck: true`

### 5. Optimisation du cache Webpack ✅
**Gain estimé** : ~10-20 secondes sur les builds suivants

**Solution** :
- Configuration du cache Webpack filesystem dans `next.config.js`
- Création anticipée du répertoire de cache dans le Dockerfile
- Cache compressé avec gzip pour de meilleures performances
- Durée de cache de 7 jours pour réutiliser les builds précédents

**Fichiers modifiés** :
- `apps/web/next.config.js` : Configuration du cache Webpack optimisée
- `Dockerfile` : Création anticipée du répertoire de cache

## Optimisations futures possibles

### 1. Cache Docker BuildKit
**Gain estimé** : ~20-30 secondes sur les builds suivants

Utiliser BuildKit cache mounts pour :
- Cache pnpm store entre builds
- Cache node_modules entre builds
- Cache TypeScript build info
- Cache Webpack entre builds

**Exemple** :
```dockerfile
RUN --mount=type=cache,target=/app/.pnpm-store \
    pnpm install --frozen-lockfile
```

### 2. Parallélisation des étapes Docker
**Gain estimé** : ~10-15 secondes

Paralléliser les COPY et RUN indépendants dans le Dockerfile.

### 3. Réduction des dépendances
**Gain estimé** : ~10-20 secondes

Auditer et supprimer les dépendances inutilisées pour réduire le temps d'installation.

### 4. Utilisation de Turbopack (quand stable)
**Gain estimé** : ~30-50 secondes

Turbopack est généralement plus rapide que Webpack, mais actuellement désactivé à cause de problèmes avec les routes catch-all de next-auth.

### 5. Cache Next.js amélioré
**Gain estimé** : ~10-20 secondes

Utiliser un cache externe pour `.next/cache/` entre les builds.

## Résumé des gains

| Optimisation | Gain estimé | Statut |
|-------------|-------------|--------|
| Élimination double type check | 15-20s | ✅ Appliqué |
| Désactivation build traces | 50s | ✅ Appliqué |
| Optimisation pnpm install | 5-10s | ✅ Appliqué |
| Cache TypeScript amélioré | 5-10s | ✅ Appliqué |
| Cache Webpack optimisé | 10-20s (builds suivants) | ✅ Appliqué |
| **Total** | **85-110s** | **✅ Appliqué** |

**Temps de build estimé après optimisations** : ~280-300 secondes (4.5-5 minutes)
**Temps de build avec cache** : ~250-270 secondes (4-4.5 minutes) sur les builds suivants

## Vérification

Pour vérifier l'efficacité des optimisations :

1. Surveiller les logs de build Railway
2. Comparer le temps de build avant/après
3. Vérifier que les builds fonctionnent toujours correctement

## Notes importantes

- Les optimisations préservent la qualité des builds (type checking toujours effectué)
- Les builds restent reproductibles et fiables
- Les optimisations sont compatibles avec Railway et Docker
