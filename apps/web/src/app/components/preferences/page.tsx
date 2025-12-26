import nextDynamic from 'next/dynamic';

const PreferencesComponentsContent = nextDynamic(
  () => import('./PreferencesComponentsContent'),
  { ssr: true }
);

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default function PreferencesPage() {
  return <PreferencesComponentsContent />;
}



