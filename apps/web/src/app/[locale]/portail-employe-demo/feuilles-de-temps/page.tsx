'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Clock, Calendar, Loader2, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui';
import { timeEntriesAPI, type TimeEntry } from '@/lib/api/time-entries';
import { projectsAPI } from '@/lib/api';
import { employeesAPI } from '@/lib/api/employees';

export default function MesFeuillesDeTemps() {
  const params = useParams();
  const employeeId = parseInt(params?.id as string);
  
  const [loading, setLoading] = useState(true);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    if (employeeId) {
      loadData();
    }
  }, [employeeId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      // Get employee to find user_id
      const employee = await employeesAPI.get(employeeId);
      const userId = employee.user_id;

      if (!userId) {
        console.error('Employee has no associated user_id');
        setTimeEntries([]);
        setProjects([]);
        return;
      }

      const [entriesData, projectsData] = await Promise.all([
        timeEntriesAPI.list({ user_id: userId, start_date: startOfWeek.toISOString().split('T')[0] }),
        projectsAPI.list(),
      ]);
      
      const projectsList = Array.isArray(projectsData) ? projectsData : (projectsData?.data || []);
      setTimeEntries(entriesData);
      setProjects(projectsList);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProjectName = (projectId: number | null | undefined) => {
    if (!projectId) return 'Projet inconnu';
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'Projet inconnu';
  };

  // Convert duration (seconds) to hours
  const durationToHours = (duration: number | undefined): number => {
    if (!duration) return 0;
    return duration / 3600; // Convert seconds to hours
  };

  const totalHours = timeEntries.reduce((sum: number, entry: TimeEntry) => sum + durationToHours(entry.duration), 0);
  const thisWeekHours = timeEntries.filter((e: TimeEntry) => {
    const entryDate = new Date(e.date);
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    return entryDate >= startOfWeek;
  }).reduce((sum: number, e: TimeEntry) => sum + durationToHours(e.duration), 0);

  const groupedByDate = timeEntries.reduce((acc: Record<string, TimeEntry[]>, entry: TimeEntry) => {
    const date = entry.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, TimeEntry[]>);

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
            Mes Feuilles de Temps
          </h1>
          <p className="text-white/80 text-lg">Suivez vos heures travaillées</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="text-3xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {thisWeekHours.toFixed(1)}h
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Cette semaine</div>
        </Card>

        <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="text-3xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {totalHours.toFixed(1)}h
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
        </Card>

        <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="text-3xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {timeEntries.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Entrées</div>
        </Card>
      </div>

      <div className="space-y-4">
        {Object.entries(groupedByDate).sort(([a], [b]) => b.localeCompare(a)).map(([date, entries]) => {
          const dayTotal = entries.reduce((sum: number, e: TimeEntry) => sum + durationToHours(e.duration), 0);
          
          return (
            <Card key={date} className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-[#523DC9]" />
                  <h3 className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </h3>
                </div>
                <span className="text-sm font-bold text-[#523DC9]">{dayTotal.toFixed(1)}h</span>
              </div>

              <div className="space-y-3">
                {entries.map((entry: TimeEntry) => {
                  const hours = durationToHours(entry.duration);
                  return (
                    <div key={entry.id} className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex-1">
                        <div className="font-medium mb-1">{entry.project_name || getProjectName(entry.project_id)}</div>
                        {entry.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">{entry.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span className="font-bold text-blue-600">{hours.toFixed(1)}h</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}

        {timeEntries.length === 0 && (
          <Card className="glass-card p-12 rounded-xl border border-[#A7A2CF]/20 text-center">
            <Clock className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">Aucune feuille de temps enregistrée</p>
          </Card>
        )}
      </div>
    </div>
  );
}
