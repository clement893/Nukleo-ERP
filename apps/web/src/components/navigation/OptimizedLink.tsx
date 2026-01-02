/**
 * OptimizedLink Component
 * 
 * Enhanced Link component with explicit prefetching and hover optimization
 * for better navigation performance.
 */

'use client';

import { Link } from '@/i18n/routing';
import { useRouter } from '@/i18n/routing';
import { useRef, type ReactNode } from 'react';

interface OptimizedLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  prefetch?: boolean;
  onMouseEnter?: () => void;
  [key: string]: unknown;
}

export function OptimizedLink({ 
  href, 
  children, 
  className,
  prefetch = true,
  onMouseEnter,
  ...props 
}: OptimizedLinkProps) {
  const router = useRouter();
  const prefetchedRef = useRef(false);

  const handleMouseEnter = () => {
    // Explicit prefetch on hover for faster navigation
    if (prefetch && !prefetchedRef.current) {
      router.prefetch(href);
      prefetchedRef.current = true;
    }
    onMouseEnter?.();
  };

  return (
    <Link
      href={href}
      prefetch={prefetch}
      className={className}
      onMouseEnter={handleMouseEnter}
      {...props}
    >
      {children}
    </Link>
  );
}
