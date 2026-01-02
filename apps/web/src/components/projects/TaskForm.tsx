'use client';

import { useState, useEffect } from 'react';
import { ProjectTask, ProjectTaskCreate, ProjectTaskUpdate, TaskStatus, TaskPriority } from '@/lib/api/project-tasks';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui';
import { projectsAPI } from '@/lib/api/projects';
import { teamsAPI } from '@/lib/api/teams';
import { employeesAPI } from '@/lib/api/employees';

interface TaskFormProps {
  task?: ProjectTask | null;
  onSubmit: (data: ProjectTaskCreate | ProjectTaskUpdate) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'todo', label: 'À faire' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'blocked', label: 'Bloqué' },
  { value: 'to_transfer', label: 'À transférer' },
  { value: 'completed', label: 'Terminé' },
];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: 'low', label: 'Basse' },
  { value: 'medium', label: 'Moyenne' },
  { value: 'high', label: 'Haute' },
  { value: 'urgent', label: 'Urgente' },
];

export default function TaskForm({
  task,
  onSubmit,
  onCancel,
  loading = false,
}: TaskFormProps) {
  const { showToast } = useToast();
  const [projects, setProjects] = useState<Array<{ id: number; name: string }>>([]);
  const [teams, setTeams] = useState<Array<{ id: number; name: string }>>([]);
  const [employees, setEmployees] = useState<Array<{ id: number; name: string }>>([]);
  const [loadingData, setLoadingData] = useState(false);
  
  const [formData, setFormData] = useState<ProjectTaskCreate>({
    title: task?.title || '',
    description: task?.description || null,
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    team_id: task?.team_id || 0,
    project_id: task?.project_id || null,
    assignee_id: task?.assignee_id || null,
    employee_assignee_id: null,
    due_date: task?.due_date ? task.due_date.split('T')[0] : null,
    estimated_hours: task?.estimated_hours || null,
  });

  // Load projects, teams, and employees
  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true);
      try {
        // Load projects
        const projectsData = await projectsAPI.list(0, 1000);
        setProjects(projectsData.map(p => ({ id: p.id, name: p.name })));

        // Load teams
        try {
          const teamsResponse = await teamsAPI.list(0, 1000);
          const teamsData = teamsResponse.data || teamsResponse;
          const teamsList = (teamsData as { teams?: Array<{ id: number; name?: string; slug?: string }> })?.teams || (Array.isArray(teamsData) ? teamsData : []);
          setTeams(teamsList.map((t: { id: number; name?: string; slug?: string }) => ({ id: t.id, name: t.name || t.slug || `Team ${t.id}` })));
        } catch (err) {
          console.error('Error loading teams:', err);
        }

        // Load employees
        const employeesData = await employeesAPI.list(0, 1000);
        setEmployees(employeesData.map(e => ({ 
          id: e.id, 
          name: `${e.first_name} ${e.last_name}` 
        })));
      } catch (error) {
        showToast({
          message: 'Erreur lors du chargement des données',
          type: 'error',
        });
      } finally {
        setLoadingData(false);
      }
    };
    loadData();
  }, [showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title?.trim()) {
      showToast({
        message: 'Le titre de la tâche est requis',
        type: 'error',
      });
      return;
    }

    if (!formData.team_id || formData.team_id === 0) {
      showToast({
        message: 'L\'équipe est requise',
        type: 'error',
      });
      return;
    }

    // Format due_date if provided
    const submitData = {
      ...formData,
      due_date: formData.due_date ? `${formData.due_date}T00:00:00` : null,
    };

    await onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title */}
      <div>
        <Input
          label="Titre *"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Titre de la tâche"
          required
          disabled={loading || loadingData}
        />
      </div>

      {/* Description */}
      <div>
        <Textarea
          label="Description"
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value || null })}
          placeholder="Description de la tâche..."
          rows={4}
          disabled={loading || loadingData}
        />
      </div>

      {/* Team */}
      <div>
        <Select
          label="Équipe *"
          value={formData.team_id ? String(formData.team_id) : ''}
          onChange={(e) => setFormData({ ...formData, team_id: parseInt(e.target.value) || 0 })}
          options={[
            { value: '', label: 'Sélectionner une équipe' },
            ...teams.map(t => ({ value: String(t.id), label: t.name })),
          ]}
          required
          disabled={loading || loadingData}
        />
      </div>

      {/* Project */}
      <div>
        <Select
          label="Projet"
          value={formData.project_id ? String(formData.project_id) : ''}
          onChange={(e) => setFormData({ 
            ...formData, 
            project_id: e.target.value ? parseInt(e.target.value) : null 
          })}
          options={[
            { value: '', label: 'Aucun projet' },
            ...projects.map(p => ({ value: String(p.id), label: p.name })),
          ]}
          disabled={loading || loadingData}
        />
      </div>

      {/* Assignee (Employee) */}
      <div>
        <Select
          label="Assigné à (Employé)"
          value={formData.employee_assignee_id ? String(formData.employee_assignee_id) : ''}
          onChange={(e) => setFormData({ 
            ...formData, 
            employee_assignee_id: e.target.value ? parseInt(e.target.value) : null,
            assignee_id: null, // Clear assignee_id when using employee_assignee_id
          })}
          options={[
            { value: '', label: 'Non assigné' },
            ...employees.map(e => ({ value: String(e.id), label: e.name })),
          ]}
          disabled={loading || loadingData}
        />
      </div>

      {/* Status and Priority */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Select
            label="Statut"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
            options={STATUS_OPTIONS.map(s => ({ value: s.value, label: s.label }))}
            disabled={loading || loadingData}
          />
        </div>
        <div>
          <Select
            label="Priorité"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
            options={PRIORITY_OPTIONS.map(p => ({ value: p.value, label: p.label }))}
            disabled={loading || loadingData}
          />
        </div>
      </div>

      {/* Due Date and Estimated Hours */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Input
            label="Date d'échéance"
            type="date"
            value={formData.due_date || ''}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value || null })}
            disabled={loading || loadingData}
          />
        </div>
        <div>
          <Input
            label="Heures estimées"
            type="number"
            min="0"
            step="0.5"
            value={formData.estimated_hours || ''}
            onChange={(e) => setFormData({ 
              ...formData, 
              estimated_hours: e.target.value ? parseFloat(e.target.value) : null 
            })}
            placeholder="0"
            disabled={loading || loadingData}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading || loadingData}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          loading={loading || loadingData}
          disabled={loading || loadingData}
        >
          {task ? 'Modifier' : 'Créer'}
        </Button>
      </div>
    </form>
  );
}
