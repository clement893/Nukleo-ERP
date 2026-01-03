# Plan : Édition Inline de l'Opportunité dans Vue d'ensemble

## 📋 Vue d'ensemble

Permettre l'édition directe de l'opportunité dans l'onglet "Vue d'ensemble" sans ouvrir de modal, et ajouter les champs manquants actuellement non affichés.

## 🎯 Objectifs

1. **Retirer le bouton FAB** : Supprimer le bouton flottant "Éditer" en bas à droite
2. **Édition inline** : Permettre la modification des champs directement dans la vue
3. **Ajouter champs manquants** : Afficher et permettre l'édition de tous les champs disponibles
4. **Auto-save** : Sauvegarde automatique avec debounce (comme pour les notes)

## 📊 Champs Actuellement Affichés

### Dans Vue d'ensemble
- ✅ Montant (`amount`)
- ✅ Probabilité (`probability`)
- ✅ Date de clôture prévue (`expected_close_date`)
- ✅ Entreprise (`company_name`)
- ✅ Étape (`stage_name`)
- ✅ Contacts (`contact_names`)
- ✅ Description (`description`)

### Dans Header
- ✅ Nom (`name`) - affiché mais non éditable
- ✅ Stage badge - affiché mais non éditable

### Dans Metadata (bas de page)
- ✅ Créé le (`created_at`)
- ✅ Dernière modification (`updated_at`)
- ✅ Assigné à (`assigned_to_name`)

## 📋 Champs Manquants à Ajouter

### Informations principales
- ❌ **Statut** (`status`) - Statut de l'opportunité
- ❌ **Segment** (`segment`) - Segment marché
- ❌ **Région** (`region`) - Région géographique
- ❌ **Lien service offer** (`service_offer_link`) - Lien vers l'offre de service
- ❌ **Pipeline** (`pipeline_name`) - Pipeline auquel appartient l'opportunité
- ❌ **Créé par** (`created_by_name`) - Utilisateur qui a créé l'opportunité
- ❌ **Date d'ouverture** (`opened_at`) - Date d'ouverture de l'opportunité
- ❌ **Date de clôture** (`closed_at`) - Date de clôture effective

### Champs à rendre éditable
- ❌ **Nom** (`name`) - Actuellement dans le header, à rendre éditable
- ❌ **Assigné à** (`assigned_to_id`) - Actuellement en lecture seule

## 🏗️ Structure de l'Onglet Vue d'ensemble

### Layout proposé

```
┌─────────────────────────────────────────────────────────┐
│  Vue d'ensemble                                          │
├─────────────────────────────────────────────────────────┤
│  [Section: Informations principales]                    │
│  ┌─────────────────────┬─────────────────────────────┐ │
│  │ Nom* [éditable]     │ Pipeline [select]           │ │
│  │ Statut [select]     │ Étape [select]              │ │
│  │ Segment [input]     │ Région [input]              │ │
│  │ Montant [number]    │ Probabilité [slider/input]  │ │
│  │ Date clôture [date] │ Assigné à [select users]    │ │
│  └─────────────────────┴─────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│  [Section: Relations]                                    │
│  ┌─────────────────────┬─────────────────────────────┐ │
│  │ Entreprise [select] │ Contacts [multi-select]      │ │
│  └─────────────────────┴─────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│  [Section: Informations complémentaires]                 │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Description [textarea éditable]                    │ │
│  │ Lien service offer [input URL]                      │ │
│  └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│  [Section: Dates et métadonnées]                         │
│  ┌─────────────────────┬─────────────────────────────┐ │
│  │ Créé le [readonly]  │ Créé par [readonly]          │ │
│  │ Date d'ouverture    │ Date de clôture [date]        │ │
│  │ [date éditable]     │                               │ │
│  └─────────────────────┴─────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## 🎨 Design UI/UX

### Mode Édition

1. **Champs inline éditable** :
   - Input/Select visible directement
   - Bordure highlightée au focus
   - Indicateur de sauvegarde (saving/saved)
   - Validation en temps réel

2. **Indicateurs visuels** :
   - Icône "éditer" discrète à côté des champs (optionnel)
   - Badge "Enregistrement..." pendant la sauvegarde
   - Badge "Enregistré" après sauvegarde (disparaît après 3s)

3. **Organisation** :
   - Groupement logique par sections
   - Grid responsive (2 colonnes sur desktop, 1 sur mobile)
   - Espacement généreux pour la lisibilité

### Types de champs

- **Texte simple** : Input text (Nom, Segment, Région)
- **Nombre** : Input number avec formatage (Montant, Probabilité)
- **Date** : Date picker (Date de clôture, Date d'ouverture, Date de clôture effective)
- **Select** : Dropdown (Statut, Pipeline, Étape, Assigné à, Entreprise)
- **Multi-select** : Select multiple (Contacts)
- **URL** : Input URL avec validation (Lien service offer)
- **Texte long** : Textarea auto-resize (Description)
- **Readonly** : Affichage simple (Créé le, Créé par, Dernière modification)

## 🔧 Implémentation Technique

### Composant : `OpportunityOverviewEditor.tsx`

```tsx
interface OpportunityOverviewEditorProps {
  opportunity: Opportunity;
  opportunityId: string;
  onUpdate: (updatedOpportunity: Opportunity) => void;
  onError?: (error: Error) => void;
}

// Fonctionnalités :
// - Édition inline de tous les champs
// - Auto-save avec debounce (2.5s)
// - Validation des champs
// - Gestion d'erreurs
// - Optimistic updates
```

### Hook : `useOpportunityEditor.ts`

```typescript
interface UseOpportunityEditorOptions {
  opportunityId: string;
  initialOpportunity: Opportunity;
  debounceMs?: number;
  onSaveSuccess?: () => void;
  onSaveError?: (error: Error) => void;
}

// Fonctionnalités :
// - État local pour chaque champ
// - Mutation React Query pour update
// - Debounce pour auto-save
// - Optimistic updates
// - Gestion d'erreurs avec rollback
```

### Sections du composant

1. **Informations principales** (Card 1)
   - Nom (input)
   - Statut (select)
   - Segment (input)
   - Montant (input number)
   - Probabilité (input number + slider optionnel)
   - Date de clôture prévue (date picker)

2. **Pipeline et assignation** (Card 2)
   - Pipeline (select - liste des pipelines)
   - Étape (select - dépend du pipeline sélectionné)
   - Assigné à (select - liste des utilisateurs)
   - Région (input)

3. **Relations** (Card 3)
   - Entreprise (select - liste des entreprises)
   - Contacts (multi-select - liste des contacts)

4. **Informations complémentaires** (Card 4 - full width)
   - Description (textarea auto-resize)
   - Lien service offer (input URL)

5. **Dates et métadonnées** (Card 5)
   - Créé le (readonly)
   - Créé par (readonly)
   - Date d'ouverture (date picker)
   - Date de clôture (date picker)
   - Dernière modification (readonly)

## 🔄 Flux Utilisateur

1. **Ouverture de l'onglet Vue d'ensemble**
   - Affiche tous les champs avec leurs valeurs actuelles
   - Champs en mode lecture par défaut (ou directement éditable selon UX)

2. **Édition d'un champ**
   - L'utilisateur clique/tape dans un champ
   - Le champ devient éditable
   - Indicateur "En cours d'édition..." apparaît

3. **Auto-save**
   - Après 2.5 secondes d'inactivité
   - Indicateur "Enregistrement..."
   - Puis "Enregistré il y a X secondes"
   - Le champ reste éditable

4. **Validation**
   - Validation en temps réel (montant > 0, probabilité 0-100%, etc.)
   - Messages d'erreur sous les champs invalides
   - Sauvegarde bloquée si erreurs

5. **Gestion d'erreur**
   - Message d'erreur affiché
   - Rollback de la valeur optimiste
   - Champ reste éditable pour correction

## 📝 Structure de Code

### Fichiers à créer/modifier

1. **Hook** : `apps/web/src/hooks/useOpportunityEditor.ts`
   - Gestion de l'état et de la sauvegarde
   - Debounce et optimistic updates
   - Validation des champs

2. **Composant** : `apps/web/src/components/commercial/OpportunityOverviewEditor.tsx`
   - Formulaire d'édition inline
   - Sections organisées
   - Champs avec validation

3. **Page** : `apps/web/src/app/[locale]/dashboard/commercial/opportunites/[id]/page.tsx`
   - Retirer le bouton FAB
   - Remplacer l'affichage statique par le composant éditable
   - Gérer le rafraîchissement après sauvegarde

4. **API/Queries** : Utiliser `useUpdateOpportunity` existant ou créer un hook dédié

## 🎯 Priorités d'Implémentation

### Phase 1 : MVP (Champs essentiels)
1. ✅ Retirer le bouton FAB
2. ✅ Rendre les champs existants éditable
3. ✅ Ajouter Nom éditable
4. ✅ Ajouter Statut
5. ✅ Ajouter Assigné à (select users)
6. ✅ Auto-save fonctionnel

### Phase 2 : Champs supplémentaires
1. Ajouter Segment
2. Ajouter Région
3. Ajouter Lien service offer
4. Ajouter Pipeline et Étape (avec dépendance)
5. Ajouter Dates d'ouverture/fermeture

### Phase 3 : Améliorations UX
1. Validation avancée
2. Messages d'aide contextuels
3. Historique des modifications (via onglet Activités)
4. Permissions (qui peut éditer quoi)

## 🔐 Validation des Champs

- **Nom** : Requis, min 1 caractère, max 255
- **Montant** : Optionnel, >= 0, format currency
- **Probabilité** : Optionnel, 0-100 (entier)
- **Date de clôture** : Optionnel, format date valide
- **URL** : Optionnel, format URL valide si fourni
- **Pipeline** : Requis (doit exister)
- **Étape** : Optionnel mais doit appartenir au pipeline sélectionné
- **Assigné à** : Optionnel, doit être un utilisateur valide
- **Entreprise** : Optionnel, doit exister
- **Contacts** : Optionnel, array d'IDs valides

## 📱 Responsive

- **Desktop** : 2 colonnes pour les sections principales
- **Tablet** : 2 colonnes avec espacement réduit
- **Mobile** : 1 colonne, champs empilés

## 🚀 Étapes d'Implémentation

1. ✅ Retirer le bouton FAB
2. ✅ Créer le hook `useOpportunityEditor`
3. ✅ Créer le composant `OpportunityOverviewEditor`
4. ✅ Intégrer dans la page
5. ✅ Ajouter les champs manquants
6. ✅ Tester et valider
7. ✅ Commit et push

---

## 🎯 Recommandation Finale

**Approche progressive** :
1. Commencer par rendre les champs existants éditable
2. Ajouter les champs manquants un par un
3. Améliorer l'UX au fur et à mesure
4. Tester avec de vraies données

**Avantages** :
- Édition rapide sans navigation
- Tous les champs visibles et accessibles
- Expérience utilisateur fluide
- Cohérence avec l'édition inline des notes
