'use client';

import { Contact } from '@/lib/api/contacts';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { UserCircle, Building2, Mail, Phone, MapPin, Calendar, Globe, Linkedin, User, Edit, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';

interface ContactDetailProps {
  contact: Contact;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

export default function ContactDetail({
  contact,
  onEdit,
  onDelete,
  className,
}: ContactDetailProps) {
  return (
    <div className={clsx('space-y-4', className)}>
      {/* Header avec photo */}
      <Card>
        <div className="flex items-start gap-6 p-6">
          {contact.photo_url ? (
            <img
              src={contact.photo_url}
              alt={`${contact.first_name} ${contact.last_name}`}
              className="w-24 h-24 rounded-full object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
              <UserCircle className="w-12 h-12 text-primary-600 dark:text-primary-400" />
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {contact.first_name} {contact.last_name}
            </h2>
            {contact.position && (
              <p className="text-lg text-muted-foreground mb-4">{contact.position}</p>
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
          {contact.email && (
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Courriel</p>
                <a href={`mailto:${contact.email}`} className="text-foreground hover:text-primary">
                  {contact.email}
                </a>
              </div>
            </div>
          )}
          {contact.phone && (
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Téléphone</p>
                <a href={`tel:${contact.phone}`} className="text-foreground hover:text-primary">
                  {contact.phone}
                </a>
              </div>
            </div>
          )}
          {contact.linkedin && (
            <div className="flex items-center gap-3">
              <Linkedin className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">LinkedIn</p>
                <a
                  href={contact.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground hover:text-primary"
                >
                  {contact.linkedin}
                </a>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Informations professionnelles */}
      <Card title="Informations professionnelles">
        <div className="space-y-4">
          {contact.company_name && (
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Entreprise</p>
                <p className="text-foreground">{contact.company_name}</p>
              </div>
            </div>
          )}
          {contact.circle && (
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Cercle</p>
                <p className="text-foreground capitalize">{contact.circle}</p>
              </div>
            </div>
          )}
          {contact.employee_name && (
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Employé lié</p>
                <p className="text-foreground">{contact.employee_name}</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Informations personnelles */}
      <Card title="Informations personnelles">
        <div className="space-y-4">
          {(contact.city || contact.country) && (
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Localisation</p>
                <p className="text-foreground">
                  {[contact.city, contact.country].filter(Boolean).join(', ') || 'Non renseigné'}
                </p>
              </div>
            </div>
          )}
          {contact.birthday && (
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Anniversaire</p>
                <p className="text-foreground">
                  {new Date(contact.birthday).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
          )}
          {contact.language && (
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Langue</p>
                <p className="text-foreground">{contact.language}</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Métadonnées */}
      <Card title="Métadonnées">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Créé le</span>
            <span className="text-foreground">
              {new Date(contact.created_at).toLocaleDateString('fr-FR')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Modifié le</span>
            <span className="text-foreground">
              {new Date(contact.updated_at).toLocaleDateString('fr-FR')}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
