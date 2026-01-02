/**
 * PageTransition Component
 * 
 * Provides smooth transitions between pages with loading states
 * for better perceived performance during navigation.
 */

'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { Loading } from '@/components/ui';

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setDisplayChildren(children);
      setIsLoading(false);
    }, 100); // Minimal delay for smooth transition

    return () => clearTimeout(timer);
  }, [pathname, children]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading />
      </div>
    );
  }

  return (
    <div 
      className="animate-fadeIn"
      style={{
        animation: 'fadeIn 0.2s ease-in-out',
      }}
    >
      {displayChildren}
    </div>
  );
}
