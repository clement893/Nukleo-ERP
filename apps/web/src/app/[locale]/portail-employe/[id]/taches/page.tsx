'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { CheckSquare, Clock, AlertCircle, Search, Loader2 } from 'lucide-react';
import { Card, Button } from '@/components/ui';
import { projectTasksAPI, type ProjectTask } from '@/lib/api/project-tasks';
import { employeesAPI, type Employee } from '@/lib/api/employees';

export default function MesTaches() {
  const params = useParams();
  const employeeId = parseInt(params?.id as string);
  
  const [loading, setLoading] = useState(true);
  const [_employee, setEmployee] = useState<Employee | null>(null);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<ProjectTask[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (employeeId) {
      loadData();
    }
  }, [employeeId]);

  useEffect(() => {
    filterTasks();
  }, [tasks, statusFilter, searchQuery]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [empData, tasksData] = await Promise.all([
        employeesAPI.get(employeeId),
        projectTasksAPI.list({ assignee_id: employeeId }),
      ]);
      setEmployee(empData);
      setTasks(tasksData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
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

  const getStatusBadge = (status: string) => {
    const badges = {
      todo: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      review: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      done: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      blocked: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    };
    return badges[status as keyof typeof badges] || badges.todo;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      todo: 'À faire',
      in_progress: 'En cours',
      review: 'En révision',
      done: 'Terminée',
      blocked: 'Bloquée',
    };
    return labels[status as keyof typeof labels] || status;
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
    const labels = {
      low: 'Basse',
      medium: 'Moyenne',
      high: 'Haute',
      urgent: 'Urgente',
    };
    return labels[priority as keyof typeof labels] || priority;
  };

  const todoTasks = tasks.filter(t => t.status === 'todo').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const doneTasks = tasks.filter(t => t.status === 'completed').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-[#523DC9]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] opacity-90" />
        <div className="relative p-8">
          <h1 className="text-4xl font-black text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Mes Tâches
          </h1>
          <p className="text-white/80 text-lg">Gérez vos tâches et suivez votre progression</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <CheckSquare className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="text-3xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {tasks.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total des tâches</div>
        </Card>

        <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="text-3xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {inProgressTasks}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">En cours</div>
        </Card>

        <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-lg bg-gray-500/10 border border-gray-500/30">
              <AlertCircle className="w-6 h-6 text-gray-600" />
            </div>
          </div>
          <div className="text-3xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {todoTasks}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">À faire</div>
        </Card>

        <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
              <CheckSquare className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="text-3xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {doneTasks}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Terminées</div>
        </Card>
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
              className={statusFilter === 'all' ? 'bg-[#523DC9] text-white' : 'bg-gray-100 text-gray-700'}
            >
              Toutes
            </Button>
            <Button
              onClick={() => setStatusFilter('todo')}
              className={statusFilter === 'todo' ? 'bg-[#523DC9] text-white' : 'bg-gray-100 text-gray-700'}
            >
              À faire
            </Button>
            <Button
              onClick={() => setStatusFilter('in_progress')}
              className={statusFilter === 'in_progress' ? 'bg-[#523DC9] text-white' : 'bg-gray-100 text-gray-700'}
            >
              En cours
            </Button>
            <Button
              onClick={() => setStatusFilter('done')}
              className={statusFilter === 'done' ? 'bg-[#523DC9] text-white' : 'bg-gray-100 text-gray-700'}
            >
              Terminées
            </Button>
          </div>
        </div>
      </Card>

      {/* Tasks List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredTasks.map((task) => (
          <Card key={task.id} className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:border-[#523DC9]/40 transition-all">
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
                <span className={`text-xs px-3 py-1 rounded-full ${getPriorityBadge(task.priority)}`}>
                  {getPriorityLabel(task.priority)}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              {(task as any).project_name && (
                <span>📁 {(task as any).project_name}</span>
              )}
              {task.estimated_hours && (
                <span>⏱️ {task.estimated_hours}h estimées</span>
              )}
              {task.due_date && (
                <span>📅 Échéance: {new Date(task.due_date).toLocaleDateString('fr-FR')}</span>
              )}
            </div>
          </Card>
        ))}
        
        {filteredTasks.length === 0 && (
          <Card className="glass-card p-12 rounded-xl border border-[#A7A2CF]/20 text-center">
            <CheckSquare className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">Aucune tâche trouvée</p>
          </Card>
        )}
      </div>
    </div>
  );
}
