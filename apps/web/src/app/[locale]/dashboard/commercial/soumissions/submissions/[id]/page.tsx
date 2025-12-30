'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout';
import { Card, Button, Alert, Loading, Badge } from '@/components/ui';
import { submissionsAPI, type Submission, type SubmissionUpdate, type SubmissionCreate } from '@/lib/api/submissions';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import { ArrowLeft, Edit } from 'lucide-react';
import MotionDiv from '@/components/motion/MotionDiv';
import SubmissionWizard, { type SubmissionWizardData } from '@/components/commercial/SubmissionWizard';
import Modal from '@/components/ui/Modal';

export default function SubmissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const submissionId = params.id as string;
  
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadSubmission = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const id = parseInt(submissionId, 10);
      if (isNaN(id)) {
        throw new Error('Invalid submission ID');
      }
      
      const data = await submissionsAPI.get(id);
      setSubmission(data);
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors du chargement de la soumission');
      showToast({
        message: appError.message || 'Erreur lors du chargement de la soumission',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [submissionId, showToast]);

  useEffect(() => {
    if (submissionId) {
      loadSubmission();
    }
  }, [submissionId, loadSubmission]);

  const handleUpdate = async (submissionData: SubmissionUpdate) => {
    try {
      setSaving(true);
      setError(null);
      
      const id = parseInt(submissionId, 10);
      const updatedSubmission = await submissionsAPI.update(id, submissionData);
      setSubmission(updatedSubmission);
      setShowEditModal(false);
      showToast({
        message: 'Soumission mise à jour avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors de la mise à jour de la soumission');
      showToast({
        message: appError.message || 'Erreur lors de la mise à jour de la soumission',
        type: 'error',
      });
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = async (submissionData: SubmissionUpdate) => {
    try {
      setSaving(true);
      setError(null);
      
      const id = parseInt(submissionId, 10);
      const draftData = { ...submissionData, status: 'draft' };
      const updatedSubmission = await submissionsAPI.update(id, draftData);
      setSubmission(updatedSubmission);
      setShowEditModal(false);
      showToast({
        message: 'Brouillon sauvegardé avec succès',
        type: 'success',
      });
      return updatedSubmission;
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors de la sauvegarde du brouillon');
      showToast({
        message: appError.message || 'Erreur lors de la sauvegarde du brouillon',
        type: 'error',
      });
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // Helper function to safely render text values (handles objects that might be passed as strings)
  const renderTextValue = (value: any): string => {
    if (typeof value === 'string') {
      return value;
    }
    if (value && typeof value === 'object') {
      // If it's an object with a 'description' property, use that
      if ('description' in value && typeof value.description === 'string') {
        return value.description;
      }
      // Otherwise, stringify it
      return JSON.stringify(value, null, 2);
    }
    return String(value || '');
  };

  // Convert submission to wizard data format
  const submissionToWizardData = (sub: Submission): SubmissionWizardData | null => {
    if (!sub.content || typeof sub.content !== 'object') {
      return null;
    }
    
    const content = sub.content as Record<string, any>;
    
    return {
      coverTitle: content.coverTitle || sub.title || '',
      coverSubtitle: content.coverSubtitle || '',
      coverDate: content.coverDate || new Date().toISOString().split('T')[0] || '',
      coverClient: content.coverClient || '',
      coverCompany: sub.company_name || '',
      context: content.context || '',
      introduction: content.introduction || '',
      mandate: content.mandate || '',
      objectives: content.objectives || [],
      processSteps: content.processSteps || [],
      budgetItems: content.budgetItems || [],
      budgetTotal: content.budgetTotal || 0,
      currency: content.currency || 'EUR',
      teamMembers: content.teamMembers || [],
      companyId: sub.company_id,
      type: sub.type || '',
      deadline: sub.deadline || null,
    };
  };


  if (loading) {
    return (
      <MotionDiv variant="slideUp" duration="normal" className="space-y-2xl">
        <PageHeader
          title="Chargement..."
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Module Commercial', href: '/dashboard/commercial' },
            { label: 'Soumissions', href: '/dashboard/commercial/soumissions' },
            { label: 'Chargement...' },
          ]}
        />
        <Card>
          <div className="py-12 text-center">
            <Loading />
          </div>
        </Card>
      </MotionDiv>
    );
  }

  if (error || !submission) {
    return (
      <MotionDiv variant="slideUp" duration="normal" className="space-y-2xl">
        <PageHeader
          title="Erreur"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Module Commercial', href: '/dashboard/commercial' },
            { label: 'Soumissions', href: '/dashboard/commercial/soumissions' },
            { label: 'Erreur' },
          ]}
        />
        <Card>
          <Alert variant="error">
            {error || 'Soumission non trouvée'}
          </Alert>
          <div className="mt-4">
            <Button
              onClick={() => router.back()}
              variant="outline"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </div>
        </Card>
      </MotionDiv>
    );
  }

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-500',
    submitted: 'bg-blue-500',
    under_review: 'bg-yellow-500',
    accepted: 'bg-green-500',
    rejected: 'bg-red-500',
  };

  const wizardData = submissionToWizardData(submission);

  return (
    <MotionDiv variant="slideUp" duration="normal" className="space-y-2xl">
      <PageHeader
        title={submission.title || `Soumission ${submission.submission_number}`}
        description={`${submission.submission_number} - ${submission.company_name || 'Sans entreprise'}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Module Commercial', href: '/dashboard/commercial' },
          { label: 'Soumissions', href: '/dashboard/commercial/soumissions' },
          { label: submission.submission_number },
        ]}
      />

      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <div className="flex gap-4 items-center">
        <Button
          onClick={() => router.back()}
          variant="outline"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        
        {submission.status === 'draft' && (
          <Button
            onClick={() => setShowEditModal(true)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Modifier
          </Button>
        )}
        
        <Badge variant="default" className={statusColors[submission.status] || 'bg-gray-500'}>
          {submission.status}
        </Badge>
      </div>

      <Card>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Numéro</label>
              <p className="text-lg font-semibold">{submission.submission_number}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Statut</label>
              <p>
                <Badge variant="default" className={statusColors[submission.status] || 'bg-gray-500'}>
                  {submission.status}
                </Badge>
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Entreprise</label>
              <p className="text-lg">{submission.company_name || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Type</label>
              <p className="text-lg">{submission.type || '-'}</p>
            </div>
            {submission.deadline && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Échéance</label>
                <p className="text-lg">
                  {new Date(submission.deadline).toLocaleDateString('fr-FR')}
                </p>
              </div>
            )}
            {submission.submitted_at && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Soumis le</label>
                <p className="text-lg">
                  {new Date(submission.submitted_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
            )}
          </div>

          {submission.description && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Description</label>
              <p className="text-lg whitespace-pre-wrap">{renderTextValue(submission.description)}</p>
            </div>
          )}

          {submission.notes && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Notes</label>
              <p className="text-lg whitespace-pre-wrap">{renderTextValue(submission.notes)}</p>
            </div>
          )}

          {wizardData && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Contenu de la soumission</h3>
              <div className="space-y-4">
                {wizardData.coverTitle && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Titre</label>
                    <p className="text-lg">{wizardData.coverTitle}</p>
                  </div>
                )}
                {wizardData.context && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Contexte</label>
                    <p className="text-lg whitespace-pre-wrap">{wizardData.context}</p>
                  </div>
                )}
                {wizardData.introduction && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Introduction</label>
                    <p className="text-lg whitespace-pre-wrap">{wizardData.introduction}</p>
                  </div>
                )}
                {wizardData.mandate && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Mandat</label>
                    <p className="text-lg whitespace-pre-wrap">{wizardData.mandate}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Edit Modal */}
      {wizardData && (
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Modifier la soumission"
          size="full"
        >
          <SubmissionWizard
            initialData={wizardData}
            onSubmit={async (data: SubmissionCreate) => {
              const updateData: SubmissionUpdate = data;
              await handleUpdate(updateData);
            }}
            onCancel={() => setShowEditModal(false)}
            onSaveDraft={async (data: SubmissionCreate) => {
              const updateData: SubmissionUpdate = data;
              await handleSaveDraft(updateData);
            }}
            loading={saving}
          />
        </Modal>
      )}
    </MotionDiv>
  );
}
