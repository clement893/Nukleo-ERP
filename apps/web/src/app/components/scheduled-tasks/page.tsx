import nextDynamic from 'next/dynamic';

const ScheduledTasksComponentsContent = nextDynamic(
  () => import('./ScheduledTasksComponentsContent'),
  { ssr: true }
);

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default function ScheduledTasksPage() {
  return <ScheduledTasksComponentsContent />;
}



