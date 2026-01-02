# Audit - Page Compte de Dépenses

**Date:** 2025-01-27  
**Page:** `/fr/dashboard/finances/compte-depenses`  
**Fichier:** `apps/web/src/app/[locale]/dashboard/finances/compte-depenses/page.tsx`

## Résumé Exécutif

Après le refactor UI, la page des comptes de dépenses affiche correctement les données mais **toutes les fonctionnalités interactives sont non fonctionnelles**. Les boutons existent visuellement mais n'ont pas de handlers onClick connectés aux APIs disponibles.

## 🔴 Fonctionnalités Manquantes

### 1. Création de Compte de Dépenses
- **Bouton:** "Nouveau compte" (ligne 79-82) et "Créer votre premier compte" (ligne 275-278)
- **Problème:** Pas de handler onClick
- **API disponible:** ✅ `expenseAccountsAPI.create()`
- **Composant existant:** ✅ `ExpenseAccountForm.tsx` disponible mais non utilisé
- **Impact:** Impossible de créer de nouveaux comptes de dépenses

### 2. Modification de Compte de Dépenses
- **Bouton:** "Modifier" (ligne 257)
- **Problème:** Pas de handler onClick
- **API disponible:** ✅ `expenseAccountsAPI.update()`
- **Composant existant:** ✅ `ExpenseAccountForm.tsx` disponible mais non utilisé
- **Impact:** Impossible de modifier les comptes en brouillon

### 3. Répondre à une Demande de Clarification
- **Bouton:** "Répondre" (ligne 260-262)
- **Problème:** Pas de handler onClick
- **API disponible:** ✅ `expenseAccountsAPI.respondClarification()`
- **Composant existant:** ✅ Modal de réponse dans `EmployeePortalExpenses.tsx`
- **Impact:** Impossible de répondre aux demandes de clarification

### 4. Voir les Détails d'un Compte
- **Bouton:** "Détails" (ligne 264)
- **Problème:** Pas de handler onClick
- **API disponible:** ✅ `expenseAccountsAPI.get()`
- **Composant existant:** ✅ Modal de détails dans `EmployeePortalExpenses.tsx`
- **Impact:** Impossible de voir les détails complets d'un compte

### 5. Soumettre un Compte pour Validation
- **Bouton:** Non visible dans la page actuelle
- **API disponible:** ✅ `expenseAccountsAPI.submit()`
- **Impact:** Impossible de soumettre un compte en brouillon

### 6. Upload de Pièces Jointes
- **Fonctionnalité:** Absente de la page
- **API disponible:** ✅ `expenseAccountsAPI.uploadAttachment()`
- **Composant existant:** ✅ Gestion des pièces jointes dans `ExpenseAccountForm.tsx`
- **Impact:** Impossible d'ajouter des factures/reçus aux comptes

### 7. Extraction IA depuis Document
- **Fonctionnalité:** Absente de la page
- **API disponible:** ✅ `expenseAccountsAPI.extractFromDocument()`
- **Composant existant:** ✅ Intégré dans `ExpenseAccountForm.tsx`
- **Impact:** Impossible d'utiliser l'extraction automatique depuis images/PDFs

### 8. Suppression de Compte
- **Bouton:** Absent de la page
- **API disponible:** ✅ `expenseAccountsAPI.delete()`
- **Impact:** Impossible de supprimer des comptes

### 9. Actions Admin (Approuver/Rejeter/Demander Clarification)
- **Fonctionnalités:** Absentes de la page
- **APIs disponibles:** 
  - ✅ `expenseAccountsAPI.approve()`
  - ✅ `expenseAccountsAPI.reject()`
  - ✅ `expenseAccountsAPI.requestClarification()`
  - ✅ `expenseAccountsAPI.setUnderReview()`
- **Impact:** Les admins ne peuvent pas gérer les comptes depuis cette page

## 📊 Comparaison avec Composant Existant

Il existe un composant complet `EmployeePortalExpenses.tsx` qui implémente **toutes** ces fonctionnalités:

| Fonctionnalité | Page Actuelle | EmployeePortalExpenses |
|----------------|---------------|------------------------|
| Liste des comptes | ✅ | ✅ |
| Créer un compte | ❌ | ✅ |
| Modifier un compte | ❌ | ✅ |
| Voir détails | ❌ | ✅ |
| Soumettre | ❌ | ✅ |
| Répondre clarification | ❌ | ✅ |
| Upload pièces jointes | ❌ | ✅ |
| Extraction IA | ❌ | ✅ |
| Supprimer | ❌ | ✅ |
| Actions admin | ❌ | ❌ (mais API disponible) |

## 🔌 Connexions API Non Fonctionnelles

Toutes les connexions API suivantes sont **disponibles** mais **non utilisées**:

```typescript
// APIs disponibles dans expenseAccountsAPI:
- list() ✅ (utilisé)
- get() ❌ (non utilisé)
- create() ❌ (non utilisé)
- update() ❌ (non utilisé)
- delete() ❌ (non utilisé)
- submit() ❌ (non utilisé)
- approve() ❌ (non utilisé)
- reject() ❌ (non utilisé)
- requestClarification() ❌ (non utilisé)
- respondClarification() ❌ (non utilisé)
- setUnderReview() ❌ (non utilisé)
- extractFromDocument() ❌ (non utilisé)
- uploadAttachment() ❌ (non utilisé)
```

## 🎯 Recommandations

### Option 1: Réutiliser le Composant Existant (Recommandé)
- Remplacer le contenu de la page par `EmployeePortalExpenses`
- Adapter pour supporter le paramètre `employee_id` de l'URL
- Avantages: Fonctionnalités complètes immédiatement disponibles

### Option 2: Connecter les Boutons Existants
- Ajouter les handlers onClick manquants
- Intégrer `ExpenseAccountForm` dans des modals
- Créer les modals de détails et de réponse
- Avantages: Conserve le design actuel

### Option 3: Hybride
- Garder le design actuel pour la liste
- Utiliser les composants existants pour les modals
- Connecter tous les boutons aux APIs

## 📝 Actions Requises

1. **Urgent:** Connecter le bouton "Nouveau compte" à une modal de création
2. **Urgent:** Connecter le bouton "Modifier" à une modal d'édition
3. **Urgent:** Connecter le bouton "Répondre" à une modal de réponse
4. **Important:** Ajouter une modal de détails avec toutes les informations
5. **Important:** Intégrer l'upload de pièces jointes
6. **Souhaitable:** Ajouter les actions admin (approve/reject/request clarification)
7. **Souhaitable:** Ajouter la fonctionnalité de suppression

## 🔍 Fichiers de Référence

- **Composant complet:** `apps/web/src/components/employes/EmployeePortalExpenses.tsx`
- **Formulaire:** `apps/web/src/components/finances/ExpenseAccountForm.tsx`
- **API Client:** `apps/web/src/lib/api/finances/expenseAccounts.ts`
- **Backend:** `backend/app/api/v1/endpoints/finances/compte_depenses.py`

## ✅ Ce qui Fonctionne

- ✅ Affichage de la liste des comptes de dépenses
- ✅ Filtrage par statut
- ✅ Statistiques (total, approuvé, en attente)
- ✅ Affichage des badges de statut
- ✅ Affichage des informations de base (titre, montant, dates, etc.)
- ✅ Affichage conditionnel des notes de révision/clarification/rejet

## ❌ Ce qui Ne Fonctionne Pas

- ❌ Tous les boutons d'action (créer, modifier, répondre, détails)
- ❌ Aucune interaction utilisateur fonctionnelle
- ❌ Pas de gestion des pièces jointes
- ❌ Pas d'extraction IA
- ❌ Pas d'actions admin
