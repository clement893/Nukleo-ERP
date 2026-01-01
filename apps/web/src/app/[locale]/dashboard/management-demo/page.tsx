'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { 
  Users, 
  Clock, 
  Plane,
  Calendar,
  UserPlus,
  TrendingUp,
  DollarSign,
  FileText,
  Plus,
  Eye,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Badge, Button, Card } from '@/components/ui';
import Link from 'next/link';

// Mock data pour la démo
const mockEmployees = [
  { id: 1, name: 'Marie Dubois', role: 'Développeuse Senior', status: 'active', avatar: 'MD' },
  { id: 2, name: 'Jean Martin', role: 'Designer UI/UX', status: 'active', avatar: 'JM' },
  { id: 3, name: 'Sophie Laurent', role: 'Chef de Projet', status: 'active', avatar: 'SL' },
  { id: 4, name: 'Pierre Durand', role: 'Développeur Backend', status: 'vacation', avatar: 'PD' },
  { id: 5, name: 'Claire Petit', role: 'Product Manager', status: 'active', avatar: 'CP' },
];

const mockTimesheets = [
  { id: 1, employee: 'Marie Dubois', week: 'Semaine 1', hours: 40, status: 'approved' },
  { id: 2, employee: 'Jean Martin', week: 'Semaine 1', hours: 38, status: 'pending' },
  { id: 3, employee: 'Sophie Laurent', week: 'Semaine 1', hours: 42, status: 'approved' },
];

const mockVacations = [
  { id: 1, employee: 'Pierre Durand', type: 'Vacances', start: '2026-01-15', end: '2026-01-22', status: 'approved' },
  { id: 2, employee: 'Claire Petit', type: 'Congé maladie', start: '2026-01-10', end: '2026-01-12', status: 'pending' },
];

const mockExpenses = [
  { id: 1, employee: 'Marie Dubois', description: 'Déplacement client', amount: 125.50, status: 'approved' },
  { id: 2, employee: 'Jean Martin', description: 'Matériel bureau', amount: 89.99, status: 'pending' },
  { id: 3, employee: 'Sophie Laurent', description: 'Formation en ligne', amount: 299.00, status: 'approved' },
];

export default function ManagementDemoPage() {
  // Calculate stats
  const totalEmployees = mockEmployees.length;
  const activeEmployees = mockEmployees.filter(e => e.status === 'active').length;
  const onVacation = mockEmployees.filter(e => e.status === 'vacation').length;
  
  const totalHours = mockTimesheets.reduce((sum, t) => sum + t.hours, 0);
  const avgHours = (totalHours / mockTimesheets.length).toFixed(1);
  
  const pendingTimesheets = mockTimesheets.filter(t => t.status === 'pending').length;
  const pendingVacations = mockVacations.filter(v => v.status === 'pending').length;
  const pendingExpenses = mockExpenses.filter(e => e.status === 'pending').length;
  
  const totalExpenses = mockExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <PageContainer className="flex flex-col h-full">
      <MotionDiv variant="slideUp" duration="normal" className="flex flex-col flex-1 space-y-6">
        {/* Hero Header */}
        <div className="relative rounded-2xl overflow-hidden -mt-4 -mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-10 2xl:-mx-12 3xl:-mx-16 4xl:-mx-20 px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 3xl:px-16 4xl:px-20 pt-6 pb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] opacity-90" />
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
            backgroundSize: '200px 200px'
          }} />
          
          <div className="relative">
            <h1 className="text-5xl font-black text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Management
            </h1>
            <p className="text-white/80 text-lg">
              Gérez vos employés, feuilles de temps, vacances et dépenses
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#523DC9]/10 border border-[#523DC9]/30">
                <Users className="w-6 h-6 text-[#523DC9]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {totalEmployees}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Employés</div>
            <div className="text-xs text-green-600 dark:text-green-400 mt-2">
              {activeEmployees} actifs
            </div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/30">
                <Clock className="w-6 h-6 text-[#3B82F6]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {avgHours}h
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Moyenne/semaine</div>
            <div className="text-xs text-orange-600 dark:text-orange-400 mt-2">
              {pendingTimesheets} en attente
            </div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30">
                <Plane className="w-6 h-6 text-[#10B981]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {onVacation}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">En vacances</div>
            <div className="text-xs text-orange-600 dark:text-orange-400 mt-2">
              {pendingVacations} demandes
            </div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30">
                <DollarSign className="w-6 h-6 text-[#F59E0B]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(totalExpenses)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Dépenses</div>
            <div className="text-xs text-orange-600 dark:text-orange-400 mt-2">
              {pendingExpenses} à approuver
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/dashboard/management/employes">
            <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:scale-105 hover:border-[#523DC9]/40 transition-all duration-200 cursor-pointer group">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-4 rounded-xl bg-[#523DC9]/10 border border-[#523DC9]/30 group-hover:bg-[#523DC9]/20 transition-colors">
                  <Users className="w-8 h-8 text-[#523DC9]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Employés</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{totalEmployees} employés</p>
                </div>
              </div>
              <Button className="w-full hover-nukleo" variant="outline">
                <UserPlus className="w-4 h-4 mr-2" />
                Nouvel employé
              </Button>
            </Card>
          </Link>

          <Link href="/dashboard/management/feuilles-temps">
            <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:scale-105 hover:border-[#3B82F6]/40 transition-all duration-200 cursor-pointer group">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-4 rounded-xl bg-[#3B82F6]/10 border border-[#3B82F6]/30 group-hover:bg-[#3B82F6]/20 transition-colors">
                  <Clock className="w-8 h-8 text-[#3B82F6]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Feuilles de temps</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{pendingTimesheets} en attente</p>
                </div>
              </div>
              <Button className="w-full hover-nukleo" variant="outline">
                <Eye className="w-4 h-4 mr-2" />
                Voir toutes
              </Button>
            </Card>
          </Link>

          <Link href="/dashboard/management/vacances">
            <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:scale-105 hover:border-[#10B981]/40 transition-all duration-200 cursor-pointer group">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-4 rounded-xl bg-[#10B981]/10 border border-[#10B981]/30 group-hover:bg-[#10B981]/20 transition-colors">
                  <Plane className="w-8 h-8 text-[#10B981]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Vacances</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{pendingVacations} demandes</p>
                </div>
              </div>
              <Button className="w-full hover-nukleo" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle demande
              </Button>
            </Card>
          </Link>

          <Link href="/dashboard/management/compte-depenses">
            <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:scale-105 hover:border-[#F59E0B]/40 transition-all duration-200 cursor-pointer group">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-4 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 group-hover:bg-[#F59E0B]/20 transition-colors">
                  <FileText className="w-8 h-8 text-[#F59E0B]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Dépenses</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{pendingExpenses} à approuver</p>
                </div>
              </div>
              <Button className="w-full hover-nukleo" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle dépense
              </Button>
            </Card>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Employees */}
          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Employés actifs</h3>
              <Badge className="bg-[#523DC9]/10 text-[#523DC9]">{activeEmployees}</Badge>
            </div>
            <div className="space-y-3">
              {mockEmployees.filter(e => e.status === 'active').map((employee) => (
                <div key={employee.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-[#523DC9]/30 transition-all cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-[#523DC9]/10 border border-[#523DC9]/30 flex items-center justify-center text-[#523DC9] font-semibold">
                    {employee.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">{employee.name}</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{employee.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Pending Timesheets */}
          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Feuilles en attente</h3>
              <Badge className="bg-[#F59E0B]/10 text-[#F59E0B]">{pendingTimesheets}</Badge>
            </div>
            <div className="space-y-3">
              {mockTimesheets.filter(t => t.status === 'pending').map((timesheet) => (
                <div key={timesheet.id} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-[#3B82F6]/30 transition-all cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">{timesheet.employee}</h4>
                    <Badge className="bg-orange-500/10 text-orange-600 text-xs">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      En attente
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span>{timesheet.week}</span>
                    <span className="font-semibold">{timesheet.hours}h</span>
                  </div>
                </div>
              ))}
              {pendingTimesheets === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">Aucune feuille en attente</p>
              )}
            </div>
          </Card>

          {/* Recent Expenses */}
          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Dépenses récentes</h3>
              <Badge className="bg-[#F59E0B]/10 text-[#F59E0B]">{mockExpenses.length}</Badge>
            </div>
            <div className="space-y-3">
              {mockExpenses.slice(0, 3).map((expense) => (
                <div key={expense.id} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">{expense.employee}</h4>
                    <Badge className={expense.status === 'approved' ? 'bg-green-500/10 text-green-600' : 'bg-orange-500/10 text-orange-600'}>
                      {expense.status === 'approved' ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Approuvé
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3 mr-1" />
                          En attente
                        </>
                      )}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{expense.description}</p>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(expense.amount)}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Calendar Section */}
        <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30">
                <Calendar className="w-6 h-6 text-[#10B981]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Calendrier des absences</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Vacances et congés à venir</p>
              </div>
            </div>
            <Link href="/dashboard/management/vacances">
              <Button variant="outline" className="hover-nukleo">
                Voir le calendrier
              </Button>
            </Link>
          </div>

          <div className="space-y-3">
            {mockVacations.map((vacation) => (
              <div key={vacation.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30">
                    <Plane className="w-5 h-5 text-[#10B981]" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{vacation.employee}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{vacation.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(vacation.start).toLocaleDateString('fr-CA')} - {new Date(vacation.end).toLocaleDateString('fr-CA')}
                    </p>
                  </div>
                  <Badge className={vacation.status === 'approved' ? 'bg-green-500/10 text-green-600 border border-green-500/30' : 'bg-orange-500/10 text-orange-600 border border-orange-500/30'}>
                    {vacation.status === 'approved' ? 'Approuvé' : 'En attente'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </MotionDiv>
    </PageContainer>
  );
}
