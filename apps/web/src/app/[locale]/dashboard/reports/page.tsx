/**
 * Dashboard Reports Page
 * 
 * Report builder and viewer page for creating and viewing custom reports.
 * Uses existing ReportBuilder and ReportViewer components.
 * Accessible via dashboard navigation.
 */

// Force dynamic rendering to avoid static generation
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/store';
import { ReportBuilder, ReportViewer } from '@/components/analytics';
import type { ReportConfig, ReportData } from '@/components/analytics';
import { PageHeader, PageContainer, Section } from '@/components/layout';
import { Loading, Alert, Tabs, TabList, Tab, TabPanels, TabPanel } from '@/components/ui';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { logger } from '@/lib/logger';
import { getErrorMessage } from '@/lib/errors';

export default function DashboardReportsPage() {
  const router = useRouter();
  const t = useTranslations('dashboard.reports');
  const { isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('builder');
  const [savedReports, setSavedReports] = useState<ReportData[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportData | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    loadSavedReports();
  }, [isAuthenticated, router]);

  const loadSavedReports = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // TODO: Replace with actual reports API endpoint when available
      // const response = await apiClient.get('/v1/reports');
      // if (response.data) {
      //   setSavedReports(response.data);
      // }
      
      // For now, use empty array
      setSavedReports([]);
    } catch (error: unknown) {
      logger.error('Failed to load reports', error instanceof Error ? error : new Error(String(error)));
      setError(t('errors.loadFailed') || 'Failed to load reports. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveReport = async (config: ReportConfig) => {
    try {
      setError(null);
      
      // TODO: Replace with actual report save API endpoint when available
      // const response = await apiClient.post('/v1/reports', config);
      // if (response.data) {
      //   setSavedReports([...savedReports, response.data]);
      //   logger.info('Report saved successfully');
      // }
      
      logger.info('Report save requested', { config });
      
      // For now, create a mock report
      const mockReport: ReportData = {
        id: `report-${Date.now()}`,
        name: config.name,
        description: config.description,
        dateRange: config.dateRange,
        format: config.format,
        data: {
          table: [],
          chart: [],
        },
        generatedAt: new Date().toISOString(),
      };
      
      setSavedReports([...savedReports, mockReport]);
      setActiveTab('viewer');
      setSelectedReport(mockReport);
    } catch (error: unknown) {
      logger.error('Failed to save report', error instanceof Error ? error : new Error(String(error)));
      const errorMessage = getErrorMessage(error) || t('errors.saveFailed') || 'Failed to save report. Please try again.';
      setError(errorMessage);
      throw error;
    }
  };

  const handlePreviewReport = (config: ReportConfig) => {
    // TODO: Implement preview functionality
    logger.info('Report preview requested', { config });
  };

  const handleRefreshReport = async () => {
    if (!selectedReport) return;
    
    try {
      setIsLoading(true);
      // TODO: Replace with actual report refresh API endpoint when available
      // const response = await apiClient.post(`/v1/reports/${selectedReport.id}/refresh`);
      // if (response.data) {
      //   setSelectedReport(response.data);
      // }
      
      logger.info('Report refresh requested', { reportId: selectedReport.id });
    } catch (error) {
      logger.error('Failed to refresh report', error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportReport = async (format: 'csv' | 'pdf' | 'excel') => {
    if (!selectedReport) return;
    
    try {
      // TODO: Implement export functionality
      logger.info('Report export requested', { reportId: selectedReport.id, format });
    } catch (error) {
      logger.error('Failed to export report', error instanceof Error ? error : new Error(String(error)));
    }
  };

  if (isLoading && savedReports.length === 0) {
    return (
      <ProtectedRoute>
        <PageContainer>
          <div className="flex items-center justify-center min-h-[400px]">
            <Loading />
          </div>
        </PageContainer>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <PageContainer>
        <PageHeader
          title={t('title') || 'Reports'}
          description={t('description') || 'Create and view custom reports'}
          breadcrumbs={[
            { label: t('breadcrumbs.dashboard') || 'Dashboard', href: '/dashboard' },
            { label: t('breadcrumbs.reports') || 'Reports' },
          ]}
        />

        {error && (
          <div className="mt-6">
            <Alert variant="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </div>
        )}

        <div className="mt-8">
          <Tabs defaultTab={activeTab} onChange={setActiveTab}>
            <TabList>
              <Tab value="builder">{t('tabs.builder') || 'Report Builder'}</Tab>
              <Tab value="viewer">{t('tabs.viewer') || 'View Reports'}</Tab>
            </TabList>

            <TabPanels>
              {/* Report Builder Tab */}
              <TabPanel value="builder">
                <Section title={t('sections.builder') || 'Create New Report'} className="mt-6">
                  <ReportBuilder
                    onSave={handleSaveReport}
                    onPreview={handlePreviewReport}
                  />
                </Section>
              </TabPanel>

              {/* Report Viewer Tab */}
              <TabPanel value="viewer">
                <Section title={t('sections.viewer') || 'Saved Reports'} className="mt-6">
                  {selectedReport ? (
                    <ReportViewer
                      report={selectedReport}
                      onRefresh={handleRefreshReport}
                      onExport={handleExportReport}
                    />
                  ) : savedReports.length > 0 ? (
                    <div className="space-y-4">
                      {savedReports.map((report) => (
                        <div
                          key={report.id}
                          className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          onClick={() => setSelectedReport(report)}
                        >
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{report.name}</h3>
                          {report.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{report.description}</p>
                          )}
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            Generated: {new Date(report.generatedAt).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-600 dark:text-gray-400">
                      <p>{t('empty') || 'No reports found. Create your first report using the Report Builder.'}</p>
                    </div>
                  )}
                </Section>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </div>
      </PageContainer>
    </ProtectedRoute>
  );
}


