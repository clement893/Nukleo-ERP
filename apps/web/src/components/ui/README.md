# Composants UI Réutilisables

Cette bibliothèque contient une collection complète de composants réutilisables pour construire des applications SaaS modernes avec Next.js 16 et React 19.

## 📦 Installation

Les composants sont déjà disponibles dans le projet. Importez-les depuis `@/components/ui` :

```tsx
import { Button, Input, Modal } from '@/components/ui';
```

## 🎨 Composants Disponibles

### 📝 Composants de Formulaire

#### Input
Composant d'input textuel avec support pour labels, erreurs, icônes et validation.

```tsx
import { Input } from '@/components/ui';

<Input
  label="Email"
  type="email"
  placeholder="votre@email.com"
  error={errors.email}
  helperText="Nous ne partagerons jamais votre email"
  required
/>
```

#### Textarea
Zone de texte multiligne.

```tsx
import { Textarea } from '@/components/ui';

<Textarea
  label="Description"
  rows={4}
  placeholder="Décrivez votre projet..."
/>
```

#### Select
Menu déroulant avec options.

```tsx
import { Select } from '@/components/ui';

<Select
  label="Pays"
  options={[
    { value: 'fr', label: 'France' },
    { value: 'us', label: 'États-Unis' },
  ]}
  placeholder="Sélectionnez un pays"
/>
```

#### Checkbox
Case à cocher.

```tsx
import { Checkbox } from '@/components/ui';

<Checkbox
  label="J'accepte les conditions"
  checked={accepted}
  onChange={(e) => setAccepted(e.target.checked)}
/>
```

#### Radio
Bouton radio.

```tsx
import { Radio } from '@/components/ui';

<Radio
  label="Option 1"
  name="option"
  value="1"
  checked={selected === '1'}
/>
```

#### Switch
Interrupteur toggle.

```tsx
import { Switch } from '@/components/ui';

<Switch
  label="Notifications activées"
  checked={notifications}
  onChange={(e) => setNotifications(e.target.checked)}
/>
```

#### DatePicker
Sélecteur de date.

```tsx
import { DatePicker } from '@/components/ui';

<DatePicker
  label="Date de naissance"
  format="date"
  value={date}
  onChange={(e) => setDate(e.target.value)}
/>
```

#### FileUpload
Upload de fichiers avec drag & drop.

```tsx
import { FileUpload } from '@/components/ui';

<FileUpload
  label="Téléverser des fichiers"
  accept="image/*"
  multiple
  maxSize={5}
  onFileSelect={(files) => console.log(files)}
/>
```

### 🎯 Boutons et Badges

#### Button
Bouton avec variantes et tailles.

```tsx
import { Button } from '@/components/ui';

<Button variant="primary" size="lg" onClick={handleClick}>
  Cliquer ici
</Button>
```

Variantes : `primary`, `secondary`, `outline`, `ghost`
Tailles : `sm`, `md`, `lg`

#### Badge
Badge pour afficher des statuts ou labels.

```tsx
import { Badge } from '@/components/ui';

<Badge variant="success">Actif</Badge>
```

Variantes : `default`, `success`, `warning`, `error`, `info`

### 🗂️ Navigation

#### Breadcrumbs
Fil d'Ariane pour la navigation.

```tsx
import { Breadcrumbs } from '@/components/ui';

<Breadcrumbs
  items={[
    { label: 'Accueil', href: '/' },
    { label: 'Produits', href: '/products' },
    { label: 'Détails' },
  ]}
/>
```

#### Sidebar
Barre latérale de navigation.

```tsx
import { Sidebar } from '@/components/ui';

<Sidebar
  items={[
    { label: 'Dashboard', href: '/dashboard', icon: <HomeIcon /> },
    { label: 'Utilisateurs', href: '/users', icon: <UsersIcon /> },
  ]}
  currentPath={pathname}
/>
```

#### Tabs
Onglets pour organiser le contenu.

```tsx
import { Tabs, TabList, Tab, TabPanels, TabPanel } from '@/components/ui';

<Tabs defaultTab="tab1">
  <TabList>
    <Tab value="tab1">Onglet 1</Tab>
    <Tab value="tab2">Onglet 2</Tab>
  </TabList>
  <TabPanels>
    <TabPanel value="tab1">Contenu 1</TabPanel>
    <TabPanel value="tab2">Contenu 2</TabPanel>
  </TabPanels>
</Tabs>
```

#### Pagination
Pagination pour les listes.

```tsx
import { Pagination } from '@/components/ui';

<Pagination
  currentPage={page}
  totalPages={10}
  onPageChange={setPage}
/>
```

### 💬 Feedback

#### Alert
Message d'alerte.

```tsx
import { Alert } from '@/components/ui';

<Alert variant="success" title="Succès" onClose={() => {}}>
  Opération réussie !
</Alert>
```

Variantes : `success`, `error`, `warning`, `info`

#### Modal
Fenêtre modale.

```tsx
import { Modal } from '@/components/ui';

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirmer"
  size="md"
>
  <p>Êtes-vous sûr ?</p>
</Modal>
```

Tailles : `sm`, `md`, `lg`, `xl`, `full`

#### Loading
Indicateur de chargement.

```tsx
import { Loading } from '@/components/ui';

<Loading size="lg" text="Chargement..." />
```

#### Skeleton
Placeholder de chargement.

```tsx
import { Skeleton } from '@/components/ui';

<Skeleton variant="rectangular" width="100%" height={200} />
```

#### Progress
Barre de progression.

```tsx
import { Progress } from '@/components/ui';

<Progress
  value={75}
  variant="success"
  showLabel
  label="Progression"
/>
```

#### Spinner
Spinner de chargement.

```tsx
import { Spinner } from '@/components/ui';

<Spinner size="md" color="primary" />
```

#### Toast
Notifications toast.

```tsx
import { ToastContainer, useToast } from '@/components/ui';

function MyComponent() {
  const { toasts, showToast } = useToast();

  return (
    <>
      <button onClick={() => showToast({
        message: 'Succès !',
        type: 'success',
      })}>
        Afficher toast
      </button>
      <ToastContainer toasts={toasts} />
    </>
  );
}
```

### 📊 Affichage de Données

#### Table
Tableau de données.

```tsx
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui';

<Table>
  <TableHead>
    <TableRow>
      <TableHeader>Nom</TableHeader>
      <TableHeader>Email</TableHeader>
    </TableRow>
  </TableHead>
  <TableBody>
    <TableRow>
      <TableCell>John Doe</TableCell>
      <TableCell>john@example.com</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

#### EmptyState
État vide pour les listes.

```tsx
import { EmptyState } from '@/components/ui';

<EmptyState
  title="Aucun résultat"
  description="Essayez de modifier vos filtres"
  action={{
    label: 'Créer un élément',
    onClick: () => {},
  }}
/>
```

#### StatsCard
Carte de statistiques.

```tsx
import { StatsCard } from '@/components/ui';

<StatsCard
  title="Utilisateurs actifs"
  value="1,234"
  change={{
    value: 12,
    type: 'increase',
    period: 'ce mois',
  }}
/>
```

### 🛠️ Utilitaires

#### Avatar
Avatar utilisateur.

```tsx
import { Avatar } from '@/components/ui';

<Avatar
  src="/avatar.jpg"
  name="John Doe"
  size="lg"
  status="online"
/>
```

#### Tooltip
Info-bulle.

```tsx
import { Tooltip } from '@/components/ui';

<Tooltip content="Information utile" position="top">
  <button>Survolez-moi</button>
</Tooltip>
```

#### Dropdown
Menu déroulant.

```tsx
import { Dropdown } from '@/components/ui';

<Dropdown
  trigger={<button>Menu</button>}
  items={[
    { label: 'Option 1', onClick: () => {} },
    { label: 'Option 2', onClick: () => {} },
  ]}
/>
```

#### SearchBar
Barre de recherche.

```tsx
import { SearchBar } from '@/components/ui';

<SearchBar
  placeholder="Rechercher..."
  onSearch={(value) => console.log(value)}
/>
```

#### Accordion
Accordéon pliable.

```tsx
import { Accordion } from '@/components/ui';

<Accordion
  items={[
    {
      title: 'Section 1',
      content: <p>Contenu de la section 1</p>,
    },
    {
      title: 'Section 2',
      content: <p>Contenu de la section 2</p>,
    },
  ]}
/>
```

### 📐 Layout

#### Container
Conteneur avec largeur maximale.

```tsx
import { Container } from '@/components/ui';

<Container maxWidth="xl" padding>
  <p>Contenu</p>
</Container>
```

#### Divider
Séparateur.

```tsx
import { Divider } from '@/components/ui';

<Divider label="OU" />
<Divider vertical />
```

#### Card
Carte de contenu.

```tsx
import { Card } from '@/components/ui';

<Card hover>
  <h2>Titre</h2>
  <p>Contenu</p>
</Card>
```

## 🎨 Personnalisation

Tous les composants utilisent Tailwind CSS et peuvent être personnalisés via les props `className`. Les composants suivent un système de design cohérent avec :

- Couleurs primaires : Bleu (`blue-600`)
- Espacements : Basés sur l'échelle Tailwind
- Typographie : Système de polices par défaut
- Animations : Transitions fluides

## 📚 Bonnes Pratiques

1. **Accessibilité** : Tous les composants incluent les attributs ARIA nécessaires
2. **TypeScript** : Tous les composants sont typés avec TypeScript
3. **Responsive** : Les composants sont responsives par défaut
4. **Performance** : Utilisation de `forwardRef` pour les optimisations
5. **Réutilisabilité** : Composants modulaires et configurables

## 🔧 Développement

Pour ajouter un nouveau composant :

1. Créez le fichier dans `src/components/ui/`
2. Exportez-le dans `src/components/ui/index.ts`
3. Documentez-le dans ce README
4. Ajoutez des tests si nécessaire

## 📝 Notes

- Les composants utilisent `clsx` pour la gestion des classes CSS
- Les composants client-side utilisent `'use client'`
- Les composants sont optimisés pour Next.js 16 App Router

