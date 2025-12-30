# Audit du Chargement des Photos - Page Contacts

**Date**: 30 décembre 2025  
**Page analysée**: `/fr/dashboard/reseau/contacts`  
**Fichiers concernés**:
- `apps/web/src/app/[locale]/dashboard/reseau/contacts/page.tsx`
- `apps/web/src/components/commercial/ContactsGallery.tsx`
- `backend/app/api/v1/endpoints/commercial/contacts.py`

---

## 📊 Résumé Exécutif

**Score global**: 6.5/10

Le système de chargement des photos fonctionne mais présente plusieurs problèmes de performance, de gestion d'erreurs et d'expiration des URLs.

### Points forts ✅
- Lazy loading implémenté (`loading="lazy"`)
- Décodage asynchrone (`decoding="async"`)
- Placeholders visuels quand pas de photo
- Presigned URLs pour sécurité S3

### Points critiques ⚠️
- Expiration des presigned URLs (7 jours)
- Pas de gestion d'erreur si image ne charge pas
- Pas de retry automatique
- Vérification S3 à chaque appel API (performance)
- Pas de cache côté client

---

## 1. ARCHITECTURE ACTUELLE

### 1.1 Backend - Génération des Presigned URLs

**Fichier**: `backend/app/api/v1/endpoints/commercial/contacts.py`

**Processus**:
1. Stockage dans S3 avec `file_key` format: `contacts/photos/{contact_id}/{filename}`
2. À chaque appel API, régénération des presigned URLs
3. Vérification de l'existence du fichier dans S3 avant génération
4. Expiration: 7 jours (maximum AWS S3)

**Code clé**:
```python
def regenerate_photo_url(photo_url: Optional[str], contact_id: Optional[int] = None) -> Optional[str]:
    # Extraction du file_key depuis l'URL ou utilisation directe
    # Vérification existence dans S3
    metadata = s3_service.get_file_metadata(file_key)
    # Génération presigned URL avec expiration 7 jours
    presigned_url = s3_service.generate_presigned_url(file_key, expiration=604800)
```

**Problèmes identifiés**:
- ⚠️ **Vérification S3 à chaque appel** (ligne 95): `get_file_metadata()` appelé pour chaque contact
  - Impact: Latence ajoutée, coûts S3 API
  - Solution: Cache des métadonnées ou vérification conditionnelle

- ⚠️ **Expiration 7 jours**: Les URLs expirent après 7 jours
  - Impact: Images cassées après expiration
  - Solution: Régénération automatique côté frontend ou extension expiration

- ⚠️ **Pas de fallback**: Si la génération échoue, retourne `None`
  - Impact: Image manquante sans indication d'erreur
  - Solution: Retry ou fallback vers placeholder

### 1.2 Frontend - Affichage des Images

**Fichier**: `apps/web/src/app/[locale]/dashboard/reseau/contacts/page.tsx` (ligne 468-474)

**Tableau (Liste)**:
```tsx
<img
  src={String(value)}
  alt={`Photo de profil de ${contact.first_name} ${contact.last_name}`}
  className="w-10 h-10 rounded-full object-cover"
  loading="lazy"
  decoding="async"
/>
```

**Galerie**:
```tsx
<img
  src={contact.photo_url}
  alt={`Photo de profil de ${contact.first_name} ${contact.last_name}`}
  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-200"
  loading="lazy"
  decoding="async"
/>
```

**Points positifs**:
- ✅ Lazy loading activé
- ✅ Décodage asynchrone
- ✅ Alt text descriptif

**Problèmes identifiés**:
- ❌ **Pas de gestion d'erreur**: Pas de `onError` handler
  - Impact: Images cassées affichent l'icône de navigateur par défaut
  - Solution: Handler `onError` avec fallback vers placeholder

- ❌ **Pas de placeholder pendant chargement**: Pas de skeleton/placeholder
  - Impact: Espace vide ou flash de contenu
  - Solution: Skeleton loader ou placeholder avec initiales

- ❌ **Pas de retry**: Si l'image échoue, pas de nouvelle tentative
  - Impact: Images manquantes permanentes si URL expirée temporairement
  - Solution: Retry automatique avec backoff exponentiel

- ❌ **Pas de cache**: URLs régénérées à chaque rechargement
  - Impact: Requêtes S3 inutiles, latence
  - Solution: Cache localStorage/sessionStorage des URLs valides

---

## 2. PROBLÈMES DE PERFORMANCE

### 2.1 Vérification S3 à chaque appel API

**Problème**: Pour chaque contact avec photo, le backend vérifie l'existence dans S3
```python
metadata = s3_service.get_file_metadata(file_key)  # Appel S3 API
```

**Impact**:
- Latence: ~50-200ms par vérification
- Avec 20 contacts avec photos: 1-4 secondes de latence totale
- Coûts: Requêtes S3 API facturées

**Solution recommandée**:
```python
# Cache des métadonnées en mémoire (TTL 1h)
@lru_cache(maxsize=1000)
def check_file_exists_cached(file_key: str) -> bool:
    try:
        s3_service.get_file_metadata(file_key)
        return True
    except:
        return False
```

### 2.2 Régénération systématique des URLs

**Problème**: URLs régénérées même si encore valides
- Si URL valide < 1 jour, pas besoin de régénérer
- Frontend pourrait vérifier l'expiration avant de recharger

**Solution**: Vérifier l'expiration avant régénération
```python
# Vérifier si URL encore valide (ex: > 1 jour restant)
if is_url_still_valid(photo_url):
    return photo_url  # Réutiliser URL existante
```

### 2.3 Pas de cache côté client

**Problème**: URLs téléchargées à chaque visite de page
- Même si URL encore valide, re-téléchargement

**Solution**: Cache localStorage
```typescript
// Cache URL avec timestamp d'expiration
const cachedUrl = localStorage.getItem(`photo_${contactId}`);
if (cachedUrl && !isExpired(cachedUrl)) {
    return cachedUrl;
}
```

---

## 3. GESTION D'ERREURS

### 3.1 Images cassées / URLs expirées

**Problème actuel**: Pas de gestion d'erreur
- Image cassée → Icône navigateur par défaut
- URL expirée → Image ne charge pas, pas de retry

**Impact utilisateur**:
- Mauvaise expérience visuelle
- Pas d'indication que l'image devrait être là

**Solution recommandée**:
```tsx
const [imageError, setImageError] = useState(false);
const [retryCount, setRetryCount] = useState(0);

const handleImageError = async () => {
  if (retryCount < 3) {
    // Retry avec nouvelle URL
    const newUrl = await refreshPhotoUrl(contactId);
    setRetryCount(prev => prev + 1);
    // Réessayer avec nouvelle URL
  } else {
    // Fallback vers placeholder
    setImageError(true);
  }
};

<img
  src={imageError ? null : photoUrl}
  onError={handleImageError}
  // ...
/>
```

### 3.2 Fichiers manquants dans S3

**Problème**: Si fichier supprimé de S3 mais référence existe en DB
- Backend retourne `None` pour `photo_url`
- Frontend affiche placeholder (OK)
- Mais pas de log/notification

**Solution**: Logging et nettoyage
```python
# Backend: Logger les fichiers manquants
if not file_exists:
    logger.warning(f"Photo missing for contact {contact_id}: {file_key}")
    # Optionnel: Nettoyer DB
    contact.photo_url = None
```

---

## 4. EXPÉRIENCE UTILISATEUR

### 4.1 Placeholder pendant chargement

**Problème actuel**: Pas de placeholder/skeleton
- Espace vide pendant chargement
- Flash de contenu quand image charge

**Solution**: Skeleton loader
```tsx
{loading ? (
  <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
) : (
  <img src={photoUrl} ... />
)}
```

### 4.2 Transitions visuelles

**Problème**: Pas de transition lors du chargement
- Apparition brutale de l'image

**Solution**: Fade-in
```tsx
<img
  className="opacity-0 transition-opacity duration-300"
  onLoad={(e) => e.currentTarget.classList.add('opacity-100')}
/>
```

### 4.3 Images de grande taille

**Problème**: Pas d'optimisation de taille
- Images téléchargées en taille originale
- Même pour thumbnails 10x10px

**Solution**: URLs avec paramètres de transformation
```python
# Générer URL avec transformation CloudFront/ImageKit
presigned_url = s3_service.generate_presigned_url(
    file_key,
    transformation={'width': 100, 'height': 100, 'quality': 80}
)
```

---

## 5. SÉCURITÉ

### 5.1 Presigned URLs

**Points positifs**:
- ✅ URLs temporaires (7 jours)
- ✅ Accès contrôlé via S3

**Points à améliorer**:
- ⚠️ URLs dans le DOM (visible dans le code source)
  - Impact: URLs peuvent être partagées
  - Solution: Expiration plus courte (1-2 jours) ou refresh automatique

- ⚠️ Pas de validation CORS stricte
  - Vérifier que les images sont servies avec headers CORS appropriés

---

## 6. RECOMMANDATIONS PRIORITAIRES

### 🔴 Critique (À faire immédiatement)

1. **Ajouter gestion d'erreur `onError`**
   ```tsx
   <img
     onError={(e) => {
       e.currentTarget.src = '/placeholder-avatar.png';
       // ou afficher initiales
     }}
   />
   ```

2. **Cache des métadonnées S3 côté backend**
   - Réduire les appels S3 API
   - Améliorer la latence

3. **Retry automatique pour URLs expirées**
   - Détecter erreur 403/404
   - Régénérer URL et réessayer

### 🟡 Important (À faire sous peu)

4. **Placeholder/Skeleton pendant chargement**
   - Meilleure UX
   - Indication visuelle du chargement

5. **Cache localStorage côté client**
   - Réduire les requêtes
   - Améliorer les performances

6. **Optimisation taille images**
   - Thumbnails pour liste (100x100px)
   - Images complètes pour galerie seulement

### 🟢 Amélioration (Nice to have)

7. **Transitions visuelles**
   - Fade-in lors du chargement
   - Meilleure expérience

8. **Lazy loading amélioré**
   - Intersection Observer avec threshold
   - Préchargement des images proches du viewport

9. **WebP avec fallback**
   - Format moderne plus léger
   - Fallback JPEG pour compatibilité

10. **Monitoring et analytics**
    - Taux d'échec de chargement
    - Temps de chargement moyen
    - Alertes si taux d'échec élevé

---

## 7. MÉTRIQUES ACTUELLES (Estimées)

### Performance
- **Temps de chargement initial**: ~500-1000ms (selon nombre de contacts)
- **Latence par vérification S3**: ~50-200ms
- **Taille moyenne image**: ~100-500KB (non optimisée)
- **Requêtes S3 par page**: 1-20 (selon contacts avec photos)

### Fiabilité
- **Taux d'échec estimé**: 5-10% (URLs expirées, fichiers manquants)
- **Pas de retry**: 0% de récupération automatique
- **Cache hit rate**: 0% (pas de cache)

---

## 8. MÉTRIQUES CIBLES (Après optimisations)

### Performance
- **Temps de chargement initial**: ~200-400ms (avec cache)
- **Latence par vérification S3**: ~10-50ms (avec cache backend)
- **Taille moyenne image**: ~20-50KB (optimisée)
- **Requêtes S3 par page**: 0-5 (avec cache)

### Fiabilité
- **Taux d'échec estimé**: <1% (avec retry)
- **Retry automatique**: 80-90% de récupération
- **Cache hit rate**: 70-90% (avec localStorage)

---

## 9. PLAN D'IMPLÉMENTATION

### Phase 1 - Corrections critiques (1-2 jours)
1. Ajouter `onError` handler avec fallback
2. Implémenter retry automatique
3. Cache métadonnées S3 côté backend

### Phase 2 - Optimisations (2-3 jours)
4. Placeholder/Skeleton loader
5. Cache localStorage côté client
6. Optimisation taille images

### Phase 3 - Améliorations (1-2 jours)
7. Transitions visuelles
8. Monitoring et analytics
9. WebP avec fallback

---

## 10. CONCLUSION

Le système de chargement des photos fonctionne mais nécessite des améliorations significatives en termes de:
- **Gestion d'erreurs**: Critique pour la fiabilité
- **Performance**: Réduction des appels S3 et optimisation des images
- **UX**: Placeholders et transitions pour une meilleure expérience

**Score actuel**: 6.5/10  
**Score cible**: 9/10 (après implémentation des recommandations)

---

**Audit réalisé par**: Assistant IA  
**Prochain audit recommandé**: Après implémentation Phase 1
