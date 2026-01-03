# Plan : Gestion des Notes pour les Opportunités

## 📋 Vue d'ensemble

Permettre l'ajout, l'édition et la gestion des notes directement dans l'onglet "Notes" de la page de détail d'opportunité, sans ouvrir de popup.

## 🎯 Objectifs

1. **Interface inline** : Édition directe dans l'onglet, sans modal
2. **Sauvegarde automatique** : Auto-save avec debounce pour éviter trop de requêtes
3. **Historique visuel** : Afficher les notes avec timestamps si possible
4. **UX fluide** : Expérience similaire à un éditeur de texte moderne

## 📐 Architecture

### Option A : Notes simples (champ texte unique)
- **Avantages** : Simple, rapide à implémenter, utilise le champ `notes` existant
- **Inconvénients** : Pas d'historique, pas de notes multiples
- **Recommandé pour MVP**

### Option B : Notes multiples avec historique
- **Avantages** : Historique complet, notes multiples, meilleure traçabilité
- **Inconvénients** : Nécessite une nouvelle table/API, plus complexe
- **Recommandé pour version avancée**

## 🏗️ Implémentation Recommandée (Option A - MVP)

### 1. Interface Utilisateur

#### Composant : `OpportunityNotesEditor`
```tsx
- Zone d'édition inline (Textarea auto-resize)
- Bouton "Enregistrer" (optionnel si auto-save)
- Indicateur de sauvegarde (saving/saved)
- Affichage des notes existantes avec formatage
- Support markdown basique (optionnel)
```

#### Layout de l'onglet Notes
```
┌─────────────────────────────────────┐
│  Notes                               │
├─────────────────────────────────────┤
│  [Zone d'édition - Textarea]        │
│  [Auto-resize selon contenu]        │
│                                      │
│  [Indicateur: "Enregistré il y a..."]│
│  [Bouton Enregistrer] (si manuel)    │
├─────────────────────────────────────┤
│  Notes existantes:                   │
│  ┌─────────────────────────────────┐ │
│  │ Note 1 (formatée)              │ │
│  │ Créée le: 03/01/2026           │ │
│  └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### 2. Fonctionnalités

#### Édition
- **Textarea auto-resize** : S'adapte au contenu
- **Placeholder** : "Ajoutez vos notes ici..."
- **Formatage basique** : Support des retours à la ligne, peut-être markdown simple
- **État vide** : Message si aucune note

#### Sauvegarde
- **Auto-save avec debounce** : Sauvegarde automatique après 2-3 secondes d'inactivité
- **Indicateur visuel** : 
  - "Enregistrement..." (pendant la sauvegarde)
  - "Enregistré il y a X secondes" (après sauvegarde)
  - "Erreur de sauvegarde" (en cas d'erreur)
- **Bouton manuel** : Option pour sauvegarder immédiatement

#### Affichage
- **Formatage** : Respect des retours à la ligne (`whitespace-pre-wrap`)
- **Date de dernière modification** : Afficher `updated_at` de l'opportunité
- **État vide** : Message encourageant l'ajout de notes

### 3. Gestion d'État

#### Hook personnalisé : `useOpportunityNotes`
```typescript
- État local pour le texte en cours d'édition
- État de sauvegarde (idle/saving/saved/error)
- Mutation React Query pour update
- Debounce pour auto-save
- Optimistic update
```

#### Flux de données
```
User tape → État local mis à jour
  ↓
Debounce (2-3s)
  ↓
Mutation API (update opportunity.notes)
  ↓
Optimistic update UI
  ↓
Refetch pour avoir les dernières données
```

### 4. API Integration

#### Endpoint existant
- `PUT /v1/commercial/opportunities/{id}` avec `{ notes: string }`
- Utiliser `opportunitiesAPI.update()`

#### Gestion d'erreurs
- Retry automatique en cas d'échec
- Rollback de l'optimistic update
- Message d'erreur clair à l'utilisateur

## 🎨 Design UI/UX

### États visuels

1. **État vide**
   - Textarea avec placeholder
   - Message : "Aucune note pour cette opportunité. Commencez à écrire..."

2. **Édition en cours**
   - Textarea avec focus
   - Bordure highlightée
   - Indicateur "En cours d'édition..."

3. **Sauvegarde**
   - Indicateur de chargement discret
   - Texte : "Enregistrement..."

4. **Sauvegardé**
   - Checkmark vert
   - Texte : "Enregistré il y a X secondes"
   - Disparaît après 5 secondes

5. **Erreur**
   - Message d'erreur rouge
   - Bouton "Réessayer"

### Responsive
- Textarea full-width sur mobile
- Hauteur minimale : 150px
- Hauteur maximale : 400px (avec scroll)

## 📝 Structure de Code

### Fichiers à créer/modifier

1. **Composant** : `apps/web/src/components/commercial/OpportunityNotesEditor.tsx`
   - Composant réutilisable pour l'édition de notes
   - Props : `opportunityId`, `initialNotes`, `onSave`

2. **Hook** : `apps/web/src/hooks/useOpportunityNotes.ts`
   - Gestion de l'état et de la sauvegarde
   - Debounce et optimistic updates

3. **Page** : `apps/web/src/app/[locale]/dashboard/commercial/opportunites/[id]/page.tsx`
   - Intégrer le composant dans l'onglet Notes
   - Remplacer l'affichage statique actuel

## 🔄 Flux Utilisateur

1. **Ouverture de l'onglet Notes**
   - Affiche les notes existantes (si présentes)
   - Textarea prêt pour l'édition

2. **Saisie de texte**
   - L'utilisateur tape dans le textarea
   - Indicateur "En cours d'édition..." apparaît

3. **Auto-save**
   - Après 2-3 secondes d'inactivité
   - Indicateur "Enregistrement..."
   - Puis "Enregistré il y a X secondes"

4. **Sauvegarde manuelle** (optionnel)
   - Bouton "Enregistrer" visible
   - Sauvegarde immédiate au clic

5. **Gestion d'erreur**
   - Si la sauvegarde échoue
   - Message d'erreur + bouton "Réessayer"
   - Les modifications restent dans le textarea

## 🚀 Étapes d'Implémentation

### Phase 1 : MVP (Notes simples)
1. ✅ Créer le composant `OpportunityNotesEditor`
2. ✅ Créer le hook `useOpportunityNotes` avec auto-save
3. ✅ Intégrer dans l'onglet Notes
4. ✅ Gestion d'erreurs basique
5. ✅ Tests de base

### Phase 2 : Améliorations (Optionnel)
1. Support markdown basique (bold, italic, listes)
2. Historique des modifications (si backend supporte)
3. Mentions (@user) pour notifications
4. Pièces jointes dans les notes
5. Recherche dans les notes

## 📊 Métriques de Succès

- ✅ Notes sauvegardées sans popup
- ✅ Auto-save fonctionnel avec feedback visuel
- ✅ Expérience fluide sans interruption
- ✅ Gestion d'erreurs robuste
- ✅ Performance : sauvegarde < 500ms

## 🔐 Sécurité & Validation

- Validation côté client : max 10000 caractères
- Sanitization : Échapper HTML si nécessaire
- Permissions : Vérifier que l'utilisateur peut modifier l'opportunité

## 📱 Responsive

- Mobile : Textarea full-width, boutons empilés
- Desktop : Layout optimisé avec indicateurs visuels

---

## 🎯 Recommandation Finale

**Commencer par l'Option A (Notes simples)** car :
- Utilise l'infrastructure existante
- Implémentation rapide
- Satisfait le besoin immédiat
- Peut être étendu vers Option B plus tard si nécessaire
