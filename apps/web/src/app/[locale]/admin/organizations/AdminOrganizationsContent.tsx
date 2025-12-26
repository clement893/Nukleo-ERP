'use client';

import { useEffect, useState } from 'react';
import { PageHeader, PageContainer } from '@/components/layout';
import { useAuthStore } from '@/lib/store';
import { getErrorMessage, getErrorDetail } from '@/lib/error-utils';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Alert from '@/components/ui/Alert';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Loading from '@/components/ui/Loading';
import Modal from '@/components/ui/Modal';
import DataTable from '@/components/ui/DataTable';
import { Column } from '@/components/ui/DataTable';

interface Team {
  id: string;
  name: string;
  description?: string;
  member_count: number;
  organization_id?: string;
  created_at: string;
}

export default function AdminOrganizationsContent() {
  const { token } = useAuthStore();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      setLoading(true);
      setError(null);
      const { teamsAPI } = await import('@/lib/api');
      const response = await teamsAPI.list();
      
      if (response.data) {
        setTeams(response.data.map((team: any) => ({
          id: String(team.id),
          name: team.name,
          description: team.description,
          member_count: team.member_count || 0,
          organization_id: team.organization_id || '',
          created_at: team.created_at,
        })));
      }
    } catch (err: unknown) {
      if (getErrorDetail(err)?.includes('404') || getErrorDetail(err)?.includes('not found')) {
        setTeams([]);
      } else {
        setError(getErrorDetail(err) || getErrorMessage(err, 'Erreur lors du chargement des organisations'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      setError('Le nom de l\'organisation est requis');
      return;
    }

    try {
      setLoading(true);
      const { teamsAPI } = await import('@/lib/api');
      await teamsAPI.create({
        name: newTeamName,
        description: newTeamDescription || undefined,
      });
      await loadTeams();
      setShowCreateModal(false);
      setNewTeamName('');
      setNewTeamDescription('');
    } catch (err: unknown) {
      setError(getErrorDetail(err) || getErrorMessage(err, 'Erreur lors de la création de l\'organisation'));
    } finally {
      setLoading(false);
    }
  };

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: Column<Team>[] = [
    {
      key: 'name',
      header: 'Nom',
      render: (team) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-gray-100">{team.name}</div>
          {team.description && (
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{team.description}</div>
          )}
        </div>
      ),
    },
    {
      key: 'member_count',
      header: 'Membres',
      render: (team) => (
        <Badge variant="default">{team.member_count}</Badge>
      ),
    },
    {
      key: 'created_at',
      header: 'Créé le',
      render: (team) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {new Date(team.created_at).toLocaleDateString('fr-FR')}
        </span>
      ),
    },
  ];

  return (
    <PageContainer>
      <PageHeader 
        title="Organisations" 
        description="Gérer les organisations et leurs paramètres"
        breadcrumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Administration', href: '/admin' },
          { label: 'Organisations' }
        ]} 
      />

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      <div className="mt-6 flex justify-between items-center mb-4">
        <Input
          type="text"
          placeholder="Rechercher une organisation..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
        <Button onClick={() => setShowCreateModal(true)}>
          Créer une organisation
        </Button>
      </div>

      {loading ? (
        <Card>
          <div className="py-12 text-center">
            <Loading />
          </div>
        </Card>
      ) : (
        <Card>
          <DataTable
            data={filteredTeams}
            columns={columns}
            emptyMessage="Aucune organisation trouvée"
          />
        </Card>
      )}

      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setNewTeamName('');
          setNewTeamDescription('');
        }}
        title="Créer une nouvelle organisation"
        size="md"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                setNewTeamName('');
                setNewTeamDescription('');
              }}
            >
              Annuler
            </Button>
            <Button onClick={handleCreateTeam} disabled={loading}>
              Créer
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Nom de l'organisation *"
            type="text"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            placeholder="Ex: Organisation Marketing"
            fullWidth
          />
          <Textarea
            label="Description"
            value={newTeamDescription}
            onChange={(e) => setNewTeamDescription(e.target.value)}
            rows={3}
            placeholder="Description de l'organisation..."
            fullWidth
          />
        </div>
      </Modal>
    </PageContainer>
  );
}

