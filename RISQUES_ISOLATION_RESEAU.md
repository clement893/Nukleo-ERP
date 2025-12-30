# Analyse des Risques - Isolation du Module Réseau

**Date**: 30 décembre 2025  
**Objectif**: Évaluer les risques de casser des fonctionnalités lors de l'isolation du module réseau

---

## ⚠️ RISQUES IDENTIFIÉS

### 🔴 Risques Critiques

#### 1. **Rupture des Imports dans le Module Commercial**
**Risque**: Si on modifie les composants commerciaux, le module commercial pourrait casser

**Fichiers concernés**:
- `apps/web/src/app/[locale]/dashboard/commercial/contacts/page.tsx`
- `apps/web/src/app/[locale]/dashboard/commercial/contacts/[id]/page.tsx`
- `apps/web/src/app/[locale]/dashboard/commercial/contacts/[id]/edit/page.tsx`
- `apps/web/src/app/[locale]/dashboard/commercial/entreprises/[id]/page.tsx`

**Probabilité**: 🔴 **ÉLEVÉE** si on modifie directement les composants commerciaux  
**Impact**: 🔴 **CRITIQUE** - Le module commercial ne fonctionnerait plus

#### 2. **Rupture de l'API Backend**
**Risque**: Si on change les endpoints API, les deux modules pourraient casser

**Fichiers concernés**:
- `backend/app/api/v1/endpoints/commercial/contacts.py`
- Tous les appels API dans les deux modules

**Probabilité**: 🟡 **MOYENNE** si on crée de nouveaux endpoints sans maintenir les anciens  
**Impact**: 🔴 **CRITIQUE** - Aucun des deux modules ne fonctionnerait

#### 3. **Problèmes de Cache React Query**
**Risque**: Si on change les clés de cache, les données pourraient être invalides

**Fichiers concernés**:
- `apps/web/src/lib/query/contacts.ts`
- Tous les hooks React Query utilisés

**Probabilité**: 🟡 **MOYENNE**  
**Impact**: 🟡 **MOYEN** - Problèmes de synchronisation des données

---

### 🟡 Risques Modérés

#### 4. **Duplication de Code**
**Risque**: Si on duplique les composants, maintenance difficile

**Probabilité**: 🟡 **MOYENNE**  
**Impact**: 🟡 **MOYEN** - Code dupliqué à maintenir

#### 5. **Incohérence entre Modules**
**Risque**: Si les deux modules évoluent différemment, incohérence UX

**Probabilité**: 🟢 **FAIBLE**  
**Impact**: 🟡 **MOYEN** - Expérience utilisateur dégradée

---

## ✅ STRATÉGIE DE MIGRATION SÉCURISÉE

### Approche Recommandée: **Migration Progressive avec Wrappers**

Cette approche permet d'isoler progressivement sans casser l'existant.

---

## 📋 PLAN D'ACTION PAR PHASES

### Phase 0: Préparation (Sans Risque) ⏱️ 30 min

#### 1. Créer un dossier pour les composants réseau
```bash
mkdir -p apps/web/src/components/reseau
```

#### 2. Créer un fichier d'index pour les exports
```typescript
// apps/web/src/components/reseau/index.ts
// Vide pour l'instant, sera rempli progressivement
```

**Risque**: ✅ **AUCUN** - Création de fichiers vides

---

### Phase 1: Création de Wrappers (Risque Minimal) ⏱️ 1-2h

#### 1. Créer des wrappers qui réexportent les composants commerciaux

**Stratégie**: Créer des fichiers wrapper qui importent et réexportent les composants commerciaux. Cela permet:
- ✅ De créer un namespace séparé pour le réseau
- ✅ De ne rien casser (les composants commerciaux restent intacts)
- ✅ De pouvoir modifier progressivement sans impact

**Exemple**:
```typescript
// apps/web/src/components/reseau/ContactsGallery.tsx
/**
 * ContactsGallery pour le module réseau
 * Wrapper autour du composant commercial
 */
export { ContactsGallery as default } from '@/components/commercial/ContactsGallery';
```

**Fichiers à créer**:
- `apps/web/src/components/reseau/ContactsGallery.tsx`
- `apps/web/src/components/reseau/ContactForm.tsx`
- `apps/web/src/components/reseau/ContactDetail.tsx`
- `apps/web/src/components/reseau/ContactAvatar.tsx`
- `apps/web/src/components/reseau/FilterBadges.tsx`
- `apps/web/src/components/reseau/ContactCounter.tsx`
- `apps/web/src/components/reseau/ViewModeToggle.tsx`
- `apps/web/src/components/reseau/ContactActionLink.tsx`
- `apps/web/src/components/reseau/ContactRowActions.tsx`
- `apps/web/src/components/reseau/MultiSelectFilter.tsx`
- `apps/web/src/components/reseau/CompanyDetail.tsx`

**Risque**: ✅ **MINIMAL** - Simple réexport, aucun changement fonctionnel

#### 2. Mettre à jour les imports dans les pages réseau

**Stratégie**: Changer progressivement les imports, un fichier à la fois

**Exemple**:
```typescript
// AVANT (apps/web/src/app/[locale]/dashboard/reseau/contacts/page.tsx)
import ContactsGallery from '@/components/commercial/ContactsGallery';

// APRÈS
import ContactsGallery from '@/components/reseau/ContactsGallery';
```

**Fichiers à modifier**:
- `apps/web/src/app/[locale]/dashboard/reseau/contacts/page.tsx`
- `apps/web/src/app/[locale]/dashboard/reseau/contacts/[id]/page.tsx`
- `apps/web/src/app/[locale]/dashboard/reseau/contacts/[id]/edit/page.tsx`
- `apps/web/src/app/[locale]/dashboard/reseau/entreprises/[id]/page.tsx`

**Risque**: ✅ **MINIMAL** - Les wrappers pointent vers les mêmes composants

**Test après chaque changement**:
```bash
# Vérifier que la page réseau fonctionne toujours
npm run dev
# Tester manuellement: http://localhost:3000/fr/dashboard/reseau/contacts
```

---

### Phase 2: Création du Client API Réseau (Risque Faible) ⏱️ 1h

#### 1. Créer un nouveau client API qui pointe vers les mêmes endpoints

**Stratégie**: Créer un nouveau client API qui utilise les mêmes endpoints commerciaux pour l'instant. Cela permet:
- ✅ De créer un namespace séparé
- ✅ De ne rien casser (les endpoints commerciaux restent intacts)
- ✅ De pouvoir changer les endpoints progressivement

**Exemple**:
```typescript
// apps/web/src/lib/api/reseau-contacts.ts
import { apiClient } from './client';
import { extractApiData } from './utils';
import type { Contact, ContactCreate, ContactUpdate } from './contacts';

/**
 * Contacts API pour le module réseau
 * Pour l'instant, utilise les mêmes endpoints commerciaux
 * TODO: Migrer vers /v1/reseau/contacts quand les endpoints seront créés
 */
export const reseauContactsAPI = {
  list: async (skip = 0, limit = 100): Promise<Contact[]> => {
    // Utilise temporairement les endpoints commerciaux
    const response = await apiClient.get<Contact[]>('/v1/commercial/contacts', {
      params: { skip, limit, _t: Date.now() },
    });
    const data = extractApiData<Contact[] | { items: Contact[] }>(response);
    // ... même logique que contactsAPI
  },
  // ... autres méthodes identiques à contactsAPI
};
```

**Risque**: ✅ **FAIBLE** - Nouveau fichier, aucun impact sur l'existant

#### 2. Créer des hooks React Query dédiés

**Stratégie**: Créer de nouveaux hooks avec des clés de cache séparées

```typescript
// apps/web/src/lib/query/reseau-contacts.ts
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { reseauContactsAPI, type ContactCreate, type ContactUpdate } from '@/lib/api/reseau-contacts';

// Clés de cache séparées pour éviter les conflits
export const reseauContactKeys = {
  all: ['reseau-contacts'] as const,
  lists: () => [...reseauContactKeys.all, 'list'] as const,
  // ...
};

// Hooks identiques mais avec clés de cache différentes
export function useReseauContacts(...) {
  return useQuery({
    queryKey: reseauContactKeys.list(...),
    queryFn: () => reseauContactsAPI.list(...),
    // ...
  });
}
```

**Risque**: ✅ **FAIBLE** - Nouveaux hooks, cache séparé, aucun impact sur l'existant

#### 3. Mettre à jour progressivement les pages réseau

**Stratégie**: Remplacer `contactsAPI` par `reseauContactsAPI` et les hooks correspondants

**Risque**: ✅ **FAIBLE** - Les deux APIs pointent vers les mêmes endpoints pour l'instant

---

### Phase 3: Création des Endpoints Backend (Risque Modéré) ⏱️ 2-3h

#### Option A: Endpoints Alias (Recommandé - Risque Minimal)

**Stratégie**: Créer des endpoints réseau qui appellent les endpoints commerciaux en interne

```python
# backend/app/api/v1/endpoints/reseau/contacts.py
from fastapi import APIRouter, Depends
from app.dependencies import get_current_user
from app.api.v1.endpoints.commercial import contacts as commercial_contacts

router = APIRouter(prefix="/reseau/contacts", tags=["reseau-contacts"])

# Réutiliser les mêmes fonctions
router.get("/")(commercial_contacts.list_contacts)
router.get("/{contact_id}")(commercial_contacts.get_contact)
router.post("/")(commercial_contacts.create_contact)
# ...
```

**Avantages**:
- ✅ Risque minimal - Réutilise la même logique
- ✅ Pas de duplication de code
- ✅ Isolation des URLs

**Risque**: ✅ **MINIMAL** - Simple redirection

#### Option B: Endpoints Séparés (Risque Modéré)

**Stratégie**: Créer de nouveaux endpoints qui utilisent les mêmes modèles mais avec une logique séparée

**Risque**: 🟡 **MODÉRÉ** - Nécessite de tester que la logique est identique

---

### Phase 4: Migration Complète (Risque Faible si phases précédentes OK)

Une fois que tout fonctionne avec les wrappers et les nouveaux clients API:

1. ✅ Tester que le module commercial fonctionne toujours
2. ✅ Tester que le module réseau fonctionne avec les nouveaux wrappers
3. ✅ Mettre à jour le client API réseau pour pointer vers les nouveaux endpoints
4. ✅ Tester à nouveau

**Risque**: ✅ **FAIBLE** si les phases précédentes sont validées

---

## 🛡️ MESURES DE SÉCURITÉ

### 1. Tests Avant/Après Chaque Phase

**Checklist de test**:
- [ ] Le module commercial fonctionne toujours (`/dashboard/commercial/contacts`)
- [ ] Le module réseau fonctionne toujours (`/dashboard/reseau/contacts`)
- [ ] Les deux modules peuvent créer/modifier/supprimer des contacts
- [ ] Les deux modules affichent les mêmes données
- [ ] Pas d'erreurs dans la console
- [ ] Pas d'erreurs dans les logs backend

### 2. Git Strategy

**Recommandation**: Une branche par phase avec possibilité de rollback

```bash
# Phase 1: Wrappers
git checkout -b feature/reseau-isolation-phase1-wrappers
# ... commits ...
git push origin feature/reseau-isolation-phase1-wrappers

# Phase 2: API Client
git checkout -b feature/reseau-isolation-phase2-api
# ... commits ...
git push origin feature/reseau-isolation-phase2-api

# etc.
```

**Avantage**: Possibilité de rollback à chaque phase si problème

### 3. Feature Flags (Optionnel)

Si vous utilisez des feature flags, vous pourriez activer/désactiver la nouvelle isolation:

```typescript
const useReseauIsolation = featureFlags.isEnabled('reseau-isolation');

const ContactsAPI = useReseauIsolation ? reseauContactsAPI : contactsAPI;
```

**Risque**: ✅ **AUCUN** - Permet de basculer facilement

---

## 📊 MATRICE DES RISQUES

| Phase | Risque | Probabilité | Impact | Mitigation |
|-------|--------|-------------|--------|------------|
| Phase 0: Préparation | ✅ Aucun | 0% | - | Création de fichiers vides |
| Phase 1: Wrappers | ✅ Minimal | 5% | Faible | Tests après chaque changement |
| Phase 2: API Client | ✅ Faible | 10% | Faible | Nouveaux fichiers, endpoints identiques |
| Phase 3: Endpoints Backend | 🟡 Modéré | 20% | Moyen | Option A (alias) recommandée |
| Phase 4: Migration | ✅ Faible | 5% | Faible | Si phases précédentes OK |

---

## ✅ CONCLUSION

**Risque Global**: 🟢 **FAIBLE à MODÉRÉ** avec l'approche progressive recommandée

**Recommandation**: 
1. ✅ Procéder avec l'approche par wrappers (Phase 1)
2. ✅ Tester après chaque changement
3. ✅ Utiliser Git branches pour faciliter le rollback
4. ✅ Ne pas modifier les composants commerciaux existants
5. ✅ Créer de nouveaux fichiers plutôt que modifier les existants

**Temps estimé total**: 4-6 heures de développement + tests

**Avantage principal**: Isolation progressive sans casser l'existant

---

## 🚨 SIGNALEMENT DE PROBLÈMES

Si vous rencontrez un problème lors de la migration:

1. **Arrêter immédiatement** les changements
2. **Rollback** vers la dernière version fonctionnelle
3. **Identifier** le problème spécifique
4. **Tester** dans un environnement isolé avant de continuer

---

**Document créé par**: Assistant IA  
**Dernière mise à jour**: 30 décembre 2025
