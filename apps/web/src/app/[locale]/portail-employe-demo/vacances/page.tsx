'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Calendar, Loader2, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Card } from '@/components/ui';
import { vacationsAPI } from '@/lib/api/vacations';
import { employeesAPI } from '@/lib/api/employees';

export default function MesVacances() {
  const params = useParams();
  const employeeId = parseInt(params?.id as string);
  
  const [loading, setLoading] = useState(true);
  const [vacations, setVacations] = useState<any[]>([]);
  const [employee, setEmployee] = useState<any>(null);

  useEffect(() => {
    if (employeeId) {
      loadData();
    }
  }, [employeeId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [vacData, empData] = await Promise.all([
        vacationsAPI.list({ employee_id: employeeId }),
        employeesAPI.get(employeeId),
      ]);
      setVacations(vacData);
      setEmployee(empData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  const getStatusIcon = (status: string) => {
    if (status === 'approved') return <CheckCircle className="w-4 h-4" />;
    if (status === 'rejected') return <XCircle className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
  };

  const totalDays = vacations.reduce((sum, v) => {
    const start = new Date(v.start_date);
    const end = new Date(v.end_date);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return sum + days;
  }, 0);

  const approvedDays = vacations.filter(v => v.status === 'approved').reduce((sum, v) => {
    const start = new Date(v.start_date);
    const end = new Date(v.end_date);
    return sum + Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }, 0);

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
            Mes Vacances
          </h1>
          <p className="text-white/80 text-lg">Gérez vos demandes de congés</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
          <div className="text-3xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {totalDays}
          </div>
          <div className="text-sm text-gray-600">Total demandé</div>
        </Card>
        <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
          <div className="text-3xl font-bold mb-1 text-green-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {approvedDays}
          </div>
          <div className="text-sm text-gray-600">Jours approuvés</div>
        </Card>
        <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
          <div className="text-3xl font-bold mb-1 text-yellow-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {vacations.filter(v => v.status === 'pending').length}
          </div>
          <div className="text-sm text-gray-600">En attente</div>
        </Card>
        <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
          <div className="text-3xl font-bold mb-1 text-blue-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {25 - approvedDays}
          </div>
          <div className="text-sm text-gray-600">Jours disponibles</div>
        </Card>
      </div>

      <div className="space-y-4">
        {vacations.map((vacation) => {
          const start = new Date(vacation.start_date);
          const end = new Date(vacation.end_date);
          const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          
          return (
            <Card key={vacation.id} className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="w-5 h-5 text-[#523DC9]" />
                    <h3 className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {vacation.reason || 'Vacances'}
                    </h3>
                    <span className={`flex items-center gap-1 text-xs px-3 py-1 rounded-full ${getStatusBadge(vacation.status)}`}>
                      {getStatusIcon(vacation.status)}
                      {vacation.status === 'approved' ? 'Approuvé' : vacation.status === 'rejected' ? 'Refusé' : 'En attente'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    Du {start.toLocaleDateString('fr-FR')} au {end.toLocaleDateString('fr-FR')} • {days} jour{days > 1 ? 's' : ''}
                  </div>
                  {vacation.notes && (
                    <p className="text-sm text-gray-500 mt-2">{vacation.notes}</p>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
        {vacations.length === 0 && (
          <Card className="glass-card p-12 rounded-xl border border-[#A7A2CF]/20 text-center">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Aucune demande de vacances</p>
          </Card>
        )}
      </div>
    </div>
  );
}
