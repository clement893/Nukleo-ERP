'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import { PageContainer } from '@/components/layout';
import { Loading, Alert, Button, Card, Badge } from '@/components/ui';
import { 
  ArrowLeft, 
  Edit, 
  Phone, 
  Mail, 
  MessageCircle, 
  Linkedin, 
  Building2, 
  Calendar, 
  FileText, 
  TrendingUp, 
  Clock,
  MapPin,
  Briefcase
} from 'lucide-react';
import { useReseauContact, useUpdateReseauContact } from '@/lib/query/reseau-contacts';
import Modal from '@/components/ui/Modal';
import ContactForm from '@/components/reseau/ContactForm';
import type { ContactUpdate } from '@/lib/api/reseau-contacts';
import Link from 'next/link';

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'activities' | 'opportunities' | 'documents'>('overview');

  const contactId = params?.id ? parseInt(String(params.id)) : null;

  // Fetch contact
  const { data: contact, isLoading: loadingContact, error: contactError } = useReseauContact(
    contactId || 0,
    !!contactId
  );

  // Mutations
  const updateContactMutation = useUpdateReseauContact();

  const loading = loadingContact;
  const error = contactError ? handleApiError(contactError).message : null;

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleUpdate = async (data: ContactUpdate) => {
    if (!contact) return;

    try {
      await updateContactMutation.mutateAsync({
        id: contact.id,
        data,
      });
      setShowEditModal(false);
      showToast({
        message: 'Contact modifié avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la modification du contact',
        type: 'error',
      });
    }
  };


  // Stats calculation
  const stats = contact ? [
    { icon: TrendingUp, label: 'Opportunités', value: '0', color: 'text-green-600', bgColor: 'bg-green-100' },
    { icon: FileText, label: 'Documents', value: '0', color: 'text-primary-600', bgColor: 'bg-primary-100' },
    { icon: Clock, label: 'Activités', value: '0', color: 'text-purple-600', bgColor: 'bg-purple-100' },
    { icon: Calendar, label: 'Dernier contact', value: contact.updated_at ? new Date(contact.updated_at).toLocaleDateString('fr-FR') : 'N/A', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  ] : [];

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
            Retour à Contacts
          </Button>
        </div>
      </PageContainer>
    );
  }

  if (!contact) {
    return (
      <PageContainer>
        <Alert variant="error">Le contact demandé n'existe pas ou a été supprimé.</Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={() => {
            const locale = params?.locale as string || 'fr';
            router.push(`/${locale}/dashboard/reseau/contacts`);
          }}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à Contacts
          </Button>
        </div>
      </PageContainer>
    );
  }

  const locale = params?.locale as string || 'fr';
  const contactName = `${contact.first_name} ${contact.last_name}`;
  const photoUrl = contact.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(contactName)}&background=523DC9&color=fff&size=300`;

  return (
    <PageContainer>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 -m-6 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Bouton retour */}
          <Link href={`/${locale}/dashboard/reseau/contacts`} className="inline-block">
            <Button variant="ghost" size="sm" className="hover:glass-card">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux contacts
            </Button>
          </Link>
          
          {/* Header Card avec photo plus grande */}
          <Card className="glass-card p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
              {/* Photo plus grande (56x56 = 224px) */}
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] rounded-2xl opacity-20 blur-lg" />
                <div className="relative w-48 h-48 md:w-56 md:h-56 rounded-2xl overflow-hidden border-2 border-[#A7A2CF]/30 shadow-xl">
                  <img 
                    src={photoUrl} 
                    alt={contactName} 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              
              {/* Infos */}
              <div className="flex-1">
                <h1 className="text-4xl md:text-5xl font-bold text-[#523DC9] mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {contactName}
                </h1>
                {contact.position && (
                  <p className="text-xl text-foreground/80 mb-2">{contact.position}</p>
                )}
                {contact.company_name && (
                  <div className="flex items-center gap-2 text-foreground/70 mb-4">
                    <Building2 className="w-5 h-5" />
                    <span className="text-lg">{contact.company_name}</span>
                  </div>
                )}
                
                {/* Tags - Not available in Contact type */}
                {contact.circle && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    <Badge className="badge-nukleo px-4 py-1.5 text-sm">
                      {contact.circle}
                    </Badge>
                  </div>
                )}
                
                {/* Actions rapides */}
                <div className="flex flex-wrap gap-3">
                  {contact.phone && (
                    <Button size="sm" variant="outline" className="hover-nukleo" asChild>
                      <a href={`tel:${contact.phone}`}>
                        <Phone className="w-4 h-4 mr-2" />
                        Appeler
                      </a>
                    </Button>
                  )}
                  {contact.email && (
                    <Button size="sm" variant="outline" className="hover-nukleo" asChild>
                      <a href={`mailto:${contact.email}`}>
                        <Mail className="w-4 h-4 mr-2" />
                        Email
                      </a>
                    </Button>
                  )}
                  {contact.phone && (
                    <Button size="sm" variant="outline" className="hover-nukleo" asChild>
                      <a href={`https://wa.me/${contact.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        WhatsApp
                      </a>
                    </Button>
                  )}
                  {contact.linkedin && (
                    <Button size="sm" variant="outline" className="hover-nukleo" asChild>
                      <a href={contact.linkedin} target="_blank" rel="noopener noreferrer">
                        <Linkedin className="w-4 h-4 mr-2" />
                        LinkedIn
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="glass-card p-6 hover:shadow-lg transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="flex gap-2 border-b border-border">
              {[
                { key: 'overview', label: 'Vue d\'ensemble' },
                { key: 'activities', label: 'Activités' },
                { key: 'opportunities', label: 'Opportunités' },
                { key: 'documents', label: 'Documents' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`px-6 py-3 font-medium transition-all relative ${
                    activeTab === tab.key
                      ? 'text-[#523DC9]'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.key && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#5F2B75] via-[#523DC9] to-[#6B1817]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Informations de contact */}
                <Card className="glass-card p-6">
                  <h3 className="text-lg font-semibold mb-4 text-[#523DC9]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    Informations de contact
                  </h3>
                  <div className="space-y-4">
                    {contact.email && (
                      <div className="flex items-start gap-3">
                        <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <a href={`mailto:${contact.email}`} className="text-foreground hover:text-[#523DC9] transition-colors">
                            {contact.email}
                          </a>
                        </div>
                      </div>
                    )}
                    {contact.phone && (
                      <div className="flex items-start gap-3">
                        <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">Téléphone</p>
                          <a href={`tel:${contact.phone}`} className="text-foreground hover:text-[#523DC9] transition-colors">
                            {contact.phone}
                          </a>
                        </div>
                      </div>
                    )}
                    {contact.city && (
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">Ville</p>
                          <p className="text-foreground">
                            {contact.city}
                            {contact.country && <span>, {contact.country}</span>}
                          </p>
                        </div>
                      </div>
                    )}
                    {contact.position && (
                      <div className="flex items-start gap-3">
                        <Briefcase className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">Poste</p>
                          <p className="text-foreground">{contact.position}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Notes */}
                <Card className="glass-card p-6">
                  <h3 className="text-lg font-semibold mb-4 text-[#523DC9]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    Notes
                  </h3>
                  <p className="text-foreground/80 leading-relaxed">
                    Aucune note pour ce contact.
                  </p>
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex flex-col gap-2 text-sm text-muted-foreground">
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
            )}

            {activeTab === 'activities' && (
              <Card className="glass-card p-6">
                <h3 className="text-lg font-semibold mb-4 text-[#523DC9]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Activités récentes
                </h3>
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune activité enregistrée pour ce contact.</p>
                </div>
              </Card>
            )}

            {activeTab === 'opportunities' && (
              <Card className="glass-card p-6">
                <h3 className="text-lg font-semibold mb-4 text-[#523DC9]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Opportunités
                </h3>
                <div className="text-center py-12 text-muted-foreground">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune opportunité associée à ce contact.</p>
                </div>
              </Card>
            )}

            {activeTab === 'documents' && (
              <Card className="glass-card p-6">
                <h3 className="text-lg font-semibold mb-4 text-[#523DC9]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Documents
                </h3>
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun document associé à ce contact.</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Quick Action - Edit Button (Floating) */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={handleEdit}
          className="w-14 h-14 bg-gradient-to-br from-[#523DC9] to-[#5F2B75] rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl transform hover:scale-110 active:scale-95 transition-all duration-300"
          aria-label="Modifier le contact"
          title="Modifier le contact"
        >
          <Edit className="w-6 h-6" aria-hidden="true" />
        </button>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Modifier le contact"
        size="lg"
      >
        <ContactForm
          contact={contact}
          onSubmit={handleUpdate}
          onCancel={() => setShowEditModal(false)}
          loading={updateContactMutation.isPending}
          companies={[]}
          employees={[]}
          circles={['client', 'prospect', 'partenaire', 'fournisseur', 'autre']}
        />
      </Modal>
    </PageContainer>
  );
}
