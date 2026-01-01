import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui';

interface NukleoEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
}

export default function NukleoEmptyState({
  icon: Icon,
  title,
  description,
  action
}: NukleoEmptyStateProps) {
  const ActionIcon = action?.icon;
  
  return (
    <div className="glass-card p-12 rounded-xl border border-[#A7A2CF]/20 text-center">
      <div className="flex justify-center mb-6">
        <div className="p-6 rounded-2xl bg-[#523DC9]/10 border border-[#523DC9]/30">
          <Icon className="w-12 h-12 text-[#523DC9]" />
        </div>
      </div>
      <h3 
        className="text-2xl font-bold text-gray-900 dark:text-white mb-2" 
        style={{ fontFamily: 'Space Grotesk, sans-serif' }}
      >
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
        {description}
      </p>
      {action && (
        <Button onClick={action.onClick}>
          {ActionIcon && <ActionIcon className="w-4 h-4 mr-2" />}
          {action.label}
        </Button>
      )}
    </div>
  );
}
