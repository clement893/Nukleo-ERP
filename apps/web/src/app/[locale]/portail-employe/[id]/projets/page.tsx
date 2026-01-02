'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Briefcase, DollarSign, Clock, Loader2, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui';
import { projectsAPI } from '@/lib/api/projects';
import { projectTasksAPI } from '@/lib/api/project-tasks';

export default function MesProjets() {
  const params = useParams();
  const employeeId = parseInt(params?.id as string);
  
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    if (employeeId) {
      loadData();
    }
  }, [employeeId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [projectsData, tasksData] = await Promise.all([
        projectsAPI.list(),
        projectTasksAPI.list({ assignee_id: employeeId }),
      ]);
      
      const projectsList = Array.isArray(projectsData) ? projectsData : (projectsData?.data || []);
      
      // Get all projects where employee is assigned (via project_employees table)
      const assignedProjectIds = new Set<number>();
      for (const project of projectsList) {
        try {
          const employees = await projectsAPI.getEmployees(project.id);
          if (employees.some((emp: any) => emp.employee_id === employeeId || emp.user_id === employeeId)) {
            assignedProjectIds.add(project.id);
          }
        } catch (err) {
          // Silently fail if we can't get employees for a project
          console.warn(`Could not get employees for project ${project.id}:`, err);
        }
      }
      
      // Filter projects where employee is assigned OR has tasks
      const myProjects = projectsList.filter((p: any) => 
        assignedProjectIds.has(p.id) || tasksData.some((t: any) => t.project_id === p.id)
      );
      
      setProjects(myProjects);
      setTasks(tasksData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProjectTasks = (projectId: number) => {
    return tasks.filter(t => t.project_id === projectId);
  };

  const getProjectProgress = (projectId: number) => {
    const projectTasks = getProjectTasks(projectId);
    if (projectTasks.length === 0) return 0;
    const completed = projectTasks.filter(t => t.status === 'done').length;
    return Math.round((completed / projectTasks.length) * 100);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      planning: 'bg-gray-100 text-gray-700',
      in_progress: 'bg-blue-100 text-blue-700',
      on_hold: 'bg-orange-100 text-orange-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return badges[status as keyof typeof badges] || badges.planning;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      planning: 'Planification',
      in_progress: 'En cours',
      on_hold: 'En pause',
      completed: 'Terminé',
      cancelled: 'Annulé',
    };
    return labels[status as keyof typeof labels] || status;
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
            Mes Projets
          </h1>
          <p className="text-white/80 text-lg">Suivez l'avancement de vos projets</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <Briefcase className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="text-3xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {projects.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Projets actifs</div>
        </Card>

        <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
              <CheckCircle className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="text-3xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {tasks.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Tâches assignées</div>
        </Card>

        <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="text-3xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {tasks.filter(t => t.status === 'in_progress').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">En cours</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {projects.map((project) => {
          const projectTasks = getProjectTasks(project.id);
          const progress = getProjectProgress(project.id);
          
          return (
            <Card key={project.id} className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:border-[#523DC9]/40 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {project.name}
                  </h3>
                  {project.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {project.description}
                    </p>
                  )}
                </div>
                <span className={`text-xs px-3 py-1 rounded-full ${getStatusBadge(project.status)}`}>
                  {getStatusLabel(project.status)}
                </span>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Progression</span>
                  <span className="text-sm font-bold text-[#523DC9]">{progress}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#523DC9] to-[#5F2B75] transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                {project.budget && (
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="text-gray-600 dark:text-gray-400">
                      {project.budget.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  <span className="text-gray-600 dark:text-gray-400">
                    {projectTasks.length} tâches
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    ✅ {projectTasks.filter(t => t.status === 'done').length} terminées
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    🔄 {projectTasks.filter(t => t.status === 'in_progress').length} en cours
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    📋 {projectTasks.filter(t => t.status === 'todo').length} à faire
                  </span>
                </div>
              </div>

              {(project.start_date || project.end_date) && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
                  {project.start_date && (
                    <span>Début: {new Date(project.start_date).toLocaleDateString('fr-FR')}</span>
                  )}
                  {project.start_date && project.end_date && <span className="mx-2">•</span>}
                  {project.end_date && (
                    <span>Fin: {new Date(project.end_date).toLocaleDateString('fr-FR')}</span>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {projects.length === 0 && (
        <Card className="glass-card p-12 rounded-xl border border-[#A7A2CF]/20 text-center">
          <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400">Aucun projet assigné</p>
        </Card>
      )}
    </div>
  );
}
