/**
 * EmployeePortalContentCard Component
 * 
 * Reusable content card component with Nukleo design
 * for employee portal pages.
 */

'use client';

import { ReactNode } from 'react';
import { Card } from '@/components/ui';
import { clsx } from 'clsx';

interface EmployeePortalContentCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export default function EmployeePortalContentCard({
  children,
  className,
  onClick,
  hoverable = true,
}: EmployeePortalContentCardProps) {
  return (
    <Card
      className={clsx(
        'glass-card p-6 rounded-xl border border-nukleo-lavender/20',
        hoverable && 'hover:border-primary-500/40 transition-all',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </Card>
  );
}
