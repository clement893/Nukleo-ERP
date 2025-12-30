'use client';

import { Eye, Edit, Trash2 } from 'lucide-react';
import Dropdown from '@/components/ui/Dropdown';
import type { DropdownItem } from '@/components/ui/Dropdown';
import { Company } from '@/lib/api/companies';

interface CompanyRowActionsProps {
  company: Company;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function CompanyRowActions({
  company,
  onView,
  onEdit,
  onDelete,
}: CompanyRowActionsProps) {
  const items: DropdownItem[] = [
    {
      label: 'Voir',
      onClick: () => {
        onView();
      },
      icon: <Eye className="w-4 h-4" />,
    },
    {
      label: 'Modifier',
      onClick: () => {
        onEdit();
      },
      icon: <Edit className="w-4 h-4" />,
    },
    {
      label: 'Supprimer',
      onClick: () => {
        onDelete();
      },
      icon: <Trash2 className="w-4 h-4" />,
      variant: 'danger',
    },
  ];

  return (
    <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
      <Dropdown
        trigger={
          <div
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted cursor-pointer"
            aria-label={`Actions pour ${company.name}`}
            role="button"
            tabIndex={0}
          >
            <span className="text-lg leading-none">⋯</span>
          </div>
        }
        items={items}
        position="left"
      />
    </div>
  );
}
