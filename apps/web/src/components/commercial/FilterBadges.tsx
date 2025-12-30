'use client';

import { Badge } from '@/components/ui';
import { X, Search, Building2 } from 'lucide-react';

interface FilterBadgesProps {
  filters: {
    city?: string;
    phone?: string;
    circle?: string;
    company?: string;
    search?: string;
  };
  onRemoveFilter: (key: string) => void;
  onClearAll: () => void;
  companies?: Array<{ id: number; name: string }>;
}

export default function FilterBadges({
  filters,
  onRemoveFilter,
  onClearAll,
  companies = [],
}: FilterBadgesProps) {
  const hasActiveFilters = filters.city || filters.phone || filters.circle || filters.company || filters.search;

  if (!hasActiveFilters) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground">Filtres actifs:</span>
      
      {filters.city && (
        <Badge variant="default" className="flex items-center gap-1.5 px-2 py-1">
          <span>Ville: {filters.city}</span>
          <button
            onClick={() => onRemoveFilter('city')}
            className="hover:text-destructive transition-colors"
            aria-label={`Supprimer le filtre ville: ${filters.city}`}
          >
            <X className="w-3 h-3" />
          </button>
        </Badge>
      )}
      
      {filters.phone && (
        <Badge variant="default" className="flex items-center gap-1.5 px-2 py-1">
          <span>Téléphone: {filters.phone}</span>
          <button
            onClick={() => onRemoveFilter('phone')}
            className="hover:text-destructive transition-colors"
            aria-label={`Supprimer le filtre téléphone: ${filters.phone}`}
          >
            <X className="w-3 h-3" />
          </button>
        </Badge>
      )}
      
      {filters.circle && (
        <Badge variant="default" className="flex items-center gap-1.5 px-2 py-1">
          <span>Cercle: {filters.circle.charAt(0).toUpperCase() + filters.circle.slice(1)}</span>
          <button
            onClick={() => onRemoveFilter('circle')}
            className="hover:text-destructive transition-colors"
            aria-label={`Supprimer le filtre cercle: ${filters.circle}`}
          >
            <X className="w-3 h-3" />
          </button>
        </Badge>
      )}
      
      {filters.company && (
        <Badge variant="default" className="flex items-center gap-1.5 px-2 py-1">
          <Building2 className="w-3 h-3" />
          <span>Entreprise: {companies.find(c => c.id.toString() === filters.company)?.name || filters.company}</span>
          <button
            onClick={() => onRemoveFilter('company')}
            className="hover:text-destructive transition-colors"
            aria-label="Supprimer le filtre entreprise"
          >
            <X className="w-3 h-3" />
          </button>
        </Badge>
      )}
      
      {filters.search && (
        <Badge variant="default" className="flex items-center gap-1.5 px-2 py-1">
          <Search className="w-3 h-3" />
          <span>Recherche: "{filters.search}"</span>
          <button
            onClick={() => onRemoveFilter('search')}
            className="hover:text-destructive transition-colors"
            aria-label="Supprimer la recherche"
          >
            <X className="w-3 h-3" />
          </button>
        </Badge>
      )}
      
      <button
        onClick={onClearAll}
        className="text-xs text-primary hover:text-primary-600 hover:underline transition-colors"
      >
        Effacer tous les filtres
      </button>
    </div>
  );
}
