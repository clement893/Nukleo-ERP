# Rapport d'État - Module Trésorerie

**Date:** 2025-01-15  
**URL Production:** https://modeleweb-production-f341.up.railway.app/fr/dashboard/finances/tresorerie

---

## 🔍 Constat

### Page Principale (`/dashboard/finances/tresorerie`)
**Fichier:** `apps/web/src/app/[locale]/dashboard/finances/tresorerie/page.tsx`

**❌ PROBLÈME IDENTIFIÉ:** Cette page utilise des **données simulées** et n'utilise **PAS** l'API réelle de trésorerie.

**Ce qui existe actuellement:**
- ✅ Interface UI complète et moderne
- ✅ Visualisation du cashflow (graphiques, KPIs)
- ✅ Boutons "Exporter" et "Ajouter Transaction" (mais non fonctionnels)
- ❌ **Pas d'import de transactions**
- ❌ **Pas de connexion à l'API `tresorerieAPI`**
- ❌ Génère des données fictives depuis projets et employés

**Code actuel:**
```typescript
// ❌ Utilise des APIs différentes (projets, employés)
import { projectsAPI } from '@/lib/api/projects';
import { employeesAPI } from '@/lib/api/employees';

// ❌ Génère des transactions simulées
const entreesTransactions: Transaction[] = projects
  .filter(p => p.budget && p.budget > 0)
  .map((p) => { /* génération fictive */ });
```

---

### Page Démo (`/dashboard/tresorerie-demo`)
**Fichier:** `apps/web/src/app/[locale]/dashboard/tresorerie-demo/page.tsx`

**✅ FONCTIONNEL:** Cette page utilise l'API réelle avec toutes les fonctionnalités.

**Ce qui existe:**
- ✅ **Import de transactions** (CSV, Excel, ZIP)
- ✅ **Téléchargement de template d'import**
- ✅ **Mode dry-run** (prévisualisation avant import)
- ✅ **Utilisation de l'API `tresorerieAPI`**
- ✅ **Modal d'import complète** avec gestion d'erreurs
- ✅ Visualisation des données réelles depuis la base de données

**Code fonctionnel:**
```typescript
// ✅ Utilise l'API de trésorerie
import { tresorerieAPI, type CashflowWeek, type Transaction, type TreasuryStats } from '@/lib/api/tresorerie';

// ✅ Charge les données réelles
const [cashflowData, transactionsData, statsData] = await Promise.all([
  tresorerieAPI.getWeeklyCashflow({ date_from: dateFrom, date_to: dateTo }),
  tresorerieAPI.listTransactions({ limit: 1000 }),
  tresorerieAPI.getStats({ period_days: 30 })
]);

// ✅ Import fonctionnel
const dryRunResult = await tresorerieAPI.importTransactions(file, { dry_run: true });
const result = await tresorerieAPI.importTransactions(file, { dry_run: false });
```

---

## 📊 Comparaison des Fonctionnalités

| Fonctionnalité | Page Principale | Page Démo |
|----------------|-----------------|-----------|
| **API Réelle** | ❌ Non | ✅ Oui |
| **Import Transactions** | ❌ Non | ✅ Oui |
| **Télécharger Template** | ❌ Non | ✅ Oui |
| **Dry-Run Import** | ❌ Non | ✅ Oui |
| **Modal d'Import** | ❌ Non | ✅ Oui |
| **Gestion Erreurs Import** | ❌ Non | ✅ Oui |
| **Données Réelles** | ❌ Non (simulées) | ✅ Oui |
| **UI Moderne** | ✅ Oui | ✅ Oui |

---

## 🎯 Solution Recommandée

### Option 1: Migrer les fonctionnalités vers la page principale (RECOMMANDÉ)

**Avantages:**
- La page principale est l'URL officielle (`/dashboard/finances/tresorerie`)
- Meilleure expérience utilisateur (une seule page)
- Cohérence avec le reste de l'application

**Actions à faire:**
1. Remplacer les imports dans `finances/tresorerie/page.tsx`:
   ```typescript
   // ❌ À remplacer
   import { projectsAPI } from '@/lib/api/projects';
   import { employeesAPI } from '@/lib/api/employees';
   
   // ✅ Par
   import { tresorerieAPI, type CashflowWeek, type Transaction, type TreasuryStats } from '@/lib/api/tresorerie';
   ```

2. Remplacer la fonction `loadTresorerie()` pour utiliser l'API réelle
3. Ajouter la modal d'import depuis la page de démo
4. Ajouter les boutons fonctionnels (Télécharger Template, Importer)
5. Adapter les types/interfaces pour correspondre à l'API

### Option 2: Rediriger la page principale vers la démo

**Avantages:**
- Solution rapide
- Pas de duplication de code

**Inconvénients:**
- URL différente (`/dashboard/tresorerie-demo`)
- Moins professionnel

---

## 📝 Fonctionnalités d'Import Disponibles

### ✅ API Backend Complète
- **Endpoint:** `POST /api/v1/finances/tresorerie/import`
- **Template:** `GET /api/v1/finances/tresorerie/import/template`
- **Formats supportés:** CSV, Excel (.xlsx, .xls), ZIP
- **Mode dry-run:** Oui (prévisualisation avant import)

### ✅ Client API Frontend
- `tresorerieAPI.importTransactions(file, { dry_run?: boolean, bank_account_id?: number })`
- `tresorerieAPI.downloadImportTemplate(format: 'zip' | 'csv' | 'excel')`

### ✅ Modal d'Import Complète
La page de démo contient une modal complète avec:
- Upload de fichier
- Prévisualisation (dry-run)
- Affichage des erreurs et avertissements
- Confirmation avant import réel
- Rechargement automatique des données après import

---

## 🔧 Code à Migrer

### 1. Imports à Ajouter
```typescript
import { tresorerieAPI, type CashflowWeek, type Transaction, type TreasuryStats } from '@/lib/api/tresorerie';
import { useRef, useState } from 'react';
import { Upload, X, CheckCircle2, AlertCircle } from 'lucide-react';
```

### 2. États à Ajouter
```typescript
const [showImportModal, setShowImportModal] = useState(false);
const [importing, setImporting] = useState(false);
const [importResult, setImportResult] = useState<any>(null);
const fileInputRef = useRef<HTMLInputElement>(null);
```

### 3. Fonction loadTresorerie à Remplacer
```typescript
const loadTresorerie = async () => {
  try {
    setLoading(true);
    
    // Calculer les dates pour les 12 dernières semaines
    const today = new Date();
    const twelveWeeksAgo = new Date(today);
    twelveWeeksAgo.setDate(today.getDate() - (12 * 7));
    const dateFrom = twelveWeeksAgo.toISOString().split('T')[0];
    const dateTo = today.toISOString().split('T')[0];

    const [cashflowData, transactionsData, statsData] = await Promise.all([
      tresorerieAPI.getWeeklyCashflow({ date_from: dateFrom, date_to: dateTo }),
      tresorerieAPI.listTransactions({ limit: 1000 }),
      tresorerieAPI.getStats({ period_days: 30 })
    ]);

    // Convertir les données de cashflow
    const soldesParSemaine: SoldeHebdomadaire[] = cashflowData.weeks.map((week: CashflowWeek) => ({
      semaine: week.week_start,
      entrees: Number(week.entries),
      sorties: Number(week.exits),
      solde: Number(week.balance),
      projete: week.is_projected
    }));

    setSoldesHebdo(soldesParSemaine);
    setTransactions(transactionsData);
    setSoldeActuel(Number(statsData.current_balance));
  } catch (error) {
    logger.error('Erreur lors du chargement de la trésorerie', error);
    showToast({
      title: 'Erreur',
      message: 'Impossible de charger les données de trésorerie',
      type: 'error'
    });
  } finally {
    setLoading(false);
  }
};
```

### 4. Boutons à Remplacer
```typescript
// Dans le header, remplacer les boutons non fonctionnels par:
<Button 
  className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
  onClick={async () => {
    try {
      const blob = await tresorerieAPI.downloadImportTemplate('zip');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'template_import_tresorerie.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showToast({
        title: 'Téléchargement',
        message: 'Modèle d\'import téléchargé',
        type: 'success'
      });
    } catch (error) {
      showToast({
        title: 'Erreur',
        message: 'Impossible de télécharger le modèle',
        type: 'error'
      });
    }
  }}
>
  <Download className="w-4 h-4 mr-2" />
  Télécharger Modèle
</Button>
<Button 
  className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
  onClick={() => setShowImportModal(true)}
>
  <Upload className="w-4 h-4 mr-2" />
  Importer
</Button>
```

### 5. Modal d'Import à Ajouter
Copier la modal complète depuis `tresorerie-demo/page.tsx` (lignes 482-712)

---

## ✅ Checklist de Migration

- [ ] Remplacer les imports (projets/employés → tresorerieAPI)
- [ ] Remplacer la fonction `loadTresorerie()` pour utiliser l'API réelle
- [ ] Ajouter les états pour la modal d'import
- [ ] Remplacer les boutons du header par les versions fonctionnelles
- [ ] Ajouter la modal d'import complète
- [ ] Adapter les types/interfaces (Transaction, SoldeHebdomadaire)
- [ ] Tester l'import de transactions
- [ ] Tester le téléchargement de template
- [ ] Vérifier que les données s'affichent correctement
- [ ] Tester le rechargement après import

---

## 🚨 Points d'Attention

1. **Types de données:** La page principale utilise des types locaux (`Transaction`, `SoldeHebdomadaire`) qui doivent être adaptés aux types de l'API (`tresorerieAPI`)

2. **Format des dates:** L'API retourne des dates ISO, vérifier la conversion

3. **Format des montants:** L'API utilise `Decimal`, convertir en `number` pour l'affichage

4. **Gestion des erreurs:** S'assurer que toutes les erreurs sont bien gérées avec des toasts

5. **Rechargement:** Après un import réussi, recharger les données avec `loadTresorerie()`

---

## 📚 Références

- **API Client:** `apps/web/src/lib/api/tresorerie.ts`
- **Page Démo Fonctionnelle:** `apps/web/src/app/[locale]/dashboard/tresorerie-demo/page.tsx`
- **Page Principale à Migrer:** `apps/web/src/app/[locale]/dashboard/finances/tresorerie/page.tsx`
- **API Backend:** `backend/app/api/v1/endpoints/finances/tresorerie.py`
- **Guide Import:** `GUIDE_IMPORT_TRESORERIE.md`

---

**Conclusion:** Les fonctionnalités d'import existent et sont fonctionnelles dans la page de démo, mais elles n'ont pas été migrées vers la page principale. La migration est nécessaire pour que l'URL officielle (`/dashboard/finances/tresorerie`) fonctionne correctement.
