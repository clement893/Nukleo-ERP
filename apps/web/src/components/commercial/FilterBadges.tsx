'use client';

import { Badge } from '@/components/ui';
import { X, Search, Building2 } from 'lucide-react';

interface FilterBadgesProps {
  filters: {
    city?: string | string[];
    phone?: string | string[];
    circle?: string | string[];
    company?: string | string[];
    search?: string;
  };
  onRemoveFilter: (key: string, value?: string) => void;
  onClearAll: () => void;
  companies?: Array<{ id: number; name: string }>;
}

export default function FilterBadges({
  filters,
  onRemoveFilter,
  onClearAll,
  companies = [],
}: FilterBadgesProps) {
  // Normalize filters to arrays
  const cityFilters = Array.isArray(filters.city) ? filters.city : filters.city ? [filters.city] : [];
  const phoneFilters = Array.isArray(filters.phone) ? filters.phone : filters.phone ? [filters.phone] : [];
  const circleFilters = Array.isArray(filters.circle) ? filters.circle : filters.circle ? [filters.circle] : [];
  const companyFilters = Array.isArray(filters.company) ? filters.company : filters.company ? [filters.company] : [];
  
  const hasActiveFilters = cityFilters.length > 0 || phoneFilters.length > 0 || circleFilters.length > 0 || companyFilters.length > 0 || filters.search;

  if (!hasActiveFilters) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground">Filtres actifs:</span>
      
      {/* City filters */}
      {cityFilters.map((city) => (
        <Badge key={`city-${city}`} variant="default" className="flex items-center gap-1.5 px-2 py-1">
          <span>Ville: {city}</span>
          <button
            onClick={() => onRemoveFilter('city', city)}
            className="hover:text-destructive transition-colors"
            aria-label={`Supprimer le filtre ville: ${city}`}
          >
            <X className="w-3 h-3" />
          </button>
        </Badge>
      ))}
      
      {/* Phone filters */}
      {phoneFilters.map((phone) => (
        <Badge key={`phone-${phone}`} variant="default" className="flex items-center gap-1.5 px-2 py-1">
          <span>Téléphone: {phone}</span>
          <button
            onClick={() => onRemoveFilter('phone', phone)}
            className="hover:text-destructive transition-colors"
            aria-label={`Supprimer le filtre téléphone: ${phone}`}
          >
            <X className="w-3 h-3" />
          </button>
        </Badge>
      ))}
      
      {/* Circle filters */}
      {circleFilters.map((circle) => (
        <Badge key={`circle-${circle}`} variant="default" className="flex items-center gap-1.5 px-2 py-1">
          <span>Cercle: {circle.charAt(0).toUpperCase() + circle.slice(1)}</span>
          <button
            onClick={() => onRemoveFilter('circle', circle)}
            className="hover:text-destructive transition-colors"
            aria-label={`Supprimer le filtre cercle: ${circle}`}
          >
            <X className="w-3 h-3" />
          </button>
        </Badge>
      ))}
      
      {/* Company filters */}
      {companyFilters.map((companyId) => {
        const company = companies.find(c => c.id.toString() === companyId);
        return (
          <Badge key={`company-${companyId}`} variant="default" className="flex items-center gap-1.5 px-2 py-1">
            <Building2 className="w-3 h-3" />
            <span>Entreprise: {company?.name || companyId}</span>
            <button
              onClick={() => onRemoveFilter('company', companyId)}
              className="hover:text-destructive transition-colors"
              aria-label={`Supprimer le filtre entreprise: ${company?.name || companyId}`}
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        );
      })}
      
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
