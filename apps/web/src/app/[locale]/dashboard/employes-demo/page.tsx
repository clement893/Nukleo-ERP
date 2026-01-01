'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState } from 'react';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { 
  Users, 
  UserCheck,
  UserX,
  TrendingUp,
  Plus,
  Search,
  LayoutGrid,
  List as ListIcon,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  DollarSign,
  Award
} from 'lucide-react';
import { Badge, Button, Card, Input } from '@/components/ui';
import Link from 'next/link';

type ViewMode = 'grid' | 'list';

// Mock data pour la démo
const mockEmployees = [
  {
    id: 1,
    firstName: 'Marie',
    lastName: 'Dubois',
    email: 'marie.dubois@nukleo.com',
    phone: '514-555-0101',
    role: 'Développeuse Senior',
    department: 'Technologie',
    status: 'active',
    hireDate: '2022-03-15',
    salary: 95000,
    location: 'Montréal, QC',
    avatar: 'MD',
    color: 'bg-blue-500'
  },
  {
    id: 2,
    firstName: 'Jean',
    lastName: 'Martin',
    email: 'jean.martin@nukleo.com',
    phone: '514-555-0102',
    role: 'Designer UI/UX',
    department: 'Design',
    status: 'active',
    hireDate: '2021-09-01',
    salary: 82000,
    location: 'Montréal, QC',
    avatar: 'JM',
    color: 'bg-purple-500'
  },
  {
    id: 3,
    firstName: 'Sophie',
    lastName: 'Laurent',
    email: 'sophie.laurent@nukleo.com',
    phone: '514-555-0103',
    role: 'Chef de Projet',
    department: 'Management',
    status: 'active',
    hireDate: '2020-06-10',
    salary: 105000,
    location: 'Montréal, QC',
    avatar: 'SL',
    color: 'bg-green-500'
  },
  {
    id: 4,
    firstName: 'Pierre',
    lastName: 'Durand',
    email: 'pierre.durand@nukleo.com',
    phone: '514-555-0104',
    role: 'Développeur Backend',
    department: 'Technologie',
    status: 'vacation',
    hireDate: '2023-01-20',
    salary: 78000,
    location: 'Québec, QC',
    avatar: 'PD',
    color: 'bg-orange-500'
  },
  {
    id: 5,
    firstName: 'Claire',
    lastName: 'Petit',
    email: 'claire.petit@nukleo.com',
    phone: '514-555-0105',
    role: 'Product Manager',
    department: 'Produit',
    status: 'active',
    hireDate: '2021-11-15',
    salary: 98000,
    location: 'Montréal, QC',
    avatar: 'CP',
    color: 'bg-pink-500'
  },
  {
    id: 6,
    firstName: 'Luc',
    lastName: 'Bernard',
    email: 'luc.bernard@nukleo.com',
    phone: '514-555-0106',
    role: 'Développeur Frontend',
    department: 'Technologie',
    status: 'active',
    hireDate: '2022-08-01',
    salary: 85000,
    location: 'Laval, QC',
    avatar: 'LB',
    color: 'bg-cyan-500'
  },
  {
    id: 7,
    firstName: 'Emma',
    lastName: 'Rousseau',
    email: 'emma.rousseau@nukleo.com',
    phone: '514-555-0107',
    role: 'Designer Graphique',
    department: 'Design',
    status: 'inactive',
    hireDate: '2019-04-12',
    salary: 72000,
    location: 'Montréal, QC',
    avatar: 'ER',
    color: 'bg-gray-500'
  },
  {
    id: 8,
    firstName: 'Thomas',
    lastName: 'Moreau',
    email: 'thomas.moreau@nukleo.com',
    phone: '514-555-0108',
    role: 'DevOps Engineer',
    department: 'Technologie',
    status: 'active',
    hireDate: '2021-02-28',
    salary: 92000,
    location: 'Montréal, QC',
    avatar: 'TM',
    color: 'bg-indigo-500'
  },
];

const statusConfig = {
  active: { label: 'Actif', color: 'bg-green-500/10 text-green-600 border-green-500/30' },
  vacation: { label: 'En vacances', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  inactive: { label: 'Inactif', color: 'bg-gray-500/10 text-gray-600 border-gray-500/30' },
};

export default function EmployeesDemoPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  // Calculate stats
  const totalEmployees = mockEmployees.length;
  const activeEmployees = mockEmployees.filter(e => e.status === 'active').length;
  const onVacation = mockEmployees.filter(e => e.status === 'vacation').length;
  const inactiveEmployees = mockEmployees.filter(e => e.status === 'inactive').length;

  const avgSalary = Math.round(mockEmployees.reduce((sum, e) => sum + e.salary, 0) / mockEmployees.length);

  // Get unique departments
  const departments = Array.from(new Set(mockEmployees.map(e => e.department))).sort();

  // Filter employees
  const filteredEmployees = mockEmployees.filter(employee => {
    const matchesSearch = searchQuery === '' ||
      employee.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.department.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || employee.status === statusFilter;
    const matchesDepartment = departmentFilter === 'all' || employee.department === departmentFilter;
    
    return matchesSearch && matchesStatus && matchesDepartment;
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
                Employés
              </h1>
              <p className="text-white/80 text-lg">
                Gérez votre équipe et suivez les informations de vos employés
              </p>
            </div>
            <Button className="hover-nukleo bg-white text-[#523DC9] hover:bg-white/90">
              <Plus className="w-5 h-5 mr-2" />
              Nouvel employé
            </Button>
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
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Employés</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30">
                <UserCheck className="w-6 h-6 text-[#10B981]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {activeEmployees}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Actifs</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/30">
                <TrendingUp className="w-6 h-6 text-[#3B82F6]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {onVacation}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">En Vacances</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30">
                <DollarSign className="w-6 h-6 text-[#F59E0B]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(avgSalary)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Salaire Moyen</div>
          </Card>
        </div>

        {/* Filters and View Toggle */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher un employé..."
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
              <option value="active">Actif</option>
              <option value="vacation">En vacances</option>
              <option value="inactive">Inactif</option>
            </select>

            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">Tous les départements</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              onClick={() => setViewMode('grid')}
              className="hover-nukleo"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              onClick={() => setViewMode('list')}
              className="hover-nukleo"
            >
              <ListIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Employees Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredEmployees.map((employee) => (
              <Link key={employee.id} href={`/dashboard/management/employes/${employee.id}`}>
                <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:scale-105 hover:border-[#523DC9]/40 transition-all duration-200 cursor-pointer group h-full">
                  <div className="flex flex-col items-center text-center mb-4">
                    <div className={`w-20 h-20 rounded-full ${employee.color} flex items-center justify-center text-white font-bold text-2xl mb-3`}>
                      {employee.avatar}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-[#523DC9] transition-colors">
                      {employee.firstName} {employee.lastName}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{employee.role}</p>
                    <Badge className={`${statusConfig[employee.status as keyof typeof statusConfig].color} border`}>
                      {statusConfig[employee.status as keyof typeof statusConfig].label}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{employee.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      <span>{employee.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Briefcase className="w-4 h-4 flex-shrink-0" />
                      <span>{employee.department}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span>{employee.location}</span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEmployees.map((employee) => (
              <Link key={employee.id} href={`/dashboard/management/employes/${employee.id}`}>
                <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:border-[#523DC9]/40 transition-all duration-200 cursor-pointer group">
                  <div className="flex items-center gap-6">
                    <div className={`w-16 h-16 rounded-full ${employee.color} flex items-center justify-center text-white font-bold text-xl flex-shrink-0`}>
                      {employee.avatar}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-[#523DC9] transition-colors">
                            {employee.firstName} {employee.lastName}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{employee.role}</p>
                        </div>
                        <Badge className={`${statusConfig[employee.status as keyof typeof statusConfig].color} border`}>
                          {statusConfig[employee.status as keyof typeof statusConfig].label}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Mail className="w-4 h-4" />
                          <span className="truncate">{employee.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Phone className="w-4 h-4" />
                          <span>{employee.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Briefcase className="w-4 h-4" />
                          <span>{employee.department}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Calendar className="w-4 h-4" />
                          <span>Depuis {new Date(employee.hireDate).toLocaleDateString('fr-CA')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </MotionDiv>
    </PageContainer>
  );
}
