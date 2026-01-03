# Audit : Problème de couleur de texte en Dark Mode

**Date :** 2025-01-27  
**Problème identifié :** Les styles inline de couleur de texte écrasent les classes CSS dark mode

---

## 🔍 Problème identifié

Les composants utilisant `applyVariantConfigAsStyles` appliquent des styles inline pour la couleur du texte. Ces styles inline ont une priorité CSS plus élevée que les classes Tailwind `dark:text-*`, ce qui empêche le dark mode de fonctionner correctement.

### Exemple du problème

Le bouton avec variant `outline` avait :
- **Configuration :** `text: "var(--color-primary-600)"` → génère `color: var(--color-primary-600)` en style inline
- **Classes CSS :** `text-foreground dark:text-foreground`
- **Résultat :** Le style inline override les classes, donc le texte reste `#4731A3` même en dark mode au lieu de `#f8fafc`

---

## ✅ Corrections appliquées

### 1. Button - Variant `outline`
**Fichier :** `apps/web/src/lib/theme/default-theme-config.ts` (ligne 203-207)

**Avant :**
```typescript
outline: {
  border: "2px solid var(--color-primary-500)",
  text: "var(--color-primary-600)",  // ❌ Override les classes dark mode
  hover: "var(--color-primary-50)"
}
```

**Après :**
```typescript
outline: {
  border: "2px solid var(--color-primary-500)",
  // No text color - let CSS classes (text-foreground/dark:text-foreground) handle it
  hover: "var(--color-primary-50)"
}
```

### 2. Button - Variant `ghost`
**Fichier :** `apps/web/src/lib/theme/default-theme-config.ts` (ligne 208-211)

**Avant :**
```typescript
ghost: {
  text: "var(--color-foreground)",  // ❌ Potentiellement problématique
  hover: "var(--color-muted)"
}
```

**Après :**
```typescript
ghost: {
  // No text color - let CSS classes (text-foreground) handle it
  hover: "var(--color-muted)"
}
```

---

## 🔍 Composants vérifiés

### ✅ Button
- **Variants vérifiés :** `primary`, `secondary`, `outline`, `ghost`, `danger`
- **Problèmes trouvés :** `outline` et `ghost` (corrigés)
- **Status :** ✅ Corrigé

### ✅ Badge
- **Utilise :** `applyVariantConfigAsStyles`
- **Problèmes trouvés :** Aucun (pas de configuration de variant dans `default-theme-config.ts`)
- **Risque futur :** ⚠️ Si une config de variant avec `text` est ajoutée, le même problème pourrait survenir
- **Status :** ✅ OK pour l'instant

### ✅ Alert
- **Utilise :** `applyVariantConfigAsStyles`
- **Problèmes trouvés :** Aucun (pas de configuration de variant dans `default-theme-config.ts`)
- **Risque futur :** ⚠️ Si une config de variant avec `text` est ajoutée, le même problème pourrait survenir
- **Status :** ✅ OK pour l'instant

---

## 📋 Règles à suivre

### Pour éviter ce problème à l'avenir :

1. **Ne pas définir de propriété `text` dans les configurations de variants** si le composant utilise des classes CSS avec dark mode (`dark:text-*`)

2. **Laisser les classes CSS gérer la couleur du texte** pour les variants qui doivent s'adapter au dark mode

3. **Utiliser des styles inline uniquement pour :**
   - Les couleurs qui ne changent pas en dark mode (ex: `white` pour les boutons primary)
   - Les propriétés qui ne sont pas gérées par les classes CSS

4. **Si une couleur de texte doit être définie dans la config :**
   - Utiliser une variable CSS qui change automatiquement en dark mode
   - OU s'assurer qu'il n'y a pas de classes `dark:text-*` qui seraient overridées

---

## 🧪 Tests recommandés

1. Tester tous les variants de Button en dark mode
2. Vérifier que les couleurs de texte sont correctes en dark mode
3. Vérifier que les couleurs de texte sont correctes en light mode
4. Tester avec différents thèmes personnalisés

---

## 📝 Notes techniques

### Priorité CSS
Les styles inline ont une priorité plus élevée que les classes CSS, même avec `!important` sur les classes. C'est pourquoi les styles inline override les classes `dark:text-*`.

### Solution
En retirant la propriété `text` de la configuration, les classes CSS peuvent fonctionner correctement :
- `text-foreground` en light mode
- `dark:text-foreground` en dark mode

Ces classes utilisent la variable CSS `--color-foreground` qui change automatiquement selon le mode.

---

## 🔗 Fichiers modifiés

1. `apps/web/src/lib/theme/default-theme-config.ts`
   - Retiré `text: "var(--color-primary-600)"` du variant `outline`
   - Retiré `text: "var(--color-foreground)"` du variant `ghost`

---

## ✅ Validation

- [x] Variant `outline` corrigé
- [x] Variant `ghost` corrigé
- [x] Badge vérifié (pas de problème)
- [x] Alert vérifié (pas de problème)
- [x] Documentation créée
