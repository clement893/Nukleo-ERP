'use client';

import { useState } from 'react';
import { CheckSquare, Circle, CheckCircle2, Clock, Filter, Plus } from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui';

export default function MesTachesPage() {
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const tasks = [
    { id: 1, title: 'Développer API authentification', project: 'Projet Alpha', status: 'in_progress', priority: 'high', dueDate: '2026-01-05', progress: 60 },
    { id: 2, title: 'Révision code frontend', project: 'Projet Beta', status: 'todo', priority: 'medium', dueDate: '2026-01-08', progress: 0 },
    { id: 3, title: 'Documentation technique', project: 'Projet Gamma', status: 'in_progress', priority: 'low', dueDate: '2026-01-10', progress: 30 },
    { id: 4, title: 'Tests unitaires', project: 'Projet Alpha', status: 'todo', priority: 'high', dueDate: '2026-01-06', progress: 0 },
    { id: 5, title: 'Optimisation performance', project: 'Projet Beta', status: 'completed', priority: 'medium', dueDate: '2025-12-30', progress: 100 },
  ];

  const filteredTasks = filterStatus === 'all' ? tasks : tasks.filter(t => t.status === filterStatus);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] opacity-90" />
        <div className="relative p-8">
          <h1 className="text-4xl font-black text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Mes Tâches
          </h1>
          <p className="text-white/80 text-lg">Gérez vos tâches et suivez votre progression</p>
        </div>
      </div>

      <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
        <div className="flex items-center gap-4">
          <Filter className="w-4 h-4 text-gray-500" />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 rounded-lg border">
            <option value="all">Tous les statuts</option>
            <option value="todo">À faire</option>
            <option value="in_progress">En cours</option>
            <option value="completed">Terminées</option>
          </select>
        </div>
      </Card>

      <div className="space-y-3">
        {filteredTasks.map((task) => (
          <Card key={task.id} className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-start gap-4">
              <div className="mt-1">
                {task.status === 'completed' ? <CheckCircle2 className="w-5 h-5 text-green-600" /> :
                 task.status === 'in_progress' ? <Clock className="w-5 h-5 text-blue-600" /> :
                 <Circle className="w-5 h-5 text-gray-400" />}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{task.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{task.project}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge className={task.status === 'completed' ? 'bg-green-500/10 text-green-600' : task.status === 'in_progress' ? 'bg-blue-500/10 text-blue-600' : 'bg-gray-500/10 text-gray-600'}>
                    {task.status === 'completed' ? 'Terminée' : task.status === 'in_progress' ? 'En cours' : 'À faire'}
                  </Badge>
                  <Badge className={task.priority === 'high' ? 'bg-red-500/10 text-red-600' : task.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-600' : 'bg-green-500/10 text-green-600'}>
                    {task.priority === 'high' ? 'Haute' : task.priority === 'medium' ? 'Moyenne' : 'Basse'}
                  </Badge>
                </div>
                {task.status !== 'completed' && (
                  <div className="mt-3">
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-[#523DC9]" style={{ width: `${task.progress}%` }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
