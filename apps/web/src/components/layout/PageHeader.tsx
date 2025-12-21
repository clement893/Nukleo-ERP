import { ReactNode } from 'react';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { Container } from '@/components/ui';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
  badge?: ReactNode;
}

export default function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  badge,
}: PageHeaderProps) {
  return (
    <Container className="py-8">
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} className="mb-6" />}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold text-gray-900">{title}</h1>
            {badge && badge}
          </div>
          {description && <p className="text-gray-600">{description}</p>}
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
    </Container>
  );
}

