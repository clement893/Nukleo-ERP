# Status Refactorisation Page Dépenses → Tableau Excel-like

## ✅ Phase 1 : COMPLÉTÉE

### Composant EditableDataGrid créé
- **Fichier:** `apps/web/src/components/finances/EditableDataGrid.tsx`
- **Fonctionnalités implémentées:**
  - ✅ Édition inline de cellules
  - ✅ Navigation clavier (Tab, Enter, Flèches)
  - ✅ Sélection de cellules multiples
  - ✅ Copier-coller multi-cellules (Ctrl+C/Ctrl+V)
  - ✅ Parsing TSV/CSV du presse-papiers
  - ✅ Support types: text, number, date, select, currency
  - ✅ Validation inline
  - ✅ Gestion d'état des cellules (editing, saved, error)
  - ✅ Formatage automatique (monétaire, dates)

## 🔄 Phase 2 : EN COURS

### Intégration dans la page des dépenses
- **À faire:**
  - [ ] Définir les colonnes pour les transactions
  - [ ] Créer handler pour onCellChange avec debounce
  - [ ] Créer handler pour onRowAdd
  - [ ] Créer handler pour onBulkUpdate
  - [ ] Intégrer le composant dans l'onglet "expenses"
  - [ ] Tester avec les données réelles

### Colonnes à créer
1. Description (text, required)
2. Montant (currency, required)
3. Taxes (currency, optional)
4. Date transaction (date, required)
5. Date paiement prévue (date, optional)
6. Date paiement réelle (date, optional)
7. Statut (select: pending/paid/cancelled)
8. Catégorie (select: liste des catégories)
9. Fournisseur (select: liste des fournisseurs)
10. Numéro facture (text, optional)
11. Notes (text, optional)

## 📝 Prochaines étapes

1. **Créer un hook personnalisé** pour gérer les updates avec debounce
2. **Intégrer EditableDataGrid** dans l'onglet expenses
3. **Tester** avec les données existantes
4. **Étendre** aux autres onglets (suppliers, recurring, invoices)

## 🎯 Objectif

Remplacer l'affichage liste par un tableau éditable type Excel avec :
- Édition directe dans le tableau
- Copier-coller depuis Excel
- Sauvegarde automatique
- Validation en temps réel
