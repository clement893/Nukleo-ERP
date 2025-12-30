'use client';

import Badge from '@/components/ui/Badge';
import { type ExpenseAccountStatus } from '@/lib/api/finances/expenseAccounts';

interface ExpenseAccountStatusBadgeProps {
  status: ExpenseAccountStatus;
  className?: string;
}

const statusLabels: Record<ExpenseAccountStatus, string> = {
  draft: 'Brouillon',
  submitted: 'Soumis',
  under_review: 'En révision',
  approved: 'Approuvé',
  rejected: 'Rejeté',
  needs_clarification: 'Précisions requises',
};

const statusVariants: Record<ExpenseAccountStatus, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  draft: 'default',
  submitted: 'info',
  under_review: 'warning',
  approved: 'success',
  rejected: 'error',
  needs_clarification: 'warning',
};

export default function ExpenseAccountStatusBadge({ status, className }: ExpenseAccountStatusBadgeProps) {
  return (
    <Badge variant={statusVariants[status]} className={className}>
      {statusLabels[status]}
    </Badge>
  );
}
