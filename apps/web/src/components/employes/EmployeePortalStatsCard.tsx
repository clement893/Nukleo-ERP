/**
 * EmployeePortalStatsCard Component
 * 
 * Reusable statistics card component with Nukleo design
 * for employee portal pages.
 */

'use client';

import { ReactNode } from 'react';
import { Card } from '@/components/ui';

interface EmployeePortalStatsCardProps {
  value: string | number;
  label: string;
  icon?: ReactNode;
  iconColor?: 'blue' | 'green' | 'yellow' | 'purple' | 'orange' | 'red' | 'gray';
  valueColor?: 'default' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange' | 'red' | 'gray';
}

const iconColorClasses = {
  blue: 'bg-blue-500/10 border-blue-500/30 text-blue-600',
  green: 'bg-green-500/10 border-green-500/30 text-green-600',
  yellow: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-600',
  purple: 'bg-purple-500/10 border-purple-500/30 text-purple-600',
  orange: 'bg-orange-500/10 border-orange-500/30 text-orange-600',
  red: 'bg-red-500/10 border-red-500/30 text-red-600',
  gray: 'bg-gray-500/10 border-gray-500/30 text-gray-600',
};

const valueColorClasses = {
  default: '',
  blue: 'text-blue-600',
  green: 'text-green-600',
  yellow: 'text-yellow-600',
  purple: 'text-purple-600',
  orange: 'text-orange-600',
  red: 'text-red-600',
  gray: 'text-gray-600',
};

export default function EmployeePortalStatsCard({
  value,
  label,
  icon,
  iconColor = 'blue',
  valueColor = 'default',
}: EmployeePortalStatsCardProps) {
  return (
    <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
      {icon && (
        <div className="flex items-center gap-3 mb-3">
          <div className={`p-3 rounded-lg border ${iconColorClasses[iconColor]}`}>
            {icon}
          </div>
        </div>
      )}
      <div className={`text-3xl font-bold mb-1 ${valueColorClasses[valueColor]}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
        {value}
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400">{label}</div>
    </Card>
  );
}
