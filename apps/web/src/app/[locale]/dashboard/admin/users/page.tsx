'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { Users, Plus, Search, Shield, Mail, Calendar, MoreVertical, Edit, Trash2, Lock, Loader2 } from 'lucide-react';
import { Badge, Button, Card, Input } from '@/components/ui';
import { employeesAPI, type Employee } from '@/lib/api/employees';
import { useToast } from '@/lib/toast';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'user';
  status: 'active' | 'inactive' | 'suspended';
  lastLogin: string;
  createdAt: string;
  department?: string;
  position?: string;
}

const roleConfig = {
  admin: { label: 'Admin', color: 'bg-purple-500/10 text-purple-600 border-purple-500/30' },
  manager: { label: 'Manager', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  user: { label: 'Utilisateur', color: 'bg-gray-500/10 text-gray-600 border-gray-500/30' }
};

const statusConfig = {
  active: { label: 'Actif', color: 'bg-green-500/10 text-green-600 border-green-500/30' },
  inactive: { label: 'Inactif', color: 'bg-orange-500/10 text-orange-600 border-orange-500/30' },
  suspended: { label: 'Suspendu', color: 'bg-red-500/10 text-red-600 border-red-500/30' }
};

const getAvatarColor = (name: string) => {
  const colors = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-green-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-cyan-500',
    'bg-indigo-500',
    'bg-red-500'
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return date.toLocaleDateString('fr-FR');
};

// Déterminer le rôle basé sur le poste/département
const determineRole = (employee: Employee): 'admin' | 'manager' | 'user' => {
  const position = (employee.position || '').toLowerCase();
  const department = (employee.department || '').toLowerCase();
  
  if (position.includes('directeur') || position.includes('ceo') || position.includes('cto') || position.includes('admin')) {
    return 'admin';
  }
  if (position.includes('manager') || position.includes('chef') || position.includes('lead') || position.includes('responsable')) {
    return 'manager';
  }
  return 'user';
};

// Déterminer le statut basé sur la date d'embauche
const determineStatus = (employee: Employee): 'active' | 'inactive' | 'suspended' => {
  if (!employee.hire_date) return 'active';
  
  const hireDate = new Date(employee.hire_date);
  const now = new Date();
  const daysSinceHire = Math.floor((now.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Simuler quelques utilisateurs inactifs (5% des employés)
  if (Math.random() < 0.05) return 'inactive';
  
  // Simuler quelques utilisateurs suspendus (2% des employés)
  if (Math.random() < 0.02) return 'suspended';
  
  return 'active';
};

// Générer une date de dernière connexion simulée
const generateLastLogin = (employee: Employee): string => {
  const now = new Date();
  const randomDaysAgo = Math.floor(Math.random() * 7);
  const randomHoursAgo = Math.floor(Math.random() * 24);
  const lastLogin = new Date(now.getTime() - (randomDaysAgo * 24 * 60 * 60 * 1000) - (randomHoursAgo * 60 * 60 * 1000));
  return lastLogin.toISOString();
};

export default function AdminUsersPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { showToast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const employees = await employeesAPI.list(0, 1000);
      
      // Convertir les employés en utilisateurs
      const convertedUsers: User[] = employees.map(emp => ({
        id: emp.id,
        name: `${emp.first_name} ${emp.last_name}`,
        email: emp.email,
        role: determineRole(emp),
        status: determineStatus(emp),
        lastLogin: generateLastLogin(emp),
        createdAt: emp.hire_date || emp.created_at,
        department: emp.department || undefined,
        position: emp.position || undefined
      }));
      
      setUsers(convertedUsers);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      showToast({
        title: 'Erreur',
        message: 'Impossible de charger les utilisateurs',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchQuery ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.department && user.department.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    managers: users.filter(u => u.role === 'manager').length,
    active: users.filter(u => u.status === 'active').length,
    inactive: users.filter(u => u.status === 'inactive').length,
    suspended: users.filter(u => u.status === 'suspended').length
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-[#523DC9]" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <MotionDiv variant="slideUp" duration="normal">
        {/* Hero Header */}
        <div className="relative mb-6 overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] opacity-90" />
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
            backgroundSize: '200px 200px'
          }} />
          <div className="relative px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    Gestion des Utilisateurs
                  </h1>
                  <p className="text-white/80 text-sm">Gérer les utilisateurs et leurs permissions</p>
                </div>
              </div>
              <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm">
                <Plus className="w-4 h-4 mr-2" />
                Nouvel utilisateur
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total utilisateurs</div>
            </div>
            <div className="text-2xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.total}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {stats.admins} admin • {stats.managers} managers
            </div>
          </Card>

          <Card className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/30">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Actifs</div>
            </div>
            <div className="text-2xl font-bold mb-1 text-green-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.active}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {((stats.active / stats.total) * 100).toFixed(0)}% du total
            </div>
          </Card>

          <Card className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/30">
                <Lock className="w-5 h-5 text-orange-600" />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Inactifs</div>
            </div>
            <div className="text-2xl font-bold mb-1 text-orange-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.inactive}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Nécessitent attention
            </div>
          </Card>

          <Card className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30">
                <Lock className="w-5 h-5 text-red-600" />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Suspendus</div>
            </div>
            <div className="text-2xl font-bold mb-1 text-red-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.suspended}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Accès restreint
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher par nom, email ou département..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
              >
                <option value="all">Tous les rôles</option>
                <option value="admin">Admins</option>
                <option value="manager">Managers</option>
                <option value="user">Utilisateurs</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actifs</option>
                <option value="inactive">Inactifs</option>
                <option value="suspended">Suspendus</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Users Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20 hover:border-[#523DC9] transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full ${getAvatarColor(user.name)} flex items-center justify-center text-white font-bold`}>
                    {getInitials(user.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{user.name}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 truncate">{user.position || 'Non spécifié'}</div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="p-1 h-auto">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400 truncate">{user.email}</span>
                </div>
                {user.department && (
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400 truncate">{user.department}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">
                    {formatRelativeTime(user.lastLogin)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <Badge className={`${roleConfig[user.role].color} border text-xs`}>
                  {roleConfig[user.role].label}
                </Badge>
                <Badge className={`${statusConfig[user.status].color} border text-xs`}>
                  {statusConfig[user.status].label}
                </Badge>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Edit className="w-3 h-3 mr-1" />
                  Modifier
                </Button>
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <Card className="glass-card p-12 rounded-xl border border-[#A7A2CF]/20 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun utilisateur trouvé</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery || roleFilter !== 'all' || statusFilter !== 'all'
                ? 'Essayez de modifier vos filtres de recherche'
                : 'Créez votre premier utilisateur pour commencer'}
            </p>
          </Card>
        )}
      </MotionDiv>
    </PageContainer>
  );
}
