import nextDynamic from 'next/dynamic';

const AuditTrailComponentsContent = nextDynamic(
  () => import('./AuditTrailComponentsContent'),
  { ssr: true }
);

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default function AuditTrailPage() {
  return <AuditTrailComponentsContent />;
}



