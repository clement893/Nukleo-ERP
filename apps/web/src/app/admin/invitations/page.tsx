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
import Select from '@/components/ui/Select';
import Loading from '@/components/ui/Loading';

interface Invitation {
  id: string;
  email: string;
  role: string;
  organization_id: string;
  organization_name: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  invited_by: string;
  invited_at: string;
  expires_at: string;
}

export default function InvitationsPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newInvitationEmail, setNewInvitationEmail] = useState('');
  const [newInvitationRole, setNewInvitationRole] = useState('user');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'accepted' | 'expired' | 'cancelled'>('all');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    if (!user?.is_admin) {
      router.push('/dashboard');
      return;
    }

    loadInvitations();
  }, [isAuthenticated, user, router]);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      setError('');
      const { invitationsAPI } = await import('@/lib/api');
      const response = await invitationsAPI.list();
      
      if (response.data) {
        setInvitations(response.data.map((invitation: {
          id: string | number;
          email: string;
          role: string;
          organization_id?: string;
          organization_name?: string;
          status: string;
          invited_by?: string;
          invited_at: string;
          expires_at: string;
        }) => ({
          id: String(invitation.id),
          email: invitation.email,
          role: invitation.role,
          organization_id: invitation.organization_id || '',
          organization_name: invitation.organization_name || 'Unknown Organization',
          status: invitation.status as 'pending' | 'accepted' | 'expired' | 'cancelled',
          invited_by: invitation.invited_by || 'Unknown',
          invited_at: invitation.invited_at,
          expires_at: invitation.expires_at,
        })));
      }
    } catch (err: unknown) {
      // If API returns 404 or endpoint doesn't exist yet, use empty array
      if (getErrorDetail(err)?.includes('404') || getErrorDetail(err)?.includes('not found')) {
        setInvitations([]);
      } else {
        setError(getErrorDetail(err) || getErrorMessage(err, 'Error loading invitations'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvitation = async () => {
    if (!newInvitationEmail.trim()) {
      setError('Email is required');
      return;
    }

    try {
      setLoading(true);
      const { invitationsAPI } = await import('@/lib/api');
      await invitationsAPI.create({
        email: newInvitationEmail,
        role: newInvitationRole,
      });
      await loadInvitations();
      setShowCreateModal(false);
      setNewInvitationEmail('');
      setNewInvitationRole('user');
    } catch (err: unknown) {
      setError(getErrorDetail(err) || getErrorMessage(err, 'Error creating invitation'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) {
      return;
    }

    try {
      setLoading(true);
      const { invitationsAPI } = await import('@/lib/api');
      await invitationsAPI.cancel(invitationId);
      await loadInvitations();
    } catch (err: unknown) {
      setError(getErrorDetail(err) || getErrorMessage(err, 'Error canceling invitation'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      setLoading(true);
      const { invitationsAPI } = await import('@/lib/api');
      await invitationsAPI.resend(invitationId);
      await loadInvitations();
    } catch (err: unknown) {
      setError(getErrorDetail(err) || getErrorMessage(err, 'Error resending invitation'));
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated() || !user?.is_admin) {
    return null;
  }

  const filteredInvitations = filterStatus === 'all'
    ? invitations
    : invitations.filter(inv => inv.status === filterStatus);

  const statusCounts = {
    all: invitations.length,
    pending: invitations.filter(inv => inv.status === 'pending').length,
    accepted: invitations.filter(inv => inv.status === 'accepted').length,
    expired: invitations.filter(inv => inv.status === 'expired').length,
    cancelled: invitations.filter(inv => inv.status === 'cancelled').length,
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'error' | 'default'> = {
      accepted: 'success',
      expired: 'error',
      cancelled: 'error',
      pending: 'default',
    };
    return variants[status] || 'default';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'En attente',
      accepted: 'Acceptée',
      expired: 'Expirée',
      cancelled: 'Annulée',
    };
    return labels[status] || status;
  };

  return (
    <div className="py-12">
      <Container>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">Gestion des Invitations</h1>
          <p className="text-gray-600 dark:text-gray-400">Gérer les invitations envoyées aux utilisateurs</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          Inviter un utilisateur
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {Object.entries(statusCounts).map(([status, count]) => (
          <Card key={status}>
            <div className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{count}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">{status === 'all' ? 'Total' : getStatusLabel(status)}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        {(['all', 'pending', 'accepted', 'expired', 'cancelled'] as const).map((status) => (
          <Button
            key={status}
            onClick={() => setFilterStatus(status)}
            variant={filterStatus === status ? 'primary' : 'ghost'}
            size="sm"
          >
            {status === 'all' ? 'Tous' : getStatusLabel(status)}
          </Button>
        ))}
      </div>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      {loading ? (
        <Card>
          <div className="py-12 text-center">
            <Loading />
          </div>
        </Card>
      ) : filteredInvitations.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              {filterStatus === 'all' ? 'Aucune invitation' : `Aucune invitation ${getStatusLabel(filterStatus).toLowerCase()}`}
            </p>
          </div>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white dark:bg-gray-800 rounded-lg shadow">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Rôle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Organisation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Invitée le
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Expire le
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredInvitations.map((invitation) => (
                <tr key={invitation.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900 dark:text-gray-100">{invitation.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge>{invitation.role}</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600 dark:text-gray-400">{invitation.organization_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getStatusBadge(invitation.status)}>
                      {getStatusLabel(invitation.status)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {new Date(invitation.invited_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {new Date(invitation.expires_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      {invitation.status === 'pending' && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleResendInvitation(invitation.id)}>
                            Réenvoyer
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancelInvitation(invitation.id)}
                            className="border-red-500 text-red-600 hover:bg-red-50"
                          >
                            Annuler
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Invitation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md m-4">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Inviter un utilisateur</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email *
                  </label>
                  <Input
                    type="email"
                    value={newInvitationEmail}
                    onChange={(e) => setNewInvitationEmail(e.target.value)}
                    placeholder="user@example.com"
                    fullWidth
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Rôle *
                  </label>
                  <Select
                    value={newInvitationRole}
                    onChange={(e) => setNewInvitationRole(e.target.value)}
                    fullWidth
                  >
                    <option value="user">Utilisateur</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Administrateur</option>
                  </Select>
                </div>
                <div className="flex gap-3 justify-end">
                  <Button variant="outline" onClick={() => {
                    setShowCreateModal(false);
                    setNewInvitationEmail('');
                    setNewInvitationRole('user');
                  }}>
                    Annuler
                  </Button>
                  <Button onClick={handleCreateInvitation}>
                    Envoyer l'invitation
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
