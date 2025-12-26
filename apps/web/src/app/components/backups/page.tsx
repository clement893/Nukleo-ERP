import nextDynamic from 'next/dynamic';

const BackupsComponentsContent = nextDynamic(
  () => import('./BackupsComponentsContent'),
  { ssr: true }
);

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default function BackupsPage() {
  return <BackupsComponentsContent />;
}



