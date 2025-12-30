'use client';

import { Employee } from '@/lib/api/employees';
import Card from '@/components/ui/Card';
import { UserCircle, Mail, Phone, Loader2, Calendar } from 'lucide-react';
import { clsx } from 'clsx';
import { useEffect, useRef, useState } from 'react';
// import EmployeeAvatar from './EmployeeAvatar'; // Not used in this component

interface EmployeesGalleryProps {
  employees: Employee[];
  onEmployeeClick?: (employee: Employee) => void;
  className?: string;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}

function GalleryPhoto({ employee }: { employee: Employee }) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(!!employee.photo_url);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | null>(employee.photo_url || null);

  const getInitials = () => {
    const first = employee.first_name?.charAt(0) || '';
    const last = employee.last_name?.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
  };

  useEffect(() => {
    if (!employee.photo_url) {
      setIsLoading(false);
      setCurrentPhotoUrl(null);
      return;
    }

    let urlToUse = employee.photo_url;

    if (typeof window !== 'undefined') {
      const cacheKey = `employee_photo_${employee.id}`;
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

    setCurrentPhotoUrl(urlToUse);
    setImageError(false);
    
    if (typeof window !== 'undefined' && urlToUse) {
      const img = new Image();
      img.onload = () => setIsLoading(false);
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
  }, [employee.id, employee.photo_url]);

  const handleImageLoad = () => {
    setIsLoading(false);
    setImageError(false);
    
    if (currentPhotoUrl && typeof window !== 'undefined') {
      const cacheKey = `employee_photo_${employee.id}`;
      const cacheData = {
        url: currentPhotoUrl,
        expiresAt: Date.now() + (6 * 24 * 60 * 60 * 1000),
      };
      try {
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      } catch (e) {
        // Ignore
      }
    }
  };

  if (isLoading && currentPhotoUrl && !imageError) {
    return (
      <div className="w-full h-48 bg-gradient-to-br from-muted to-muted/50 animate-pulse rounded-lg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (imageError || !currentPhotoUrl) {
    return (
      <div className="w-full h-48 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 rounded-lg flex items-center justify-center">
        {getInitials() !== '?' ? (
          <span className="text-4xl font-bold text-primary-700 dark:text-primary-300">
            {getInitials()}
          </span>
        ) : (
          <UserCircle className="w-16 h-16 text-primary-600 dark:text-primary-400" />
        )}
      </div>
    );
  }

  return (
    <img
      src={currentPhotoUrl}
      alt={`${employee.first_name} ${employee.last_name}`}
      className={clsx(
        'w-full h-48 object-cover rounded-lg transition-opacity duration-300',
        isLoading ? 'opacity-0' : 'opacity-100'
      )}
      loading="lazy"
      onLoad={handleImageLoad}
      onError={() => setImageError(true)}
    />
  );
}

export default function EmployeesGallery({
  employees,
  onEmployeeClick,
  className,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
}: EmployeesGalleryProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore || !onLoadMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loadingMore) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current && loadMoreRef.current) {
        observerRef.current.unobserve(loadMoreRef.current);
      }
    };
  }, [hasMore, loadingMore, onLoadMore]);

  if (employees.length === 0) {
    return (
      <Card>
        <div className="py-12 text-center text-muted-foreground">
          Aucun employé trouvé
        </div>
      </Card>
    );
  }

  return (
    <div className={clsx('space-y-4', className)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {employees.map((employee) => (
          <Card
            key={employee.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => onEmployeeClick?.(employee)}
          >
            <div className="space-y-3">
              <GalleryPhoto employee={employee} />
              <div className="px-3 pb-3">
                <h3 className="font-semibold text-foreground">
                  {employee.first_name} {employee.last_name}
                </h3>
                {employee.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Mail className="w-3.5 h-3.5" />
                    <span className="truncate">{employee.email}</span>
                  </div>
                )}
                {employee.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{employee.phone}</span>
                  </div>
                )}
                {employee.hire_date && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Embauché le {new Date(employee.hire_date).toLocaleDateString('fr-FR')}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {hasMore && (
        <div ref={loadMoreRef} className="py-4 text-center">
          {loadingMore ? (
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
          ) : (
            <div className="text-sm text-muted-foreground">Chargement...</div>
          )}
        </div>
      )}
    </div>
  );
}
