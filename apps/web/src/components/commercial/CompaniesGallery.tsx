'use client';

import { Company } from '@/lib/api/companies';
import Card from '@/components/ui/Card';
import { Building2, Globe, Mail, Phone, MapPin, Loader2, Linkedin, Facebook, Instagram, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useEffect, useRef, useState } from 'react';

interface CompaniesGalleryProps {
  companies: Company[];
  onCompanyClick?: (company: Company) => void;
  className?: string;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}

// Component for gallery logo with error handling
function GalleryLogo({ company }: { company: Company }) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(!!company.logo_url);
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(company.logo_url);

  useEffect(() => {
    if (!company.logo_url) {
      setIsLoading(false);
      setCurrentLogoUrl(null);
      return;
    }

    let urlToUse = company.logo_url;

    // Check localStorage cache
    if (typeof window !== 'undefined') {
      const cacheKey = `logo_${company.id}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        try {
          const { url, expiresAt } = JSON.parse(cached);
          if (expiresAt > Date.now() + 86400000) {
            urlToUse = url;
          } else {
            localStorage.removeItem(cacheKey);
          }
        } catch (e) {
          localStorage.removeItem(cacheKey);
        }
      }
    }

    setCurrentLogoUrl(urlToUse);
    setImageError(false);
    
    if (typeof window !== 'undefined' && urlToUse) {
      const img = new Image();
      img.onload = () => {
        setIsLoading(false);
      };
      img.onerror = () => {
        setIsLoading(false);
        setImageError(true);
      };
      img.src = urlToUse;
      
      if (img.complete) {
        setIsLoading(false);
      } else {
        setIsLoading(true);
      }
    } else {
      setIsLoading(true);
    }
  }, [company.id, company.logo_url]);

  const handleImageLoad = () => {
    setIsLoading(false);
    setImageError(false);
    
    if (currentLogoUrl && typeof window !== 'undefined') {
      const cacheKey = `logo_${company.id}`;
      const cacheData = {
        url: currentLogoUrl,
        expiresAt: Date.now() + (6 * 24 * 60 * 60 * 1000),
      };
      try {
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      } catch (e) {
        console.warn('Failed to cache logo URL:', e);
      }
    }
  };

  // Loading skeleton
  if (isLoading && currentLogoUrl && !imageError) {
    return (
      <div className="w-full h-32 bg-muted overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse" />
      </div>
    );
  }

  // Fallback
  if (imageError || !currentLogoUrl) {
    return (
      <div className="w-full h-32 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 flex items-center justify-center">
        <Building2 className="w-12 h-12 text-primary-600 dark:text-primary-400" />
      </div>
    );
  }

  // Image
  return (
    <img
      src={currentLogoUrl}
      alt={`Logo de ${company.name}`}
      className={clsx(
        'w-full h-32 object-contain object-center bg-white dark:bg-gray-800 p-2',
        isLoading ? 'opacity-0' : 'opacity-100'
      )}
      loading="lazy"
      decoding="async"
      onLoad={handleImageLoad}
      onError={() => setImageError(true)}
    />
  );
}

export default function CompaniesGallery({
  companies,
  onCompanyClick,
  className,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
}: CompaniesGalleryProps) {
  const observerTarget = useRef<HTMLDivElement>(null);

  // Intersection Observer pour le scroll infini
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loadingMore && onLoadMore) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadingMore, onLoadMore]);

  if (companies.length === 0 && !loadingMore) {
    return (
      <div className={clsx('text-center py-12', className)}>
        <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Aucune entreprise trouvée</p>
      </div>
    );
  }

  return (
    <div className={clsx('space-y-6', className)}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {companies.map((company) => (
          <Card
            key={company.id}
            className="cursor-pointer hover:shadow-xl transition-all duration-200 overflow-hidden group"
            onClick={() => onCompanyClick?.(company)}
          >
            <div className="flex flex-col">
              {/* Logo */}
              <div className="w-full h-32 bg-white dark:bg-gray-800 border-b border-border">
                <GalleryLogo company={company} />
              </div>

              {/* Contenu de la carte */}
              <div className="p-5">
                {/* Nom et statut client */}
                <div className="mb-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-lg text-foreground flex-1">
                      {company.name}
                    </h3>
                    {company.is_client && (
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
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
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="truncate text-primary hover:text-primary-600 transition-colors"
                        title="Visiter le site web"
                      >
                        Site web
                      </a>
                    </div>
                  )}
                  {company.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground group/email">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate flex-1">{company.email}</span>
                      <a
                        href={`mailto:${company.email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="opacity-0 group-hover/email:opacity-100 text-primary hover:text-primary-600 transition-all"
                        title="Envoyer un email"
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                    </div>
                  )}
                  {company.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground group/phone">
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate flex-1">{company.phone}</span>
                      <a
                        href={`tel:${company.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="opacity-0 group-hover/phone:opacity-100 text-primary hover:text-primary-600 transition-all"
                        title="Appeler"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    </div>
                  )}
                  {(company.city || company.country) && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">
                        {[company.city, company.country].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}
                  {(company.linkedin || company.facebook || company.instagram) && (
                    <div className="flex items-center gap-2 pt-1">
                      {company.linkedin && (
                        <a
                          href={company.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-muted-foreground hover:text-primary transition-colors"
                          title="LinkedIn"
                        >
                          <Linkedin className="w-4 h-4" />
                        </a>
                      )}
                      {company.facebook && (
                        <a
                          href={company.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-muted-foreground hover:text-primary transition-colors"
                          title="Facebook"
                        >
                          <Facebook className="w-4 h-4" />
                        </a>
                      )}
                      {company.instagram && (
                        <a
                          href={company.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-muted-foreground hover:text-primary transition-colors"
                          title="Instagram"
                        >
                          <Instagram className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      {/* Intersection Observer target pour le scroll infini */}
      {hasMore && (
        <div ref={observerTarget} className="flex justify-center py-8">
          {loadingMore && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Chargement...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
