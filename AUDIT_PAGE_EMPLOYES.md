# Audit de la Page Employés

**Date**: 2025-01-27  
**Page**: `/fr/dashboard/management/employes`  
**Fichier**: `apps/web/src/app/[locale]/dashboard/management/employes/page.tsx`

## 📋 Résumé Exécutif

La page employés a été refactorisée avec une nouvelle UI moderne. Cependant, plusieurs fonctionnalités existantes dans le backend et l'API ne sont pas implémentées dans l'interface, notamment l'édition d'employés, l'import/export, et plusieurs données importantes ne sont pas affichées ou utilisées.

---

## 🔴 Problèmes Critiques

### 1. **Pas de Fonctionnalité d'Édition d'Employé**
**Problème**: Impossible d'éditer un employé existant depuis la liste.

**Code concerné**: 
- Page liste : Pas de bouton "Éditer" ou modal d'édition
- Seul le bouton "Supprimer" est disponible dans les actions

**Impact**: 
- Impossible de modifier les informations d'un employé après création
- Doit être fait manuellement via API ou base de données

**Recommandation**: 
- Ajouter un bouton "Éditer" dans les actions de chaque carte
- Créer un modal/formulaire d'édition utilisant `useUpdateEmployee()` hook
- Permettre la modification de tous les champs disponibles

**API disponible**: ✅ `employeesAPI.update()` existe et fonctionne  
**Hook disponible**: ✅ `useUpdateEmployee()` existe mais jamais utilisé

---

### 2. **Filtres Non Fonctionnels**
**Problème**: Les filtres par statut et département ne fonctionnent pas car les champs ne sont pas disponibles dans l'interface TypeScript.

**Code concerné**: 
```typescript
// Ligne 73-75
// status and department are not available in Employee interface
const matchesStatus = statusFilter === 'all';
const matchesDepartment = departmentFilter === 'all';
```

**Impact**: 
- Les filtres "Actifs", "En vacances", "Inactifs" ne filtrent rien
- Le filtre par département ne fonctionne pas
- Tous les employés sont affichés peu importe les filtres

**Recommandation**: 
- Ajouter les champs `status` et `department` à l'interface `Employee` dans `apps/web/src/lib/api/employees.ts`
- Implémenter le filtrage réel basé sur ces champs
- Vérifier que le backend retourne ces champs

---

### 3. **Statistiques Hardcodées**
**Problème**: Les statistiques "En vacances" et "Salaire moyen" sont hardcodées à 0.

**Code concerné**: 
```typescript
// Ligne 85-87
// status and salary are not available in Employee interface
const active = total; // All employees are considered active
const onVacation = 0;
const avgSalary = 0;
```

**Impact**: 
- Statistiques incorrectes affichées
- Impossible de suivre les employés en vacances
- Salaire moyen toujours à $0

**Recommandation**: 
- Ajouter les champs `status` et `salary` à l'interface `Employee`
- Calculer les statistiques réelles depuis les données
- Filtrer les employés en vacances basé sur le statut ou les dates de vacances

---

### 4. **Route de Création Non Fonctionnelle**
**Problème**: Le bouton "Nouvel employé" redirige vers `/dashboard/management/employes/new` qui n'existe probablement pas.

**Code concerné**: 
```typescript
// Ligne 145, 294
onClick={() => router.push('/dashboard/management/employes/new')}
```

**Impact**: 
- Erreur 404 lors du clic sur "Nouvel employé"
- Impossible de créer un employé depuis cette page

**Recommandation**: 
- Vérifier la route correcte (probablement `/${locale}/dashboard/management/employes/new`)
- Créer la page de création si elle n'existe pas
- Ou ajouter un modal de création directement sur la page liste

---

### 5. **Navigation Vers Détails Incorrecte**
**Problème**: La fonction `handleView` redirige vers `/dashboard/management/employes/${id}` au lieu de la route locale.

**Code concerné**: 
```typescript
// Ligne 111-113
const handleView = (id: number) => {
  router.push(`/dashboard/management/employes/${id}`);
};
```

**Impact**: 
- Route incorrecte (manque le préfixe `/fr`)
- Erreur 404 lors du clic sur un employé

**Recommandation**: 
- Utiliser `/${locale}/dashboard/management/employes/${id}` ou la route correcte
- Vérifier que la page de détails existe

---

## ⚠️ Fonctionnalités Manquantes

### 6. **Pas d'Import/Export d'Employés**
**Problème**: L'API a des endpoints d'import/export qui ne sont pas utilisés dans l'interface.

**Endpoints disponibles**:
- `POST /v1/employes/employees/import` - Import depuis Excel/ZIP
- `GET /v1/employes/employees/export` - Export vers Excel
- `employeesAPI.downloadTemplate()` - Télécharger template
- `employeesAPI.downloadZipTemplate()` - Télécharger template ZIP

**Impact**: 
- Impossible d'importer des employés en masse
- Impossible d'exporter pour analyse externe
- Pas de rapports exportables

**Recommandation**: 
- Ajouter bouton "Importer" dans le header
- Ajouter bouton "Exporter" dans le header
- Modal d'import avec upload de fichier Excel/ZIP
- Utiliser `employeesAPI.import()` et `employeesAPI.export()`

---

### 7. **Données Manquantes dans l'Interface TypeScript**
**Problème**: Plusieurs champs disponibles dans le modèle backend ne sont pas dans l'interface TypeScript.

**Champs manquants dans l'interface `Employee`**:
- `status` - Statut de l'employé (ACTIVE, INACTIVE, ON_LEAVE, TERMINATED)
- `department` - Département
- `job_title` - Titre du poste
- `employee_type` - Type d'employé (FULL_TIME, PART_TIME, CONTRACTOR, INTERN)
- `salary` - Salaire
- `hourly_rate` - Taux horaire
- `employee_number` - Numéro d'employé
- `birth_date` - Date de naissance
- `linkedin_url` - URL LinkedIn
- `address`, `city`, `postal_code`, `country` - Adresse
- `notes` - Notes
- `termination_date` - Date de fin d'emploi
- `manager_id` - ID du manager

**Impact**: 
- Impossible d'afficher ces informations
- Impossible de filtrer/trier par ces champs
- Données importantes cachées

**Recommandation**: 
- Mettre à jour l'interface `Employee` dans `apps/web/src/lib/api/employees.ts`
- Ajouter tous les champs disponibles dans le modèle backend
- Afficher ces informations dans les cartes et la vue liste

---

### 8. **Pas de Tri des Employés**
**Problème**: Les employés sont affichés dans l'ordre de récupération de l'API.

**Impact**: 
- Pas de tri par nom, date d'embauche, département, salaire, etc.
- Difficile de trouver des employés spécifiques

**Recommandation**: 
- Ajouter un tri par colonnes (nom, date d'embauche, département, salaire)
- Permettre le tri ascendant/descendant
- Sauvegarder les préférences de tri

---

### 9. **Données Non Affichées**
**Problème**: Plusieurs champs disponibles ne sont pas affichés dans les cartes.

**Champs non affichés**:
- `job_title` - Titre du poste
- `department` - Département
- `employee_type` - Type d'employé
- `salary` ou `hourly_rate` - Rémunération
- `employee_number` - Numéro d'employé
- `birth_date` - Date de naissance
- `linkedin_url` - LinkedIn
- `team_id` - Équipe

**Impact**: 
- Informations importantes cachées
- Contexte limité sur chaque employé

**Recommandation**: 
- Afficher le titre du poste et le département dans les cartes
- Afficher le type d'employé et la rémunération
- Afficher le numéro d'employé
- Ajouter les liens LinkedIn

---

### 10. **Filtres Avancés Non Utilisés**
**Problème**: Plusieurs champs disponibles ne sont pas utilisés pour filtrer.

**Champs disponibles mais non filtrés**:
- `employee_type` - Type d'employé
- `team_id` - Équipe
- `job_title` - Titre du poste
- `hire_date` - Date d'embauche (par année)

**Impact**: 
- Difficile de trouver des employés spécifiques
- Pas de filtrage par type, équipe, titre, ou année d'embauche

**Recommandation**: 
- Ajouter des filtres pour type d'employé, équipe, titre
- Ajouter filtre par année d'embauche
- Utiliser les données déjà disponibles dans le modèle Employee

---

## 🔗 Connexions API Non Utilisées

### 11. **Hook useUpdateEmployee Non Utilisé**
**Problème**: Le hook `useUpdateEmployee()` existe mais n'est jamais importé ou utilisé.

**Code disponible**: 
```typescript
// apps/web/src/lib/query/employees.ts ligne 97-108
export function useUpdateEmployee() { ... }
```

**Impact**: 
- Fonctionnalité d'édition complètement absente
- Code disponible mais non connecté

**Recommandation**: 
- Importer et utiliser `useUpdateEmployee()` dans la page
- Créer un modal d'édition avec formulaire

---

### 12. **Hook useCreateEmployee Non Utilisé**
**Problème**: Le hook `useCreateEmployee()` existe mais n'est jamais importé ou utilisé.

**Code disponible**: 
```typescript
// apps/web/src/lib/query/employees.ts ligne 82-92
export function useCreateEmployee() { ... }
```

**Impact**: 
- Création d'employé non fonctionnelle depuis cette page
- Code disponible mais non connecté

**Recommandation**: 
- Importer et utiliser `useCreateEmployee()` dans la page
- Créer un modal de création avec formulaire

---

### 13. **Fonctionnalités d'Import/Export Non Utilisées**
**Problème**: L'API a des méthodes d'import/export complètes qui ne sont pas utilisées.

**Méthodes disponibles**:
- `employeesAPI.import()` - Import depuis Excel/ZIP
- `employeesAPI.export()` - Export vers Excel
- `employeesAPI.downloadTemplate()` - Télécharger template
- `employeesAPI.downloadZipTemplate()` - Télécharger template ZIP

**Impact**: 
- Fonctionnalités backend complètes mais inaccessibles depuis l'UI
- Pas de gestion de masse des employés

**Recommandation**: 
- Implémenter l'import/export dans l'interface
- Ajouter les boutons et modals nécessaires

---

### 14. **Fonctionnalités de Liaison Non Utilisées**
**Problème**: L'API a des méthodes pour lier/délier un employé à un compte utilisateur qui ne sont pas utilisées.

**Méthodes disponibles**:
- `employeesAPI.linkToUser()` - Lier un employé à un utilisateur
- `employeesAPI.unlinkFromUser()` - Délier un employé d'un utilisateur

**Impact**: 
- Impossible de gérer les liens employé-utilisateur depuis l'interface
- Fonctionnalité backend disponible mais inaccessible

**Recommandation**: 
- Ajouter une action pour lier/délier un employé à un utilisateur
- Afficher le statut de liaison dans les cartes

---

## 📊 Données Manquantes dans l'Affichage

### 15. **Titre du Poste Non Affiché**
**Problème**: Le champ `job_title` n'est pas affiché dans les cartes.

**Impact**: 
- Impossible de voir le titre du poste sans ouvrir les détails
- Informations importantes cachées

**Recommandation**: 
- Afficher le titre du poste dans les cartes
- Afficher le titre dans la vue liste

---

### 16. **Département Non Affiché**
**Problème**: Le champ `department` n'est pas affiché dans les cartes.

**Impact**: 
- Impossible de voir le département sans ouvrir les détails
- Organisation difficile

**Recommandation**: 
- Afficher le département dans les cartes
- Utiliser pour le filtrage

---

### 17. **Rémunération Non Affichée**
**Problème**: Les champs `salary` et `hourly_rate` ne sont jamais affichés.

**Impact**: 
- Impossible de voir la rémunération
- Statistiques de salaire moyen incorrectes

**Recommandation**: 
- Afficher le salaire ou taux horaire dans les cartes (si autorisé)
- Calculer et afficher le salaire moyen réel

---

### 18. **Type d'Employé Non Affiché**
**Problème**: Le champ `employee_type` n'est pas affiché.

**Impact**: 
- Impossible de distinguer les types d'employés (temps plein, temps partiel, contractuel, stagiaire)
- Pas de filtrage par type

**Recommandation**: 
- Afficher le type d'employé avec un badge
- Ajouter un filtre par type

---

## 🎨 Améliorations UX Suggérées

### 19. **Actions Rapides sur les Cartes**
**Problème**: Seulement "Voir", "Portail" et "Supprimer" sont disponibles.

**Recommandation**: 
- Ajouter bouton "Éditer" sur chaque carte
- Ajouter menu contextuel (clic droit)
- Actions : Éditer, Lier utilisateur, Voir détails, Supprimer

---

### 20. **Indicateurs Visuels**
**Problème**: Pas d'indicateurs visuels pour les employés importants.

**Recommandation**: 
- Badge "Manager" pour les employés avec des subordonnés
- Badge "Nouveau" pour les employés récemment embauchés
- Badge selon le type d'employé
- Couleur de bordure selon le statut

---

### 21. **Vue d'Ensemble Améliorée**
**Problème**: Les statistiques sont basiques.

**Recommandation**: 
- Ajouter graphiques (répartition par département, type, statut)
- Afficher les employés par département avec statistiques
- Timeline des embauches
- Métriques de rétention

---

## ✅ Fonctionnalités Bien Implémentées

1. ✅ **Liste des employés** - Fonctionne correctement avec React Query
2. ✅ **Suppression d'employé** - Avec confirmation, fonctionne bien
3. ✅ **Recherche** - Fonctionnelle (nom, email)
4. ✅ **Vue Grid/List** - Basculement fonctionnel
5. ✅ **Statistiques de base** - Total employés fonctionne
6. ✅ **Affichage photo** - Avec fallback sur initiales
7. ✅ **Lien vers portail** - Fonctionnel
8. ✅ **UI moderne et responsive** - Bien fait

---

## 📝 Plan d'Action Recommandé

### Priorité HAUTE
1. **Mettre à jour l'interface Employee** - Ajouter tous les champs manquants (status, department, job_title, salary, etc.)
2. **Corriger la route de création** - Créer la page ou utiliser un modal
3. **Corriger la navigation vers détails** - Utiliser la bonne route avec locale
4. **Ajouter fonctionnalité d'édition** - Modal avec formulaire utilisant `useUpdateEmployee()`
5. **Implémenter les filtres** - Faire fonctionner les filtres par statut et département

### Priorité MOYENNE
6. **Ajouter import/export** - Boutons et modals pour import/export Excel
7. **Ajouter filtres avancés** - Type d'employé, équipe, titre, année d'embauche
8. **Ajouter tri** - Par nom, date d'embauche, département, salaire
9. **Afficher données manquantes** - Titre, département, rémunération, type, etc.
10. **Calculer statistiques réelles** - En vacances, salaire moyen basés sur les données

### Priorité BASSE
11. **Ajouter actions rapides** - Menu contextuel, liaison utilisateur
12. **Ajouter indicateurs visuels** - Badges pour managers, nouveaux employés, etc.
13. **Ajouter statistiques avancées** - Graphiques, tendances, métriques
14. **Améliorer l'affichage** - Plus d'informations dans les cartes

---

## 🔧 Modifications Nécessaires

### 1. Mise à Jour de l'Interface Employee

**Fichier**: `apps/web/src/lib/api/employees.ts`

Ajouter les champs suivants à l'interface `Employee`:
```typescript
export interface Employee {
  // ... champs existants ...
  status?: 'active' | 'inactive' | 'on_leave' | 'terminated' | null;
  department?: string | null;
  job_title?: string | null;
  employee_type?: 'full_time' | 'part_time' | 'contractor' | 'intern' | null;
  employee_number?: string | null;
  salary?: number | null;
  hourly_rate?: number | null;
  birth_date?: string | null;
  linkedin_url?: string | null;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
  country?: string | null;
  notes?: string | null;
  termination_date?: string | null;
  manager_id?: number | null;
}
```

### 2. Vérification Backend

Vérifier que le backend retourne bien tous ces champs dans la réponse de l'API `/v1/employes/employees`.

---

## 📌 Conclusion

La page a une belle interface et les fonctionnalités de base fonctionnent bien (liste, recherche, suppression, vue grid/list). Cependant, il manque plusieurs fonctionnalités essentielles :
- **Édition** d'employé (absente)
- **Import/Export** (non utilisés)
- **Filtres** (non fonctionnels car champs manquants dans l'interface)
- **Statistiques** (hardcodées à 0)
- **Tri** (absent)
- **Route de création** (non fonctionnelle)
- **Données manquantes** (beaucoup de champs non affichés)

Les connexions API de base fonctionnent (liste, récupération, suppression), mais les fonctionnalités CRUD complètes ne sont pas toutes implémentées dans l'interface. Les hooks React Query sont bien configurés mais pas tous utilisés. L'interface TypeScript `Employee` doit être mise à jour pour inclure tous les champs disponibles dans le modèle backend.
