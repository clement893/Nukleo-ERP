# Guide de Refactoring Card Component

## 🎯 Objectif

Unifier tous les composants Card en un seul composant avec un système de variants.

## 📋 Composants Unifiés

Le nouveau composant `Card` remplace :
- ✅ `Card` (composant de base)
- ✅ `StatsCard` → `Card variant="stats"`
- ✅ `StatusCard` → `Card variant="status"`
- ✅ `PricingCard` → `Card variant="pricing"`
- ✅ Glassmorphism → `Card variant="glass"`

## 🚀 Migration

### Étape 1 : Utiliser les Helpers de Migration (Temporaire)

Pour une migration progressive, utilisez les helpers de compatibilité :

```tsx
// Avant
import StatsCard from '@/components/ui/StatsCard';
import StatusCard from '@/components/ui/StatusCard';
import PricingCard from '@/components/subscriptions/PricingCard';

// Pendant la migration (helpers)
import { StatsCard, StatusCard, PricingCard } from '@/components/ui/Card.migration';

<StatsCard title="Users" value="1234" />
<StatusCard title="Online" description="All systems operational" status="success" />
<PricingCard name="Pro" price={29} features={['Feature 1']} />
```

### Étape 2 : Migrer vers le Nouveau Système

```tsx
// Nouveau système unifié
import Card from '@/components/ui/Card';

// Stats Card
<Card 
  variant="stats"
  statsTitle="Total Users"
  statsValue="1,234"
  statsChange={{ value: 12, type: 'increase', period: 'last month' }}
  statsIcon={<UsersIcon />}
/>

// Status Card
<Card 
  variant="status"
  statusTitle="System Online"
  statusDescription="All systems operational"
  status="success"
/>

// Pricing Card
<Card 
  variant="pricing"
  pricingName="Pro Plan"
  pricingDescription="Perfect for teams"
  pricingPrice={29}
  pricingCurrency="$"
  pricingInterval="/month"
  pricingFeatures={['Feature 1', 'Feature 2']}
  pricingPopular={true}
  pricingButtonText="Get Started"
  pricingButtonAction={() => handleSelectPlan()}
/>

// Glassmorphism Card
<Card variant="glass" title="Glass Card">
  Content with glassmorphism effect
</Card>

// Default Card (comportement actuel)
<Card title="Standard Card" subtitle="Subtitle">
  Content
</Card>
```

## 📚 Variants Disponibles

### `variant="default"`
Card standard avec header, footer, et contenu.

```tsx
<Card title="Title" subtitle="Subtitle" footer={<Button>Action</Button>}>
  Content
</Card>
```

### `variant="stats"`
Card pour afficher des statistiques.

**Props spécifiques :**
- `statsTitle` - Titre de la statistique
- `statsValue` - Valeur (string ou number)
- `statsChange` - Changement avec type et période
- `statsIcon` - Icône à droite
- `statsTrend` - Composant de tendance personnalisé

### `variant="status"`
Card avec statut coloré.

**Props spécifiques :**
- `statusTitle` - Titre du statut
- `statusDescription` - Description
- `status` - Type: `'success' | 'error' | 'warning' | 'info'`

### `variant="pricing"`
Card pour afficher des plans de prix.

**Props spécifiques :**
- `pricingName` - Nom du plan
- `pricingDescription` - Description
- `pricingPrice` - Prix (number)
- `pricingCurrency` - Devise (default: '$')
- `pricingInterval` - Intervalle (default: '/month')
- `pricingFeatures` - Liste de features
- `pricingPopular` - Badge "Most Popular"
- `pricingButtonText` - Texte du bouton
- `pricingButtonAction` - Action du bouton

### `variant="glass"`
Card avec effet glassmorphism.

```tsx
<Card variant="glass" title="Glass Card">
  Content with backdrop blur effect
</Card>
```

### `variant="elevated"`
Card avec ombre plus prononcée.

### `variant="outlined"`
Card avec bordure uniquement, pas de fond.

### `variant="filled"`
Card avec fond rempli (muted background).

## 🔄 Exemples de Migration

### StatsCard

**Avant :**
```tsx
import StatsCard from '@/components/ui/StatsCard';

<StatsCard
  title="Total Users"
  value="1,234"
  change={{ value: 12, type: 'increase', period: 'last month' }}
  icon={<UsersIcon />}
/>
```

**Après :**
```tsx
import Card from '@/components/ui/Card';

<Card
  variant="stats"
  statsTitle="Total Users"
  statsValue="1,234"
  statsChange={{ value: 12, type: 'increase', period: 'last month' }}
  statsIcon={<UsersIcon />}
/>
```

### StatusCard

**Avant :**
```tsx
import StatusCard from '@/components/ui/StatusCard';

<StatusCard
  title="System Online"
  description="All systems operational"
  status="success"
/>
```

**Après :**
```tsx
import Card from '@/components/ui/Card';

<Card
  variant="status"
  statusTitle="System Online"
  statusDescription="All systems operational"
  status="success"
/>
```

### PricingCard

**Avant :**
```tsx
import { PricingCard } from '@/components/subscriptions/PricingCard';

<PricingCard
  plan={{
    id: 1,
    name: "Pro",
    description: "Perfect for teams",
    amount: 2900,
    features: '{"feature1": true, "feature2": true}'
  }}
  onSelect={(id) => handleSelect(id)}
/>
```

**Après :**
```tsx
import Card from '@/components/ui/Card';

<Card
  variant="pricing"
  pricingName="Pro"
  pricingDescription="Perfect for teams"
  pricingPrice={29}
  pricingFeatures={['Feature 1', 'Feature 2']}
  pricingButtonAction={() => handleSelect(1)}
/>
```

## ✅ Checklist de Migration

- [ ] Identifier tous les usages de `StatsCard`
- [ ] Identifier tous les usages de `StatusCard`
- [ ] Identifier tous les usages de `PricingCard`
- [ ] Migrer vers les helpers de migration (`Card.migration`)
- [ ] Tester chaque migration
- [ ] Migrer progressivement vers le nouveau système (`Card` avec variants)
- [ ] Supprimer les anciens composants une fois la migration complète

## 🎨 Intégration avec le Thème

Le nouveau système s'intègre proprement avec le système de thème :

```typescript
// Le thème peut définir des styles pour chaque variant
{
  "components": {
    "card": {
      "variants": {
        "stats": {
          "padding": "1.5rem",
          "shadow": "md"
        },
        "glass": {
          "background": "color-mix(in srgb, var(--color-background) 75%, transparent)",
          "backdropFilter": "blur(12px)"
        }
      }
    }
  }
}
```

## 🐛 Résolution de Problèmes

### Le glassmorphism ne s'affiche pas
- Vérifier que `variant="glass"` est utilisé
- Vérifier que les variables CSS glassmorphism sont définies dans le thème

### Les styles ne s'appliquent pas
- Vérifier que les props spécifiques au variant sont utilisées (ex: `statsTitle` pour `variant="stats"`)
- Vérifier que le variant est correctement spécifié

### Migration progressive
- Utiliser les helpers de migration (`Card.migration`) pour une transition en douceur
- Migrer un composant à la fois
- Tester après chaque migration
