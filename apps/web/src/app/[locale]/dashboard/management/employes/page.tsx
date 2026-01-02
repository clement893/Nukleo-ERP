'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  Plane,
  Edit,
  Upload,
  Download,
  FileText,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Briefcase,
  Building2,
  Link as LinkIcon,
} from 'lucide-react';
import { Badge, Button, Card, Input, Loading, Modal, Select } from '@/components/ui';
import { 
  useInfiniteEmployees, 
  useDeleteEmployee, 
  useCreateEmployee, 
  useUpdateEmployee 
} from '@/lib/query/employees';
import { useToast } from '@/components/ui';
import { employeesAPI, type Employee } from '@/lib/api/employees';
import { handleApiError } from '@/lib/errors/api';
import EmployeeForm from '@/components/employes/EmployeeForm';

type ViewMode = 'grid' | 'list' | 'table';

const statusConfig = {
  active: { label: 'Actif', color: 'bg-green-500/10 text-green-600 border-green-500/30' },
  inactive: { label: 'Inactif', color: 'bg-gray-500/10 text-gray-600 border-gray-500/30' },
  on_leave: { label: 'En congé', color: 'bg-orange-500/10 text-orange-600 border-orange-500/30' },
  terminated: { label: 'Terminé', color: 'bg-red-500/10 text-red-600 border-red-500/30' },
};

const employeeTypeConfig = {
  full_time: { label: 'Temps plein', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  part_time: { label: 'Temps partiel', color: 'bg-purple-500/10 text-purple-600 border-purple-500/30' },
  contractor: { label: 'Contractuel', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30' },
  intern: { label: 'Stagiaire', color: 'bg-pink-500/10 text-pink-600 border-pink-500/30' },
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

type SortColumn = 'name' | 'email' | 'department' | 'job_title' | 'hire_date' | 'salary' | 'status';
type SortDirection = 'asc' | 'desc';

export default function EmployeesPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string || 'fr';
  const { showToast } = useToast();
  
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortColumn, setSortColumn] = useState<SortColumn>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  // Fetch data
  const { data, isLoading, refetch } = useInfiniteEmployees(1000);
  const deleteEmployeeMutation = useDeleteEmployee();
  const createEmployeeMutation = useCreateEmployee();
  const updateEmployeeMutation = useUpdateEmployee();

  // Flatten data
  const employees = useMemo(() => data?.pages.flat() || [], [data]);

  // Get unique departments
  const departments = useMemo(() => {
    const depts = new Set<string>();
    employees.forEach((emp: Employee) => {
      if (emp.department) depts.add(emp.department);
    });
    return Array.from(depts).sort();
  }, [employees]);

  // Filter and sort employees
  const filteredEmployees = useMemo(() => {
    let filtered = employees.filter((employee: Employee) => {
      const matchesSearch = !searchQuery || 
        `${employee.first_name} ${employee.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (employee.email && employee.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (employee.job_title && employee.job_title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (employee.department && employee.department.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || 
        (employee.status || 'active') === statusFilter;
      
      const matchesDepartment = departmentFilter === 'all' || 
        employee.department === departmentFilter;
      
      const matchesType = typeFilter === 'all' || 
        (employee.employee_type || 'full_time') === typeFilter;
      
      return matchesSearch && matchesStatus && matchesDepartment && matchesType;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortColumn) {
        case 'name':
          aValue = `${a.first_name} ${a.last_name}`.toLowerCase();
          bValue = `${b.first_name} ${b.last_name}`.toLowerCase();
          break;
        case 'email':
          aValue = (a.email || '').toLowerCase();
          bValue = (b.email || '').toLowerCase();
          break;
        case 'department':
          aValue = (a.department || '').toLowerCase();
          bValue = (b.department || '').toLowerCase();
          break;
        case 'job_title':
          aValue = (a.job_title || '').toLowerCase();
          bValue = (b.job_title || '').toLowerCase();
          break;
        case 'hire_date':
          aValue = a.hire_date ? new Date(a.hire_date).getTime() : 0;
          bValue = b.hire_date ? new Date(b.hire_date).getTime() : 0;
          break;
        case 'salary':
          aValue = a.salary || 0;
          bValue = b.salary || 0;
          break;
        case 'status':
          aValue = (a.status || 'active').toLowerCase();
          bValue = (b.status || 'active').toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [employees, searchQuery, statusFilter, departmentFilter, typeFilter, sortColumn, sortDirection]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = employees.length;
    const active = employees.filter((e: Employee) => (e.status || 'active') === 'active').length;
    const onLeave = employees.filter((e: Employee) => e.status === 'on_leave').length;
    
    const salaries = employees
      .map((e: Employee) => e.salary)
      .filter((s): s is number => s !== null && s !== undefined && s > 0);
    const avgSalary = salaries.length > 0 
      ? salaries.reduce((sum, s) => sum + s, 0) / salaries.length 
      : 0;
    
    return { total, active, onLeave, avgSalary };
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
      const appError = handleApiError(error);
      showToast({ message: appError.message || 'Erreur lors de la suppression', type: 'error' });
    }
  };

  const handleView = (id: number) => {
    router.push(`/${locale}/dashboard/management/employes/${id}`);
  };

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowEditModal(true);
  };

  const handleCreate = async (data: any) => {
    try {
      await createEmployeeMutation.mutateAsync(data);
      showToast({ message: 'Employé créé avec succès', type: 'success' });
      setShowCreateModal(false);
      refetch();
    } catch (error) {
      const appError = handleApiError(error);
      showToast({ message: appError.message || 'Erreur lors de la création', type: 'error' });
      throw error;
    }
  };

  const handleUpdate = async (data: any) => {
    if (!selectedEmployee) return;
    try {
      await updateEmployeeMutation.mutateAsync({ id: selectedEmployee.id, data });
      showToast({ message: 'Employé modifié avec succès', type: 'success' });
      setShowEditModal(false);
      setSelectedEmployee(null);
      refetch();
    } catch (error) {
      const appError = handleApiError(error);
      showToast({ message: appError.message || 'Erreur lors de la modification', type: 'error' });
      throw error;
    }
  };

  const handleExport = async () => {
    try {
      const blob = await employeesAPI.export();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `employes_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast({ message: 'Export réussi', type: 'success' });
    } catch (error) {
      const appError = handleApiError(error);
      showToast({ message: appError.message || 'Erreur lors de l\'export', type: 'error' });
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      showToast({ message: 'Veuillez sélectionner un fichier', type: 'error' });
      return;
    }

    try {
      setImporting(true);
      const result = await employeesAPI.import(importFile);
      
      if (result.errors && result.errors.length > 0) {
        showToast({
          message: `Import terminé avec ${result.errors.length} erreur(s)`,
          type: 'warning',
        });
      } else {
        showToast({
          message: `${result.valid_rows} employé(s) importé(s) avec succès`,
          type: 'success',
        });
      }
      
      setShowImportModal(false);
      setImportFile(null);
      refetch();
    } catch (error) {
      const appError = handleApiError(error);
      showToast({ message: appError.message || 'Erreur lors de l\'import', type: 'error' });
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await employeesAPI.downloadTemplate();
      showToast({ message: 'Modèle téléchargé', type: 'success' });
    } catch (error) {
      const appError = handleApiError(error);
      showToast({ message: appError.message || 'Erreur lors du téléchargement', type: 'error' });
    }
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) return <ArrowUpDown className="w-4 h-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  const hasActiveFilters = statusFilter !== 'all' || departmentFilter !== 'all' || typeFilter !== 'all' || searchQuery;

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
          
          <div className="relative flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-5xl font-black text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Employés
              </h1>
              <p className="text-white/80 text-lg">Gérez votre équipe et leurs informations</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                onClick={() => setShowImportModal(true)}
              >
                <Upload className="w-4 h-4 mr-2" />
                Importer
              </Button>
              <Button 
                variant="outline"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                onClick={handleExport}
              >
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </Button>
              <Button 
                className="bg-white text-[#523DC9] hover:bg-white/90"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouvel employé
              </Button>
            </div>
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
              {stats.onLeave}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">En Congé</div>
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
          <div className="flex flex-col gap-4">
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
                  variant={statusFilter === 'on_leave' ? 'primary' : 'outline'}
                  onClick={() => setStatusFilter('on_leave')}
                  size="sm"
                >
                  En congé
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
                <Select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'Tous les départements' },
                    ...departments.map(dept => ({ value: dept, label: dept }))
                  ]}
                  className="min-w-[200px]"
                />
              )}

              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'Tous les types' },
                  { value: 'full_time', label: 'Temps plein' },
                  { value: 'part_time', label: 'Temps partiel' },
                  { value: 'contractor', label: 'Contractuel' },
                  { value: 'intern', label: 'Stagiaire' },
                ]}
                className="min-w-[150px]"
              />

              <div className="flex gap-2 border-l pl-4">
                <Button
                  variant={viewMode === 'grid' ? 'primary' : 'outline'}
                  onClick={() => setViewMode('grid')}
                  size="sm"
                  title="Vue grille"
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'primary' : 'outline'}
                  onClick={() => setViewMode('list')}
                  size="sm"
                  title="Vue liste"
                >
                  <ListIcon className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'primary' : 'outline'}
                  onClick={() => setViewMode('table')}
                  size="sm"
                  title="Vue tableau"
                >
                  <FileText className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="flex items-center gap-2 pt-2 border-t">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Filtres actifs</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStatusFilter('all');
                    setDepartmentFilter('all');
                    setTypeFilter('all');
                    setSearchQuery('');
                  }}
                  className="ml-auto"
                >
                  <X className="w-4 h-4 mr-1" />
                  Réinitialiser
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Employees Grid/List/Table */}
        {filteredEmployees.length === 0 ? (
          <Card className="glass-card p-12 rounded-xl border border-[#A7A2CF]/20 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Aucun employé trouvé
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {hasActiveFilters
                ? 'Essayez de modifier vos filtres' 
                : 'Créez votre premier employé'}
            </p>
            {hasActiveFilters ? (
              <Button onClick={() => {
                setStatusFilter('all');
                setDepartmentFilter('all');
                setTypeFilter('all');
                setSearchQuery('');
              }}>
                Réinitialiser les filtres
              </Button>
            ) : (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nouvel employé
              </Button>
            )}
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredEmployees.map((employee: Employee) => {
              const initials = `${employee.first_name?.[0] || ''}${employee.last_name?.[0] || ''}`.toUpperCase();
              const fullName = `${employee.first_name || ''} ${employee.last_name || ''}`.trim();
              const avatarColor = getAvatarColor(fullName);
              const status = (employee.status || 'active') as keyof typeof statusConfig;
              const statusInfo = statusConfig[status] || statusConfig.active;
              const employeeType = (employee.employee_type || 'full_time') as keyof typeof employeeTypeConfig;
              const typeInfo = employeeTypeConfig[employeeType] || employeeTypeConfig.full_time;
              
              return (
                <Card 
                  key={employee.id}
                  className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:scale-101 hover:border-[#523DC9]/40 transition-all duration-200 group"
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
                    {employee.job_title && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        {employee.job_title}
                      </p>
                    )}
                    {employee.department && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mb-2">
                        {employee.department}
                      </p>
                    )}
                    <div className="flex gap-2 flex-wrap justify-center">
                      <Badge className={`${statusInfo.color} border`}>
                        {statusInfo.label}
                      </Badge>
                      {employee.employee_type && (
                        <Badge className={`${typeInfo.color} border`}>
                          {typeInfo.label}
                        </Badge>
                      )}
                    </div>
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
                    {employee.salary && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <DollarSign className="w-4 h-4 flex-shrink-0" />
                        <span>{formatCurrency(employee.salary)}</span>
                      </div>
                    )}
                    {employee.linkedin && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <LinkIcon className="w-4 h-4 flex-shrink-0" />
                        <a href={employee.linkedin} target="_blank" rel="noopener noreferrer" className="truncate text-blue-600 hover:underline">
                          LinkedIn
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="outline" onClick={() => handleView(employee.id)} className="flex-1" title="Voir">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleEdit(employee)} className="flex-1" title="Éditer">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => {
                        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
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
        ) : viewMode === 'list' ? (
          <Card className="glass-card rounded-xl border border-[#A7A2CF]/20 overflow-hidden">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredEmployees.map((employee: Employee) => {
                const initials = `${employee.first_name?.[0] || ''}${employee.last_name?.[0] || ''}`.toUpperCase();
                const fullName = `${employee.first_name || ''} ${employee.last_name || ''}`.trim();
                const avatarColor = getAvatarColor(fullName);
                const status = (employee.status || 'active') as keyof typeof statusConfig;
                const statusInfo = statusConfig[status] || statusConfig.active;
                
                return (
                  <div 
                    key={employee.id}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1 min-w-0" onClick={() => handleView(employee.id)}>
                        {employee.photo_url ? (
                          <img
                            src={employee.photo_url}
                            alt={fullName}
                            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) fallback.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`w-12 h-12 rounded-full ${avatarColor} flex items-center justify-center text-white font-semibold flex-shrink-0 ${employee.photo_url ? 'hidden' : ''}`}>
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1 flex-wrap">
                            <h3 className="font-semibold text-gray-900 dark:text-white">{fullName}</h3>
                            <Badge className={`${statusInfo.color} border`}>
                              {statusInfo.label}
                            </Badge>
                            {employee.employee_type && (
                              <Badge className={`${employeeTypeConfig[employee.employee_type as keyof typeof employeeTypeConfig]?.color || employeeTypeConfig.full_time.color} border`}>
                                {employeeTypeConfig[employee.employee_type as keyof typeof employeeTypeConfig]?.label || employee.employee_type}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 flex-wrap">
                            {employee.job_title && (
                              <div className="flex items-center gap-2">
                                <Briefcase className="w-4 h-4" />
                                <span>{employee.job_title}</span>
                              </div>
                            )}
                            {employee.department && (
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4" />
                                <span>{employee.department}</span>
                              </div>
                            )}
                            {employee.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                <span className="truncate">{employee.email}</span>
                              </div>
                            )}
                            {employee.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                <span>{employee.phone}</span>
                              </div>
                            )}
                            {employee.hire_date && (
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>{new Date(employee.hire_date).toLocaleDateString('fr-CA')}</span>
                              </div>
                            )}
                            {employee.salary && (
                              <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4" />
                                <span>{formatCurrency(employee.salary)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant="outline" onClick={() => handleView(employee.id)} title="Voir">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(employee)} title="Éditer">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => {
                            const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
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
        ) : (
          <Card className="glass-card rounded-xl border border-[#A7A2CF]/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('name')}
                        className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        Nom <SortIcon column="name" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('job_title')}
                        className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        Poste <SortIcon column="job_title" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('department')}
                        className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        Département <SortIcon column="department" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('email')}
                        className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        Email <SortIcon column="email" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('hire_date')}
                        className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        Date d'embauche <SortIcon column="hire_date" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('salary')}
                        className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        Salaire <SortIcon column="salary" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('status')}
                        className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        Statut <SortIcon column="status" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredEmployees.map((employee: Employee) => {
                    const fullName = `${employee.first_name || ''} ${employee.last_name || ''}`.trim();
                    const status = (employee.status || 'active') as keyof typeof statusConfig;
                    const statusInfo = statusConfig[status] || statusConfig.active;
                    
                    return (
                      <tr key={employee.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-semibold">
                              {`${employee.first_name?.[0] || ''}${employee.last_name?.[0] || ''}`.toUpperCase()}
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white">{fullName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {employee.job_title || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {employee.department || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {employee.email || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {employee.hire_date ? new Date(employee.hire_date).toLocaleDateString('fr-CA') : '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {employee.salary ? formatCurrency(employee.salary) : '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge className={`${statusInfo.color} border`}>
                            {statusInfo.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" variant="ghost" onClick={() => handleView(employee.id)} title="Voir">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleEdit(employee)} title="Éditer">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDelete(employee.id)} title="Supprimer">
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </MotionDiv>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nouvel employé"
        size="lg"
      >
        <EmployeeForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreateModal(false)}
          loading={createEmployeeMutation.isPending}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedEmployee(null);
        }}
        title="Modifier l'employé"
        size="lg"
      >
        {selectedEmployee && (
          <EmployeeForm
            employee={selectedEmployee}
            onSubmit={handleUpdate}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedEmployee(null);
            }}
            loading={updateEmployeeMutation.isPending}
          />
        )}
      </Modal>

      {/* Import Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => {
          setShowImportModal(false);
          setImportFile(null);
        }}
        title="Importer des employés"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Téléchargez un fichier Excel avec les données des employés. Vous pouvez télécharger un modèle pour voir le format attendu.
            </p>
            <div className="flex gap-2 mb-4">
              <Button
                variant="outline"
                onClick={handleDownloadTemplate}
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Télécharger le modèle
              </Button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fichier Excel ou ZIP
            </label>
            <input
              type="file"
              accept=".xlsx,.xls,.zip"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500 dark:text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-[#523DC9] file:text-white
                hover:file:bg-[#523DC9]/90
                file:cursor-pointer"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setShowImportModal(false);
                setImportFile(null);
              }}
              disabled={importing}
            >
              Annuler
            </Button>
            <Button
              onClick={handleImport}
              disabled={!importFile || importing}
            >
              {importing ? 'Import en cours...' : 'Importer'}
            </Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
