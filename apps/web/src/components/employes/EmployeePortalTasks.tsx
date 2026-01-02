'use client';

import { useEffect, useState, useRef } from 'react';
import { projectTasksAPI, type ProjectTask } from '@/lib/api/project-tasks';
import { projectCommentsAPI, type ProjectComment } from '@/lib/api/project-comments';
import type { ProjectAttachment } from '@/lib/api/project-attachments';
import { projectAttachmentsAPI } from '@/lib/api/project-attachments';
import { projectsAPI, type Project } from '@/lib/api/projects';
import { teamsAPI, type Team } from '@/lib/api/teams';
import { extractApiData } from '@/lib/api/utils';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import { logger } from '@/lib/logger';
import { Card, Loading, Alert } from '@/components/ui';
import Button from '@/components/ui/Button';
import Tabs, { type Tab } from '@/components/ui/Tabs';
import Avatar from '@/components/ui/Avatar';
import Drawer from '@/components/ui/Drawer';
import { useAuthStore } from '@/lib/store';
import { useParams, useRouter } from 'next/navigation';
import { CheckSquare, Clock, AlertCircle, ShoppingCart, CheckCircle, Info, MessageSquare, Paperclip, Send, Edit2, Trash2, Plus, ExternalLink, Users, UserPlus, Search } from 'lucide-react';
import { EmployeePortalStatsCard, EmployeePortalContentCard, EmployeePortalEmptyState } from './index';
import { FileText, Image, File, Download } from 'lucide-react';

interface EmployeePortalTasksProps {
  employeeId: number;
}

const statusIcons = {
  todo: CheckSquare,
  in_progress: Clock,
  blocked: AlertCircle,
  to_transfer: ShoppingCart,
  completed: CheckCircle,
};

const statusLabels = {
  todo: 'À faire',
  in_progress: 'En cours',
  blocked: 'Bloqué',
  to_transfer: 'À transférer',
  completed: 'Terminé',
};

const priorityLabels = {
  low: 'Basse',
  medium: 'Moyenne',
  high: 'Haute',
  urgent: 'Urgente',
};

/**
 * Component to render task details content with tabs
 */
function TaskDetailsContent({ taskDetails }: { taskDetails: ProjectTask }) {
  const tabs: Tab[] = [
    {
      id: 'info',
      label: 'Informations',
      icon: <Info className="w-4 h-4" />,
      content: <TaskInfoTab taskDetails={taskDetails} />,
    },
    {
      id: 'comments',
      label: 'Commentaires',
      icon: <MessageSquare className="w-4 h-4" />,
      badge: 0, // Will be updated when comments are loaded
      content: <TaskCommentsTab taskId={taskDetails.id} />,
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: <Paperclip className="w-4 h-4" />,
      badge: 0, // Will be updated when attachments are loaded
      content: <TaskDocumentsTab taskId={taskDetails.id} />,
    },
  ];

  return <Tabs tabs={tabs} defaultTab="info" />;
}

/**
 * Tab content for task information
 */
function TaskInfoTab({ taskDetails }: { taskDetails: ProjectTask }) {
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale as string || 'fr';
  const [project, setProject] = useState<Project | null>(null);
  const [team, setTeam] = useState<Team | null>(null);

  useEffect(() => {
    loadAdditionalInfo();
  }, [taskDetails]);

  const loadAdditionalInfo = async () => {
    try {
      // Load project if project_id exists
      if (taskDetails.project_id) {
        try {
          const projectResponse = await projectsAPI.get(taskDetails.project_id);
          const projectData = extractApiData<Project>(projectResponse);
          if (projectData) {
            setProject(projectData);
          }
        } catch (err) {
          // Project might not exist, ignore error
          logger.debug('Project not found', err);
        }
      }

      // Load team
      if (taskDetails.team_id) {
        try {
          const teamResponse = await teamsAPI.getTeam(taskDetails.team_id);
          const teamData = extractApiData<Team>(teamResponse);
          if (teamData) {
            setTeam(teamData);
          }
        } catch (err) {
          // Team might not exist, ignore error
          logger.debug('Team not found', err);
        }
      }

      // For created_by_id, we would need a users API, but for now we'll skip it
      // as it's not critical and would require additional API calls
        } catch (err) {
          // Ignore errors for additional info
          logger.debug('Error loading additional info', err);
        }
  };

  return (
    <div className="space-y-6">
      {/* Description */}
      {taskDetails.description && (
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">
            Description
          </h4>
          <p className="text-sm text-foreground whitespace-pre-wrap">
            {taskDetails.description}
          </p>
        </div>
      )}

      {/* Informations principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-3 bg-muted/50 rounded-lg">
          <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
            Statut
          </h4>
          <div className="flex items-center gap-2">
            {(() => {
              const Icon = statusIcons[taskDetails.status];
              return <Icon className="w-4 h-4" />;
            })()}
            <span className="text-sm font-medium">{statusLabels[taskDetails.status]}</span>
          </div>
        </div>

        <div className="p-3 bg-muted/50 rounded-lg">
          <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
            Priorité
          </h4>
          {(() => {
            const priorityColors = {
              low: 'text-primary-600 bg-primary-100 dark:bg-primary-900/30',
              medium: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30',
              high: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
              urgent: 'text-red-600 bg-red-100 dark:bg-red-900/30',
            };
            return (
              <span className={`px-2 py-1 text-xs rounded-full font-medium ${priorityColors[taskDetails.priority]}`}>
                {priorityLabels[taskDetails.priority]}
              </span>
            );
          })()}
        </div>

        {taskDetails.due_date && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
              Échéance
            </h4>
            {(() => {
              const date = new Date(taskDetails.due_date);
              const now = new Date();
              const isOverdue = date < now && taskDetails.status !== 'completed';
              return (
                <span className={`text-sm font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                  {date.toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                  {isOverdue && (
                    <span className="ml-2 text-xs text-red-600">(En retard)</span>
                  )}
                </span>
              );
            })()}
          </div>
        )}

        {taskDetails.estimated_hours && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
              Heures estimées
            </h4>
            <span className="text-sm font-medium">{taskDetails.estimated_hours}h</span>
          </div>
        )}
      </div>

      {/* Dates */}
      <div className="pt-4 border-t border-border">
        <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
          Historique
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {taskDetails.created_at && (
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Créée le</p>
                <p className="text-sm font-medium">
                  {new Date(taskDetails.created_at).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          )}

          {taskDetails.updated_at && (
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Modifiée le</p>
                <p className="text-sm font-medium">
                  {new Date(taskDetails.updated_at).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          )}

          {taskDetails.started_at && (
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-primary-600 dark:text-primary-400 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Commencée le</p>
                <p className="text-sm font-medium text-primary-600 dark:text-primary-400">
                  {new Date(taskDetails.started_at).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          )}

          {taskDetails.completed_at && (
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Terminée le</p>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  {new Date(taskDetails.completed_at).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Projet associé */}
      {project && (
        <div className="pt-4 border-t border-border">
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">
            Projet associé
          </h4>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{project.name}</span>
            <Button
              onClick={() => router.push(`/${locale}/dashboard/projets/${project.id}`)}
              size="sm"
              variant="ghost"
              className="h-6 px-2"
            >
              <ExternalLink className="w-3 h-3" />
            </Button>
          </div>
          {project.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {project.description}
            </p>
          )}
        </div>
      )}

      {/* Équipe */}
      {team && (
        <div className="pt-4 border-t border-border">
          <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Équipe
          </h4>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{team.name}</span>
            {team.slug && (
              <Button
                onClick={() => router.push(`/${locale}/dashboard/projets/equipes/${team.slug}`)}
                size="sm"
                variant="ghost"
                className="h-6 px-2"
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
            )}
          </div>
          {team.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {team.description}
            </p>
          )}
        </div>
      )}

      {/* Assigné à */}
      {taskDetails.assignee_name && (
        <div className="pt-4 border-t border-border">
          <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Assigné à
          </h4>
          <div>
            <span className="text-sm font-medium">{taskDetails.assignee_name}</span>
            {taskDetails.assignee_email && (
              <span className="text-sm text-muted-foreground ml-2">
                ({taskDetails.assignee_email})
              </span>
            )}
          </div>
        </div>
      )}

      {/* Créé par */}
      {taskDetails.created_by_id && (
        <div className="pt-4 border-t border-border">
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">
            Créé par
          </h4>
          <div>
            <span className="text-sm text-muted-foreground">
              Utilisateur ID: {taskDetails.created_by_id}
            </span>
            <p className="text-xs text-muted-foreground mt-1">
              (Les détails du créateur seront disponibles dans une prochaine version)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Tab content for task comments
 */
function TaskCommentsTab({ taskId }: { taskId: number }) {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const [comments, setComments] = useState<ProjectComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const currentUserId = user?.id ? parseInt(user.id) : undefined;

  useEffect(() => {
    loadComments();
  }, [taskId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const data = await projectCommentsAPI.list({ task_id: taskId });
      // Organize comments: separate top-level comments and replies
      const topLevelComments = data.filter(c => !c.parent_id);
      const commentsWithReplies = topLevelComments.map(comment => ({
        ...comment,
        replies: data.filter(c => c.parent_id === comment.id),
      }));
      setComments(commentsWithReplies);
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors du chargement des commentaires',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || submitting) return;

    try {
      setSubmitting(true);
      await projectCommentsAPI.create({
        task_id: taskId,
        content: newComment.trim(),
      });
      setNewComment('');
      await loadComments();
      showToast({
        message: 'Commentaire ajouté avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de l\'ajout du commentaire',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-8 text-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Liste des commentaires */}
      <div className="space-y-4 max-h-[400px] overflow-y-auto">
        {comments.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Aucun commentaire pour le moment.</p>
            <p className="text-xs mt-2">Soyez le premier à commenter !</p>
          </div>
        ) : (
          comments.map((comment) => (
            <TaskCommentItem
              key={comment.id}
              comment={comment}
              taskId={taskId}
              currentUserId={currentUserId}
              onUpdate={loadComments}
            />
          ))
        )}
      </div>

      {/* Formulaire d'ajout de commentaire */}
      <div className="pt-4 border-t border-border">
        <div className="flex gap-3">
          <Avatar
            name={user?.name || user?.email || 'U'}
            size="sm"
          />
          <div className="flex-1 space-y-2">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Ajouter un commentaire..."
              className="w-full p-3 border border-border rounded-lg bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={3}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleSubmitComment();
                }
              }}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Appuyez sur Cmd/Ctrl + Entrée pour publier
              </span>
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || submitting}
                size="sm"
              >
                <Send className="w-4 h-4 mr-2" />
                Publier
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Component to display a single comment
 */
function TaskCommentItem({
  comment,
  taskId,
  currentUserId,
  onUpdate,
}: {
  comment: ProjectComment;
  taskId: number;
  currentUserId?: number;
  onUpdate: () => void;
}) {
  const { showToast } = useToast();
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [editContent, setEditContent] = useState(comment.content);
  const [submittingReply, setSubmittingReply] = useState(false);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const userName = comment.user_name || comment.user_email || 'Utilisateur inconnu';
  const isOwnComment = currentUserId === comment.user_id;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const handleSubmitReply = async () => {
    if (!replyContent.trim() || submittingReply) return;

    try {
      setSubmittingReply(true);
      await projectCommentsAPI.create({
        task_id: taskId,
        content: replyContent.trim(),
        parent_id: comment.id,
      });
      setReplyContent('');
      setIsReplying(false);
      onUpdate();
      showToast({
        message: 'Réponse ajoutée avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de l\'ajout de la réponse',
        type: 'error',
      });
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleEdit = async () => {
    if (!editContent.trim() || submittingEdit) return;

    try {
      setSubmittingEdit(true);
      await projectCommentsAPI.update(comment.id, {
        content: editContent.trim(),
      });
      setIsEditing(false);
      onUpdate();
      showToast({
        message: 'Commentaire modifié avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la modification du commentaire',
        type: 'error',
      });
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce commentaire ?')) {
      return;
    }

    try {
      setDeleting(true);
      await projectCommentsAPI.delete(comment.id);
      onUpdate();
      showToast({
        message: 'Commentaire supprimé avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la suppression du commentaire',
        type: 'error',
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Commentaire principal */}
      <div className="flex gap-3">
        <Avatar name={userName} size="sm" />
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{userName}</span>
            <span className="text-xs text-muted-foreground">
              {formatDate(comment.created_at)}
            </span>
            {comment.is_edited && (
              <span className="text-xs text-muted-foreground italic">(modifié)</span>
            )}
          </div>
          
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-2 border border-border rounded-lg bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                rows={3}
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleEdit}
                  disabled={!editContent.trim() || submittingEdit}
                  size="sm"
                  variant="primary"
                >
                  Enregistrer
                </Button>
                <Button
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }}
                  size="sm"
                  variant="outline"
                >
                  Annuler
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-foreground whitespace-pre-wrap">{comment.content}</p>
              <div className="flex items-center gap-3">
                {!isReplying && (
                  <button
                    onClick={() => setIsReplying(true)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Répondre
                  </button>
                )}
                {isOwnComment && (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                      disabled={deleting}
                    >
                      <Edit2 className="w-3 h-3" />
                      Modifier
                    </button>
                    <button
                      onClick={handleDelete}
                      className="text-xs text-red-600 hover:text-red-700 transition-colors flex items-center gap-1"
                      disabled={deleting}
                    >
                      <Trash2 className="w-3 h-3" />
                      {deleting ? 'Suppression...' : 'Supprimer'}
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Formulaire de réponse */}
      {isReplying && (
        <div className="ml-11 space-y-2">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Écrire une réponse..."
            className="w-full p-2 border border-border rounded-lg bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            rows={2}
          />
          <div className="flex gap-2">
            <Button
              onClick={handleSubmitReply}
              disabled={!replyContent.trim() || submittingReply}
              size="sm"
              variant="primary"
            >
              Publier
            </Button>
            <Button
              onClick={() => {
                setIsReplying(false);
                setReplyContent('');
              }}
              size="sm"
              variant="outline"
            >
              Annuler
            </Button>
          </div>
        </div>
      )}

      {/* Réponses */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-11 space-y-3 border-l-2 border-border pl-4">
          {comment.replies.map((reply) => (
            <TaskCommentReply
              key={reply.id}
              reply={reply}
              taskId={taskId}
              currentUserId={currentUserId}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Component to display a comment reply with edit/delete actions
 */
function TaskCommentReply({
  reply,
  taskId: _taskId, // Reserved for future use
  currentUserId,
  onUpdate,
}: {
  reply: ProjectComment;
  taskId: number;
  currentUserId?: number;
  onUpdate: () => void;
}) {
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(reply.content);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const replyUserName = reply.user_name || reply.user_email || 'Utilisateur inconnu';
  const isOwnReply = currentUserId === reply.user_id;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const handleEdit = async () => {
    if (!editContent.trim() || submittingEdit) return;

    try {
      setSubmittingEdit(true);
      await projectCommentsAPI.update(reply.id, {
        content: editContent.trim(),
      });
      setIsEditing(false);
      onUpdate();
      showToast({
        message: 'Réponse modifiée avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la modification de la réponse',
        type: 'error',
      });
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette réponse ?')) {
      return;
    }

    try {
      setDeleting(true);
      await projectCommentsAPI.delete(reply.id);
      onUpdate();
      showToast({
        message: 'Réponse supprimée avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la suppression de la réponse',
        type: 'error',
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex gap-3">
      <Avatar name={replyUserName} size="sm" />
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{replyUserName}</span>
          <span className="text-xs text-muted-foreground">
            {formatDate(reply.created_at)}
          </span>
          {reply.is_edited && (
            <span className="text-xs text-muted-foreground italic">(modifié)</span>
          )}
        </div>
        
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-2 border border-border rounded-lg bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              rows={2}
            />
            <div className="flex gap-2">
              <Button
                onClick={handleEdit}
                disabled={!editContent.trim() || submittingEdit}
                size="sm"
                variant="primary"
              >
                Enregistrer
              </Button>
              <Button
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(reply.content);
                }}
                size="sm"
                variant="outline"
              >
                Annuler
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-foreground whitespace-pre-wrap">{reply.content}</p>
            {isOwnReply && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                  disabled={deleting}
                >
                  <Edit2 className="w-3 h-3" />
                  Modifier
                </button>
                <button
                  onClick={handleDelete}
                  className="text-xs text-red-600 hover:text-red-700 transition-colors flex items-center gap-1"
                  disabled={deleting}
                >
                  <Trash2 className="w-3 h-3" />
                  {deleting ? 'Suppression...' : 'Supprimer'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Tab content for task documents
 */
function TaskDocumentsTab({ taskId }: { taskId: number }) {
  const { showToast } = useToast();
  const [attachments, setAttachments] = useState<ProjectAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadAttachments();
  }, [taskId]);

  const loadAttachments = async () => {
    try {
      setLoading(true);
      const data = await projectAttachmentsAPI.list({ task_id: taskId });
      setAttachments(data);
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors du chargement des documents',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const getFileIcon = (contentType: string, filename: string) => {
    // Check by content type first
    if (contentType.startsWith('image/')) {
      return <Image className="w-5 h-5 text-primary-600 dark:text-primary-400" />;
    }
    if (contentType === 'application/pdf') {
      return <FileText className="w-5 h-5 text-red-600 dark:text-red-400" />;
    }
    
    // Check by extension as fallback
    const extension = filename.split('.').pop()?.toLowerCase();
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    if (extension && imageExtensions.includes(extension)) {
      return <Image className="w-5 h-5 text-primary-600 dark:text-primary-400" />;
    }
    
    return <File className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
  };

  const handleDownload = (attachment: ProjectAttachment) => {
    window.open(attachment.file_url, '_blank');
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      showToast({
        message: 'Le fichier est trop volumineux. Taille maximale : 50MB',
        type: 'error',
      });
      return;
    }

    try {
      setUploading(true);
      await projectAttachmentsAPI.upload(file, {
        task_id: taskId,
      });
      await loadAttachments();
      showToast({
        message: 'Document uploadé avec succès',
        type: 'success',
      });
      // Reset file input
      if (event.target) {
        event.target.value = '';
      }
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de l\'upload du document',
        type: 'error',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (attachmentId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      return;
    }

    try {
      setDeletingIds(prev => new Set(prev).add(attachmentId));
      await projectAttachmentsAPI.delete(attachmentId);
      await loadAttachments();
      showToast({
        message: 'Document supprimé avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la suppression du document',
        type: 'error',
      });
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(attachmentId);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <div className="py-8 text-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bouton d'upload */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-1">
            Documents ({attachments.length})
          </h4>
          <p className="text-xs text-muted-foreground">
            Taille maximale : 50MB
          </p>
        </div>
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
            disabled={uploading}
          />
          <Button
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.click();
              }
            }}
            disabled={uploading}
            size="sm"
            variant="primary"
          >
            {uploading ? (
              <>
                <Loading className="w-4 h-4 mr-2" />
                Upload...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un document
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Liste des documents */}
      {attachments.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          <Paperclip className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Aucun document pour le moment.</p>
          <p className="text-xs mt-2">Cliquez sur "Ajouter un document" pour commencer.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {attachments.map((attachment) => {
            const isDeleting = deletingIds.has(attachment.id);
            return (
              <div
                key={attachment.id}
                className="flex items-center gap-4 p-4 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex-shrink-0">
                  {getFileIcon(attachment.content_type, attachment.filename)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">
                      {attachment.original_filename || attachment.filename}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(attachment.file_size)}
                    </span>
                    {attachment.uploaded_by_name && (
                      <>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          Uploadé par {attachment.uploaded_by_name}
                        </span>
                      </>
                    )}
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(attachment.created_at)}
                    </span>
                  </div>
                  {attachment.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {attachment.description}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0 flex items-center gap-2">
                  <Button
                    onClick={() => handleDownload(attachment)}
                    size="sm"
                    variant="outline"
                    disabled={isDeleting}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger
                  </Button>
                  <Button
                    onClick={() => handleDelete(attachment.id)}
                    size="sm"
                    variant="outline"
                    disabled={isDeleting}
                    className="text-red-600 hover:text-red-700 hover:border-red-300"
                  >
                    {isDeleting ? (
                      <>
                        <Loading className="w-4 h-4 mr-2" />
                        Suppression...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function EmployeePortalTasks({ employeeId }: EmployeePortalTasksProps) {
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);
  const [taskDetails, setTaskDetails] = useState<ProjectTask | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [filteredTasks, setFilteredTasks] = useState<ProjectTask[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    loadTasks();
    loadProjects();
  }, [employeeId]);

  useEffect(() => {
    filterTasks();
  }, [tasks, statusFilter, searchQuery]);

  const loadProjects = async () => {
    try {
      const data = await projectsAPI.list();
      const projectsList = Array.isArray(data) ? data : [];
      setProjects(projectsList);
    } catch (err) {
      // Ignore errors for projects
      logger.debug('Failed to load projects', err);
    }
  };

  const filterTasks = () => {
    let filtered = tasks;
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    setFilteredTasks(filtered);
  };

  const getProjectName = (projectId: number | null | undefined): string => {
    if (!projectId) return '';
    const project = projects.find(p => p.id === projectId);
    return project?.name || '';
  };

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await projectTasksAPI.list({ employee_assignee_id: employeeId });
      setTasks(data);
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors du chargement des tâches');
      showToast({
        message: appError.message || 'Erreur lors du chargement des tâches',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTaskClick = async (task: ProjectTask) => {
    setSelectedTask(task);
    try {
      setLoadingDetails(true);
      const details = await projectTasksAPI.get(task.id);
      setTaskDetails(details);
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors du chargement des détails de la tâche',
        type: 'error',
      });
      // Use the task from the list if API call fails
      setTaskDetails(task);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedTask(null);
    setTaskDetails(null);
  };

  // Columns definition removed - not currently used in the component

  if (loading) {
    return (
      <div className="py-8 text-center">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="error">{error}</Alert>
    );
  }

  // Calculate statistics
  const todoTasks = tasks.filter(t => t.status === 'todo' || t.status === 'to_transfer').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const doneTasks = tasks.filter(t => t.status === 'completed').length;

  const getStatusBadge = (status: string) => {
    const badges = {
      todo: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      review: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      blocked: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      to_transfer: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    };
    return badges[status as keyof typeof badges] || badges.todo;
  };

  const getStatusLabel = (status: string) => {
    return statusLabels[status as keyof typeof statusLabels] || status;
  };

  const getPriorityBadge = (priority: string) => {
    const badges = {
      low: 'bg-gray-100 text-gray-600',
      medium: 'bg-orange-100 text-orange-600',
      high: 'bg-red-100 text-red-600',
      urgent: 'bg-red-200 text-red-800',
    };
    return badges[priority as keyof typeof badges] || badges.medium;
  };

  const getPriorityLabel = (priority: string) => {
    return priorityLabels[priority as keyof typeof priorityLabels] || priority;
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <EmployeePortalStatsCard
          value={tasks.length}
          label="Total des tâches"
          icon={<CheckSquare className="w-6 h-6" />}
          iconColor="blue"
        />
        <EmployeePortalStatsCard
          value={inProgressTasks}
          label="En cours"
          icon={<Clock className="w-6 h-6" />}
          iconColor="orange"
        />
        <EmployeePortalStatsCard
          value={todoTasks}
          label="À faire"
          icon={<AlertCircle className="w-6 h-6" />}
          iconColor="gray"
        />
        <EmployeePortalStatsCard
          value={doneTasks}
          label="Terminées"
          icon={<CheckSquare className="w-6 h-6" />}
          iconColor="green"
        />
      </div>

      {/* Filters */}
      <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une tâche..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setStatusFilter('all')}
              className={statusFilter === 'all' ? 'bg-[#523DC9] text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}
            >
              Toutes
            </Button>
            <Button
              onClick={() => setStatusFilter('todo')}
              className={statusFilter === 'todo' ? 'bg-[#523DC9] text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}
            >
              À faire
            </Button>
            <Button
              onClick={() => setStatusFilter('in_progress')}
              className={statusFilter === 'in_progress' ? 'bg-[#523DC9] text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}
            >
              En cours
            </Button>
            <Button
              onClick={() => setStatusFilter('completed')}
              className={statusFilter === 'completed' ? 'bg-[#523DC9] text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}
            >
              Terminées
            </Button>
          </div>
        </div>
      </Card>

      {/* Tasks List */}
      {tasks.length === 0 ? (
        <EmployeePortalEmptyState
          icon={CheckSquare}
          title="Aucune tâche assignée"
        />
      ) : filteredTasks.length === 0 ? (
        <EmployeePortalEmptyState
          icon={CheckSquare}
          title="Aucune tâche trouvée"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredTasks.map((task) => (
            <EmployeePortalContentCard
              key={task.id}
              onClick={() => handleTaskClick(task)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{task.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <span className={`text-xs px-3 py-1 rounded-full ${getStatusBadge(task.status)}`}>
                    {getStatusLabel(task.status)}
                  </span>
                  {task.priority && (
                    <span className={`text-xs px-3 py-1 rounded-full ${getPriorityBadge(task.priority)}`}>
                      {getPriorityLabel(task.priority)}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                {task.project_id && getProjectName(task.project_id) && (
                  <span>📁 {getProjectName(task.project_id)}</span>
                )}
                {task.estimated_hours && (
                  <span>⏱️ {task.estimated_hours}h estimées</span>
                )}
                {task.due_date && (
                  <span>📅 Échéance: {new Date(task.due_date).toLocaleDateString('fr-FR')}</span>
                )}
              </div>
            </EmployeePortalContentCard>
          ))}
        </div>
      )}

      {/* Drawer de détails de la tâche (style Asana) */}
      <Drawer
        isOpen={!!selectedTask}
        onClose={handleCloseModal}
        title={selectedTask ? (taskDetails?.title || selectedTask.title) : ''}
        position="right"
        size="xl"
        closeOnOverlayClick={true}
        closeOnEscape={true}
      >
        {loadingDetails ? (
          <div className="py-8 text-center">
            <Loading />
          </div>
        ) : (
          taskDetails && (
            <div className="h-full">
              <TaskDetailsContent taskDetails={taskDetails} />
            </div>
          )
        )}
      </Drawer>
    </div>
  );
}
