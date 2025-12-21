# Bibliothèque de Composants UI

Une bibliothèque de composants UI complète, typée et documentée pour Next.js 16 avec support du dark mode.

## 📚 Documentation

### Architecture

Cette bibliothèque suit les principes de **Atomic Design** et utilise TypeScript pour une meilleure sécurité de type.

- **Types communs** : Tous les composants partagent des types de base dans `types.ts`
- **Cohérence** : Props standardisées entre composants similaires
- **Dark Mode** : Support complet du dark mode avec Tailwind CSS
- **Accessibilité** : Composants accessibles avec ARIA labels

### Types Communs

Tous les composants utilisent des types de base définis dans `types.ts` :

```typescript
import { ColorVariant, Size, BaseComponentProps } from './types';
```

#### Variants de Couleur

Les composants `Alert`, `Badge` et autres utilisent le même système de variants :

- `default` - Gris neutre
- `success` - Vert pour les succès
- `warning` - Jaune pour les avertissements
- `error` - Rouge pour les erreurs
- `info` - Bleu pour les informations

#### Tailles

Les composants avec prop `size` utilisent :

- `sm` - Petit
- `md` - Moyen (par défaut)
- `lg` - Grand

## 📦 Composants

### Alert

Composant d'alerte pour afficher des messages importants.

```tsx
import Alert from '@/components/ui/Alert';

<Alert variant="success" title="Succès" onClose={() => {}}>
  Votre action a été effectuée avec succès.
</Alert>
```

**Props :**
- `variant?: ColorVariant` - Variant de couleur (default: 'info')
- `title?: string` - Titre de l'alerte
- `onClose?: () => void` - Callback de fermeture
- `icon?: ReactNode` - Icône personnalisée
- `className?: string` - Classes CSS supplémentaires
- `children: ReactNode` - Contenu de l'alerte

### Badge

Badge pour afficher des labels ou des statuts.

```tsx
import Badge from '@/components/ui/Badge';

<Badge variant="success">Actif</Badge>
<Badge variant="error">Inactif</Badge>
```

**Props :**
- `variant?: ColorVariant` - Variant de couleur (default: 'default')
- `className?: string` - Classes CSS supplémentaires
- `children: ReactNode` - Contenu du badge

### Button

Bouton avec plusieurs variants et tailles.

```tsx
import Button from '@/components/ui/Button';

<Button variant="primary" size="md" onClick={() => {}}>
  Cliquer
</Button>
```

**Props :**
- `variant?: ButtonVariant` - Variant du bouton (default: 'primary')
- `size?: Size` - Taille du bouton (default: 'md')
- `disabled?: boolean` - État désactivé
- `className?: string` - Classes CSS supplémentaires
- `children: ReactNode` - Contenu du bouton
- Toutes les props HTML standard de `<button>`

**Variants :**
- `primary` - Bouton principal (bleu)
- `secondary` - Bouton secondaire (gris)
- `outline` - Bouton avec bordure
- `ghost` - Bouton transparent
- `danger` - Bouton de danger (rouge)

### Input

Champ de saisie avec label, erreur et icônes.

```tsx
import Input from '@/components/ui/Input';

<Input
  label="Email"
  type="email"
  placeholder="exemple@email.com"
  error="Email invalide"
  helperText="Entrez votre adresse email"
  leftIcon={<MailIcon />}
/>
```

**Props :**
- `label?: string` - Label du champ
- `error?: string` - Message d'erreur
- `helperText?: string` - Texte d'aide
- `leftIcon?: ReactNode` - Icône à gauche
- `rightIcon?: ReactNode` - Icône à droite
- `fullWidth?: boolean` - Largeur complète
- `className?: string` - Classes CSS supplémentaires
- Toutes les props HTML standard de `<input>`

### Card

Carte pour contenir du contenu.

```tsx
import Card from '@/components/ui/Card';

<Card className="p-6">
  <h2>Titre</h2>
  <p>Contenu de la carte</p>
</Card>
```

**Props :**
- `className?: string` - Classes CSS supplémentaires
- `children: ReactNode` - Contenu de la carte

### Table

Tableau pour afficher des données structurées.

```tsx
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';

<Table>
  <TableHead>
    <TableRow>
      <TableHeader>Nom</TableHeader>
      <TableHeader>Email</TableHeader>
    </TableRow>
  </TableHead>
  <TableBody striped hover>
    <TableRow>
      <TableCell>John Doe</TableCell>
      <TableCell>john@example.com</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

**Props TableBody :**
- `striped?: boolean` - Lignes alternées
- `hover?: boolean` - Effet au survol

### EmptyState

État vide pour indiquer l'absence de données.

```tsx
import EmptyState from '@/components/ui/EmptyState';

<EmptyState
  title="Aucun élément"
  description="Commencez par créer votre premier élément"
  icon={<Icon />}
  action={{
    label: "Créer",
    onClick: () => {}
  }}
/>
```

**Props :**
- `title: string` - Titre de l'état vide
- `description?: string` - Description
- `icon?: ReactNode` - Icône
- `action?: { label: string; onClick: () => void }` - Action
- `className?: string` - Classes CSS supplémentaires

### StatsCard

Carte de statistiques avec valeur et tendance.

```tsx
import StatsCard from '@/components/ui/StatsCard';

<StatsCard
  title="Utilisateurs"
  value={1234}
  change={{
    value: 12,
    type: 'increase',
    period: 'ce mois'
  }}
  icon={<UsersIcon />}
/>
```

**Props :**
- `title: string` - Titre de la statistique
- `value: string | number` - Valeur à afficher
- `change?: { value: number; type: 'increase' | 'decrease'; period?: string }` - Changement
- `icon?: ReactNode` - Icône
- `trend?: ReactNode` - Graphique de tendance
- `className?: string` - Classes CSS supplémentaires

## 🎨 Dark Mode

Tous les composants supportent le dark mode automatiquement via Tailwind CSS. Le thème est géré par le `ThemeProvider` dans `contexts/ThemeContext.tsx`.

```tsx
import { ThemeProvider } from '@/contexts/ThemeContext';

// Dans votre layout
<ThemeProvider>
  <App />
</ThemeProvider>
```

## 🧪 Tests

Les composants sont testés avec Vitest et React Testing Library.

```bash
# Lancer les tests
pnpm test

# Lancer les tests avec UI
pnpm test:ui
```

## 📝 Exemples d'Usage

### Formulaire avec validation

```tsx
import { useState } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!email.includes('@')) {
      setError('Email invalide');
      return;
    }
    // Soumettre le formulaire
  };

  return (
    <form>
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={error}
      />
      <Button onClick={handleSubmit}>Se connecter</Button>
    </form>
  );
}
```

### Liste avec état vide

```tsx
import EmptyState from '@/components/ui/EmptyState';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';

function UserList({ users }) {
  if (users.length === 0) {
    return (
      <EmptyState
        title="Aucun utilisateur"
        description="Créez votre premier utilisateur pour commencer"
        action={{
          label: "Créer un utilisateur",
          onClick: () => {}
        }}
      />
    );
  }

  return (
    <Table>
      {/* ... */}
    </Table>
  );
}
```

## 🔧 Développement

### Ajouter un nouveau composant

1. Créer le fichier dans `components/ui/`
2. Utiliser les types de base depuis `types.ts`
3. Ajouter le support dark mode avec les classes Tailwind
4. Exporter le composant dans `index.ts`
5. Ajouter des tests dans `__tests__/`
6. Documenter dans ce README

### Standards de Code

- Utiliser TypeScript strict
- Props cohérentes avec les autres composants
- Support dark mode obligatoire
- Accessibilité (ARIA labels, keyboard navigation)
- Tests unitaires pour les fonctionnalités principales

## 📚 Ressources

- [Tailwind CSS](https://tailwindcss.com/docs)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
