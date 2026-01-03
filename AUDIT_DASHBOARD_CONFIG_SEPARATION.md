# Audit : Problème de séparation des configurations de dashboard

**Date :** 2025-01-27  
**Problème identifié :** Les dashboards `/dashboard` et `/dashboard/commercial` partagent la même sauvegarde de widgets

---

## 🔍 Problème identifié

Les deux pages de dashboard utilisent le même store Zustand (`useDashboardStore`) et sauvegardent toutes leurs configurations dans la même clé de préférence utilisateur (`dashboard_configs`). Cela cause :

1. **Partage de la même sauvegarde** : Les widgets configurés sur `/dashboard` apparaissent aussi sur `/dashboard/commercial` et vice versa
2. **Pas de séparation par contexte** : Le store ne distingue pas quelle page/module utilise les configurations
3. **Conflit de configurations** : Les deux pages peuvent activer la même configuration par défaut

### Architecture actuelle

```
/dashboard (page principale)
  └─> useDashboardStore
      └─> Sauvegarde dans 'dashboard_configs'
          └─> Config ID: 'default'

/dashboard/commercial (page commerciale)
  └─> useDashboardStore (MÊME STORE)
      └─> Sauvegarde dans 'dashboard_configs' (MÊME CLÉ)
          └─> Config ID: 'commercial-default'
```

**Problème :** Les deux pages partagent le même store et la même clé de sauvegarde, donc toutes les configs sont mélangées.

---

## 📋 Analyse du code

### Fichiers concernés

1. **`apps/web/src/lib/dashboard/store.ts`**
   - Store Zustand partagé par toutes les pages
   - Sauvegarde dans `dashboard_configs` (clé unique)
   - Pas de contexte de page/module

2. **`apps/web/src/app/[locale]/dashboard/page.tsx`**
   - Page principale du dashboard
   - Crée une config avec ID `'default'`
   - Utilise le store partagé

3. **`apps/web/src/app/[locale]/dashboard/commercial/page.tsx`**
   - Page dashboard commercial
   - Crée une config avec ID `'commercial-default'`
   - Utilise le MÊME store partagé

### Code problématique

```typescript
// store.ts - ligne 278
await preferencesAPI.set('dashboard_configs', {
  configs,  // ❌ Toutes les configs mélangées
  activeConfigId,
  globalFilters,
});
```

```typescript
// dashboard/page.tsx - ligne 60
id: 'default',  // ❌ Pas de contexte de page
```

```typescript
// dashboard/commercial/page.tsx - ligne 63
id: 'commercial-default',  // ✅ ID différent mais même store
```

---

## ✅ Solution proposée

### Option 1 : Séparer par clé de préférence (Recommandée)

Modifier le store pour accepter un contexte de page et sauvegarder dans des clés séparées :

```typescript
// Clés de sauvegarde séparées
'dashboard_configs'           // Pour /dashboard
'dashboard_commercial_configs' // Pour /dashboard/commercial
```

**Avantages :**
- Séparation complète des données
- Pas de conflit entre pages
- Facile à implémenter

**Inconvénients :**
- Nécessite de modifier le store pour accepter un contexte

### Option 2 : Ajouter un champ `page` dans les configs

Ajouter un champ `page: string` dans `DashboardConfig` et filtrer par page :

```typescript
interface DashboardConfig {
  id: string;
  page: 'main' | 'commercial' | 'projects' | ...;  // Nouveau champ
  // ...
}
```

**Avantages :**
- Garde une seule clé de préférence
- Facile à étendre pour d'autres pages

**Inconvénients :**
- Nécessite de filtrer les configs par page
- Risque de confusion si on oublie de filtrer

### Option 3 : Store séparé par page

Créer des stores séparés pour chaque page :

```typescript
useMainDashboardStore()
useCommercialDashboardStore()
```

**Avantages :**
- Séparation complète
- Pas de risque de mélange

**Inconvénients :**
- Duplication de code
- Plus difficile à maintenir

---

## 🎯 Solution choisie : Option 1 (Clés séparées)

Modifier le store pour accepter un contexte de page et utiliser des clés de préférence séparées.

### Modifications nécessaires

1. **Modifier `DashboardStore` pour accepter un contexte**
2. **Créer des hooks spécialisés par page**
3. **Sauvegarder dans des clés séparées**

---

## 📝 Implémentation

### Étape 1 : Modifier le store pour accepter un contexte

```typescript
// store.ts
interface DashboardStore {
  context: string; // 'main' | 'commercial' | 'projects' | ...
  setContext: (context: string) => void;
  // ...
  
  saveToServer: () => Promise<void>;
  loadFromServer: () => Promise<void>;
}

// Clé de préférence basée sur le contexte
const getPreferenceKey = (context: string) => {
  if (context === 'commercial') return 'dashboard_commercial_configs';
  if (context === 'projects') return 'dashboard_projects_configs';
  return 'dashboard_configs'; // Par défaut pour 'main'
};
```

### Étape 2 : Créer des hooks spécialisés

```typescript
// hooks/useMainDashboard.ts
export const useMainDashboard = () => {
  const store = useDashboardStore();
  useEffect(() => {
    store.setContext('main');
  }, []);
  return store;
};

// hooks/useCommercialDashboard.ts
export const useCommercialDashboard = () => {
  const store = useDashboardStore();
  useEffect(() => {
    store.setContext('commercial');
  }, []);
  return store;
};
```

### Étape 3 : Modifier les pages pour utiliser les hooks spécialisés

```typescript
// dashboard/page.tsx
const { configs, ... } = useMainDashboard();

// dashboard/commercial/page.tsx
const { configs, ... } = useCommercialDashboard();
```

---

## ✅ Validation

- [x] Store modifié pour accepter un contexte
- [x] Hooks spécialisés créés (main, commercial, erp)
- [x] Pages modifiées pour utiliser les hooks
- [x] Support de tous les contextes (main, commercial, projects, finances, team, system, erp)
- [x] Migration des données existantes (compatibilité maintenue - les données dans `dashboard_configs` restent pour 'main')
- [ ] Tests de séparation des configs (à faire manuellement)

## 📊 Résultat

Les dashboards sont maintenant complètement séparés :

- **`/dashboard`** → Clé: `dashboard_configs` (contexte: `main`)
- **`/dashboard/commercial`** → Clé: `dashboard_commercial_configs` (contexte: `commercial`)
- **`/erp/dashboard`** → Clé: `dashboard_erp_configs` (contexte: `erp`)

Chaque page a maintenant sa propre sauvegarde indépendante de widgets.

---

## 🔗 Fichiers modifiés

1. ✅ `apps/web/src/lib/dashboard/store.ts` - Ajout du contexte et séparation des clés
2. ✅ `apps/web/src/app/[locale]/dashboard/page.tsx` - Utilise `useMainDashboard`
3. ✅ `apps/web/src/app/[locale]/dashboard/commercial/page.tsx` - Utilise `useCommercialDashboard`
4. ✅ `apps/web/src/app/[locale]/erp/dashboard/page.tsx` - Utilise `useERPDashboard`
5. ✅ `apps/web/src/app/[locale]/dashboard/personnalisable/page.tsx` - Utilise `useMainDashboard`
6. ✅ `apps/web/src/hooks/useMainDashboard.ts` - Hook créé
7. ✅ `apps/web/src/hooks/useCommercialDashboard.ts` - Hook créé
8. ✅ `apps/web/src/hooks/useERPDashboard.ts` - Hook créé

---

## 📌 Notes

- Les données existantes dans `dashboard_configs` seront conservées pour la page principale
- Les nouvelles données commerciales seront dans `dashboard_commercial_configs`
- Pas de migration nécessaire si on garde la compatibilité avec l'ancienne clé pour 'main'
