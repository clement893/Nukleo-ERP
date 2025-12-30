'use client';

import { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { getErrorMessage } from '@/lib/errors';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Alert from '@/components/ui/Alert';
import Container from '@/components/ui/Container';
import Input from '@/components/ui/Input';
import Loading from '@/components/ui/Loading';
import Modal from '@/components/ui/Modal';
import DataTable from '@/components/ui/DataTable';
import { Column } from '@/components/ui/DataTable';
import UserRolesEditor from '@/components/admin/UserRolesEditor';
import UserPermissionsEditor from '@/components/admin/UserPermissionsEditor';
import RoleDefaultPermissionsEditor from '@/components/admin/RoleDefaultPermissionsEditor';
import { useUserRoles, useUserPermissions } from '@/hooks/useRBAC';
import { employeesAPI, type Employee } from '@/lib/api/employees';
import { useToast } from '@/components/ui';

interface User extends Record<string, unknown> {
  id: string;
  email: string;
  name: string;
  is_active: boolean;
  is_verified: boolean;
  is_admin?: boolean;
  created_at: string;
  employee?: Employee;
}

export default function AdminUsersContent() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [rolesModalOpen, setRolesModalOpen] = useState(false);
  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false);
  const [employeeLinkModalOpen, setEmployeeLinkModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const employees = await employeesAPI.list(0, 1000);
      setEmployees(employees);
    } catch (err) {
      // Silently fail if employees API is not available
      console.warn('Failed to fetch employees:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { apiClient } = await import('@/lib/api');
      const response = await apiClient.get('/v1/users?page=1&page_size=100');
      
      // Backend returns paginated response: { items: [...], total: ..., page: ..., page_size: ... }
      interface PaginatedResponse<T> {
        data?: T | { items?: T[] };
      }
      const responseData = (response as PaginatedResponse<User[]>).data;
      let usersData: User[] = [];
      
      if (responseData && typeof responseData === 'object') {
        if ('items' in responseData) {
          const items = (responseData as { items?: unknown }).items;
          if (Array.isArray(items) && items.length > 0 && !Array.isArray(items[0])) {
            usersData = items as User[];
          }
        } else if (Array.isArray(responseData)) {
          usersData = responseData as User[];
        }
      }
      
      setUsers(usersData);
    } catch (err) {
      setError(getErrorMessage(err, 'Erreur lors du chargement des utilisateurs'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    try {
      const { apiClient } = await import('@/lib/api');
      await apiClient.delete(`/v1/users/${selectedUser.id}`);

      setUsers(users.filter((u) => u.id !== selectedUser.id));
      setDeleteModalOpen(false);
      setSelectedUser(null);
      
      // Clear any previous errors
      setError(null);
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Erreur lors de la suppression de l\'utilisateur');
      setError(errorMessage);
    }
  };

  const handleLinkEmployee = async () => {
    if (!selectedUser || !selectedEmployeeId) return;

    try {
      setLinking(true);
      setError(null);
      
      // TODO: Implement employee-user linking when backend endpoint is available
      // await employeesAPI.linkToUser(selectedEmployeeId, parseInt(selectedUser.id));
      
      showToast({
        message: 'Fonctionnalité de liaison employé-utilisateur à venir',
        type: 'info',
      });
      
      setEmployeeLinkModalOpen(false);
      setSelectedUser(null);
      setSelectedEmployeeId('');
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Erreur lors de la liaison de l\'employé');
      setError(errorMessage);
      showToast({
        message: errorMessage,
        type: 'error',
      });
    } finally {
      setLinking(false);
    }
  };

  const handleUnlinkEmployee = async (employeeId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir délier cet employé ?')) {
      return;
    }

    try {
      setError(null);
      // TODO: Implement employee-user unlinking when backend endpoint is available
      // await employeesAPI.unlinkFromUser(employeeId);
      
      showToast({
        message: 'Fonctionnalité de déliaison employé-utilisateur à venir',
        type: 'info',
      });
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Erreur lors de la déliaison de l\'employé');
      setError(errorMessage);
      showToast({
        message: errorMessage,
        type: 'error',
      });
    }
  };

  // Get employee linked to a user
  // TODO: Implement when user_id field is added to Employee model
  const getLinkedEmployee = (userId: string): Employee | undefined => {
    // return employees.find(emp => emp.user_id === userId);
    return undefined;
  };

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: Column<User>[] = [
    {
      key: 'email',
      label: 'Email',
      sortable: true,
    },
    {
      key: 'name',
      label: 'Nom',
      sortable: true,
    },
    {
      key: 'is_active',
      label: 'Statut',
      render: (value) => (
        <Badge variant={value ? 'success' : 'default'}>
          {value ? 'Actif' : 'Inactif'}
        </Badge>
      ),
    },
    {
      key: 'roles',
      label: 'Rôles',
      render: (_value, row) => {
        return <UserRolesDisplay userId={parseInt(row.id)} />;
      },
    },
    {
      key: 'permissions',
      label: 'Permissions',
      render: (_value, row) => {
        return <UserPermissionsDisplay userId={parseInt(row.id)} />;
      },
    },
    {
      key: 'employee',
      label: 'Employé',
      render: (_value, row) => {
        const employee = getLinkedEmployee(row.id);
        if (employee) {
          return (
            <div className="flex items-center gap-2">
              <Badge variant="info">
                {employee.first_name} {employee.last_name}
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleUnlinkEmployee(String(employee.id))}
                className="ml-2 text-xs h-6 px-2"
                title="Délier l'employé"
              >
                ✕
              </Button>
            </div>
          );
        }
        return (
          <span className="text-muted-foreground text-xs">Aucun employé lié</span>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_value, row) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedUser(row);
              setRolesModalOpen(true);
            }}
          >
            Rôles
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedUser(row);
              setPermissionsModalOpen(true);
            }}
          >
            Permissions
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedUser(row);
              const linkedEmployee = getLinkedEmployee(row.id);
              setSelectedEmployeeId(linkedEmployee ? String(linkedEmployee.id) : '');
              setEmployeeLinkModalOpen(true);
            }}
          >
            Employé
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => {
              setSelectedUser(row);
              setDeleteModalOpen(true);
            }}
          >
            Supprimer
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <Container className="py-8">
        <Loading />
      </Container>
    );
  }

  return (
    <Container className="py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Gestion des Utilisateurs
        </h1>
        <p className="text-muted-foreground">
          Gérez tous les utilisateurs de la plateforme
        </p>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      <Card className="mb-6">
        <div className="flex gap-4 mb-4">
          <Input
            placeholder="Rechercher par email ou nom..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
        </div>

        <DataTable
          data={filteredUsers}
          columns={columns}
          pageSize={10}
        />
      </Card>

      {/* Role Default Permissions Section */}
      <div className="mb-6">
        <RoleDefaultPermissionsEditor
          onUpdate={() => {
            fetchUsers();
          }}
        />
      </div>

      {/* Roles Modal */}
      <Modal
        isOpen={rolesModalOpen}
        onClose={() => {
          setRolesModalOpen(false);
          setSelectedUser(null);
        }}
        title={`Gérer les rôles - ${selectedUser?.email}`}
        size="lg"
      >
        {selectedUser && (
          <UserRolesEditor
            userId={parseInt(selectedUser.id)}
            onUpdate={() => {
              fetchUsers();
            }}
          />
        )}
      </Modal>

      {/* Permissions Modal */}
      <Modal
        isOpen={permissionsModalOpen}
        onClose={() => {
          setPermissionsModalOpen(false);
          setSelectedUser(null);
        }}
        title={`Gérer les permissions - ${selectedUser?.email}`}
        size="lg"
      >
        {selectedUser && (
          <UserPermissionsEditor
            userId={parseInt(selectedUser.id)}
            onUpdate={() => {
              fetchUsers();
            }}
          />
        )}
      </Modal>

      {/* Employee Link Modal */}
      <Modal
        isOpen={employeeLinkModalOpen}
        onClose={() => {
          setEmployeeLinkModalOpen(false);
          setSelectedUser(null);
          setSelectedEmployeeId('');
        }}
        title={`Lier un employé - ${selectedUser?.email}`}
        size="md"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Sélectionner un employé
              </label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">-- Aucun employé --</option>
                {employees
                  .map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                onClick={() => {
                  setEmployeeLinkModalOpen(false);
                  setSelectedUser(null);
                  setSelectedEmployeeId('');
                }}
                disabled={linking}
              >
                Annuler
              </Button>
              <Button
                onClick={handleLinkEmployee}
                disabled={linking || !selectedEmployeeId}
              >
                {linking ? 'Liaison...' : 'Lier'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedUser(null);
        }}
        title="Confirmer la suppression"
      >
        <p className="mb-4">
          Êtes-vous sûr de vouloir supprimer l'utilisateur{' '}
          <strong>{selectedUser?.email}</strong> ?
        </p>
        <div className="flex gap-2 justify-end">
          <Button
            variant="ghost"
            onClick={() => {
              setDeleteModalOpen(false);
              setSelectedUser(null);
            }}
          >
            Annuler
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Supprimer
          </Button>
        </div>
      </Modal>
    </Container>
  );
}

// Component to display user roles in table
function UserRolesDisplay({ userId }: { userId: number }) {
  const { roles, loading } = useUserRoles(userId);

  if (loading) {
    return <span className="text-muted-foreground text-xs">Chargement...</span>;
  }

  if (roles.length === 0) {
    return <span className="text-muted-foreground text-xs">Aucun rôle</span>;
  }

  return (
    <div className="flex flex-wrap gap-1 max-w-md">
      {roles.map((role) => (
        <Badge 
          key={role.id} 
          variant={role.is_active ? "default" : "default"} 
          className={clsx("text-xs", !role.is_active && "opacity-60")}
          title={role.description || role.name}
        >
          {role.name}
          {!role.is_active && ' (inactif)'}
        </Badge>
      ))}
    </div>
  );
}

// Component to display user permissions in table
function UserPermissionsDisplay({ userId }: { userId: number }) {
  const { permissions, customPermissions, loading } = useUserPermissions(userId);

  if (loading) {
    return <span className="text-muted-foreground text-xs">Chargement...</span>;
  }

  // Get custom permission names
  const customPermNames = new Set(customPermissions.map(p => p.permission.name));
  
  // Get unique permissions from roles (permissions is an array of strings)
  const rolePermissions = Array.from(new Set(permissions));
  
  // Combine all permissions
  const allPermissions = [...rolePermissions];
  
  // Add custom permissions that might not be in role permissions
  customPermissions.forEach(cp => {
    if (!allPermissions.includes(cp.permission.name)) {
      allPermissions.push(cp.permission.name);
    }
  });

  if (allPermissions.length === 0) {
    return <span className="text-muted-foreground text-xs">Aucune permission</span>;
  }

  return (
    <div className="flex flex-wrap gap-1 max-w-md max-h-32 overflow-y-auto">
      {allPermissions.map((perm, index) => {
        const isCustom = customPermNames.has(perm);
        // Find the custom permission object for tooltip
        const customPerm = customPermissions.find(cp => cp.permission.name === perm);
        const tooltip = customPerm 
          ? (customPerm.permission.description || customPerm.permission.name)
          : perm;
        
        return (
          <Badge 
            key={`${perm}-${index}`} 
            variant={isCustom ? "info" : "default"} 
            className="text-xs"
            title={tooltip}
          >
            {perm}
            {isCustom && ' (custom)'}
          </Badge>
        );
      })}
    </div>
  );
}
