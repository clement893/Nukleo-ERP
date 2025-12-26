import nextDynamic from 'next/dynamic';

const FeatureFlagsComponentsContent = nextDynamic(
  () => import('./FeatureFlagsComponentsContent'),
  { ssr: true }
);

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default function FeatureFlagsPage() {
  return <FeatureFlagsComponentsContent />;
}



