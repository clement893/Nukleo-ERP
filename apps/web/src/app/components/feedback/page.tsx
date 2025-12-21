'use client';

import { useState } from 'react';
import { Alert, Modal, Loading, Skeleton, Progress, Spinner, ToastContainer, useToast, Button } from '@/components/ui';
import { PageHeader, PageContainer, Section, PageNavigation } from '@/components/layout';

export default function FeedbackPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toasts, showToast } = useToast();

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
            <p className="text-sm text-gray-600">Cliquez sur le bouton pour ouvrir une modale de confirmation.</p>
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
            <div className="text-center bg-gray-900 p-4 rounded-lg"><Spinner size="lg" color="white" /><p className="mt-2 text-sm text-white">Grand - White</p></div>
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
            <p className="text-sm text-gray-600">Cliquez sur les boutons pour afficher des notifications toast.</p>
          </div>
        </Section>
      </div>

      <ToastContainer toasts={toasts} />
      <PageNavigation prev={{ label: 'Navigation', href: '/components/navigation' }} next={{ label: 'Données', href: '/components/data' }} />
    </PageContainer>
  );
}
