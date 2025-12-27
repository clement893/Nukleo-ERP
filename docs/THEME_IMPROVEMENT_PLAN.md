# Plan d'Amélioration du Système de Thème - Batch par Batch

**Objectif**: Amener le système de thème de **6.6/10** à **10/10**  
**Méthodologie**: Développement par batches avec tests TypeScript et push après chaque batch  
**Date de début**: 27 décembre 2025

---

## 📊 État Initial

- **Architecture**: 9/10
- **Couleurs**: 7/10
- **Polices**: 8/10
- **Contrastes**: 4/10
- **Accessibilité**: 5/10
- **Score Global**: 6.6/10

## 🎯 Objectifs par Catégorie

- **Architecture**: 9/10 → 10/10 (cache, validation schéma)
- **Couleurs**: 7/10 → 10/10 (validation contraste, mode sombre)
- **Polices**: 8/10 → 10/10 (validation tailles, préchargement)
- **Contrastes**: 4/10 → 10/10 (calcul, validation, tests)
- **Accessibilité**: 5/10 → 10/10 (WCAG compliance, tests)

---

## 📦 Plan des Batches

### Batch 1: Fondations - Calcul de Contraste ✅ EN COURS
**Objectif**: Créer les fonctions de base pour calculer les contrastes  
**Fichiers**:
- `apps/web/src/lib/theme/contrast-utils.ts` (nouveau)
- `apps/web/src/lib/theme/__tests__/contrast-utils.test.ts` (nouveau)

**Tâches**:
- [x] Créer fonction `hexToRgb()`
- [x] Créer fonction `getLuminance()`
- [x] Créer fonction `calculateContrastRatio()`
- [x] Créer fonction `meetsWCAGAA()`
- [x] Créer fonction `meetsWCAGAAA()`
- [x] Créer fonction `getContrastLevel()`
- [ ] Tests TypeScript complets
- [ ] Push batch 1

**Score attendu après**: Contrastes 4/10 → 6/10

---

### Batch 2: Validation de Format Couleur
**Objectif**: Valider les formats de couleurs (hex, rgb, hsl)  
**Fichiers**:
- `apps/web/src/lib/theme/color-validation.ts` (nouveau)
- `apps/web/src/lib/theme/__tests__/color-validation.test.ts` (nouveau)

**Tâches**:
- [ ] Fonction `isValidHexColor()`
- [ ] Fonction `isValidRgbColor()`
- [ ] Fonction `isValidHslColor()`
- [ ] Fonction `isValidColor()` (générique)
- [ ] Fonction `normalizeColor()` (convertir vers hex)
- [ ] Tests TypeScript complets
- [ ] Push batch 2

**Score attendu après**: Couleurs 7/10 → 8/10

---

### Batch 3: Validation de Contraste Thème
**Objectif**: Valider les contrastes lors de l'application d'un thème  
**Fichiers**:
- `apps/web/src/lib/theme/theme-validator.ts` (nouveau)
- `apps/web/src/lib/theme/__tests__/theme-validator.test.ts` (nouveau)
- `apps/web/src/lib/theme/apply-theme-config.ts` (modifier)

**Tâches**:
- [ ] Fonction `validateThemeContrasts()`
- [ ] Fonction `getContrastIssues()`
- [ ] Intégrer validation dans `applyThemeConfigDirectly()`
- [ ] Logger warnings si contraste insuffisant
- [ ] Tests TypeScript complets
- [ ] Push batch 3

**Score attendu après**: Contrastes 6/10 → 8/10, Accessibilité 5/10 → 7/10

---

### Batch 4: Ajustement Couleurs par Défaut
**Objectif**: Ajuster les couleurs par défaut pour respecter WCAG AA  
**Fichiers**:
- `apps/web/src/lib/theme/default-theme-config.ts` (modifier)
- `apps/web/src/lib/theme/__tests__/default-theme-config.test.ts` (nouveau)

**Tâches**:
- [ ] Ajuster `warning`: `#d97706` → `#b45309` (Amber 700)
- [ ] Ajuster `success`: `#059669` → `#047857` (Green 700)
- [ ] Vérifier tous les contrastes avec tests
- [ ] Documenter les changements
- [ ] Tests TypeScript complets
- [ ] Push batch 4

**Score attendu après**: Couleurs 8/10 → 9/10, Contrastes 8/10 → 9/10

---

### Batch 5: Mode Sombre - Configuration
**Objectif**: Ajouter support explicite mode sombre  
**Fichiers**:
- `apps/web/src/lib/theme/dark-mode-config.ts` (nouveau)
- `apps/web/src/lib/theme/__tests__/dark-mode-config.test.ts` (nouveau)
- `apps/web/src/lib/theme/default-theme-config.ts` (modifier)

**Tâches**:
- [ ] Créer configuration mode sombre par défaut
- [ ] Fonction `getDarkModeConfig()`
- [ ] Validation contrastes mode sombre
- [ ] Tests TypeScript complets
- [ ] Push batch 5

**Score attendu après**: Couleurs 9/10 → 10/10, Contrastes 9/10 → 10/10

---

### Batch 6: Mode Sombre - Application
**Objectif**: Appliquer mode sombre dynamiquement  
**Fichiers**:
- `apps/web/src/lib/theme/apply-theme-config.ts` (modifier)
- `apps/web/src/lib/theme/global-theme-provider.tsx` (modifier)

**Tâches**:
- [ ] Détection préférence système (prefers-color-scheme)
- [ ] Application automatique mode sombre
- [ ] Variables CSS conditionnelles
- [ ] Tests TypeScript complets
- [ ] Push batch 6

**Score attendu après**: Architecture 9/10 → 10/10

---

### Batch 7: Cache LocalStorage
**Objectif**: Ajouter cache localStorage pour performance  
**Fichiers**:
- `apps/web/src/lib/theme/theme-cache.ts` (nouveau)
- `apps/web/src/lib/theme/__tests__/theme-cache.test.ts` (nouveau)
- `apps/web/src/lib/theme/global-theme-provider.tsx` (modifier)

**Tâches**:
- [ ] Fonction `saveThemeToCache()`
- [ ] Fonction `getThemeFromCache()`
- [ ] Fonction `clearThemeCache()`
- [ ] Intégrer dans GlobalThemeProvider
- [ ] Tests TypeScript complets
- [ ] Push batch 7

**Score attendu après**: Architecture 10/10 (maintenu)

---

### Batch 8: Préchargement Polices
**Objectif**: Précharger les polices pour éviter FOUT  
**Fichiers**:
- `apps/web/src/lib/theme/font-loader.ts` (nouveau)
- `apps/web/src/lib/theme/__tests__/font-loader.test.ts` (nouveau)
- `apps/web/src/lib/theme/apply-theme-config.ts` (modifier)

**Tâches**:
- [ ] Fonction `preloadFont()`
- [ ] Fonction `loadFontWithFallback()`
- [ ] Gestion FOUT
- [ ] Tests TypeScript complets
- [ ] Push batch 8

**Score attendu après**: Polices 8/10 → 10/10

---

### Batch 9: Validation Schéma Backend
**Objectif**: Valider schéma thème côté backend  
**Fichiers**:
- `backend/app/schemas/theme.py` (nouveau ou modifier)
- `backend/app/api/v1/endpoints/themes.py` (modifier)

**Tâches**:
- [ ] Schéma Pydantic pour validation config
- [ ] Validation format couleurs
- [ ] Validation contrastes (optionnel, warning)
- [ ] Tests Python complets
- [ ] Push batch 9

**Score attendu après**: Architecture 10/10 (maintenu)

---

### Batch 10: Tests d'Accessibilité Automatisés
**Objectif**: Tests automatisés accessibilité avec axe-core  
**Fichiers**:
- `apps/web/src/lib/theme/__tests__/accessibility.test.ts` (nouveau)
- `apps/web/.storybook/a11y.config.ts` (modifier)

**Tâches**:
- [ ] Tests contrastes tous les thèmes par défaut
- [ ] Tests axe-core dans Storybook
- [ ] Tests E2E accessibilité
- [ ] Tests TypeScript complets
- [ ] Push batch 10

**Score attendu après**: Accessibilité 7/10 → 10/10

---

### Batch 11: Documentation Complète
**Objectif**: Documentation complète du système  
**Fichiers**:
- `docs/WCAG_CONTRAST_GUIDE.md` (nouveau)
- `docs/THEME_SYSTEM_GUIDE.md` (nouveau)
- `apps/web/src/lib/theme/README.md` (nouveau)

**Tâches**:
- [ ] Guide WCAG contrastes
- [ ] Guide système de thème complet
- [ ] Exemples combinaisons valides
- [ ] Outils recommandés
- [ ] Push batch 11

**Score attendu après**: Documentation complète (tous scores maintenus à 10/10)

---

## 📝 Suivi de Progression

**Batch actuel**: Batch 1 - Fondations - Calcul de Contraste  
**Statut**: ✅ EN COURS  
**Dernière mise à jour**: 27 décembre 2025

### Historique des Batches

| Batch | Nom | Statut | Date | Commit |
|-------|-----|--------|------|--------|
| 1 | Fondations - Calcul de Contraste | ✅ COMPLÉTÉ | 2025-12-27 | feat(theme): add contrast calculation utilities (batch 1) |
| 2 | Validation de Format Couleur | ✅ COMPLÉTÉ | 2025-12-27 | feat(theme): add color format validation (batch 2) |
| 3 | Validation de Contraste Thème | 🔄 EN COURS | 2025-12-27 | - |
| 3 | Validation de Contraste Thème | ⏳ EN ATTENTE | - | - |
| 4 | Ajustement Couleurs par Défaut | ⏳ EN ATTENTE | - | - |
| 5 | Mode Sombre - Configuration | ⏳ EN ATTENTE | - | - |
| 6 | Mode Sombre - Application | ⏳ EN ATTENTE | - | - |
| 7 | Cache LocalStorage | ⏳ EN ATTENTE | - | - |
| 8 | Préchargement Polices | ⏳ EN ATTENTE | - | - |
| 9 | Validation Schéma Backend | ⏳ EN ATTENTE | - | - |
| 10 | Tests d'Accessibilité Automatisés | ⏳ EN ATTENTE | - | - |
| 11 | Documentation Complète | ⏳ EN ATTENTE | - | - |

---

## 🎯 Score Final Attendu

- **Architecture**: 10/10 ⭐⭐⭐⭐⭐
- **Couleurs**: 10/10 ⭐⭐⭐⭐⭐
- **Polices**: 10/10 ⭐⭐⭐⭐⭐
- **Contrastes**: 10/10 ⭐⭐⭐⭐⭐
- **Accessibilité**: 10/10 ⭐⭐⭐⭐⭐

**Score Global Final : 10/10** ⭐⭐⭐⭐⭐

---

## 📋 Checklist Générale

- [ ] Tous les batches complétés
- [ ] Tous les tests TypeScript passent
- [ ] Tous les tests Python passent (backend)
- [ ] Documentation complète
- [ ] Score 10/10 atteint
- [ ] Revue de code effectuée

---

**Note**: Ce document sera mis à jour après chaque batch pour suivre la progression.

