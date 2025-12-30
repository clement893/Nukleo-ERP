'use client';

import { Mail, Phone } from 'lucide-react';
import { Contact } from '@/lib/api/contacts';

interface ContactActionLinkProps {
  type: 'email' | 'phone';
  value: string;
  contact: Contact;
}

export default function ContactActionLink({
  type,
  value,
  contact,
}: ContactActionLinkProps) {
  if (!value) {
    return <span className="text-muted-foreground">-</span>;
  }

  const href = type === 'email' ? `mailto:${value}` : `tel:${value}`;
  const Icon = type === 'email' ? Mail : Phone;
  const label = type === 'email' 
    ? `Envoyer un email à ${contact.first_name} ${contact.last_name}`
    : `Appeler ${contact.first_name} ${contact.last_name}`;

  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground">{value}</span>
      <a
        href={href}
        onClick={(e) => e.stopPropagation()}
        className="text-primary hover:text-primary-600 transition-colors"
        title={type === 'email' ? 'Envoyer un email' : 'Appeler'}
        aria-label={label}
      >
        <Icon className="w-4 h-4" />
      </a>
    </div>
  );
}
