'use client';

import { useState, useEffect } from 'react';
import { Client } from '@/lib/api/clients';
import { UserCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface ClientAvatarProps {
  client: Client;
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

export default function ClientAvatar({
  client,
  size = 'md',
  className,
}: ClientAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(!!client.photo_url);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | null>(client.photo_url || null);

  const getInitials = () => {
    const first = client.first_name?.charAt(0) || '';
    const last = client.last_name?.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
  };

  useEffect(() => {
    if (!client.photo_url) {
      setIsLoading(false);
      setCurrentPhotoUrl(null);
      return;
    }

    setCurrentPhotoUrl(client.photo_url);
    setImageError(false);
    
    if (typeof window !== 'undefined' && client.photo_url) {
      const img = new Image();
      img.onload = () => setIsLoading(false);
      img.onerror = () => {
        setIsLoading(false);
        setImageError(true);
      };
      img.src = client.photo_url;
      
      if (img.complete) {
        setIsLoading(false);
      } else {
        setIsLoading(true);
      }
    } else {
      setIsLoading(true);
    }
  }, [client.id, client.photo_url]);

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
      alt={`Photo de profil de ${client.first_name} ${client.last_name}`}
      className={clsx(
        'rounded-full object-cover transition-opacity duration-300',
        isLoading ? 'opacity-0' : 'opacity-100',
        sizeClassesFull[size],
        className
      )}
      loading="lazy"
      decoding="async"
      onLoad={() => setIsLoading(false)}
      onError={() => {
        setIsLoading(false);
        setImageError(true);
      }}
      width={sizeClassesFull[size].includes('w-6') ? 24 : sizeClassesFull[size].includes('w-8') ? 32 : sizeClassesFull[size].includes('w-10') ? 40 : sizeClassesFull[size].includes('w-12') ? 48 : 64}
      height={sizeClassesFull[size].includes('h-6') ? 24 : sizeClassesFull[size].includes('h-8') ? 32 : sizeClassesFull[size].includes('h-10') ? 40 : sizeClassesFull[size].includes('h-12') ? 48 : 64}
    />
  );
}
