'use client';

import { Client } from '@/lib/api/clients';
import Card from '@/components/ui/Card';
import { Mail, Phone, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useEffect, useRef } from 'react';
import ClientAvatar from './ClientAvatar';

interface ClientGalleryProps {
  clients: Client[];
  onClientClick?: (client: Client) => void;
  className?: string;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}

export default function ClientGallery({
  clients,
  onClientClick,
  className,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
}: ClientGalleryProps) {
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

  if (clients.length === 0) {
    return (
      <Card>
        <div className="py-12 text-center text-muted-foreground">
          Aucun client trouvé
        </div>
      </Card>
    );
  }

  return (
    <div className={clsx('space-y-4', className)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {clients.map((client) => (
          <Card
            key={client.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => onClientClick?.(client)}
          >
            <div className="space-y-3">
              <div className="flex justify-center">
                <ClientAvatar client={client} size="xl" />
              </div>
              <div className="px-3 pb-3">
                <h3 className="font-semibold text-foreground text-center">
                  {client.company_name}
                </h3>
                {client.status && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <span className="truncate">{client.status}</span>
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
