'use client';

import { useState, useEffect } from 'react';
import { Contact } from '@/lib/api/contacts';
import { UserCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface ContactAvatarProps {
  contact: Contact;
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

export default function ContactAvatar({
  contact,
  size = 'md',
  className,
  showRetry = true,
  onError,
}: ContactAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(!!contact.photo_url); // Only loading if photo_url exists
  const [retryCount, setRetryCount] = useState(0);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | null>(contact.photo_url);

  const MAX_RETRIES = 3;
  const RETRY_DELAYS = [1000, 2000, 3000]; // Exponential backoff

  // Get initials for fallback
  const getInitials = () => {
    const first = contact.first_name?.charAt(0) || '';
    const last = contact.last_name?.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
  };

  // Check if URL is cached and still valid
  useEffect(() => {
    if (!contact.photo_url) {
      setIsLoading(false);
      setCurrentPhotoUrl(null);
      return;
    }

    let urlToUse = contact.photo_url;

    // Check localStorage cache (only in browser)
    if (typeof window !== 'undefined') {
      const cacheKey = `photo_${contact.id}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        try {
          const { url, expiresAt } = JSON.parse(cached);
          // If cache is still valid (more than 1 day remaining), use it
          if (expiresAt > Date.now() + 86400000) {
            urlToUse = url;
          } else {
            // Cache expired, remove it
            localStorage.removeItem(cacheKey);
          }
        } catch (e) {
          // Invalid cache, remove it
          localStorage.removeItem(cacheKey);
        }
      }
    }

    // Set the photo URL and check if image is already loaded
    setCurrentPhotoUrl(urlToUse);
    setImageError(false);
    
    // Check if image is already loaded in browser cache
    if (typeof window !== 'undefined' && urlToUse) {
      const img = new Image();
      img.onload = () => {
        // Image is already loaded or loads quickly
        setIsLoading(false);
      };
      img.onerror = () => {
        // Image failed to load
        setIsLoading(false);
        setImageError(true);
      };
      img.src = urlToUse;
      
      // If image is already complete (cached), set loading to false immediately
      if (img.complete) {
        setIsLoading(false);
      } else {
        setIsLoading(true);
      }
    } else {
      setIsLoading(true);
    }
  }, [contact.id, contact.photo_url]);

  // Cache successful loads
  const handleImageLoad = () => {
    setIsLoading(false);
    setImageError(false);
    
    // Cache the URL with expiration (6 days from now, since presigned URLs last 7 days)
    if (currentPhotoUrl && typeof window !== 'undefined') {
      const cacheKey = `photo_${contact.id}`;
      const cacheData = {
        url: currentPhotoUrl,
        expiresAt: Date.now() + (6 * 24 * 60 * 60 * 1000), // 6 days
      };
      try {
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      } catch (e) {
        // localStorage might be full or unavailable, ignore
        console.warn('Failed to cache photo URL:', e);
      }
    }
  };

  // Handle image load error with retry
  const handleImageError = async () => {
    setIsLoading(false);
    
    // If we've already retried, show fallback
    if (retryCount >= MAX_RETRIES || !showRetry) {
      setImageError(true);
      onError?.();
      return;
    }

    // Retry with delay
    const delay = RETRY_DELAYS[retryCount] || 3000;
    
    setTimeout(async () => {
      setRetryCount(prev => prev + 1);
      setIsLoading(true);
      
      // Try to refresh the photo URL by calling the API
      try {
        // Import contactsAPI dynamically to avoid circular dependencies
        const { contactsAPI } = await import('@/lib/api/contacts');
        const refreshedContact = await contactsAPI.get(contact.id);
        
        if (refreshedContact.photo_url && refreshedContact.photo_url !== currentPhotoUrl) {
          setCurrentPhotoUrl(refreshedContact.photo_url);
          setImageError(false);
        } else {
          // No new URL available, show fallback
          setImageError(true);
          onError?.();
        }
      } catch (err) {
        // API call failed, show fallback
        setImageError(true);
        onError?.();
      }
    }, delay);
  };

  // This effect is now handled in the main useEffect above

  // Show placeholder/skeleton while loading
  if (isLoading && currentPhotoUrl && !imageError) {
    return (
      <div className={clsx(
        'rounded-full bg-gradient-to-br from-muted to-muted/50 animate-pulse flex items-center justify-center',
        sizeClassesFull[size],
        className
      )}>
        <div className="w-1/2 h-1/2 bg-muted-foreground/20 rounded-full" />
        <span className="sr-only">Chargement de la photo...</span>
      </div>
    );
  }

  // Show fallback (initials or icon) if error or no photo
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

  // Show image with optimized loading
  // Note: Using <img> instead of Next.js Image because:
  // 1. Presigned URLs are dynamic and change frequently
  // 2. Next.js Image requires static domains or complex remotePatterns config
  // 3. We already have retry logic and error handling
  return (
    <img
      src={currentPhotoUrl}
      alt={`Photo de profil de ${contact.first_name} ${contact.last_name}`}
      className={clsx(
        'rounded-full object-cover transition-opacity duration-300',
        isLoading ? 'opacity-0' : 'opacity-100',
        sizeClassesFull[size],
        className
      )}
      loading="lazy"
      decoding="async"
      fetchPriority={size === 'xl' || size === 'lg' ? 'high' : 'low'} // Prioritize larger avatars
      onLoad={handleImageLoad}
      onError={handleImageError}
      // Add width/height hints for better layout stability
      width={sizeClassesFull[size].includes('w-6') ? 24 : sizeClassesFull[size].includes('w-8') ? 32 : sizeClassesFull[size].includes('w-10') ? 40 : sizeClassesFull[size].includes('w-12') ? 48 : 64}
      height={sizeClassesFull[size].includes('h-6') ? 24 : sizeClassesFull[size].includes('h-8') ? 32 : sizeClassesFull[size].includes('h-10') ? 40 : sizeClassesFull[size].includes('h-12') ? 48 : 64}
    />
  );
}
