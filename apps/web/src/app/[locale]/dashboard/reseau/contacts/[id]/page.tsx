'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { contactsAPI, Contact } from '@/lib/api/contacts';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import { PageContainer } from '@/components/layout';
import { Loading, Alert, Badge, Card, Button } from '@/components/ui';
import { 
  ArrowLeft, 
  Building2,
  User,
  UserCircle
} from 'lucide-react';
import Link from 'next/link';
import { ContactNotesEditor } from '@/components/commercial/ContactNotesEditor';
import { ContactDocuments } from '@/components/commercial/ContactDocuments';
import { ContactActivities } from '@/components/commercial/ContactActivities';
import { ContactOverviewEditor } from '@/components/commercial/ContactOverviewEditor';

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'activities' | 'documents' | 'notes'>('overview');

  const contactId = params?.id ? parseInt(String(params.id), 10) : null;

  useEffect(() => {
    if (!contactId || isNaN(contactId)) {
      setError('ID de contact invalide');
      setLoading(false);
      return;
    }

    loadContact();
  }, [contactId]);

  const loadContact = async () => {
    if (!contactId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await contactsAPI.get(contactId);
      setContact(data);
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors du chargement du contact');
      showToast({
        message: appError.message || 'Erreur lors du chargement du contact',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const getCircleColors = (circle: string | null | undefined) => {
    if (!circle) return 'bg-gray-100 text-gray-700 border-gray-300';
    const lowerCircle = circle.toLowerCase();
    if (lowerCircle.includes('vip')) return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    if (lowerCircle.includes('client')) return 'bg-green-100 text-green-700 border-green-300';
    if (lowerCircle.includes('prospect')) return 'bg-primary-100 text-primary-700 border-primary-300';
    if (lowerCircle.includes('partenaire')) return 'bg-purple-100 text-purple-700 border-purple-300';
    return 'bg-gray-100 text-gray-700 border-gray-300';
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="py-12 text-center">
          <Loading />
        </div>
      </PageContainer>
    );
  }

  if (error && !contact) {
    return (
      <PageContainer>
        <Alert variant="error">{error}</Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={() => {
            const locale = params?.locale as string || 'fr';
            router.push(`/${locale}/dashboard/reseau/contacts`);
          }}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux contacts
          </Button>
        </div>
      </PageContainer>
    );
  }

  if (!contact) {
    return (
      <PageContainer>
        <Alert variant="error">Contact non trouvé</Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={() => {
            const locale = params?.locale as string || 'fr';
            router.push(`/${locale}/dashboard/reseau/contacts`);
          }}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux contacts
          </Button>
        </div>
      </PageContainer>
    );
  }

  const locale = params?.locale as string || 'fr';
  const circleTags = contact.circle ? contact.circle.split(',').map(t => t.trim()) : [];

  return (
    <PageContainer>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 -m-6 p-6">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Bouton retour - juste une flèche sans background */}
          <div className="flex items-center gap-4 mb-2">
            <Link 
              href={`/${locale}/dashboard/reseau/contacts`}
              className="inline-flex items-center justify-center w-8 h-8 text-foreground/70 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            
            {/* Header compact */}
            <div className="flex-1 flex items-center gap-3">
              {/* Photo */}
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center overflow-hidden flex-shrink-0">
                {contact.photo_url ? (
                  <img
                    src={contact.photo_url}
                    alt={`${contact.first_name} ${contact.last_name}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserCircle className="w-6 h-6 text-gray-400" />
                )}
              </div>
              
              <h1 className="text-2xl font-bold text-primary-500 font-nukleo">
                {contact.first_name} {contact.last_name}
              </h1>
              
              {circleTags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {circleTags.map((tag, idx) => (
                    <Badge key={idx} className={`${getCircleColors(tag)} px-2 py-0.5 text-xs font-medium border`}>
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              
              {contact.company_name && (
                <div className="flex items-center gap-1.5 text-foreground/60 text-sm">
                  <Building2 className="w-4 h-4" />
                  <span>{contact.company_name}</span>
                </div>
              )}
              
              {contact.position && (
                <div className="text-foreground/60 text-sm">
                  {contact.position}
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-4">
            <div className="flex gap-2 border-b border-border">
              {[
                { key: 'overview', label: 'Vue d\'ensemble' },
                { key: 'activities', label: 'Activités' },
                { key: 'documents', label: 'Documents' },
                { key: 'notes', label: 'Notes' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`px-6 py-3 font-medium transition-all relative ${
                    activeTab === tab.key
                      ? 'text-primary-500'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.key && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-nukleo-gradient" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'overview' && (
              <ContactOverviewEditor
                contact={contact}
                contactId={contact.id}
                onUpdate={(updatedContact) => {
                  setContact(updatedContact);
                  loadContact();
                  showToast({
                    message: 'Contact mis à jour avec succès',
                    type: 'success',
                  });
                }}
                onError={(error) => {
                  showToast({
                    message: error.message || 'Erreur lors de la mise à jour',
                    type: 'error',
                  });
                }}
              />
            )}

            {activeTab === 'activities' && (
              <Card className="glass-card p-6">
                <h3 className="text-lg font-semibold mb-4 text-primary-500 font-nukleo">
                  Activités
                </h3>
                <ContactActivities
                  contactId={contact.id}
                  contact={contact}
                />
              </Card>
            )}

            {activeTab === 'documents' && (
              <Card className="glass-card p-6">
                <h3 className="text-lg font-semibold mb-4 text-primary-500 font-nukleo">
                  Documents
                </h3>
                <ContactDocuments
                  contactId={contact.id}
                  contact={contact}
                  onUpdate={loadContact}
                />
              </Card>
            )}

            {activeTab === 'notes' && (
              <Card className="glass-card p-6">
                <h3 className="text-lg font-semibold mb-4 text-primary-500 font-nukleo">
                  Notes
                </h3>
                <ContactNotesEditor
                  contactId={contact.id}
                  initialNotes={contact.notes}
                  updatedAt={contact.updated_at}
                  onSaveSuccess={() => {
                    loadContact();
                    showToast({
                      message: 'Notes enregistrées avec succès',
                      type: 'success',
                    });
                  }}
                  onSaveError={(error) => {
                    showToast({
                      message: error.message || 'Erreur lors de la sauvegarde des notes',
                      type: 'error',
                    });
                  }}
                />
              </Card>
            )}
          </div>

          {/* Metadata */}
          <Card className="glass-card p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-sm text-muted-foreground">
              <div className="flex flex-col gap-2">
                {contact.created_at && (
                  <span>Créé le: {new Date(contact.created_at).toLocaleDateString('fr-FR')}</span>
                )}
                {contact.updated_at && (
                  <span>Dernière modification: {new Date(contact.updated_at).toLocaleDateString('fr-FR')}</span>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
