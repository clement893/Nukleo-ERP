# Diagnostic - Problème de chargement des photos

**Date**: 2024  
**Page**: `/fr/dashboard/reseau/contacts`  
**Problème**: Les photos ne se chargent pas dans la vue liste et galerie, mais fonctionnent dans la fiche contact

## 🔍 Analyse comparative

### ✅ Fiche contact (fonctionne)
**Fichier**: `apps/web/src/components/commercial/ContactDetail.tsx`
```tsx
{contact.photo_url ? (
  <img
    src={contact.photo_url}
    alt={`${contact.first_name} ${contact.last_name}`}
    className="w-24 h-24 rounded-full object-cover"
  />
) : (
  // Fallback
)}
```

**Caractéristiques**:
- ✅ Affichage direct sans logique complexe
- ✅ Pas de gestion d'état (isLoading, error, retry)
- ✅ Pas de cache localStorage
- ✅ Simple et efficace

### ❌ Vue liste (ne fonctionne pas)
**Fichier**: `apps/web/src/components/commercial/ContactAvatar.tsx`
**Utilisation**: Dans `DataTable` colonne `photo_url`

**Caractéristiques**:
- ❌ Logique complexe avec `useState`, `useEffect`
- ❌ Gestion du cache localStorage
- ❌ Retry automatique
- ❌ Gestion d'erreur avec fallback

### ❌ Vue galerie (ne fonctionne pas)
**Fichier**: `apps/web/src/components/commercial/ContactsGallery.tsx` → `GalleryPhoto`
**Utilisation**: Dans `ContactsGallery` component

**Caractéristiques**:
- ❌ Même logique complexe que ContactAvatar
- ❌ Cache localStorage
- ❌ Retry automatique

## 🐛 Problèmes identifiés

### Problème 1: `useEffect` retourne trop tôt avec cache
**Fichier**: `ContactAvatar.tsx` lignes 67-74
```tsx
if (cached) {
  try {
    const { url, expiresAt } = JSON.parse(cached);
    if (expiresAt > Date.now() + 86400000) {
      setCurrentPhotoUrl(url);
      // Don't set isLoading to false here - let the image load handler do it
      return; // ⚠️ PROBLÈME: Retourne sans réinitialiser isLoading
    }
  }
}
```

**Impact**: 
- Si une URL est trouvée dans le cache, `isLoading` reste à sa valeur initiale
- Si `isLoading` était `true`, il reste `true`
- L'image reste invisible (`opacity-0`) même si elle se charge

### Problème 2: Condition de rendu du skeleton
**Fichier**: `ContactAvatar.tsx` lignes 158-169
```tsx
if (isLoading && currentPhotoUrl && !imageError) {
  return (
    <div className="...animate-pulse...">
      {/* Skeleton */}
    </div>
  );
}
```

**Impact**:
- Si `isLoading` est `true` et `currentPhotoUrl` existe, on affiche le skeleton
- L'image ne s'affiche jamais même si elle est chargée
- Le skeleton reste affiché indéfiniment

### Problème 3: Opacity de l'image
**Fichier**: `ContactAvatar.tsx` lignes 197-202
```tsx
className={clsx(
  'rounded-full object-cover transition-opacity duration-300',
  isLoading ? 'opacity-0' : 'opacity-100', // ⚠️ PROBLÈME: opacity-0 si isLoading
  ...
)}
```

**Impact**:
- Si `isLoading` est `true`, l'image est invisible (`opacity-0`)
- Même si l'image est chargée, elle reste invisible
- `handleImageLoad` devrait mettre `isLoading` à `false`, mais si l'image est déjà chargée, `onLoad` ne se déclenche pas

### Problème 4: Image déjà chargée dans le cache navigateur
**Scénario**:
1. L'image est dans le cache du navigateur
2. Le composant monte avec `isLoading = true`
3. L'image se charge instantanément depuis le cache
4. `onLoad` ne se déclenche pas toujours pour les images en cache
5. `isLoading` reste à `true`
6. L'image reste invisible (`opacity-0`)

## 🔧 Solutions proposées

### Solution 1: Vérifier si l'image est déjà chargée
```tsx
useEffect(() => {
  if (!currentPhotoUrl) return;
  
  const img = new Image();
  img.onload = () => {
    setIsLoading(false);
    setImageError(false);
  };
  img.onerror = () => {
    setIsLoading(false);
    setImageError(true);
  };
  img.src = currentPhotoUrl;
}, [currentPhotoUrl]);
```

### Solution 2: Simplifier la logique (comme ContactDetail)
```tsx
// Option: Utiliser directement contact.photo_url sans cache complexe
// Si l'URL est valide, elle se chargera automatiquement
```

### Solution 3: Corriger le useEffect du cache
```tsx
if (cached) {
  try {
    const { url, expiresAt } = JSON.parse(cached);
    if (expiresAt > Date.now() + 86400000) {
      setCurrentPhotoUrl(url);
      setIsLoading(true); // Réinitialiser pour permettre le chargement
      setImageError(false);
      // Ne pas return ici - laisser continuer pour vérifier si l'image se charge
    }
  }
}
```

### Solution 4: Vérifier l'état de chargement de l'image
```tsx
const handleImageLoad = () => {
  setIsLoading(false);
  setImageError(false);
  // ... cache logic
};

// Vérifier si l'image est déjà chargée
useEffect(() => {
  if (!currentPhotoUrl) return;
  
  const img = document.createElement('img');
  img.src = currentPhotoUrl;
  
  if (img.complete) {
    // Image déjà chargée (cache navigateur)
    setIsLoading(false);
    setImageError(false);
  }
}, [currentPhotoUrl]);
```

## 🎯 Recommandation

**Option A - Solution rapide**: Simplifier comme `ContactDetail`
- Retirer toute la logique de cache/retry complexe
- Utiliser directement `contact.photo_url`
- Garder seulement le fallback si pas de photo

**Option B - Solution complète**: Corriger la logique existante
- Corriger le `useEffect` pour ne pas retourner trop tôt
- Vérifier si l'image est déjà chargée dans le cache navigateur
- S'assurer que `isLoading` est correctement géré

**Option C - Solution hybride**: Garder le cache mais simplifier
- Garder le cache localStorage pour les performances
- Simplifier la logique de chargement
- Retirer le retry automatique (trop complexe)

## 📊 Tests à effectuer

1. **Vérifier les données de l'API**
   - Les contacts ont-ils bien `photo_url` ?
   - Les URLs sont-elles valides ?
   - Les URLs sont-elles des presigned URLs S3 ?

2. **Vérifier le rendu**
   - L'élément `<img>` est-il dans le DOM ?
   - L'attribut `src` est-il correct ?
   - L'image est-elle chargée mais invisible (`opacity-0`) ?

3. **Vérifier les états**
   - `isLoading` est-il à `true` quand il ne devrait pas ?
   - `currentPhotoUrl` est-il défini ?
   - `imageError` est-il à `true` ?

4. **Vérifier le cache**
   - Le localStorage contient-il des URLs expirées ?
   - Le cache interfère-t-il avec le chargement ?

## 🔍 Prochaines étapes

1. Ajouter des `console.log` pour déboguer
2. Vérifier l'état dans React DevTools
3. Inspecter le DOM pour voir si l'image est présente mais invisible
4. Tester avec/sans cache localStorage
5. Comparer avec le comportement de ContactDetail
