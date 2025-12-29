import { notFound } from 'next/navigation';
import DesignStyleContent from './DesignStyleContent';

const validStyles = ['modern-minimal', 'glassmorphism', 'neon-cyberpunk', 'corporate-professional', 'playful-colorful'];

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

interface DesignStylePageProps {
  params: Promise<{ style: string }> | { style: string };
}

export default async function DesignStylePage({ params }: DesignStylePageProps) {
  const resolvedParams = await Promise.resolve(params);
  const style = resolvedParams.style;

  if (!validStyles.includes(style)) {
    notFound();
  }

  return <DesignStyleContent style={style} />;
}
