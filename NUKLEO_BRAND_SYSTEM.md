# Nukleo Brand System - Guide d'Application Complet

**Version:** 1.0  
**Date:** 31 Décembre 2024  
**Philosophie:** "L'identité de l'Intelligence"

---

## 🎨 Palette de Couleurs

### Couleurs Principales

#### 1. Nukleo Purple
- **HEX:** `#523DC9`
- **OKLCH:** `0.45 0.20 280`
- **Usage:** Boutons primaires, liens, accents majeurs, états actifs
- **Tailwind:** `bg-[#523DC9]`, `text-[#523DC9]`, `border-[#523DC9]`

#### 2. Deep Violet
- **HEX:** `#5F2B75`
- **OKLCH:** `0.35 0.15 305`
- **Usage:** Gradients, fonds riches, états hover
- **Tailwind:** `bg-[#5F2B75]`, `text-[#5F2B75]`, `from-[#5F2B75]`

#### 3. Dark Matter
- **HEX:** `#291919`
- **OKLCH:** `0.18 0.03 20`
- **Usage:** Fond principal (dark mode), surfaces sombres
- **Tailwind:** `bg-[#291919]`

### Couleurs Secondaires

#### 4. Crimson Red
- **HEX:** `#6B1817`
- **OKLCH:** `0.30 0.12 25`
- **Usage:** Accents forts, alertes, deadlines urgentes, actions destructives
- **Tailwind:** `bg-[#6B1817]`, `text-[#6B1817]`

#### 5. Soft Lavender
- **HEX:** `#A7A2CF`
- **OKLCH:** `0.75 0.08 280`
- **Usage:** Texte secondaire, bordures subtiles, éléments inactifs
- **Tailwind:** `text-[#A7A2CF]`, `border-[#A7A2CF]/20`

#### 6. Pure White
- **HEX:** `#FFFFFF`
- **OKLCH:** `1 0 0`
- **Usage:** Texte principal, icônes, contraste maximal
- **Tailwind:** `text-white`, `bg-white`

---

## 🌌 Gradients Signature

### Aurora Borealis
**Description:** Mélange fluide de Deep Violet, Nukleo Purple et Crimson Red

**Tailwind:**
```css
bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817]
```

**Usage:**
- Headers de page (hero sections)
- Couvertures de modules
- Backgrounds de cartes importantes
- Splash screens

**Exemple:**
```jsx
<div className="bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] opacity-90">
  {/* Contenu */}
</div>
```

### Texture Grain
**Description:** Overlay de texture pour ajouter de la profondeur tactile

**SVG Noise Filter:**
```jsx
<div className="absolute inset-0 opacity-20" style={{
  backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulance type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
  backgroundSize: '200px 200px'
}} />
```

**Usage:**
- Par-dessus les gradients Aurora Borealis
- Grandes surfaces pour éviter les aplats
- Backgrounds de sections importantes

---

## 🔤 Typographie

### Space Grotesk
**Rôle:** Titres, headings, emphase forte

**Caractéristiques:**
- Géométrique, moderne, technologique
- Excellent pour les grandes tailles
- Forte personnalité

**Poids disponibles:**
- Bold (700) - Titres principaux
- Medium (500) - Sous-titres

**Application:**
```jsx
<h1 className="text-4xl font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
  Titre Principal
</h1>
```

**Tailwind Config:**
```js
// tailwind.config.js
fontFamily: {
  'space': ['Space Grotesk', 'sans-serif'],
}
```

### Inter
**Rôle:** Corps de texte, paragraphes, UI

**Caractéristiques:**
- Lisible, neutre, professionnel
- Optimisé pour les écrans
- Excellent à petites tailles

**Poids disponibles:**
- Regular (400) - Texte standard
- Medium (500) - Emphase légère
- SemiBold (600) - Labels, boutons

**Application:**
```jsx
<p className="text-base">
  Corps de texte en Inter (par défaut)
</p>
```

---

## 🎯 Composants UI

### Boutons

#### Bouton Primaire
```jsx
<button className="px-6 py-3 rounded-xl bg-[#523DC9] text-white hover:bg-[#5F2B75] transition-all hover:scale-105 font-medium">
  Action Primaire
</button>
```

#### Bouton Secondaire
```jsx
<button className="px-6 py-3 rounded-xl bg-[#523DC9]/10 text-[#523DC9] hover:bg-[#523DC9]/20 transition-all hover:scale-105 font-medium border border-[#523DC9]/30">
  Action Secondaire
</button>
```

#### Bouton Ghost
```jsx
<button className="px-6 py-3 rounded-xl bg-white/10 backdrop-blur-sm text-gray-900 dark:text-white hover:bg-white/20 transition-all hover:scale-105 font-medium border border-[#A7A2CF]/30">
  Action Ghost
</button>
```

#### Bouton Danger
```jsx
<button className="px-6 py-3 rounded-xl bg-[#6B1817] text-white hover:bg-[#6B1817]/90 transition-all hover:scale-105 font-medium">
  Action Destructive
</button>
```

#### Bouton Gradient
```jsx
<button className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#5F2B75] to-[#523DC9] text-white hover:opacity-90 transition-all hover:scale-105 font-medium">
  Action Spéciale
</button>
```

### Badges

#### Badge Primaire
```jsx
<span className="px-3 py-1 rounded-lg bg-[#523DC9]/10 text-[#523DC9] border border-[#523DC9]/30 text-sm font-medium">
  Primaire
</span>
```

#### Badge Succès
```jsx
<span className="px-3 py-1 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/30 text-sm font-medium">
  Succès
</span>
```

#### Badge Erreur
```jsx
<span className="px-3 py-1 rounded-lg bg-[#6B1817]/10 text-[#6B1817] border border-[#6B1817]/30 text-sm font-medium">
  Erreur
</span>
```

#### Badge Attention
```jsx
<span className="px-3 py-1 rounded-lg bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30 text-sm font-medium">
  Attention
</span>
```

### Cards

#### Card Standard (Glassmorphism)
```jsx
<div className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:scale-[1.02] transition-all">
  {/* Contenu */}
</div>
```

#### Card avec Gradient Aurora
```jsx
<div className="relative rounded-xl overflow-hidden">
  <div className="absolute inset-0 bg-gradient-to-br from-[#5F2B75] to-[#523DC9] opacity-90" />
  <div className="relative p-6">
    {/* Contenu */}
  </div>
</div>
```

#### Card Interactive
```jsx
<div className="glass-card p-6 rounded-xl border border-[#523DC9]/30 hover:border-[#523DC9] hover:shadow-lg hover:shadow-[#523DC9]/20 transition-all">
  {/* Contenu */}
</div>
```

### Headers avec Aurora Borealis

```jsx
<div className="relative mb-8 rounded-2xl overflow-hidden">
  {/* Aurora Borealis Gradient */}
  <div className="absolute inset-0 bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] opacity-90" />
  
  {/* Grain Texture */}
  <div className="absolute inset-0 opacity-20" style={{
    backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
    backgroundSize: '200px 200px'
  }} />
  
  {/* Contenu */}
  <div className="relative p-8">
    <h1 className="text-4xl font-black text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
      Titre de la Page
    </h1>
    <p className="text-white/80 text-lg mt-2">
      Description de la page
    </p>
  </div>
</div>
```

---

## 📋 Guide d'Application par Page

### 1. Remplacer les Couleurs Bleues

**Avant:**
```jsx
className="bg-blue-600 text-white"
className="text-blue-600"
className="border-blue-500"
```

**Après:**
```jsx
className="bg-[#523DC9] text-white"
className="text-[#523DC9]"
className="border-[#523DC9]"
```

### 2. Ajouter Aurora Borealis aux Headers

**Avant:**
```jsx
<div className="bg-gray-100 dark:bg-gray-800 p-8">
  <h1>Titre</h1>
</div>
```

**Après:**
```jsx
<div className="relative rounded-2xl overflow-hidden">
  <div className="absolute inset-0 bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] opacity-90" />
  <div className="absolute inset-0 opacity-20" style={{...grain texture...}} />
  <div className="relative p-8">
    <h1 className="text-white font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
      Titre
    </h1>
  </div>
</div>
```

### 3. Mettre à Jour les Glass Cards

**Avant:**
```jsx
className="glass-card border border-gray-200/50 dark:border-gray-700/50"
```

**Après:**
```jsx
className="glass-card border border-[#A7A2CF]/20"
```

### 4. Appliquer Space Grotesk aux Titres

**Avant:**
```jsx
<h1 className="text-3xl font-black">Titre</h1>
```

**Après:**
```jsx
<h1 className="text-3xl font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
  Titre
</h1>
```

### 5. Utiliser Crimson Red pour Urgences

**Avant:**
```jsx
className="text-red-600"
className="bg-red-500/10"
```

**Après:**
```jsx
className="text-[#6B1817]"
className="bg-[#6B1817]/10 border border-[#6B1817]/30"
```

---

## ✅ Checklist d'Application

### Pour Chaque Page

- [ ] Remplacer les bleus par Nukleo Purple (#523DC9)
- [ ] Ajouter gradient Aurora Borealis au header
- [ ] Appliquer Space Grotesk aux h1, h2, h3
- [ ] Mettre à jour les bordures en Soft Lavender (#A7A2CF/20)
- [ ] Utiliser Crimson Red (#6B1817) pour urgences/erreurs
- [ ] Ajouter texture grain aux gradients
- [ ] Vérifier les hover effects (scale-105, shadow-[#523DC9]/20)
- [ ] Tester le contraste (WCAG AA minimum)
- [ ] Vérifier responsive (mobile, tablet, desktop)
- [ ] Valider l'accessibilité (aria-labels, focus states)

### Pour les Composants

- [ ] Boutons: Utiliser les 5 variantes (primaire, secondaire, ghost, danger, gradient)
- [ ] Badges: Couleurs cohérentes avec le système
- [ ] Cards: Glassmorphism avec bordures Soft Lavender
- [ ] Icons: Lucide React avec couleurs Nukleo
- [ ] Inputs: Focus ring en Nukleo Purple
- [ ] Modals: Backdrop blur avec overlay violet

---

## 🎯 Exemples d'Application

### Dashboard
- Header avec Aurora Borealis
- KPI cards avec glassmorphism et bordures Soft Lavender
- Graphiques avec palette Nukleo (violet dominant)
- Boutons d'action en Nukleo Purple

### Calendrier
- Header gradient Aurora Borealis
- Jour actuel surligné en Nukleo Purple
- Deadlines urgentes en Crimson Red
- Jours fériés en Deep Violet
- Events en badges colorés

### Contacts
- Photos portrait avec bordure Soft Lavender
- Tags en badges Nukleo
- Actions rapides (Call, Email, WhatsApp) en Nukleo Purple
- Favoris avec étoile Nukleo Purple

### Projets
- Statut en badges colorés (Nukleo Purple pour actif)
- Logos clients avec bordure Soft Lavender
- Progress bars en gradient Aurora Borealis
- Deadlines urgentes en Crimson Red

---

## 🚀 Prochaines Étapes

1. **Phase 1:** Appliquer le brand au Dashboard principal
2. **Phase 2:** Mettre à jour tous les modules (Contacts, Projets, Agenda)
3. **Phase 3:** Refondre les composants UI partagés
4. **Phase 4:** Créer un Storybook avec tous les composants
5. **Phase 5:** Documentation interactive (comme la page brand-demo)

---

## 📚 Ressources

- **Brand Book:** https://nukleobrand-v3ycoqtu.manus.space/
- **Demo Calendrier:** /fr/dashboard/calendrier-demo
- **Demo Brand System:** /fr/dashboard/brand-demo
- **Palette Figma:** [À créer]
- **Kit Média:** [À télécharger depuis le brand book]

---

## 💡 Philosophie

> "Notre identité visuelle n'est pas juste une décoration. C'est le reflet de notre mission : transformer les entreprises grâce à l'intelligence artificielle, avec une approche humaine, éthique et performante."

**Ambiance:** Lumière dans l'obscurité - Mystérieux + Technologique + Élégant

**Mission:** We build complete Digital & AI ecosystems.

---

**Dernière mise à jour:** 31 Décembre 2024  
**Auteur:** Équipe Nukleo  
**Version:** 1.0
