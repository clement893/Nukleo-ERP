# Audit de la Page Projets

**Date**: 2025-01-27  
**Page**: `/fr/dashboard/projets/projets`  
**Fichier**: `apps/web/src/app/[locale]/dashboard/projets/projets/page.tsx`

## 📋 Résumé Exécutif

La page projets a été refactorisée avec une nouvelle UI moderne. Cependant, plusieurs fonctionnalités existantes dans le backend et l'API ne sont pas implémentées dans l'interface, notamment l'édition de projets, l'import/export, et plusieurs données importantes ne sont pas affichées.

---

## 🔴 Problèmes Critiques

### 1. **Pas de Fonctionnalité d'Édition de Projet**
**Problème**: Impossible d'éditer un projet existant depuis la liste.

**Code concerné**: 
- Page liste : Pas de bouton "Éditer" ou modal d'édition
- Seul le bouton "Supprimer" est disponible dans les actions

**Impact**: 
- Impossible de modifier les informations d'un projet après création
- Doit être fait manuellement via API ou base de données

**Recommandation**: 
- Ajouter un bouton "Éditer" dans les actions de chaque carte
- Créer un modal/formulaire d'édition utilisant `useUpdateProject()` hook
- Permettre la modification de tous les champs disponibles

**API disponible**: ✅ `projectsAPI.update()` existe et fonctionne

---

### 2. **Données de Progression Non Affichées**
**Problème**: Le champ `progress` est hardcodé à 0 et n'est jamais calculé ou récupéré.

**Code concerné**: 
```typescript
// Ligne 312 et 405
const progress = 0; // progress is not available in Project interface, using 0 as default
```

**Impact**: 
- La barre de progression affiche toujours 0%
- Impossible de suivre l'avancement réel des projets
- Information importante cachée

**Recommandation**: 
- Vérifier si le backend retourne un champ `progress` ou `completion_percentage`
- Si non disponible, calculer le progress basé sur les tâches complétées
- Afficher la progression réelle dans les cartes et la vue liste

---

### 3. **Données de Dépenses Non Affichées**
**Problème**: Le champ `spent` (dépenses) est hardcodé à 0 et n'est jamais calculé.

**Code concerné**: 
```typescript
// Ligne 78, 315
const totalSpent = 0; // spent is not available in Project interface
const spent = 0; // spent is not available in Project interface
```

**Impact**: 
- La statistique "Dépenses" affiche toujours $0
- Impossible de suivre les coûts réels des projets
- Budget vs dépenses non comparables

**Recommandation**: 
- Vérifier si le backend retourne un champ `spent`, `actual_cost`, ou `budget_used`
- Si non disponible, calculer basé sur les feuilles de temps et dépenses liées
- Afficher les dépenses réelles dans les statistiques et cartes

---

### 4. **Route de Création Non Fonctionnelle**
**Problème**: Le bouton "Nouveau projet" redirige vers `/dashboard/projets/projets/new` qui n'existe pas.

**Code concerné**: 
```typescript
// Ligne 136, 302
onClick={() => router.push('/dashboard/projets/projets/new')}
```

**Impact**: 
- Erreur 404 lors du clic sur "Nouveau projet"
- Impossible de créer un projet depuis cette page

**Recommandation**: 
- Vérifier la route correcte (probablement `/fr/dashboard/projets/projets/new`)
- Créer la page de création si elle n'existe pas
- Ou ajouter un modal de création directement sur la page liste

---

## ⚠️ Fonctionnalités Manquantes

### 5. **Statut "En Pause" Non Filtré**
**Problème**: Le statut `ON_HOLD` est défini dans `statusConfig` mais n'apparaît pas dans les filtres.

**Code concerné**: 
```typescript
// Ligne 37
ON_HOLD: { label: 'En pause', color: 'bg-orange-500/10 text-orange-600 border-orange-500/30', icon: Target },
// Mais pas de bouton de filtre pour ON_HOLD (lignes 244-268)
```

**Impact**: 
- Les projets en pause ne peuvent pas être filtrés
- Incohérence entre les statuts disponibles et les filtres

**Recommandation**: 
- Ajouter un bouton de filtre "En pause" dans la barre de filtres
- S'assurer que le statut est bien géré dans le backend

---

### 6. **Pas d'Import/Export de Projets**
**Problème**: L'API a des endpoints d'import/export qui ne sont pas utilisés dans l'interface.

**Endpoints disponibles**:
- `POST /v1/projects/import` - Import depuis Excel/ZIP
- `GET /v1/projects/export` - Export vers Excel
- `projectsAPI.downloadTemplate()` - Télécharger template

**Impact**: 
- Impossible d'importer des projets en masse
- Impossible d'exporter pour analyse externe
- Pas de rapports exportables

**Recommandation**: 
- Ajouter bouton "Importer" dans le header
- Ajouter bouton "Exporter" dans le header
- Modal d'import avec upload de fichier Excel/ZIP
- Utiliser `projectsAPI.import()` et `projectsAPI.export()`

---

### 7. **Filtres Avancés Non Utilisés**
**Problème**: Plusieurs champs disponibles dans le modèle ne sont pas utilisés pour filtrer.

**Champs disponibles mais non filtrés**:
- `equipe` - Équipe du projet
- `etape` - Étape du projet
- `annee_realisation` - Année de réalisation
- `client_id` - Client
- `responsable_id` - Responsable

**Impact**: 
- Difficile de trouver des projets spécifiques
- Pas de filtrage par équipe, étape, année, client, ou responsable

**Recommandation**: 
- Ajouter des filtres pour équipe, étape, année
- Ajouter filtre par client (dropdown)
- Ajouter filtre par responsable (dropdown)
- Utiliser les données déjà disponibles dans le modèle Project

---

### 8. **Pas de Tri des Projets**
**Problème**: Les projets sont affichés dans l'ordre de récupération de l'API.

**Impact**: 
- Pas de tri par nom, date, budget, statut, etc.
- Difficile de prioriser les projets

**Recommandation**: 
- Ajouter un tri par colonnes (nom, date de création, budget, statut)
- Permettre le tri ascendant/descendant
- Sauvegarder les préférences de tri

---

### 9. **Navigation Vers Détails Incorrecte**
**Problème**: La fonction `handleView` redirige vers `/dashboard/projets/${id}` au lieu de la route locale.

**Code concerné**: 
```typescript
// Ligne 102-104
const handleView = (id: number) => {
  router.push(`/dashboard/projets/${id}`);
};
```

**Impact**: 
- Route incorrecte (manque le préfixe `/fr` et le chemin complet)
- Erreur 404 lors du clic sur un projet

**Recommandation**: 
- Utiliser `/${locale}/dashboard/projets/projets/${id}` ou la route correcte
- Vérifier que la page de détails existe

---

### 10. **Données Manquantes dans l'Affichage**
**Problème**: Plusieurs champs disponibles ne sont pas affichés dans les cartes.

**Champs non affichés**:
- `etape` - Étape du projet
- `annee_realisation` - Année de réalisation
- `contact` - Contact
- `proposal_url`, `drive_url`, `slack_url`, `echeancier_url` - Liens
- `temoignage_status`, `portfolio_status` - Statuts
- `start_date` - Date de début

**Impact**: 
- Informations importantes cachées
- Contexte limité sur chaque projet

**Recommandation**: 
- Afficher l'étape et l'année dans les cartes
- Ajouter les liens dans une section dédiée
- Afficher les dates de début et fin
- Afficher les statuts de témoignage et portfolio

---

## 🔗 Connexions API Non Utilisées

### 11. **Hook useUpdateProject Non Utilisé**
**Problème**: Le hook `useUpdateProject()` existe mais n'est jamais importé ou utilisé.

**Code disponible**: 
```typescript
// apps/web/src/lib/query/projects.ts ligne 111-127
export function useUpdateProject() { ... }
```

**Impact**: 
- Fonctionnalité d'édition complètement absente
- Code disponible mais non connecté

**Recommandation**: 
- Importer et utiliser `useUpdateProject()` dans la page
- Créer un modal d'édition avec formulaire

---

### 12. **Fonctionnalités d'Import/Export Non Utilisées**
**Problème**: L'API a des méthodes d'import/export complètes qui ne sont pas utilisées.

**Méthodes disponibles**:
- `projectsAPI.import()` - Import depuis Excel/ZIP
- `projectsAPI.export()` - Export vers Excel
- `projectsAPI.downloadTemplate()` - Télécharger template
- `projectsAPI.downloadZipTemplate()` - Télécharger template ZIP

**Impact**: 
- Fonctionnalités backend complètes mais inaccessibles depuis l'UI
- Pas de gestion de masse des projets

**Recommandation**: 
- Implémenter l'import/export dans l'interface
- Ajouter les boutons et modals nécessaires

---

## 📊 Données Manquantes dans l'Affichage

### 13. **Description Non Affichée**
**Problème**: Le champ `description` n'est pas affiché dans les cartes de projet.

**Impact**: 
- Impossible de voir la description sans ouvrir les détails
- Informations importantes cachées

**Recommandation**: 
- Afficher la description (tronquée) dans les cartes
- Afficher la description complète dans la vue liste

---

### 14. **Liens Non Affichés**
**Problème**: Les champs `proposal_url`, `drive_url`, `slack_url`, `echeancier_url` ne sont jamais affichés.

**Impact**: 
- Accès difficile aux ressources liées au projet
- Liens importants cachés

**Recommandation**: 
- Ajouter une section "Liens" dans chaque carte
- Afficher les icônes avec liens cliquables
- Permettre l'édition des liens depuis le modal d'édition

---

## 🎨 Améliorations UX Suggérées

### 15. **Actions Rapides sur les Cartes**
**Problème**: Seulement "Voir" et "Supprimer" sont disponibles.

**Recommandation**: 
- Ajouter bouton "Éditer" sur chaque carte
- Ajouter menu contextuel (clic droit)
- Actions : Éditer, Dupliquer, Archiver, Voir détails

---

### 16. **Indicateurs Visuels**
**Problème**: Pas d'indicateurs visuels pour les projets importants.

**Recommandation**: 
- Badge "Urgent" pour les projets avec deadline proche
- Badge "Dépassé budget" pour les projets avec dépenses > budget
- Badge "En retard" pour les projets avec deadline passée
- Couleur de bordure selon le statut

---

### 17. **Vue d'Ensemble Améliorée**
**Problème**: Les statistiques sont basiques.

**Recommandation**: 
- Ajouter graphiques (répartition par statut, tendances)
- Afficher les projets par étape avec statistiques
- Timeline des projets
- Métriques de performance (taux de complétion moyen, etc.)

---

## ✅ Fonctionnalités Bien Implémentées

1. ✅ **Liste des projets** - Fonctionne correctement avec React Query
2. ✅ **Suppression de projet** - Avec confirmation, fonctionne bien
3. ✅ **Recherche** - Fonctionnelle
4. ✅ **Filtres par statut** - ACTIVE, COMPLETED, ARCHIVED fonctionnent
5. ✅ **Vue Grid/List** - Basculement fonctionnel
6. ✅ **Statistiques de base** - Total, actifs, terminés, archivés, budget
7. ✅ **UI moderne et responsive** - Bien fait

---

## 📝 Plan d'Action Recommandé

### Priorité HAUTE
1. **Corriger la route de création** - Créer la page `/fr/dashboard/projets/projets/new` ou utiliser un modal
2. **Corriger la navigation vers détails** - Utiliser la bonne route avec locale
3. **Ajouter fonctionnalité d'édition** - Modal avec formulaire utilisant `useUpdateProject()`
4. **Afficher progression réelle** - Calculer ou récupérer depuis le backend
5. **Afficher dépenses réelles** - Calculer ou récupérer depuis le backend

### Priorité MOYENNE
6. **Ajouter import/export** - Boutons et modals pour import/export Excel
7. **Ajouter filtres avancés** - Équipe, étape, année, client, responsable
8. **Ajouter tri** - Par nom, date, budget, statut
9. **Afficher données manquantes** - Description, liens, dates, étape, année
10. **Ajouter filtre "En pause"** - Bouton de filtre pour ON_HOLD

### Priorité BASSE
11. **Ajouter actions rapides** - Menu contextuel, duplication, archivage rapide
12. **Ajouter indicateurs visuels** - Badges pour projets urgents, en retard, etc.
13. **Ajouter statistiques avancées** - Graphiques, tendances, métriques
14. **Améliorer l'affichage** - Plus d'informations dans les cartes

---

## 🔧 Modifications Backend Nécessaires (si données manquantes)

Si les champs suivants n'existent pas, ils devraient être ajoutés :

1. **Progression**:
   - Ajouter champ `progress` ou `completion_percentage` dans le modèle Project
   - Calculer basé sur les tâches complétées ou permettre mise à jour manuelle

2. **Dépenses**:
   - Ajouter champ `spent`, `actual_cost`, ou `budget_used` dans le modèle Project
   - Calculer basé sur les feuilles de temps et dépenses liées

3. **Statut ON_HOLD**:
   - Vérifier que le statut est bien géré dans le backend
   - S'assurer que l'enum ProjectStatus inclut ON_HOLD

---

## 📌 Conclusion

La page a une belle interface et les fonctionnalités de base fonctionnent bien (liste, recherche, filtres basiques, suppression). Cependant, il manque plusieurs fonctionnalités essentielles :
- **Édition** de projet (absente)
- **Import/Export** (non utilisés)
- **Données de progression et dépenses** (hardcodées à 0)
- **Filtres avancés** (équipe, étape, année, client, responsable)
- **Tri** (absent)
- **Route de création** (non fonctionnelle)

Les connexions API de base fonctionnent (liste, récupération, suppression), mais les fonctionnalités CRUD complètes ne sont pas toutes implémentées dans l'interface. Les hooks React Query sont bien configurés mais pas tous utilisés.
