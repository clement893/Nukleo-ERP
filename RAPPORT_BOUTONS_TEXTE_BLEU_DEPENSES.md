# Rapport d'Analyse : Boutons avec Texte Bleu (#0F4FDC) au lieu de Blanc

## Date
3 janvier 2026

## Page concernée
`/fr/dashboard/finances/depenses`

## Boutons identifiés avec problème
1. **Bouton "Modèle Excel"** (ligne 1070-1077)
2. **Bouton "Vue liste"** (ligne 1195-1201)

---

## Analyse du problème

### 1. Bouton "Modèle Excel"

**Code actuel :**
```tsx
<Button
  variant="outline"
  className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
  onClick={handleDownloadTemplate}
>
  <Download className="w-4 h-4 mr-2" />
  Modèle Excel
</Button>
```

**Problème identifié :**
- Le bouton utilise `variant="outline"` du composant `Button`
- Le variant "outline" dans `Button.tsx` (ligne 82-96) définit :
  ```tsx
  outline: [
    'border-2',
    'border-primary-600',
    'dark:border-primary-500',
    'text-foreground',  // ← PROBLÈME ICI
    'dark:text-foreground',
    'bg-transparent',
    // ...
  ]
  ```
- La classe `text-foreground` est appliquée **après** la className personnalisée dans le `clsx()`, ce qui peut créer un conflit de spécificité
- Même si `text-white` est dans la className, le variant "outline" peut override avec `text-foreground` qui résout vers `#0F4FDC` ou `#2662EA`

**Raison technique :**
- L'ordre des classes dans `clsx()` : `baseStyles`, `variantClasses`, `sizeClasses`, `className`
- Le variant "outline" applique `text-foreground` qui a une spécificité CSS élevée
- Les règles CSS globales dans `globals.css` ciblent principalement les boutons avec `bg-primary-500/600` ou `bg-[#523DC9]`, mais pas les boutons `outline` avec backgrounds personnalisés

---

### 2. Bouton "Vue liste"

**Code actuel :**
```tsx
<Button
  variant={useGridView ? 'outline' : 'primary'}
  onClick={() => setUseGridView(!useGridView)}
  size="sm"
>
  {useGridView ? 'Vue liste' : 'Vue tableau'}
</Button>
```

**Problème identifié :**
- Quand `useGridView` est `true`, le bouton utilise `variant="outline"`
- Le variant "outline" applique `text-foreground` (ligne 86 de `Button.tsx`)
- `text-foreground` résout vers la couleur de texte principale du thème, qui est `#0F4FDC` ou `#2662EA`
- Aucune règle CSS globale ne force le texte blanc pour les boutons `outline` sans background primary

**Raison technique :**
- Le variant "outline" est conçu pour avoir un texte de couleur foreground (normal pour un bouton outline)
- Mais dans ce contexte (header avec gradient), le texte devrait être blanc pour le contraste
- Les règles CSS globales ne couvrent pas ce cas spécifique

---

## Règles CSS globales existantes

Les règles dans `globals.css` (lignes 482-609) ciblent :
- ✅ Boutons avec `bg-[#523DC9]`
- ✅ Boutons avec `bg-primary-500` ou `bg-primary-600`
- ✅ Boutons avec `bg-purple-500/600/700`
- ❌ **PAS** les boutons `variant="outline"` avec backgrounds personnalisés
- ❌ **PAS** les boutons avec `bg-white/20` (background semi-transparent)

---

## Solutions possibles

### Solution 1 : Ajouter des règles CSS globales spécifiques
Ajouter dans `globals.css` :
```css
/* Forcer texte blanc pour les boutons outline avec backgrounds semi-transparents */
button[class*="bg-white/"]:not([class*="text-foreground"]),
button[class*="bg-white/20"],
button[class*="bg-white/30"] {
  color: white !important;
}

/* Forcer texte blanc pour les boutons outline dans les headers avec gradient */
.bg-nukleo-gradient ~ * button[variant="outline"],
[class*="bg-nukleo-gradient"] button[variant="outline"] {
  color: white !important;
}
```

### Solution 2 : Modifier le composant Button
Ajouter une prop `forceWhiteText` ou modifier le variant "outline" pour accepter une className qui override le texte.

### Solution 3 : Utiliser un variant personnalisé
Créer un variant "outline-white" spécifique pour les boutons outline avec texte blanc.

### Solution 4 : Modifier directement les boutons
Ajouter `!text-white` dans la className pour forcer le texte blanc avec `!important`.

---

## Recommandation

**Solution recommandée : Solution 1 + Solution 4 (hybride)**
1. Ajouter des règles CSS globales pour couvrir les cas généraux (boutons outline avec backgrounds semi-transparents)
2. Ajouter `!text-white` dans les className des boutons spécifiques pour garantir le texte blanc

**Raison :**
- Les règles CSS globales couvriront les cas similaires sur d'autres pages
- L'ajout de `!text-white` garantit que ces boutons spécifiques auront toujours du texte blanc, même si d'autres styles changent

---

## Fichiers à modifier

1. `apps/web/src/app/globals.css` - Ajouter règles CSS globales
2. `apps/web/src/app/[locale]/dashboard/finances/depenses/page.tsx` - Modifier les boutons concernés

---

## Notes additionnelles

- Le problème peut également affecter d'autres pages avec des headers gradient similaires
- Il serait bénéfique de créer un variant de bouton réutilisable pour les headers avec gradient
- Les règles CSS globales existantes sont très spécifiques et ne couvrent pas tous les cas d'usage
