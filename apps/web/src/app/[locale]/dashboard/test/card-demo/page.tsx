/**
 * Card Component Demo Page
 * 
 * Page de démonstration pour tester le nouveau composant Card avec variants.
 * Accessible via /fr/dashboard/test/card-demo
 */

'use client';

import { CardExamples } from '@/components/ui/Card.examples';
import { PageHeader, PageContainer } from '@/components/layout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function CardDemoPage() {
  return (
    <ProtectedRoute>
      <PageContainer>
        <PageHeader
          title="Card Component Demo"
          description="Test du nouveau système de variants unifié"
        />
        <CardExamples />
      </PageContainer>
    </ProtectedRoute>
  );
}
