'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { ArrowLeft, Building2, User, Mail, Phone, Calendar, TrendingUp, DollarSign, Target, MessageSquare, FileText, Clock, Edit, Trash2, Plus } from 'lucide-react';
import { Badge, Button } from '@/components/ui';

// Mock client data
const mockClient = {
  id: 'c7b4d752-0705-4618-8519-14a756d0fd0f',
  name: 'TechCorp Inc.',
  contact: 'Marie Dubois',
  email: 'marie@techcorp.com',
  phone: '+1 514 555-0123',
  stage: 'Prospect qualifié',
  score: 85,
  value: 125000,
  opportunities: 3,
  last_interaction: '2024-01-15',
  created_at: '2023-12-01',
  tags: ['Tech', 'B2B', 'Enterprise'],
  address: '123 Rue de la Tech, Montréal, QC H2X 1Y5',
  website: 'https://techcorp.com',
  industry: 'Technologie',
  employees: 150,
  revenue: 5000000,
};

const mockOpportunities = [
  {
    id: 1,
    title: 'Refonte site web e-commerce',
    value: 45000,
    probability: 75,
    stage: 'Proposition',
    expected_close: '2024-03-01',
  },
  {
    id: 2,
    title: 'Application mobile iOS/Android',
    value: 60000,
    probability: 60,
    stage: 'Négociation',
    expected_close: '2024-02-28',
  },
  {
    id: 3,
    title: 'Audit sécurité informatique',
    value: 20000,
    probability: 85,
    stage: 'Closing',
    expected_close: '2024-02-15',
  },
];

const mockActivities = [
  {
    id: 1,
    type: 'call',
    title: 'Appel de suivi',
    description: 'Discussion sur les besoins en développement mobile',
    date: '2024-01-15',
    user: 'Jean Dupont',
  },
  {
    id: 2,
    type: 'email',
    title: 'Envoi de proposition',
    description: 'Proposition commerciale pour le projet e-commerce',
    date: '2024-01-12',
    user: 'Sophie Martin',
  },
  {
    id: 3,
    type: 'meeting',
    title: 'Réunion découverte',
    description: 'Première rencontre avec l\'équipe technique',
    date: '2024-01-08',
    user: 'Pierre Lefebvre',
  },
  {
    id: 4,
    type: 'note',
    title: 'Note interne',
    description: 'Client très intéressé par nos services cloud',
    date: '2024-01-05',
    user: 'Marie Tremblay',
  },
];

const mockDocuments = [
  {
    id: 1,
    name: 'Proposition commerciale - E-commerce.pdf',
    type: 'proposal',
    size: '2.4 MB',
    date: '2024-01-12',
  },
  {
    id: 2,
    name: 'Contrat de service.pdf',
    type: 'contract',
    size: '1.8 MB',
    date: '2024-01-10',
  },
  {
    id: 3,
    name: 'Cahier des charges - Mobile.docx',
    type: 'document',
    size: '856 KB',
    date: '2024-01-08',
  },
];

export default function PipelineClientDetailDemoPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'opportunities' | 'activities' | 'documents'>('overview');

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Lead': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
      case 'Prospect qualifié': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      case 'Négociation': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400';
      case 'Client actif': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getOpportunityStageColor = (stage: string) => {
    switch (stage) {
      case 'Découverte': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      case 'Qualification': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400';
      case 'Proposition': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'Négociation': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400';
      case 'Closing': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'meeting': return <Calendar className="w-4 h-4" />;
      case 'note': return <FileText className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <PageContainer className="flex flex-col h-full">
      <MotionDiv variant="slideUp" duration="normal" className="flex flex-col flex-1 space-y-6">
        {/* Hero Header with Aurora Borealis Gradient */}
        <div className="relative rounded-2xl overflow-hidden -mt-4 -mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-10 2xl:-mx-12 3xl:-mx-16 4xl:-mx-20 px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 3xl:px-16 4xl:px-20 pt-6 pb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] opacity-90" />
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
            backgroundSize: '200px 200px'
          }} />
          
          <div className="relative">
            <button
              onClick={() => router.push('/dashboard/pipeline-client-demo')}
              className="flex items-center gap-2 text-white/80 hover:text-white mb-3 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour au pipeline</span>
            </button>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-5xl font-black text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {mockClient.name}
                  </h1>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={getStageColor(mockClient.stage)}>
                    {mockClient.stage}
                  </Badge>
                  {mockClient.tags.map((tag, index) => (
                    <span key={index} className="text-sm px-2 py-1 rounded-full border border-white/30 text-white">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="bg-white text-[#523DC9] hover:bg-white/90">
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier
                </Button>
                <Button variant="outline" className="text-white border-white/30 hover:bg-white/10">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30">
                <DollarSign className="w-6 h-6 text-[#10B981]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {formatCurrency(mockClient.value)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Valeur totale</div>
          </div>

          <div className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#523DC9]/10 border border-[#523DC9]/30">
                <Target className="w-6 h-6 text-[#523DC9]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {mockClient.opportunities}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Opportunités</div>
          </div>

          <div className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30">
                <TrendingUp className="w-6 h-6 text-[#F59E0B]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {mockClient.opportunities}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Opportunités actives</div>
          </div>

          <div className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/30">
                <Clock className="w-6 h-6 text-[#3B82F6]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {Math.floor((new Date().getTime() - new Date(mockClient.created_at).getTime()) / (1000 * 60 * 60 * 24))}j
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Depuis création</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="glass-card rounded-xl border border-[#A7A2CF]/20 overflow-hidden">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'text-[#523DC9] border-b-2 border-[#523DC9] bg-[#523DC9]/5'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Vue d'ensemble
            </button>
            <button
              onClick={() => setActiveTab('opportunities')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'opportunities'
                  ? 'text-[#523DC9] border-b-2 border-[#523DC9] bg-[#523DC9]/5'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Opportunités ({mockOpportunities.length})
            </button>
            <button
              onClick={() => setActiveTab('activities')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'activities'
                  ? 'text-[#523DC9] border-b-2 border-[#523DC9] bg-[#523DC9]/5'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Activités ({mockActivities.length})
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'documents'
                  ? 'text-[#523DC9] border-b-2 border-[#523DC9] bg-[#523DC9]/5'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Documents ({mockDocuments.length})
            </button>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    Informations de contact
                  </h3>
                  <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <User className="w-5 h-5 text-[#523DC9]" />
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Contact principal</div>
                      <div className="font-medium">{mockClient.contact}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <Mail className="w-5 h-5 text-[#523DC9]" />
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Email</div>
                      <div className="font-medium">{mockClient.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <Phone className="w-5 h-5 text-[#523DC9]" />
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Téléphone</div>
                      <div className="font-medium">{mockClient.phone}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <Building2 className="w-5 h-5 text-[#523DC9]" />
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Adresse</div>
                      <div className="font-medium">{mockClient.address}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    Informations entreprise
                  </h3>
                  <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <TrendingUp className="w-5 h-5 text-[#523DC9]" />
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Secteur d'activité</div>
                      <div className="font-medium">{mockClient.industry}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <User className="w-5 h-5 text-[#523DC9]" />
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Nombre d'employés</div>
                      <div className="font-medium">{mockClient.employees}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <DollarSign className="w-5 h-5 text-[#523DC9]" />
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Chiffre d'affaires annuel</div>
                      <div className="font-medium">{formatCurrency(mockClient.revenue)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <Calendar className="w-5 h-5 text-[#523DC9]" />
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Client depuis</div>
                      <div className="font-medium">{new Date(mockClient.created_at).toLocaleDateString('fr-FR')}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Opportunities Tab */}
            {activeTab === 'opportunities' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    Opportunités en cours
                  </h3>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Nouvelle opportunité
                  </Button>
                </div>
                {mockOpportunities.map((opp) => (
                  <div key={opp.id} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-[#523DC9]/40 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white mb-1">{opp.title}</h4>
                        <Badge className={getOpportunityStageColor(opp.stage)}>
                          {opp.stage}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-[#523DC9]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                          {formatCurrency(opp.value)}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{opp.probability}% de probabilité</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>Clôture prévue: {new Date(opp.expected_close).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Activities Tab */}
            {activeTab === 'activities' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    Historique des activités
                  </h3>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Nouvelle activité
                  </Button>
                </div>
                {mockActivities.map((activity) => (
                  <div key={activity.id} className="flex gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="p-3 rounded-lg bg-[#523DC9]/10 border border-[#523DC9]/30 h-fit">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-bold text-gray-900 dark:text-white">{activity.title}</h4>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(activity.date).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{activity.description}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <User className="w-4 h-4" />
                        <span>{activity.user}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    Documents partagés
                  </h3>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter un document
                  </Button>
                </div>
                {mockDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-[#523DC9]/40 transition-colors cursor-pointer">
                    <div className="p-3 rounded-lg bg-[#523DC9]/10 border border-[#523DC9]/30">
                      <FileText className="w-6 h-6 text-[#523DC9]" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 dark:text-white mb-1">{doc.name}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>{doc.size}</span>
                        <span>•</span>
                        <span>{new Date(doc.date).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                    <Button variant="outline">Télécharger</Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </MotionDiv>
    </PageContainer>
  );
}
