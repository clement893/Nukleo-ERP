/**
 * EmployeePortalEmptyState Component
 * 
 * Reusable empty state component with Nukleo design
 * for employee portal pages.
 */

'use client';

import { Card, Button } from '@/components/ui';
import { LucideIcon } from 'lucide-react';

interface EmployeePortalEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmployeePortalEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmployeePortalEmptyStateProps) {
  return (
    <Card className="glass-card p-12 rounded-xl border border-nukleo-lavender/20 text-center">
      <Icon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
      <p className="text-gray-600 dark:text-gray-400 mb-4 font-nukleo">{title}</p>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">{description}</p>
      )}
      {action && (
        <Button
          className="bg-primary-500 hover:bg-primary-600 text-white"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </Card>
  );
}
