'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useParams, useRouter } from 'next/navigation';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { 
  CheckCircle2,
  Circle,
  Play,
  Ban,
  ArrowLeft,
  Calendar,
  User,
  Edit,
  Trash2,
  Loader2
} from 'lucide-react';
import { Badge, Button, Card, useToast, Loading, Alert } from '@/components/ui';
import { useProjectTask, useDeleteProjectTask } from '@/lib/query/project-tasks';
import type { TaskStatus, TaskPriority } from '@/lib/api/project-tasks';

const statusConfig: Record<TaskStatus, { label: string; icon: any; color: string }> = {
  todo: { label: 'À faire', icon: Circle, color: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/30' },
  in_progress: { label: 'En cours', icon: Play, color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30' },
  blocked: { label: 'Bloqué', icon: Ban, color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30' },
  to_transfer: { label: 'À transférer', icon: CheckCircle2, color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30' },
  completed: { label: 'Terminé', icon: CheckCircle2, color: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30' }
};

const priorityConfig: Record<TaskPriority, { label: string; color: string }> = {
  low: { label: 'Basse', color: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/30' },
  medium: { label: 'Moyenne', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30' },
  high: { label: 'Haute', color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30' },
  urgent: { label: 'Urgente', color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30' }
};

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const taskId = params?.id ? parseInt(String(params.id)) : null;
  const locale = params?.locale as string || 'fr';

  const { data: task, isLoading, error } = useProjectTask(taskId || 0, !!taskId);
  const deleteMutation = useDeleteProjectTask();

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'Non définie';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleBack = () => {
    router.push(`/${locale}/dashboard/projets/taches`);
  };

  const handleDelete = async () => {
    if (!task || !confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) return;
    
    try {
      await deleteMutation.mutateAsync(task.id);
      showToast({ message: 'Tâche supprimée avec succès', type: 'success' });
      handleBack();
    } catch (error) {
      showToast({ message: 'Erreur lors de la suppression', type: 'error' });
    }
  };

  if (!taskId) {
    return (
      <PageContainer>
        <Alert variant="error">ID de tâche invalide</Alert>
      </PageContainer>
    );
  }

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-96">
          <Loading />
        </div>
      </PageContainer>
    );
  }

  if (error || !task) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <Alert variant="error">
            {error ? 'Erreur lors du chargement de la tâche' : 'Tâche non trouvée'}
          </Alert>
          <Button variant="outline" onClick={handleBack} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux tâches
          </Button>
        </div>
      </PageContainer>
    );
  }

  const StatusIcon = statusConfig[task.status].icon;

  return (
    <PageContainer>
      <MotionDiv variant="slideUp" duration="normal">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" onClick={handleBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux tâches
          </Button>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {task.title}
              </h1>
              <div className="flex items-center gap-3">
                <Badge className={`${statusConfig[task.status].color} border text-xs px-2 py-1`}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {statusConfig[task.status].label}
                </Badge>
                <Badge className={`${priorityConfig[task.priority].color} border text-xs px-2 py-1`}>
                  {priorityConfig[task.priority].label}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => router.push(`/${locale}/dashboard/projets/taches/${task.id}/edit`)}>
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </Button>
              <Button 
                variant="outline" 
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Supprimer
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Description
              </h2>
              {task.description ? (
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {task.description}
                </p>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 italic">Aucune description</p>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Details */}
            <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Détails
              </h2>
              <div className="space-y-4">
                {/* Assignee */}
                <div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Assigné à
                  </div>
                  <p className="text-gray-900 dark:text-white">
                    {task.assignee_name || 'Non assigné'}
                  </p>
                  {task.assignee_email && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {task.assignee_email}
                    </p>
                  )}
                </div>

                {/* Due Date */}
                <div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Date d'échéance
                  </div>
                  <p className="text-gray-900 dark:text-white">
                    {formatDate(task.due_date)}
                  </p>
                </div>

                {/* Estimated Hours */}
                {task.estimated_hours && (
                  <div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Heures estimées
                    </div>
                    <p className="text-gray-900 dark:text-white">
                      {task.estimated_hours}h
                    </p>
                  </div>
                )}

                {/* Dates */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Démarrée le
                  </div>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {task.started_at ? formatDate(task.started_at) : 'Non démarrée'}
                  </p>
                </div>

                {task.completed_at && (
                  <div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Terminée le
                    </div>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {formatDate(task.completed_at)}
                    </p>
                  </div>
                )}

                <div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Créée le
                  </div>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {formatDate(task.created_at)}
                  </p>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Modifiée le
                  </div>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {formatDate(task.updated_at)}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </MotionDiv>
    </PageContainer>
  );
}
