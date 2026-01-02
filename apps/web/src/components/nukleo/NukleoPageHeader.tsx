import { ReactNode } from 'react';

interface NukleoPageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  compact?: boolean;
}

export default function NukleoPageHeader({ 
  title, 
  description, 
  actions,
  compact = false 
}: NukleoPageHeaderProps) {
  return (
    <div className={`relative rounded-2xl overflow-hidden -mt-4 -mx-4 px-4 ${compact ? 'pt-4 pb-5' : 'pt-6 pb-8'}`}>
      {/* Gradient Aurora Borealis */}
      <div className="absolute inset-0 bg-nukleo-gradient opacity-90" />
      
      {/* Texture Grain */}
      <div 
        className="absolute inset-0 opacity-20" 
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
          backgroundSize: '200px 200px'
        }} 
      />
      
      {/* Content */}
      <div className="relative flex items-center justify-between">
        <div>
          <h1 
            className={`font-black text-white mb-2 font-nukleo ${compact ? 'text-3xl' : 'text-5xl'}`}
          >
            {title}
          </h1>
          {description && (
            <p className={`text-white/80 ${compact ? 'text-base' : 'text-lg'}`}>
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
