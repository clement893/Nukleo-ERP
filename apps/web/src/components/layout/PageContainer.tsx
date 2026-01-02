import { ReactNode } from 'react';
import { Container } from '@/components/ui';
import { clsx } from 'clsx';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: boolean;
}

export default function PageContainer({ 
  children, 
  className,
  maxWidth = '2xl', // Par défaut 2xl au lieu de xl pour mieux utiliser l'espace
  padding = true,
}: PageContainerProps) {
  return (
    <Container 
      maxWidth={maxWidth}
      padding={padding}
      className={clsx('py-6', className)}
    >
      {children}
    </Container>
  );
}

