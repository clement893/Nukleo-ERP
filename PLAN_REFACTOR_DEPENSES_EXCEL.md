# Plan de Refactorisation - Page Dépenses → Tableau Excel-like

## 📋 Contexte

Refactoriser la page `/dashboard/finances/depenses` pour permettre la saisie directe dans un tableau éditable type Excel, avec support du copier-coller, tout en conservant la synchronisation avec la base de données.

**URL actuelle:** https://modeleweb-production-f341.up.railway.app/fr/dashboard/finances/depenses

## 🎯 Objectifs

1. **Remplacer les onglets/modals par un tableau éditable**
2. **Permettre l'édition inline de toutes les colonnes**
3. **Support du copier-coller (Excel/CSV)**
4. **Ajout/suppression de lignes directement dans le tableau**
5. **Sauvegarde automatique avec debounce**
6. **Validation en temps réel**
7. **Conserver toutes les fonctionnalités existantes**

## 📊 Analyse de l'existant

### Structure actuelle

La page utilise actuellement :
- **Onglets (Tabs)** : Expenses, Suppliers, Recurring, Invoices
- **Modals** : Pour créer/éditer chaque type d'entité
- **DataTable** : Affichage en lecture seule
- **Transactions API** : Backend existant

### Données à gérer

1. **Transactions (Expenses)**
   - Description, Montant, Date, Statut, Catégorie
   - Fournisseur, Facture, Notes
   - Taxes, Devise

2. **Fournisseurs (Suppliers)**
   - Nom, Email, Téléphone, Adresse
   - Statistiques (total dépenses, nombre)

3. **Dépenses récurrentes (Recurring)**
   - Description, Montant, Fréquence
   - Dates début/fin, Fournisseur

4. **Factures (Invoices)**
   - Numéro, Fournisseur, Montant
   - Dates émission/échéance, Statut

## 🏗️ Architecture proposée

### Phase 1: Composant Tableau Editable de Base

#### 1.1 Créer `EditableDataGrid` Component

**Fichier:** `apps/web/src/components/finances/EditableDataGrid.tsx`

**Fonctionnalités:**
- Tableau éditable avec cellules individuelles
- Navigation clavier (Tab, Enter, Arrow keys)
- Sélection de cellules multiples
- Copier-coller multi-cellules
- Ajout/suppression de lignes
- Sauvegarde automatique par cellule (debounce)

**Props:**
```typescript
interface EditableDataGridProps<T> {
  data: T[];
  columns: EditableColumn<T>[];
  onCellChange: (rowId: string | number, columnKey: string, value: any) => void;
  onRowAdd?: () => void;
  onRowDelete?: (rowId: string | number) => void;
  onBulkUpdate?: (updates: CellUpdate[]) => void;
  rowKey: (row: T) => string | number;
  loading?: boolean;
}
```

**Colonnes éditables:**
```typescript
interface EditableColumn<T> {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'currency';
  editable: boolean;
  required?: boolean;
  validate?: (value: any) => string | null;
  options?: SelectOption[]; // Pour type='select'
  format?: (value: any) => string;
  parse?: (value: string) => any;
  width?: number;
}
```

#### 1.2 Gestion du Copier-Coller

**Fonctionnalités:**
- Détecter Ctrl+C / Cmd+C → copier les cellules sélectionnées au format TSV
- Détecter Ctrl+V / Cmd+V → coller depuis le presse-papiers (TSV/CSV)
- Parser les données collées
- Mapper les colonnes si nécessaire
- Validation avant insertion

**Format de copie:**
- TSV (Tab-Separated Values) pour compatibilité Excel
- Header row optionnel

**Exemple:**
```
Description	Amount	Date	Status
Fournitures	100.50	2024-01-15	paid
Marketing	250.00	2024-01-16	pending
```

#### 1.3 Navigation et Sélection

**Navigation clavier:**
- `Tab` / `Shift+Tab` : Cellule suivante/précédente
- `Enter` : Cellule en dessous
- `Shift+Enter` : Cellule au-dessus
- `Arrow keys` : Navigation directionnelle
- `Ctrl+A` / `Cmd+A` : Sélectionner toutes les cellules
- `Ctrl+Click` : Sélection multiple de cellules
- `Shift+Click` : Sélection de plage

**Visualisation:**
- Bordure autour de la cellule active
- Highlight des cellules sélectionnées
- Indicateur visuel de modification non sauvegardée

### Phase 2: Intégration avec les Transactions

#### 2.1 Adapter pour les Dépenses (Expenses)

**Colonnes du tableau:**
1. **Description** (text, required)
2. **Montant** (currency, required)
3. **Taxes** (currency, optional)
4. **Date transaction** (date, required)
5. **Date paiement prévue** (date, optional)
6. **Date paiement réelle** (date, optional)
7. **Statut** (select: pending/paid/cancelled)
8. **Catégorie** (select: liste des catégories)
9. **Fournisseur** (select: liste des fournisseurs)
10. **Numéro facture** (text, optional)
11. **Notes** (text, optional)

**Mapping API:**
- Chaque modification de cellule → `transactionsAPI.update()`
- Nouvelle ligne → `transactionsAPI.create()`
- Suppression → `transactionsAPI.delete()`

#### 2.2 Batch Operations

**Sauvegarde par lot:**
- Grouper les modifications (debounce 500ms)
- API endpoint pour bulk update (à créer si nécessaire)
- Optimistic updates
- Rollback en cas d'erreur

**Format batch:**
```typescript
interface BatchUpdate {
  updates: Array<{
    id: number;
    changes: Partial<TransactionUpdate>;
  }>;
  creates: TransactionCreate[];
  deletes: number[];
}
```

### Phase 3: Fonctionnalités Avancées

#### 3.1 Validation

**Validation par cellule:**
- Montant: nombre positif
- Date: format valide, pas dans le futur (selon règles métier)
- Statut: valeur dans la liste
- Catégorie: existe dans la liste
- Fournisseur: existe dans la liste

**Validation par ligne:**
- Ligne complète avant sauvegarde
- Messages d'erreur inline
- Highlight des cellules en erreur

#### 3.2 Fonctionnalités Excel-like

**Formules de base:**
- Somme de colonnes
- Calcul automatique (ex: Total = Montant + Taxes)

**Tri et filtres:**
- Conserver les filtres existants
- Tri multi-colonnes
- Filtres par colonne

**Formatage:**
- Format monétaire (1 234,56 €)
- Format date (DD/MM/YYYY)
- Alignement selon type de données

#### 3.3 Autres Onglets

**Stratégie:**
- Option 1: Un tableau editable par onglet
- Option 2: Un seul tableau avec vue différente selon l'onglet
- **Recommandation:** Option 1 pour clarté

**Fournisseurs:**
- Tableau editable pour gérer les fournisseurs
- Lien vers les transactions

**Récurrentes:**
- Tableau editable pour les dépenses récurrentes
- Génération automatique des transactions

**Factures:**
- Tableau editable pour les factures
- Lien vers les transactions

### Phase 4: Optimisations et UX

#### 4.1 Performance

**Virtualisation:**
- Utiliser `react-window` ou `@tanstack/react-virtual` pour grandes listes
- Render seulement les cellules visibles

**Lazy loading:**
- Charger les données par pages
- Infinite scroll ou pagination

**Debounce:**
- 500ms pour sauvegarde automatique
- Indicateur visuel "Sauvegarde..."

#### 4.2 UX

**Feedback visuel:**
- Indicateur de sauvegarde (spinner ou badge)
- Message de succès/erreur
- Highlight des lignes modifiées

**Raccourcis clavier:**
- `Ctrl+S` / `Cmd+S` : Sauvegarder manuellement
- `Ctrl+Z` / `Cmd+Z` : Annuler (si implémenté)
- `Delete` : Supprimer ligne sélectionnée
- `Ctrl+D` / `Cmd+D` : Dupliquer ligne

**Toolbar:**
- Bouton "Ajouter ligne"
- Bouton "Supprimer sélection"
- Bouton "Exporter" (CSV, Excel)
- Bouton "Importer" (CSV, Excel)

## 📝 Checklist d'implémentation

### Phase 1: Composant de base (Priorité HAUTE)
- [ ] Créer `EditableDataGrid` component
- [ ] Implémenter édition inline de cellules
- [ ] Navigation clavier (Tab, Enter, Arrows)
- [ ] Sélection de cellules multiples
- [ ] Copier-coller (Ctrl+C, Ctrl+V)
- [ ] Parsing TSV/CSV du presse-papiers
- [ ] Gestion d'état des cellules (editing, saved, error)
- [ ] Styles et animations

### Phase 2: Intégration Transactions (Priorité HAUTE)
- [ ] Adapter colonnes pour les dépenses
- [ ] Mapping API (create, update, delete)
- [ ] Sauvegarde automatique avec debounce
- [ ] Batch updates
- [ ] Optimistic updates
- [ ] Gestion d'erreurs et rollback
- [ ] Validation par cellule
- [ ] Intégration avec les fournisseurs/catégories

### Phase 3: Fonctionnalités avancées (Priorité MOYENNE)
- [ ] Ajout/suppression de lignes
- [ ] Validation complète
- [ ] Formatage (monétaire, dates)
- [ ] Tri et filtres
- [ ] Formules de base (somme, etc.)
- [ ] Toolbar avec actions
- [ ] Export/Import CSV/Excel

### Phase 4: Autres onglets (Priorité MOYENNE)
- [ ] Tableau editable Fournisseurs
- [ ] Tableau editable Récurrentes
- [ ] Tableau editable Factures
- [ ] Cohérence entre les onglets

### Phase 5: Optimisations (Priorité BASSE)
- [ ] Virtualisation pour grandes listes
- [ ] Lazy loading / pagination
- [ ] Performance tuning
- [ ] Tests unitaires
- [ ] Tests E2E
- [ ] Documentation

## 🛠️ Technologies et Bibliothèques

### Recommandations

**Option 1: Bibliothèque spécialisée**
- `react-data-grid` (CXL) - Excel-like grid
- `ag-grid` - Puissant mais lourd
- `handsontable` - Très Excel-like, licence payante pour commercial

**Option 2: Custom (Recommandé)**
- Construire avec React + hooks
- `@tanstack/react-virtual` pour virtualisation
- Contrôle total sur l'UX

### Stack technique

- **Frontend:** React, TypeScript
- **State:** React Query pour cache API
- **Validation:** Zod ou Yup
- **Format:** date-fns pour dates
- **Monnaie:** Intl.NumberFormat

## 🎨 Design et UX

### Style du tableau

- Bordures visibles entre cellules
- Headers sticky
- Cellule active avec bordure bleue épaisse
- Cellules sélectionnées avec fond bleu clair
- Lignes modifiées avec indicateur (dot ou badge)
- Lignes en erreur avec bordure rouge

### Responsive

- Horizontal scroll sur mobile
- Colonnes importantes visibles en priorité
- Mode "compact" pour petits écrans

## 🔒 Sécurité et Validation

- Validation côté client ET serveur
- Sanitization des inputs
- Protection XSS
- Limite de taille pour paste (ex: max 1000 lignes)
- Confirmation pour suppressions

## 📊 Métriques de succès

- Temps de sauvegarde < 500ms
- Support de 1000+ lignes sans lag
- UX fluide (60fps)
- Taux d'erreur < 1%
- Satisfaction utilisateur

## 🚀 Plan de déploiement

1. **Phase 1-2:** Développement et tests internes
2. **Phase 3:** Feature flag pour basculer entre ancien/nouveau
3. **Phase 4-5:** Améliorations progressives
4. **Migration:** Option de garder l'ancien système en parallèle

## 📚 Références

- [React Data Grid](https://adazzle.github.io/react-data-grid/)
- [AG Grid](https://www.ag-grid.com/)
- [Handsontable](https://handsontable.com/)
- [Google Sheets API patterns](https://developers.google.com/sheets/api)

## ⏱️ Estimation

- **Phase 1:** 3-5 jours
- **Phase 2:** 3-4 jours
- **Phase 3:** 4-5 jours
- **Phase 4:** 3-4 jours
- **Phase 5:** 2-3 jours

**Total: 15-21 jours** (3-4 semaines)
