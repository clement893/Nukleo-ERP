# Phase 2B - État Actuel des Pages Dashboard

**Date :** 2025-01-27  
**Status :** 🔴 Non commencée

---

## 📊 État des Occurrences par Section

### ✅ Phase 2A - COMPLÉTÉE
- Composants réutilisables : **Terminé**

### 🔴 Phase 2B - À FAIRE

#### 1. Dashboard Commercial
**Occurrences :** 66 matches across 7 files

**Fichiers à corriger :**
- ✅ `commercial/page.tsx` - **17 occurrences** - ⚠️ **Partiellement corrigé** (certaines utilisent déjà `bg-primary-500`)
  - `bg-[#EF4444]`, `text-[#EF4444]` → `bg-danger-500`, `text-danger-500`
  - `bg-[#10B981]`, `text-[#10B981]` → `bg-secondary-500`, `text-secondary-500`
  - `bg-[#F59E0B]`, `text-[#F59E0B]` → `bg-warning-500`, `text-warning-500`
  - `hover:border-[#523DC9]` → `hover:border-primary-500`

- ❌ `commercial/opportunites/page.tsx` - **6 occurrences**
- ❌ `commercial/opportunites/[id]/page.tsx` - **1 occurrence**
- ❌ `commercial/pipeline-client/page.tsx` - **7 occurrences**
- ❌ `commercial/pipeline-client/[id]/page.tsx` - **13 occurrences** (fichier avec le plus d'occurrences)
- ❌ `commercial/soumissions/page.tsx` - **10 occurrences**
- ❌ `commercial/soumissions/page-old2.tsx` - **12 occurrences** (fichier old, à ignorer ?)

**État :** ⚠️ **Partiellement commencé** - `commercial/page.tsx` a quelques tokens mais beaucoup de couleurs hardcodées restent

---

#### 2. Dashboard Projets
**Occurrences :** 37 matches across 4 files

**Fichiers à corriger :**
- ❌ `projets/projets/page.tsx` - **9 occurrences**
- ❌ `projets/clients/page.tsx` - **18 occurrences** (fichier avec beaucoup d'occurrences)
- ❌ `projets/clients/[id]/page.tsx` - **1 occurrence**
- ❌ `projets/equipes/page.tsx` - **9 occurrences**

**État :** ❌ **Non commencé**

---

#### 3. Dashboard Management
**Occurrences :** 99 matches across 5 files

**Fichiers à corriger :**
- ❌ `management/page.tsx` - **26 occurrences**
- ❌ `management/employes/page.tsx` - **6 occurrences**
- ❌ `management/vacances/page.tsx` - **14 occurrences**
- ❌ `management/onboarding/page.tsx` - **28 occurrences**
- ❌ `management/feuilles-temps/page.tsx` - **25 occurrences**

**État :** ❌ **Non commencé**

---

#### 4. Dashboard Réseau
**Occurrences :** À vérifier (estimé ~50)

**Fichiers à corriger :**
- ❌ `reseau/page.tsx`
- ❌ `reseau/entreprises/page.tsx`
- ❌ `reseau/contacts/page.tsx`
- ❌ `reseau/contacts/[id]/page.tsx`
- ❌ `reseau/temoignages/page.tsx`

**État :** ❌ **Non commencé**

---

#### 5. Dashboard Finances
**Occurrences :** À vérifier (estimé ~30)

**Fichiers à corriger :**
- ❌ `finances/page.tsx`
- ❌ `finances/tresorerie/page.tsx`
- ❌ `finances/compte-depenses/page.tsx`
- ❌ `finances/rapport/page.tsx`
- ❌ `finances/facturations/page.tsx`

**État :** ❌ **Non commencé**

---

#### 6. Dashboard Autres Sections
**Occurrences :** À vérifier (estimé ~100)

**Sections :**
- Admin (users, teams)
- Agenda (calendrier, deadlines, evenements)
- LEO
- Autres pages diverses

**État :** ❌ **Non commencé**

---

## 🎯 Plan d'Action Recommandé

### Ordre de Priorité

1. **Dashboard Commercial** (66 occurrences)
   - Commencer par `commercial/page.tsx` (compléter la correction partielle)
   - Puis `pipeline-client/[id]/page.tsx` (13 occurrences - fichier critique)

2. **Dashboard Management** (99 occurrences)
   - Commencer par `management/onboarding/page.tsx` (28 occurrences)
   - Puis `management/page.tsx` (26 occurrences)
   - Puis `management/feuilles-temps/page.tsx` (25 occurrences)

3. **Dashboard Projets** (37 occurrences)
   - Commencer par `projets/clients/page.tsx` (18 occurrences)
   - Puis les autres fichiers

4. **Dashboard Réseau** (~50 occurrences estimées)

5. **Dashboard Finances** (~30 occurrences estimées)

6. **Dashboard Autres Sections** (~100 occurrences estimées)

---

## 📝 Patterns Identifiés dans `commercial/page.tsx`

### Patterns à Remplacer :

```tsx
// ❌ AVANT
bg-[#EF4444]/10 border border-[#EF4444]/30
text-[#EF4444]
bg-[#EF4444] text-white

// ✅ APRÈS
bg-danger-500/10 border border-danger-500/30
text-danger-500
bg-danger-500 text-white
```

```tsx
// ❌ AVANT
bg-[#10B981]/10 border border-[#10B981]/30
text-[#10B981]

// ✅ APRÈS
bg-secondary-500/10 border border-secondary-500/30
text-secondary-500
```

```tsx
// ❌ AVANT
bg-[#F59E0B]/10 border border-[#F59E0B]/30
text-[#F59E0B]

// ✅ APRÈS
bg-warning-500/10 border border-warning-500/30
text-warning-500
```

```tsx
// ❌ AVANT
hover:border-[#523DC9]/30
style={{ fontFamily: 'Space Grotesk, sans-serif' }}

// ✅ APRÈS
hover:border-primary-500/30
className="font-nukleo" // Si disponible, sinon garder style inline
```

---

## ⚠️ Notes Importantes

1. **Fichier partiellement corrigé** : `commercial/page.tsx` utilise déjà `bg-primary-500` à certains endroits, mais beaucoup de couleurs hardcodées restent.

2. **Fichier old** : `commercial/soumissions/page-old2.tsx` peut être ignoré si c'est un ancien fichier.

3. **Priorité** : Commencer par les fichiers avec le plus d'occurrences pour maximiser l'impact.

4. **Patterns récurrents** : Les mêmes patterns se répètent, on peut créer des remplacements par lots.

---

## 🚀 Prochaine Étape Recommandée

Commencer par compléter la correction de `commercial/page.tsx` puis continuer avec les autres fichiers du Dashboard Commercial.
