'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { 
  Users, 
  UserCheck,
  Plus,
  Search,
  LayoutGrid,
  List as ListIcon,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Eye,
  Trash2,
  Plane
} from 'lucide-react';
import { Badge, Button, Card, Input, Loading } from '@/components/ui';
import { useInfiniteEmployees, useDeleteEmployee } from '@/lib/query/employees';
import { useToast } from '@/components/ui';
import type { Employee } from '@/lib/api/employees';

type ViewMode = 'grid' | 'list';

const statusConfig = {
  active: { label: 'Actif', color: 'bg-green-500/10 text-green-600 border-green-500/30' },
  vacation: { label: 'En vacances', color: 'bg-orange-500/10 text-orange-600 border-orange-500/30' },
  inactive: { label: 'Inactif', color: 'bg-gray-500/10 text-gray-600 border-gray-500/30' },
};

// Generate avatar color based on name
const getAvatarColor = (name: string) => {
  const colors = [
    'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500',
    'bg-pink-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-red-500'
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index] || 'bg-gray-500';
};

export default function EmployeesPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  // Fetch data
  const { data, isLoading } = useInfiniteEmployees(1000);
  const deleteEmployeeMutation = useDeleteEmployee();

  // Flatten data
  const employees = useMemo(() => data?.pages.flat() || [], [data]);

  // Get unique departments - not available in Employee interface, using empty array
  const departments: string[] = [];

  // Filter employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((employee: Employee) => {
      const matchesSearch = !searchQuery || 
        `${employee.first_name} ${employee.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (employee.email && employee.email.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // status and department are not available in Employee interface
      const matchesStatus = statusFilter === 'all';
      const matchesDepartment = departmentFilter === 'all';
      
      return matchesSearch && matchesStatus && matchesDepartment;
    });
  }, [employees, searchQuery, statusFilter, departmentFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = employees.length;
    // status and salary are not available in Employee interface
    const active = total; // All employees are considered active
    const onVacation = 0;
    const avgSalary = 0;
    
    return { total, active, onVacation, avgSalary };
  }, [employees]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet employé ?')) return;
    
    try {
      await deleteEmployeeMutation.mutateAsync(id);
      showToast({ message: 'Employé supprimé avec succès', type: 'success' });
    } catch (error) {
      showToast({ message: 'Erreur lors de la suppression', type: 'error' });
    }
  };

  const handleView = (id: number) => {
    router.push(`/dashboard/management/employes/${id}`);
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-96">
          <Loading />
        </div>
      </PageContainer>
    );
  }

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
              <p className="text-white/80 text-lg">Gérez votre équipe et leurs informations</p>
            </div>
            <Button 
              className="bg-white text-[#523DC9] hover:bg-white/90"
              onClick={() => router.push('/dashboard/management/employes/new')}
            >
              <Plus className="w-4 h-4 mr-2" />
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
              {stats.total}
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
              {stats.active}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Actifs</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30">
                <Plane className="w-6 h-6 text-[#F59E0B]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.onVacation}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">En Vacances</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/30">
                <DollarSign className="w-6 h-6 text-[#3B82F6]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {formatCurrency(stats.avgSalary)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Salaire Moyen</div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Rechercher un employé..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Button 
                variant={statusFilter === 'all' ? 'primary' : 'outline'}
                onClick={() => setStatusFilter('all')}
                size="sm"
              >
                Tous
              </Button>
              <Button 
                variant={statusFilter === 'active' ? 'primary' : 'outline'}
                onClick={() => setStatusFilter('active')}
                size="sm"
              >
                Actifs
              </Button>
              <Button 
                variant={statusFilter === 'vacation' ? 'primary' : 'outline'}
                onClick={() => setStatusFilter('vacation')}
                size="sm"
              >
                En vacances
              </Button>
              <Button 
                variant={statusFilter === 'inactive' ? 'primary' : 'outline'}
                onClick={() => setStatusFilter('inactive')}
                size="sm"
              >
                Inactifs
              </Button>
            </div>

            {departments.length > 0 && (
              <div className="flex gap-2 border-l pl-4">
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                >
                  <option value="all">Tous les départements</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex gap-2 border-l pl-4">
              <Button
                variant={viewMode === 'grid' ? 'primary' : 'outline'}
                onClick={() => setViewMode('grid')}
                size="sm"
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'primary' : 'outline'}
                onClick={() => setViewMode('list')}
                size="sm"
              >
                <ListIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Employees Grid/List */}
        {filteredEmployees.length === 0 ? (
          <Card className="glass-card p-12 rounded-xl border border-[#A7A2CF]/20 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Aucun employé trouvé
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchQuery || statusFilter !== 'all' || departmentFilter !== 'all'
                ? 'Essayez de modifier vos filtres' 
                : 'Créez votre premier employé'}
            </p>
            <Button onClick={() => router.push('/dashboard/management/employes/new')}>
              <Plus className="w-4 h-4 mr-2" />
              Nouvel employé
            </Button>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredEmployees.map((employee: Employee) => {
              const initials = `${employee.first_name?.[0] || ''}${employee.last_name?.[0] || ''}`.toUpperCase();
              const fullName = `${employee.first_name || ''} ${employee.last_name || ''}`.trim();
              const avatarColor = getAvatarColor(fullName);
              // status is not available in Employee interface, using 'active' as default
              const status = 'active';
              const statusInfo = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
              
              return (
                <Card 
                  key={employee.id}
                  className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:scale-101 hover:border-[#523DC9]/40 transition-all duration-200"
                >
                  <div className="flex flex-col items-center text-center mb-4">
                    {employee.photo_url ? (
                      <img
                        src={employee.photo_url}
                        alt={fullName}
                        className="w-16 h-16 rounded-full object-cover mb-3"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-16 h-16 rounded-full ${avatarColor} flex items-center justify-center text-white font-bold text-xl mb-3 ${employee.photo_url ? 'hidden' : ''}`}>
                      {initials}
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {fullName}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Employé
                    </p>
                    <Badge className={`${statusInfo.color} border`}>
                      {statusInfo.label}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-4">
                    {employee.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Mail className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{employee.email}</span>
                      </div>
                    )}
                    {employee.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        <span>{employee.phone}</span>
                      </div>
                    )}
                    {employee.hire_date && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span>{new Date(employee.hire_date).toLocaleDateString('fr-CA')}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button size="sm" variant="outline" onClick={() => handleView(employee.id)} className="flex-1" title="Voir">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => {
                        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
                        const locale = window.location.pathname.split('/')[1] || 'fr';
                        const portalUrl = employee.user_id 
                          ? `${baseUrl}/${locale}/erp/dashboard?user_id=${employee.user_id}`
                          : `${baseUrl}/${locale}/erp/dashboard?employee_id=${employee.id}`;
                        window.open(portalUrl, '_blank');
                      }} 
                      className="flex-1"
                      title="Portail"
                    >
                      <UserCheck className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(employee.id)} title="Supprimer">
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="glass-card rounded-xl border border-[#A7A2CF]/20 overflow-hidden">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredEmployees.map((employee: Employee) => {
                const initials = `${employee.first_name?.[0] || ''}${employee.last_name?.[0] || ''}`.toUpperCase();
                const fullName = `${employee.first_name || ''} ${employee.last_name || ''}`.trim();
                const avatarColor = getAvatarColor(fullName);
                // status is not available in Employee interface, using 'active' as default
                const status = 'active';
                const statusInfo = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
                
                return (
                  <div 
                    key={employee.id}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                    onClick={() => handleView(employee.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        {employee.photo_url ? (
                          <img
                            src={employee.photo_url}
                            alt={fullName}
                            className="w-12 h-12 rounded-full object-cover"
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) fallback.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`w-12 h-12 rounded-full ${avatarColor} flex items-center justify-center text-white font-semibold ${employee.photo_url ? 'hidden' : ''}`}>
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white">{fullName}</h3>
                            <Badge className={`${statusInfo.color} border`}>
                              {statusInfo.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            {employee.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                <span className="truncate">{employee.email}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant="outline" onClick={() => handleView(employee.id)} title="Voir">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => {
                            const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
                            const locale = window.location.pathname.split('/')[1] || 'fr';
                            const portalUrl = employee.user_id 
                              ? `${baseUrl}/${locale}/erp/dashboard?user_id=${employee.user_id}`
                              : `${baseUrl}/${locale}/erp/dashboard?employee_id=${employee.id}`;
                            window.open(portalUrl, '_blank');
                          }}
                          title="Portail"
                        >
                          <UserCheck className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(employee.id)} title="Supprimer">
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </MotionDiv>
    </PageContainer>
  );
}
