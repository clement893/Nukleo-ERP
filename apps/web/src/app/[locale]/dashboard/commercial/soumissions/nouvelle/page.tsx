'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useRouter } from 'next/navigation';
import { PageContainer } from '@/components/layout';
import { useToast } from '@/components/ui';
import { handleApiError } from '@/lib/errors/api';
import SubmissionWizard from '@/components/commercial/SubmissionWizard';
import { 
  useCreateSubmission,
} from '@/lib/query/submissions';
import { type SubmissionCreate, type Submission } from '@/lib/api/submissions';
import { ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import MotionDiv from '@/components/motion/MotionDiv';

export default function NouvelleSoumissionPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const createSubmissionMutation = useCreateSubmission();

  const handleSubmit = async (data: SubmissionCreate): Promise<Submission | void> => {
    try {
      const submission = await createSubmissionMutation.mutateAsync(data);
      showToast({
        message: 'Soumission créée avec succès',
        type: 'success',
      });
      // Rediriger vers la page de détail ou la liste
      if (submission && typeof submission === 'object' && 'id' in submission) {
        // Utiliser le format de route correct basé sur la structure existante
        const submissionId = (submission as Submission).id;
        router.push(`/dashboard/commercial/soumissions/submissions/${submissionId}`);
      } else {
        router.push('/dashboard/commercial/soumissions');
      }
      return submission;
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la création de la soumission',
        type: 'error',
      });
      throw err;
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/commercial/soumissions');
  };

  const handleSaveDraft = async (data: SubmissionCreate): Promise<Submission | void> => {
    try {
      // S'assurer que le status est draft
      const draftData = { ...data, status: 'draft' as const };
      const submission = await createSubmissionMutation.mutateAsync(draftData);
      showToast({
        message: 'Brouillon sauvegardé avec succès',
        type: 'success',
      });
      return submission;
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la sauvegarde du brouillon',
        type: 'error',
      });
      throw err;
    }
  };

  return (
    <PageContainer maxWidth="full" className="flex flex-col h-screen">
      <MotionDiv variant="slideUp" duration="normal" className="flex flex-col flex-1 min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-nukleo-lavender/20 flex-shrink-0">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Nouvelle soumission
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Créez une nouvelle soumission en suivant les étapes
              </p>
            </div>
          </div>
        </div>

        {/* Wizard Content */}
        <div className="flex-1 min-h-0">
          <SubmissionWizard
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            onSaveDraft={handleSaveDraft}
            loading={createSubmissionMutation.isPending}
            mode="page"
          />
        </div>
      </MotionDiv>
    </PageContainer>
  );
}
