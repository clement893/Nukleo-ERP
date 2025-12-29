'use client';

import { Contact } from '@/lib/api/contacts';
import Card from '@/components/ui/Card';
import { UserCircle, Building2, Mail, Phone, MapPin } from 'lucide-react';
import { clsx } from 'clsx';

interface ContactsGalleryProps {
  contacts: Contact[];
  onContactClick?: (contact: Contact) => void;
  className?: string;
}

export default function ContactsGallery({
  contacts,
  onContactClick,
  className,
}: ContactsGalleryProps) {
  if (contacts.length === 0) {
    return (
      <div className={clsx('text-center py-12', className)}>
        <UserCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Aucun contact trouvé</p>
      </div>
    );
  }

  return (
    <div className={clsx('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4', className)}>
      {contacts.map((contact) => (
        <Card
          key={contact.id}
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => onContactClick?.(contact)}
        >
          <div className="p-4">
            {/* Photo ou avatar */}
            <div className="flex items-center gap-4 mb-4">
              {contact.photo_url ? (
                <img
                  src={contact.photo_url}
                  alt={`${contact.first_name} ${contact.last_name}`}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                  <UserCircle className="w-10 h-10 text-primary-600 dark:text-primary-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">
                  {contact.first_name} {contact.last_name}
                </h3>
                {contact.position && (
                  <p className="text-sm text-muted-foreground truncate">{contact.position}</p>
                )}
              </div>
            </div>

            {/* Informations clés */}
            <div className="space-y-2">
              {contact.company_name && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="w-4 h-4" />
                  <span className="truncate">{contact.company_name}</span>
                </div>
              )}
              {contact.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{contact.email}</span>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span className="truncate">{contact.phone}</span>
                </div>
              )}
              {(contact.city || contact.country) && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span className="truncate">
                    {[contact.city, contact.country].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
