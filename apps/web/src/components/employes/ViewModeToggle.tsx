'use client';

import { List, Grid } from 'lucide-react';
import { clsx } from 'clsx';

export type ViewMode = 'list' | 'gallery';

interface ViewModeToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  className?: string;
}

export default function ViewModeToggle({
  value,
  onChange,
  className,
}: ViewModeToggleProps) {
  return (
    <div className={clsx('flex border border-border rounded-md overflow-hidden', className)}>
      <button
        onClick={() => onChange('list')}
        className={clsx(
          'px-2 py-1.5 transition-colors text-xs',
          value === 'list'
            ? 'bg-primary text-white'
            : 'bg-background text-foreground hover:bg-muted'
        )}
        aria-label="Vue liste"
      >
        <List className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => onChange('gallery')}
        className={clsx(
          'px-2 py-1.5 transition-colors text-xs',
          value === 'gallery'
            ? 'bg-primary text-white'
            : 'bg-background text-foreground hover:bg-muted'
        )}
        aria-label="Vue galerie"
      >
        <Grid className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
