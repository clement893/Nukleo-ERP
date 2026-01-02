# Audit de la page Entreprises - Module Réseau

**URL**: `/fr/dashboard/reseau/entreprises`  
**Date**: 2024  
**Contexte**: Audit après refactor UI

## Résumé exécutif

La page Entreprises du module Réseau présente plusieurs fonctionnalités non implémentées et des connexions non fonctionnelles identifiées après le refactor UI. Certaines fonctionnalités sont partiellement implémentées mais non connectées, tandis que d'autres routes référencées n'existent pas.

---

## 🔴 Problèmes critiques

### 1. Page d'édition manquante

**Problème**: La page de détail (`/dashboard/reseau/entreprises/[id]/page.tsx`) référence une route d'édition qui n'existe pas.

**Localisation**: 
- `apps/web/src/app/[locale]/dashboard/reseau/entreprises/[id]/page.tsx` (ligne 58)
- `apps/web/src/components/commercial/CompanyDetail.tsx` (ligne 70)

**Code concerné**:
```typescript
const handleEdit = () => {
  if (company) {
    const locale = params?.locale as string || 'fr';
    router.push(`/${locale}/dashboard/reseau/entreprises/${company.id}/edit`);
  }
};
```

**Impact**: 
- Le bouton "Modifier" dans la page de détail redirige vers une route 404
- Impossible d'éditer une entreprise depuis le module Réseau
- Fonctionnalité critique non fonctionnelle

**Solution recommandée**: 
Créer la page d'édition à `apps/web/src/app/[locale]/dashboard/reseau/entreprises/[id]/edit/page.tsx` similaire à la structure utilisée dans le module Commercial.

---

### 2. Statistique "Revenu total" non fonctionnelle

**Problème**: La carte statistique "Revenu total" affiche toujours 0 CAD car le calcul n'est pas implémenté.

**Localisation**: 
- `apps/web/src/app/[locale]/dashboard/reseau/entreprises/page.tsx` (lignes 66, 177)

**Code concerné**:
```typescript
const stats = useMemo(() => {
  const total = companies.length;
  const clients = companies.filter(c => c.is_client).length;
  const prospects = companies.filter(c => !c.is_client).length;
  const totalRevenue = 0; // Revenue not available in Company interface
  
  return { total, clients, prospects, totalRevenue };
}, [companies]);
```

**Impact**: 
- Statistique trompeuse pour l'utilisateur
- Information financière importante non disponible
- Interface incomplète

**Solution recommandée**: 
- Option 1: Supprimer la carte si le revenu n'est pas disponible dans ce contexte
- Option 2: Implémenter un endpoint API pour calculer le revenu total des entreprises clientes
- Option 3: Ajouter un champ `revenue` dans l'interface `Company` et le calculer depuis les projets/factures

---

## 🟡 Problèmes modérés

### 3. Formulaire de création incomplet

**Problème**: Le `CompanyForm` dans le modal de création ne reçoit pas la liste des entreprises parentes (`parentCompanies`).

**Localisation**: 
- `apps/web/src/app/[locale]/dashboard/reseau/entreprises/page.tsx` (ligne 403)

**Code concerné**:
```typescript
<CompanyForm
  onSubmit={async () => {
    setShowCreateModal(false);
    showToast({ message: 'Entreprise créée avec succès', type: 'success' });
  }}
  onCancel={() => setShowCreateModal(false)}
/>
```

**Impact**: 
- Impossible de sélectionner une entreprise parente lors de la création
- Fonctionnalité partiellement désactivée
- Expérience utilisateur incomplète

**Solution recommandée**: 
Charger la liste des entreprises et la passer au formulaire :
```typescript
const { data: companiesData } = useInfiniteCompanies(1000);
const parentCompanies = useMemo(() => 
  companiesData?.pages.flat().map(c => ({ id: c.id, name: c.name })) || [],
  [companiesData]
);

<CompanyForm
  parentCompanies={parentCompanies}
  // ...
/>
```

---

### 4. Cache React Query non invalidé après création

**Problème**: Après la création d'une entreprise, le cache React Query n'est pas invalidé, donc la nouvelle entreprise n'apparaît pas immédiatement dans la liste.

**Localisation**: 
- `apps/web/src/app/[locale]/dashboard/reseau/entreprises/page.tsx` (lignes 404-407)

**Code concerné**:
```typescript
<CompanyForm
  onSubmit={async () => {
    setShowCreateModal(false);
    showToast({ message: 'Entreprise créée avec succès', type: 'success' });
  }}
  // ...
/>
```

**Impact**: 
- L'utilisateur doit rafraîchir manuellement la page pour voir la nouvelle entreprise
- Mauvaise expérience utilisateur
- Incohérence des données affichées

**Solution recommandée**: 
Utiliser le hook `useCreateCompany` qui gère automatiquement l'invalidation du cache :
```typescript
const createCompanyMutation = useCreateCompany();

<CompanyForm
  onSubmit={async (data) => {
    try {
      await createCompanyMutation.mutateAsync(data);
      setShowCreateModal(false);
      showToast({ message: 'Entreprise créée avec succès', type: 'success' });
    } catch (error) {
      showToast({ message: 'Erreur lors de la création', type: 'error' });
    }
  }}
  // ...
/>
```

---

### 5. Gestion d'erreur manquante dans le formulaire

**Problème**: Le `CompanyForm` ne gère pas les erreurs de soumission (validation backend, erreurs réseau, etc.).

**Localisation**: 
- `apps/web/src/components/commercial/CompanyForm.tsx` (ligne 102)

**Code concerné**:
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!formData.name.trim()) {
    showToast({
      message: 'Le nom de l\'entreprise est requis',
      type: 'error',
    });
    return;
  }

  await onSubmit(formData);
};
```

**Impact**: 
- Les erreurs backend ne sont pas affichées à l'utilisateur
- Pas de feedback en cas d'échec de création/modification
- Expérience utilisateur dégradée

**Solution recommandée**: 
Ajouter un try/catch dans `handleSubmit` ou gérer les erreurs dans le composant parent qui appelle `onSubmit`.

---

## 🟢 Améliorations suggérées

### 6. Pagination infinie non utilisée

**Problème**: Le hook `useInfiniteCompanies` est utilisé mais la pagination infinie n'est pas implémentée dans l'UI (pas de bouton "Charger plus").

**Localisation**: 
- `apps/web/src/app/[locale]/dashboard/reseau/entreprises/page.tsx` (ligne 39)

**Impact**: 
- Toutes les entreprises sont chargées d'un coup (limite à 1000)
- Performance dégradée avec beaucoup d'entreprises
- Pas d'optimisation de chargement

**Solution recommandée**: 
Implémenter un bouton "Charger plus" ou un scroll infini pour utiliser la pagination infinie.

---

### 7. Filtres de recherche limités

**Problème**: La recherche ne filtre que sur `name` et `description`, mais l'API backend supporte aussi la recherche sur `email` et `website`.

**Localisation**: 
- `apps/web/src/app/[locale]/dashboard/reseau/entreprises/page.tsx` (lignes 47-59)

**Code concerné**:
```typescript
const filteredCompanies = useMemo(() => {
  return companies.filter((company) => {
    const matchesSearch = !searchQuery || 
      company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (company.description && company.description.toLowerCase().includes(searchQuery.toLowerCase()));
    // ...
  });
}, [companies, searchQuery, filterType]);
```

**Impact**: 
- Recherche moins efficace que possible
- Fonctionnalité backend non exploitée

**Solution recommandée**: 
Utiliser le paramètre `search` de l'API au lieu de filtrer côté client :
```typescript
const { data, isLoading } = useInfiniteCompanies(1000, {
  search: searchQuery || undefined,
  is_client: filterType === 'all' ? undefined : filterType === 'client',
});
```

---

## ✅ Fonctionnalités fonctionnelles

Les fonctionnalités suivantes sont correctement implémentées :

1. ✅ Affichage de la liste des entreprises (vue grille et liste)
2. ✅ Filtrage par type (Tous/Clients/Prospects)
3. ✅ Recherche par nom/description
4. ✅ Suppression d'entreprise
5. ✅ Navigation vers la page de détail
6. ✅ Affichage des statistiques (Total, Clients, Prospects)
7. ✅ Affichage des logos d'entreprises
8. ✅ Connexion API backend fonctionnelle (`/v1/commercial/companies`)
9. ✅ Gestion des erreurs de chargement
10. ✅ Affichage d'un état vide quand aucune entreprise

---

## 📋 Checklist de correction

- [ ] Créer la page d'édition `/dashboard/reseau/entreprises/[id]/edit/page.tsx`
- [ ] Implémenter ou supprimer la statistique "Revenu total"
- [ ] Passer `parentCompanies` au `CompanyForm` dans le modal de création
- [ ] Utiliser `useCreateCompany` pour invalider le cache après création
- [ ] Ajouter la gestion d'erreur dans le formulaire de création
- [ ] Implémenter la pagination infinie dans l'UI
- [ ] Utiliser le paramètre `search` de l'API au lieu du filtrage client

---

## 🔗 Fichiers concernés

### Frontend
- `apps/web/src/app/[locale]/dashboard/reseau/entreprises/page.tsx`
- `apps/web/src/app/[locale]/dashboard/reseau/entreprises/[id]/page.tsx`
- `apps/web/src/components/commercial/CompanyForm.tsx`
- `apps/web/src/components/commercial/CompanyDetail.tsx`
- `apps/web/src/lib/query/companies.ts`
- `apps/web/src/lib/api/companies.ts`

### Backend
- `backend/app/api/v1/endpoints/commercial/companies.py` ✅ (fonctionnel)

---

## Notes techniques

- L'API backend est fonctionnelle et complète
- Les hooks React Query sont correctement implémentés
- Le problème principal est au niveau de l'intégration UI/UX
- La page d'édition manquante est le problème le plus critique

---

**Priorité de correction recommandée**:
1. 🔴 Page d'édition manquante (critique)
2. 🔴 Statistique revenu total (critique)
3. 🟡 Cache non invalidé après création (modéré)
4. 🟡 Formulaire incomplet (modéré)
5. 🟢 Améliorations suggérées (optionnel)
