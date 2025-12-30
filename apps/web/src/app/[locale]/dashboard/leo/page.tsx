/**
 * Leo Page
 * Main page for Leo AI assistant
 */

'use client';

import PageHeader from '@/components/layout/PageHeader';
import { LeoContainer } from '@/components/leo';

export default function LeoPage() {
  return (
    <div className="space-y-6 h-full">
      <PageHeader
        title="Leo - Assistant IA"
        description="Posez vos questions à Leo, votre assistant intelligent pour l'ERP"
      />

      <div className="h-[calc(100vh-280px)] min-h-[600px]">
        <LeoContainer />
      </div>
    </div>
  );
}
