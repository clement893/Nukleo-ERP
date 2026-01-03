'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
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
  CheckSquare,
  TrendingUp,
  TrendingDown,
  AlertCircle,
} from 'lucide-react';
import TaskKanban from '@/components/projects/TaskKanban';
import TaskTimeline from '@/components/projects/TaskTimeline';
import ProjectAttachments from '@/components/projects/ProjectAttachments';
import ProjectComments from '@/components/projects/ProjectComments';
import ProjectGantt from '@/components/projects/ProjectGantt';
import ProjectStatistics from '@/components/projects/ProjectStatistics';
import ProjectDeadlines from '@/components/projects/ProjectDeadlines';
import ProjectEmployees from '@/components/projects/ProjectEmployees';
import ProjectBudgetManager from '@/components/projects/ProjectBudgetManager';
import { projectTasksAPI } from '@/lib/api/project-tasks';
import { transactionsAPI, type Transaction } from '@/lib/api/finances/transactions';

type Tab = 'overview' | 'tasks' | 'timeline' | 'financial' | 'links' | 'deliverables' | 'files' | 'comments' | 'gantt' | 'statistics' | 'deadlines' | 'employees';

function ProjectDetailContent() {
  const router = useRouter();
  const params = useParams();
  const projectId = parseInt(params.id as string);

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [tasksCount, setTasksCount] = useState({ total: 0, completed: 0, inProgress: 0 });
  const [financialData, setFinancialData] = useState<{
    expenses: Transaction[];
    revenues: Transaction[];
    totalExpenses: number;
    totalRevenues: number;
    loading: boolean;
  }>({
    expenses: [],
    revenues: [],
    totalExpenses: 0,
    totalRevenues: 0,
    loading: false,
  });

  useEffect(() => {
    loadProject();
    loadTasksStats();
  }, [projectId]);

  useEffect(() => {
    if (project && activeTab === 'financial') {
      loadFinancialData();
    }
  }, [project, activeTab, projectId]);

  const loadTasksStats = async () => {
    try {
      const tasks = await projectTasksAPI.list({ project_id: projectId });
      setTasksCount({
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'completed').length,
        inProgress: tasks.filter(t => t.status === 'in_progress').length,
      });
    } catch (err) {
      // Silently fail - tasks might not be available
      console.warn('Could not load task stats:', err);
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

  const loadFinancialData = async () => {
    if (!project) return;
    
    setFinancialData(prev => ({ ...prev, loading: true }));
    try {
      // Load all transactions and filter by client if project has a client
      // Note: Transactions don't have direct project_id, so we filter by client_name or description
      const [expenses, revenues] = await Promise.all([
        transactionsAPI.list({ 
          type: 'expense',
          limit: 1000,
        }),
        transactionsAPI.list({ 
          type: 'revenue',
          limit: 1000,
        }),
      ]);

      // Filter transactions related to this project
      // We match by client_name if project has a client, or by description containing project name
      const projectExpenses = expenses.filter(t => {
        if (project.client_name && t.supplier_name) {
          // For expenses, we might match by supplier or description
          return t.description?.toLowerCase().includes(project.name.toLowerCase()) || false;
        }
        return t.description?.toLowerCase().includes(project.name.toLowerCase()) || false;
      });

      const projectRevenues = revenues.filter(t => {
        if (project.client_name && t.client_name) {
          return t.client_name === project.client_name || 
                 t.description?.toLowerCase().includes(project.name.toLowerCase()) || false;
        }
        return t.description?.toLowerCase().includes(project.name.toLowerCase()) || false;
      });

      const totalExpenses = projectExpenses.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      const totalRevenues = projectRevenues.reduce((sum, t) => sum + parseFloat(t.amount), 0);

      setFinancialData({
        expenses: projectExpenses,
        revenues: projectRevenues,
        totalExpenses,
        totalRevenues,
        loading: false,
      });
    } catch (err) {
      console.warn('Could not load financial data:', err);
      setFinancialData(prev => ({ ...prev, loading: false }));
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'default'> = {
      ACTIVE: 'success',
      COMPLETED: 'default',
      ARCHIVED: 'warning',
    };
    return variants[status] || 'default';
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

  const formatDateShort = (date: string | null | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysUntilDeadline = (deadline: string | null | undefined): number | null => {
    if (!deadline) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(0, 0, 0, 0);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getProjectProgress = (): number => {
    if (tasksCount.total === 0) return 0;
    return Math.round((tasksCount.completed / tasksCount.total) * 100);
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
        <Card className="glass-card p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-foreground">{project.name}</h1>
                <Badge variant={getStatusBadge(project.status)}>
                  {getStatusLabel(project.status)}
                </Badge>
              </div>
              {project.client_name && (
                <p className="text-lg text-muted-foreground mb-4">{project.client_name}</p>
              )}
              {project.description && (
                <p className="text-foreground mt-4">{project.description}</p>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/dashboard/projects/${projectId}/edit`)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
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
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-primary-600" />
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
        <div className="mb-6">
          <div className="flex gap-2 border-b border-border">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 font-medium transition-colors relative ${
                activeTab === 'overview'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Vue d'ensemble
              {activeTab === 'overview' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-6 py-3 font-medium transition-colors relative ${
                activeTab === 'tasks'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <CheckSquare className="w-4 h-4 inline mr-2" />
              Tâches
              {tasksCount.total > 0 && (
                <Badge variant="default" className="ml-2 text-xs">
                  {tasksCount.completed}/{tasksCount.total}
                </Badge>
              )}
              {activeTab === 'tasks' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-6 py-3 font-medium transition-colors relative ${
                activeTab === 'timeline'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-2" />
              Timeline
              {activeTab === 'timeline' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('financial')}
              className={`px-6 py-3 font-medium transition-colors relative ${
                activeTab === 'financial'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <DollarSign className="w-4 h-4 inline mr-2" />
              Financier
              {activeTab === 'financial' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('links')}
              className={`px-6 py-3 font-medium transition-colors relative ${
                activeTab === 'links'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LinkIcon className="w-4 h-4 inline mr-2" />
              Liens
              {activeTab === 'links' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('deliverables')}
              className={`px-6 py-3 font-medium transition-colors relative ${
                activeTab === 'deliverables'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Award className="w-4 h-4 inline mr-2" />
              Livrables
              {activeTab === 'deliverables' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('deadlines')}
              className={`px-6 py-3 font-medium transition-colors relative ${
                activeTab === 'deadlines'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Clock className="w-4 h-4 inline mr-2" />
              Deadlines
              {activeTab === 'deadlines' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('employees')}
              className={`px-6 py-3 font-medium transition-colors relative ${
                activeTab === 'employees'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Employés
              {activeTab === 'employees' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Project Progress */}
            {tasksCount.total > 0 && (
              <Card className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Progression du projet
                  </h3>
                  <Badge variant="default" className="text-lg">
                    {getProjectProgress()}%
                  </Badge>
                </div>
                <div className="w-full bg-muted-foreground/20 rounded-full h-4 mb-2">
                  <div
                    className="bg-primary h-4 rounded-full transition-all"
                    style={{ width: `${getProjectProgress()}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{tasksCount.completed} tâche{tasksCount.completed > 1 ? 's' : ''} terminée{tasksCount.completed > 1 ? 's' : ''}</span>
                  <span>{tasksCount.total} tâche{tasksCount.total > 1 ? 's' : ''} au total</span>
                </div>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="glass-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Informations générales
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Nom du projet</p>
                  <p className="text-foreground font-medium">{project.name}</p>
                </div>
                {project.description && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Description</p>
                    <p className="text-foreground">{project.description}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Statut</p>
                  <Badge variant={getStatusBadge(project.status)}>
                    {getStatusLabel(project.status)}
                  </Badge>
                </div>
              </div>
            </Card>

            <Card className="glass-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Dates et Deadlines
              </h3>
              <div className="space-y-4">
                {project.start_date && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Date de début</p>
                    <p className="text-foreground font-medium">{formatDateShort(project.start_date)}</p>
                  </div>
                )}
                {project.end_date && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Date de fin prévue</p>
                    <p className="text-foreground font-medium">{formatDateShort(project.end_date)}</p>
                  </div>
                )}
                {project.deadline && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Deadline</p>
                    <div className="flex items-center gap-2">
                      <p className="text-foreground font-medium">{formatDateShort(project.deadline)}</p>
                      {(() => {
                        const daysLeft = getDaysUntilDeadline(project.deadline);
                        if (daysLeft === null) return null;
                        if (daysLeft < 0) {
                          return (
                            <Badge variant="error" className="flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {Math.abs(daysLeft)} jour{Math.abs(daysLeft) > 1 ? 's' : ''} de retard
                            </Badge>
                          );
                        } else if (daysLeft <= 7) {
                          return (
                            <Badge variant="warning" className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {daysLeft} jour{daysLeft > 1 ? 's' : ''} restant{daysLeft > 1 ? 's' : ''}
                            </Badge>
                          );
                        } else {
                          return (
                            <Badge variant="default" className="flex items-center gap-1">
                              {daysLeft} jour{daysLeft > 1 ? 's' : ''} restant{daysLeft > 1 ? 's' : ''}
                            </Badge>
                          );
                        }
                      })()}
                    </div>
                  </div>
                )}
                <div className="pt-2 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-1">Créé le</p>
                  <p className="text-foreground text-sm">{formatDate(project.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Modifié le</p>
                  <p className="text-foreground text-sm">{formatDate(project.updated_at)}</p>
                </div>
                {project.annee_realisation && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Année de réalisation</p>
                    <p className="text-foreground font-medium">{project.annee_realisation}</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-6">
            <Card className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <CheckSquare className="w-5 h-5" />
                  Tâches du projet
                </h3>
                <div className="flex gap-2">
                  <Badge variant="default">{tasksCount.total} total</Badge>
                  <Badge variant="success">{tasksCount.completed} terminées</Badge>
                  <Badge variant="info">{tasksCount.inProgress} en cours</Badge>
                </div>
              </div>
              <TaskKanban projectId={projectId} />
            </Card>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="space-y-6">
            <Card className="glass-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Timeline du projet
              </h3>
              <TaskTimeline projectId={projectId} />
            </Card>
          </div>
        )}

        {activeTab === 'financial' && (
          <div className="space-y-6">
            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="glass-card p-6 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-lg bg-green-500/10">
                    <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-1">Budget total</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency((project as Project & { budget?: number | null }).budget ?? null)}
                </p>
              </Card>

              <Card className="glass-card p-6 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-lg bg-red-500/10">
                    <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-1">Dépenses réelles</p>
                <p className="text-2xl font-bold text-foreground">
                  {financialData.loading ? (
                    <span className="text-muted-foreground">Chargement...</span>
                  ) : (
                    formatCurrency(financialData.totalExpenses)
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {financialData.expenses.length} transaction{financialData.expenses.length > 1 ? 's' : ''}
                </p>
              </Card>

              <Card className="glass-card p-6 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-lg bg-blue-500/10">
                    <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-1">Revenus réels</p>
                <p className="text-2xl font-bold text-foreground">
                  {financialData.loading ? (
                    <span className="text-muted-foreground">Chargement...</span>
                  ) : (
                    formatCurrency(financialData.totalRevenues)
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {financialData.revenues.length} transaction{financialData.revenues.length > 1 ? 's' : ''}
                </p>
              </Card>

              <Card className="glass-card p-6 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <DollarSign className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-1">Marge nette</p>
                <p className={`text-2xl font-bold ${
                  financialData.totalRevenues - financialData.totalExpenses >= 0 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {financialData.loading ? (
                    <span className="text-muted-foreground">Chargement...</span>
                  ) : (
                    formatCurrency(financialData.totalRevenues - financialData.totalExpenses)
                  )}
                </p>
                {(project as Project & { budget?: number | null }).budget && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {(() => {
                      const budget = (project as Project & { budget?: number | null }).budget || 0;
                      const margin = financialData.totalRevenues - financialData.totalExpenses;
                      const percentage = budget > 0 ? ((margin / budget) * 100).toFixed(1) : '0';
                      return `${percentage}% du budget`;
                    })()}
                  </p>
                )}
              </Card>
            </div>

            {/* Budget vs Expenses Comparison */}
            {(project as Project & { budget?: number | null }).budget && (
              <Card className="glass-card p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Comparaison Budget vs Dépenses
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Budget alloué</span>
                      <span className="text-sm font-semibold text-foreground">
                        {formatCurrency((project as Project & { budget?: number | null }).budget)}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3">
                      <div 
                        className="bg-green-500 h-3 rounded-full transition-all"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Dépenses réelles</span>
                      <span className="text-sm font-semibold text-foreground">
                        {formatCurrency(financialData.totalExpenses)}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all ${
                          financialData.totalExpenses > ((project as Project & { budget?: number | null }).budget || 0)
                            ? 'bg-red-500'
                            : 'bg-yellow-500'
                        }`}
                        style={{ 
                          width: `${Math.min(
                            ((financialData.totalExpenses / ((project as Project & { budget?: number | null }).budget || 1)) * 100),
                            100
                          )}%` 
                        }}
                      />
                    </div>
                    {financialData.totalExpenses > ((project as Project & { budget?: number | null }).budget || 0) && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        Dépassement de {formatCurrency(financialData.totalExpenses - ((project as Project & { budget?: number | null }).budget || 0))}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Project Budget Manager */}
            <ProjectBudgetManager projectId={projectId} />

            {/* Additional Financial Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="glass-card p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Informations de base
                </h3>
                <div className="space-y-4">
                  {(project as Project & { taux_horaire?: number | null }).taux_horaire && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Taux horaire</p>
                      <p className="text-lg font-semibold text-foreground">
                        {formatCurrency((project as Project & { taux_horaire?: number | null }).taux_horaire!)}/h
                      </p>
                    </div>
                  )}
                  {project.client_name && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Client</p>
                      <p className="text-lg font-semibold text-foreground">{project.client_name}</p>
                    </div>
                  )}
                </div>
              </Card>

              {(financialData.expenses.length > 0 || financialData.revenues.length > 0) && (
                <Card className="glass-card p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Transactions récentes
                  </h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {[...financialData.revenues.slice(0, 3), ...financialData.expenses.slice(0, 3)]
                      .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
                      .slice(0, 5)
                      .map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">{transaction.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(transaction.transaction_date).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          <p className={`text-sm font-semibold ${
                            transaction.type === 'revenue' 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {transaction.type === 'revenue' ? '+' : '-'}
                            {formatCurrency(parseFloat(transaction.amount))}
                          </p>
                        </div>
                      ))}
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}

        {activeTab === 'links' && (
          <Card className="glass-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
              <LinkIcon className="w-5 h-5" />
              Liens et documents
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {project.proposal_url && (
                <a
                  href={project.proposal_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary hover:bg-accent transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Proposal</p>
                    <p className="text-sm text-muted-foreground">Document de proposition</p>
                  </div>
                  <ExternalLink className="w-5 h-5 text-muted-foreground" />
                </a>
              )}

              {project.drive_url && (
                <a
                  href={project.drive_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary hover:bg-accent transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Google Drive</p>
                    <p className="text-sm text-muted-foreground">Dossier partagé</p>
                  </div>
                  <ExternalLink className="w-5 h-5 text-muted-foreground" />
                </a>
              )}

              {project.slack_url && (
                <a
                  href={project.slack_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary hover:bg-accent transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <LinkIcon className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Slack</p>
                    <p className="text-sm text-muted-foreground">Canal de communication</p>
                  </div>
                  <ExternalLink className="w-5 h-5 text-muted-foreground" />
                </a>
              )}

              {project.echeancier_url && (
                <a
                  href={project.echeancier_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary hover:bg-accent transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Échéancier</p>
                    <p className="text-sm text-muted-foreground">Planning du projet</p>
                  </div>
                  <ExternalLink className="w-5 h-5 text-muted-foreground" />
                </a>
              )}
            </div>

            {!project.proposal_url && !project.drive_url && !project.slack_url && !project.echeancier_url && (
              <div className="text-center py-8 text-muted-foreground">
                <LinkIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aucun lien disponible</p>
              </div>
            )}
          </Card>
        )}

        {activeTab === 'files' && (
          <Card className="glass-card p-6">
            <ProjectAttachments projectId={projectId} />
          </Card>
        )}

        {activeTab === 'comments' && (
          <Card className="glass-card p-6">
            <ProjectComments projectId={projectId} />
          </Card>
        )}

        {activeTab === 'gantt' && (
          <ProjectGantt projectId={projectId} startDate={project.start_date || null} endDate={project.end_date || null} />
        )}

        {activeTab === 'statistics' && (
          <div className="space-y-6">
            <ProjectStatistics projectId={projectId} budget={project.budget} />
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

        {activeTab === 'deadlines' && (
          <Card className="glass-card p-6">
            <ProjectDeadlines projectId={projectId} />
          </Card>
        )}

        {activeTab === 'employees' && (
          <ProjectEmployees projectId={projectId} />
        )}
      </Container>
    </div>
  );
}

export default function ProjectDetailPage() {
  return <ProjectDetailContent />;
}
