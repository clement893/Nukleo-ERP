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
} from 'lucide-react';

type Tab = 'overview' | 'financial' | 'links' | 'deliverables';

function ProjectDetailContent() {
  const router = useRouter();
  const params = useParams();
  const projectId = parseInt(params.id as string);

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  useEffect(() => {
    loadProject();
  }, [projectId]);

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
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
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
                Dates
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Créé le</p>
                  <p className="text-foreground">{formatDate(project.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Modifié le</p>
                  <p className="text-foreground">{formatDate(project.updated_at)}</p>
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
        )}

        {activeTab === 'financial' && (
          <Card className="glass-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Informations financières
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-lg bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
                <p className="text-sm text-green-700 mb-2">Budget total</p>
                <p className="text-3xl font-bold text-green-900">
                  {formatCurrency((project as Project & { budget?: number | null }).budget ?? null)}
                </p>
              </div>

              <div className="p-6 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                <p className="text-sm text-blue-700 mb-2">Taux horaire</p>
                <p className="text-3xl font-bold text-blue-900">
                  {(project as Project & { taux_horaire?: number | null }).taux_horaire ? `${formatCurrency((project as Project & { taux_horaire?: number | null }).taux_horaire!)}/h` : '-'}
                </p>
              </div>
            </div>

            {!((project as Project & { budget?: number | null }).budget) && !((project as Project & { taux_horaire?: number | null }).taux_horaire) && (
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aucune information financière disponible</p>
              </div>
            )}
          </Card>
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
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
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
      </Container>
    </div>
  );
}

export default function ProjectDetailPage() {
  return <ProjectDetailContent />;
}
