'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { clsx } from 'clsx';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: ReactNode;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: ReactNode;
  showHome?: boolean;
  homeHref?: string;
  className?: string;
}

export default function Breadcrumb({
  items,
  separator,
  showHome = true,
  homeHref = '/',
  className,
}: BreadcrumbProps) {
  const defaultSeparator = <ChevronRight className="w-4 h-4 text-gray-400" />;
  const displaySeparator = separator || defaultSeparator;

  const allItems: BreadcrumbItem[] = showHome
    ? [{ label: 'Accueil', href: homeHref, icon: <Home className="w-4 h-4" /> }, ...items]
    : items;

  return (
    <nav aria-label="Breadcrumb" className={clsx('flex items-center gap-2', className)}>
      <ol className="flex items-center gap-2" role="list">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          const isLink = item.href && !isLast;

          return (
            <li key={index} className="flex items-center gap-2">
              {isLink ? (
                <Link
                  href={item.href!}
                  className={clsx(
                    'flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400',
                    'hover:text-gray-900 dark:hover:text-gray-100 transition-colors'
                  )}
                >
                  {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                  <span>{item.label}</span>
                </Link>
              ) : (
                <span
                  className={clsx(
                    'flex items-center gap-1 text-sm',
                    isLast
                      ? 'text-gray-900 dark:text-gray-100 font-medium'
                      : 'text-gray-600 dark:text-gray-400'
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                  <span>{item.label}</span>
                </span>
              )}
              {!isLast && <span className="flex-shrink-0">{displaySeparator}</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

