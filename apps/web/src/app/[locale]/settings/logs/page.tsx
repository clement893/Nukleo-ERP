/**
 * Logs Settings Page
 * 
 * Page for viewing system logs and audit trail from settings.
 */

// Force dynamic rendering to avoid static generation
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/store';
import { PageHeader, PageContainer } from '@/components/layout';
import { apiClient } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { Button, Card, Badge, Alert, Input, Loading, DataTable, Select } from '@/components/ui';
import type { Column } from '@/components/ui/DataTable';
import ProtectedSuperAdminRoute from '@/components/auth/ProtectedSuperAdminRoute';
import { checkMySuperAdminStatus } from '@/lib/api/admin';
import { TokenStorage } from '@/lib/auth/tokenStorage';

interface AuditLog {
  id: number;
  user_id: number | null;
  event_type: string;
  severity: string;
  message: string;
  ip_address: string | null;
  user_agent: string | null;
  timestamp: string;
}

export default function LogsSettingsPage() {
  const router = useRouter();
  const t = useTranslations('settings.logs');
  const { isAuthenticated, user, token } = useAuthStore();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');

  useEffect(() => {
    const checkPermissions = async () => {
      if (!isAuthenticated()) {
        router.push('/auth/login');
        return;
      }

      // Check superadmin status
      try {
        const tokenFromStorage = typeof window !== 'undefined' ? TokenStorage.getToken() : null;
        const authToken = token || tokenFromStorage;
        
        if (authToken && user?.email) {
          const status = await checkMySuperAdminStatus(authToken);
          setIsSuperAdmin(status.is_superadmin === true);
          
          if (!status.is_superadmin) {
            setError(t('errors.unauthorized') || 'Vous n\'avez pas la permission de consulter les logs. Cette fonctionnalité nécessite un compte superadmin.');
            setIsChecking(false);
            setLoading(false);
            return;
          }
        } else {
          // Fallback: check is_admin if no token available
          if (!user?.is_admin) {
            setError(t('errors.unauthorized') || 'Vous n\'avez pas la permission de consulter les logs. Cette fonctionnalité nécessite un compte superadmin.');
            setIsChecking(false);
            setLoading(false);
            return;
          }
          setIsSuperAdmin(true);
        }
        
        setIsChecking(false);
        loadLogs();
      } catch (err) {
        setError(t('errors.unauthorized') || 'Vous n\'avez pas la permission de consulter les logs. Cette fonctionnalité nécessite un compte superadmin.');
        setIsChecking(false);
        setLoading(false);
      }
    };

    checkPermissions();
  }, [isAuthenticated, user, token, router, eventTypeFilter, severityFilter, t]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (eventTypeFilter) params.append('event_type', eventTypeFilter);
      if (severityFilter) params.append('severity', severityFilter);
      params.append('limit', '100');

      const url = `/v1/audit-trail/audit-trail?${params.toString()}`;
      
      const response = await apiClient.get(url);
      
      let logsData: AuditLog[] = [];
      
      if (Array.isArray(response)) {
        logsData = response as AuditLog[];
      } 
      else if (response && typeof response === 'object' && 'data' in response) {
        const responseData = (response as { data?: unknown }).data;
        if (Array.isArray(responseData)) {
          logsData = responseData as AuditLog[];
        } else if (responseData && typeof responseData === 'object' && 'results' in responseData) {
          logsData = ((responseData as { results: AuditLog[] }).results) || [];
        }
      }
      else if (response && typeof response === 'object' && 'results' in response) {
        const results = (response as { results?: AuditLog[] }).results;
        if (Array.isArray(results)) {
          logsData = results;
        }
      }
      
      if (!Array.isArray(logsData)) {
        logsData = [];
      }
      
      setLogs(logsData);
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, t('errors.loadFailed') || 'Failed to load logs');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log =>
    log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.event_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.user_id && String(log.user_id).includes(searchTerm))
  );

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'default';
      default:
        return 'default';
    }
  };

  const columns: Column<AuditLog>[] = [
    {
      key: 'timestamp',
      label: t('columns.timestamp') || 'Date/Heure',
      render: (_value, log) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {new Date(log.timestamp).toLocaleString('fr-FR')}
        </span>
      ),
    },
    {
      key: 'severity',
      label: t('columns.severity') || 'Sévérité',
      render: (_value, log) => (
        <Badge variant={getSeverityBadgeVariant(log.severity)}>
          {log.severity}
        </Badge>
      ),
    },
    {
      key: 'event_type',
      label: t('columns.eventType') || 'Type',
      render: (_value, log) => (
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {log.event_type}
        </span>
      ),
    },
    {
      key: 'message',
      label: t('columns.message') || 'Message',
      render: (_value, log) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {log.message}
        </span>
      ),
    },
    {
      key: 'user_id',
      label: t('columns.user') || 'Utilisateur',
      render: (_value, log) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {log.user_id ? `ID: ${log.user_id}` : t('columns.system') || 'Système'}
        </span>
      ),
    },
    {
      key: 'ip_address',
      label: t('columns.ipAddress') || 'IP',
      render: (_value, log) => (
        <span className="text-xs text-gray-500 dark:text-gray-500">
          {log.ip_address || '-'}
        </span>
      ),
    },
  ];

  if (isChecking) {
    return (
      <ProtectedSuperAdminRoute>
        <PageContainer>
          <div className="flex items-center justify-center min-h-[400px]">
            <Loading />
          </div>
        </PageContainer>
      </ProtectedSuperAdminRoute>
    );
  }

  return (
    <ProtectedSuperAdminRoute>
      <PageContainer>
        <PageHeader
          title={t('title') || 'Logs'}
          description={t('description') || 'View system logs and audit trail'}
          breadcrumbs={[
            { label: t('breadcrumbs.dashboard') || 'Dashboard', href: '/dashboard' },
            { label: t('breadcrumbs.settings') || 'Settings', href: '/settings' },
            { label: t('breadcrumbs.logs') || 'Logs' },
          ]}
        />

        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}

        {!isSuperAdmin ? (
          <Card>
            <div className="py-12 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                {t('errors.unauthorized') || 'Vous n\'avez pas la permission de consulter les logs. Cette fonctionnalité nécessite un compte superadmin.'}
              </p>
            </div>
          </Card>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="flex gap-4 items-center flex-wrap">
              <Input
                type="text"
                placeholder={t('searchPlaceholder') || 'Rechercher dans les logs...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 min-w-[200px]"
              />
              <Select
                value={eventTypeFilter}
                onChange={(e) => setEventTypeFilter(e.target.value)}
                options={[
                  { value: '', label: t('filters.allTypes') || 'Tous les types' },
                  { value: 'login', label: t('filters.login') || 'Login' },
                  { value: 'logout', label: t('filters.logout') || 'Logout' },
                  { value: 'create', label: t('filters.create') || 'Création' },
                  { value: 'update', label: t('filters.update') || 'Modification' },
                  { value: 'delete', label: t('filters.delete') || 'Suppression' },
                ]}
                placeholder={t('filters.eventType') || "Type d'événement"}
              />
              <Select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                options={[
                  { value: '', label: t('filters.allSeverities') || 'Toutes les sévérités' },
                  { value: 'info', label: t('filters.info') || 'Info' },
                  { value: 'warning', label: t('filters.warning') || 'Warning' },
                  { value: 'error', label: t('filters.error') || 'Error' },
                  { value: 'critical', label: t('filters.critical') || 'Critical' },
                ]}
                placeholder={t('filters.severity') || 'Sévérité'}
              />
              <Button onClick={loadLogs} variant="outline">
                {t('refresh') || 'Actualiser'}
              </Button>
            </div>

            {loading ? (
              <Card>
                <div className="py-12 text-center">
                  <Loading />
                </div>
              </Card>
            ) : (
              <Card>
                <DataTable
                  data={filteredLogs as unknown as Record<string, unknown>[]}
                  columns={columns as unknown as Column<Record<string, unknown>>[]}
                  emptyMessage={t('empty') || 'Aucun log trouvé'}
                />
              </Card>
            )}
          </div>
        )}
      </PageContainer>
    </ProtectedSuperAdminRoute>
  );
}

