/**
 * Surveys Components Showcase Page
 */

'use client';

import { PageHeader, PageContainer, Section } from '@/components/layout';
import { SurveyBuilder, SurveyTaker, SurveyResults } from '@/components/surveys';
import type { Survey } from '@/components/surveys';
import { useState } from 'react';

export default function SurveysComponentsContent() {
  const [sampleSurvey] = useState<Survey>({
    id: '1',
    name: 'Sample Survey',
    description: 'This is a sample survey',
    questions: [],
    settings: {
      allowAnonymous: true,
      requireAuth: false,
      limitOneResponse: false,
      limitOneResponsePerUser: false,
      showProgressBar: true,
      randomizeQuestions: false,
      publicLinkEnabled: false,
    },
    status: 'draft',
  });

  return (
    <PageContainer>
      <PageHeader
        title="Composants Surveys"
        description="Composants pour créer, prendre et analyser des sondages"
        breadcrumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Composants', href: '/components' },
          { label: 'Surveys' },
        ]}
      />

      <div className="space-y-8 mt-8">
        <Section title="Survey Builder">
          <div className="max-w-6xl">
            <SurveyBuilder
              survey={sampleSurvey}
              onSave={async (survey) => {
                console.log('Survey saved:', survey);
              }}
            />
          </div>
        </Section>

        <Section title="Survey Taker">
          <div className="max-w-4xl">
            <SurveyTaker
              survey={sampleSurvey}
              onSubmit={async (data) => {
                console.log('Survey submitted:', data);
              }}
            />
          </div>
        </Section>

        <Section title="Survey Results">
          <div className="max-w-6xl">
            <SurveyResults
              survey={sampleSurvey}
              submissions={[]}
              onExport={async (format) => {
                console.log('Export survey results:', format);
              }}
            />
          </div>
        </Section>
      </div>
    </PageContainer>
  );
}

