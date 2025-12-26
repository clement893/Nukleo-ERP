'use client';

import { useEffect, useState } from 'react';
import { PageHeader, PageContainer, Section } from '@/components/layout';
import { useAuthStore } from '@/lib/store';
import { apiClient } from '@/lib/api/client';
import { getErrorMessage } from '@/lib/error-utils';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Alert from '@/components/ui/Alert';
import Loading from '@/components/ui/Loading';

interface Statistics {
  total_users: number;
  active_users: number;
  total_organizations: number;
  total_logs: number;
  recent_activities: number;
}

export default function AdminStatisticsContent() {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load users
      const usersResponse = await apiClient.get('/v1/users?limit=1');
      const usersData = (usersResponse as any).data?.data || (usersResponse as any).data || usersResponse.data;
      const totalUsers = usersData?.total || 0;

      // Load audit trail stats
      let totalLogs = 0;
      let recentActivities = 0;
      try {
        const logsResponse = await apiClient.get('/v1/audit-trail/audit-trail?limit=1');
        const logsData = (logsResponse as any).data?.data || (logsResponse as any).data || logsResponse.data;
        if (Array.isArray(logsData)) {
          totalLogs = logsData.length;
          recentActivities = logsData.filter((log: any) => {
            const logDate = new Date(log.timestamp);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return logDate >= weekAgo;
          }).length;
        }
      } catch (e) {
        // Ignore if audit trail is not available
      }

      // Load teams/organizations
      let totalOrgs = 0;
      try {
        const { teamsAPI } = await import('@/lib/api');
        const teamsResponse = await teamsAPI.list();
        if (teamsResponse.data) {
          totalOrgs = Array.isArray(teamsResponse.data) ? teamsResponse.data.length : 0;
        }
      } catch (e) {
        // Ignore if teams API is not available
      }

      setStats({
        total_users: totalUsers,
        active_users: totalUsers, // TODO: Calculate active users
        total_organizations: totalOrgs,
        total_logs: totalLogs,
        recent_activities: recentActivities,
      });
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Erreur lors du chargement des statistiques'));
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Utilisateurs totaux',
      value: stats?.total_users || 0,
      description: 'Nombre total d\'utilisateurs',
      color: 'blue',
    },
    {
      title: 'Utilisateurs actifs',
      value: stats?.active_users || 0,
      description: 'Utilisateurs actifs',
      color: 'green',
    },
    {
      title: 'Organisations',
      value: stats?.total_organizations || 0,
      description: 'Nombre d\'organisations',
      color: 'purple',
    },
    {
      title: 'Logs système',
      value: stats?.total_logs || 0,
      description: 'Total des logs',
      color: 'orange',
    },
    {
      title: 'Activités récentes',
      value: stats?.recent_activities || 0,
      description: 'Activités des 7 derniers jours',
      color: 'indigo',
    },
  ];

  return (
    <PageContainer>
      <PageHeader 
        title="Statistiques" 
        description="Visualiser les statistiques et métriques du système"
        breadcrumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Administration', href: '/admin' },
          { label: 'Statistiques' }
        ]} 
      />

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      {loading ? (
        <Card>
          <div className="py-12 text-center">
            <Loading />
          </div>
        </Card>
      ) : (
        <>
          <Section title="Vue d'ensemble" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {statCards.map((stat, index) => (
                <Card key={index} className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {stat.title}
                    </h3>
                    <Badge variant="default">{stat.color}</Badge>
                  </div>
                  <div className="mt-2">
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                      {stat.value.toLocaleString('fr-FR')}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                      {stat.description}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </Section>

          <Section title="Métriques détaillées" className="mt-8">
            <Card>
              <div className="p-6">
                <p className="text-gray-600 dark:text-gray-400">
                  Les métriques détaillées seront disponibles prochainement.
                </p>
              </div>
            </Card>
          </Section>
        </>
      )}
    </PageContainer>
  );
}

