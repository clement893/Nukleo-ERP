'use client';

import { DollarSign, Calendar, FileText } from 'lucide-react';
import { Card } from '@/components/ui';

export default function MesDepenses() {
  const expenses = [
    { id: 1, date: '2026-01-15', category: 'Transport', amount: 45.50, description: 'Taxi vers client', status: 'approved' },
    { id: 2, date: '2026-01-14', category: 'Repas', amount: 32.00, description: 'Lunch meeting', status: 'pending' },
    { id: 3, date: '2026-01-10', category: 'Équipement', amount: 150.00, description: 'Clavier mécanique', status: 'approved' },
  ];

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const approved = expenses.filter(e => e.status === 'approved').reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] opacity-90" />
        <div className="relative p-8">
          <h1 className="text-4xl font-black text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Mes Dépenses
          </h1>
          <p className="text-white/80 text-lg">Gérez vos notes de frais</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
          <div className="text-3xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {total.toFixed(2)} $
          </div>
          <div className="text-sm text-gray-600">Total</div>
        </Card>
        <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
          <div className="text-3xl font-bold mb-1 text-green-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {approved.toFixed(2)} $
          </div>
          <div className="text-sm text-gray-600">Approuvé</div>
        </Card>
        <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
          <div className="text-3xl font-bold mb-1 text-yellow-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {expenses.filter(e => e.status === 'pending').length}
          </div>
          <div className="text-sm text-gray-600">En attente</div>
        </Card>
      </div>

      <div className="space-y-4">
        {expenses.map((expense) => (
          <Card key={expense.id} className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="w-5 h-5 text-[#523DC9]" />
                  <h3 className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {expense.description}
                  </h3>
                  <span className={`text-xs px-3 py-1 rounded-full ${expense.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {expense.status === 'approved' ? 'Approuvé' : 'En attente'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>{expense.category}</span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(expense.date).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span className="text-2xl font-bold text-green-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {expense.amount.toFixed(2)} $
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
