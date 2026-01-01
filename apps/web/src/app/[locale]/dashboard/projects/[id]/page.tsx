'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Alert from '@/components/ui/Alert';
import Loading from '@/components/ui/Loading';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import { Heading, Text } from '@/components/ui';
import { projectsAPI, type Project } from '@/lib/api/projects';
import { companiesAPI } from '@/lib/api/companies';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import {
  ArrowLeft,
  Edit,
  Trash2,
  ExternalLink,
  Users,
  Calendar,
  DollarSign,
  FileText,
  Link as LinkIcon,
  Award,
  Briefcase,
  Clock,
  Kanban,
  GanttChart,
  Star,
  Share2,

} from 'lucide-react';
import TaskKanban from '@/components/projects/TaskKanban';
import ProjectGantt from '@/components/projects/ProjectGantt';
import { teamsAPI } from '@/lib/api/teams';
import { extractApiData } from '@/lib/api/utils';
import type { TeamListResponse } from '@/lib/api/teams';

type Tab = 'overview' | 'financial' | 'links' | 'deliverables' | 'tasks' | 'timeline';

function ProjectDetailContent() {
  const router = useRouter();
  const params = useParams();
  const projectId = parseInt(params.id as string);
  const { showToast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [teamId, setTeamId] = useState<number | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    status: 'ACTIVE' as 'ACTIVE' | 'COMPLETED' | 'ARCHIVED',
    client_id: null as number | null,
    client_name: '',
    equipe: '',
    etape: '',
    annee_realisation: '',
    contact: '',
    budget: '',
    proposal_url: '',
    drive_url: '',
    slack_url: '',
    echeancier_url: '',
    temoignage_status: '',
    portfolio_status: '',
    start_date: '',
    end_date: '',
    deadline: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [clients, setClients] = useState<Array<{ id: number; name: string }>>([]);
  const [loadingClients, setLoadingClients] = useState(false);

  useEffect(() => {
    loadProject();
    loadTeamId();
    loadClients();
  }, [projectId]);

  const loadTeamId = async () => {
    try {
      const response = await teamsAPI.getMyTeams();
      const data = extractApiData<TeamListResponse>(response);
      if (data && data.teams && data.teams.length > 0 && data.teams[0]) {
        setTeamId(data.teams[0].id);
      }
    } catch (err) {
      // Silently fail - team_id is optional for tasks
      console.warn('Could not load team ID:', err);
    }
  };

  const loadProject = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await projectsAPI.get(projectId);
      setProject(data);
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors du chargement du projet');
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      setLoadingClients(true);
      const data = await companiesAPI.list(0, 1000);
      const clientsList = Array.isArray(data) ? data : (data as any)?.items || [];
      setClients(clientsList.map((c: any) => ({ id: c.id, name: c.name || c.company_name || '' })));
    } catch (err) {
      console.warn('Could not load clients:', err);
    } finally {
      setLoadingClients(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) {
      return;
    }

    try {
      await projectsAPI.delete(projectId);
      const locale = (params.locale as string) || 'fr';
      router.push(`/${locale}/dashboard/projects`);
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors de la suppression du projet');
    }
  };

  const handleOpenEditModal = () => {
    if (project) {
      setEditFormData({
        name: project.name,
        description: project.description || '',
        status: project.status as 'ACTIVE' | 'COMPLETED' | 'ARCHIVED',
        client_id: project.client_id,
        client_name: project.client_name || '',
        equipe: project.equipe || '',
        etape: project.etape || '',
        annee_realisation: project.annee_realisation || '',
        contact: project.contact || '',
        budget: project.budget?.toString() || '',
        proposal_url: project.proposal_url || '',
        drive_url: project.drive_url || '',
        slack_url: project.slack_url || '',
        echeancier_url: project.echeancier_url || '',
        temoignage_status: project.temoignage_status || '',
        portfolio_status: project.portfolio_status || '',
        start_date: project.start_date ? new Date(project.start_date).toISOString().split('T')[0] || '' : '',
        end_date: project.end_date ? new Date(project.end_date).toISOString().split('T')[0] || '' : '',
        deadline: project.deadline ? new Date(project.deadline).toISOString().split('T')[0] || '' : '',
      });
      setShowEditModal(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!editFormData.name.trim()) {
      showToast({
        message: 'Le nom du projet est requis',
        type: 'error',
      });
      return;
    }

    try {
      setIsSaving(true);
      const updateData: any = {
        name: editFormData.name,
        description: editFormData.description || undefined,
        status: editFormData.status,
        client_id: editFormData.client_id || undefined,
        client_name: editFormData.client_name || undefined,
        equipe: editFormData.equipe || undefined,
        etape: editFormData.etape || undefined,
        annee_realisation: editFormData.annee_realisation || undefined,
        contact: editFormData.contact || undefined,
        budget: editFormData.budget ? parseFloat(editFormData.budget) : undefined,
        proposal_url: editFormData.proposal_url || undefined,
        drive_url: editFormData.drive_url || undefined,
        slack_url: editFormData.slack_url || undefined,
        echeancier_url: editFormData.echeancier_url || undefined,
        temoignage_status: editFormData.temoignage_status || undefined,
        portfolio_status: editFormData.portfolio_status || undefined,
        start_date: editFormData.start_date || undefined,
        end_date: editFormData.end_date || undefined,
        deadline: editFormData.deadline || undefined,
      };
      
      const updatedProject = await projectsAPI.update(projectId, updateData);
      setProject(updatedProject);
      setShowEditModal(false);
      showToast({
        message: 'Projet modifié avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la modification du projet',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      ACTIVE: 'Actif',
      COMPLETED: 'Terminé',
      ARCHIVED: 'Archivé',
    };
    return labels[status] || status;
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="glass-card">
          <div className="py-12 text-center">
            <Loading />
          </div>
        </Card>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="space-y-6">
        <Alert variant="error" className="mb-6">
          {error || 'Projet introuvable'}
        </Alert>
        <Button onClick={() => {
          const locale = (params.locale as string) || 'fr';
          router.push(`/${locale}/dashboard/projects`);
        }}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux projets
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="mb-2xl">
            <Button
              variant="ghost"
              onClick={() => {
                const locale = (params.locale as string) || 'fr';
                router.push(`/${locale}/dashboard/projects`);
              }}
              className="mb-4"
              aria-label="Retour à la liste des projets"
            >
              <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
              Retour aux projets
            </Button>
        </div>

        {/* Header */}
        <Card className="glass-card rounded-xl p-xl mb-2xl">
          {/* Navigation & Actions */}
          <div className="flex items-center justify-between mb-2xl">
            <Button
              variant="ghost"
              onClick={() => {
                const locale = (params.locale as string) || 'fr';
                router.push(`/${locale}/dashboard/projects`);
              }}
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group"
              aria-label="Retour à la liste des projets"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" aria-hidden="true" />
              <span className="text-sm font-medium">Retour aux projets</span>
            </Button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className={`glass-button p-2 rounded-lg transition-all ${
                  isFavorite ? 'text-yellow-500' : 'text-muted-foreground'
                }`}
                aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                aria-pressed={isFavorite}
              >
                <Star className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} aria-hidden="true" />
              </button>
              <button 
                className="glass-button px-4 py-2 rounded-lg flex items-center gap-2"
                aria-label="Partager le projet"
              >
                <Share2 className="w-4 h-4" aria-hidden="true" />
                <span className="text-sm font-medium hidden sm:inline">Partager</span>
              </button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenEditModal}
                className="glass-button text-foreground hover:text-primary"
                aria-label="Modifier le projet"
              >
                <Edit className="w-4 h-4 mr-2" aria-hidden="true" />
                Modifier
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                className="glass-button text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                aria-label="Supprimer le projet"
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
              </Button>
            </div>
          </div>

          {/* Project Name & Status */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2xl">
            <div className="flex-1">
              <Heading level={1}>
                {project.name}
              </Heading>
              {project.client_name && (
                <Text variant="small" className="text-muted-foreground mt-1">
                  Client: <span className="font-semibold">{project.client_name}</span>
                </Text>
              )}
              {project.description && (
                <Text variant="body" className="mt-3">{project.description}</Text>
              )}
            </div>

            <div className={`glass-badge px-4 py-2 rounded-full border flex items-center gap-2 ${
              project.status === 'ACTIVE' ? 'bg-primary/20 text-primary border-primary/30' :
              project.status === 'COMPLETED' ? 'bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30' :
              'bg-muted text-muted-foreground border-border'
            }`}>
              <span className={`w-2 h-2 rounded-full animate-pulse ${
                project.status === 'ACTIVE' ? 'bg-primary' :
                project.status === 'COMPLETED' ? 'bg-green-500' : 'bg-muted-foreground'
              }`} aria-hidden="true" />
              <Text variant="small" className="font-semibold">{getStatusLabel(project.status)}</Text>
            </div>
          </div>

          {/* Quick Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {project.equipe && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center" aria-hidden="true">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <Text variant="caption" className="text-muted-foreground">Équipe</Text>
                  <Text variant="small" className="font-medium text-foreground">{project.equipe}</Text>
                </div>
              </div>
            )}

            {project.etape && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center" aria-hidden="true">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <Text variant="caption" className="text-muted-foreground">Étape</Text>
                  <Text variant="small" className="font-medium text-foreground">{project.etape}</Text>
                </div>
              </div>
            )}

            {project.annee_realisation && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center" aria-hidden="true">
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <Text variant="caption" className="text-muted-foreground">Année</Text>
                  <Text variant="small" className="font-medium text-foreground">{project.annee_realisation}</Text>
                </div>
              </div>
            )}

            {project.contact && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center" aria-hidden="true">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <Text variant="caption" className="text-muted-foreground">Contact</Text>
                  <Text variant="small" className="font-medium text-foreground">{project.contact}</Text>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Tabs */}
        <div className="glass-card rounded-xl p-2 mb-2xl">
          <div className="flex items-center gap-1 overflow-x-auto" role="tablist">
            <button
              onClick={() => setActiveTab('overview')}
              role="tab"
              aria-selected={activeTab === 'overview'}
              aria-controls="overview-panel"
              className={`
                relative px-4 py-3 rounded-lg flex items-center gap-2 whitespace-nowrap
                transition-all duration-200 min-w-fit
                ${
                  activeTab === 'overview'
                    ? 'text-primary bg-primary/10 border border-primary/30'
                    : 'text-muted-foreground hover:text-foreground'
                }
              `}
            >
              <FileText className="w-4 h-4" aria-hidden="true" />
              <span className="font-medium text-sm">Vue d'ensemble</span>
            </button>

            <button
              onClick={() => setActiveTab('financial')}
              role="tab"
              aria-selected={activeTab === 'financial'}
              aria-controls="financial-panel"
              className={`
                relative px-4 py-3 rounded-lg flex items-center gap-2 whitespace-nowrap
                transition-all duration-200 min-w-fit
                ${
                  activeTab === 'financial'
                    ? 'text-primary bg-primary/10 border border-primary/30'
                    : 'text-muted-foreground hover:text-foreground'
                }
              `}
            >
              <DollarSign className="w-4 h-4" aria-hidden="true" />
              <span className="font-medium text-sm">Financier</span>
            </button>

            <button
              onClick={() => setActiveTab('links')}
              role="tab"
              aria-selected={activeTab === 'links'}
              aria-controls="links-panel"
              className={`
                relative px-4 py-3 rounded-lg flex items-center gap-2 whitespace-nowrap
                transition-all duration-200 min-w-fit
                ${
                  activeTab === 'links'
                    ? 'text-primary bg-primary/10 border border-primary/30'
                    : 'text-muted-foreground hover:text-foreground'
                }
              `}
            >
              <LinkIcon className="w-4 h-4" aria-hidden="true" />
              <span className="font-medium text-sm">Liens</span>
            </button>

            <button
              onClick={() => setActiveTab('deliverables')}
              role="tab"
              aria-selected={activeTab === 'deliverables'}
              aria-controls="deliverables-panel"
              className={`
                relative px-4 py-3 rounded-lg flex items-center gap-2 whitespace-nowrap
                transition-all duration-200 min-w-fit
                ${
                  activeTab === 'deliverables'
                    ? 'text-primary bg-primary/10 border border-primary/30'
                    : 'text-muted-foreground hover:text-foreground'
                }
              `}
            >
              <Award className="w-4 h-4" aria-hidden="true" />
              <span className="font-medium text-sm">Livrables</span>
            </button>

            <button
              onClick={() => setActiveTab('tasks')}
              role="tab"
              aria-selected={activeTab === 'tasks'}
              aria-controls="tasks-panel"
              className={`
                relative px-4 py-3 rounded-lg flex items-center gap-2 whitespace-nowrap
                transition-all duration-200 min-w-fit
                ${
                  activeTab === 'tasks'
                    ? 'text-primary bg-primary/10 border border-primary/30'
                    : 'text-muted-foreground hover:text-foreground'
                }
              `}
            >
              <Kanban className="w-4 h-4" aria-hidden="true" />
              <span className="font-medium text-sm">Tâches</span>
            </button>

            <button
              onClick={() => setActiveTab('timeline')}
              role="tab"
              aria-selected={activeTab === 'timeline'}
              aria-controls="timeline-panel"
              className={`
                relative px-4 py-3 rounded-lg flex items-center gap-2 whitespace-nowrap
                transition-all duration-200 min-w-fit
                ${
                  activeTab === 'timeline'
                    ? 'text-primary bg-primary/10 border border-primary/30'
                    : 'text-muted-foreground hover:text-foreground'
                }
              `}
            >
              <GanttChart className="w-4 h-4" aria-hidden="true" />
              <span className="font-medium text-sm">Planification</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6" role="tabpanel" id="overview-panel">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Statut Card */}
              <div className="glass-card p-xl rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="glass-badge p-3 rounded-lg bg-primary/10">
                    <Briefcase className="w-6 h-6 text-primary" aria-hidden="true" />
                  </div>
                </div>
                <Text variant="small" className="text-muted-foreground mb-1">
                  Statut du projet
                </Text>
                <p className="text-2xl font-black text-foreground mb-2">
                  {getStatusLabel(project.status)}
                </p>
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  project.status === 'ACTIVE' ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300' :
                  project.status === 'COMPLETED' ? 'bg-green-500/20 text-green-700 dark:text-green-300' :
                  'bg-gray-500/20 text-gray-700 dark:text-gray-300'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    project.status === 'ACTIVE' ? 'bg-blue-500' :
                    project.status === 'COMPLETED' ? 'bg-green-500' : 'bg-gray-500'
                  }`} />
                  {project.status === 'ACTIVE' ? 'En cours' : project.status === 'COMPLETED' ? 'Terminé' : 'Archivé'}
                </div>
              </div>

              {/* Équipe Card */}
              <div className="glass-card p-xl rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="glass-badge p-3 rounded-lg bg-purple-500/10">
                    <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" aria-hidden="true" />
                  </div>
                </div>
                <Text variant="small" className="text-muted-foreground mb-1">
                  Équipe
                </Text>
                <p className="text-2xl font-black text-foreground mb-2">
                  {project.equipe || 'Non assignée'}
                </p>
                {project.contact && (
                  <Text variant="caption" className="text-muted-foreground">
                    Contact: {project.contact}
                  </Text>
                )}
              </div>

              {/* Budget Card */}
              <div className="glass-card p-xl rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="glass-badge p-3 rounded-lg bg-green-500/10">
                    <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" aria-hidden="true" />
                  </div>
                </div>
                <Text variant="small" className="text-muted-foreground mb-1">
                  Budget
                </Text>
                <p className="text-2xl font-black text-foreground mb-2">
                  {formatCurrency((project as Project & { budget?: number | null }).budget ?? null)}
                </p>
                {(project as Project & { taux_horaire?: number | null }).taux_horaire && (
                  <Text variant="caption" className="text-muted-foreground">
                    Taux: {formatCurrency((project as Project & { taux_horaire?: number | null }).taux_horaire!)}/h
                  </Text>
                )}
              </div>

              {/* Dates Card */}
              <div className="glass-card p-xl rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="glass-badge p-3 rounded-lg bg-amber-500/10">
                    <Calendar className="w-6 h-6 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                  </div>
                </div>
                <Text variant="small" className="text-muted-foreground mb-1">
                  Année
                </Text>
                <p className="text-2xl font-black text-foreground mb-2">
                  {project.annee_realisation || new Date(project.created_at).getFullYear()}
                </p>
                <Text variant="caption" className="text-muted-foreground">
                  Créé le {new Date(project.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </Text>
              </div>
            </div>

            {/* Informations détaillées */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="glass-card p-xl rounded-xl">
                <Heading level={3} className="mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" aria-hidden="true" />
                  Informations générales
                </Heading>
                <div className="space-y-3">
                  <div>
                    <Text variant="small" className="font-medium text-muted-foreground mb-1">Nom du projet</Text>
                    <Text variant="body" className="font-semibold text-foreground">{project.name}</Text>
                  </div>
                  {project.client_name && (
                    <div>
                      <Text variant="small" className="font-medium text-muted-foreground mb-1">Client</Text>
                      <Text variant="body" className="font-semibold text-foreground">{project.client_name}</Text>
                    </div>
                  )}
                  {project.description && (
                    <div>
                      <Text variant="small" className="font-medium text-muted-foreground mb-1">Description</Text>
                      <Text variant="body" className="text-foreground">{project.description}</Text>
                    </div>
                  )}
                  {project.etape && (
                    <div>
                      <Text variant="small" className="font-medium text-muted-foreground mb-1">Étape</Text>
                      <Text variant="body" className="font-semibold text-foreground">{project.etape}</Text>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="glass-card p-xl rounded-xl">
                <Heading level={3} className="mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5" aria-hidden="true" />
                  Chronologie
                </Heading>
                <div className="space-y-3">
                  <div>
                    <Text variant="small" className="font-medium text-muted-foreground mb-1">Créé le</Text>
                    <Text variant="body" className="font-semibold text-foreground">{formatDate(project.created_at)}</Text>
                  </div>
                  <div>
                    <Text variant="small" className="font-medium text-muted-foreground mb-1">Dernière modification</Text>
                    <Text variant="body" className="font-semibold text-foreground">{formatDate(project.updated_at)}</Text>
                  </div>
                  {project.annee_realisation && (
                    <div>
                      <Text variant="small" className="font-medium text-muted-foreground mb-1">Année de réalisation</Text>
                      <Text variant="body" className="font-semibold text-foreground">{project.annee_realisation}</Text>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'financial' && (
          <div className="space-y-6" role="tabpanel" id="financial-panel">
            {/* Financial KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Budget Card */}
              <div className="glass-card p-xl rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="glass-badge p-3 rounded-lg bg-green-500/10">
                    <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" aria-hidden="true" />
                  </div>
                </div>
                <Text variant="small" className="text-muted-foreground mb-1">
                  Budget total
                </Text>
                <p className="text-3xl font-black text-foreground mb-2">
                  {formatCurrency((project as Project & { budget?: number | null }).budget ?? null)}
                </p>
                <div className="w-full bg-muted rounded-full h-2 mt-4">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full" 
                    style={{ width: '100%' }}
                    role="progressbar"
                    aria-valuenow={100}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
              </div>

              {/* Taux Horaire Card */}
              <div className="glass-card p-xl rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="glass-badge p-3 rounded-lg bg-primary/10">
                    <Clock className="w-6 h-6 text-primary" aria-hidden="true" />
                  </div>
                </div>
                <Text variant="small" className="text-muted-foreground mb-1">
                  Taux horaire
                </Text>
                <p className="text-3xl font-black text-foreground mb-2">
                  {(project as Project & { taux_horaire?: number | null }).taux_horaire ? `${formatCurrency((project as Project & { taux_horaire?: number | null }).taux_horaire!)}/h` : '-'}
                </p>
                <Text variant="caption" className="text-muted-foreground mt-4">
                  Facturation horaire
                </Text>
              </div>
            </div>

            {/* Empty State */}
            {!((project as Project & { budget?: number | null }).budget) && !((project as Project & { taux_horaire?: number | null }).taux_horaire) && (
              <div className="glass-card p-3xl rounded-xl text-center">
                <div className="glass-badge p-4 rounded-full bg-muted w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <DollarSign className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
                </div>
                <Heading level={3} className="mb-2">
                  Aucune information financière
                </Heading>
                <Text variant="body" className="text-muted-foreground">
                  Les données financières n'ont pas encore été renseignées pour ce projet.
                </Text>
              </div>
            )}
          </div>
        )}

        {activeTab === 'links' && (
          <div className="space-y-6" role="tabpanel" id="links-panel">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {project.proposal_url && (
                <a
                  href={project.proposal_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-card p-lg rounded-xl flex items-center gap-3 hover:shadow-lg transition-all group"
                  aria-label="Ouvrir le document de proposition dans un nouvel onglet"
                >
                  <div className="glass-badge p-3 rounded-lg bg-primary/10">
                    <FileText className="w-6 h-6 text-primary" aria-hidden="true" />
                  </div>
                  <div className="flex-1">
                    <Text variant="body" className="font-bold text-foreground">Proposal</Text>
                    <Text variant="small" className="text-muted-foreground">Document de proposition</Text>
                  </div>
                  <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" aria-hidden="true" />
                </a>
              )}

              {project.drive_url && (
                <a
                  href={project.drive_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-card p-lg rounded-xl flex items-center gap-3 hover:shadow-lg transition-all group"
                  aria-label="Ouvrir le dossier Google Drive dans un nouvel onglet"
                >
                  <div className="glass-badge p-3 rounded-lg bg-green-500/10">
                    <FileText className="w-6 h-6 text-green-600 dark:text-green-400" aria-hidden="true" />
                  </div>
                  <div className="flex-1">
                    <Text variant="body" className="font-bold text-foreground">Google Drive</Text>
                    <Text variant="small" className="text-muted-foreground">Dossier partagé</Text>
                  </div>
                  <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors" aria-hidden="true" />
                </a>
              )}

              {project.slack_url && (
                <a
                  href={project.slack_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-card p-lg rounded-xl flex items-center gap-3 hover:shadow-lg transition-all group"
                  aria-label="Ouvrir le canal Slack dans un nouvel onglet"
                >
                  <div className="glass-badge p-3 rounded-lg bg-purple-500/10">
                    <LinkIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" aria-hidden="true" />
                  </div>
                  <div className="flex-1">
                    <Text variant="body" className="font-bold text-foreground">Slack</Text>
                    <Text variant="small" className="text-muted-foreground">Canal de communication</Text>
                  </div>
                  <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" aria-hidden="true" />
                </a>
              )}

              {project.echeancier_url && (
                <a
                  href={project.echeancier_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-card p-lg rounded-xl flex items-center gap-3 hover:shadow-lg transition-all group"
                  aria-label="Ouvrir l'échéancier dans un nouvel onglet"
                >
                  <div className="glass-badge p-3 rounded-lg bg-amber-500/10">
                    <Calendar className="w-6 h-6 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                  </div>
                  <div className="flex-1">
                    <Text variant="body" className="font-bold text-foreground">Échéancier</Text>
                    <Text variant="small" className="text-muted-foreground">Planning du projet</Text>
                  </div>
                  <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors" aria-hidden="true" />
                </a>
              )}
            </div>

            {/* Empty State */}
            {!project.proposal_url && !project.drive_url && !project.slack_url && !project.echeancier_url && (
              <div className="glass-card p-3xl rounded-xl text-center">
                <div className="glass-badge p-4 rounded-full bg-muted w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <LinkIcon className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
                </div>
                <Heading level={3} className="mb-2">
                  Aucun lien disponible
                </Heading>
                <Text variant="body" className="text-muted-foreground">
                  Les liens et documents du projet n'ont pas encore été ajoutés.
                </Text>
              </div>
            )}
          </div>
        )}

        {activeTab === 'deliverables' && (
          <div className="space-y-6" role="tabpanel" id="deliverables-panel">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Témoignage Card */}
              <div className="glass-card p-xl rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="glass-badge p-3 rounded-lg bg-yellow-500/10">
                    <Award className="w-6 h-6 text-yellow-600 dark:text-yellow-400" aria-hidden="true" />
                  </div>
                </div>
                <Text variant="small" className="text-muted-foreground mb-1">
                  Témoignage client
                </Text>
                <p className="text-2xl font-black text-foreground mb-2">
                  {project.temoignage_status || 'Non renseigné'}
                </p>
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  project.temoignage_status === 'Reçu' ? 'bg-green-500/20 text-green-700 dark:text-green-300' :
                  project.temoignage_status === 'En attente' ? 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300' :
                  'bg-muted text-muted-foreground'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    project.temoignage_status === 'Reçu' ? 'bg-green-500' :
                    project.temoignage_status === 'En attente' ? 'bg-yellow-500' : 'bg-muted-foreground'
                  }`} aria-hidden="true" />
                  <Text variant="caption">{project.temoignage_status || 'Non défini'}</Text>
                </div>
              </div>

              {/* Portfolio Card */}
              <div className="glass-card p-xl rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="glass-badge p-3 rounded-lg bg-pink-500/10">
                    <Briefcase className="w-6 h-6 text-pink-600 dark:text-pink-400" aria-hidden="true" />
                  </div>
                </div>
                <Text variant="small" className="text-muted-foreground mb-1">
                  Ajout au portfolio
                </Text>
                <p className="text-2xl font-black text-foreground mb-2">
                  {project.portfolio_status || 'Non renseigné'}
                </p>
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  project.portfolio_status === 'Ajouté' ? 'bg-green-500/20 text-green-700 dark:text-green-300' :
                  project.portfolio_status === 'En cours' ? 'bg-primary/20 text-primary' :
                  'bg-muted text-muted-foreground'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    project.portfolio_status === 'Ajouté' ? 'bg-green-500' :
                    project.portfolio_status === 'En cours' ? 'bg-primary' : 'bg-muted-foreground'
                  }`} aria-hidden="true" />
                  <Text variant="caption">{project.portfolio_status || 'Non défini'}</Text>
                </div>
              </div>
            </div>

            {/* Empty State */}
            {!project.temoignage_status && !project.portfolio_status && (
              <div className="glass-card p-3xl rounded-xl text-center">
                <div className="glass-badge p-4 rounded-full bg-muted w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Award className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
                </div>
                <Heading level={3} className="mb-2">
                  Aucun livrable renseigné
                </Heading>
                <Text variant="body" className="text-muted-foreground">
                  Les statuts des livrables n'ont pas encore été mis à jour.
                </Text>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tasks' && (
          <Card className="glass-card p-xl" role="tabpanel" id="tasks-panel">
            {teamId ? (
              <TaskKanban projectId={projectId} teamId={teamId} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Text variant="body">Chargement de l'équipe...</Text>
              </div>
            )}
          </Card>
        )}

        {activeTab === 'timeline' && (
          <div role="tabpanel" id="timeline-panel">
            <ProjectGantt
              projectId={projectId}
              projectName={project.name}
              startDate={project.start_date}
              endDate={project.end_date}
              deadline={project.deadline}
            />
          </div>
        )}

        {/* Edit Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Modifier le projet"
          size="xl"
          footer={
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowEditModal(false)}
                disabled={isSaving}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveEdit}
                disabled={isSaving}
              >
                {isSaving ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          }
        >
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
            {/* Informations générales */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b pb-2">Informations générales</h3>
              <Input
                label="Nom du projet *"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                placeholder="Ex: Projet Alpha"
                fullWidth
              />
              <Textarea
                label="Description"
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                placeholder="Description du projet..."
                rows={4}
                fullWidth
              />
              <Select
                label="Statut"
                value={editFormData.status}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    status: e.target.value as 'ACTIVE' | 'COMPLETED' | 'ARCHIVED',
                  })
                }
                fullWidth
                options={[
                  { value: 'ACTIVE', label: 'Actif' },
                  { value: 'COMPLETED', label: 'Terminé' },
                  { value: 'ARCHIVED', label: 'Archivé' },
                ]}
              />
            </div>

            {/* Client et équipe */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b pb-2">Client et équipe</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Client"
                  value={editFormData.client_id?.toString() || ''}
                  onChange={(e) => {
                    const clientId = e.target.value ? parseInt(e.target.value) : null;
                    const selectedClient = clients.find(c => c.id === clientId);
                    setEditFormData({
                      ...editFormData,
                      client_id: clientId,
                      client_name: selectedClient?.name || '',
                    });
                  }}
                  fullWidth
                  disabled={loadingClients}
                  options={[
                    { value: '', label: 'Aucun client' },
                    ...clients.map(c => ({ value: c.id.toString(), label: c.name })),
                  ]}
                />
                <Input
                  label="Équipe"
                  value={editFormData.equipe}
                  onChange={(e) => setEditFormData({ ...editFormData, equipe: e.target.value })}
                  placeholder="Nom de l'équipe"
                  fullWidth
                />
                <Input
                  label="Contact"
                  value={editFormData.contact}
                  onChange={(e) => setEditFormData({ ...editFormData, contact: e.target.value })}
                  placeholder="Nom du contact"
                  fullWidth
                />
                <Input
                  label="Étape"
                  value={editFormData.etape}
                  onChange={(e) => setEditFormData({ ...editFormData, etape: e.target.value })}
                  placeholder="Étape du projet"
                  fullWidth
                />
              </div>
            </div>

            {/* Informations financières */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b pb-2">Informations financières</h3>
              <Input
                label="Budget (CAD)"
                type="number"
                value={editFormData.budget}
                onChange={(e) => setEditFormData({ ...editFormData, budget: e.target.value })}
                placeholder="0.00"
                fullWidth
              />
            </div>

            {/* Dates */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b pb-2">Dates</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Date de début"
                  type="date"
                  value={editFormData.start_date}
                  onChange={(e) => setEditFormData({ ...editFormData, start_date: e.target.value })}
                  fullWidth
                />
                <Input
                  label="Date de fin"
                  type="date"
                  value={editFormData.end_date}
                  onChange={(e) => setEditFormData({ ...editFormData, end_date: e.target.value })}
                  fullWidth
                />
                <Input
                  label="Échéance"
                  type="date"
                  value={editFormData.deadline}
                  onChange={(e) => setEditFormData({ ...editFormData, deadline: e.target.value })}
                  fullWidth
                />
              </div>
              <Input
                label="Année de réalisation"
                value={editFormData.annee_realisation}
                onChange={(e) => setEditFormData({ ...editFormData, annee_realisation: e.target.value })}
                placeholder="2024"
                fullWidth
              />
            </div>

            {/* Liens et documents */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b pb-2">Liens et documents</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="URL Proposal"
                  type="url"
                  value={editFormData.proposal_url}
                  onChange={(e) => setEditFormData({ ...editFormData, proposal_url: e.target.value })}
                  placeholder="https://..."
                  fullWidth
                />
                <Input
                  label="URL Google Drive"
                  type="url"
                  value={editFormData.drive_url}
                  onChange={(e) => setEditFormData({ ...editFormData, drive_url: e.target.value })}
                  placeholder="https://..."
                  fullWidth
                />
                <Input
                  label="URL Slack"
                  type="url"
                  value={editFormData.slack_url}
                  onChange={(e) => setEditFormData({ ...editFormData, slack_url: e.target.value })}
                  placeholder="https://..."
                  fullWidth
                />
                <Input
                  label="URL Échéancier"
                  type="url"
                  value={editFormData.echeancier_url}
                  onChange={(e) => setEditFormData({ ...editFormData, echeancier_url: e.target.value })}
                  placeholder="https://..."
                  fullWidth
                />
              </div>
            </div>

            {/* Statuts des livrables */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b pb-2">Statuts des livrables</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Statut témoignage"
                  value={editFormData.temoignage_status}
                  onChange={(e) => setEditFormData({ ...editFormData, temoignage_status: e.target.value })}
                  fullWidth
                  options={[
                    { value: '', label: 'Non renseigné' },
                    { value: 'Reçu', label: 'Reçu' },
                    { value: 'En attente', label: 'En attente' },
                    { value: 'Non demandé', label: 'Non demandé' },
                  ]}
                />
                <Select
                  label="Statut portfolio"
                  value={editFormData.portfolio_status}
                  onChange={(e) => setEditFormData({ ...editFormData, portfolio_status: e.target.value })}
                  fullWidth
                  options={[
                    { value: '', label: 'Non renseigné' },
                    { value: 'Ajouté', label: 'Ajouté' },
                    { value: 'En cours', label: 'En cours' },
                    { value: 'Non prévu', label: 'Non prévu' },
                  ]}
                />
              </div>
            </div>
          </div>
        </Modal>
    </div>
  );
}

export default function ProjectDetailPage() {
  return <ProjectDetailContent />;
}
