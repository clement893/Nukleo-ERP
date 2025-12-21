/**
 * Exemples d'utilisation des composants UI
 * Ce fichier sert de référence pour l'utilisation correcte des composants
 */

import Alert from './Alert';
import Badge from './Badge';
import Button from './Button';
import Input from './Input';
import Card from './Card';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from './Table';
import EmptyState from './EmptyState';
import StatsCard from './StatsCard';

// ============================================================================
// ALERT EXAMPLES
// ============================================================================

export function AlertExamples() {
  return (
    <div className="space-y-4">
      {/* Alert basique */}
      <Alert variant="info">
        Ceci est un message d'information.
      </Alert>

      {/* Alert avec titre */}
      <Alert variant="success" title="Succès">
        Votre action a été effectuée avec succès.
      </Alert>

      {/* Alert avec fermeture */}
      <Alert
        variant="warning"
        title="Attention"
        onClose={() => console.log('Fermé')}
      >
        Ce message peut être fermé.
      </Alert>

      {/* Alert avec icône personnalisée */}
      <Alert
        variant="error"
        title="Erreur"
        icon={
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        }
      >
        Une erreur s'est produite.
      </Alert>
    </div>
  );
}

// ============================================================================
// BADGE EXAMPLES
// ============================================================================

export function BadgeExamples() {
  return (
    <div className="flex gap-2 flex-wrap">
      <Badge variant="default">Default</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="error">Error</Badge>
      <Badge variant="info">Info</Badge>
    </div>
  );
}

// ============================================================================
// BUTTON EXAMPLES
// ============================================================================

export function ButtonExamples() {
  return (
    <div className="space-y-4">
      {/* Variants */}
      <div className="flex gap-2 flex-wrap">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
      </div>

      {/* Tailles */}
      <div className="flex gap-2 items-center">
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
      </div>

      {/* États */}
      <div className="flex gap-2">
        <Button disabled>Disabled</Button>
        <Button onClick={() => alert('Clicked!')}>Clickable</Button>
      </div>
    </div>
  );
}

// ============================================================================
// INPUT EXAMPLES
// ============================================================================

export function InputExamples() {
  return (
    <div className="space-y-4 max-w-md">
      {/* Input basique */}
      <Input label="Nom" placeholder="Entrez votre nom" />

      {/* Input avec erreur */}
      <Input
        label="Email"
        type="email"
        error="Email invalide"
        placeholder="exemple@email.com"
      />

      {/* Input avec helper text */}
      <Input
        label="Mot de passe"
        type="password"
        helperText="Minimum 8 caractères"
      />

      {/* Input avec icônes */}
      <Input
        label="Recherche"
        leftIcon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        }
        placeholder="Rechercher..."
      />

      {/* Input requis */}
      <Input label="Email" type="email" required />
    </div>
  );
}

// ============================================================================
// TABLE EXAMPLES
// ============================================================================

export function TableExamples() {
  const data = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'User' },
  ];

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeader>Nom</TableHeader>
          <TableHeader>Email</TableHeader>
          <TableHeader>Rôle</TableHeader>
        </TableRow>
      </TableHead>
      <TableBody striped hover>
        {data.map((row) => (
          <TableRow key={row.id}>
            <TableCell>{row.name}</TableCell>
            <TableCell>{row.email}</TableCell>
            <TableCell>
              <Badge variant={row.role === 'Admin' ? 'info' : 'default'}>
                {row.role}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ============================================================================
// EMPTY STATE EXAMPLES
// ============================================================================

export function EmptyStateExamples() {
  return (
    <div className="space-y-4">
      {/* EmptyState basique */}
      <EmptyState
        title="Aucun élément"
        description="Commencez par créer votre premier élément"
      />

      {/* EmptyState avec action */}
      <EmptyState
        title="Aucun utilisateur"
        description="Créez votre premier utilisateur pour commencer"
        icon={
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        }
        action={{
          label: 'Créer un utilisateur',
          onClick: () => console.log('Create user'),
        }}
      />
    </div>
  );
}

// ============================================================================
// STATS CARD EXAMPLES
// ============================================================================

export function StatsCardExamples() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatsCard
        title="Utilisateurs"
        value={1234}
        change={{
          value: 12,
          type: 'increase',
          period: 'ce mois',
        }}
        icon={
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        }
      />
      <StatsCard
        title="Revenus"
        value="€45,231"
        change={{
          value: 8,
          type: 'increase',
          period: 'ce mois',
        }}
      />
      <StatsCard
        title="Commandes"
        value={89}
        change={{
          value: 5,
          type: 'decrease',
          period: 'ce mois',
        }}
      />
    </div>
  );
}

// ============================================================================
// FORM EXAMPLE (Combinaison de composants)
// ============================================================================

export function FormExample() {
  return (
    <Card className="p-6 max-w-md">
      <h2 className="text-2xl font-bold mb-4">Connexion</h2>
      <form className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="exemple@email.com"
          required
        />
        <Input
          label="Mot de passe"
          type="password"
          helperText="Minimum 8 caractères"
          required
        />
        <Button type="submit" variant="primary" className="w-full">
          Se connecter
        </Button>
      </form>
    </Card>
  );
}

