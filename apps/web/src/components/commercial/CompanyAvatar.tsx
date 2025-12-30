'use client';

import { useState, useEffect } from 'react';
import { Company } from '@/lib/api/companies';
import { Building2 } from 'lucide-react';
import { clsx } from 'clsx';

interface CompanyAvatarProps {
  company: Company;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showRetry?: boolean;
  onError?: () => void;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

const sizeClassesFull = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

export default function CompanyAvatar({
  company,
  size = 'md',
  className,
  showRetry = true,
  onError,
}: CompanyAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(!!company.logo_url);
  const [retryCount, setRetryCount] = useState(0);
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(company.logo_url);

  const MAX_RETRIES = 3;
  const RETRY_DELAYS = [1000, 2000, 3000];

  // Get initials for fallback
  const getInitials = () => {
    const words = company.name.split(' ');
    if (words.length >= 2) {
      const firstWord = words[0];
      const lastWord = words[words.length - 1];
      if (firstWord && lastWord) {
        return (firstWord.charAt(0) + lastWord.charAt(0)).toUpperCase();
      }
    }
    return company.name.substring(0, 2).toUpperCase() || '?';
  };

  useEffect(() => {
    if (!company.logo_url) {
      setIsLoading(false);
      setCurrentLogoUrl(null);
      return;
    }

    let urlToUse = company.logo_url;

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

  const handleImageError = async () => {
    setIsLoading(false);
    
    if (retryCount >= MAX_RETRIES || !showRetry) {
      setImageError(true);
      onError?.();
      return;
    }

    const delay = RETRY_DELAYS[retryCount] || 3000;
    
    setTimeout(async () => {
      setRetryCount(prev => prev + 1);
      setIsLoading(true);
      
      try {
        const { companiesAPI } = await import('@/lib/api/companies');
        const refreshedCompany = await companiesAPI.get(company.id);
        
        if (refreshedCompany.logo_url && refreshedCompany.logo_url !== currentLogoUrl) {
          setCurrentLogoUrl(refreshedCompany.logo_url);
          setImageError(false);
        } else {
          setImageError(true);
          onError?.();
        }
      } catch (err) {
        setImageError(true);
        onError?.();
      }
    }, delay);
  };

  if (isLoading && currentLogoUrl && !imageError) {
    return (
      <div className={clsx(
        'rounded bg-gradient-to-br from-muted to-muted/50 animate-pulse flex items-center justify-center',
        sizeClassesFull[size],
        className
      )}>
        <div className="w-1/2 h-1/2 bg-muted-foreground/20 rounded" />
        <span className="sr-only">Chargement du logo...</span>
      </div>
    );
  }

  if (imageError || !currentLogoUrl) {
    return (
      <div className={clsx(
        'rounded bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 flex items-center justify-center',
        sizeClasses[size],
        className
      )}>
        {getInitials() !== '?' ? (
          <span className="font-medium text-primary-700 dark:text-primary-300">
            {getInitials()}
          </span>
        ) : (
          <Building2 className="text-primary-600 dark:text-primary-400" style={{ width: '60%', height: '60%' }} />
        )}
      </div>
    );
  }

  return (
    <img
      src={currentLogoUrl}
      alt={`Logo de ${company.name}`}
      className={clsx(
        'rounded object-cover transition-opacity duration-300 w-full h-full',
        isLoading ? 'opacity-0' : 'opacity-100',
        className
      )}
      loading="lazy"
      decoding="async"
      fetchPriority={size === 'xl' || size === 'lg' ? 'high' : 'low'}
      onLoad={handleImageLoad}
      onError={handleImageError}
      width={sizeClassesFull[size].includes('w-6') ? 24 : sizeClassesFull[size].includes('w-8') ? 32 : sizeClassesFull[size].includes('w-10') ? 40 : sizeClassesFull[size].includes('w-12') ? 48 : 64}
      height={sizeClassesFull[size].includes('h-6') ? 24 : sizeClassesFull[size].includes('h-8') ? 32 : sizeClassesFull[size].includes('h-10') ? 40 : sizeClassesFull[size].includes('h-12') ? 48 : 64}
    />
  );
}
