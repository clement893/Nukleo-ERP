'use client';

import { Company } from '@/lib/api/companies';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Building2, Mail, Phone, MapPin, Globe, Linkedin, Facebook, Instagram, Edit, Trash2, CheckCircle2, Users, FolderKanban } from 'lucide-react';
import { clsx } from 'clsx';
import { useRouter } from 'next/navigation';

interface CompanyDetailProps {
  company: Company;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

export default function CompanyDetail({
  company,
  onEdit,
  onDelete,
  className,
}: CompanyDetailProps) {
  const router = useRouter();
  const locale = typeof window !== 'undefined' ? window.location.pathname.split('/')[1] || 'fr' : 'fr';

  const handleViewContacts = () => {
    router.push(`/${locale}/dashboard/commercial/contacts?company_id=${company.id}`);
  };

  const handleViewProjects = () => {
    // TODO: Navigate to projects filtered by company when projects page is ready
    router.push(`/${locale}/dashboard/projects?company_id=${company.id}`);
  };

  return (
    <div className={clsx('space-y-4', className)}>
      {/* Header avec logo */}
      <Card>
        <div className="flex items-start gap-6 p-6">
          {company.logo_url ? (
            <img
              src={company.logo_url}
              alt={company.name}
              className="w-24 h-24 rounded object-cover border border-border"
            />
          ) : (
            <div className="w-24 h-24 rounded bg-primary-100 dark:bg-primary-900 flex items-center justify-center border border-border">
              <Building2 className="w-12 h-12 text-primary-600 dark:text-primary-400" />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-2xl font-bold text-foreground">
                {company.name}
              </h2>
              {company.is_client && (
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              )}
            </div>
            {company.parent_company_name && (
              <p className="text-sm text-muted-foreground mb-4">
                Filiale de {company.parent_company_name}
              </p>
            )}
            {company.description && (
              <p className="text-muted-foreground mb-4">{company.description}</p>
            )}
            <div className="flex gap-2">
              {onEdit && (
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Edit className="w-4 h-4 mr-1.5" />
                  Modifier
                </Button>
              )}
              {onDelete && (
                <Button variant="outline" size="sm" onClick={onDelete} className="text-red-600 hover:text-red-700">
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  Supprimer
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Informations de contact */}
      <Card title="Informations de contact">
        <div className="space-y-4">
          {company.website && (
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Site web</p>
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground hover:text-primary"
                >
                  {company.website}
                </a>
              </div>
            </div>
          )}
          {company.email && (
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Courriel</p>
                <a href={`mailto:${company.email}`} className="text-foreground hover:text-primary">
                  {company.email}
                </a>
              </div>
            </div>
          )}
          {company.phone && (
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Téléphone</p>
                <a href={`tel:${company.phone}`} className="text-foreground hover:text-primary">
                  {company.phone}
                </a>
              </div>
            </div>
          )}
          {(company.city || company.country) && (
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Localisation</p>
                <p className="text-foreground">
                  {[company.city, company.country].filter(Boolean).join(', ') || 'Non renseigné'}
                </p>
              </div>
            </div>
          )}
          {company.address && (
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Adresse</p>
                <p className="text-foreground">{company.address}</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Réseaux sociaux */}
      {(company.facebook || company.instagram || company.linkedin) && (
        <Card title="Réseaux sociaux">
          <div className="space-y-4">
            {company.facebook && (
              <div className="flex items-center gap-3">
                <Facebook className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Facebook</p>
                  <a
                    href={company.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground hover:text-primary"
                  >
                    {company.facebook}
                  </a>
                </div>
              </div>
            )}
            {company.instagram && (
              <div className="flex items-center gap-3">
                <Instagram className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Instagram</p>
                  <a
                    href={company.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground hover:text-primary"
                  >
                    {company.instagram}
                  </a>
                </div>
              </div>
            )}
            {company.linkedin && (
              <div className="flex items-center gap-3">
                <Linkedin className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">LinkedIn</p>
                  <a
                    href={company.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground hover:text-primary"
                  >
                    {company.linkedin}
                  </a>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Contacts liés */}
      {company.contacts_count !== undefined && (
        <Card title="Contacts liés">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Nombre de contacts</p>
                <p className="text-foreground font-semibold">{company.contacts_count}</p>
              </div>
            </div>
            {company.contacts_count > 0 && (
              <Button variant="outline" size="sm" onClick={handleViewContacts}>
                Voir les contacts
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Projets (si client) */}
      {company.is_client && company.projects_count !== undefined && (
        <Card title="Projets">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FolderKanban className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Nombre de projets</p>
                <p className="text-foreground font-semibold">{company.projects_count}</p>
              </div>
            </div>
            {company.projects_count > 0 && (
              <Button variant="outline" size="sm" onClick={handleViewProjects}>
                Voir les projets
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
