'use client';

import { DollarSign, Receipt, Upload, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui';

export default function MesDepensesPage() {
  const expenses = [
    { id: 1, title: 'Déplacement client TechCorp', amount: 125.50, date: '2025-12-28', category: 'Transport', status: 'approved', project: 'Projet Alpha' },
    { id: 2, title: 'Repas d\'affaires', amount: 89.00, date: '2025-12-30', category: 'Repas', status: 'pending', project: 'Projet Beta' },
    { id: 3, title: 'Matériel informatique', amount: 450.00, date: '2026-01-02', category: 'Équipement', status: 'pending', project: 'Projet Alpha' },
    { id: 4, title: 'Formation en ligne', amount: 199.99, date: '2025-12-15', category: 'Formation', status: 'approved', project: 'Personnel' },
    { id: 5, title: 'Stationnement', amount: 25.00, date: '2026-01-03', category: 'Transport', status: 'draft', project: 'Projet Gamma' },
  ];

  const totalPending = expenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0);
  const totalApproved = expenses.filter(e => e.status === 'approved').reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] opacity-90" />
        <div className="relative p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Mes Comptes de Dépenses
              </h1>
              <p className="text-white/80 text-lg">Gérez vos notes de frais</p>
            </div>
            <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm">
              <Upload className="w-5 h-5 mr-2" />
              Nouvelle dépense
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-yellow-600" />
            <span className="text-sm text-gray-600 dark:text-gray-400">En attente</span>
          </div>
          <div className="text-3xl font-bold text-yellow-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {totalPending.toFixed(2)} $
          </div>
        </Card>
        <Card className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Approuvées</span>
          </div>
          <div className="text-3xl font-bold text-green-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {totalApproved.toFixed(2)} $
          </div>
        </Card>
        <Card className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Total</span>
          </div>
          <div className="text-3xl font-bold text-blue-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {(totalPending + totalApproved).toFixed(2)} $
          </div>
        </Card>
      </div>

      <div className="space-y-3">
        {expenses.map((expense) => (
          <Card key={expense.id} className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Receipt className="w-5 h-5 text-[#523DC9]" />
                  <h3 className="font-semibold text-lg">{expense.title}</h3>
                  <Badge className={
                    expense.status === 'approved' ? 'bg-green-500/10 text-green-600 border-green-500/30' :
                    expense.status === 'pending' ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30' :
                    'bg-gray-500/10 text-gray-600 border-gray-500/30'
                  }>
                    {expense.status === 'approved' ? 'Approuvée' : expense.status === 'pending' ? 'En attente' : 'Brouillon'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{expense.project} • {expense.category}</p>
                <p className="text-xs text-gray-500">{new Date(expense.date).toLocaleDateString('fr-FR')}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-[#523DC9]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {expense.amount.toFixed(2)} $
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
