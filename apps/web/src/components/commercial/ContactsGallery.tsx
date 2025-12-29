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
    <div className={clsx('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6', className)}>
      {contacts.map((contact) => (
        <Card
          key={contact.id}
          className="cursor-pointer hover:shadow-xl transition-all duration-200 overflow-hidden group"
          onClick={() => onContactClick?.(contact)}
        >
          <div className="flex flex-col">
            {/* Photo rectangulaire en hauteur */}
            <div className="w-full aspect-[3/4] bg-muted overflow-hidden">
              {contact.photo_url ? (
                <img
                  src={contact.photo_url}
                  alt={`${contact.first_name} ${contact.last_name}`}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-200"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 flex items-center justify-center">
                  <UserCircle className="w-20 h-20 text-primary-600 dark:text-primary-400" />
                </div>
              )}
            </div>

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
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{contact.email}</span>
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{contact.phone}</span>
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
  );
}
