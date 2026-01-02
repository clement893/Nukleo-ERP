# Audit de la Page Vacances

**Date**: 2025-01-27  
**Page**: `/dashboard/management/vacances`  
**URL Production**: https://modeleweb-production-f341.up.railway.app/fr/dashboard/management/vacances

## 📋 Résumé Exécutif

Après analyse du code de la page des vacances et comparaison avec l'API backend disponible, plusieurs fonctionnalités existantes ne sont pas implémentées dans l'interface utilisateur, et certaines connexions sont non fonctionnelles.

---

## ❌ Fonctionnalités API Non Implémentées

### 1. **Création de Demande de Vacances (CRITIQUE)**

**Problème**: Le bouton "Nouvelle demande" ne fait rien (ligne 194).

**Code actuel**:
```typescript
<Button 
  className="bg-white text-[#523DC9] hover:bg-white/90"
  onClick={() => {}}  // ❌ Fonction vide
>
  <Plus className="w-4 h-4 mr-2" />
  Nouvelle demande
</Button>
```

**Impact**: Les utilisateurs ne peuvent pas créer de nouvelles demandes de vacances depuis cette page.

**API disponible**: 
- `POST /v1/management/vacation-requests` ✅
- Hook `useCreateVacationRequest()` disponible ✅

**Recommandation**: 
- Créer un modal de création avec formulaire
- Champs: employé, date de début, date de fin, raison
- Validation des dates (début < fin, pas dans le passé pour début)
- Utiliser le hook `useCreateVacationRequest()`

---

### 2. **Édition de Demande de Vacances**

**Problème**: Aucune fonctionnalité d'édition n'est disponible dans l'interface.

**Impact**: Les utilisateurs ne peuvent pas modifier leurs demandes en attente.

**API disponible**: 
- `PUT /v1/management/vacation-requests/{request_id}` ✅
- Hook `useUpdateVacationRequest()` disponible ✅
- Backend permet l'édition uniquement pour les demandes "pending" ✅

**Recommandation**: 
- Ajouter un bouton "Modifier" sur les cartes de demandes en attente
- Créer un modal d'édition similaire au modal de création
- Vérifier que le statut est "pending" avant d'autoriser l'édition

---

### 3. **Suppression de Demande de Vacances**

**Problème**: Aucune fonctionnalité de suppression n'est disponible.

**Impact**: Les utilisateurs ne peuvent pas supprimer leurs demandes en attente.

**API disponible**: 
- `DELETE /v1/management/vacation-requests/{request_id}` ✅
- Hook `useDeleteVacationRequest()` disponible ✅
- Backend permet la suppression uniquement pour les demandes "pending" ✅

**Recommandation**: 
- Ajouter un bouton "Supprimer" sur les cartes de demandes en attente
- Demander confirmation avant suppression
- Utiliser le hook `useDeleteVacationRequest()`

---

### 4. **Filtre par Employé**

**Problème**: L'API supporte le paramètre `employee_id` mais la page ne permet pas de filtrer par employé.

**Code actuel** (ligne 102):
```typescript
const { data, isLoading } = useInfiniteVacationRequests({ pageSize: 1000 });
// ❌ Pas de filtre employee_id
```

**Impact**: Les administrateurs ne peuvent pas facilement voir les demandes d'un employé spécifique.

**API disponible**: 
- Paramètre `employee_id` dans `list()` ✅
- Hook supporte `employee_id` ✅

**Recommandation**: 
- Ajouter un filtre "Employé" dans la section des filtres
- Charger la liste des employés pour le filtre
- Utiliser `useInfiniteVacationRequests({ employee_id: selectedEmployeeId })`

---

### 5. **Filtre par Date**

**Problème**: Aucun filtre par date n'est disponible alors que les demandes ont des dates de début et fin.

**Impact**: Impossible de filtrer les demandes par période (ex: vacances en janvier, vacances à venir, etc.).

**Recommandation**: 
- Ajouter des filtres "Date de début" et "Date de fin"
- Filtrer côté client ou ajouter les paramètres dans l'API backend si nécessaire
- Ajouter un filtre rapide "À venir" / "Passées" / "En cours"

---

### 6. **Export des Données**

**Problème**: Aucune fonctionnalité d'export (CSV, Excel) n'est disponible.

**Impact**: Les utilisateurs ne peuvent pas exporter les données pour des rapports externes ou des analyses.

**Recommandation**: 
- Ajouter un bouton "Exporter" qui génère un fichier CSV/Excel
- Inclure toutes les colonnes: employé, dates, raison, statut, approuvé par, etc.
- Exporter avec les filtres appliqués

---

### 7. **Pagination Visible**

**Problème**: La page utilise `useInfiniteVacationRequests` mais il n'y a pas de mécanisme visible pour charger plus de demandes.

**Code actuel** (ligne 102):
```typescript
const { data, isLoading } = useInfiniteVacationRequests({ pageSize: 1000 });
// ❌ Pas de fetchNextPage, hasNextPage visible
```

**Impact**: Les utilisateurs ne peuvent voir que les 1000 premières demandes (limite par défaut).

**Recommandation**: 
- Ajouter un bouton "Charger plus" en bas de la liste
- Afficher le nombre total de demandes chargées
- Utiliser `fetchNextPage()` et `hasNextPage` de `useInfiniteQuery`

---

### 8. **Raison de Rejet**

**Problème**: Lors du rejet d'une demande, aucune raison n'est demandée à l'utilisateur.

**Code actuel** (ligne 153-162):
```typescript
const handleReject = async (id: number) => {
  if (!confirm('Êtes-vous sûr de vouloir rejeter cette demande ?')) return;
  
  try {
    await rejectVacationMutation.mutateAsync({ requestId: id });
    // ❌ Pas de rejection_reason
  }
}
```

**Impact**: Les raisons de rejet ne sont pas enregistrées, ce qui réduit la traçabilité.

**API disponible**: 
- Paramètre `rejection_reason` dans `reject()` ✅
- Backend stocke `rejection_reason` ✅

**Recommandation**: 
- Demander une raison de rejet via un prompt ou un modal
- Passer la raison à `rejectVacationMutation.mutateAsync({ requestId: id, rejectionReason: reason })`
- Afficher la raison de rejet dans la carte si disponible

---

### 9. **Affichage de la Raison de Rejet**

**Problème**: La raison de rejet n'est pas affichée dans l'interface même si elle existe dans les données.

**Code actuel** (ligne 426-429):
```typescript
{vacation.status === 'rejected' && (
  <div className="text-xs text-red-600 dark:text-red-400">
    Rejeté  {/* ❌ Pas de rejection_reason affiché */}
  </div>
)}
```

**Impact**: Les utilisateurs ne peuvent pas voir pourquoi leur demande a été rejetée.

**API disponible**: 
- Champ `rejection_reason` dans `VacationRequest` ✅

**Recommandation**: 
- Afficher `vacation.rejection_reason` si disponible
- Ajouter un tooltip ou une section dédiée pour la raison de rejet

---

### 10. **Vue Détails d'une Demande**

**Problème**: Aucune vue détaillée n'est disponible pour une demande spécifique.

**Impact**: Les utilisateurs ne peuvent pas voir tous les détails d'une demande (dates complètes, raison complète, historique, etc.).

**API disponible**: 
- `GET /v1/management/vacation-requests/{request_id}` ✅
- Hook `useVacationRequest(id)` disponible ✅

**Recommandation**: 
- Ajouter un drawer ou modal de détails
- Permettre de cliquer sur une carte pour voir les détails
- Afficher toutes les informations: dates, raison, statut, approuvé par, dates de création/modification, etc.

---

## ⚠️ Problèmes de Connexion/UX

### 11. **Type de Vacances Non Fonctionnel**

**Problème**: Le code utilise `vacation_type` qui n'existe pas dans le modèle de données.

**Code actuel** (ligne 334-336):
```typescript
// vacation_type doesn't exist in VacationRequest, using 'vacation' as default
const vacationType = 'vacation';
const typeInfo = typeConfig[vacationType];
```

**Impact**: Toutes les demandes sont affichées comme "vacation" même si elles pourraient être de type "sick", "personal", "parental".

**Recommandation**: 
- Soit ajouter le champ `vacation_type` au modèle backend
- Soit retirer cette fonctionnalité de l'UI si elle n'est pas nécessaire

---

### 12. **Recherche Limitée**

**Problème**: La recherche ne fonctionne que sur le nom de l'employé et la raison, pas sur d'autres champs.

**Code actuel** (ligne 115-117):
```typescript
const matchesSearch = !searchQuery || 
  employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
  (vacation.reason && vacation.reason.toLowerCase().includes(searchQuery.toLowerCase()));
```

**Recommandation**: 
- Étendre la recherche pour inclure:
  - Dates (format texte)
  - Statut
  - Email de l'employé
  - Raison de rejet

---

### 13. **Validation Manquante**

**Problème**: Aucune validation n'est visible dans le code actuel (mais le modal de création n'existe pas encore).

**Recommandation**: 
- Valider que la date de début < date de fin
- Valider que la date de début n'est pas dans le passé (ou permettre si nécessaire)
- Valider que les dates ne sont pas vides
- Valider que l'employé est sélectionné

---

### 14. **Affichage des Dates**

**Problème**: Les dates sont affichées en format `fr-CA` qui peut ne pas être optimal.

**Code actuel** (ligne 374-376):
```typescript
{vacation.start_date && new Date(vacation.start_date).toLocaleDateString('fr-CA')}
```

**Recommandation**: 
- Utiliser `fr-FR` pour un format plus lisible
- Ajouter le formatage avec jour de la semaine si nécessaire
- Afficher la durée en jours ouvrés de manière plus visible

---

### 15. **Gestion des Erreurs**

**Problème**: Les gestionnaires d'erreurs affichent des messages génériques.

**Code actuel** (ligne 148-150, 159-161):
```typescript
catch (error) {
  showToast({ message: 'Erreur lors de l\'approbation', type: 'error' });
  // ❌ Pas de détails de l'erreur
}
```

**Recommandation**: 
- Utiliser `handleApiError()` pour obtenir des messages d'erreur détaillés
- Afficher les messages d'erreur spécifiques de l'API

---

## ✅ Fonctionnalités Bien Implémentées

1. ✅ **Affichage de la liste** des demandes avec cartes visuelles
2. ✅ **Filtre par statut** (toutes, approuvées, en attente, rejetées)
3. ✅ **Recherche** par nom d'employé et raison
4. ✅ **Statistiques** (total, approuvées, en attente, rejetées, jours moyens)
5. ✅ **Approbation/Rejet** des demandes en attente
6. ✅ **Calcul des jours ouvrés** entre deux dates
7. ✅ **Affichage des badges de statut** avec couleurs
8. ✅ **Interface responsive** et moderne
9. ✅ **Affichage des informations de l'employé** (nom, avatar)
10. ✅ **Affichage de qui a approuvé** la demande

---

## 🔧 Recommandations Prioritaires

### Priorité HAUTE 🔴
1. **Implémenter la création de demandes** - Fonctionnalité critique manquante
2. **Ajouter le filtre par employé** - Améliore grandement l'utilisabilité pour les admins
3. **Ajouter la raison de rejet** - Important pour la traçabilité
4. **Afficher la raison de rejet** - Important pour l'utilisateur

### Priorité MOYENNE 🟡
5. **Ajouter l'édition de demandes** - Utile pour corriger les erreurs
6. **Ajouter la suppression de demandes** - Utile pour annuler les demandes en attente
7. **Ajouter la pagination visible** - Pour gérer de grandes listes
8. **Ajouter l'export des données** - Fonctionnalité standard attendue
9. **Ajouter la vue détails** - Pour voir toutes les informations

### Priorité BASSE 🟢
10. **Ajouter les filtres par date** - Utile mais moins critique
11. **Améliorer la recherche** - Rechercher dans plus de champs
12. **Corriger le type de vacances** - Soit l'ajouter au backend, soit le retirer de l'UI
13. **Améliorer l'affichage des dates** - Format plus lisible

---

## 📝 Notes Techniques

- L'API backend est complète et fonctionnelle ✅
- Les hooks React Query sont bien implémentés ✅
- Le code utilise `useInfiniteQuery` mais ne l'exploite pas complètement ⚠️
- Les types TypeScript sont bien définis ✅
- Le code est bien structuré et maintenable ✅

---

## 🎯 Conclusion

La page des vacances est fonctionnelle pour l'affichage et l'approbation/rejet de base, mais manque plusieurs fonctionnalités importantes disponibles dans l'API backend, notamment la création de demandes qui est une fonctionnalité critique. Les améliorations suggérées amélioreront significativement l'expérience utilisateur et l'utilité de la page.
