import nextDynamic from 'next/dynamic';

const OnboardingComponentsContent = nextDynamic(
  () => import('./OnboardingComponentsContent'),
  { ssr: true }
);

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default function OnboardingPage() {
  return <OnboardingComponentsContent />;
}



