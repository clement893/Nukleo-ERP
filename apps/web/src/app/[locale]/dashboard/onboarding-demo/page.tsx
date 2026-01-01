'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState } from 'react';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { 
  UserPlus, 
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Search,
  Calendar,
  User,
  FileText,
  Award,
  BookOpen,
  Laptop
} from 'lucide-react';
import { Badge, Button, Card, Input } from '@/components/ui';

// Mock data pour la démo
const mockOnboardings = [
  {
    id: 1,
    employee: 'Alexandre Tremblay',
    role: 'Développeur Full Stack',
    department: 'Technologie',
    startDate: '2026-02-01',
    status: 'pending',
    progress: 0,
    tasks: [
      { id: 1, title: 'Signature du contrat', completed: false },
      { id: 2, title: 'Configuration email', completed: false },
      { id: 3, title: 'Accès aux outils', completed: false },
      { id: 4, title: 'Formation sécurité', completed: false },
      { id: 5, title: 'Rencontre équipe', completed: false },
    ],
    mentor: 'Marie Dubois',
    avatar: 'AT',
    color: 'bg-blue-500'
  },
  {
    id: 2,
    employee: 'Isabelle Gagnon',
    role: 'Designer UX/UI',
    department: 'Design',
    startDate: '2026-01-15',
    status: 'in_progress',
    progress: 60,
    tasks: [
      { id: 1, title: 'Signature du contrat', completed: true },
      { id: 2, title: 'Configuration email', completed: true },
      { id: 3, title: 'Accès aux outils', completed: true },
      { id: 4, title: 'Formation sécurité', completed: false },
      { id: 5, title: 'Rencontre équipe', completed: false },
    ],
    mentor: 'Jean Martin',
    avatar: 'IG',
    color: 'bg-purple-500'
  },
  {
    id: 3,
    employee: 'François Leblanc',
    role: 'Chef de Projet',
    department: 'Management',
    startDate: '2026-01-08',
    status: 'completed',
    progress: 100,
    tasks: [
      { id: 1, title: 'Signature du contrat', completed: true },
      { id: 2, title: 'Configuration email', completed: true },
      { id: 3, title: 'Accès aux outils', completed: true },
      { id: 4, title: 'Formation sécurité', completed: true },
      { id: 5, title: 'Rencontre équipe', completed: true },
    ],
    mentor: 'Sophie Laurent',
    avatar: 'FL',
    color: 'bg-green-500'
  },
  {
    id: 4,
    employee: 'Camille Roy',
    role: 'Analyste de Données',
    department: 'Data',
    startDate: '2026-02-15',
    status: 'pending',
    progress: 0,
    tasks: [
      { id: 1, title: 'Signature du contrat', completed: false },
      { id: 2, title: 'Configuration email', completed: false },
      { id: 3, title: 'Accès aux outils', completed: false },
      { id: 4, title: 'Formation sécurité', completed: false },
      { id: 5, title: 'Rencontre équipe', completed: false },
    ],
    mentor: 'Thomas Moreau',
    avatar: 'CR',
    color: 'bg-orange-500'
  },
  {
    id: 5,
    employee: 'Olivier Côté',
    role: 'Développeur Backend',
    department: 'Technologie',
    startDate: '2026-01-20',
    status: 'in_progress',
    progress: 40,
    tasks: [
      { id: 1, title: 'Signature du contrat', completed: true },
      { id: 2, title: 'Configuration email', completed: true },
      { id: 3, title: 'Accès aux outils', completed: false },
      { id: 4, title: 'Formation sécurité', completed: false },
      { id: 5, title: 'Rencontre équipe', completed: false },
    ],
    mentor: 'Pierre Durand',
    avatar: 'OC',
    color: 'bg-cyan-500'
  },
];

const statusConfig = {
  pending: { 
    label: 'En attente', 
    color: 'bg-gray-500/10 text-gray-600 border-gray-500/30',
    icon: Clock,
    iconColor: 'text-gray-500'
  },
  in_progress: { 
    label: 'En cours', 
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    icon: AlertCircle,
    iconColor: 'text-blue-500'
  },
  completed: { 
    label: 'Terminé', 
    color: 'bg-green-500/10 text-green-600 border-green-500/30',
    icon: CheckCircle2,
    iconColor: 'text-green-500'
  },
};

export default function OnboardingDemoPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Calculate stats
  const totalOnboardings = mockOnboardings.length;
  const pendingOnboardings = mockOnboardings.filter(o => o.status === 'pending').length;
  const inProgressOnboardings = mockOnboardings.filter(o => o.status === 'in_progress').length;
  const completedOnboardings = mockOnboardings.filter(o => o.status === 'completed').length;

  const avgProgress = Math.round(mockOnboardings.reduce((sum, o) => sum + o.progress, 0) / mockOnboardings.length);

  // Filter onboardings
  const filteredOnboardings = mockOnboardings.filter(onboarding => {
    const matchesSearch = searchQuery === '' ||
      onboarding.employee.toLowerCase().includes(searchQuery.toLowerCase()) ||
      onboarding.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      onboarding.department.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || onboarding.status === statusFilter;
    
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
                Onboarding
              </h1>
              <p className="text-white/80 text-lg">
                Gérez l'intégration de vos nouveaux employés
              </p>
            </div>
            <Button className="hover-nukleo bg-white text-[#523DC9] hover:bg-white/90">
              <Plus className="w-5 h-5 mr-2" />
              Nouvel onboarding
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#523DC9]/10 border border-[#523DC9]/30">
                <UserPlus className="w-6 h-6 text-[#523DC9]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {totalOnboardings}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-gray-500/10 border border-gray-500/30">
                <Clock className="w-6 h-6 text-gray-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {pendingOnboardings}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">En Attente</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/30">
                <AlertCircle className="w-6 h-6 text-[#3B82F6]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {inProgressOnboardings}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">En Cours</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30">
                <CheckCircle2 className="w-6 h-6 text-[#10B981]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {completedOnboardings}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Terminés</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30">
                <Award className="w-6 h-6 text-[#F59E0B]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {avgProgress}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Progression Moy.</div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher par nom, rôle ou département..."
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
              <option value="pending">En attente</option>
              <option value="in_progress">En cours</option>
              <option value="completed">Terminé</option>
            </select>
          </div>
        </div>

        {/* Onboarding List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredOnboardings.map((onboarding) => {
            const StatusIcon = statusConfig[onboarding.status as keyof typeof statusConfig].icon;
            const completedTasks = onboarding.tasks.filter(t => t.completed).length;
            const totalTasks = onboarding.tasks.length;
            
            return (
              <Card key={onboarding.id} className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:border-[#523DC9]/40 transition-all duration-200 cursor-pointer group">
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-16 h-16 rounded-full ${onboarding.color} flex items-center justify-center text-white font-bold text-xl flex-shrink-0`}>
                    {onboarding.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-[#523DC9] transition-colors">
                          {onboarding.employee}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{onboarding.role}</p>
                      </div>
                      <Badge className={`${statusConfig[onboarding.status as keyof typeof statusConfig].color} border`}>
                        {statusConfig[onboarding.status as keyof typeof statusConfig].label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Début: {new Date(onboarding.startDate).toLocaleDateString('fr-CA')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>Mentor: {onboarding.mentor}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Progression</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {completedTasks}/{totalTasks} tâches • {onboarding.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${onboarding.color}`}
                      style={{ width: `${onboarding.progress}%` }}
                    />
                  </div>
                </div>

                {/* Tasks Checklist */}
                <div className="space-y-2">
                  {onboarding.tasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        task.completed 
                          ? 'bg-green-500 border-green-500' 
                          : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {task.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                      <span className={`text-sm ${
                        task.completed 
                          ? 'text-gray-500 dark:text-gray-400 line-through' 
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {task.title}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Action Button */}
                {onboarding.status === 'in_progress' && (
                  <Button className="w-full mt-4 hover-nukleo" variant="outline">
                    Continuer l'onboarding
                  </Button>
                )}
                {onboarding.status === 'pending' && (
                  <Button className="w-full mt-4 hover-nukleo">
                    Démarrer l'onboarding
                  </Button>
                )}
              </Card>
            );
          })}
        </div>

        {/* Resources Section */}
        <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Ressources d'onboarding</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-[#523DC9]/30 transition-all cursor-pointer">
              <div className="p-3 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/30">
                <FileText className="w-6 h-6 text-[#3B82F6]" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Documents</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Contrats et formulaires</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-[#10B981]/30 transition-all cursor-pointer">
              <div className="p-3 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30">
                <BookOpen className="w-6 h-6 text-[#10B981]" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Formations</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Modules de formation</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-[#F59E0B]/30 transition-all cursor-pointer">
              <div className="p-3 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30">
                <Laptop className="w-6 h-6 text-[#F59E0B]" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Outils</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Accès et configurations</p>
              </div>
            </div>
          </div>
        </Card>
      </MotionDiv>
    </PageContainer>
  );
}
