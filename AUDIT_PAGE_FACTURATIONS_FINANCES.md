# Audit de la page Facturations - Module Finances

**URL**: `/fr/dashboard/finances/facturations`  
**Date**: 2024  
**Contexte**: Audit après refactor UI

## Résumé exécutif

La page Facturations du module Finances présente plusieurs problèmes majeurs : elle utilise des données simulées générées à partir des projets au lieu de l'API backend, l'API backend n'est pas implémentée (retourne des TODOs), et plusieurs fonctionnalités critiques sont manquantes (création, édition, envoi, paiements).

---

## 🔴 Problèmes critiques

### 1. Données simulées au lieu de l'API backend

**Problème**: La page génère des factures fictives à partir des projets au lieu d'utiliser l'API backend.

**Localisation**: 
- `apps/web/src/app/[locale]/dashboard/finances/facturations/page.tsx` (lignes 87-179)

**Code concerné**:
```typescript
// ❌ Génération de factures fictives depuis les projets
const loadInvoices = async () => {
  try {
    setLoading(true);
    const projects = await projectsAPI.list(0, 1000);
    
    // Générer des factures depuis les projets avec budget
    const projectsWithBudget = projects.filter(p => p.budget && p.budget > 0);
    
    const generatedInvoices: Invoice[] = projectsWithBudget.map((project, index) => {
      // Simulation complète de factures
      const subtotal = project.budget || 0;
      const taxRate = 14.975; // TPS + TVQ Québec
      // ... génération de données fictives
    });
    
    setInvoices(generatedInvoices);
  }
};
```

**Impact**: 
- Données non persistées dans la base de données
- Pas de synchronisation entre utilisateurs
- Impossible de gérer réellement les factures
- Données perdues au rechargement
- Pas de traçabilité

**Solution recommandée**: 
- Utiliser l'API `/v1/finances/facturations` pour charger les factures réelles
- Créer un client API `facturationsAPI` si nécessaire
- Utiliser React Query pour le cache et la gestion d'état

---

### 2. API backend non implémentée

**Problème**: Les endpoints backend retournent des TODOs et des tableaux vides.

**Localisation**: 
- `backend/app/api/v1/endpoints/finances/facturations.py` (lignes 18-46)

**Code concerné**:
```python
@router.get("/")
async def list_facturations(...):
    """
    List all invoices (facturations)
    TODO: Implement invoice listing logic
    """
    logger.info(f"Listing invoices for user {current_user.id}")
    # TODO: Implement invoice listing
    return []  # ❌ Retourne un tableau vide

@router.get("/{invoice_id}")
async def get_facturation(...):
    """
    Get a specific invoice by ID
    TODO: Implement invoice retrieval logic
    """
    # TODO: Implement invoice retrieval
    return {"id": invoice_id, "message": "Not implemented yet"}  # ❌ Non implémenté
```

**Impact**: 
- API backend complètement non fonctionnelle
- Impossible de récupérer les factures depuis le backend
- Pas de CRUD pour les factures

**Solution recommandée**: 
- Implémenter les endpoints GET, POST, PUT, DELETE pour les factures
- Utiliser le modèle `Invoice` existant (dans `templates/modules/billing/models/invoice.py`)
- Créer les schémas Pydantic nécessaires
- Implémenter la logique métier

---

### 3. Bouton "Nouvelle facture" non fonctionnel

**Problème**: Le bouton "Nouvelle facture" n'a pas d'handler `onClick`.

**Localisation**: 
- `apps/web/src/app/[locale]/dashboard/finances/facturations/page.tsx` (ligne 502)

**Code concerné**:
```typescript
<Button className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm">
  <Plus className="w-4 h-4 mr-2" />
  Nouvelle facture
  {/* ❌ Pas d'onClick handler */}
</Button>
```

**Impact**: 
- Fonctionnalité annoncée mais non disponible
- Impossible de créer une nouvelle facture
- Mauvaise expérience utilisateur

**Solution recommandée**: 
- Créer un modal ou une page de création de facture
- Implémenter le formulaire de création
- Utiliser l'API POST pour créer la facture

---

### 4. Pas de possibilité de créer/modifier/supprimer des factures

**Problème**: Aucune fonctionnalité CRUD n'est disponible.

**Localisation**: 
- `apps/web/src/app/[locale]/dashboard/finances/facturations/page.tsx` (pas de fonctions CRUD)

**Impact**: 
- Impossible de créer des factures
- Impossible de modifier des factures existantes
- Impossible de supprimer des factures
- Gestion complète des factures impossible

**Solution recommandée**: 
- Créer un formulaire de création/édition de facture
- Ajouter des boutons d'édition et de suppression
- Implémenter les mutations React Query pour CRUD

---

### 5. Pas de possibilité d'envoyer des factures

**Problème**: Aucune fonctionnalité pour envoyer des factures par email.

**Localisation**: 
- `apps/web/src/app/[locale]/dashboard/finances/facturations/page.tsx` (pas de fonction d'envoi)

**Impact**: 
- Impossible d'envoyer des factures aux clients
- Processus manuel nécessaire
- Pas d'automatisation

**Solution recommandée**: 
- Ajouter un bouton "Envoyer" sur chaque facture
- Créer un endpoint POST `/v1/finances/facturations/{id}/send`
- Utiliser le service d'email existant

---

### 6. Pas de possibilité d'enregistrer des paiements

**Problème**: Les paiements sont simulés et ne peuvent pas être enregistrés.

**Localisation**: 
- `apps/web/src/app/[locale]/dashboard/finances/facturations/page.tsx` (lignes 104-128, 429-455)

**Code concerné**:
```typescript
// ❌ Paiements simulés
if (project.status === 'COMPLETED') {
  status = 'paid';
  amountPaid = total;
  payments = [{  // ❌ Données fictives
    id: '1',
    date: project.updated_at,
    amount: total,
    method: 'bank_transfer',
    reference: `WIRE-...`
  }];
}
```

**Impact**: 
- Impossible d'enregistrer des paiements réels
- Pas de suivi des paiements
- Données financières incorrectes

**Solution recommandée**: 
- Créer un modèle `Payment` dans la base de données
- Ajouter un endpoint POST `/v1/finances/facturations/{id}/payments`
- Créer un formulaire pour enregistrer les paiements
- Mettre à jour le statut de la facture automatiquement

---

### 7. Pas de connexion avec l'API de facturations

**Problème**: La page utilise `projectsAPI` au lieu d'une API de facturations.

**Localisation**: 
- `apps/web/src/app/[locale]/dashboard/finances/facturations/page.tsx` (ligne 14, 90)

**Code concerné**:
```typescript
import { projectsAPI } from '@/lib/api/projects';  // ❌ Mauvais import

const projects = await projectsAPI.list(0, 1000);  // ❌ Utilise l'API projets
```

**Impact**: 
- Pas d'utilisation de l'API de facturations
- Données incorrectes
- Architecture incohérente

**Solution recommandée**: 
- Créer un client API `facturationsAPI` dans `apps/web/src/lib/api/finances/`
- Utiliser cette API pour toutes les opérations
- Créer des hooks React Query pour les facturations

---

## 🟡 Problèmes modérés

### 8. Pas de pagination

**Problème**: Toutes les factures sont chargées d'un coup (limite à 1000).

**Impact**: 
- Performance dégradée avec beaucoup de factures
- Temps de chargement long

**Solution recommandée**: 
- Implémenter la pagination côté serveur
- Utiliser `useInfiniteQuery` ou pagination classique

---

### 9. Pas d'export des factures

**Problème**: Impossible d'exporter les factures en PDF ou Excel.

**Impact**: 
- Pas de génération de PDF pour les factures
- Pas d'export pour comptabilité
- Processus manuel nécessaire

**Solution recommandée**: 
- Ajouter un bouton "Télécharger PDF" sur chaque facture
- Créer un endpoint GET `/v1/finances/facturations/{id}/pdf`
- Utiliser une bibliothèque de génération PDF (ex: jsPDF, PDFKit)

---

### 10. Pas de filtrage par date ou client

**Problème**: Le filtrage est limité au statut et à la recherche textuelle.

**Impact**: 
- Difficile de trouver des factures par période
- Pas de filtrage par client
- Recherche limitée

**Solution recommandée**: 
- Ajouter des filtres par date (date d'émission, date d'échéance)
- Ajouter un filtre par client
- Utiliser les paramètres de l'API pour le filtrage serveur

---

### 11. Pas de vue calendrier pour les échéances

**Problème**: Pas de vue calendrier pour voir les factures par date d'échéance.

**Impact**: 
- Difficile de voir les échéances à venir
- Pas de vue d'ensemble temporelle

**Solution recommandée**: 
- Ajouter une vue calendrier
- Afficher les factures par date d'échéance
- Mettre en évidence les factures en retard

---

### 12. Pas de rappels automatiques

**Problème**: Pas de système de rappels pour les factures en retard.

**Impact**: 
- Risque d'oublier les factures en retard
- Pas de suivi proactif

**Solution recommandée**: 
- Ajouter un système de rappels automatiques
- Envoyer des emails de rappel
- Créer un endpoint pour envoyer les rappels

---

## 🟢 Améliorations suggérées

### 13. Pas de templates de facture

**Problème**: Pas de possibilité de créer des templates de facture.

**Impact**: 
- Pas de personnalisation
- Réutilisation limitée

**Solution recommandée**: 
- Créer un système de templates
- Permettre la personnalisation du design

---

### 14. Pas de multi-devises

**Problème**: Les montants sont toujours en CAD.

**Impact**: 
- Pas de support pour les clients internationaux
- Limitation géographique

**Solution recommandée**: 
- Ajouter le support multi-devises
- Permettre la sélection de la devise lors de la création

---

### 15. Pas de notes de crédit

**Problème**: Pas de possibilité de créer des notes de crédit.

**Impact**: 
- Gestion des remboursements difficile
- Pas de correction des erreurs

**Solution recommandée**: 
- Créer un type "Note de crédit"
- Permettre la création de notes de crédit liées aux factures

---

## ✅ Fonctionnalités fonctionnelles

Les fonctionnalités suivantes sont correctement implémentées :

1. ✅ Affichage de la liste des factures (mais avec données simulées)
2. ✅ Affichage du détail d'une facture
3. ✅ Calcul et affichage des statistiques (Total, Payé, En attente, En retard)
4. ✅ Filtrage par statut (Toutes, Envoyées, Payées, En retard)
5. ✅ Recherche par numéro, client ou projet
6. ✅ Affichage des informations client
7. ✅ Affichage des dates importantes
8. ✅ Affichage des articles facturés
9. ✅ Affichage de l'historique des paiements (mais simulé)
10. ✅ Calcul des jours de retard
11. ✅ Formatage des montants en CAD
12. ✅ Formatage des dates en français

---

## 📋 Checklist de correction

- [ ] Implémenter l'API backend pour les facturations (GET, POST, PUT, DELETE)
- [ ] Créer le client API frontend `facturationsAPI`
- [ ] Créer les hooks React Query pour les facturations
- [ ] Remplacer les données simulées par des appels API réels
- [ ] Implémenter le bouton "Nouvelle facture" avec modal/formulaire
- [ ] Ajouter la possibilité de créer des factures
- [ ] Ajouter la possibilité de modifier des factures
- [ ] Ajouter la possibilité de supprimer des factures
- [ ] Ajouter la possibilité d'envoyer des factures par email
- [ ] Créer le modèle Payment et endpoints pour les paiements
- [ ] Ajouter la possibilité d'enregistrer des paiements
- [ ] Implémenter la pagination
- [ ] Ajouter l'export PDF
- [ ] Ajouter le filtrage par date et client
- [ ] Ajouter la vue calendrier pour les échéances
- [ ] Ajouter le système de rappels automatiques

---

## 🔗 Fichiers concernés

### Frontend
- `apps/web/src/app/[locale]/dashboard/finances/facturations/page.tsx` ❌ (données simulées)
- `apps/web/src/lib/api/finances/` (à créer - client API)

### Backend
- `backend/app/api/v1/endpoints/finances/facturations.py` ❌ (non implémenté)
- `backend/app/models/invoice.py` (existe dans templates, à vérifier)
- `backend/app/schemas/invoice.py` (à créer)

---

## Notes techniques

- Le modèle `Invoice` existe dans `templates/modules/billing/models/invoice.py` mais n'est peut-être pas utilisé dans l'application principale
- Il existe un modèle `Invoice` dans `backend/app/models/invoice.py` pour le module ERP
- L'API ERP a des endpoints pour les factures (`/erp/invoices`) mais c'est pour le portail ERP, pas pour le module Finances
- Il faudra créer une API spécifique pour le module Finances ou adapter l'existante

---

**Priorité de correction recommandée**:
1. 🔴 Implémenter l'API backend pour les facturations (critique)
2. 🔴 Créer le client API frontend et hooks React Query (critique)
3. 🔴 Remplacer les données simulées par l'API (critique)
4. 🔴 Implémenter le bouton "Nouvelle facture" (critique)
5. 🔴 Ajouter la possibilité de créer/modifier/supprimer (critique)
6. 🔴 Ajouter la possibilité d'envoyer des factures (modéré)
7. 🔴 Créer le système de paiements (modéré)
8. 🟡 Implémenter la pagination (amélioration)
9. 🟡 Ajouter l'export PDF (amélioration)
10. 🟡 Ajouter le filtrage avancé (amélioration)
