'use client';

import { Company } from '@/lib/api/companies';
import Card from '@/components/ui/Card';
import { Building2, Globe, MapPin, CheckCircle2, XCircle } from 'lucide-react';
import { clsx } from 'clsx';
import Badge from '@/components/ui/Badge';

interface CompaniesGalleryProps {
  companies: Company[];
  onCompanyClick?: (company: Company) => void;
  className?: string;
}

export default function CompaniesGallery({
  companies,
  onCompanyClick,
  className,
}: CompaniesGalleryProps) {
  if (companies.length === 0) {
    return (
      <div className={clsx('text-center py-12', className)}>
        <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Aucune entreprise trouvée</p>
      </div>
    );
  }

  return (
    <div className={clsx('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6', className)}>
      {companies.map((company) => (
        <Card
          key={company.id}
          className="cursor-pointer hover:shadow-xl transition-all duration-200 overflow-hidden group"
          onClick={() => onCompanyClick?.(company)}
        >
          <div className="flex flex-col">
            {/* Logo rectangulaire */}
            <div className="w-full aspect-[4/3] bg-muted overflow-hidden flex items-center justify-center">
              {company.logo_url ? (
                <img
                  src={company.logo_url}
                  alt={company.name}
                  className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-200"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 flex items-center justify-center">
                  <Building2 className="w-20 h-20 text-primary-600 dark:text-primary-400" />
                </div>
              )}
            </div>

            {/* Contenu de la carte */}
            <div className="p-5">
              {/* Nom et statut client */}
              <div className="mb-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-lg text-foreground flex-1">
                    {company.name}
                  </h3>
                  {company.is_client ? (
                    <Badge variant="success">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Client
                    </Badge>
                  ) : (
                    <Badge variant="default">
                      <XCircle className="w-3 h-3 mr-1" />
                      Prospect
                    </Badge>
                  )}
                </div>
                {company.parent_company_name && (
                  <p className="text-xs text-muted-foreground">
                    Filiale de {company.parent_company_name}
                  </p>
                )}
              </div>

              {/* Informations clés */}
              <div className="space-y-2.5">
                {company.website && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Globe className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{company.website}</span>
                  </div>
                )}
                {company.country && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">
                      {[company.city, company.country].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}
                {company.contacts_count !== undefined && (
                  <div className="text-xs text-muted-foreground">
                    {company.contacts_count} contact{company.contacts_count !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
