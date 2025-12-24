'use client';

// Force dynamic rendering to avoid prerendering issues
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';
import Loading from '@/components/ui/Loading';
import Select from '@/components/ui/Select';
import DataTable, { type Column } from '@/components/ui/DataTable';
import { usersAPI } from '@/lib/api';
import { handleApiError } from '@/lib/errors/api';
import { Plus, Edit, Trash2, Mail, Shield, User } from 'lucide-react';

interface UserData extends Record<string, unknown> {
  id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface User extends Record<string, unknown> {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'manager';
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

function UsersContent() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'user' as 'admin' | 'user' | 'manager',
    password: '',
  });

  // Load users from API
  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await usersAPI.getUsers();
      // Transform API response to match UI format
      const transformedUsers: User[] = (response.data || []).map((userData: UserData) => ({
        id: userData.id,
        email: userData.email,
        name: userData.first_name && userData.last_name
          ? `${userData.first_name} ${userData.last_name}`
          : userData.first_name || userData.last_name || userData.email,
        role: 'user' as const, // Default role, can be enhanced with RBAC
        is_active: userData.is_active,
        created_at: userData.created_at,
        updated_at: userData.updated_at,
      }));
      setUsers(transformedUsers);
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  // Initialize users on mount
  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateUser = async () => {
    if (!formData.email.trim() || !formData.name.trim()) {
      setError('L\'email et le nom sont requis');
      return;
    }

    if (!formData.password.trim()) {
      setError('Le mot de passe est requis pour crÃ©er un utilisateur');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      // TODO: Implement user creation endpoint in backend
      // For now, show a message that this feature requires backend implementation
      setError('La crÃ©ation d\'utilisateurs nÃ©cessite l\'implÃ©mentation de l\'endpoint backend. Veuillez utiliser l\'API directement.');
      // await usersAPI.create({ ... });
      // await loadUsers();
      // setShowCreateModal(false);
      // resetForm();
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors de la crÃ©ation de l\'utilisateur');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser || !formData.email.trim() || !formData.name.trim()) {
      setError('L\'email et le nom sont requis');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      // TODO: Implement user update endpoint in backend
      // For now, show a message that this feature requires backend implementation
      setError('La modification d\'utilisateurs nÃ©cessite l\'implÃ©mentation de l\'endpoint backend. Veuillez utiliser l\'API directement.');
      // Parse name into first_name and last_name
      // const nameParts = formData.name.split(' ');
      // await usersAPI.update(selectedUser.id, {
      //   email: formData.email,
      //   first_name: nameParts[0] || null,
      //   last_name: nameParts.slice(1).join(' ') || null,
      // });
      // await loadUsers();
      // setShowEditModal(false);
      // setSelectedUser(null);
      // resetForm();
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors de la modification de l\'utilisateur');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('ÃŠtes-vous sÃ»r de vouloir supprimer cet utilisateur ?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await usersAPI.deleteUser(String(userId));
      
      setUsers(users.filter((u) => u.id !== userId));
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors de la suppression de l\'utilisateur');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (_user: User) => {
    try {
      setLoading(true);
      setError(null);
      // TODO: Implement user update endpoint in backend to toggle is_active
      // For now, show a message that this feature requires backend implementation
      setError('La modification du statut nÃ©cessite l\'implÃ©mentation de l\'endpoint backend. Veuillez utiliser l\'API directement.');
      // await usersAPI.update(user.id, { is_active: !user.is_active });
      // await loadUsers();
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors de la modification du statut');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      name: '',
      role: 'user',
      password: '',
    });
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      name: user.name,
      role: user.role,
      password: '',
    });
    setShowEditModal(true);
  };

  const getRoleBadge = (role: string): 'success' | 'warning' | 'default' | 'error' => {
    const variants: Record<string, 'success' | 'warning' | 'default' | 'error'> = {
      admin: 'error',
      manager: 'warning',
      user: 'default',
    };
    return (variants[role] || 'default') as 'success' | 'warning' | 'default' | 'error';
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: 'Administrateur',
      manager: 'Manager',
      user: 'Utilisateur',
    };
    return labels[role] || role;
  };

  const columns: Column<User>[] = [
    {
      key: 'name',
      label: 'Nom',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
            <User className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          </div>
          <span className="font-medium text-gray-900 dark:text-gray-100">{String(value)}</span>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <Mail className="w-4 h-4" />
          {String(value)}
        </div>
      ),
    },
    {
      key: 'role',
      label: 'RÃ´le',
      sortable: true,
      render: (value) => (
        <Badge variant={getRoleBadge(String(value))}>
          <Shield className="w-3 h-3 mr-1" />
          {getRoleLabel(String(value))}
        </Badge>
      ),
    },
    {
      key: 'is_active',
      label: 'Statut',
      sortable: true,
      render: (value) => (
        <Badge variant={value ? 'success' : 'default'}>
          {value ? 'Actif' : 'Inactif'}
        </Badge>
      ),
    },
    {
      key: 'last_login',
      label: 'DerniÃ¨re connexion',
      sortable: true,
      render: (value) => (
        <span className="text-gray-600 dark:text-gray-400">
          {value ? new Date(String(value)).toLocaleDateString('fr-FR') : 'Jamais'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'CrÃ©Ã© le',
      sortable: true,
      render: (value) => (
        <span className="text-gray-600 dark:text-gray-400">
          {new Date(String(value)).toLocaleDateString('fr-FR')}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_, row) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggleActive(row)}
            className="p-2"
            title={row.is_active ? 'DÃ©sactiver' : 'Activer'}
          >
            {row.is_active ? 'âœ“' : 'âœ—'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEditModal(row)}
            className="p-2"
            title="Modifier"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteUser(row.id)}
            className="p-2 text-red-600 hover:text-red-700"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="py-8">
      <Container>
        <div className="mb-8 flex justify-between items-center">
          <div>
            <p className="text-gray-700 dark:text-gray-300">
              GÃ©rez les utilisateurs et leurs permissions
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nouvel utilisateur
          </Button>
        </div>

        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}

        {loading && users.length === 0 ? (
          <Card>
            <div className="py-12 text-center">
              <Loading />
            </div>
          </Card>
        ) : (
          <Card>
            <div className="p-6">
              <DataTable
                data={users}
                columns={columns}
                pageSize={10}
                searchable={true}
                searchPlaceholder="Rechercher un utilisateur..."
                emptyMessage="Aucun utilisateur trouvÃ©"
                loading={loading}
              />
            </div>
          </Card>
        )}

        {/* Create User Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  CrÃ©er un nouvel utilisateur
                </h2>
                <div className="space-y-4">
                  <div>
                    <Input
                      label="Nom *"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: John Doe"
                      fullWidth
                    />
                  </div>
                  <div>
                    <Input
                      label="Email *"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="user@example.com"
                      fullWidth
                    />
                  </div>
                  <div>
                    <Input
                      label="Mot de passe *"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                      fullWidth
                    />
                  </div>
                  <div>
                    <Select
                      label="RÃ´le *"
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          role: e.target.value as 'admin' | 'user' | 'manager',
                        })
                      }
                      fullWidth
                      options={[
                        { value: 'user', label: 'Utilisateur' },
                        { value: 'manager', label: 'Manager' },
                        { value: 'admin', label: 'Administrateur' },
                      ]}
                    />
                  </div>
                  <div className="flex gap-3 justify-end pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowCreateModal(false);
                        resetForm();
                      }}
                    >
                      Annuler
                    </Button>
                    <Button onClick={handleCreateUser} loading={loading}>
                      CrÃ©er
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Modifier l'utilisateur
                </h2>
                <div className="space-y-4">
                  <div>
                    <Input
                      label="Nom *"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: John Doe"
                      fullWidth
                    />
                  </div>
                  <div>
                    <Input
                      label="Email *"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="user@example.com"
                      fullWidth
                    />
                  </div>
                  <div>
                    <Input
                      label="Nouveau mot de passe (optionnel)"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Laisser vide pour ne pas changer"
                      fullWidth
                    />
                  </div>
                  <div>
                    <Select
                      label="RÃ´le *"
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          role: e.target.value as 'admin' | 'user' | 'manager',
                        })
                      }
                      fullWidth
                      options={[
                        { value: 'user', label: 'Utilisateur' },
                        { value: 'manager', label: 'Manager' },
                        { value: 'admin', label: 'Administrateur' },
                      ]}
                    />
                  </div>
                  <div className="flex gap-3 justify-end pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowEditModal(false);
                        setSelectedUser(null);
                        resetForm();
                      }}
                    >
                      Annuler
                    </Button>
                    <Button onClick={handleEditUser} loading={loading}>
                      Enregistrer
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

export default function UsersPage() {
  return <UsersContent />;
}

