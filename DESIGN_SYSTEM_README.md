# Nukleo ERP Design System

## 🎨 Guide de Référence Rapide

Ce document est un guide de référence rapide pour utiliser le design system Nukleo ERP dans vos développements.

---

## 📦 Installation

Le design system est déjà intégré dans le projet. Tous les styles sont disponibles dans `apps/web/src/app/globals.css`.

---

## 🎯 Composants Principaux

### 1. Glassmorphism

Le design system utilise le glassmorphism comme principe de design principal.

#### Classes Disponibles

```css
.glass                    /* Effet de base */
.glass-card              /* Cartes de dashboard */
.glass-sidebar           /* Sidebar de navigation */
.glass-sidebar-enhanced  /* Sidebar premium */
.glass-modal             /* Modals et overlays */
.glass-input             /* Champs de formulaire */
.glass-button            /* Boutons principaux */
.glass-navbar            /* Navigation supérieure */
.glass-dropdown          /* Menus déroulants */
.glass-badge             /* Badges et tags */
.glass-tooltip           /* Info-bulles */
.glass-card-active       /* État actif */
.glass-card-hover        /* État hover */
```

#### Exemple d'Utilisation

```tsx
// Widget de dashboard
<div className="glass-card p-6 rounded-xl">
  <h3 className="text-lg font-bold">Titre du Widget</h3>
  <p className="text-muted-accessible">Description</p>
</div>

// Bouton glassmorphism
<button className="glass-button px-4 py-2 rounded-lg">
  Cliquer ici
</button>

// Badge
<span className="glass-badge px-3 py-1 rounded-full text-sm">
  Nouveau
</span>
```

---

### 2. Typography

Le système utilise **Aktiv Grotesk** comme police principale avec 16 variantes.

#### Font Weights

```css
font-weight: 50;   /* Hairline */
font-weight: 100;  /* Thin */
font-weight: 300;  /* Light */
font-weight: 400;  /* Regular */
font-weight: 500;  /* Medium */
font-weight: 700;  /* Bold */
font-weight: 900;  /* Black */
```

#### Exemple d'Utilisation

```tsx
<h1 className="text-4xl font-black">Titre Principal</h1>
<h2 className="text-2xl font-bold">Sous-titre</h2>
<p className="text-base font-normal">Texte normal</p>
<p className="text-sm font-light text-muted-accessible">Texte secondaire</p>
```

---

### 3. Couleurs (WCAG AA Compliant)

Toutes les couleurs respectent un contraste minimum de 4.5:1.

#### Classes de Couleurs

```css
/* Couleurs accessibles */
.text-muted-accessible     /* gray-500 - 4.6:1 */
.text-success-accessible   /* green-600 - 4.5:1 */
.text-error-accessible     /* red-600 - 4.5:1 */
.text-warning-accessible   /* amber-600 - 4.5:1 */
```

#### Palette de Couleurs

```tsx
// Primary (Bleu)
className="text-blue-600 bg-blue-600"

// Success (Vert)
className="text-success-accessible bg-green-600"

// Error (Rouge)
className="text-error-accessible bg-red-600"

// Warning (Orange)
className="text-warning-accessible bg-amber-600"

// Muted (Gris)
className="text-muted-accessible bg-gray-500"
```

---

### 4. Animations

Le système d'animation utilise Framer Motion et CSS keyframes.

#### Framer Motion Variants

```tsx
import { fadeIn, slideUp, stagger } from '@/lib/animations';

// Fade in
<motion.div variants={fadeIn} initial="initial" animate="animate">
  Contenu
</motion.div>

// Slide up
<motion.div variants={slideUp} initial="initial" animate="animate">
  Contenu
</motion.div>

// Stagger children
<motion.div variants={stagger} initial="initial" animate="animate">
  <motion.div variants={fadeIn}>Item 1</motion.div>
  <motion.div variants={fadeIn}>Item 2</motion.div>
</motion.div>
```

#### CSS Animations

```css
/* Classes d'animation disponibles */
.animate-fade-in
.animate-fade-in-up
.animate-slide-in-up
.animate-scale-in
.animate-bounce-in
.animate-pulse
.animate-spin
.animate-ping
.animate-bounce
```

#### Exemple d'Utilisation

```tsx
<div className="animate-fade-in-up">
  Contenu qui apparaît en glissant vers le haut
</div>
```

---

### 5. Icons

Le système utilise **Lucide React** pour toutes les icônes.

#### Import

```tsx
import { Home, User, Settings, Search, Plus } from 'lucide-react';
```

#### Utilisation

```tsx
// Taille standard
<Home className="w-5 h-5" />

// Avec couleur
<User className="w-5 h-5 text-blue-600" />

// Avec animation
<Settings className="w-5 h-5 animate-spin" />

// Avec aria-label pour accessibilité
<Search className="w-5 h-5" aria-label="Rechercher" />
```

---

### 6. Loading States

#### Skeleton Loader

```tsx
import { SkeletonWidget } from '@/components/ui/Skeleton';

// Dans un widget
if (isLoading) {
  return <SkeletonWidget />;
}
```

#### Spinner

```tsx
<div className="flex items-center justify-center h-full">
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
</div>
```

---

### 7. Empty States

```tsx
import EmptyState from '@/components/ui/EmptyState';
import { Users } from 'lucide-react';

// Variante par défaut
<EmptyState
  icon={Users}
  title="Aucun client"
  description="Créez votre premier client pour commencer."
/>

// Variante compacte
<EmptyState
  icon={Users}
  title="Aucun client"
  description="Créez votre premier client pour commencer."
  variant="compact"
/>

// Variante large
<EmptyState
  icon={Users}
  title="Aucun client"
  description="Créez votre premier client pour commencer."
  variant="large"
  action={{
    label: "Créer un client",
    onClick: () => handleCreate()
  }}
/>
```

---

### 8. Accessibilité

#### Skip Link

```tsx
// Déjà implémenté dans le layout
<a href="#main-content" className="skip-link">
  Aller au contenu principal
</a>

<main id="main-content" role="main">
  {/* Contenu */}
</main>
```

#### Focus Indicators

```tsx
// Automatiquement appliqué sur tous les éléments interactifs
<button className="glass-button">
  Bouton avec focus visible
</button>
```

#### Screen Reader Only

```tsx
<span className="sr-only">
  Texte visible uniquement pour les lecteurs d'écran
</span>
```

#### Touch Targets

```tsx
// Cibles tactiles minimum 44x44px
<button className="touch-target">
  <Plus className="w-5 h-5" />
</button>
```

---

## 🎨 Exemples de Composants

### Widget de Dashboard

```tsx
export function MyWidget({ }: WidgetProps) {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  if (isLoading) {
    return <SkeletonWidget />;
  }

  if (data.length === 0) {
    return (
      <EmptyState
        icon={BarChart}
        title="Aucune donnée"
        description="Les données apparaîtront ici."
        variant="compact"
      />
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="glass-badge px-3 py-2 rounded-lg mb-4">
        <h3 className="text-lg font-bold">Titre du Widget</h3>
        <p className="text-sm text-muted-accessible">Description</p>
      </div>

      {/* Content */}
      <div className="flex-1">
        {/* Votre contenu */}
      </div>
    </div>
  );
}
```

---

### Carte avec Glassmorphism

```tsx
<div className="glass-card p-6 rounded-xl hover:glass-card-hover transition-all">
  <div className="flex items-center gap-3 mb-4">
    <div className="glass-badge p-3 rounded-lg">
      <Users className="w-6 h-6 text-blue-600" />
    </div>
    <div>
      <h3 className="text-lg font-bold">Clients</h3>
      <p className="text-sm text-muted-accessible">Total des clients</p>
    </div>
  </div>
  
  <div className="text-3xl font-black text-blue-600">
    {clientCount}
  </div>
</div>
```

---

### Formulaire avec Glassmorphism

```tsx
<form className="space-y-4">
  <div>
    <label className="block text-sm font-medium mb-2">
      Nom du client
    </label>
    <input
      type="text"
      className="glass-input w-full px-4 py-2 rounded-lg"
      placeholder="Entrez le nom"
    />
  </div>

  <div>
    <label className="block text-sm font-medium mb-2">
      Email
    </label>
    <input
      type="email"
      className="glass-input w-full px-4 py-2 rounded-lg"
      placeholder="email@exemple.com"
    />
  </div>

  <button type="submit" className="glass-button px-6 py-3 rounded-lg w-full">
    Enregistrer
  </button>
</form>
```

---

### Graphique avec Glassmorphism

```tsx
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Custom Tooltip
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-tooltip px-3 py-2 rounded-lg shadow-lg">
        <p className="text-sm font-semibold">{payload[0].value}</p>
      </div>
    );
  }
  return null;
};

// Chart Component
<ResponsiveContainer width="100%" height="100%">
  <AreaChart data={data}>
    <defs>
      <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/>
        <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
      </linearGradient>
    </defs>
    <XAxis dataKey="month" stroke="currentColor" className="text-gray-500" />
    <YAxis stroke="currentColor" className="text-gray-500" />
    <Tooltip content={<CustomTooltip />} />
    <Area
      type="monotone"
      dataKey="value"
      stroke="#2563EB"
      fill="url(#gradient)"
      animationDuration={1000}
      animationEasing="ease-out"
    />
  </AreaChart>
</ResponsiveContainer>
```

---

## 🚀 Best Practices

### 1. Glassmorphism

✅ **À faire :**
- Utiliser sur des fonds avec contraste
- Limiter le blur à 8-24px
- Éviter les nested blur effects
- Tester sur appareils low-end

❌ **À éviter :**
- Blur > 32px (performance)
- Glassmorphism sur fond blanc pur
- Trop de layers avec blur
- Blur sur éléments scrollables

---

### 2. Animations

✅ **À faire :**
- Utiliser CSS transforms
- Durée 200-300ms pour micro-interactions
- Respecter prefers-reduced-motion
- Animations subtiles et naturelles

❌ **À éviter :**
- Animations > 600ms
- Trop d'animations simultanées
- Animations sur top/left (performance)
- Ignorer prefers-reduced-motion

---

### 3. Accessibilité

✅ **À faire :**
- Contraste minimum 4.5:1
- Focus visible sur tous les éléments
- ARIA labels sur icônes
- Navigation clavier complète
- Touch targets 44x44px minimum

❌ **À éviter :**
- Couleurs sans contraste suffisant
- Oublier les aria-label
- Ignorer la navigation clavier
- Cibles tactiles < 44x44px

---

### 4. Performance

✅ **À faire :**
- Lazy loading des composants lourds
- React.memo() pour widgets
- useMemo() pour calculs coûteux
- Debounce sur inputs

❌ **À éviter :**
- Re-renders inutiles
- Calculs lourds dans render
- Trop de nested components
- Bundle size non optimisé

---

## 📚 Ressources

### Documentation Complète

- `DESIGN_SYSTEM_REVIEW.md` - Audit du design system
- `PERFORMANCE_OPTIMIZATIONS.md` - Optimisations de performance
- `ACCESSIBILITY_AUDIT.md` - Audit d'accessibilité
- `PHASE_12_FINAL_POLISH_DELIVERY.md` - Rapport de livraison

### Fichiers Clés

- `apps/web/src/app/globals.css` - Tous les styles
- `apps/web/lib/animations.ts` - Animations Framer Motion
- `apps/web/components/ui/EmptyState.tsx` - Empty states
- `apps/web/components/dashboard/` - Widgets de dashboard

### Liens Utiles

- [Tailwind CSS](https://tailwindcss.com/docs)
- [Framer Motion](https://www.framer.com/motion/)
- [Lucide Icons](https://lucide.dev/)
- [Recharts](https://recharts.org/)
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)

---

## 🎯 Support

Pour toute question ou problème avec le design system :

1. Consulter la documentation dans `/DESIGN_SYSTEM_REVIEW.md`
2. Vérifier les exemples dans ce README
3. Contacter l'équipe de développement

---

**Version :** 1.0.0  
**Dernière mise à jour :** 31 décembre 2025  
**Auteur :** Nukleo ERP Team
