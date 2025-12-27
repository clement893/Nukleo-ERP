'use client';

import { useState } from 'react';
import { Avatar, Tooltip, Dropdown, SearchBar, Accordion, Badge, Button, Autocomplete, TreeView, Container, ToastContainer, useToast, CommandPalette, useCommandPalette, MultiSelect } from '@/components/ui';
import type { AutocompleteOption, TreeNode, Command, MultiSelectOption } from '@/components/ui';
import { PageHeader, PageContainer, Section, PageNavigation } from '@/components/layout';
import { logger } from '@/lib/logger';

export default function UtilsContent() {
  const [searchValue, setSearchValue] = useState('');
  const [multiSelectValue, setMultiSelectValue] = useState<string[]>([]);
  const { toasts, showToast } = useToast();
  
  // Command Palette setup
  const commands: Command[] = [
    {
      id: '1',
      label: 'Créer un utilisateur',
      description: 'Ouvrir le formulaire de création',
      category: 'Actions',
      action: () => alert('Créer un utilisateur'),
      shortcut: '⌘N',
    },
    {
      id: '2',
      label: 'Rechercher',
      description: 'Ouvrir la recherche',
      category: 'Navigation',
      action: () => alert('Rechercher'),
      shortcut: '⌘K',
    },
    {
      id: '3',
      label: 'Paramètres',
      description: 'Ouvrir les paramètres',
      category: 'Navigation',
      action: () => alert('Paramètres'),
      shortcut: '⌘,',
    },
  ];
  const { isOpen: isCommandPaletteOpen, open: openCommandPalette, close: closeCommandPalette } = useCommandPalette();

  const multiSelectOptions: MultiSelectOption[] = [
    { label: 'React', value: 'react', group: 'Frameworks' },
    { label: 'Vue', value: 'vue', group: 'Frameworks' },
    { label: 'Angular', value: 'angular', group: 'Frameworks' },
    { label: 'TypeScript', value: 'typescript', group: 'Languages' },
    { label: 'JavaScript', value: 'javascript', group: 'Languages' },
    { label: 'Python', value: 'python', group: 'Languages' },
  ];

  const autocompleteOptions: AutocompleteOption[] = [
    { label: 'Paris', value: 'paris' },
    { label: 'Lyon', value: 'lyon' },
    { label: 'Marseille', value: 'marseille' },
    { label: 'Toulouse', value: 'toulouse' },
    { label: 'Nice', value: 'nice' },
    { label: 'Nantes', value: 'nantes' },
    { label: 'Strasbourg', value: 'strasbourg' },
  ];

  const treeNodes: TreeNode[] = [
    {
      id: '1',
      label: 'Documents',
      children: [
        { id: '1-1', label: 'Rapport.pdf' },
        { id: '1-2', label: 'Présentation.pptx' },
        { id: '1-3', label: 'Budget.xlsx' },
      ],
    },
    {
      id: '2',
      label: 'Images',
      children: [
        { id: '2-1', label: 'Photo1.jpg' },
        { id: '2-2', label: 'Photo2.jpg' },
        {
          id: '2-3',
          label: 'Sous-dossier',
          children: [
            { id: '2-3-1', label: 'Photo3.jpg' },
            { id: '2-3-2', label: 'Photo4.jpg' },
          ],
        },
      ],
    },
    {
      id: '3',
      label: 'Vidéos',
      children: [
        { id: '3-1', label: 'Video1.mp4' },
        { id: '3-2', label: 'Video2.mp4' },
      ],
    },
  ];

  const accordionItems = [
    { id: 'usage', title: 'Comment utiliser les composants ?', content: <p className="text-muted-foreground">Tous les composants sont disponibles via l'import depuis <code className="bg-muted px-2 py-1 rounded">@/components/ui</code></p> },
    { id: 'customization', title: 'Personnalisation', content: <p className="text-muted-foreground">Chaque composant accepte une prop <code className="bg-muted px-2 py-1 rounded">className</code> pour la personnalisation avec Tailwind CSS.</p> },
    { id: 'accessibility', title: 'Accessibilité', content: <p className="text-muted-foreground">Tous les composants incluent les attributs ARIA nécessaires pour une accessibilité optimale.</p> },
  ];

  return (
    <PageContainer>
      <PageHeader title="Composants Utilitaires" description="Composants helpers et utilitaires pour améliorer l'expérience utilisateur" breadcrumbs={[{ label: 'Accueil', href: '/' }, { label: 'Composants', href: '/components' }, { label: 'Utilitaires' }]} />

      <div className="space-y-8">
        <Section title="Avatar">
          <div className="flex items-center gap-6 flex-wrap">
            <Avatar src="https://i.pravatar.cc/150?img=1" name="John Doe" size="xs" />
            <Avatar src="https://i.pravatar.cc/150?img=2" name="Jane Smith" size="sm" />
            <Avatar src="https://i.pravatar.cc/150?img=3" name="Bob Johnson" size="md" />
            <Avatar src="https://i.pravatar.cc/150?img=4" name="Alice Brown" size="lg" />
            <Avatar name="Charlie Wilson" size="xl" />
            <Avatar name="John Doe" size="md" status="online" />
            <Avatar name="Jane Smith" size="md" status="away" />
            <Avatar name="Bob Johnson" size="md" status="busy" />
            <Avatar name="Alice Brown" size="md" status="offline" />
          </div>
        </Section>

        <Section title="Tooltip">
          <div className="flex gap-4 flex-wrap">
            <Tooltip content="Tooltip en haut" position="top"><Button>Survolez-moi (top)</Button></Tooltip>
            <Tooltip content="Tooltip en bas" position="bottom"><Button>Survolez-moi (bottom)</Button></Tooltip>
            <Tooltip content="Tooltip à gauche" position="left"><Button>Survolez-moi (left)</Button></Tooltip>
            <Tooltip content="Tooltip à droite" position="right"><Button>Survolez-moi (right)</Button></Tooltip>
          </div>
        </Section>

        <Section title="Dropdown">
          <div className="flex gap-4 flex-wrap">
            <Dropdown trigger={<Button variant="outline">Menu déroulant <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></Button>} items={[{ label: 'Éditer', onClick: () => alert('Éditer'), icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg> }, { label: 'Dupliquer', onClick: () => alert('Dupliquer'), icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> }, { divider: true }, { label: 'Supprimer', onClick: () => alert('Supprimer'), icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg> }]} />
            <Dropdown trigger={<Button variant="primary">Actions</Button>} items={[{ label: 'Option 1', onClick: () => {} }, { label: 'Option 2', onClick: () => {} }, { label: 'Option désactivée', onClick: () => {}, disabled: true }]} position="right" />
          </div>
        </Section>

        <Section title="SearchBar">
          <div className="space-y-4">
            <SearchBar placeholder="Rechercher des utilisateurs..." onSearch={(value) => setSearchValue(value)} />
            {searchValue && <p className="text-sm text-muted-foreground">Recherche : <strong>{searchValue}</strong></p>}
            <SearchBar placeholder="Recherche sans bouton clear" showClearButton={false} />
          </div>
        </Section>

        <Section title="Accordion">
          <Accordion items={accordionItems} allowMultiple />
        </Section>

        <Section title="Badge">
          <div className="flex flex-wrap gap-3">
            <Badge variant="default">Default</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="error">Error</Badge>
            <Badge variant="info">Info</Badge>
          </div>
        </Section>

        <Section title="Autocomplete">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold mb-2">Recherche de ville</h4>
              <Autocomplete
                options={autocompleteOptions}
                placeholder="Tapez pour rechercher une ville..."
                minChars={0}
                onSelect={(option) => logger.info('Autocomplete selection', { option })}
              />
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-2">Avec minimum de caractères</h4>
              <Autocomplete
                options={autocompleteOptions}
                placeholder="Tapez au moins 2 caractères..."
                minChars={2}
              />
            </div>
          </div>
        </Section>

        <Section title="TreeView">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold mb-2">Arborescence de fichiers</h4>
              <TreeView nodes={treeNodes} />
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-2">Avec sélection multiple</h4>
              <TreeView nodes={treeNodes} multiSelect />
            </div>
          </div>
        </Section>

        <Section title="Container">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold mb-2">Container avec différentes largeurs</h4>
              <Container maxWidth="sm" className="bg-muted p-4 rounded mb-4">
                <p className="text-sm">Container sm (max-w-screen-sm)</p>
              </Container>
              <Container maxWidth="md" className="bg-muted p-4 rounded mb-4">
                <p className="text-sm">Container md (max-w-screen-md)</p>
              </Container>
              <Container maxWidth="lg" className="bg-muted p-4 rounded mb-4">
                <p className="text-sm">Container lg (max-w-screen-lg)</p>
              </Container>
              <Container maxWidth="xl" className="bg-muted p-4 rounded mb-4">
                <p className="text-sm">Container xl (max-w-screen-xl) - Par défaut</p>
              </Container>
              <Container maxWidth="full" className="bg-muted p-4 rounded">
                <p className="text-sm">Container full (max-w-full)</p>
              </Container>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-2">Container sans padding</h4>
              <Container maxWidth="md" padding={false} className="bg-muted p-4 rounded">
                <p className="text-sm">Container sans padding automatique</p>
              </Container>
            </div>
          </div>
        </Section>

        <Section title="Toast (Composant individuel)">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold mb-2">Exemples de Toast</h4>
              <div className="flex gap-2 flex-wrap">
                <Button onClick={() => showToast({ message: 'Opération réussie !', type: 'success' })} variant="primary" size="sm">Toast Success</Button>
                <Button onClick={() => showToast({ message: 'Une erreur s\'est produite', type: 'error' })} variant="primary" size="sm">Toast Error</Button>
                <Button onClick={() => showToast({ message: 'Attention requise', type: 'warning' })} variant="primary" size="sm">Toast Warning</Button>
                <Button onClick={() => showToast({ message: 'Information importante', type: 'info' })} variant="primary" size="sm">Toast Info</Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Les toasts s'affichent en haut à droite de l'écran.</p>
          </div>
        </Section>

        <Section title="Command Palette (⌘K)">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold mb-2">Palette de commandes moderne</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Appuyez sur <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-xs">⌘K</kbd> ou cliquez sur le bouton pour ouvrir la palette de commandes.
              </p>
              <Button onClick={openCommandPalette} variant="primary">
                Ouvrir Command Palette
              </Button>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                <strong>Fonctionnalités :</strong> Recherche instantanée, navigation au clavier, catégorisation, raccourcis clavier affichés.
              </p>
            </div>
          </div>
        </Section>

        <Section title="MultiSelect avec Tags">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold mb-2">Sélection multiple avec tags</h4>
              <MultiSelect
                options={multiSelectOptions}
                value={multiSelectValue}
                onChange={setMultiSelectValue}
                label="Technologies"
                placeholder="Sélectionnez des technologies..."
                helperText="Vous pouvez sélectionner plusieurs options"
                maxSelected={5}
                searchable
                clearable
              />
              {multiSelectValue.length > 0 && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Sélectionné : {multiSelectValue.join(', ')}
                </p>
              )}
            </div>
          </div>
        </Section>
      </div>

      <CommandPalette commands={commands} isOpen={isCommandPaletteOpen} onClose={closeCommandPalette} />
      <ToastContainer toasts={toasts} />
      <PageNavigation prev={{ label: 'Données', href: '/components/data' }} home={{ label: 'Retour à l\'accueil', href: '/components' }} />
    </PageContainer>
  );
}

