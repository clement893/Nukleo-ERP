import nextDynamic from 'next/dynamic';

const EmailTemplatesComponentsContent = nextDynamic(
  () => import('./EmailTemplatesComponentsContent'),
  { ssr: true }
);

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default function EmailTemplatesPage() {
  return <EmailTemplatesComponentsContent />;
}



