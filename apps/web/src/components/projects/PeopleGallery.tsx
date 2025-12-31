'use client';

import { People } from '@/lib/api/people';
import Card from '@/components/ui/Card';
import { Mail, Phone, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useEffect, useRef } from 'react';
import PeopleAvatar from './PeopleAvatar';

interface PeopleGalleryProps {
  people: People[];
  onPersonClick?: (person: People) => void;
  className?: string;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}

export default function PeopleGallery({
  people,
  onPersonClick,
  className,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
}: PeopleGalleryProps) {
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

  if (people.length === 0) {
    return (
      <Card>
        <div className="py-12 text-center text-muted-foreground">
          Aucune personne trouvée
        </div>
      </Card>
    );
  }

  return (
    <div className={clsx('space-y-4', className)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {people.map((person) => (
          <Card
            key={person.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => onPersonClick?.(person)}
          >
            <div className="space-y-3">
              <div className="flex justify-center">
                <PeopleAvatar person={person} size="xl" />
              </div>
              <div className="px-3 pb-3">
                <h3 className="font-semibold text-foreground text-center">
                  {person.first_name} {person.last_name}
                </h3>
                {person.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Mail className="w-3.5 h-3.5" />
                    <span className="truncate">{person.email}</span>
                  </div>
                )}
                {person.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{person.phone}</span>
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
