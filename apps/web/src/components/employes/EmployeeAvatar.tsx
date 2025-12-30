'use client';

import { useState, useEffect } from 'react';
import { Employee } from '@/lib/api/employees';
import { UserCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface EmployeeAvatarProps {
  employee: Employee;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
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

export default function EmployeeAvatar({
  employee,
  size = 'md',
  className,
}: EmployeeAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(!!employee.photo_url);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | null>(employee.photo_url);

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
        console.warn('Failed to cache photo URL:', e);
      }
    }
  };

  const handleImageError = () => {
    setIsLoading(false);
    setImageError(true);
  };

  if (isLoading && currentPhotoUrl && !imageError) {
    return (
      <div className={clsx(
        'rounded-full bg-gradient-to-br from-muted to-muted/50 animate-pulse flex items-center justify-center',
        sizeClassesFull[size],
        className
      )}>
        <div className="w-1/2 h-1/2 bg-muted-foreground/20 rounded-full" />
      </div>
    );
  }

  if (imageError || !currentPhotoUrl) {
    return (
      <div className={clsx(
        'rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 flex items-center justify-center',
        sizeClasses[size],
        className
      )}>
        {getInitials() !== '?' ? (
          <span className="font-medium text-primary-700 dark:text-primary-300">
            {getInitials()}
          </span>
        ) : (
          <UserCircle className="text-primary-600 dark:text-primary-400" style={{ width: '60%', height: '60%' }} />
        )}
      </div>
    );
  }

  return (
    <img
      src={currentPhotoUrl}
      alt={`Photo de profil de ${employee.first_name} ${employee.last_name}`}
      className={clsx(
        'rounded-full object-cover transition-opacity duration-300',
        isLoading ? 'opacity-0' : 'opacity-100',
        sizeClassesFull[size],
        className
      )}
      loading="lazy"
      decoding="async"
      onLoad={handleImageLoad}
      onError={handleImageError}
      width={sizeClassesFull[size].includes('w-6') ? 24 : sizeClassesFull[size].includes('w-8') ? 32 : sizeClassesFull[size].includes('w-10') ? 40 : sizeClassesFull[size].includes('w-12') ? 48 : 64}
      height={sizeClassesFull[size].includes('h-6') ? 24 : sizeClassesFull[size].includes('h-8') ? 32 : sizeClassesFull[size].includes('h-10') ? 40 : sizeClassesFull[size].includes('h-12') ? 48 : 64}
    />
  );
}
