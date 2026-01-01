'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { PageContainer } from '@/components/layout';
import { Badge, Loading, Alert } from '@/components/ui';
import MotionDiv from '@/components/motion/MotionDiv';
import { Users, CheckCircle2, TrendingUp, Target } from 'lucide-react';
import { projectTasksAPI } from '@/lib/api/project-tasks';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import { teamsAPI } from '@/lib/api/teams';
import type { Team as TeamType, TeamMember } from '@/lib/api/teams';
import type { ProjectTask } from '@/lib/api/project-tasks';
import { extractApiData } from '@/lib/api/utils';

// Types
interface Employee {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  tasks: ProjectTask[];
}

interface TeamWithStats extends TeamType {
  employees: Employee[];
  totalTasks: number;
  inProgressTasks: number;
  completedTasks: number;
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
  const [teams, setTeams] = useState<TeamWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTeams();
  }, []);

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const ensureTeamsExist = async (existingTeams: TeamType[]): Promise<TeamType[]> => {
    const teamsToCreate: typeof REQUIRED_TEAMS = [];
    
    // Vérifier quelles équipes manquent
    for (const requiredTeam of REQUIRED_TEAMS) {
      const exists = existingTeams.some(
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
          const quickCheck = existingTeams.some(
            (team: TeamType) => 
              team.name === teamToCreate.name || 
              team.slug === teamToCreate.slug ||
              team.slug === generateSlug(teamToCreate.name)
          );
          
          if (quickCheck) continue;
          
          await teamsAPI.create({
            name: teamToCreate.name,
            slug: teamToCreate.slug,
            description: teamToCreate.description,
          });
        } catch (err: any) {
          if (!(err?.response?.status === 400 && err?.response?.data?.detail?.includes('already exists'))) {
            console.error(`Erreur création équipe ${teamToCreate.name}:`, err);
          }
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      const reloadResponse = await teamsAPI.list();
      const reloadListData = extractApiData<{ teams: TeamType[]; total: number }>(reloadResponse);
      existingTeams = reloadListData?.teams || [];
    }
    
    // Filtrer pour ne garder que les équipes requises dans l'ordre spécifié
    const orderedTeams: TeamType[] = [];
    for (const requiredTeam of REQUIRED_TEAMS) {
      const foundTeam = existingTeams.find(
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
  };

  const loadTeams = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const teamsResponse = await teamsAPI.list();
      const teamsListData = extractApiData<{ teams: TeamType[]; total: number }>(teamsResponse);
      const teamsData = teamsListData?.teams || [];
      
      const targetTeams = await ensureTeamsExist(teamsData);
      
      if (targetTeams.length === 0) {
        setError('Impossible de charger ou créer les équipes');
        return;
      }
      
      // Charger les tâches et statistiques pour chaque équipe
      const teamsWithStats: TeamWithStats[] = await Promise.all(
        targetTeams.map(async (team: TeamType) => {
          const tasks = await projectTasksAPI.list({ team_id: team.id });
          
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
        })
      );
      
      setTeams(teamsWithStats);
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors du chargement des équipes');
      showToast({
        message: appError.message || 'Erreur lors du chargement des équipes',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTeamClick = (teamSlug: string) => {
    router.push(`/dashboard/projets/equipes/${teamSlug}`);
  };

  if (loading) {
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
        <div className="relative rounded-2xl overflow-hidden -mt-4 -mx-4 px-4 pt-6 pb-8">
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
            
            <h1 className="text-5xl font-black text-white mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Équipes
            </h1>
            <p className="text-white/80 text-lg max-w-2xl">
              Gérez vos équipes et leurs projets avec des pipelines de gestion modernes
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="error">{error}</Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#523DC9]/10 border border-[#523DC9]/30">
                <Users className="w-6 h-6 text-[#523DC9]" />
              </div>
              <Badge variant="info">{teams.length} équipes</Badge>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {totalMembers}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Membres totaux</div>
          </div>

          <div className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/30">
                <Target className="w-6 h-6 text-[#3B82F6]" />
              </div>
              <Badge variant="default">{totalTasks} total</Badge>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {totalInProgress}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Tâches en cours</div>
          </div>

          <div className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30">
                <CheckCircle2 className="w-6 h-6 text-[#10B981]" />
              </div>
              <Badge variant="success">{completionRate}%</Badge>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {totalCompleted}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Tâches complétées</div>
          </div>

          <div className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30">
                <TrendingUp className="w-6 h-6 text-[#F59E0B]" />
              </div>
              <Badge variant="warning">Performance</Badge>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {completionRate}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Taux de complétion</div>
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
                className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:scale-105 hover:border-[#523DC9]/40 transition-all duration-200 cursor-pointer group"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">{teamInfo?.icon || '👥'}</div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-[#523DC9] transition-colors" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                        {team.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {teamInfo?.description || team.description}
                      </p>
                    </div>
                  </div>
                  <Badge variant="info">{team.members?.length || 0} membres</Badge>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {team.totalTasks}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Total</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {team.inProgressTasks}
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-400">En cours</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {team.completedTasks}
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-400">Terminé</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Progression</span>
                    <span className="font-bold text-[#523DC9]">{completionRate}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#523DC9] to-[#5F2B75] transition-all duration-500"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                </div>

                {/* Members Preview */}
                {team.employees.length > 0 && (
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <Users className="w-4 h-4 text-gray-400" />
                    <div className="flex -space-x-2">
                      {team.employees.slice(0, 5).map((employee) => (
                        <div
                          key={employee.id}
                          className="w-8 h-8 rounded-full bg-gradient-to-br from-[#523DC9] to-[#5F2B75] flex items-center justify-center text-white text-xs font-bold border-2 border-white dark:border-gray-800"
                          title={employee.name}
                        >
                          {employee.name.charAt(0).toUpperCase()}
                        </div>
                      ))}
                      {team.employees.length > 5 && (
                        <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-300 text-xs font-bold border-2 border-white dark:border-gray-800">
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
