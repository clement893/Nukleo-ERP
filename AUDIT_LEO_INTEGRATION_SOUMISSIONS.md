# Audit : Intégration de Leo dans le Wizard de Soumission

## 📋 État Actuel

### Localisation du Code
- **Page principale** : `apps/web/src/app/[locale]/dashboard/commercial/soumissions/nouvelle/page.tsx`
- **Composant Wizard** : `apps/web/src/components/commercial/SubmissionWizard.tsx`
- **Composant Leo** : `apps/web/src/components/commercial/LeoAssistant.tsx`

### Intégration Actuelle

#### 1. **Mode Desktop (lg et plus)**
- ✅ Leo est intégré dans une sidebar droite (`w-80`) fixe
- ✅ Position : `sticky top-6` pour rester visible lors du scroll
- ✅ Visible par défaut dans le layout

**Code actuel (lignes 549-557)** :
```tsx
<div className="hidden lg:block w-80 flex-shrink-0 border-l border-border pl-6">
  <div className="sticky top-6">
    <LeoAssistant
      context={getStepContext()}
      onTextGenerated={handleTextGenerated}
    />
  </div>
</div>
```

#### 2. **Mode Mobile**
- ⚠️ Leo est caché sur mobile (`hidden lg:block`)
- ⚠️ Une version alternative existe en bas mais utilise le composant flottant
- ⚠️ Le composant `LeoAssistant` utilise un bouton flottant (`fixed bottom-6 right-6`) qui peut être masqué

**Code actuel (lignes 559-565)** :
```tsx
<div className="lg:hidden flex-shrink-0 border-t border-border pt-4">
  <LeoAssistant
    context={getStepContext()}
    onTextGenerated={handleTextGenerated}
  />
</div>
```

### Problèmes Identifiés

#### 🔴 Problèmes Critiques

1. **Leo est caché sur mobile**
   - La classe `hidden lg:block` cache complètement Leo sur les petits écrans
   - La version mobile utilise le composant flottant qui peut être masqué par défaut (`isOpen = false`)

2. **Visibilité réduite**
   - Le bouton flottant nécessite un clic pour s'ouvrir
   - Pas d'indication visuelle claire que Leo est disponible
   - L'utilisateur peut ne pas savoir que l'assistant existe

3. **Expérience utilisateur fragmentée**
   - Deux comportements différents entre desktop et mobile
   - Sur mobile, Leo est en bas de page et peut être scrollé hors de vue
   - Pas de cohérence dans l'interface

#### 🟡 Problèmes Modérés

4. **Contexte limité**
   - Le contexte passé à Leo est basique (`getStepContext()`)
   - Ne contient pas toutes les données du formulaire
   - Pas de suggestions contextuelles avancées

5. **Intégration visuelle**
   - Leo n'est pas intégré visuellement dans le flux du wizard
   - Pas d'indicateur de progression ou de suggestions par étape
   - Manque de guidance proactive

6. **Accessibilité**
   - Le bouton flottant peut être difficile à atteindre sur mobile
   - Pas de raccourci clavier pour ouvrir Leo
   - Pas d'annonce pour les lecteurs d'écran

## 🎯 Plan d'Amélioration

### Phase 1 : Visibilité et Accessibilité (Priorité Haute)

#### 1.1 Intégration dans la Barre de Navigation du Wizard
- **Objectif** : Rendre Leo toujours visible et accessible
- **Solution** : Ajouter un bouton/indicateur Leo dans la barre de progression des étapes
- **Avantages** :
  - Toujours visible quelle que soit la taille d'écran
  - Cohérent avec le design du wizard
  - Accessible sans scroll

**Implémentation** :
```tsx
// Dans la barre de progression, ajouter un bouton Leo
<div className="flex items-center gap-2">
  {/* Étapes existantes */}
  <Button
    variant="outline"
    size="sm"
    onClick={() => setShowLeo(!showLeo)}
    className="ml-auto"
  >
    <Sparkles className="w-4 h-4 mr-2" />
    Assistant Leo
  </Button>
</div>
```

#### 1.2 Panel Contextuel Intégré
- **Objectif** : Intégrer Leo comme un panneau contextuel plutôt qu'un widget flottant
- **Solution** : Créer un panneau coulissant/accordéon qui s'intègre dans le layout
- **Avantages** :
  - Meilleure utilisation de l'espace
  - Cohérent avec le design du wizard
  - Fonctionne bien sur mobile et desktop

**Layout proposé** :
```
┌─────────────────────────────────────────┐
│  [Étapes]                    [Leo Toggle]│
├─────────────────────────────────────────┤
│                                         │
│  Contenu de l'étape                    │
│                                         │
│  ┌─────────────────┬─────────────────┐ │
│  │                 │                 │ │
│  │  Formulaire     │  Leo Assistant  │ │
│  │                 │  (si ouvert)    │ │
│  │                 │                 │ │
│  └─────────────────┴─────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

### Phase 2 : Expérience Utilisateur Améliorée (Priorité Moyenne)

#### 2.1 Suggestions Contextuelles par Étape
- **Objectif** : Proposer des suggestions pertinentes selon l'étape actuelle
- **Solution** : Adapter les suggestions rapides selon le contexte de l'étape

**Suggestions par étape** :
- **Page couverture** : "Génère un titre accrocheur", "Crée un sous-titre professionnel"
- **Contexte** : "Rédige une description du contexte", "Analyse les besoins du client"
- **Introduction** : "Écris une introduction engageante", "Structure l'introduction"
- **Mandat** : "Définis les objectifs du projet", "Décris le périmètre"
- **Processus** : "Détaille les étapes du processus", "Estime les durées"
- **Budget** : "Suggère des postes budgétaires", "Calcule les totaux"
- **Équipe** : "Décris les rôles de l'équipe", "Présente les compétences"

#### 2.2 Auto-complétion Intelligente
- **Objectif** : Suggérer automatiquement du contenu basé sur les données saisies
- **Solution** : Analyser les champs remplis et proposer des améliorations

**Fonctionnalités** :
- Détection automatique des champs vides
- Suggestions basées sur le client sélectionné
- Génération de contenu cohérent avec le reste de la soumission

#### 2.3 Intégration avec les Données du Formulaire
- **Objectif** : Passer plus de contexte à Leo pour des réponses plus pertinentes
- **Solution** : Enrichir le contexte avec toutes les données du formulaire

**Contexte enrichi** :
```typescript
const getEnrichedContext = () => {
  return {
    step: STEPS[currentStep].label,
    client: companies.find(c => c.id === formData.companyId)?.name,
    title: formData.coverTitle,
    context: formData.context,
    introduction: formData.introduction,
    // ... autres champs pertinents
  };
};
```

### Phase 3 : Fonctionnalités Avancées (Priorité Basse)

#### 3.1 Génération Automatique de Contenu
- **Objectif** : Permettre à Leo de remplir automatiquement certaines sections
- **Solution** : Boutons "Générer avec Leo" sur chaque champ de texte

#### 3.2 Révision et Amélioration
- **Objectif** : Permettre à Leo de réviser et améliorer le contenu existant
- **Solution** : Bouton "Améliorer ce texte" sur les textareas

#### 3.3 Templates Intelligents
- **Objectif** : Proposer des templates basés sur le type de soumission
- **Solution** : Intégration avec les templates existants + suggestions Leo

## 📐 Architecture Proposée

### Nouveau Composant : `LeoWizardPanel`

```tsx
interface LeoWizardPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  currentStep: number;
  formData: SubmissionWizardData;
  companies: Company[];
  onTextGenerated: (text: string) => void;
  mode?: 'sidebar' | 'panel' | 'floating';
}
```

### Layout Responsive

**Desktop (≥1024px)** :
- Layout en 2 colonnes : Formulaire (70%) | Leo (30%)
- Leo toujours visible dans la sidebar droite
- Panel collapsible pour économiser l'espace

**Tablet (768px - 1023px)** :
- Layout en colonne unique avec toggle
- Leo en panneau coulissant depuis la droite
- Overlay semi-transparent pour le focus

**Mobile (<768px)** :
- Layout en colonne unique
- Leo en accordéon en bas du formulaire
- Bouton sticky en bas de l'écran pour ouvrir/fermer

## 🎨 Design Proposé

### Indicateur Visuel
- Badge avec icône Sparkles dans la barre de progression
- Animation subtile quand Leo a des suggestions
- Compteur de suggestions disponibles

### Panel Leo
- Design cohérent avec le reste du wizard
- Header avec titre et bouton de fermeture
- Zone de chat avec suggestions contextuelles
- Footer avec input et bouton d'envoi

### États Visuels
- **Fermé** : Bouton compact avec icône
- **Ouvert** : Panel complet avec chat
- **Minimisé** : Barre de titre seulement
- **Chargement** : Indicateur de progression

## 📊 Métriques de Succès

1. **Visibilité** : Leo visible sur 100% des tailles d'écran
2. **Utilisation** : Taux d'utilisation > 30% des soumissions créées
3. **Satisfaction** : Feedback positif sur l'utilité de Leo
4. **Efficacité** : Réduction du temps de création de soumission

## 🚀 Plan d'Implémentation

### Étape 1 : Refactoring du Composant LeoAssistant
- [ ] Créer un nouveau composant `LeoWizardPanel` spécialisé pour le wizard
- [ ] Adapter le design pour s'intégrer dans le layout du wizard
- [ ] Implémenter les modes responsive (sidebar/panel/floating)

### Étape 2 : Intégration dans la Barre de Progression
- [ ] Ajouter un bouton/indicateur Leo dans la barre de progression
- [ ] Implémenter le toggle pour ouvrir/fermer Leo
- [ ] Ajouter des animations de transition

### Étape 3 : Suggestions Contextuelles
- [ ] Créer un système de suggestions par étape
- [ ] Implémenter la détection automatique du contexte
- [ ] Ajouter des suggestions dynamiques basées sur les données

### Étape 4 : Enrichissement du Contexte
- [ ] Passer toutes les données du formulaire à Leo
- [ ] Créer un système de contexte enrichi
- [ ] Optimiser les prompts pour de meilleures réponses

### Étape 5 : Tests et Optimisation
- [ ] Tests sur différentes tailles d'écran
- [ ] Tests d'accessibilité
- [ ] Optimisation des performances
- [ ] Collecte de feedback utilisateur

## 🔧 Modifications Techniques Requises

### Fichiers à Modifier

1. **`SubmissionWizard.tsx`**
   - Ajouter état pour gérer l'ouverture/fermeture de Leo
   - Modifier le layout pour intégrer Leo
   - Enrichir le contexte passé à Leo

2. **`LeoAssistant.tsx`** ou nouveau **`LeoWizardPanel.tsx`**
   - Créer un composant spécialisé pour le wizard
   - Implémenter les différents modes d'affichage
   - Ajouter les suggestions contextuelles

3. **Styles CSS**
   - Ajouter des styles pour le nouveau layout
   - Responsive design pour mobile/tablet/desktop
   - Animations de transition

### Nouvelles Fonctionnalités

1. **Système de suggestions contextuelles**
   - Mapping étape → suggestions
   - Génération dynamique basée sur les données

2. **Enrichissement du contexte**
   - Fonction pour construire le contexte complet
   - Passage des données du formulaire à Leo

3. **Gestion d'état**
   - État pour l'ouverture/fermeture de Leo
   - État pour les suggestions disponibles
   - État pour le mode d'affichage (sidebar/panel/floating)

## 📝 Notes Additionnelles

- **Performance** : Le composant Leo ne doit pas ralentir le wizard
- **Accessibilité** : Respecter les standards WCAG 2.1
- **Internationalisation** : Tous les textes doivent être traduisibles
- **Tests** : Couverture de tests > 80% pour les nouvelles fonctionnalités
