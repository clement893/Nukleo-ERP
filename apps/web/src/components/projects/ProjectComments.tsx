'use client';

import { useState, useEffect } from 'react';
import { projectCommentsAPI, type ProjectComment } from '@/lib/api/project-comments';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import { useAuthStore } from '@/lib/store';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import Loading from '@/components/ui/Loading';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import { MessageSquare, Send, Edit, Trash2, Pin, Reply } from 'lucide-react';
// Format date relative helper
const formatDateRelative = (date: string) => {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'à l\'instant';
  if (diffMins < 60) return `il y a ${diffMins} min${diffMins > 1 ? 's' : ''}`;
  if (diffHours < 24) return `il y a ${diffHours} h`;
  if (diffDays < 7) return `il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
  if (diffDays < 30) return `il y a ${Math.floor(diffDays / 7)} semaine${Math.floor(diffDays / 7) > 1 ? 's' : ''}`;
  if (diffDays < 365) return `il y a ${Math.floor(diffDays / 30)} mois`;
  return `il y a ${Math.floor(diffDays / 365)} an${Math.floor(diffDays / 365) > 1 ? 's' : ''}`;
};

interface ProjectCommentsProps {
  projectId?: number;
  taskId?: number;
  onCommentAdded?: () => void;
}

export default function ProjectComments({ projectId, taskId, onCommentAdded }: ProjectCommentsProps) {
  const { showToast } = useToast();
  const { user } = useAuthStore();
  const [comments, setComments] = useState<ProjectComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    if (projectId || taskId) {
      loadComments();
    }
  }, [projectId, taskId]);

  const loadComments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await projectCommentsAPI.list({ project_id: projectId, task_id: taskId });
      setComments(data);
    } catch (err) {
      setError(handleApiError(err).message || 'Erreur lors du chargement des commentaires');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      showToast({ message: 'Le commentaire ne peut pas être vide', type: 'error' });
      return;
    }

    if (!projectId && !taskId) {
      showToast({ message: 'Projet ou tâche requis', type: 'error' });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await projectCommentsAPI.create({
        project_id: projectId || undefined,
        task_id: taskId || undefined,
        content: newComment.trim(),
      });
      showToast({ message: 'Commentaire ajouté', type: 'success' });
      setNewComment('');
      await loadComments();
      onCommentAdded?.();
    } catch (err) {
      setError(handleApiError(err).message || 'Erreur lors de l\'ajout du commentaire');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (parentId: number) => {
    if (!replyContent.trim()) {
      showToast({ message: 'La réponse ne peut pas être vide', type: 'error' });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await projectCommentsAPI.create({
        project_id: projectId || undefined,
        task_id: taskId || undefined,
        content: replyContent.trim(),
        parent_id: parentId,
      });
      showToast({ message: 'Réponse ajoutée', type: 'success' });
      setReplyingTo(null);
      setReplyContent('');
      await loadComments();
      onCommentAdded?.();
    } catch (err) {
      setError(handleApiError(err).message || 'Erreur lors de l\'ajout de la réponse');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (commentId: number) => {
    if (!editContent.trim()) {
      showToast({ message: 'Le commentaire ne peut pas être vide', type: 'error' });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await projectCommentsAPI.update(commentId, { content: editContent.trim() });
      showToast({ message: 'Commentaire modifié', type: 'success' });
      setEditingId(null);
      setEditContent('');
      await loadComments();
    } catch (err) {
      setError(handleApiError(err).message || 'Erreur lors de la modification du commentaire');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce commentaire ?')) return;

    setLoading(true);
    setError(null);
    try {
      await projectCommentsAPI.delete(commentId);
      showToast({ message: 'Commentaire supprimé', type: 'success' });
      await loadComments();
      onCommentAdded?.();
    } catch (err) {
      setError(handleApiError(err).message || 'Erreur lors de la suppression du commentaire');
    } finally {
      setLoading(false);
    }
  };

  const renderComment = (comment: ProjectComment, depth = 0) => {
    const isOwner = user?.id !== undefined && comment.user_id === Number(user.id);
    const isEditing = editingId === comment.id;

    return (
      <div key={comment.id} className={depth > 0 ? 'ml-8 mt-4' : ''}>
        <Card className={`p-4 ${comment.is_pinned ? 'border-primary border-2' : ''}`}>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              {comment.user_avatar ? (
                <img src={comment.user_avatar} alt={comment.user_name || ''} className="w-8 h-8 rounded-full" />
              ) : (
                <span className="text-sm font-medium text-primary">
                  {((comment.user_name || comment.user_email || 'U') as string)[0].toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-foreground">
                  {comment.user_name || comment.user_email || 'Utilisateur'}
                </span>
                {comment.is_pinned && (
                  <Badge variant="default" className="text-xs">
                    <Pin className="w-3 h-3 mr-1" />
                    Épinglé
                  </Badge>
                )}
                {comment.is_edited && (
                  <span className="text-xs text-muted-foreground">(modifié)</span>
                )}
                <span className="text-xs text-muted-foreground">
                  {formatDateRelative(comment.created_at)}
                </span>
              </div>
              {isEditing ? (
                <div className="space-y-2">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={3}
                    className="w-full"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleEdit(comment.id)}>
                      Enregistrer
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingId(null);
                        setEditContent('');
                      }}
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-foreground whitespace-pre-wrap">{comment.content}</p>
                  <div className="flex gap-2 mt-2">
                    {depth === 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setReplyingTo(comment.id);
                          setReplyContent('');
                        }}
                      >
                        <Reply className="w-3 h-3 mr-1" />
                        Répondre
                      </Button>
                    )}
                    {isOwner && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingId(comment.id);
                            setEditContent(comment.content);
                          }}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Modifier
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(comment.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Supprimer
                        </Button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </Card>

        {replyingTo === comment.id && (
          <Card className="p-4 mt-2 ml-8">
            <Textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Écrire une réponse..."
              rows={3}
              className="w-full mb-2"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleReply(comment.id)}>
                <Send className="w-3 h-3 mr-1" />
                Envoyer
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setReplyingTo(null);
                  setReplyContent('');
                }}
              >
                Annuler
              </Button>
            </div>
          </Card>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2">
            {comment.replies.map((reply) => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading && comments.length === 0) {
    return <Loading />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Discussions
        </h3>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {/* New comment form */}
      <Card className="p-4">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Écrire un commentaire..."
          rows={3}
          className="w-full mb-2"
        />
        <div className="flex justify-end">
          <Button onClick={handleSubmitComment} disabled={!newComment.trim() || loading}>
            <Send className="w-4 h-4 mr-2" />
            Commenter
          </Button>
        </div>
      </Card>

      {/* Comments list */}
      {comments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Aucun commentaire</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => renderComment(comment))}
        </div>
      )}
    </div>
  );
}
