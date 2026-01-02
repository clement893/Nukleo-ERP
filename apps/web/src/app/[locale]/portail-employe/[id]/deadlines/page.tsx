'use client';

import { AlertCircle, Calendar, Clock } from 'lucide-react';
import { Card, Badge } from '@/components/ui';

export default function MesDeadlinesPage() {
  const deadlines = [
    { id: 1, title: 'Livraison Projet Alpha', date: '2026-01-05', time: '17:00', priority: 'urgent', daysLeft: 4, project: 'Projet Alpha', status: 'pending' },
    { id: 2, title: 'Code Review Projet Beta', date: '2026-01-08', time: '14:00', priority: 'high', daysLeft: 7, project: 'Projet Beta', status: 'pending' },
    { id: 3, title: 'Documentation Gamma', date: '2026-01-10', time: '12:00', priority: 'medium', daysLeft: 9, project: 'Projet Gamma', status: 'pending' },
    { id: 4, title: 'Tests unitaires Alpha', date: '2026-01-06', time: '16:00', priority: 'high', daysLeft: 5, project: 'Projet Alpha', status: 'pending' },
    { id: 5, title: 'Démo client XYZ', date: '2026-01-15', time: '10:00', priority: 'urgent', daysLeft: 14, project: 'Projet Beta', status: 'pending' },
  ];

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

      <div className="space-y-3">
        {deadlines.map((deadline) => (
          <Card key={deadline.id} className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <AlertCircle className={`w-5 h-5 ${
                    deadline.priority === 'urgent' ? 'text-red-600' :
                    deadline.priority === 'high' ? 'text-orange-600' :
                    'text-yellow-600'
                  }`} />
                  <h3 className="font-semibold text-lg">{deadline.title}</h3>
                  <Badge className={
                    deadline.priority === 'urgent' ? 'bg-red-500/10 text-red-600 border-red-500/30' :
                    deadline.priority === 'high' ? 'bg-orange-500/10 text-orange-600 border-orange-500/30' :
                    'bg-yellow-500/10 text-yellow-600 border-yellow-500/30'
                  }>
                    {deadline.priority === 'urgent' ? 'Urgent' : deadline.priority === 'high' ? 'Haute' : 'Moyenne'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{deadline.project}</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    {new Date(deadline.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                  </span>
                  <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                    <Clock className="w-4 h-4" />
                    {deadline.time}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-3xl font-bold ${
                  deadline.daysLeft <= 3 ? 'text-red-600' :
                  deadline.daysLeft <= 7 ? 'text-orange-600' :
                  'text-blue-600'
                }`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {deadline.daysLeft}
                </div>
                <p className="text-xs text-gray-500">jours restants</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
