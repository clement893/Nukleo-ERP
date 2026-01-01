'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState } from 'react';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { 
  Clock, 
  CheckCircle2,
  AlertCircle,
  XCircle,
  Plus,
  Search,
  Calendar,
  Briefcase,
  TrendingUp,
  Download
} from 'lucide-react';
import { Badge, Button, Card, Input } from '@/components/ui';

// Mock data pour la démo
const mockTimesheets = [
  {
    id: 1,
    employee: 'Marie Dubois',
    week: 'Semaine 1 - 2026',
    startDate: '2026-01-06',
    endDate: '2026-01-12',
    monday: 8,
    tuesday: 8,
    wednesday: 8,
    thursday: 8,
    friday: 8,
    saturday: 0,
    sunday: 0,
    totalHours: 40,
    status: 'approved',
    project: 'Refonte Site Web',
    submittedDate: '2026-01-12',
    approvedBy: 'Sophie Laurent'
  },
  {
    id: 2,
    employee: 'Jean Martin',
    week: 'Semaine 1 - 2026',
    startDate: '2026-01-06',
    endDate: '2026-01-12',
    monday: 7.5,
    tuesday: 8,
    wednesday: 7.5,
    thursday: 8,
    friday: 7,
    saturday: 0,
    sunday: 0,
    totalHours: 38,
    status: 'pending',
    project: 'Application Mobile',
    submittedDate: '2026-01-12',
    approvedBy: null
  },
  {
    id: 3,
    employee: 'Sophie Laurent',
    week: 'Semaine 1 - 2026',
    startDate: '2026-01-06',
    endDate: '2026-01-12',
    monday: 8,
    tuesday: 9,
    wednesday: 8,
    thursday: 9,
    friday: 8,
    saturday: 0,
    sunday: 0,
    totalHours: 42,
    status: 'approved',
    project: 'Dashboard Analytics',
    submittedDate: '2026-01-12',
    approvedBy: 'Sophie Laurent'
  },
  {
    id: 4,
    employee: 'Pierre Durand',
    week: 'Semaine 1 - 2026',
    startDate: '2026-01-06',
    endDate: '2026-01-12',
    monday: 8,
    tuesday: 8,
    wednesday: 6,
    thursday: 8,
    friday: 5,
    saturday: 0,
    sunday: 0,
    totalHours: 35,
    status: 'rejected',
    project: 'API Integration',
    submittedDate: '2026-01-12',
    approvedBy: 'Sophie Laurent'
  },
  {
    id: 5,
    employee: 'Claire Petit',
    week: 'Semaine 1 - 2026',
    startDate: '2026-01-06',
    endDate: '2026-01-12',
    monday: 8,
    tuesday: 8,
    wednesday: 8,
    thursday: 8,
    friday: 8,
    saturday: 4,
    sunday: 0,
    totalHours: 44,
    status: 'pending',
    project: 'Plateforme E-commerce',
    submittedDate: '2026-01-13',
    approvedBy: null
  },
  {
    id: 6,
    employee: 'Luc Bernard',
    week: 'Semaine 52 - 2025',
    startDate: '2025-12-23',
    endDate: '2025-12-29',
    monday: 8,
    tuesday: 8,
    wednesday: 8,
    thursday: 4,
    friday: 0,
    saturday: 0,
    sunday: 0,
    totalHours: 28,
    status: 'approved',
    project: 'Plateforme E-commerce',
    submittedDate: '2025-12-29',
    approvedBy: 'Sophie Laurent'
  },
];

const statusConfig = {
  approved: { 
    label: 'Approuvé', 
    color: 'bg-green-500/10 text-green-600 border-green-500/30',
    icon: CheckCircle2,
    iconColor: 'text-green-500'
  },
  pending: { 
    label: 'En attente', 
    color: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
    icon: AlertCircle,
    iconColor: 'text-orange-500'
  },
  rejected: { 
    label: 'Rejeté', 
    color: 'bg-red-500/10 text-red-600 border-red-500/30',
    icon: XCircle,
    iconColor: 'text-red-500'
  },
};

export default function TimesheetsDemoPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Calculate stats
  const totalTimesheets = mockTimesheets.length;
  const approvedTimesheets = mockTimesheets.filter(t => t.status === 'approved').length;
  const pendingTimesheets = mockTimesheets.filter(t => t.status === 'pending').length;
  const rejectedTimesheets = mockTimesheets.filter(t => t.status === 'rejected').length;

  const totalHours = mockTimesheets.reduce((sum, t) => sum + t.totalHours, 0);
  const avgHours = (totalHours / mockTimesheets.length).toFixed(1);

  // Filter timesheets
  const filteredTimesheets = mockTimesheets.filter(timesheet => {
    const matchesSearch = searchQuery === '' ||
      timesheet.employee.toLowerCase().includes(searchQuery.toLowerCase()) ||
      timesheet.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
      timesheet.week.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || timesheet.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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
          
          <div className="relative flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-black text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Feuilles de Temps
              </h1>
              <p className="text-white/80 text-lg">
                Suivez et approuvez les heures travaillées par votre équipe
              </p>
            </div>
            <Button className="hover-nukleo bg-white text-[#523DC9] hover:bg-white/90">
              <Plus className="w-5 h-5 mr-2" />
              Nouvelle feuille
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-gray-500/10 border border-gray-500/30">
                <Clock className="w-6 h-6 text-gray-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {totalTimesheets}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Feuilles</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30">
                <CheckCircle2 className="w-6 h-6 text-[#10B981]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {approvedTimesheets}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Approuvées</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30">
                <AlertCircle className="w-6 h-6 text-[#F59E0B]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {pendingTimesheets}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">En Attente</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30">
                <XCircle className="w-6 h-6 text-[#EF4444]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {rejectedTimesheets}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Rejetées</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/30">
                <TrendingUp className="w-6 h-6 text-[#3B82F6]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {avgHours}h
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Moyenne/semaine</div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher par employé, projet ou semaine..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">Tous les statuts</option>
              <option value="approved">Approuvé</option>
              <option value="pending">En attente</option>
              <option value="rejected">Rejeté</option>
            </select>
          </div>

          <Button variant="outline" className="hover-nukleo">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>

        {/* Timesheets List */}
        <div className="space-y-4">
          {filteredTimesheets.map((timesheet) => {
            const StatusIcon = statusConfig[timesheet.status as keyof typeof statusConfig].icon;
            return (
              <Card key={timesheet.id} className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:border-[#523DC9]/40 transition-all duration-200 cursor-pointer group">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Left Section - Employee Info */}
                  <div className="flex items-start gap-4 lg:w-1/3">
                    <div className={`p-3 rounded-lg ${statusConfig[timesheet.status as keyof typeof statusConfig].color.split(' ')[0]}/20`}>
                      <StatusIcon className={`w-6 h-6 ${statusConfig[timesheet.status as keyof typeof statusConfig].iconColor}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-[#523DC9] transition-colors mb-1">
                        {timesheet.employee}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{timesheet.week}</p>
                      <Badge className={`${statusConfig[timesheet.status as keyof typeof statusConfig].color} border`}>
                        {statusConfig[timesheet.status as keyof typeof statusConfig].label}
                      </Badge>
                    </div>
                  </div>

                  {/* Middle Section - Hours Breakdown */}
                  <div className="flex-1">
                    <div className="grid grid-cols-7 gap-2 mb-3">
                      {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, index) => (
                        <div key={index} className="text-center">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{day}</div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 rounded px-2 py-1">
                            {[timesheet.monday, timesheet.tuesday, timesheet.wednesday, timesheet.thursday, timesheet.friday, timesheet.saturday, timesheet.sunday][index]}h
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        <span>{timesheet.project}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(timesheet.startDate).toLocaleDateString('fr-CA')} - {new Date(timesheet.endDate).toLocaleDateString('fr-CA')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Section - Total & Actions */}
                  <div className="flex flex-col items-end justify-between lg:w-1/6">
                    <div className="text-right mb-4">
                      <div className="text-3xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                        {timesheet.totalHours}h
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Total</div>
                    </div>
                    {timesheet.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button size="sm" className="hover-nukleo bg-green-500 hover:bg-green-600 text-white">
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="hover-nukleo border-red-500 text-red-500">
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    {timesheet.status === 'approved' && timesheet.approvedBy && (
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Approuvé par {timesheet.approvedBy}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </MotionDiv>
    </PageContainer>
  );
}
