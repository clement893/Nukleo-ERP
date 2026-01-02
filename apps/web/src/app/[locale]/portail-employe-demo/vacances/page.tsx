'use client';

import { Plane, Calendar, Plus, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui';

export default function MesVacancesPage() {
  const vacations = [
    { id: 1, startDate: '2026-02-10', endDate: '2026-02-14', days: 5, type: 'Vacances', status: 'pending', reason: 'Vacances familiales' },
    { id: 2, startDate: '2025-12-24', endDate: '2025-12-26', days: 3, type: 'Congé', status: 'approved', reason: 'Fêtes de fin d\'année' },
    { id: 3, startDate: '2026-03-15', endDate: '2026-03-22', days: 8, type: 'Vacances', status: 'draft', reason: 'Voyage' },
    { id: 4, startDate: '2025-11-28', endDate: '2025-11-29', days: 2, type: 'Personnel', status: 'approved', reason: 'Déménagement' },
  ];

  const balance = { total: 25, used: 10, pending: 5, available: 10 };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] opacity-90" />
        <div className="relative p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Mes Vacances
              </h1>
              <p className="text-white/80 text-lg">Gérez vos demandes de congés</p>
            </div>
            <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm">
              <Plus className="w-5 h-5 mr-2" />
              Nouvelle demande
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Total</span>
          </div>
          <div className="text-3xl font-bold text-blue-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{balance.total}</div>
          <p className="text-xs text-gray-500 mt-1">jours/an</p>
        </Card>
        <Card className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Utilisés</span>
          </div>
          <div className="text-3xl font-bold text-green-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{balance.used}</div>
          <p className="text-xs text-gray-500 mt-1">jours</p>
        </Card>
        <Card className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-yellow-600" />
            <span className="text-sm text-gray-600 dark:text-gray-400">En attente</span>
          </div>
          <div className="text-3xl font-bold text-yellow-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{balance.pending}</div>
          <p className="text-xs text-gray-500 mt-1">jours</p>
        </Card>
        <Card className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20">
          <div className="flex items-center gap-3 mb-2">
            <Plane className="w-5 h-5 text-purple-600" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Disponibles</span>
          </div>
          <div className="text-3xl font-bold text-purple-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{balance.available}</div>
          <p className="text-xs text-gray-500 mt-1">jours</p>
        </Card>
      </div>

      <div className="space-y-3">
        {vacations.map((vacation) => (
          <Card key={vacation.id} className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Plane className="w-5 h-5 text-[#523DC9]" />
                  <h3 className="font-semibold text-lg">{vacation.type}</h3>
                  <Badge className={
                    vacation.status === 'approved' ? 'bg-green-500/10 text-green-600 border-green-500/30' :
                    vacation.status === 'pending' ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30' :
                    'bg-gray-500/10 text-gray-600 border-gray-500/30'
                  }>
                    {vacation.status === 'approved' ? 'Approuvée' : vacation.status === 'pending' ? 'En attente' : 'Brouillon'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{vacation.reason}</p>
                <p className="text-xs text-gray-500">
                  Du {new Date(vacation.startDate).toLocaleDateString('fr-FR')} au {new Date(vacation.endDate).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-[#523DC9]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {vacation.days}
                </div>
                <p className="text-xs text-gray-500">jours</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
