# Guide d'Import - Module Trésorerie

**Date:** 2025-01-15  
**Version:** 1.0

---

## 📋 Vue d'Ensemble

Ce guide explique comment importer des transactions (dépenses et revenus) dans le module de trésorerie à partir d'un fichier CSV, Excel ou ZIP.

---

## 📦 Formats Supportés

### 1. Fichier CSV (.csv)
- Format texte simple avec séparateur virgule
- Encodage UTF-8 recommandé
- Première ligne = en-têtes

### 2. Fichier Excel (.xlsx, .xls)
- Format Excel standard
- Première ligne = en-têtes
- Supporte plusieurs feuilles (utilise la première)

### 3. Fichier ZIP (.zip)
- Archive contenant :
  - `transactions.csv` ou `transactions.xlsx` (données)
  - `INSTRUCTIONS.txt` (instructions - optionnel)

---

## 📝 Format du Fichier

### Colonnes Requises

| Colonne | Noms Acceptés | Description | Exemple |
|---------|---------------|-------------|---------|
| **Type** | `type`, `type_transaction`, `entree_sortie`, `entry_exit` | Type de transaction | `entry` ou `exit` |
| **Montant** | `amount`, `montant`, `montant_transaction` | Montant numérique | `1000.00` |
| **Date** | `date`, `date_transaction`, `date_operation` | Date de la transaction | `2025-01-15` |
| **Description** | `description`, `libelle`, `libellé`, `description_transaction` | Description | `Facture client #123` |

### Colonnes Optionnelles

| Colonne | Noms Acceptés | Description | Exemple |
|---------|---------------|-------------|---------|
| **Compte Bancaire** | `bank_account`, `compte_bancaire`, `bank_account_name`, `compte` | Nom du compte | `Compte Principal` |
| **Catégorie** | `category`, `categorie`, `category_name`, `nom_categorie` | Nom de la catégorie | `Vente`, `Charge fixe` |
| **Statut** | `status`, `statut`, `etat`, `state` | Statut de la transaction | `confirmed`, `pending`, `projected` |
| **Méthode de Paiement** | `payment_method`, `methode_paiement`, `moyen_paiement` | Méthode utilisée | `Virement`, `Chèque`, `Carte` |
| **Référence** | `reference`, `reference_number`, `numero_reference`, `numero` | Numéro de référence | `VIR-001`, `CHQ-123` |
| **Notes** | `notes`, `remarques`, `commentaires` | Notes supplémentaires | `Paiement reçu` |

---

## 📅 Formats de Date Acceptés

Les dates peuvent être au format :
- `YYYY-MM-DD` (ex: `2025-01-15`)
- `DD/MM/YYYY` (ex: `15/01/2025`)
- `MM/DD/YYYY` (ex: `01/15/2025`)
- `YYYY-MM-DD HH:MM:SS` (ex: `2025-01-15 10:30:00`)

---

## 💰 Types de Transactions

### Entrée (Revenu)
- Valeurs acceptées : `entry`, `entree`, `entrée`, `entrées`
- Représente une entrée d'argent (revenu, facture payée, etc.)

### Sortie (Dépense)
- Valeurs acceptées : `exit`, `sortie`, `sorties`
- Représente une sortie d'argent (dépense, paiement, etc.)

---

## 📊 Statuts de Transaction

| Statut | Valeurs Acceptées | Description |
|--------|-------------------|-------------|
| **Confirmé** | `confirmed`, `confirme`, `confirmé` | Transaction confirmée (défaut) |
| **En Attente** | `pending`, `en_attente` | Transaction en attente |
| **Projeté** | `projected`, `projete`, `projeté` | Transaction projetée |
| **Annulé** | `cancelled`, `annule`, `annulé` | Transaction annulée |

---

## 📄 Exemple de Fichier CSV

```csv
Type,Montant,Date,Description,Compte Bancaire,Catégorie,Statut,Méthode de Paiement,Référence,Notes
entry,1000.00,2025-01-15,"Facture client #123",Compte Principal,Vente,confirmed,Virement,VIR-001,"Paiement reçu"
exit,500.00,2025-01-16,"Loyer bureau",Compte Principal,Charge fixe,confirmed,Chèque,CHQ-001,"Paiement loyer"
entry,2500.00,2025-01-20,"Projet ABC",Compte Principal,Projet,confirmed,Virement,VIR-002,
exit,1200.00,2025-01-22,"Assurances",Compte Principal,Charge fixe,pending,Virement,VIR-003,"À confirmer"
```

---

## 📄 Exemple de Fichier Excel

| Type | Montant | Date | Description | Compte Bancaire | Catégorie | Statut | Méthode de Paiement | Référence | Notes |
|------|---------|------|-------------|-----------------|-----------|--------|---------------------|-----------|-------|
| entry | 1000.00 | 2025-01-15 | Facture client #123 | Compte Principal | Vente | confirmed | Virement | VIR-001 | Paiement reçu |
| exit | 500.00 | 2025-01-16 | Loyer bureau | Compte Principal | Charge fixe | confirmed | Chèque | CHQ-001 | Paiement loyer |

---

## 📦 Structure du Fichier ZIP

```
template_import_tresorerie.zip
├── transactions.csv (ou transactions.xlsx)
└── INSTRUCTIONS.txt (optionnel)
```

---

## 🚀 Processus d'Import

### Étape 1 : Télécharger le Modèle
1. Cliquez sur **"Télécharger Modèle"** dans la page de trésorerie
2. Le fichier `template_import_tresorerie.zip` sera téléchargé
3. Décompressez le fichier ZIP

### Étape 2 : Préparer vos Données
1. Ouvrez le fichier `transactions.csv` (ou `transactions.xlsx`)
2. Remplissez les colonnes avec vos données
3. Respectez les formats de date et les types de transaction
4. Sauvegardez le fichier

### Étape 3 : Importer
1. Cliquez sur **"Importer"** dans la page de trésorerie
2. Sélectionnez votre fichier (CSV, Excel ou ZIP)
3. Le système valide automatiquement les données
4. Vérifiez les erreurs et avertissements
5. Cliquez sur **"Confirmer l'Import"** pour finaliser

---

## ⚠️ Validation et Erreurs

### Erreurs Communes

1. **Type manquant ou invalide**
   - Erreur : `Missing required field: type`
   - Solution : Vérifiez que la colonne "Type" contient `entry` ou `exit`

2. **Montant invalide**
   - Erreur : `Invalid amount: XXX`
   - Solution : Le montant doit être un nombre positif

3. **Date invalide**
   - Erreur : `Invalid date format: XXX`
   - Solution : Utilisez un format de date accepté (voir section Formats de Date)

4. **Description manquante**
   - Erreur : `Missing required field: description`
   - Solution : Ajoutez une description pour chaque transaction

### Avertissements

- **Catégorie non trouvée** : La catégorie sera créée automatiquement si elle n'existe pas
- **Compte bancaire non trouvé** : Le compte par défaut sera utilisé

---

## 🔍 Mode Dry Run

Le système valide d'abord vos données en mode "dry run" (simulation) avant l'import réel :
- Aucune transaction n'est créée
- Vous pouvez voir les erreurs et avertissements
- Vous pouvez corriger votre fichier avant de confirmer

---

## 📊 Résultats d'Import

Après l'import, vous recevrez :
- **Total lignes** : Nombre total de lignes dans le fichier
- **Valides** : Nombre de transactions valides
- **Erreurs** : Nombre de lignes avec erreurs
- **Créées** : Nombre de transactions effectivement créées

---

## 💡 Conseils

1. **Utilisez le modèle** : Téléchargez toujours le modèle pour garantir le bon format
2. **Vérifiez les dates** : Assurez-vous que les dates sont au bon format
3. **Testez avec peu de données** : Commencez par importer quelques transactions pour tester
4. **Vérifiez les erreurs** : Corrigez toutes les erreurs avant de confirmer l'import
5. **Sauvegardez votre fichier** : Gardez une copie de votre fichier d'import

---

## 🔗 Colonnes Flexibles

Le système accepte plusieurs noms de colonnes (insensible à la casse et aux accents) :
- `Type` = `type` = `TYPE` = `Type Transaction`
- `Montant` = `montant` = `Montant Transaction` = `amount`
- `Date` = `date` = `Date Transaction` = `date_operation`

---

## 📞 Support

En cas de problème :
1. Vérifiez le format de votre fichier
2. Consultez les erreurs détaillées dans l'interface
3. Téléchargez un nouveau modèle si nécessaire
4. Contactez le support si le problème persiste

---

## ✅ Checklist d'Import

- [ ] Fichier au bon format (CSV, Excel ou ZIP)
- [ ] Colonnes requises présentes (Type, Montant, Date, Description)
- [ ] Types de transaction valides (`entry` ou `exit`)
- [ ] Montants numériques positifs
- [ ] Dates au bon format
- [ ] Descriptions non vides
- [ ] Taille du fichier < 10MB
- [ ] Encodage UTF-8 (pour CSV)

---

**Bon import ! 🚀**
