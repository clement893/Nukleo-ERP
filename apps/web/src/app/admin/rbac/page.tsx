'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { getErrorMessage, getErrorDetail } from '@/lib/error-utils';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Alert from '@/components/ui/Alert';
import Container from '@/components/ui/Container';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Loading from '@/components/ui/Loading';

interface Role {
  id: string;
  name: string;
  permissions: string[];
  description?: string;
}

interface Permission {
  id: string;
  name: string;
  category: string;
  description?: string;
}

export default function RBACPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    if (!user?.is_admin) {
      router.push('/dashboard');
      return;
    }

    loadRoles();
    loadPermissions();
  }, [isAuthenticated, user, router]);

  const loadRoles = async () => {
    try {
      setLoading(true);
      setError('');
      // Note: Replace mock data with actual API call when backend endpoint is ready
      // Example: const response = await rbacAPI.listRoles();
      //          setRoles(response.data);
      
      // Temporary mock data for development
      setRoles([
        { id: '1', name: 'Super Admin', permissions: ['*'], description: 'Accès complet à toutes les fonctionnalités' },
        { id: '2', name: 'Admin', permissions: ['users.read', 'users.write', 'organizations.read', 'organizations.write'], description: 'Gestion des utilisateurs et organisations' },
        { id: '3', name: 'Manager', permissions: ['donateurs.read', 'donateurs.write', 'campagnes.read'], description: 'Gestion des donateurs et campagnes' },
        { id: '4', name: 'User', permissions: ['donateurs.read'], description: 'Accès en lecture seule' },
      ]);
    } catch (err: unknown) {
      setError(getErrorDetail(err) || getErrorMessage(err, 'Error loading permissions'));
    } finally {
      setLoading(false);
    }
  };

  const loadPermissions = async () => {
    try {
      // Note: Replace mock data with actual API call when backend endpoint is ready
      // Example: const response = await rbacAPI.listPermissions();
      //          setPermissions(response.data);
      
      // Mock data for now
      setPermissions([
        { id: 'users.read', name: 'Lire utilisateurs', category: 'Users', description: 'Voir la liste des utilisateurs' },
        { id: 'users.write', name: 'Modifier utilisateurs', category: 'Users', description: 'Créer et modifier des utilisateurs' },
        { id: 'organizations.read', name: 'Lire organisations', category: 'Organizations', description: 'Voir les organisations' },
        { id: 'organizations.write', name: 'Modifier organisations', category: 'Organizations', description: 'Créer et modifier des organisations' },
        { id: 'donateurs.read', name: 'Lire donateurs', category: 'Donateurs', description: 'Voir la liste des donateurs' },
        { id: 'donateurs.write', name: 'Modifier donateurs', category: 'Donateurs', description: 'Créer et modifier des donateurs' },
        { id: 'campagnes.read', name: 'Lire campagnes', category: 'Campagnes', description: 'Voir les campagnes' },
        { id: 'campagnes.write', name: 'Modifier campagnes', category: 'Campagnes', description: 'Créer et modifier des campagnes' },
      ]);
    } catch (err: unknown) {
      const { logger } = require('@/lib/logger');
      logger.error('Error loading permissions', err as Error);
    }
  };

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) {
      setError('Role name is required');
      return;
    }

    try {
      // Note: Replace mock data with actual API call when backend endpoint is ready
      // await rbacAPI.createRole({ name: newRoleName, description: newRoleDescription });
      await loadRoles();
      setShowCreateModal(false);
      setNewRoleName('');
      setNewRoleDescription('');
    } catch (err: unknown) {
      setError(getErrorDetail(err) || getErrorMessage(err, 'Error creating role'));
    }
  };

  if (!isAuthenticated() || !user?.is_admin) {
    return null;
  }

  const permissionsByCategory = permissions.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category]!.push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div className="py-12">
      <Container>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">Gestion RBAC</h1>
          <p className="text-gray-600 dark:text-gray-400">Gestion des rôles et permissions</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          Créer un rôle
        </Button>
      </div>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roles List */}
        <div className="lg:col-span-1">
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Rôles</h2>
              {loading ? (
                <div className="text-center py-8">
                  <Loading />
                </div>
              ) : (
                <div className="space-y-2">
                  {roles.map((role) => (
                    <Button
                      key={role.id}
                      onClick={() => setSelectedRole(role)}
                      variant={selectedRole?.id === role.id ? 'primary' : 'ghost'}
                      className="w-full text-left justify-start h-auto p-3"
                    >
                      <div className="w-full">
                        <div className="font-medium text-gray-900 dark:text-gray-100">{role.name}</div>
                        {role.description && (
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{role.description}</div>
                        )}
                        <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {role.permissions.length} permission{role.permissions.length > 1 ? 's' : ''}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Role Details */}
        <div className="lg:col-span-2">
          {selectedRole ? (
            <Card>
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{selectedRole.name}</h2>
                    {selectedRole.description && (
                      <p className="text-gray-600 dark:text-gray-400 mt-2">{selectedRole.description}</p>
                    )}
                  </div>
                  <Button variant="outline" size="sm">
                    Modifier
                  </Button>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Permissions</h3>
                  <div className="space-y-4">
                    {Object.entries(permissionsByCategory).map(([category, perms]) => (
                      <div key={category}>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{category}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {perms.map((perm) => {
                            const hasPermission = selectedRole.permissions.includes('*') || selectedRole.permissions.includes(perm.id);
                            return (
                              <div
                                key={perm.id}
                                className={`p-3 rounded-lg border-2 ${
                                  hasPermission
                                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
                                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium text-gray-900 dark:text-gray-100">{perm.name}</div>
                                    {perm.description && (
                                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{perm.description}</div>
                                    )}
                                  </div>
                                  {hasPermission && (
                                    <Badge variant="success">✓</Badge>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="py-12 text-center">
                <p className="text-gray-600 dark:text-gray-400">Sélectionnez un rôle pour voir ses permissions</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Create Role Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md m-4">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Créer un nouveau rôle</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nom du rôle *
                  </label>
                  <Input
                    type="text"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    placeholder="Ex: Éditeur"
                    fullWidth
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <Textarea
                    value={newRoleDescription}
                    onChange={(e) => setNewRoleDescription(e.target.value)}
                    rows={3}
                    placeholder="Description du rôle..."
                    fullWidth
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <Button variant="outline" onClick={() => {
                    setShowCreateModal(false);
                    setNewRoleName('');
                    setNewRoleDescription('');
                  }}>
                    Annuler
                  </Button>
                  <Button onClick={handleCreateRole}>
                    Créer
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
      </Container>
    </div>
  );
}

