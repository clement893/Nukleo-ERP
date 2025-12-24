'use client';

// Force dynamic rendering to avoid prerendering issues
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';
import Loading from '@/components/ui/Loading';
import Select from '@/components/ui/Select';
import DataTable, { type Column } from '@/components/ui/DataTable';
import { Plus, Edit, Trash2, Mail, Shield, User } from 'lucide-react';

interface User extends Record<string, unknown> {
  id: string;
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

  // Mock data for demonstration
  const mockUsers: User[] = [
    {
      id: '1',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin',
      is_active: true,
      created_at: '2024-01-15T10:00:00Z',
      last_login: '2024-12-23T14:30:00Z',
    },
    {
      id: '2',
      email: 'manager@example.com',
      name: 'Manager User',
      role: 'manager',
      is_active: true,
      created_at: '2024-02-10T09:00:00Z',
      last_login: '2024-12-22T16:00:00Z',
    },
    {
      id: '3',
      email: 'user@example.com',
      name: 'Regular User',
      role: 'user',
      is_active: true,
      created_at: '2024-03-05T11:00:00Z',
      last_login: '2024-12-20T12:00:00Z',
    },
    {
      id: '4',
      email: 'inactive@example.com',
      name: 'Inactive User',
      role: 'user',
      is_active: false,
      created_at: '2024-01-20T10:00:00Z',
    },
  ];

  // Load users (mock for now)
  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      setUsers(mockUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des utilisateurs');
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

    if (!formData.password.trim() && !selectedUser) {
      setError('Le mot de passe est requis pour créer un utilisateur');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const newUser: User = {
        id: String(Date.now()),
        email: formData.email,
        name: formData.name,
        role: formData.role,
        is_active: true,
        created_at: new Date().toISOString(),
      };

      setUsers([...users, newUser]);
      setShowCreateModal(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création de l\'utilisateur');
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
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const updatedUsers = users.map((u) =>
        u.id === selectedUser.id
          ? {
              ...u,
              email: formData.email,
              name: formData.name,
              role: formData.role,
            }
          : u
      );

      setUsers(updatedUsers);
      setShowEditModal(false);
      setSelectedUser(null);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la modification de l\'utilisateur');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      setUsers(users.filter((u) => u.id !== userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression de l\'utilisateur');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      setLoading(true);
      setError(null);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const updatedUsers = users.map((u) =>
        u.id === user.id ? { ...u, is_active: !u.is_active } : u
      );

      setUsers(updatedUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la modification du statut');
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

  const getRoleBadge = (role: string) => {
    const variants: Record<string, 'success' | 'warning' | 'default'> = {
      admin: 'error',
      manager: 'warning',
      user: 'default',
    };
    return variants[role] || 'default';
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
      render: (value, row) => (
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
      label: 'Rôle',
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
      label: 'Dernière connexion',
      sortable: true,
      render: (value) => (
        <span className="text-gray-600 dark:text-gray-400">
          {value ? new Date(String(value)).toLocaleDateString('fr-FR') : 'Jamais'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Créé le',
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
            title={row.is_active ? 'Désactiver' : 'Activer'}
          >
            {row.is_active ? '✓' : '✗'}
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
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Utilisateurs
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Gérez les utilisateurs et leurs permissions
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
                emptyMessage="Aucun utilisateur trouvé"
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
                  Créer un nouvel utilisateur
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
                      placeholder="••••••••"
                      fullWidth
                    />
                  </div>
                  <div>
                    <Select
                      label="Rôle *"
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
                      Créer
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
                      label="Rôle *"
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
  return (
    <ProtectedRoute>
      <UsersContent />
    </ProtectedRoute>
  );
}

