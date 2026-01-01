'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { Users, Plus, Search, Shield, Mail, Calendar, MoreVertical, Edit, Trash2, Lock } from 'lucide-react';
import { Badge, Button, Card, Input } from '@/components/ui';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'user';
  status: 'active' | 'inactive' | 'suspended';
  lastLogin: string;
  createdAt: string;
  avatar?: string;
}

const mockUsers: User[] = [
  {
    id: 1,
    name: 'Marie Dubois',
    email: 'marie.dubois@nukleo.com',
    role: 'admin',
    status: 'active',
    lastLogin: '2026-01-01T10:30:00',
    createdAt: '2025-01-15'
  },
  {
    id: 2,
    name: 'Jean Martin',
    email: 'jean.martin@nukleo.com',
    role: 'manager',
    status: 'active',
    lastLogin: '2026-01-01T09:15:00',
    createdAt: '2025-02-20'
  },
  {
    id: 3,
    name: 'Sophie Laurent',
    email: 'sophie.laurent@nukleo.com',
    role: 'user',
    status: 'active',
    lastLogin: '2025-12-30T16:45:00',
    createdAt: '2025-03-10'
  },
  {
    id: 4,
    name: 'Pierre Durand',
    email: 'pierre.durand@nukleo.com',
    role: 'manager',
    status: 'inactive',
    lastLogin: '2025-12-15T14:20:00',
    createdAt: '2025-04-05'
  },
  {
    id: 5,
    name: 'Claire Petit',
    email: 'claire.petit@nukleo.com',
    role: 'user',
    status: 'active',
    lastLogin: '2026-01-01T11:00:00',
    createdAt: '2025-05-12'
  },
  {
    id: 6,
    name: 'Luc Bernard',
    email: 'luc.bernard@nukleo.com',
    role: 'user',
    status: 'suspended',
    lastLogin: '2025-11-20T08:30:00',
    createdAt: '2025-06-18'
  },
  {
    id: 7,
    name: 'Emma Rousseau',
    email: 'emma.rousseau@nukleo.com',
    role: 'admin',
    status: 'active',
    lastLogin: '2026-01-01T08:00:00',
    createdAt: '2025-07-22'
  },
  {
    id: 8,
    name: 'Thomas Blanc',
    email: 'thomas.blanc@nukleo.com',
    role: 'user',
    status: 'active',
    lastLogin: '2025-12-31T17:30:00',
    createdAt: '2025-08-30'
  }
];

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

export default function AdminUsersDemo() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredUsers = mockUsers.filter(user => {
    const matchesSearch = !searchQuery || 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const stats = {
    total: mockUsers.length,
    active: mockUsers.filter(u => u.status === 'active').length,
    admins: mockUsers.filter(u => u.role === 'admin').length,
    suspended: mockUsers.filter(u => u.status === 'suspended').length
  };

  return (
    <PageContainer>
      <MotionDiv variant="slideUp" duration="medium">
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
                  <p className="text-white/80 text-sm">Gérez les comptes et permissions utilisateurs</p>
                </div>
              </div>
              <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm">
                <Plus className="w-4 h-4 mr-2" />
                Nouvel utilisateur
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {stats.total}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Total Utilisateurs</div>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/30">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {stats.active}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Actifs</div>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {stats.admins}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Administrateurs</div>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30">
                <Lock className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {stats.suspended}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Suspendus</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher par nom ou email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
              >
                <option value="all">Tous les rôles</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="user">Utilisateur</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
                <option value="suspended">Suspendu</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Users Table */}
        <Card className="glass-card rounded-xl border border-[#A7A2CF]/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Dernière connexion
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Date création
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${getAvatarColor(user.name)} flex items-center justify-center text-white font-semibold text-sm`}>
                          {getInitials(user.name)}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={`${roleConfig[user.role].color} border`}>
                        {roleConfig[user.role].label}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={`${statusConfig[user.status].color} border`}>
                        {statusConfig[user.status].label}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {formatRelativeTime(user.lastLogin)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="ghost" className="hover:bg-blue-500/10 hover:text-blue-600">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="hover:bg-red-500/10 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="hover:bg-gray-500/10">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </MotionDiv>
    </PageContainer>
  );
}
