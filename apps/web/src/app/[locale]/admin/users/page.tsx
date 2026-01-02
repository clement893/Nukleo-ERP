'use client';

export const dynamic = 'force-dynamic';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import Modal from '@/components/ui/Modal';
import Drawer from '@/components/ui/Drawer';
import { 
  Users, Plus, Search, Shield, Mail, Calendar, Edit, Trash2,
  Eye, Settings, UserPlus, CheckCircle2, XCircle, Send, Clock
} from 'lucide-react';
import { Badge, Button, Card, Input, Select, Loading } from '@/components/ui';
import { useToast } from '@/lib/toast';
import { usersAPI, invitationsAPI } from '@/lib/api';
import { useUserRoles } from '@/hooks/useRBAC';
import UserRolesEditor from '@/components/admin/UserRolesEditor';
import UserPermissionsEditor from '@/components/admin/UserPermissionsEditor';
import EmployeePortalPermissionsEditor from '@/components/admin/EmployeePortalPermissionsEditor';
import { handleApiError } from '@/lib/errors/api';
import { apiClient } from '@/lib/api';

interface User {
  id: number;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  is_active: boolean;
  is_verified?: boolean;
  created_at: string;
  updated_at?: string;
  employee?: {
    id: number;
    first_name: string;
    last_name: string;
    email?: string | null;
  };
}

interface PaginatedUsersResponse {
  items: User[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  invited_at: string;
  expires_at: string;
}

const statusConfig = {
  active: { label: 'Actif', color: 'bg-green-500/10 text-green-600 border-green-500/30', icon: CheckCircle2 },
  inactive: { label: 'Inactif', color: 'bg-orange-500/10 text-orange-600 border-orange-500/30', icon: XCircle },
};

const getAvatarColor = (name: string) => {
  const colors = [
    'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500',
    'bg-pink-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-red-500'
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

const getInitials = (user: User) => {
  if (user.first_name && user.last_name) {
    const first = user.first_name[0] || '';
    const last = user.last_name[0] || '';
    return `${first}${last}`.toUpperCase();
  }
  if (user.email) {
    return user.email[0]?.toUpperCase() || 'U';
  }
  return 'U';
};

const getUserDisplayName = (user: User) => {
  if (user.first_name && user.last_name) {
    return `${user.first_name} ${user.last_name}`;
  }
  return user.email;
};


// Component to display user roles
function UserRolesDisplay({ userId }: { userId: number }) {
  const { roles, loading } = useUserRoles(userId);

  if (loading) {
    return <span className="text-xs text-gray-500">Chargement...</span>;
  }

  if (roles.length === 0) {
    return <span className="text-xs text-gray-500">Aucun rôle</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {roles.slice(0, 2).map((role) => (
        <Badge key={role.id} className="text-xs bg-purple-500/10 text-purple-600 border-purple-500/30">
          {role.name}
        </Badge>
      ))}
      {roles.length > 2 && (
        <Badge className="text-xs bg-gray-500/10 text-gray-600 border-gray-500/30">
          +{roles.length - 2}
        </Badge>
      )}
    </div>
  );
}

export default function AdminUsersPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [showRolesModal, setShowRolesModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showPortalPermissionsModal, setShowPortalPermissionsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    is_active: true,
  });

  // Fetch users with API
  const { data, isLoading } = useQuery<PaginatedUsersResponse>({
    queryKey: ['users', page, pageSize, searchQuery, statusFilter],
    queryFn: async () => {
      const params: any = {
        page,
        page_size: pageSize,
      };
      if (searchQuery) {
        params.search = searchQuery;
      }
      if (statusFilter !== 'all') {
        params.is_active = statusFilter === 'active';
      }
      const response = await apiClient.get('/v1/users', { params });
      return response.data;
    },
  });

  // Fetch pending invitations - show all for superadmins
  const { data: invitationsData, isLoading: isLoadingInvitations, refetch: refetchInvitations } = useQuery<Invitation[]>({
    queryKey: ['pending-invitations'],
    queryFn: async () => {
      // Try to fetch all invitations (for superadmins) first
      try {
        const response = await invitationsAPI.list({ status: 'pending', all_invitations: true });
        // Handle both array and object with items property
        const data = response.data;
        if (Array.isArray(data)) {
          return data;
        }
        if (data && typeof data === 'object' && 'items' in data) {
          return (data as { items: Invitation[] }).items;
        }
        if (data && typeof data === 'object' && 'invitations' in data) {
          return (data as { invitations: Invitation[] }).invitations;
        }
        return [];
      } catch (error) {
        // If all_invitations fails (not superadmin), fallback to user's own invitations
        const response = await invitationsAPI.list({ status: 'pending' });
        const data = response.data;
        if (Array.isArray(data)) {
          return data;
        }
        if (data && typeof data === 'object' && 'items' in data) {
          return (data as { items: Invitation[] }).items;
        }
        if (data && typeof data === 'object' && 'invitations' in data) {
          return (data as { invitations: Invitation[] }).invitations;
        }
        return [];
      }
    },
  });


  // Mutations
  const createUserMutation = useMutation({
    mutationFn: (data: typeof formData) => usersAPI.createUser(data),
    onSuccess: () => {
      showToast({ message: 'Utilisateur créé avec succès', type: 'success' });
      setShowCreateModal(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => {
      const appError = handleApiError(error);
      showToast({ message: appError.message || 'Erreur lors de la création', type: 'error' });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: Partial<typeof formData> }) =>
      usersAPI.updateUser(userId, data),
    onSuccess: () => {
      showToast({ message: 'Utilisateur modifié avec succès', type: 'success' });
      setShowEditModal(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => {
      const appError = handleApiError(error);
      showToast({ message: appError.message || 'Erreur lors de la modification', type: 'error' });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => usersAPI.deleteUser(userId),
    onSuccess: () => {
      showToast({ message: 'Utilisateur supprimé avec succès', type: 'success' });
      setShowDeleteModal(false);
      setSelectedUser(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => {
      const appError = handleApiError(error);
      showToast({ message: appError.message || 'Erreur lors de la suppression', type: 'error' });
    },
  });

  const sendInvitationMutation = useMutation({
    mutationFn: (userId: string | number) => usersAPI.sendInvitation(userId),
    onSuccess: () => {
      showToast({ message: 'Invitation envoyée avec succès', type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => {
      const appError = handleApiError(error);
      showToast({ message: appError.message || 'Erreur lors de l\'envoi de l\'invitation', type: 'error' });
    },
  });

  const resendInvitationMutation = useMutation({
    mutationFn: (invitationId: string) => invitationsAPI.resend(invitationId),
    onSuccess: () => {
      showToast({ message: 'Invitation renvoyée avec succès', type: 'success' });
      refetchInvitations();
    },
    onError: (error) => {
      const appError = handleApiError(error);
      showToast({ message: appError.message || 'Erreur lors du renvoi de l\'invitation', type: 'error' });
    },
  });

  const resetForm = () => {
    setFormData({
      email: '',
      first_name: '',
      last_name: '',
      password: '',
      is_active: true,
    });
    setSelectedUser(null);
  };

  const handleCreate = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      password: '',
      is_active: user.is_active,
    });
    setShowEditModal(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleView = (user: User) => {
    setSelectedUser(user);
    setShowDetailDrawer(true);
  };

  const handleSubmit = () => {
    if (!formData.email) {
      showToast({ message: 'L\'email est requis', type: 'error' });
      return;
    }

    if (selectedUser) {
      // Update
      const updateData: any = {
        email: formData.email,
        first_name: formData.first_name || undefined,
        last_name: formData.last_name || undefined,
        is_active: formData.is_active,
      };
      if (formData.password) {
        updateData.password = formData.password;
      }
      updateUserMutation.mutate({ userId: String(selectedUser.id), data: updateData });
    } else {
      // Create
      if (!formData.password) {
        showToast({ message: 'Le mot de passe est requis pour créer un utilisateur', type: 'error' });
        return;
      }
      createUserMutation.mutate(formData);
    }
  };

  const handleConfirmDelete = () => {
    if (selectedUser) {
      deleteUserMutation.mutate(String(selectedUser.id));
    }
  };


  // Calculate stats
  const stats = useMemo(() => {
    const users = data?.items || [];
    return {
      total: data?.total || 0,
      active: users.filter(u => u.is_active).length,
      inactive: users.filter(u => !u.is_active).length,
      verified: users.filter(u => u.is_verified).length,
    };
  }, [data]);

  // Use searchQuery directly in query - it will be debounced by React Query

  if (isLoading && !data) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-96">
          <Loading />
        </div>
      </PageContainer>
    );
  }

  const users = data?.items || [];
  const totalPages = data?.total_pages || 1;

  return (
    <PageContainer>
      <MotionDiv variant="slideUp" duration="normal">
        {/* Hero Header */}
        <div className="relative mb-6 overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] opacity-90" />
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
            backgroundSize: '200px 200px'
          }} />
          
          <div className="relative px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    Gestion des Utilisateurs
                  </h1>
                  <p className="text-white/80 text-sm">Gérez les comptes et permissions utilisateurs</p>
                </div>
              </div>
              <Button 
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                onClick={handleCreate}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouvel utilisateur
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {stats.total}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Total Utilisateurs</div>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/30">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {stats.active}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Actifs</div>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/30">
                <XCircle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {stats.inactive}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Inactifs</div>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {stats.verified}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Vérifiés</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher par nom ou email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                options={[
                  { value: 'all', label: 'Tous les statuts' },
                  { value: 'active', label: 'Actif' },
                  { value: 'inactive', label: 'Inactif' },
                ]}
              />
            </div>
          </div>
        </Card>

        {/* Users Table */}
        <Card className="glass-card rounded-xl border border-[#A7A2CF]/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Rôles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Employé
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Date création
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      Aucun utilisateur trouvé
                    </td>
                  </tr>
                ) : (
                  users.map((user) => {
                    const displayName = getUserDisplayName(user);
                    const statusInfo = statusConfig[user.is_active ? 'active' : 'inactive'];
                    const StatusIcon = statusInfo.icon;

                    return (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full ${getAvatarColor(displayName)} flex items-center justify-center text-white font-semibold text-sm`}>
                              {getInitials(user)}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 dark:text-white">
                                {displayName}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <UserRolesDisplay userId={user.id} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={`${statusInfo.color} border flex items-center gap-1`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusInfo.label}
                          </Badge>
                          {user.is_verified && (
                            <Badge className="ml-2 bg-blue-500/10 text-blue-600 border-blue-500/30 text-xs">
                              Vérifié
                            </Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.employee ? (
                            <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/30">
                              {user.employee.first_name} {user.employee.last_name}
                            </Badge>
                          ) : (
                            <span className="text-xs text-gray-500">Aucun</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(user.created_at).toLocaleDateString('fr-FR')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="hover:bg-blue-500/10 hover:text-blue-600"
                              onClick={() => handleView(user)}
                              title="Voir détails"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="hover:bg-blue-500/10 hover:text-blue-600"
                              onClick={() => handleEdit(user)}
                              title="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="hover:bg-red-500/10 hover:text-red-600"
                              onClick={() => handleDelete(user)}
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="hover:bg-gray-500/10"
                              onClick={() => {
                                setSelectedUser(user);
                                setShowRolesModal(true);
                              }}
                              title="Gérer les rôles"
                            >
                              <Settings className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Page {page} sur {totalPages} ({stats.total} utilisateurs)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Pending Invitations Section */}
        <Card className="glass-card rounded-xl border border-[#A7A2CF]/20 mt-6">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/30">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Invitations en attente
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Gérer les invitations qui n'ont pas encore été acceptées
                </p>
              </div>
            </div>
          </div>

          {isLoadingInvitations ? (
            <div className="p-12 text-center">
              <Loading />
            </div>
          ) : !invitationsData || invitationsData.length === 0 ? (
            <div className="p-12 text-center">
              <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Aucune invitation en attente
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Rôle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Date d'invitation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Expire le
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {invitationsData.map((invitation) => (
                    <tr key={invitation.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {invitation.email}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/30">
                          {invitation.role}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(invitation.invited_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {invitation.expires_at ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(invitation.expires_at).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resendInvitationMutation.mutate(invitation.id)}
                          disabled={resendInvitationMutation.isPending}
                          className="hover:bg-primary-500/10 hover:text-primary-600"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Renvoyer
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </MotionDiv>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreateModal || showEditModal}
        onClose={() => {
          setShowCreateModal(false);
          setShowEditModal(false);
          resetForm();
        }}
        title={selectedUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email *
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={!!selectedUser}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Prénom
              </label>
              <Input
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nom
              </label>
              <Input
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              />
            </div>
          </div>

          {!selectedUser && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mot de passe *
              </label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
          )}

          {selectedUser && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nouveau mot de passe (laisser vide pour ne pas changer)
              </label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded border-gray-300"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700 dark:text-gray-300">
              Compte actif
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                setShowEditModal(false);
                resetForm();
              }}
              disabled={createUserMutation.isPending || updateUserMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              loading={createUserMutation.isPending || updateUserMutation.isPending}
            >
              {selectedUser ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedUser(null);
        }}
        title="Confirmer la suppression"
        size="md"
      >
        <p className="mb-4">
          Êtes-vous sûr de vouloir supprimer l'utilisateur{' '}
          <strong>{selectedUser?.email}</strong> ?
        </p>
        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={() => {
              setShowDeleteModal(false);
              setSelectedUser(null);
            }}
            disabled={deleteUserMutation.isPending}
          >
            Annuler
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirmDelete}
            loading={deleteUserMutation.isPending}
          >
            Supprimer
          </Button>
        </div>
      </Modal>

      {/* Detail Drawer */}
      <Drawer
        isOpen={showDetailDrawer}
        onClose={() => {
          setShowDetailDrawer(false);
          setSelectedUser(null);
        }}
        title="Détails de l'utilisateur"
        position="right"
        size="lg"
      >
        {selectedUser ? (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                Informations
              </h4>
              <div className="space-y-2">
                <p><strong>Email:</strong> {selectedUser.email}</p>
                {selectedUser.first_name && <p><strong>Prénom:</strong> {selectedUser.first_name}</p>}
                {selectedUser.last_name && <p><strong>Nom:</strong> {selectedUser.last_name}</p>}
                <p><strong>Statut:</strong> {selectedUser.is_active ? 'Actif' : 'Inactif'}</p>
                {selectedUser.is_verified && <p><strong>Vérifié:</strong> Oui</p>}
                {selectedUser.employee && (
                  <p><strong>Employé lié:</strong> {selectedUser.employee.first_name} {selectedUser.employee.last_name}</p>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                Rôles
              </h4>
              <UserRolesDisplay userId={selectedUser.id} />
            </div>

            <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDetailDrawer(false);
                  handleEdit(selectedUser);
                }}
                className="flex-1"
              >
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDetailDrawer(false);
                  setShowRolesModal(true);
                }}
                className="flex-1"
              >
                <Settings className="w-4 h-4 mr-2" />
                Rôles
              </Button>
              {!selectedUser.is_active && (
                <Button
                  variant="outline"
                  onClick={() => {
                    sendInvitationMutation.mutate(selectedUser.id);
                  }}
                  disabled={sendInvitationMutation.isPending}
                  className="flex-1"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Envoyer invitation
                </Button>
              )}
            </div>
          </div>
        ) : (
          <Loading />
        )}
      </Drawer>

      {/* Roles Modal */}
      <Modal
        isOpen={showRolesModal}
        onClose={() => {
          setShowRolesModal(false);
          setSelectedUser(null);
        }}
        title={`Gérer les rôles - ${selectedUser?.email}`}
        size="lg"
      >
        {selectedUser && (
          <UserRolesEditor
            userId={selectedUser.id}
            onUpdate={() => {
              queryClient.invalidateQueries({ queryKey: ['users'] });
            }}
          />
        )}
      </Modal>

      {/* Permissions Modal */}
      <Modal
        isOpen={showPermissionsModal}
        onClose={() => {
          setShowPermissionsModal(false);
          setSelectedUser(null);
        }}
        title={`Gérer les permissions - ${selectedUser?.email}`}
        size="lg"
      >
        {selectedUser && (
          <UserPermissionsEditor
            userId={selectedUser.id}
            onUpdate={() => {
              queryClient.invalidateQueries({ queryKey: ['users'] });
            }}
          />
        )}
      </Modal>

      {/* Portal Permissions Modal */}
      <Modal
        isOpen={showPortalPermissionsModal}
        onClose={() => {
          setShowPortalPermissionsModal(false);
          setSelectedUser(null);
        }}
        title={`Permissions du portail employé - ${selectedUser?.email}`}
        size="lg"
      >
        {selectedUser && (
          <EmployeePortalPermissionsEditor
            userId={selectedUser.id}
            onUpdate={() => {
              queryClient.invalidateQueries({ queryKey: ['users'] });
            }}
          />
        )}
      </Modal>
    </PageContainer>
  );
}
