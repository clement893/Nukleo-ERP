'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { Users as UsersIcon, Plus, Search, MoreVertical, Edit, Trash2, UserPlus, Mail } from 'lucide-react';
import { Badge, Button, Card, Input } from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamsAPI, type Team } from '@/lib/api/teams';
import { useToast } from '@/components/ui/use-toast';

export default function AdminTeamsDemo() {
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch teams
  const { data: teamsData, isLoading, error } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const response = await teamsAPI.list(0, 100);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to fetch teams');
      }
      return response.data;
    },
  });

  // Delete team mutation
  const deleteTeamMutation = useMutation({
    mutationFn: (teamId: number) => teamsAPI.deleteTeam(teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast({
        title: 'Équipe supprimée',
        description: 'L\'équipe a été supprimée avec succès',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de supprimer l\'équipe',
        variant: 'destructive',
      });
    },
  });

  const teams = teamsData?.teams || [];
  const totalTeams = teams.length;
  const totalMembers = teams.reduce((sum, team) => sum + (team.members?.length || 0), 0);
  const avgMembersPerTeam = totalTeams > 0 ? Math.round(totalMembers / totalTeams) : 0;

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#523DC9] mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Chargement des équipes...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 mb-2">Erreur de chargement</p>
            <p className="text-gray-600 dark:text-gray-400">{(error as Error).message}</p>
          </div>
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
                  <UsersIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    Gestion des Équipes
                  </h1>
                  <p className="text-white/80 text-sm">Gérez les équipes et leurs membres</p>
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
          <Card className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
                <UsersIcon className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Équipes</div>
            </div>
            <div className="text-2xl font-bold text-purple-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {totalTeams}
            </div>
          </Card>

          <Card className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <UsersIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Membres Total</div>
            </div>
            <div className="text-2xl font-bold text-blue-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {totalMembers}
            </div>
          </Card>

          <Card className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/30">
                <UsersIcon className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Moyenne/Équipe</div>
            </div>
            <div className="text-2xl font-bold text-green-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {avgMembersPerTeam}
            </div>
          </Card>
        </div>

        {/* Search */}
        <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
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
        {filteredTeams.length === 0 ? (
          <Card className="glass-card p-12 rounded-xl border border-[#A7A2CF]/20 text-center">
            <UsersIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune équipe trouvée</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchQuery ? 'Essayez avec un autre terme de recherche' : 'Commencez par créer votre première équipe'}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredTeams.map((team) => (
              <Card key={team.id} className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:border-[#523DC9]/40 hover:shadow-lg transition-all duration-200">
                {/* Team Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {team.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {team.description || 'Aucune description'}
                    </p>
                    <Badge className="bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700">
                      {team.members?.length || 0} {(team.members?.length || 0) > 1 ? 'membres' : 'membre'}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="hover:bg-gray-100 dark:hover:bg-gray-800">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600"
                      onClick={() => {
                        if (confirm(`Êtes-vous sûr de vouloir supprimer l'équipe "${team.name}" ?`)) {
                          deleteTeamMutation.mutate(team.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="hover:bg-gray-100 dark:hover:bg-gray-800">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Members */}
                <div className="space-y-3 mb-4">
                  {team.members && team.members.length > 0 ? (
                    team.members.slice(0, 4).map((member) => {
                      const memberName = member.user?.name || 
                                        (member.user?.first_name && member.user?.last_name 
                                          ? `${member.user.first_name} ${member.user.last_name}`
                                          : member.user?.email || 'Membre');
                      const memberEmail = member.user?.email || '';
                      const roleName = member.role?.name || 'Membre';

                      return (
                        <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <div className={`w-10 h-10 rounded-full ${getAvatarColor(memberName)} flex items-center justify-center text-white font-bold text-sm`}>
                            {getInitials(memberName)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{memberName}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 truncate flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {memberEmail}
                            </div>
                          </div>
                          <Badge className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600">
                            {roleName}
                          </Badge>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-4 text-gray-500 dark:text-gray-500 text-sm">
                      Aucun membre
                    </div>
                  )}
                  {team.members && team.members.length > 4 && (
                    <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                      +{team.members.length - 4} autre{team.members.length - 4 > 1 ? 's' : ''}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    Créée le {formatDate(team.created_at)}
                  </div>
                  <Button variant="outline" size="sm" className="hover-nukleo">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Ajouter un membre
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </MotionDiv>
    </PageContainer>
  );
}
