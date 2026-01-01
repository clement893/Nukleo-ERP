'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Alert from '@/components/ui/Alert';
import Loading from '@/components/ui/Loading';
import { projectsAPI, type Project } from '@/lib/api/projects';
import { handleApiError } from '@/lib/errors/api';
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

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [teamId, setTeamId] = useState<number | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    loadProject();
    loadTeamId();
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

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) {
      return;
    }

    try {
      await projectsAPI.delete(projectId);
      router.push('/dashboard/projects');
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors de la suppression du projet');
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
      <div className="py-8">
        <Container>
          <Card className="glass-card">
            <div className="py-12 text-center">
              <Loading />
            </div>
          </Card>
        </Container>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="py-8">
        <Container>
          <Alert variant="error" className="mb-6">
            {error || 'Projet introuvable'}
          </Alert>
          <Button onClick={() => router.push('/dashboard/projects')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux projets
          </Button>
        </Container>
      </div>
    );
  }

  return (
    <div className="py-8">
      <Container>
        {/* Breadcrumb */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard/projects')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux projets
          </Button>
        </div>

        {/* Header */}
        <Card className="glass-card rounded-xl p-6 mb-6">
          {/* Navigation & Actions */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard/projects')}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Retour aux projets</span>
            </Button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className={`glass-button p-2 rounded-lg transition-all ${
                  isFavorite ? 'text-yellow-500' : 'text-gray-400'
                }`}
              >
                <Star className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
              <button className="glass-button px-4 py-2 rounded-lg flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:inline">Partager</span>
              </button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/dashboard/projects/${projectId}/edit`)}
                className="glass-button text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
              >
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                className="glass-button text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Project Name & Status */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-black text-gray-900 dark:text-white">
                {project.name}
              </h1>
              {project.client_name && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Client: <span className="font-semibold">{project.client_name}</span>
                </p>
              )}
              {project.description && (
                <p className="text-gray-700 dark:text-gray-300 mt-3">{project.description}</p>
              )}
            </div>

            <div className={`glass-badge px-4 py-2 rounded-full border flex items-center gap-2 ${
              project.status === 'ACTIVE' ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30' :
              project.status === 'COMPLETED' ? 'bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30' :
              'bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-500/30'
            }`}>
              <span className={`w-2 h-2 rounded-full animate-pulse ${
                project.status === 'ACTIVE' ? 'bg-blue-500' :
                project.status === 'COMPLETED' ? 'bg-green-500' : 'bg-gray-500'
              }`} />
              <span className="font-semibold text-sm">{getStatusLabel(project.status)}</span>
            </div>
          </div>

          {/* Quick Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {project.equipe && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Équipe</p>
                  <p className="text-sm font-medium text-foreground">{project.equipe}</p>
                </div>
              </div>
            )}

            {project.etape && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Étape</p>
                  <p className="text-sm font-medium text-foreground">{project.etape}</p>
                </div>
              </div>
            )}

            {project.annee_realisation && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Année</p>
                  <p className="text-sm font-medium text-foreground">{project.annee_realisation}</p>
                </div>
              </div>
            )}

            {project.contact && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Contact</p>
                  <p className="text-sm font-medium text-foreground">{project.contact}</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Tabs */}
        <div className="glass-card rounded-xl p-2 mb-6">
          <div className="flex items-center gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`
                relative px-4 py-3 rounded-lg flex items-center gap-2 whitespace-nowrap
                transition-all duration-200 min-w-fit
                ${
                  activeTab === 'overview'
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/30'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }
              `}
            >
              <FileText className="w-4 h-4" />
              <span className="font-medium text-sm">Vue d'ensemble</span>
            </button>

            <button
              onClick={() => setActiveTab('financial')}
              className={`
                relative px-4 py-3 rounded-lg flex items-center gap-2 whitespace-nowrap
                transition-all duration-200 min-w-fit
                ${
                  activeTab === 'financial'
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/30'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }
              `}
            >
              <DollarSign className="w-4 h-4" />
              <span className="font-medium text-sm">Financier</span>
            </button>

            <button
              onClick={() => setActiveTab('links')}
              className={`
                relative px-4 py-3 rounded-lg flex items-center gap-2 whitespace-nowrap
                transition-all duration-200 min-w-fit
                ${
                  activeTab === 'links'
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/30'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }
              `}
            >
              <LinkIcon className="w-4 h-4" />
              <span className="font-medium text-sm">Liens</span>
            </button>

            <button
              onClick={() => setActiveTab('deliverables')}
              className={`
                relative px-4 py-3 rounded-lg flex items-center gap-2 whitespace-nowrap
                transition-all duration-200 min-w-fit
                ${
                  activeTab === 'deliverables'
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/30'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }
              `}
            >
              <Award className="w-4 h-4" />
              <span className="font-medium text-sm">Livrables</span>
            </button>

            <button
              onClick={() => setActiveTab('tasks')}
              className={`
                relative px-4 py-3 rounded-lg flex items-center gap-2 whitespace-nowrap
                transition-all duration-200 min-w-fit
                ${
                  activeTab === 'tasks'
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/30'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }
              `}
            >
              <Kanban className="w-4 h-4" />
              <span className="font-medium text-sm">Tâches</span>
            </button>

            <button
              onClick={() => setActiveTab('timeline')}
              className={`
                relative px-4 py-3 rounded-lg flex items-center gap-2 whitespace-nowrap
                transition-all duration-200 min-w-fit
                ${
                  activeTab === 'timeline'
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/30'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }
              `}
            >
              <GanttChart className="w-4 h-4" />
              <span className="font-medium text-sm">Planification</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Statut Card */}
              <div className="glass-card p-6 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="glass-badge p-3 rounded-lg bg-blue-500/10">
                    <Briefcase className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Statut du projet
                </h3>
                <p className="text-2xl font-black text-gray-900 dark:text-white mb-2">
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
              <div className="glass-card p-6 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="glass-badge p-3 rounded-lg bg-purple-500/10">
                    <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Équipe
                </h3>
                <p className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                  {project.equipe || 'Non assignée'}
                </p>
                {project.contact && (
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Contact: {project.contact}
                  </p>
                )}
              </div>

              {/* Budget Card */}
              <div className="glass-card p-6 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="glass-badge p-3 rounded-lg bg-green-500/10">
                    <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Budget
                </h3>
                <p className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                  {formatCurrency((project as Project & { budget?: number | null }).budget ?? null)}
                </p>
                {(project as Project & { taux_horaire?: number | null }).taux_horaire && (
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Taux: {formatCurrency((project as Project & { taux_horaire?: number | null }).taux_horaire!)}/h
                  </p>
                )}
              </div>

              {/* Dates Card */}
              <div className="glass-card p-6 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="glass-badge p-3 rounded-lg bg-amber-500/10">
                    <Calendar className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Année
                </h3>
                <p className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                  {project.annee_realisation || new Date(project.created_at).getFullYear()}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Créé le {new Date(project.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </p>
              </div>
            </div>

            {/* Informations détaillées */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="glass-card p-6 rounded-xl">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Informations générales
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Nom du projet</p>
                    <p className="text-gray-900 dark:text-white font-semibold">{project.name}</p>
                  </div>
                  {project.client_name && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Client</p>
                      <p className="text-gray-900 dark:text-white font-semibold">{project.client_name}</p>
                    </div>
                  )}
                  {project.description && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Description</p>
                      <p className="text-gray-700 dark:text-gray-300">{project.description}</p>
                    </div>
                  )}
                  {project.etape && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Étape</p>
                      <p className="text-gray-900 dark:text-white font-semibold">{project.etape}</p>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="glass-card p-6 rounded-xl">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Chronologie
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Créé le</p>
                    <p className="text-gray-900 dark:text-white font-semibold">{formatDate(project.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Dernière modification</p>
                    <p className="text-gray-900 dark:text-white font-semibold">{formatDate(project.updated_at)}</p>
                  </div>
                  {project.annee_realisation && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Année de réalisation</p>
                      <p className="text-gray-900 dark:text-white font-semibold">{project.annee_realisation}</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'financial' && (
          <div className="space-y-6">
            {/* Financial KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Budget Card */}
              <div className="glass-card p-6 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="glass-badge p-3 rounded-lg bg-green-500/10">
                    <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Budget total
                </h3>
                <p className="text-3xl font-black text-gray-900 dark:text-white mb-2">
                  {formatCurrency((project as Project & { budget?: number | null }).budget ?? null)}
                </p>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-4">
                  <div className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>

              {/* Taux Horaire Card */}
              <div className="glass-card p-6 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="glass-badge p-3 rounded-lg bg-blue-500/10">
                    <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Taux horaire
                </h3>
                <p className="text-3xl font-black text-gray-900 dark:text-white mb-2">
                  {(project as Project & { taux_horaire?: number | null }).taux_horaire ? `${formatCurrency((project as Project & { taux_horaire?: number | null }).taux_horaire!)}/h` : '-'}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-4">
                  Facturation horaire
                </p>
              </div>
            </div>

            {/* Empty State */}
            {!((project as Project & { budget?: number | null }).budget) && !((project as Project & { taux_horaire?: number | null }).taux_horaire) && (
              <div className="glass-card p-12 rounded-xl text-center">
                <div className="glass-badge p-4 rounded-full bg-gray-500/10 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <DollarSign className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  Aucune information financière
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Les données financières n'ont pas encore été renseignées pour ce projet.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'links' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {project.proposal_url && (
                <a
                  href={project.proposal_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-card p-4 rounded-xl flex items-center gap-3 hover:shadow-lg transition-all group"
                >
                  <div className="glass-badge p-3 rounded-lg bg-blue-500/10">
                    <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 dark:text-white">Proposal</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Document de proposition</p>
                  </div>
                  <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                </a>
              )}

              {project.drive_url && (
                <a
                  href={project.drive_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-card p-4 rounded-xl flex items-center gap-3 hover:shadow-lg transition-all group"
                >
                  <div className="glass-badge p-3 rounded-lg bg-green-500/10">
                    <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 dark:text-white">Google Drive</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Dossier partagé</p>
                  </div>
                  <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors" />
                </a>
              )}

              {project.slack_url && (
                <a
                  href={project.slack_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-card p-4 rounded-xl flex items-center gap-3 hover:shadow-lg transition-all group"
                >
                  <div className="glass-badge p-3 rounded-lg bg-purple-500/10">
                    <LinkIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 dark:text-white">Slack</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Canal de communication</p>
                  </div>
                  <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
                </a>
              )}

              {project.echeancier_url && (
                <a
                  href={project.echeancier_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-card p-4 rounded-xl flex items-center gap-3 hover:shadow-lg transition-all group"
                >
                  <div className="glass-badge p-3 rounded-lg bg-amber-500/10">
                    <Calendar className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 dark:text-white">Échéancier</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Planning du projet</p>
                  </div>
                  <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors" />
                </a>
              )}
            </div>

            {/* Empty State */}
            {!project.proposal_url && !project.drive_url && !project.slack_url && !project.echeancier_url && (
              <div className="glass-card p-12 rounded-xl text-center">
                <div className="glass-badge p-4 rounded-full bg-gray-500/10 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <LinkIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  Aucun lien disponible
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Les liens et documents du projet n'ont pas encore été ajoutés.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'deliverables' && (
          <Card className="glass-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
              <Award className="w-5 h-5" />
              Livrables et statuts
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-lg border border-border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                    <Award className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Témoignage</p>
                    <p className="text-sm text-muted-foreground">Statut du témoignage client</p>
                  </div>
                </div>
                <p className="text-lg font-semibold text-foreground">
                  {project.temoignage_status || 'Non renseigné'}
                </p>
              </div>

              <div className="p-6 rounded-lg border border-border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-pink-600" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Portfolio</p>
                    <p className="text-sm text-muted-foreground">Statut de l'ajout au portfolio</p>
                  </div>
                </div>
                <p className="text-lg font-semibold text-foreground">
                  {project.portfolio_status || 'Non renseigné'}
                </p>
              </div>
            </div>

            {!project.temoignage_status && !project.portfolio_status && (
              <div className="text-center py-8 text-muted-foreground mt-6">
                <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aucun livrable renseigné</p>
              </div>
            )}
          </Card>
        )}

        {activeTab === 'tasks' && (
          <Card className="glass-card p-6">
            {teamId ? (
              <TaskKanban projectId={projectId} teamId={teamId} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Chargement de l'équipe...</p>
              </div>
            )}
          </Card>
        )}

        {activeTab === 'timeline' && (
          <ProjectGantt
            projectId={projectId}
            projectName={project.name}
            startDate={project.start_date}
            endDate={project.end_date}
            deadline={project.deadline}
          />
        )}
      </Container>
    </div>
  );
}

export default function ProjectDetailPage() {
  return <ProjectDetailContent />;
}
