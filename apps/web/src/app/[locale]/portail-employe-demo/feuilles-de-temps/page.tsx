'use client';

import { useState } from 'react';
import { Clock, Calendar, Plus, Save } from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui';

export default function MesFeuillesDeTempsPage() {
  const [selectedWeek, setSelectedWeek] = useState('2026-01-01');

  const timeEntries = [
    { day: 'Lundi 30 Déc', project: 'Projet Alpha', hours: 8, tasks: 'Développement API', status: 'saved' },
    { day: 'Mardi 31 Déc', project: 'Projet Beta', hours: 7.5, tasks: 'Code review', status: 'saved' },
    { day: 'Mercredi 1 Jan', project: 'Congé', hours: 0, tasks: 'Jour férié', status: 'holiday' },
    { day: 'Jeudi 2 Jan', project: 'Projet Alpha', hours: 8, tasks: 'Tests unitaires', status: 'draft' },
    { day: 'Vendredi 3 Jan', project: 'Projet Gamma', hours: 6, tasks: 'Documentation', status: 'draft' },
  ];

  const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hours, 0);
  const targetHours = 40;

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] opacity-90" />
        <div className="relative p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Mes Feuilles de Temps
              </h1>
              <p className="text-white/80 text-lg">Saisissez vos heures hebdomadaires</p>
            </div>
            <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm">
              <Save className="w-5 h-5 mr-2" />
              Soumettre la semaine
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Heures cette semaine</span>
          </div>
          <div className="text-3xl font-bold text-blue-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{totalHours}h</div>
        </Card>
        <Card className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Objectif</span>
          </div>
          <div className="text-3xl font-bold text-purple-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{targetHours}h</div>
        </Card>
        <Card className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Progression</span>
          </div>
          <div className="text-3xl font-bold text-green-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{Math.round((totalHours/targetHours)*100)}%</div>
        </Card>
      </div>

      <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
        <div className="space-y-3">
          {timeEntries.map((entry, index) => (
            <div key={index} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold">{entry.day}</h4>
                    {entry.status === 'saved' && <Badge className="bg-green-500/10 text-green-600 border-green-500/30">Sauvegardé</Badge>}
                    {entry.status === 'draft' && <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">Brouillon</Badge>}
                    {entry.status === 'holiday' && <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30">Férié</Badge>}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{entry.project} - {entry.tasks}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-[#523DC9]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {entry.hours}h
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
