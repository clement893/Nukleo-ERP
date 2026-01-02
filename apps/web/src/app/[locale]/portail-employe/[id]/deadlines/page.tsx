'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { AlertCircle, Calendar, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui';
import { projectTasksAPI } from '@/lib/api/project-tasks';
import { projectsAPI } from '@/lib/api';

export default function MesDeadlines() {
  const params = useParams();
  const employeeId = parseInt(params?.id as string);
  
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    if (employeeId) {
      loadData();
    }
  }, [employeeId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tasksData, projectsData] = await Promise.all([
        projectTasksAPI.list({ assignee_id: employeeId }),
        projectsAPI.list(),
      ]);
      
      const projectsList = Array.isArray(projectsData) ? projectsData : (projectsData?.data || []);
      const tasksWithDeadlines = tasksData.filter(t => t.due_date);
      setTasks(tasksWithDeadlines.sort((a, b) => {
        const dateA = a.due_date ? new Date(a.due_date).getTime() : 0;
        const dateB = b.due_date ? new Date(b.due_date).getTime() : 0;
        return dateA - dateB;
      }));
      setProjects(projectsList);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProjectName = (projectId: number) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'Projet inconnu';
  };

  const getDaysUntil = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getPriorityBadge = (priority: string) => {
    const badges = {
      high: 'bg-red-100 text-red-700',
      medium: 'bg-yellow-100 text-yellow-700',
      low: 'bg-green-100 text-green-700',
    };
    return badges[priority as keyof typeof badges] || badges.low;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-[#523DC9]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] opacity-90" />
        <div className="relative p-8">
          <h1 className="text-4xl font-black text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Mes Deadlines
          </h1>
          <p className="text-white/80 text-lg">Suivez vos échéances importantes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
          <div className="text-3xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {tasks.length}
          </div>
          <div className="text-sm text-gray-600">Total deadlines</div>
        </Card>
        <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
          <div className="text-3xl font-bold mb-1 text-red-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {tasks.filter(t => getDaysUntil(t.due_date) <= 3).length}
          </div>
          <div className="text-sm text-gray-600">Urgentes</div>
        </Card>
        <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
          <div className="text-3xl font-bold mb-1 text-yellow-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {tasks.filter(t => getDaysUntil(t.due_date) > 3 && getDaysUntil(t.due_date) <= 7).length}
          </div>
          <div className="text-sm text-gray-600">Cette semaine</div>
        </Card>
      </div>

      <div className="space-y-4">
        {tasks.map((task) => {
          const daysUntil = getDaysUntil(task.due_date);
          const isUrgent = daysUntil <= 3;
          
          return (
            <Card key={task.id} className={`glass-card p-6 rounded-xl border ${isUrgent ? 'border-red-500/50' : 'border-[#A7A2CF]/20'}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {isUrgent && <AlertCircle className="w-5 h-5 text-red-600" />}
                    <h3 className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {task.title}
                    </h3>
                    <span className={`text-xs px-3 py-1 rounded-full ${getPriorityBadge(task.priority)}`}>
                      {task.priority === 'high' ? 'Haute' : task.priority === 'medium' ? 'Moyenne' : 'Basse'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{getProjectName(task.project_id)}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-[#523DC9]" />
                    <span className={daysUntil < 0 ? 'text-red-600 font-bold' : ''}>
                      {daysUntil < 0 ? `En retard de ${Math.abs(daysUntil)} jours` : 
                       daysUntil === 0 ? "Aujourd'hui" :
                       daysUntil === 1 ? 'Demain' :
                       `Dans ${daysUntil} jours`}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span>{new Date(task.due_date).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}

        {tasks.length === 0 && (
          <Card className="glass-card p-12 rounded-xl border border-[#A7A2CF]/20 text-center">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Aucune deadline</p>
          </Card>
        )}
      </div>
    </div>
  );
}
