'use client';

import { Contact } from '@/lib/api/contacts';
import Card from '@/components/ui/Card';
import { UserCircle, Building2, Mail, Phone, MapPin, Loader2, Linkedin } from 'lucide-react';
import { clsx } from 'clsx';
import { useEffect, useRef, useState } from 'react';

interface ContactsGalleryProps {
  contacts: Contact[];
  onContactClick?: (contact: Contact) => void;
  className?: string;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}

// Component for gallery photo with error handling and retry
function GalleryPhoto({ contact }: { contact: Contact }) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | null>(contact.photo_url);

  const MAX_RETRIES = 2; // Fewer retries for gallery (larger images)

  const getInitials = () => {
    const first = contact.first_name?.charAt(0) || '';
    const last = contact.last_name?.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
  };

  // Check cache
  useEffect(() => {
    if (!contact.photo_url) {
      setIsLoading(false);
      return;
    }

    // Check localStorage cache (only in browser)
    if (typeof window !== 'undefined') {
      const cacheKey = `photo_${contact.id}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        try {
          const { url, expiresAt } = JSON.parse(cached);
          if (expiresAt > Date.now() + 86400000) {
            setCurrentPhotoUrl(url);
            return;
          } else {
            localStorage.removeItem(cacheKey);
          }
        } catch (e) {
          localStorage.removeItem(cacheKey);
        }
      }
    }

    setCurrentPhotoUrl(contact.photo_url);
  }, [contact.id, contact.photo_url]);

  const handleImageLoad = () => {
    setIsLoading(false);
    setImageError(false);
    
    if (currentPhotoUrl && typeof window !== 'undefined') {
      const cacheKey = `photo_${contact.id}`;
      const cacheData = {
        url: currentPhotoUrl,
        expiresAt: Date.now() + (6 * 24 * 60 * 60 * 1000),
      };
      try {
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      } catch (e) {
        // localStorage might be full or unavailable, ignore
        console.warn('Failed to cache photo URL:', e);
      }
    }
  };

  const handleImageError = async () => {
    setIsLoading(false);
    
    if (retryCount >= MAX_RETRIES || !contact.photo_url) {
      setImageError(true);
      return;
    }

    setTimeout(async () => {
      setRetryCount(prev => prev + 1);
      setIsLoading(true);
      
      try {
        const { contactsAPI } = await import('@/lib/api/contacts');
        const refreshedContact = await contactsAPI.get(contact.id);
        
        if (refreshedContact.photo_url && refreshedContact.photo_url !== currentPhotoUrl) {
          setCurrentPhotoUrl(refreshedContact.photo_url);
          setImageError(false);
        } else {
          setImageError(true);
        }
      } catch (err) {
        setImageError(true);
      }
    }, 1000 * (retryCount + 1));
  };

  useEffect(() => {
    if (contact.photo_url && contact.photo_url !== currentPhotoUrl) {
      setImageError(false);
      setRetryCount(0);
      setIsLoading(true);
      setCurrentPhotoUrl(contact.photo_url);
    }
  }, [contact.photo_url, currentPhotoUrl]);

  // Loading skeleton
  if (isLoading && currentPhotoUrl && !imageError) {
    return (
      <div className="w-full aspect-[3/4] bg-muted overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse" />
      </div>
    );
  }

  // Fallback
  if (imageError || !currentPhotoUrl) {
    return (
      <div className="w-full aspect-[3/4] bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 flex items-center justify-center">
        {getInitials() !== '?' ? (
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-primary-500 dark:bg-primary-600 flex items-center justify-center mx-auto mb-2">
              <span className="text-2xl font-bold text-white">{getInitials()}</span>
            </div>
            <p className="text-sm text-primary-700 dark:text-primary-300 font-medium">
              {contact.first_name} {contact.last_name}
            </p>
          </div>
        ) : (
          <UserCircle className="w-20 h-20 text-primary-600 dark:text-primary-400" />
        )}
      </div>
    );
  }

  // Image
  return (
    <img
      src={currentPhotoUrl}
      alt={`Photo de profil de ${contact.first_name} ${contact.last_name}`}
      className={clsx(
        'w-full h-full object-cover object-center group-hover:scale-105 transition-all duration-300',
        isLoading ? 'opacity-0' : 'opacity-100'
      )}
      loading="lazy"
      decoding="async"
      onLoad={handleImageLoad}
      onError={handleImageError}
    />
  );
}

export default function ContactsGallery({
  contacts,
  onContactClick,
  className,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
}: ContactsGalleryProps) {
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

  if (contacts.length === 0 && !loadingMore) {
    return (
      <div className={clsx('text-center py-12', className)}>
        <UserCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Aucun contact trouvé</p>
      </div>
    );
  }

  return (
    <div className={clsx('space-y-6', className)}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {contacts.map((contact) => (
        <Card
          key={contact.id}
          className="cursor-pointer hover:shadow-xl transition-all duration-200 overflow-hidden group"
          onClick={() => onContactClick?.(contact)}
        >
          <div className="flex flex-col">
            {/* Photo rectangulaire en hauteur */}
            <GalleryPhoto contact={contact} />

            {/* Contenu de la carte */}
            <div className="p-5">
              {/* Nom et position */}
              <div className="mb-4">
                <h3 className="font-semibold text-lg text-foreground mb-1">
                  {contact.first_name} {contact.last_name}
                </h3>
                {contact.position && (
                  <p className="text-sm text-muted-foreground">{contact.position}</p>
                )}
              </div>

              {/* Informations clés */}
              <div className="space-y-2.5">
                {contact.company_name && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{contact.company_name}</span>
                  </div>
                )}
                {contact.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground group/email">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate flex-1">{contact.email}</span>
                    <a
                      href={`mailto:${contact.email}`}
                      onClick={(e) => e.stopPropagation()}
                      className="opacity-0 group-hover/email:opacity-100 text-primary hover:text-primary-600 transition-all"
                      title="Envoyer un email"
                      aria-label={`Envoyer un email à ${contact.first_name} ${contact.last_name}`}
                    >
                      <Mail className="w-4 h-4" />
                    </a>
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground group/phone">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate flex-1">{contact.phone}</span>
                    <a
                      href={`tel:${contact.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="opacity-0 group-hover/phone:opacity-100 text-primary hover:text-primary-600 transition-all"
                      title="Appeler"
                      aria-label={`Appeler ${contact.first_name} ${contact.last_name}`}
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  </div>
                )}
                {contact.linkedin && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Linkedin className="w-4 h-4 flex-shrink-0" />
                    <a
                      href={contact.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="truncate text-primary hover:text-primary-600 transition-colors"
                      title="Voir le profil LinkedIn"
                    >
                      Profil LinkedIn
                    </a>
                  </div>
                )}
                {(contact.city || contact.country) && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">
                      {[contact.city, contact.country].filter(Boolean).join(', ')}
                    </span>
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
