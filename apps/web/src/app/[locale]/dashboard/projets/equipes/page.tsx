'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from '@/i18n/routing';
import { PageContainer } from '@/components/layout';
import { Badge, Loading, Alert, Heading, Text } from '@/components/ui';
import MotionDiv from '@/components/motion/MotionDiv';
import { Users, CheckCircle2, TrendingUp, Target } from 'lucide-react';
import { useProjectTasks } from '@/lib/query/project-tasks';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import { useTeams, useCreateTeam } from '@/lib/query/queries';
import { extractApiData } from '@/lib/api/utils';
import type { Team as TeamType, TeamMember } from '@/lib/api/teams';
import type { ProjectTask } from '@/lib/api/project-tasks';

// Types
interface Employee {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  tasks: ProjectTask[];
}


// Définition des équipes à créer/afficher
const REQUIRED_TEAMS = [
  { name: 'Le Bureau', slug: 'le-bureau', description: 'Équipe administrative et gestion', icon: '🏢' },
  { name: 'Le Studio', slug: 'le-studio', description: 'Équipe créative et design', icon: '🎨' },
  { name: 'Le Lab', slug: 'le-lab', description: 'Équipe R&D et innovation', icon: '🔬' },
  { name: 'Équipe Gestion', slug: 'equipe-gestion', description: 'Équipe direction et stratégie', icon: '📊' },
];

function EquipesContent() {
  const router = useRouter();
  const { showToast } = useToast();
  const [error, setError] = useState<string | null>(null);
  
  // Use React Query hooks
  const { data: teamsResponse, isLoading: teamsLoading, error: teamsError } = useTeams();
  const createTeamMutation = useCreateTeam();
  
  // Extract teams data
  const teamsData = useMemo(() => {
    if (!teamsResponse) return null;
    if (Array.isArray(teamsResponse)) {
      return teamsResponse;
    }
    if (teamsResponse && typeof teamsResponse === 'object' && 'data' in teamsResponse) {
      const data = extractApiData<{ teams: TeamType[]; total: number }>(teamsResponse as any);
      return data?.teams || [];
    }
    return [];
  }, [teamsResponse]);

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Ensure required teams exist (only once on mount)
  useEffect(() => {
    if (!teamsData || teamsData.length === 0) return;
    
    const ensureTeamsExist = async () => {
      const teamsToCreate: typeof REQUIRED_TEAMS = [];
      
      // Vérifier quelles équipes manquent
      for (const requiredTeam of REQUIRED_TEAMS) {
        const exists = teamsData.some(
          (team: TeamType) => {
            const nameMatch = team.name === requiredTeam.name;
            const slugMatch = team.slug === requiredTeam.slug;
            const generatedSlugMatch = team.slug === generateSlug(requiredTeam.name);
            return nameMatch || slugMatch || generatedSlugMatch;
          }
        );
        
        if (!exists) {
          teamsToCreate.push(requiredTeam);
        }
      }
      
      // Créer les équipes manquantes
      if (teamsToCreate.length > 0) {
        for (const teamToCreate of teamsToCreate) {
          try {
            const quickCheck = teamsData.some(
              (team: TeamType) => 
                team.name === teamToCreate.name || 
                team.slug === teamToCreate.slug ||
                team.slug === generateSlug(teamToCreate.name)
            );
            
            if (quickCheck) continue;
            
            await createTeamMutation.mutateAsync({
              name: teamToCreate.name,
              slug: teamToCreate.slug,
              description: teamToCreate.description,
            });
          } catch (err: unknown) {
            const axiosError = err as { response?: { status?: number; data?: { detail?: string } } };
            if (!(axiosError?.response?.status === 400 && axiosError?.response?.data?.detail?.includes('already exists'))) {
              const appError = handleApiError(err);
              showToast({
                message: `Erreur lors de la création de l'équipe ${teamToCreate.name}: ${appError.message}`,
                type: 'error',
              });
            }
          }
        }
      }
    };
    
    ensureTeamsExist();
  }, [teamsData]); // Only run when teamsData changes

  // Filter and order teams
  const targetTeams = useMemo(() => {
    if (!teamsData) return [];
    
    const orderedTeams: TeamType[] = [];
    for (const requiredTeam of REQUIRED_TEAMS) {
      const foundTeam = teamsData.find(
        (team: TeamType) => {
          const nameMatch = team.name === requiredTeam.name;
          const slugMatch = team.slug === requiredTeam.slug;
          const generatedSlugMatch = team.slug === generateSlug(requiredTeam.name);
          return nameMatch || slugMatch || generatedSlugMatch;
        }
      );
      if (foundTeam) {
        orderedTeams.push(foundTeam);
      }
    }
    
    return orderedTeams;
  }, [teamsData]);
  
  // Load tasks for all teams - use a single query with all team IDs
  const teamIds = useMemo(() => targetTeams.map(t => t.id), [targetTeams]);
  const allTasksQuery = useProjectTasks({ 
    enabled: teamIds.length > 0 
  });
  
  // Build teams with stats
  const teams = useMemo(() => {
    if (!targetTeams.length || !allTasksQuery.data) return [];
    
    return targetTeams.map((team) => {
      const tasks = allTasksQuery.data.filter((task: ProjectTask) => task.team_id === team.id);
      
      const employees: Employee[] = (team.members || []).map((member: TeamMember) => {
        const memberTasks = tasks.filter(
          (task: ProjectTask) => task.assignee_id === member.user_id
        );
        return {
          id: member.user_id,
          name: member.user?.name || 
                `${member.user?.first_name || ''} ${member.user?.last_name || ''}`.trim() ||
                member.user?.email ||
                'Utilisateur',
          email: member.user?.email || '',
          tasks: memberTasks,
        };
      });
      
      const totalTasks = tasks.length;
      const inProgressTasks = tasks.filter((task: ProjectTask) => task.status === 'in_progress').length;
      const completedTasks = tasks.filter((task: ProjectTask) => task.status === 'completed').length;
      
      return {
        ...team,
        employees,
        totalTasks,
        inProgressTasks,
        completedTasks,
      };
    });
  }, [targetTeams, allTasksQuery.data]);
  
  const loading = teamsLoading || allTasksQuery.isLoading;
  
  // Handle errors
  useEffect(() => {
    if (teamsError) {
      const appError = handleApiError(teamsError);
      setError(appError.message || 'Erreur lors du chargement des équipes');
      showToast({
        message: appError.message || 'Erreur lors du chargement des équipes',
        type: 'error',
      });
    }
  }, [teamsError, showToast]);

  const handleTeamClick = (teamSlug: string) => {
    router.push(`/dashboard/projets/equipes/${teamSlug}`);
  };

  if (loading && !teams.length) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-96">
          <Loading />
        </div>
      </PageContainer>
    );
  }

  // Stats globales
  const totalMembers = teams.reduce((sum, team) => sum + (team.members?.length || 0), 0);
  const totalTasks = teams.reduce((sum, team) => sum + team.totalTasks, 0);
  const totalInProgress = teams.reduce((sum, team) => sum + team.inProgressTasks, 0);
  const totalCompleted = teams.reduce((sum, team) => sum + team.completedTasks, 0);
  const completionRate = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

  return (
    <PageContainer className="flex flex-col h-full">
      <MotionDiv variant="slideUp" duration="normal" className="flex flex-col flex-1 space-y-6">
        {/* Hero Header with Aurora Borealis Gradient */}
        <div className="relative rounded-2xl overflow-hidden -mt-4 -mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-10 2xl:-mx-12 3xl:-mx-16 4xl:-mx-20 px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 3xl:px-16 4xl:px-20 pt-6 pb-8">
          {/* Aurora Borealis Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] opacity-90" />
          
          {/* Grain Texture Overlay */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
            backgroundSize: '200px 200px'
          }} />
          
          <div className="relative">
            <div className="flex items-center gap-2 text-sm text-white/60 mb-3">
              <span>Dashboard</span>
              <span>/</span>
              <span>Modules Opérations</span>
              <span>/</span>
              <span className="text-white">Équipes</span>
            </div>
            
            <Heading level={1} className="text-white mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Équipes
            </Heading>
            <Text variant="body" className="text-white/80 text-lg max-w-2xl">
              Gérez vos équipes et leurs projets avec des pipelines de gestion modernes
            </Text>
          </div>
        </div>

        {error && (
          <Alert variant="error">{error}</Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-lg rounded-xl border border-border hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#523DC9]/10 border border-[#523DC9]/30">
                <Users className="w-6 h-6 text-[#523DC9]" aria-hidden="true" />
              </div>
              <Badge variant="info">{teams.length} équipes</Badge>
            </div>
            <div className="text-3xl font-bold text-foreground mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {totalMembers}
            </div>
            <Text variant="small" className="text-muted-foreground">Membres totaux</Text>
          </div>

          <div className="glass-card p-lg rounded-xl border border-border hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/30">
                <Target className="w-6 h-6 text-[#3B82F6]" aria-hidden="true" />
              </div>
              <Badge variant="default">{totalTasks} total</Badge>
            </div>
            <div className="text-3xl font-bold text-foreground mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {totalInProgress}
            </div>
            <Text variant="small" className="text-muted-foreground">Tâches en cours</Text>
          </div>

          <div className="glass-card p-lg rounded-xl border border-border hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30">
                <CheckCircle2 className="w-6 h-6 text-[#10B981]" aria-hidden="true" />
              </div>
              <Badge variant="success">{completionRate}%</Badge>
            </div>
            <div className="text-3xl font-bold text-foreground mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {totalCompleted}
            </div>
            <Text variant="small" className="text-muted-foreground">Tâches complétées</Text>
          </div>

          <div className="glass-card p-lg rounded-xl border border-border hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30">
                <TrendingUp className="w-6 h-6 text-[#F59E0B]" aria-hidden="true" />
              </div>
              <Badge variant="warning">Performance</Badge>
            </div>
            <div className="text-3xl font-bold text-foreground mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {completionRate}%
            </div>
            <Text variant="small" className="text-muted-foreground">Taux de complétion</Text>
          </div>
        </div>

        {/* Teams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {teams.map((team) => {
            const teamInfo = REQUIRED_TEAMS.find(t => t.slug === team.slug);
            const completionRate = team.totalTasks > 0 
              ? Math.round((team.completedTasks / team.totalTasks) * 100) 
              : 0;

            return (
              <div
                key={team.id}
                onClick={() => handleTeamClick(team.slug)}
                className="glass-card p-lg rounded-xl border border-border hover:scale-105 hover:border-[#523DC9]/40 transition-all duration-200 cursor-pointer group"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleTeamClick(team.slug);
                  }
                }}
                aria-label={`Voir les détails de l'équipe ${team.name}`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl" aria-hidden="true">{teamInfo?.icon || '👥'}</div>
                    <div>
                      <Heading level={3} className="group-hover:text-[#523DC9] transition-colors" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                        {team.name}
                      </Heading>
                      <Text variant="small" className="text-muted-foreground">
                        {teamInfo?.description || team.description}
                      </Text>
                    </div>
                  </div>
                  <Badge variant="info">{team.members?.length || 0} membres</Badge>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-3 rounded-lg bg-muted">
                    <div className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {team.totalTasks}
                    </div>
                    <Text variant="caption" className="text-muted-foreground">Total</Text>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-primary-50 dark:bg-primary-900/20">
                    <div className="text-2xl font-bold text-primary-600 dark:text-primary-400" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {team.inProgressTasks}
                    </div>
                    <Text variant="caption" className="text-primary-600 dark:text-primary-400">En cours</Text>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {team.completedTasks}
                    </div>
                    <Text variant="caption" className="text-green-600 dark:text-green-400">Terminé</Text>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <Text variant="small" className="text-muted-foreground">Progression</Text>
                    <span className="font-bold text-[#523DC9]">{completionRate}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#523DC9] to-[#5F2B75] transition-all duration-500"
                      style={{ width: `${completionRate}%` }}
                      role="progressbar"
                      aria-valuenow={completionRate}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </div>
                </div>

                {/* Members Preview */}
                {team.employees.length > 0 && (
                  <div className="flex items-center gap-2 pt-3 border-t border-border">
                    <Users className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                    <div className="flex -space-x-2">
                      {team.employees.slice(0, 5).map((employee) => (
                        <div
                          key={employee.id}
                          className="w-8 h-8 rounded-full bg-gradient-to-br from-[#523DC9] to-[#5F2B75] flex items-center justify-center text-white text-xs font-bold border-2 border-white dark:border-gray-800"
                          title={employee.name}
                          aria-label={employee.name}
                        >
                          {employee.name.charAt(0).toUpperCase()}
                        </div>
                      ))}
                      {team.employees.length > 5 && (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs font-bold border-2 border-white dark:border-gray-800" aria-label={`${team.employees.length - 5} autres membres`}>
                          +{team.employees.length - 5}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </MotionDiv>
    </PageContainer>
  );
}

export default function EquipesPage() {
  return <EquipesContent />;
}
