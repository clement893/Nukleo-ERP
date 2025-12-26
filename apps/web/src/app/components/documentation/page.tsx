import nextDynamic from 'next/dynamic';

const DocumentationComponentsContent = nextDynamic(
  () => import('./DocumentationComponentsContent'),
  { ssr: true }
);

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default function DocumentationPage() {
  return <DocumentationComponentsContent />;
}



