import { LucideIcon } from 'lucide-react';

interface NukleoStatsCardProps {
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
  value: string | number;
  label: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export default function NukleoStatsCard({
  icon: Icon,
  iconColor,
  iconBgColor,
  value,
  label,
  trend
}: NukleoStatsCardProps) {
  return (
    <div className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:scale-105 transition-transform duration-200">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-3 rounded-lg ${iconBgColor} border ${iconColor.replace('text-', 'border-')}/30`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        {trend && (
          <div className={`text-sm font-semibold ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isPositive ? '+' : ''}{trend.value}
          </div>
        )}
      </div>
      <div 
        className="text-3xl font-bold text-gray-900 dark:text-white mb-1" 
        style={{ fontFamily: 'Space Grotesk, sans-serif' }}
      >
        {value}
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400">{label}</div>
    </div>
  );
}
