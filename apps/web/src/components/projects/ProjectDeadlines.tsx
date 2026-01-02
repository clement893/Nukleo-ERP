'use client';

import { useState, useEffect } from 'react';
import { deadlinesAPI, type Deadline, type DeadlineCreate, type DeadlineUpdate } from '@/lib/api/deadlines';
import { Button, Card, Badge, Input, Textarea, Select, Modal, useToast, Loading } from '@/components/ui';
import { Plus, Edit, Trash2, Calendar, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { handleApiError } from '@/lib/errors/api';

interface ProjectDeadlinesProps {
  projectId: number;
}

const priorityConfig = {
  low: { label: 'Basse', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  medium: { label: 'Moyenne', color: 'bg-orange-500/10 text-orange-600 border-orange-500/30' },
  high: { label: 'Haute', color: 'bg-red-500/10 text-red-600 border-red-500/30' },
  urgent: { label: 'Urgente', color: 'bg-red-600/10 text-red-700 border-red-600/30' },
};

const statusConfig = {
  pending: { label: 'En attente', color: 'bg-gray-500/10 text-gray-600 border-gray-500/30', icon: Clock },
  completed: { label: 'Terminé', color: 'bg-green-500/10 text-green-600 border-green-500/30', icon: CheckCircle },
  overdue: { label: 'En retard', color: 'bg-red-500/10 text-red-600 border-red-500/30', icon: AlertCircle },
  cancelled: { label: 'Annulé', color: 'bg-gray-500/10 text-gray-600 border-gray-500/30', icon: Clock },
};

function calculateDeadlineStatus(dueDate: string, currentStatus: string): { status: string; daysRemaining: number } {
  if (currentStatus === 'completed' || currentStatus === 'cancelled') {
    return { status: currentStatus, daysRemaining: 0 };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { status: 'overdue', daysRemaining: diffDays };
  } else if (diffDays === 0) {
    return { status: 'pending', daysRemaining: 0 };
  } else {
    return { status: 'pending', daysRemaining: diffDays };
  }
}

export default function ProjectDeadlines({ projectId }: ProjectDeadlinesProps) {
  const { showToast } = useToast();
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDeadline, setSelectedDeadline] = useState<Deadline | null>(null);
  const [formData, setFormData] = useState<DeadlineCreate>({
    title: '',
    description: null,
    priority: 'medium',
    status: 'pending',
    due_date: new Date().toISOString().split('T')[0],
    due_time: null,
    project_id: String(projectId),
  });

  useEffect(() => {
    loadDeadlines();
  }, [projectId]);

  const loadDeadlines = async () => {
    try {
      setLoading(true);
      const data = await deadlinesAPI.list({ project_id: projectId, limit: 1000 });
      setDeadlines(data);
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors du chargement des deadlines',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await deadlinesAPI.create(formData);
      setShowCreateModal(false);
      setFormData({
        title: '',
        description: null,
        priority: 'medium',
        status: 'pending',
        due_date: new Date().toISOString().split('T')[0],
        due_time: null,
        project_id: String(projectId),
      });
      showToast({
        message: 'Deadline créée avec succès',
        type: 'success',
      });
      loadDeadlines();
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la création de la deadline',
        type: 'error',
      });
    }
  };

  const handleUpdate = async () => {
    if (!selectedDeadline) return;
    try {
      const updateData: DeadlineUpdate = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        status: formData.status,
        due_date: formData.due_date,
        due_time: formData.due_time,
      };
      await deadlinesAPI.update(selectedDeadline.id, updateData);
      setShowEditModal(false);
      setSelectedDeadline(null);
      showToast({
        message: 'Deadline modifiée avec succès',
        type: 'success',
      });
      loadDeadlines();
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la modification de la deadline',
        type: 'error',
      });
    }
  };

  const handleDelete = async (deadlineId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette deadline ?')) {
      return;
    }
    try {
      await deadlinesAPI.delete(deadlineId);
      showToast({
        message: 'Deadline supprimée avec succès',
        type: 'success',
      });
      loadDeadlines();
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la suppression de la deadline',
        type: 'error',
      });
    }
  };

  const handleEdit = (deadline: Deadline) => {
    setSelectedDeadline(deadline);
    setFormData({
      title: deadline.title,
      description: deadline.description || null,
      priority: deadline.priority,
      status: deadline.status,
      due_date: deadline.due_date,
      due_time: deadline.due_time || null,
      project_id: String(projectId),
    });
    setShowEditModal(true);
  };

  const handleToggleStatus = async (deadline: Deadline) => {
    try {
      const newStatus = deadline.status === 'completed' ? 'pending' : 'completed';
      await deadlinesAPI.update(deadline.id, {
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
      });
      showToast({
        message: `Deadline marquée comme ${newStatus === 'completed' ? 'terminée' : 'en attente'}`,
        type: 'success',
      });
      loadDeadlines();
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la modification',
        type: 'error',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loading />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Deadlines du projet
        </h3>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle deadline
        </Button>
      </div>

      {deadlines.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Aucune deadline définie pour ce projet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {deadlines.map((deadline) => {
            const { status, daysRemaining } = calculateDeadlineStatus(deadline.due_date, deadline.status);
            const StatusIcon = statusConfig[status as keyof typeof statusConfig]?.icon || Clock;
            const displayStatus = deadline.status === 'completed' ? 'completed' : deadline.status === 'cancelled' ? 'cancelled' : status;

            return (
              <Card key={deadline.id} className="glass-card p-4 rounded-xl border border-border hover:border-primary-500/30 transition-all">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-xl bg-nukleo-gradient flex flex-col items-center justify-center text-white">
                      <div className="text-xs font-medium">
                        {new Date(deadline.due_date).toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase()}
                      </div>
                      <div className="text-2xl font-bold">
                        {new Date(deadline.due_date).getDate()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <h4 className="font-semibold text-foreground mb-1">{deadline.title}</h4>
                        {deadline.description && (
                          <p className="text-sm text-muted-foreground">{deadline.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Badge className={`${priorityConfig[deadline.priority].color} border`}>
                          {priorityConfig[deadline.priority].label}
                        </Badge>
                        <Badge className={`${statusConfig[displayStatus as keyof typeof statusConfig]?.color || statusConfig.pending.color} border flex items-center gap-1`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig[displayStatus as keyof typeof statusConfig]?.label || 'En attente'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                      {deadline.due_time && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          <span>{deadline.due_time}</span>
                        </div>
                      )}
                      {displayStatus !== 'completed' && displayStatus !== 'cancelled' && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          <span>
                            {daysRemaining === 0 
                              ? "Aujourd'hui" 
                              : daysRemaining < 0
                                ? `En retard de ${Math.abs(daysRemaining)} jour${Math.abs(daysRemaining) > 1 ? 's' : ''}`
                                : `Dans ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''}`
                            }
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleStatus(deadline)}
                      >
                        {deadline.status === 'completed' ? (
                          <>
                            <Clock className="w-4 h-4 mr-1" />
                            Marquer en attente
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Marquer terminé
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(deadline)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Modifier
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(deadline.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setFormData({
            title: '',
            description: null,
            priority: 'medium',
            status: 'pending',
            due_date: new Date().toISOString().split('T')[0],
            due_time: null,
            project_id: String(projectId),
          });
        }}
        title="Nouvelle deadline"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Titre"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Titre de la deadline"
            required
          />
          <Textarea
            label="Description"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value || null })}
            placeholder="Description (optionnel)"
            rows={3}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date d'échéance"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              required
            />
            <Input
              label="Heure (optionnel)"
              type="time"
              value={formData.due_time || ''}
              onChange={(e) => setFormData({ ...formData, due_time: e.target.value || null })}
            />
          </div>
          <Select
            label="Priorité"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value as Deadline['priority'] })}
            options={[
              { label: 'Basse', value: 'low' },
              { label: 'Moyenne', value: 'medium' },
              { label: 'Haute', value: 'high' },
              { label: 'Urgente', value: 'urgent' },
            ]}
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                setFormData({
                  title: '',
                  description: null,
                  priority: 'medium',
                  status: 'pending',
                  due_date: new Date().toISOString().split('T')[0],
                  due_time: null,
                  project_id: String(projectId),
                });
              }}
            >
              Annuler
            </Button>
            <Button onClick={handleCreate} disabled={!formData.title || !formData.due_date}>
              Créer
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedDeadline(null);
        }}
        title="Modifier la deadline"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Titre"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Titre de la deadline"
            required
          />
          <Textarea
            label="Description"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value || null })}
            placeholder="Description (optionnel)"
            rows={3}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date d'échéance"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              required
            />
            <Input
              label="Heure (optionnel)"
              type="time"
              value={formData.due_time || ''}
              onChange={(e) => setFormData({ ...formData, due_time: e.target.value || null })}
            />
          </div>
          <Select
            label="Priorité"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value as Deadline['priority'] })}
            options={[
              { label: 'Basse', value: 'low' },
              { label: 'Moyenne', value: 'medium' },
              { label: 'Haute', value: 'high' },
              { label: 'Urgente', value: 'urgent' },
            ]}
          />
          <Select
            label="Statut"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as Deadline['status'] })}
            options={[
              { label: 'En attente', value: 'pending' },
              { label: 'Terminé', value: 'completed' },
              { label: 'En retard', value: 'overdue' },
              { label: 'Annulé', value: 'cancelled' },
            ]}
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditModal(false);
                setSelectedDeadline(null);
              }}
            >
              Annuler
            </Button>
            <Button onClick={handleUpdate} disabled={!formData.title || !formData.due_date}>
              Enregistrer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
