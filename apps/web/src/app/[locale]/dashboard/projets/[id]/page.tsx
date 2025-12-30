'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader, PageContainer } from '@/components/layout';
import { Alert, Loading } from '@/components/ui';
import ProjectDetail from '@/components/projets/ProjectDetail';
import Modal from '@/components/ui/Modal';
import ProjectForm from '@/components/projets/ProjectForm';
import { useProject, useUpdateProject, useDeleteProject } from '@/lib/query/projects';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const projectId = parseInt(params.id as string, 10);
  
  const { data: project, isLoading, error: queryError } = useProject(projectId);
  const updateProjectMutation = useUpdateProject();
  const deleteProjectMutation = useDeleteProject();
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const error = queryError ? handleApiError(queryError).message : null;

  const handleUpdate = async (data: any) => {
    try {
      await updateProjectMutation.mutateAsync({
        id: projectId,
        data,
      });
      setShowEditModal(false);
      showToast({
        message: 'Projet modifié avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la modification du projet',
        type: 'error',
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteProjectMutation.mutateAsync(projectId);
      showToast({
        message: 'Projet supprimé avec succès',
        type: 'success',
      });
      const locale = window.location.pathname.split('/')[1] || 'fr';
      router.push(`/${locale}/dashboard/projets`);
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la suppression du projet',
        type: 'error',
      });
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <PageContainer>
          <PageHeader
            title="Chargement..."
            breadcrumbs={[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Projets', href: '/dashboard/projets' },
              { label: 'Chargement...' },
            ]}
          />
          <div className="py-12 text-center">
            <Loading />
          </div>
        </PageContainer>
      </ProtectedRoute>
    );
  }

  if (error || !project) {
    return (
      <ProtectedRoute>
        <PageContainer>
          <PageHeader
            title="Erreur"
            breadcrumbs={[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Projets', href: '/dashboard/projets' },
              { label: 'Erreur' },
            ]}
          />
          <Alert variant="error">
            {error || 'Projet non trouvé'}
          </Alert>
        </PageContainer>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <PageContainer>
        <PageHeader
          title={project.name}
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Projets', href: '/dashboard/projets' },
            { label: project.name },
          ]}
        />

        {error && (
          <div className="mt-6">
            <Alert variant="error">
              {error}
            </Alert>
          </div>
        )}

        <div className="mt-8">
          <ProjectDetail
            project={project}
            onEdit={() => setShowEditModal(true)}
            onDelete={() => setShowDeleteConfirm(true)}
          />
        </div>

        {/* Edit Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Modifier le projet"
          size="lg"
        >
          <ProjectForm
            project={project}
            onSubmit={handleUpdate}
            onCancel={() => setShowEditModal(false)}
            loading={updateProjectMutation.isPending}
            companies={[]}
            employees={[]}
          />
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          title="Supprimer le projet"
          size="md"
        >
          <div className="space-y-4">
            <p>Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est irréversible.</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm border border-border rounded-md hover:bg-muted"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                disabled={deleteProjectMutation.isPending}
              >
                {deleteProjectMutation.isPending ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </Modal>
      </PageContainer>
    </ProtectedRoute>
  );
}
