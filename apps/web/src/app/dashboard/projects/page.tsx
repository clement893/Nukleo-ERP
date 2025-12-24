'use client';

// Force dynamic rendering to avoid prerendering issues
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Alert from '@/components/ui/Alert';
import Loading from '@/components/ui/Loading';
import Select from '@/components/ui/Select';
import DataTable, { type Column } from '@/components/ui/DataTable';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'archived' | 'completed';
  created_at: string;
  updated_at: string;
  owner: string;
}

function ProjectsContent() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active' as 'active' | 'archived' | 'completed',
  });

  // Mock data for demonstration
  const mockProjects: Project[] = [
    {
      id: '1',
      name: 'Projet Alpha',
      description: 'Description du projet Alpha',
      status: 'active',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-12-20T14:30:00Z',
      owner: 'John Doe',
    },
    {
      id: '2',
      name: 'Projet Beta',
      description: 'Description du projet Beta',
      status: 'completed',
      created_at: '2024-02-10T09:00:00Z',
      updated_at: '2024-11-30T16:00:00Z',
      owner: 'Jane Smith',
    },
    {
      id: '3',
      name: 'Projet Gamma',
      description: 'Description du projet Gamma',
      status: 'archived',
      created_at: '2024-03-05T11:00:00Z',
      updated_at: '2024-10-15T12:00:00Z',
      owner: 'Bob Johnson',
    },
  ];

  // Load projects (mock for now)
  const loadProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      setProjects(mockProjects);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des projets');
    } finally {
      setLoading(false);
    }
  };

  // Initialize projects on mount
  useEffect(() => {
    loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateProject = async () => {
    if (!formData.name.trim()) {
      setError('Le nom du projet est requis');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const newProject: Project = {
        id: String(Date.now()),
        name: formData.name,
        description: formData.description,
        status: formData.status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        owner: 'Current User',
      };

      setProjects([...projects, newProject]);
      setShowCreateModal(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création du projet');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProject = async () => {
    if (!selectedProject || !formData.name.trim()) {
      setError('Le nom du projet est requis');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const updatedProjects = projects.map((p) =>
        p.id === selectedProject.id
          ? {
              ...p,
              name: formData.name,
              description: formData.description,
              status: formData.status,
              updated_at: new Date().toISOString(),
            }
          : p
      );

      setProjects(updatedProjects);
      setShowEditModal(false);
      setSelectedProject(null);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la modification du projet');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      setProjects(projects.filter((p) => p.id !== projectId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression du projet');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      status: 'active',
    });
  };

  const openEditModal = (project: Project) => {
    setSelectedProject(project);
    setFormData({
      name: project.name,
      description: project.description,
      status: project.status,
    });
    setShowEditModal(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'default'> = {
      active: 'success',
      completed: 'default',
      archived: 'warning',
    };
    return variants[status] || 'default';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      active: 'Actif',
      completed: 'Terminé',
      archived: 'Archivé',
    };
    return labels[status] || status;
  };

  const columns: Column<Project>[] = [
    {
      key: 'name',
      label: 'Nom',
      sortable: true,
    },
    {
      key: 'description',
      label: 'Description',
      sortable: true,
      render: (value) => (
        <span className="text-gray-600 dark:text-gray-400">
          {String(value).length > 50 ? `${String(value).substring(0, 50)}...` : String(value)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Statut',
      sortable: true,
      render: (value) => (
        <Badge variant={getStatusBadge(String(value))}>
          {getStatusLabel(String(value))}
        </Badge>
      ),
    },
    {
      key: 'owner',
      label: 'Propriétaire',
      sortable: true,
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
            onClick={() => openEditModal(row)}
            className="p-2"
            title="Modifier"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteProject(row.id)}
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
              Projets
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Gérez vos projets et leurs statuts
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
            Nouveau projet
          </Button>
        </div>

        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}

        {loading && projects.length === 0 ? (
          <Card>
            <div className="py-12 text-center">
              <Loading />
            </div>
          </Card>
        ) : (
          <Card>
            <div className="p-6">
              <DataTable
                data={projects}
                columns={columns}
                pageSize={10}
                searchable={true}
                searchPlaceholder="Rechercher un projet..."
                emptyMessage="Aucun projet trouvé"
                loading={loading}
              />
            </div>
          </Card>
        )}

        {/* Create Project Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Créer un nouveau projet
                </h2>
                <div className="space-y-4">
                  <div>
                    <Input
                      label="Nom du projet *"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Projet Alpha"
                      fullWidth
                    />
                  </div>
                  <div>
                    <Textarea
                      label="Description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Description du projet..."
                      rows={4}
                      fullWidth
                    />
                  </div>
                  <div>
                    <Select
                      label="Statut"
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as 'active' | 'archived' | 'completed',
                        })
                      }
                      fullWidth
                      options={[
                        { value: 'active', label: 'Actif' },
                        { value: 'completed', label: 'Terminé' },
                        { value: 'archived', label: 'Archivé' },
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
                    <Button onClick={handleCreateProject} loading={loading}>
                      Créer
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Edit Project Modal */}
        {showEditModal && selectedProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Modifier le projet
                </h2>
                <div className="space-y-4">
                  <div>
                    <Input
                      label="Nom du projet *"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Projet Alpha"
                      fullWidth
                    />
                  </div>
                  <div>
                    <Textarea
                      label="Description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Description du projet..."
                      rows={4}
                      fullWidth
                    />
                  </div>
                  <div>
                    <Select
                      label="Statut"
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as 'active' | 'archived' | 'completed',
                        })
                      }
                      fullWidth
                      options={[
                        { value: 'active', label: 'Actif' },
                        { value: 'completed', label: 'Terminé' },
                        { value: 'archived', label: 'Archivé' },
                      ]}
                    />
                  </div>
                  <div className="flex gap-3 justify-end pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowEditModal(false);
                        setSelectedProject(null);
                        resetForm();
                      }}
                    >
                      Annuler
                    </Button>
                    <Button onClick={handleEditProject} loading={loading}>
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

export default function ProjectsPage() {
  return (
    <ProtectedRoute>
      <ProjectsContent />
    </ProtectedRoute>
  );
}

