'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { companiesAPI, Company } from '@/lib/api/companies';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import { PageContainer } from '@/components/layout';
import { Loading, Alert, Badge, Card, Button } from '@/components/ui';
import { 
  ArrowLeft, 
  Building2,
  CheckCircle,
  Users,
  FolderKanban,
  Calendar,
  Globe
} from 'lucide-react';
import Link from 'next/link';
import { CompanyNotesEditor } from '@/components/commercial/CompanyNotesEditor';
import { CompanyDocuments } from '@/components/commercial/CompanyDocuments';
import { CompanyActivities } from '@/components/commercial/CompanyActivities';
import { CompanyOverviewEditor } from '@/components/commercial/CompanyOverviewEditor';

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'activities' | 'documents' | 'notes'>('overview');

  const companyId = params?.id ? parseInt(String(params.id), 10) : null;

  useEffect(() => {
    if (!companyId || isNaN(companyId)) {
      setError('ID d\'entreprise invalide');
      setLoading(false);
      return;
    }

    loadCompany();
  }, [companyId]);

  const loadCompany = async () => {
    if (!companyId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await companiesAPI.get(companyId);
      setCompany(data);
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors du chargement de l\'entreprise');
      showToast({
        message: appError.message || 'Erreur lors du chargement de l\'entreprise',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
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

  if (error && !company) {
    return (
      <PageContainer>
        <Alert variant="error">{error}</Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={() => {
            const locale = params?.locale as string || 'fr';
            router.push(`/${locale}/dashboard/commercial/entreprises`);
          }}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux entreprises
          </Button>
        </div>
      </PageContainer>
    );
  }

  if (!company) {
    return (
      <PageContainer>
        <Alert variant="error">Entreprise non trouvée</Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={() => {
            const locale = params?.locale as string || 'fr';
            router.push(`/${locale}/dashboard/commercial/entreprises`);
          }}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux entreprises
          </Button>
        </div>
      </PageContainer>
    );
  }

  const locale = params?.locale as string || 'fr';

  const formatDate = (date: string | null | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Stats calculation
  const stats = company ? [
    { 
      icon: Users, 
      label: 'Contacts', 
      value: company.contacts_count !== undefined ? String(company.contacts_count) : '0', 
      color: 'text-blue-600', 
      bgColor: 'bg-blue-100' 
    },
    { 
      icon: FolderKanban, 
      label: 'Projets', 
      value: company.projects_count !== undefined ? String(company.projects_count) : '0', 
      color: 'text-purple-600', 
      bgColor: 'bg-purple-100' 
    },
    { 
      icon: CheckCircle, 
      label: 'Statut', 
      value: company.is_client ? 'Client' : 'Prospect', 
      color: company.is_client ? 'text-green-600' : 'text-orange-600', 
      bgColor: company.is_client ? 'bg-green-100' : 'bg-orange-100' 
    },
    { 
      icon: Calendar, 
      label: 'Créée le', 
      value: formatDate(company.created_at), 
      color: 'text-primary-600', 
      bgColor: 'bg-primary-100' 
    },
  ] : [];

  return (
    <PageContainer>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 -m-6 p-6">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Bouton retour - juste une flèche sans background */}
          <div className="flex items-center gap-4 mb-2">
            <Link 
              href={`/${locale}/dashboard/commercial/entreprises`}
              className="inline-flex items-center justify-center w-8 h-8 text-foreground/70 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            
            {/* Header compact */}
            <div className="flex-1 flex items-center gap-3">
              <h1 className="text-2xl font-bold text-primary-500 font-nukleo">
                {company.name}
              </h1>
              
              {company.is_client && (
                <Badge className="bg-green-100 text-green-700 border-green-300 px-2 py-0.5 text-xs font-medium border">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Client
                </Badge>
              )}
              
              {company.parent_company_name && (
                <div className="flex items-center gap-1.5 text-foreground/60 text-sm">
                  <Building2 className="w-4 h-4" />
                  <span>Filiale de {company.parent_company_name}</span>
                </div>
              )}
              
              {company.website && (
                <div className="flex items-center gap-1.5 text-foreground/60 text-sm">
                  <Globe className="w-4 h-4" />
                  <a 
                    href={company.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-primary-500 transition-colors"
                  >
                    Site web
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Stats Cards - plus compactes */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="glass-card p-3 hover:shadow-lg transition-all">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`w-4 h-4 ${stat.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
                      <p className="text-lg font-bold text-foreground truncate">{stat.value}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
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
              <CompanyOverviewEditor
                company={company}
                companyId={company.id}
                onUpdate={(updatedCompany) => {
                  setCompany(updatedCompany);
                  loadCompany();
                  showToast({
                    message: 'Entreprise mise à jour avec succès',
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
                <CompanyActivities
                  companyId={company.id}
                  company={company}
                />
              </Card>
            )}

            {activeTab === 'documents' && (
              <Card className="glass-card p-6">
                <h3 className="text-lg font-semibold mb-4 text-primary-500 font-nukleo">
                  Documents
                </h3>
                <CompanyDocuments
                  companyId={company.id}
                  company={company}
                  onUpdate={loadCompany}
                />
              </Card>
            )}

            {activeTab === 'notes' && (
              <Card className="glass-card p-6">
                <h3 className="text-lg font-semibold mb-4 text-primary-500 font-nukleo">
                  Notes
                </h3>
                <CompanyNotesEditor
                  companyId={company.id}
                  initialNotes={company.notes}
                  updatedAt={company.updated_at}
                  onSaveSuccess={() => {
                    loadCompany();
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
                {company.created_at && (
                  <span>Créé le: {new Date(company.created_at).toLocaleDateString('fr-FR')}</span>
                )}
                {company.updated_at && (
                  <span>Dernière modification: {new Date(company.updated_at).toLocaleDateString('fr-FR')}</span>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
