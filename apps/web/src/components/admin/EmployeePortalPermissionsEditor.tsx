'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Checkbox from '@/components/ui/Checkbox';
import Loading from '@/components/ui/Loading';
import Alert from '@/components/ui/Alert';
import { employeePortalPermissionsAPI, type EmployeePortalPermission, type EmployeePortalPermissionSummary } from '@/lib/api/employee-portal-permissions';
import { handleApiError } from '@/lib/errors/api';
import { EMPLOYEE_PORTAL_NAVIGATION } from '@/lib/constants/portal';
import { projectsAPI } from '@/lib/api/projects';
import { contactsAPI } from '@/lib/api/contacts';
import { Plus, Trash2, Save } from 'lucide-react';

interface EmployeePortalPermissionsEditorProps {
  userId: number;
  onUpdate?: () => void;
}

export default function EmployeePortalPermissionsEditor({
  userId,
  onUpdate,
}: EmployeePortalPermissionsEditorProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<EmployeePortalPermissionSummary | null>(null);
  const [permissions, setPermissions] = useState<EmployeePortalPermission[]>([]);
  const [projects, setProjects] = useState<Array<{ id: number; name: string }>>([]);
  const [clients, setClients] = useState<Array<{ id: number; name: string }>>([]);

  // New permission form
  const [newPermission, setNewPermission] = useState<{
    permission_type: 'page' | 'module' | 'project' | 'client';
    resource_id: string;
    can_view: boolean;
    can_edit: boolean;
    can_delete: boolean;
  }>({
    permission_type: 'page',
    resource_id: '',
    can_view: true,
    can_edit: false,
    can_delete: false,
  });

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [summaryData, permissionsData, projectsData, clientsData] = await Promise.all([
        employeePortalPermissionsAPI.getSummary(userId),
        employeePortalPermissionsAPI.list({ user_id: userId }),
        projectsAPI.list({ page: 1, page_size: 1000 }).then(res => res.items || []),
        contactsAPI.list({ page: 1, page_size: 1000 }).then(res => res.items || []),
      ]);

      setSummary(summaryData);
      setPermissions(permissionsData);
      setProjects(projectsData.map(p => ({ id: p.id, name: p.name })));
      setClients(clientsData.map(c => ({ id: c.id, name: `${c.first_name} ${c.last_name}` })));
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors du chargement des permissions');
      showToast({
        message: appError.message || 'Erreur lors du chargement des permissions',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddPermission = async () => {
    if (!newPermission.resource_id) {
      showToast({
        message: 'Veuillez sélectionner une ressource',
        type: 'error',
      });
      return;
    }

    try {
      setSaving(true);
      await employeePortalPermissionsAPI.create({
        user_id: userId,
        permission_type: newPermission.permission_type,
        resource_id: newPermission.resource_id,
        can_view: newPermission.can_view,
        can_edit: newPermission.can_edit,
        can_delete: newPermission.can_delete,
      });

      showToast({
        message: 'Permission ajoutée avec succès',
        type: 'success',
      });

      // Reset form
      setNewPermission({
        permission_type: 'page',
        resource_id: '',
        can_view: true,
        can_edit: false,
        can_delete: false,
      });

      await loadData();
      onUpdate?.();
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de l\'ajout de la permission',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePermission = async (permissionId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette permission ?')) {
      return;
    }

    try {
      setSaving(true);
      await employeePortalPermissionsAPI.delete(permissionId);
      showToast({
        message: 'Permission supprimée avec succès',
        type: 'success',
      });
      await loadData();
      onUpdate?.();
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la suppression',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const getResourceLabel = (permission: EmployeePortalPermission): string => {
    if (permission.resource_id === '*') {
      return 'Tous';
    }

    switch (permission.permission_type) {
      case 'page':
        const pageItem = EMPLOYEE_PORTAL_NAVIGATION.find(item => item.path === permission.resource_id);
        return pageItem ? pageItem.label : permission.resource_id;
      case 'module':
        return permission.resource_id;
      case 'project':
        const project = projects.find(p => p.id === parseInt(permission.resource_id));
        return project ? project.name : `Projet #${permission.resource_id}`;
      case 'client':
        const client = clients.find(c => c.id === parseInt(permission.resource_id));
        return client ? client.name : `Client #${permission.resource_id}`;
      default:
        return permission.resource_id;
    }
  };

  const getResourceOptions = (): Array<{ value: string; label: string }> => {
    switch (newPermission.permission_type) {
      case 'page':
        return [
          { value: '*', label: 'Toutes les pages' },
          ...EMPLOYEE_PORTAL_NAVIGATION.map(item => ({
            value: item.path,
            label: item.label,
          })),
        ];
      case 'module':
        const modules = ['crm', 'orders', 'inventory', 'accounting', 'reports', 'tasks', 'timesheet', 'settings'];
        return [
          { value: '*', label: 'Tous les modules' },
          ...modules.map(m => ({ value: m, label: m.charAt(0).toUpperCase() + m.slice(1) })),
        ];
      case 'project':
        return [
          { value: '*', label: 'Tous les projets' },
          ...projects.map(p => ({ value: p.id.toString(), label: p.name })),
        ];
      case 'client':
        return [
          { value: '*', label: 'Tous les clients' },
          ...clients.map(c => ({ value: c.id.toString(), label: c.name })),
        ];
      default:
        return [];
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      {/* Summary */}
      {summary && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3">Résumé des permissions</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Pages:</span>{' '}
              {summary.pages.length > 0 ? summary.pages.join(', ') : 'Aucune'}
            </div>
            <div>
              <span className="text-muted-foreground">Modules:</span>{' '}
              {summary.modules.length > 0 ? summary.modules.join(', ') : 'Aucun'}
            </div>
            <div>
              <span className="text-muted-foreground">Projets:</span>{' '}
              {summary.all_projects ? 'Tous' : summary.projects.length > 0 ? `${summary.projects.length} projet(s)` : 'Aucun'}
            </div>
            <div>
              <span className="text-muted-foreground">Clients:</span>{' '}
              {summary.all_clients ? 'Tous' : summary.clients.length > 0 ? `${summary.clients.length} client(s)` : 'Aucun'}
            </div>
          </div>
        </Card>
      )}

      {/* Add new permission */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-4">Ajouter une permission</h3>
        <div className="space-y-4">
          <Select
            label="Type de permission"
            value={newPermission.permission_type}
            onChange={(e) => {
              setNewPermission({
                ...newPermission,
                permission_type: e.target.value as any,
                resource_id: '', // Reset resource when type changes
              });
            }}
            options={[
              { value: 'page', label: 'Page' },
              { value: 'module', label: 'Module' },
              { value: 'project', label: 'Projet' },
              { value: 'client', label: 'Client' },
            ]}
            fullWidth
          />

          <Select
            label="Ressource"
            value={newPermission.resource_id}
            onChange={(e) => setNewPermission({ ...newPermission, resource_id: e.target.value })}
            options={getResourceOptions()}
            fullWidth
          />

          <div className="flex gap-4">
            <Checkbox
              label="Voir"
              checked={newPermission.can_view}
              onChange={(e) => setNewPermission({ ...newPermission, can_view: e.target.checked })}
            />
            <Checkbox
              label="Modifier"
              checked={newPermission.can_edit}
              onChange={(e) => setNewPermission({ ...newPermission, can_edit: e.target.checked })}
            />
            <Checkbox
              label="Supprimer"
              checked={newPermission.can_delete}
              onChange={(e) => setNewPermission({ ...newPermission, can_delete: e.target.checked })}
            />
          </div>

          <Button
            onClick={handleAddPermission}
            loading={saving}
            size="sm"
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter
          </Button>
        </div>
      </Card>

      {/* Existing permissions */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-4">Permissions existantes</h3>
        {permissions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucune permission configurée
          </p>
        ) : (
          <div className="space-y-2">
            {permissions.map((permission) => (
              <div
                key={permission.id}
                className="flex items-center justify-between p-3 border border-border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">{permission.permission_type}</Badge>
                    <span className="font-medium">{getResourceLabel(permission)}</span>
                  </div>
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    {permission.can_view && <span>Voir</span>}
                    {permission.can_edit && <span>Modifier</span>}
                    {permission.can_delete && <span>Supprimer</span>}
                    {!permission.can_view && !permission.can_edit && !permission.can_delete && (
                      <span className="text-red-500">Aucun accès</span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeletePermission(permission.id)}
                  disabled={saving}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
