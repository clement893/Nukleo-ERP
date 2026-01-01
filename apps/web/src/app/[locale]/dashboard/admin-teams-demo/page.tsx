'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { Users as UsersIcon, Plus, Search, MoreVertical, Edit, Trash2, UserPlus } from 'lucide-react';
import { Badge, Button, Card, Input } from '@/components/ui';

interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface Team {
  id: number;
  name: string;
  description: string;
  members: TeamMember[];
  createdAt: string;
}

const mockTeams: Team[] = [
  {
    id: 1,
    name: 'Équipe Développement',
    description: 'Équipe responsable du développement logiciel',
    members: [
      { id: 1, name: 'Marie Dubois', email: 'marie@nukleo.com', role: 'Lead Dev' },
      { id: 2, name: 'Jean Martin', email: 'jean@nukleo.com', role: 'Developer' },
      { id: 3, name: 'Sophie Laurent', email: 'sophie@nukleo.com', role: 'Developer' }
    ],
    createdAt: '2025-01-15'
  },
  {
    id: 2,
    name: 'Équipe Design',
    description: 'Équipe UX/UI et design produit',
    members: [
      { id: 4, name: 'Pierre Durand', email: 'pierre@nukleo.com', role: 'Lead Designer' },
      { id: 5, name: 'Claire Petit', email: 'claire@nukleo.com', role: 'UX Designer' }
    ],
    createdAt: '2025-02-10'
  },
  {
    id: 3,
    name: 'Équipe Marketing',
    description: 'Marketing et communication',
    members: [
      { id: 6, name: 'Luc Bernard', email: 'luc@nukleo.com', role: 'Marketing Manager' },
      { id: 7, name: 'Emma Rousseau', email: 'emma@nukleo.com', role: 'Content Writer' },
      { id: 8, name: 'Thomas Blanc', email: 'thomas@nukleo.com', role: 'Social Media' }
    ],
    createdAt: '2025-03-05'
  },
  {
    id: 4,
    name: 'Équipe Support',
    description: 'Support client et assistance technique',
    members: [
      { id: 9, name: 'Alice Moreau', email: 'alice@nukleo.com', role: 'Support Lead' },
      { id: 10, name: 'Marc Leroy', email: 'marc@nukleo.com', role: 'Support Agent' }
    ],
    createdAt: '2025-04-12'
  }
];

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

export default function AdminTeamsDemo() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTeams = mockTeams.filter(team =>
    !searchQuery ||
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalMembers = mockTeams.reduce((sum, team) => sum + team.members.length, 0);

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
                  <UsersIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    Gestion des Équipes
                  </h1>
                  <p className="text-white/80 text-sm">Organisez vos équipes et leurs membres</p>
                </div>
              </div>
              <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm">
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle équipe
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
                <UsersIcon className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {mockTeams.length}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Équipes</div>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <UsersIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {totalMembers}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Membres Total</div>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/30">
                <UsersIcon className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {Math.round(totalMembers / mockTeams.length)}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Moyenne/Équipe</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Search */}
        <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Rechercher une équipe..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        {/* Teams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredTeams.map((team) => (
            <Card key={team.id} className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:border-[#523DC9]/30 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {team.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {team.description}
                  </p>
                  <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30 border text-xs">
                    {team.members.length} membre{team.members.length > 1 ? 's' : ''}
                  </Badge>
                </div>
                <div className="flex gap-2">
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
              </div>

              <div className="space-y-3 mb-4">
                {team.members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <div className={`w-8 h-8 rounded-full ${getAvatarColor(member.name)} flex items-center justify-center text-white font-semibold text-xs`}>
                      {getInitials(member.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
                        {member.name}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {member.email}
                      </div>
                    </div>
                    <Badge className="bg-gray-500/10 text-gray-600 border-gray-500/30 border text-xs">
                      {member.role}
                    </Badge>
                  </div>
                ))}
              </div>

              <Button variant="outline" size="sm" className="w-full">
                <UserPlus className="w-4 h-4 mr-2" />
                Ajouter un membre
              </Button>
            </Card>
          ))}
        </div>
      </MotionDiv>
    </PageContainer>
  );
}
