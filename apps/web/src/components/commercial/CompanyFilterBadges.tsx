'use client';

import { Badge } from '@/components/ui';
import { X, Search } from 'lucide-react';

interface CompanyFilterBadgesProps {
  filters: {
    country?: string | string[];
    is_client?: string | string[];
    search?: string;
  };
  onRemoveFilter: (key: string, value?: string) => void;
  onClearAll: () => void;
}

export default function CompanyFilterBadges({
  filters,
  onRemoveFilter,
  onClearAll,
}: CompanyFilterBadgesProps) {
  const countryFilters = Array.isArray(filters.country) ? filters.country : filters.country ? [filters.country] : [];
  const isClientFilters = Array.isArray(filters.is_client) ? filters.is_client : filters.is_client ? [filters.is_client] : [];
  
  const hasActiveFilters = countryFilters.length > 0 || isClientFilters.length > 0 || filters.search;

  if (!hasActiveFilters) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground">Filtres actifs:</span>
      
      {/* Country filters */}
      {countryFilters.map((country) => (
        <Badge key={`country-${country}`} variant="default" className="flex items-center gap-1.5 px-2 py-1">
          <span>Pays: {country}</span>
          <button
            onClick={() => onRemoveFilter('country', country)}
            className="hover:text-destructive transition-colors"
            aria-label={`Supprimer le filtre pays: ${country}`}
          >
            <X className="w-3 h-3" />
          </button>
        </Badge>
      ))}
      
      {/* Client filters */}
      {isClientFilters.map((isClient) => (
        <Badge key={`client-${isClient}`} variant="default" className="flex items-center gap-1.5 px-2 py-1">
          <span>Client: {isClient === 'yes' ? 'Oui' : 'Non'}</span>
          <button
            onClick={() => onRemoveFilter('is_client', isClient)}
            className="hover:text-destructive transition-colors"
            aria-label={`Supprimer le filtre client: ${isClient}`}
          >
            <X className="w-3 h-3" />
          </button>
        </Badge>
      ))}
      
      {/* Search filter */}
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
