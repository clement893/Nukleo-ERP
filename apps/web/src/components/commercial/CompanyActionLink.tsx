'use client';

import { Mail, Phone, Globe } from 'lucide-react';
import { Company } from '@/lib/api/companies';

interface CompanyActionLinkProps {
  type: 'email' | 'phone' | 'website';
  value: string;
  company: Company;
}

export default function CompanyActionLink({
  type,
  value,
  company,
}: CompanyActionLinkProps) {
  if (!value) {
    return <span className="text-muted-foreground">-</span>;
  }

  let href: string;
  let Icon: typeof Mail | typeof Phone | typeof Globe;
  let label: string;

  if (type === 'email') {
    href = `mailto:${value}`;
    Icon = Mail;
    label = `Envoyer un email à ${company.name}`;
  } else if (type === 'phone') {
    href = `tel:${value}`;
    Icon = Phone;
    label = `Appeler ${company.name}`;
  } else {
    href = value.startsWith('http') ? value : `https://${value}`;
    Icon = Globe;
    label = `Visiter le site web de ${company.name}`;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground">{value}</span>
      <a
        href={href}
        onClick={(e) => e.stopPropagation()}
        className="text-primary hover:text-primary-600 transition-colors"
        title={type === 'email' ? 'Envoyer un email' : type === 'phone' ? 'Appeler' : 'Visiter le site web'}
        aria-label={label}
        target={type === 'website' ? '_blank' : undefined}
        rel={type === 'website' ? 'noopener noreferrer' : undefined}
      >
        <Icon className="w-4 h-4" />
      </a>
    </div>
  );
}
