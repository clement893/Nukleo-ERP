'use client';

// Force dynamic rendering to avoid static generation
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { getErrorMessage, getErrorDetail } from '@/lib/errors';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Alert from '@/components/ui/Alert';
import Loading from '@/components/ui/Loading';
import Modal from '@/components/ui/Modal';
import RoleForm from '@/components/admin/RoleForm';
import RolePermissionsEditor from '@/components/admin/RolePermissionsEditor';
import { useRoles, usePermissions } from '@/hooks/useRBAC';
import { type Role, type RoleCreate, type RoleUpdate } from '@/lib/api/rbac';
import { logger } from '@/lib/logger';
import { PageHeader, PageContainer } from '@/components/layout';
import { useTranslations } from 'next-intl';

export default function RolesPage() {
  const router = useRouter();
  const t = useTranslations('admin.roles');
  const { isAuthenticated, user } = useAuthStore();
  const { roles, loading: rolesLoading, createRole, updateRole, deleteRole, loadRoles } = useRoles();
  const { loading: permissionsLoading } = usePermissions();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    // Check if user has admin permission (superadmin check)
    if (!user?.is_admin) {
      router.push('/dashboard');
      return;
    }
  }, [isAuthenticated, user, router]);

  const handleCreateRole = async (data: RoleCreate | RoleUpdate) => {
    try {
      setError(null);
      // Type guard to ensure we have RoleCreate (with slug) for creation
      if ('slug' in data) {
        await createRole(data as RoleCreate);
      } else {
        // This shouldn't happen in create mode, but handle it gracefully
        throw new Error('Slug is required for creating a role');
      }
      setShowCreateModal(false);
    } catch (err) {
      logger.error('Failed to create role', err instanceof Error ? err : new Error(String(err)));
      setError(getErrorDetail(err) || getErrorMessage(err, 'Erreur lors de la création du rôle'));
    }
  };

  const handleUpdateRole = async (data: RoleUpdate) => {
    if (!selectedRole) return;
    
    try {
      setError(null);
      await updateRole(selectedRole.id, data);
      setShowEditModal(false);
      setSelectedRole(null);
    } catch (err) {
      logger.error('Failed to update role', err instanceof Error ? err : new Error(String(err)));
      setError(getErrorDetail(err) || getErrorMessage(err, 'Erreur lors de la modification du rôle'));
    }
  };

  const handleDeleteRole = async () => {
    if (!selectedRole) return;
    
    try {
      setDeleting(true);
      setError(null);
      await deleteRole(selectedRole.id);
      setShowDeleteModal(false);
      setSelectedRole(null);
    } catch (err) {
      logger.error('Failed to delete role', err instanceof Error ? err : new Error(String(err)));
      setError(getErrorDetail(err) || getErrorMessage(err, 'Erreur lors de la suppression du rôle'));
    } finally {
      setDeleting(false);
    }
  };

  if (rolesLoading || permissionsLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loading />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={t('title') || 'Gestion des rôles'}
        description={t('description') || 'Créez et gérez les rôles et leurs permissions'}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Admin', href: '/admin' },
          { label: 'Rôles' },
        ]}
      />

      {error && (
        <div className="mt-6">
          <Alert variant="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </div>
      )}

      <div className="mt-8">
        <Card>
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Rôles</h2>
              <Button onClick={() => setShowCreateModal(true)} variant="primary">
                Créer un rôle
              </Button>
            </div>

            {roles.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>Aucun rôle trouvé. Créez votre premier rôle pour commencer.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {roles.map((role) => (
                  <div
                    key={role.id}
                    className="border border-border rounded-lg p-4 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">{role.name}</h3>
                          {role.is_system && (
                            <Badge variant="default">Système</Badge>
                          )}
                          {!role.is_active && (
                            <Badge variant="warning">Inactif</Badge>
                          )}
                        </div>
                        {role.description && (
                          <p className="text-sm text-muted-foreground mt-1">{role.description}</p>
                        )}
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground">
                            {role.permissions?.length || 0} permission(s) assignée(s)
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedRole(role);
                            setShowEditModal(true);
                          }}
                        >
                          Modifier
                        </Button>
                        {!role.is_system && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedRole(role);
                              setShowDeleteModal(true);
                            }}
                          >
                            Supprimer
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Créer un nouveau rôle"
        size="lg"
      >
        <RoleForm
          onSubmit={handleCreateRole}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal && selectedRole !== null}
        onClose={() => {
          setShowEditModal(false);
          setSelectedRole(null);
        }}
        title="Modifier le rôle"
        size="lg"
      >
        {selectedRole && (
          <div className="space-y-6">
            <RoleForm
              role={selectedRole}
              onSubmit={handleUpdateRole}
              onCancel={() => {
                setShowEditModal(false);
                setSelectedRole(null);
              }}
            />
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">Permissions</h3>
              <RolePermissionsEditor
                role={selectedRole}
                onUpdate={() => {
                  loadRoles();
                }}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal && selectedRole !== null}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedRole(null);
        }}
        title="Supprimer le rôle"
        size="md"
      >
        {selectedRole && (
          <div className="space-y-4">
            <p>
              Êtes-vous sûr de vouloir supprimer le rôle <strong>{selectedRole.name}</strong> ?
            </p>
            <p className="text-sm text-muted-foreground">
              Cette action ne peut pas être annulée. Les utilisateurs ayant ce rôle perdront leurs permissions associées.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedRole(null);
                }}
                disabled={deleting}
              >
                Annuler
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteRole}
                disabled={deleting}
              >
                {deleting ? 'Suppression...' : 'Supprimer'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}
