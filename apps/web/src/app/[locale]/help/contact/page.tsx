/**
 * Contact Support Page
 * 
 * Page for contacting support team.
 */

'use client';

import { useTranslations } from 'next-intl';
import { ContactSupport } from '@/components/help';
import { PageHeader, PageContainer } from '@/components/layout';
import { useToast } from '@/components/ui';
import { supportTicketsAPI } from '@/lib/api';
import { handleApiError } from '@/lib/errors/api';
import { logger } from '@/lib/logger';

export default function ContactSupportPage() {
  const t = useTranslations('help.contact');

  const { showToast } = useToast();

  const handleSubmit = async (data: { subject: string; message: string; category: string; priority: string }) => {
    try {
      await supportTicketsAPI.create({
        subject: data.subject,
        category: data.category as 'technical' | 'billing' | 'feature' | 'general' | 'bug',
        priority: data.priority as 'low' | 'medium' | 'high' | 'urgent',
        message: data.message,
      });
      
      showToast({
        message: 'Support ticket created successfully. We will get back to you soon.',
        type: 'success',
      });
    } catch (error) {
      const appError = handleApiError(error);
      logger.error('Failed to create support ticket', appError);
      showToast({
        message: appError.message || 'Failed to create support ticket. Please try again.',
        type: 'error',
      });
      throw error;
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title={t('title') || 'Contact Support'}
        description={t('description') || 'Get in touch with our support team'}
        breadcrumbs={[
          { label: t('breadcrumbs.home') || 'Home', href: '/' },
          { label: t('breadcrumbs.help') || 'Help', href: '/help' },
          { label: t('breadcrumbs.contact') || 'Contact' },
        ]}
      />

      <div className="mt-8">
        <ContactSupport onSubmit={handleSubmit} />
      </div>
    </PageContainer>
  );
}

