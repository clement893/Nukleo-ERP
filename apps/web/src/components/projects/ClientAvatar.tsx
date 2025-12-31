'use client';

import { Client } from '@/lib/api/clients';
import { UserCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface ClientAvatarProps {
  client: Client;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

export default function ClientAvatar({
  client,
  size = 'md',
  className,
}: ClientAvatarProps) {
  const getInitials = () => {
    const name = client.company_name || '';
    if (!name) return '?';
    const parts = name.trim().split(/\s+/).filter(p => p.length > 0);
    if (parts.length >= 2) {
      return ((parts[0]?.charAt(0) || '') + (parts[parts.length - 1]?.charAt(0) || '')).toUpperCase();
    }
    return name.charAt(0).toUpperCase() || '?';
  };

  return (
    <div className={clsx(
      'rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 flex items-center justify-center',
      sizeClasses[size],
      className
    )}>
      {getInitials() !== '?' ? (
        <span className="font-medium text-primary-700 dark:text-primary-300">
          {getInitials()}
        </span>
      ) : (
        <UserCircle className="text-primary-600 dark:text-primary-400" style={{ width: '60%', height: '60%' }} />
      )}
    </div>
  );
}
