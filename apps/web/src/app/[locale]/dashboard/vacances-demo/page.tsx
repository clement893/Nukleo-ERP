'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState } from 'react';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { 
  Plane, 
  CheckCircle2,
  Clock,
  XCircle,
  Plus,
  Search,
  Calendar,
  User,
  TrendingUp,
  Sun,
  Umbrella
} from 'lucide-react';
import { Badge, Button, Card, Input } from '@/components/ui';

// Mock data pour la démo
const mockVacations = [
  {
    id: 1,
    employee: 'Pierre Durand',
    type: 'Vacances annuelles',
    startDate: '2026-01-15',
    endDate: '2026-01-22',
    days: 6,
    status: 'approved',
    requestDate: '2025-12-10',
    approvedBy: 'Sophie Laurent',
    reason: 'Vacances familiales',
    avatar: 'PD',
    color: 'bg-blue-500'
  },
  {
    id: 2,
    employee: 'Claire Petit',
    type: 'Congé maladie',
    startDate: '2026-01-10',
    endDate: '2026-01-12',
    days: 3,
    status: 'pending',
    requestDate: '2026-01-09',
    approvedBy: null,
    reason: 'Grippe',
    avatar: 'CP',
    color: 'bg-pink-500'
  },
  {
    id: 3,
    employee: 'Jean Martin',
    type: 'Vacances annuelles',
    startDate: '2026-02-10',
    endDate: '2026-02-21',
    days: 10,
    status: 'approved',
    requestDate: '2025-12-15',
    approvedBy: 'Sophie Laurent',
    reason: 'Voyage en Europe',
    avatar: 'JM',
    color: 'bg-purple-500'
  },
  {
    id: 4,
    employee: 'Marie Dubois',
    type: 'Congé personnel',
    startDate: '2026-01-25',
    endDate: '2026-01-26',
    days: 2,
    status: 'rejected',
    requestDate: '2026-01-20',
    approvedBy: 'Sophie Laurent',
    reason: 'Déménagement',
    avatar: 'MD',
    color: 'bg-blue-500'
  },
  {
    id: 5,
    employee: 'Luc Bernard',
    type: 'Vacances annuelles',
    startDate: '2026-03-01',
    endDate: '2026-03-07',
    days: 5,
    status: 'pending',
    requestDate: '2026-01-05',
    approvedBy: null,
    reason: 'Ski en famille',
    avatar: 'LB',
    color: 'bg-cyan-500'
  },
  {
    id: 6,
    employee: 'Sophie Laurent',
    type: 'Vacances annuelles',
    startDate: '2026-07-15',
    endDate: '2026-07-29',
    days: 11,
    status: 'approved',
    requestDate: '2025-11-20',
    approvedBy: 'Direction',
    reason: 'Vacances d\'été',
    avatar: 'SL',
    color: 'bg-green-500'
  },
  {
    id: 7,
    employee: 'Thomas Moreau',
    type: 'Congé parental',
    startDate: '2026-02-01',
    endDate: '2026-02-14',
    days: 10,
    status: 'approved',
    requestDate: '2025-12-01',
    approvedBy: 'Sophie Laurent',
    reason: 'Naissance',
    avatar: 'TM',
    color: 'bg-indigo-500'
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
    icon: Clock,
    iconColor: 'text-orange-500'
  },
  rejected: { 
    label: 'Rejeté', 
    color: 'bg-red-500/10 text-red-600 border-red-500/30',
    icon: XCircle,
    iconColor: 'text-red-500'
  },
};

const typeConfig = {
  'Vacances annuelles': { icon: Sun, color: 'text-yellow-500' },
  'Congé maladie': { icon: Umbrella, color: 'text-blue-500' },
  'Congé personnel': { icon: User, color: 'text-purple-500' },
  'Congé parental': { icon: User, color: 'text-pink-500' },
};

export default function VacationsDemoPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Calculate stats
  const totalVacations = mockVacations.length;
  const approvedVacations = mockVacations.filter(v => v.status === 'approved').length;
  const pendingVacations = mockVacations.filter(v => v.status === 'pending').length;
  const rejectedVacations = mockVacations.filter(v => v.status === 'rejected').length;

  const totalDays = mockVacations.filter(v => v.status === 'approved').reduce((sum, v) => sum + v.days, 0);

  // Get unique types
  const types = Array.from(new Set(mockVacations.map(v => v.type))).sort();

  // Filter vacations
  const filteredVacations = mockVacations.filter(vacation => {
    const matchesSearch = searchQuery === '' ||
      vacation.employee.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vacation.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vacation.reason.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || vacation.status === statusFilter;
    const matchesType = typeFilter === 'all' || vacation.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
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
                Vacances & Congés
              </h1>
              <p className="text-white/80 text-lg">
                Gérez les demandes de vacances et congés de votre équipe
              </p>
            </div>
            <Button className="hover-nukleo bg-white text-[#523DC9] hover:bg-white/90">
              <Plus className="w-5 h-5 mr-2" />
              Nouvelle demande
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#523DC9]/10 border border-[#523DC9]/30">
                <Plane className="w-6 h-6 text-[#523DC9]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {totalVacations}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Demandes</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30">
                <CheckCircle2 className="w-6 h-6 text-[#10B981]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {approvedVacations}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Approuvées</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30">
                <Clock className="w-6 h-6 text-[#F59E0B]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {pendingVacations}
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
              {rejectedVacations}
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
              {totalDays}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Jours Totaux</div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher par employé ou raison..."
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

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">Tous les types</option>
              {types.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Vacations List */}
        <div className="space-y-4">
          {filteredVacations.map((vacation) => {
            const TypeIcon = typeConfig[vacation.type as keyof typeof typeConfig]?.icon || Plane;
            const typeColor = typeConfig[vacation.type as keyof typeof typeConfig]?.color || 'text-gray-500';
            
            return (
              <Card key={vacation.id} className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:border-[#523DC9]/40 transition-all duration-200 cursor-pointer group">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Left Section - Employee Info */}
                  <div className="flex items-start gap-4 lg:w-1/4">
                    <div className={`w-14 h-14 rounded-full ${vacation.color} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>
                      {vacation.avatar}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-[#523DC9] transition-colors mb-1">
                        {vacation.employee}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <TypeIcon className={`w-4 h-4 ${typeColor}`} />
                        <span>{vacation.type}</span>
                      </div>
                      <Badge className={`${statusConfig[vacation.status as keyof typeof statusConfig].color} border`}>
                        {statusConfig[vacation.status as keyof typeof statusConfig].label}
                      </Badge>
                    </div>
                  </div>

                  {/* Middle Section - Dates & Details */}
                  <div className="flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Date de début</div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                          <Calendar className="w-4 h-4" />
                          {new Date(vacation.startDate).toLocaleDateString('fr-CA', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Date de fin</div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                          <Calendar className="w-4 h-4" />
                          {new Date(vacation.endDate).toLocaleDateString('fr-CA', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Raison</div>
                      <p className="text-sm text-gray-900 dark:text-white">{vacation.reason}</p>
                    </div>
                    {vacation.status === 'approved' && vacation.approvedBy && (
                      <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                        Approuvé par {vacation.approvedBy}
                      </div>
                    )}
                  </div>

                  {/* Right Section - Days & Actions */}
                  <div className="flex flex-col items-end justify-between lg:w-1/6">
                    <div className="text-right mb-4">
                      <div className="text-4xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                        {vacation.days}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">jours</div>
                    </div>
                    {vacation.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button size="sm" className="hover-nukleo bg-green-500 hover:bg-green-600 text-white">
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="hover-nukleo border-red-500 text-red-500">
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Calendar Preview */}
        <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-[#523DC9]/10 border border-[#523DC9]/30">
                <Calendar className="w-6 h-6 text-[#523DC9]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Calendrier des absences</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Vue d'ensemble des vacances approuvées</p>
              </div>
            </div>
            <Button variant="outline" className="hover-nukleo">
              Voir le calendrier complet
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {mockVacations.filter(v => v.status === 'approved').slice(0, 6).map((vacation) => (
              <div key={vacation.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className={`w-10 h-10 rounded-full ${vacation.color} flex items-center justify-center text-white font-semibold text-sm`}>
                  {vacation.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">{vacation.employee}</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {new Date(vacation.startDate).toLocaleDateString('fr-CA', { month: 'short', day: 'numeric' })} - {new Date(vacation.endDate).toLocaleDateString('fr-CA', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <Badge className="text-xs">{vacation.days}j</Badge>
              </div>
            ))}
          </div>
        </Card>
      </MotionDiv>
    </PageContainer>
  );
}
