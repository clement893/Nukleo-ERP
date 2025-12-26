import nextDynamic from 'next/dynamic';

const AnnouncementsComponentsContent = nextDynamic(
  () => import('./AnnouncementsComponentsContent'),
  { ssr: true }
);

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default function AnnouncementsPage() {
  return <AnnouncementsComponentsContent />;
}



