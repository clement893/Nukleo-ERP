'use client';

import { useState } from 'react';
import { Alert, Modal, Loading, Skeleton, Progress, Spinner, ToastContainer, useToast, Button, Drawer, Popover, Stepper, Input, Textarea, Banner } from '@/components/ui';
import type { Step } from '@/components/ui';
import { PageHeader, PageContainer, Section, PageNavigation } from '@/components/layout';

export default function FeedbackContent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toasts, showToast } = useToast();

  const stepperSteps: Step[] = [
    { id: '1', label: 'Étape 1', description: 'Informations de base' },
    { id: '2', label: 'Étape 2', description: 'Détails supplémentaires' },
    { id: '3', label: 'Étape 3', description: 'Confirmation' },
  ];

  const startProgress = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  return (
    <PageContainer>
      <PageHeader title="Composants de Feedback" description="Alertes, modales, notifications et indicateurs de statut" breadcrumbs={[{ label: 'Accueil', href: '/' }, { label: 'Composants', href: '/components' }, { label: 'Feedback' }]} />

      <div className="space-y-8">
        <Section title="Alert">
          <div className="space-y-4">
            <Alert variant="success" title="Succès" onClose={() => {}}>L'opération a été effectuée avec succès !</Alert>
            <Alert variant="error" title="Erreur" onClose={() => {}}>Une erreur s'est produite. Veuillez réessayer.</Alert>
            <Alert variant="warning" title="Attention" onClose={() => {}}>Cette action est irréversible. Êtes-vous sûr ?</Alert>
            <Alert variant="info" title="Information" onClose={() => {}}>Nouvelle fonctionnalité disponible dans les paramètres.</Alert>
          </div>
        </Section>

        <Section title="Banner">
          <div className="space-y-4">
            <Banner variant="info" title="Nouvelle fonctionnalité" dismissible onClose={() => {}}>
              Une nouvelle fonctionnalité est maintenant disponible. Découvrez-la dans les paramètres.
            </Banner>
            <Banner variant="success" title="Mise à jour réussie">
              Votre profil a été mis à jour avec succès.
            </Banner>
            <Banner variant="warning" title="Maintenance prévue" dismissible onClose={() => {}}>
              Une maintenance est prévue le 25 décembre de 2h à 4h. Le service sera temporairement indisponible.
            </Banner>
            <Banner variant="error" title="Erreur de connexion" dismissible onClose={() => {}}>
              Impossible de se connecter au serveur. Veuillez réessayer dans quelques instants.
            </Banner>
            <Banner variant="info" fullWidth>
              Message d'information sans titre, pleine largeur.
            </Banner>
          </div>
        </Section>

        <Section title="Modal">
          <div className="space-y-4">
            <Button onClick={() => setIsModalOpen(true)}>Ouvrir la modale</Button>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Confirmer l'action" size="md">
              <p className="mb-4">Êtes-vous sûr de vouloir effectuer cette action ? Cette opération est irréversible.</p>
              <div className="flex gap-4 justify-end">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>Annuler</Button>
                <Button variant="primary" onClick={() => setIsModalOpen(false)}>Confirmer</Button>
              </div>
            </Modal>
            <p className="text-sm text-muted-foreground">Cliquez sur le bouton pour ouvrir une modale de confirmation.</p>
          </div>
        </Section>

        <Section title="Loading">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center"><Loading size="sm" /><p className="mt-2 text-sm text-gray-600">Petit</p></div>
            <div className="text-center"><Loading size="md" /><p className="mt-2 text-sm text-gray-600">Moyen</p></div>
            <div className="text-center"><Loading size="lg" text="Chargement..." /><p className="mt-2 text-sm text-gray-600">Grand avec texte</p></div>
          </div>
        </Section>

        <Section title="Skeleton">
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Skeleton variant="circular" width={48} height={48} />
              <div className="flex-1 space-y-2">
                <Skeleton variant="text" width="60%" height={16} />
                <Skeleton variant="text" width="40%" height={14} />
              </div>
            </div>
            <Skeleton variant="rectangular" width="100%" height={200} />
            <div className="grid grid-cols-3 gap-4">
              <Skeleton variant="rectangular" width="100%" height={100} />
              <Skeleton variant="rectangular" width="100%" height={100} />
              <Skeleton variant="rectangular" width="100%" height={100} />
            </div>
          </div>
        </Section>

        <Section title="Progress">
          <div className="space-y-6">
            <div>
              <Progress value={progress} variant="default" showLabel label="Progression" />
              <Button onClick={startProgress} className="mt-2" size="sm">Démarrer la progression</Button>
            </div>
            <Progress value={75} variant="success" showLabel label="Succès" />
            <Progress value={50} variant="warning" showLabel label="Attention" />
            <Progress value={25} variant="error" showLabel label="Erreur" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Progress value={60} size="sm" />
              <Progress value={60} size="md" />
              <Progress value={60} size="lg" />
            </div>
          </div>
        </Section>

        <Section title="Spinner">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center"><Spinner size="sm" color="primary" /><p className="mt-2 text-sm text-gray-600">Petit - Primary</p></div>
            <div className="text-center"><Spinner size="md" color="secondary" /><p className="mt-2 text-sm text-gray-600">Moyen - Secondary</p></div>
            <div className="text-center bg-foreground p-4 rounded-lg"><Spinner size="lg" color="white" /><p className="mt-2 text-sm text-background">Grand - White</p></div>
          </div>
        </Section>

        <Section title="Toast">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => showToast({ message: 'Opération réussie !', type: 'success' })} variant="primary" size="sm">Toast Success</Button>
              <Button onClick={() => showToast({ message: 'Une erreur s\'est produite', type: 'error' })} variant="primary" size="sm">Toast Error</Button>
              <Button onClick={() => showToast({ message: 'Attention requise', type: 'warning' })} variant="primary" size="sm">Toast Warning</Button>
              <Button onClick={() => showToast({ message: 'Information importante', type: 'info' })} variant="primary" size="sm">Toast Info</Button>
            </div>
            <p className="text-sm text-muted-foreground">Cliquez sur les boutons pour afficher des notifications toast.</p>
          </div>
        </Section>

        <Section title="Stepper">
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold mb-4">Stepper horizontal</h4>
              <Stepper steps={stepperSteps} currentStep={1} />
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4">Stepper vertical</h4>
              <Stepper steps={stepperSteps} currentStep={2} orientation="vertical" />
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4">Stepper avec erreur</h4>
              <Stepper steps={[{ ...stepperSteps[0]!, error: true } as Step, ...stepperSteps.slice(1)]} currentStep={0} />
            </div>
          </div>
        </Section>

        <Section title="Drawer">
          <div className="space-y-4">
            <div className="flex gap-4 flex-wrap">
              <Button onClick={() => setIsDrawerOpen(true)}>Ouvrir Drawer (droite)</Button>
            </div>
            <Drawer
              isOpen={isDrawerOpen}
              onClose={() => setIsDrawerOpen(false)}
              title="Titre du Drawer"
              position="right"
            >
              <div className="space-y-4">
                <p>Ceci est le contenu du drawer. Il peut contenir n'importe quel élément.</p>
                <Input label="Nom" placeholder="Entrez votre nom" />
                <Textarea label="Description" placeholder="Entrez une description" rows={4} />
                <div className="flex gap-2 justify-end pt-4">
                  <Button variant="outline" onClick={() => setIsDrawerOpen(false)}>Annuler</Button>
                  <Button variant="primary" onClick={() => setIsDrawerOpen(false)}>Confirmer</Button>
                </div>
              </div>
            </Drawer>
            <p className="text-sm text-muted-foreground">Le drawer s'ouvre depuis le côté droit de l'écran.</p>
          </div>
        </Section>

        <Section title="Popover">
          <div className="space-y-4">
            <div className="flex gap-4 flex-wrap">
              <Popover
                trigger={<Button>Ouvrir Popover</Button>}
                content={
                  <div className="p-4 space-y-2">
                    <h4 className="font-semibold">Titre du Popover</h4>
                    <p className="text-sm text-muted-foreground">Ceci est le contenu du popover.</p>
                    <Button size="sm" variant="primary">Action</Button>
                  </div>
                }
                open={isPopoverOpen}
                onOpenChange={setIsPopoverOpen}
              />
            </div>
            <p className="text-sm text-muted-foreground">Le popover s'affiche près de l'élément déclencheur.</p>
          </div>
        </Section>
      </div>

      <ToastContainer toasts={toasts} />
      <PageNavigation prev={{ label: 'Navigation', href: '/components/navigation' }} next={{ label: 'Données', href: '/components/data' }} />
    </PageContainer>
  );
}


