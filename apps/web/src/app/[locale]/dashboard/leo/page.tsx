/**
 * Leo Page
 * Main page for Leo AI assistant
 */

'use client';

import { LeoContainer } from '@/components/leo';

export default function LeoPage() {
  return (
    <div className="fixed inset-0 flex flex-col h-screen w-screen overflow-hidden bg-background">
      <LeoContainer />
    </div>
  );
}
