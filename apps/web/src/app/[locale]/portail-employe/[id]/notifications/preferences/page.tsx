'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { PageHeader, PageContainer } from '@/components/layout';
import { NotificationSettings } from '@/components/settings';
import { Card } from '@/components/ui';
import { Bell, ArrowLeft } from 'lucide-react';
import { employeesAPI } from '@/lib/api/employees';
import { logger } from '@/lib/logger';
import Button from '@/components/ui/Button';

export default function EmployeeNotificationPreferencesPage() {
  const router = useRouter();
  const params = useParams();
  const employeeId = params?.id ? parseInt(String(params.id)) : null;
  const locale = (params?.locale as string) || 'fr';
  const t = useTranslations('settings.notifications');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!employeeId) {
      router.push(`/portail-employe`);
      return;
    }

    loadEmployee();
  }, [employeeId, locale, router]);

  const loadEmployee = async () => {
    try {
      if (!employeeId) return;
      setLoading(true);
      await employeesAPI.get(employeeId);
    } catch (error) {
      logger.error('Failed to load employee', error);
    } finally {
      setLoading(false);
    }
  };

  if (!employeeId || loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={t('title') || 'Préférences de Notifications'}
        description={t('description') || 'Gérez vos préférences de notifications'}
        breadcrumbs={[
          { label: 'Portail Employé', href: `/portail-employe/${employeeId}/dashboard` },
          { label: 'Notifications', href: `/portail-employe/${employeeId}/notifications` },
          { label: 'Préférences' },
        ]}
      />

      <div className="mt-6 space-y-6">
        {/* Back Button */}
        <Button
          variant="outline"
          onClick={() => router.push(`/portail-employe/${employeeId}/notifications`)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux notifications
        </Button>

        {/* Notification Settings */}
        <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
              <Bell className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Préférences de Notifications
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Configurez comment vous souhaitez recevoir vos notifications
              </p>
            </div>
          </div>

          <NotificationSettings 
            settings={{
              email: {
                enabled: true,
                frequency: 'instant' as 'instant' | 'daily' | 'weekly',
                types: {
                  marketing: true,
                  product: true,
                  security: true,
                  billing: true,
                  system: true,
                },
              },
              push: {
                enabled: false,
                types: {
                  marketing: false,
                  product: true,
                  security: true,
                  billing: false,
                  system: true,
                },
              },
              inApp: {
                enabled: true,
                types: {
                  marketing: true,
                  product: true,
                  security: true,
                  billing: true,
                  system: true,
                },
              },
            }}
            onSave={async (data) => {
              // TODO: Save to API
              console.log('Saving notification preferences:', data);
            }}
          />
        </Card>
      </div>
    </PageContainer>
  );
}
