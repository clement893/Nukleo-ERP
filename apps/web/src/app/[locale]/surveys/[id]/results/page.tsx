'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { SurveyResults } from '@/components/surveys';
import type { Survey, SurveySubmission } from '@/components/surveys';
import { PageContainer } from '@/components/layout';
import { Loading, Alert } from '@/components/ui';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { logger } from '@/lib/logger';
import { surveysAPI } from '@/lib/api';

export default function SurveyResultsPage() {
  const t = useTranslations('surveys.results');
  const params = useParams();
  const surveyId = Number(params.id);
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [submissions, setSubmissions] = useState<SurveySubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (surveyId) {
      loadData();
    }
  }, [surveyId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [surveyResponse, submissionsResponse] = await Promise.all([
        surveysAPI.get(surveyId),
        surveysAPI.getSubmissions(surveyId),
      ]);

      if (surveyResponse.data) {
        const form = surveyResponse.data;
        setSurvey({
          id: String(form.id),
          name: form.name,
          description: form.description,
          questions: form.fields || [],
          settings: form.settings || {
            allowAnonymous: true,
            requireAuth: false,
            limitOneResponse: false,
            limitOneResponsePerUser: true,
            showProgressBar: true,
            randomizeQuestions: false,
            publicLinkEnabled: false,
          },
          submitButtonText: form.submit_button_text,
          successMessage: form.success_message,
          status: 'published' as const,
        });
      }

      if (submissionsResponse.data) {
        setSubmissions(submissionsResponse.data.map((sub: any) => ({
          id: sub.id,
          survey_id: String(sub.form_id),
          data: sub.data,
          user_id: sub.user_id,
          submitted_at: sub.submitted_at,
          ip_address: sub.ip_address,
        })));
      }
    } catch (error) {
      logger.error('Failed to load survey results', error instanceof Error ? error : new Error(String(error)));
      setError(t('errors.loadFailed') || 'Failed to load survey results. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'excel' | 'json') => {
    try {
      const response = await surveysAPI.exportResults(surveyId, format);
      // Create download link
      const blob = new Blob([response.data], { type: format === 'json' ? 'application/json' : 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `survey_${surveyId}_results.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      logger.error('Failed to export results', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  };

  if (isLoading) {
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

  if (!survey) {
    return (
      <ProtectedRoute>
        <PageContainer>
          <Alert type="error" title={t('error') || 'Error'} description={t('errors.notFound') || 'Survey not found'} />
        </PageContainer>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <SurveyResults
        survey={survey}
        submissions={submissions}
        onExport={handleExport}
        error={error}
      />
    </ProtectedRoute>
  );
}

