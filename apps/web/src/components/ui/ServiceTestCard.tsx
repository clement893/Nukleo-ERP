'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface ServiceTestCardProps {
  href: string;
  title: string;
  description: string;
  icon: ReactNode;
  color: 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error';
}

const colorClasses = {
  primary: {
    border: 'border-primary-200 dark:border-primary-800',
    bg: 'bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/60 dark:to-primary-800/60',
    hoverBorder: 'hover:border-primary-400 dark:hover:border-primary-600',
    iconBg: 'bg-primary-600 dark:bg-primary-500',
    text: 'text-primary-900 dark:text-primary-100',
    textSecondary: 'text-primary-800 dark:text-primary-200',
    arrow: 'text-primary-600 dark:text-primary-400',
  },
  secondary: {
    border: 'border-secondary-200 dark:border-secondary-800',
    bg: 'bg-gradient-to-br from-secondary-100 to-secondary-200 dark:from-secondary-900/60 dark:to-secondary-800/60',
    hoverBorder: 'hover:border-secondary-400 dark:hover:border-secondary-600',
    iconBg: 'bg-secondary-600 dark:bg-secondary-500',
    text: 'text-secondary-900 dark:text-secondary-100',
    textSecondary: 'text-secondary-800 dark:text-secondary-200',
    arrow: 'text-secondary-600 dark:text-secondary-400',
  },
  info: {
    border: 'border-info-200 dark:border-info-800',
    bg: 'bg-gradient-to-br from-info-100 to-info-200 dark:from-info-900/60 dark:to-info-800/60',
    hoverBorder: 'hover:border-info-400 dark:hover:border-info-600',
    iconBg: 'bg-info-600 dark:bg-info-500',
    text: 'text-info-900 dark:text-info-100',
    textSecondary: 'text-info-800 dark:text-info-200',
    arrow: 'text-info-600 dark:text-info-400',
  },
  success: {
    border: 'border-success-200 dark:border-success-800',
    bg: 'bg-gradient-to-br from-success-100 to-success-200 dark:from-success-900/60 dark:to-success-800/60',
    hoverBorder: 'hover:border-success-400 dark:hover:border-success-600',
    iconBg: 'bg-success-600 dark:bg-success-500',
    text: 'text-success-900 dark:text-success-100',
    textSecondary: 'text-success-800 dark:text-success-200',
    arrow: 'text-success-600 dark:text-success-400',
  },
  warning: {
    border: 'border-warning-200 dark:border-warning-800',
    bg: 'bg-gradient-to-br from-warning-100 to-warning-200 dark:from-warning-900/60 dark:to-warning-800/60',
    hoverBorder: 'hover:border-warning-400 dark:hover:border-warning-600',
    iconBg: 'bg-warning-600 dark:bg-warning-500',
    text: 'text-warning-900 dark:text-warning-100',
    textSecondary: 'text-warning-800 dark:text-warning-200',
    arrow: 'text-warning-600 dark:text-warning-400',
  },
  error: {
    border: 'border-danger-200 dark:border-danger-800',
    bg: 'bg-gradient-to-br from-danger-100 to-danger-200 dark:from-danger-900/60 dark:to-danger-800/60',
    hoverBorder: 'hover:border-danger-400 dark:hover:border-danger-600',
    iconBg: 'bg-danger-600 dark:bg-danger-500',
    text: 'text-danger-900 dark:text-danger-100',
    textSecondary: 'text-danger-800 dark:text-danger-200',
    arrow: 'text-danger-600 dark:text-danger-400',
  },
};

export default function ServiceTestCard({
  href,
  title,
  description,
  icon,
  color = 'info',
}: ServiceTestCardProps) {
  const colors = colorClasses[color];

  return (
    <Link
      href={href}
      className={clsx(
        'group p-6 border-2 rounded-lg hover:shadow-lg transition-all duration-200',
        colors.border,
        colors.bg,
        colors.hoverBorder
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={clsx('w-12 h-12 rounded-lg flex items-center justify-center', colors.iconBg)}>
          <div className="w-6 h-6 text-white">{icon}</div>
        </div>
        <svg
          className={clsx('w-5 h-5 group-hover:translate-x-1 transition-transform', colors.arrow)}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
      <h3 className={clsx('text-xl font-bold mb-2', colors.text)}>{title}</h3>
      <p className={clsx('text-sm', colors.textSecondary)}>{description}</p>
    </Link>
  );
}

