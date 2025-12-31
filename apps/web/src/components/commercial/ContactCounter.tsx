'use client';

import { Badge } from '@/components/ui';
import { Users } from 'lucide-react';

interface ContactCounterProps {
  filtered: number;
  total: number;
  showFilteredBadge?: boolean;
}

export default function ContactCounter({
  filtered,
  total,
  showFilteredBadge = false,
}: ContactCounterProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 dark:bg-primary/20 rounded-lg">
        <Users className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">
          {total > 0 ? (
            <>
              <span className="text-primary">{total}</span>
              {filtered !== total && filtered > 0 && (
                <> / <span className="text-muted-foreground">{filtered}</span> affiché{filtered > 1 ? 's' : ''}</>
              )}
              {' '}contact{total > 1 ? 's' : ''}
            </>
          ) : (
            <>Aucun contact</>
          )}
        </span>
      </div>
      {filtered !== total && showFilteredBadge && (
        <Badge variant="default" className="text-xs">
          Filtré{filtered !== total ? 's' : ''}
        </Badge>
      )}
    </div>
  );
}
