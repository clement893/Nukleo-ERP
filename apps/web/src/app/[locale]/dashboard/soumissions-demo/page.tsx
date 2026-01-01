'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState } from 'react';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { 
  Plus, 
  FileText, 
  FileCheck, 
  Eye, 
  Trash2, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  Target,
  Calendar,
  Building2,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Badge, Button, Card } from '@/components/ui';

// Mock data for quotes
const mockQuotes = [
  {
    id: '1',
    quote_number: 'DEV-2024-001',
    client_name: 'TechCorp Inc.',
    project_name: 'Refonte site web e-commerce',
    amount: 45000,
    status: 'Envoyé',
    created_at: '2024-01-15',
    valid_until: '2024-02-15',
    items_count: 5,
  },
  {
    id: '2',
    quote_number: 'DEV-2024-002',
    client_name: 'InnoSoft Solutions',
    project_name: 'Application mobile iOS/Android',
    amount: 60000,
    status: 'Accepté',
    created_at: '2024-01-12',
    valid_until: '2024-02-12',
    items_count: 8,
  },
  {
    id: '3',
    quote_number: 'DEV-2024-003',
    client_name: 'DataFlow Systems',
    project_name: 'Audit sécurité informatique',
    amount: 20000,
    status: 'Brouillon',
    created_at: '2024-01-10',
    valid_until: '2024-02-10',
    items_count: 3,
  },
  {
    id: '4',
    quote_number: 'DEV-2024-004',
    client_name: 'CloudNet Technologies',
    project_name: 'Migration infrastructure cloud',
    amount: 85000,
    status: 'Refusé',
    created_at: '2024-01-08',
    valid_until: '2024-02-08',
    items_count: 12,
  },
];

// Mock data for submissions
const mockSubmissions = [
  {
    id: '1',
    submission_number: 'SOUM-2024-001',
    tender_name: 'Appel d\'offres Ville de Montréal - Système de gestion',
    organization: 'Ville de Montréal',
    amount: 250000,
    status: 'Soumis',
    deadline: '2024-02-28',
    submitted_at: '2024-01-20',
    probability: 75,
  },
  {
    id: '2',
    submission_number: 'SOUM-2024-002',
    tender_name: 'Modernisation infrastructure IT - Gouvernement QC',
    organization: 'Gouvernement du Québec',
    amount: 450000,
    status: 'En préparation',
    deadline: '2024-03-15',
    submitted_at: null,
    probability: 60,
  },
  {
    id: '3',
    submission_number: 'SOUM-2024-003',
    tender_name: 'Développement portail citoyen',
    organization: 'Ville de Québec',
    amount: 180000,
    status: 'Gagné',
    deadline: '2024-01-31',
    submitted_at: '2024-01-15',
    probability: 100,
  },
  {
    id: '4',
    submission_number: 'SOUM-2024-004',
    tender_name: 'Refonte site web institutionnel',
    organization: 'Université Laval',
    amount: 95000,
    status: 'Perdu',
    deadline: '2024-01-20',
    submitted_at: '2024-01-10',
    probability: 0,
  },
];

type TabType = 'quotes' | 'submissions';

export default function SoumissionsDemoPage() {
  const [activeTab, setActiveTab] = useState<TabType>('quotes');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'brouillon':
      case 'en préparation':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
      case 'envoyé':
      case 'soumis':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      case 'accepté':
      case 'gagné':
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'refusé':
      case 'perdu':
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'accepté':
      case 'gagné':
        return <CheckCircle className="w-4 h-4" />;
      case 'refusé':
      case 'perdu':
        return <XCircle className="w-4 h-4" />;
      case 'envoyé':
      case 'soumis':
        return <FileCheck className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Calculate stats
  const quotesStats = {
    total: mockQuotes.length,
    totalAmount: mockQuotes.reduce((sum, q) => sum + q.amount, 0),
    accepted: mockQuotes.filter(q => q.status === 'Accepté').length,
    pending: mockQuotes.filter(q => q.status === 'Envoyé').length,
  };

  const submissionsStats = {
    total: mockSubmissions.length,
    totalAmount: mockSubmissions.reduce((sum, s) => sum + s.amount, 0),
    won: mockSubmissions.filter(s => s.status === 'Gagné').length,
    pending: mockSubmissions.filter(s => s.status === 'Soumis' || s.status === 'En préparation').length,
  };

  const currentStats = activeTab === 'quotes' ? quotesStats : submissionsStats;

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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-5xl font-black text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {activeTab === 'quotes' ? 'Devis' : 'Soumissions'}
                </h1>
                <p className="text-white/80 text-lg">
                  {activeTab === 'quotes' 
                    ? 'Gérez vos devis et propositions commerciales' 
                    : 'Suivez vos soumissions aux appels d\'offres'}
                </p>
              </div>
              <Button className="bg-white text-[#523DC9] hover:bg-white/90">
                <Plus className="w-4 h-4 mr-2" />
                {activeTab === 'quotes' ? 'Nouveau devis' : 'Nouvelle soumission'}
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('quotes')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'quotes'
                ? 'bg-[#523DC9] text-white shadow-lg'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>Devis</span>
              <Badge className="bg-white/20 text-white">{mockQuotes.length}</Badge>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'submissions'
                ? 'bg-[#523DC9] text-white shadow-lg'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4" />
              <span>Soumissions</span>
              <Badge className="bg-white/20 text-white">{mockSubmissions.length}</Badge>
            </div>
          </button>
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
              {formatCurrency(currentStats.totalAmount)}
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
              {currentStats.total}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {activeTab === 'quotes' ? 'Devis' : 'Soumissions'}
            </div>
          </div>

          <div className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30">
                <TrendingUp className="w-6 h-6 text-[#F59E0B]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {activeTab === 'quotes' ? quotesStats.accepted : submissionsStats.won}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {activeTab === 'quotes' ? 'Acceptés' : 'Gagnés'}
            </div>
          </div>

          <div className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/30">
                <Clock className="w-6 h-6 text-[#3B82F6]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {currentStats.pending}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">En attente</div>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex justify-end">
          <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-[#523DC9] text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Grille
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-[#523DC9] text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Liste
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'quotes' && (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {mockQuotes.map((quote) => (
              <Card key={quote.id} className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:border-[#523DC9]/30 transition-all cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {quote.quote_number}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{quote.project_name}</p>
                  </div>
                  <Badge className={getStatusColor(quote.status)}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(quote.status)}
                      <span>{quote.status}</span>
                    </div>
                  </Badge>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300">{quote.client_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(quote.amount)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">Valide jusqu'au {formatDate(quote.valid_until)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">{quote.items_count} articles</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Eye className="w-4 h-4 mr-2" />
                    Voir
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'submissions' && (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {mockSubmissions.map((submission) => (
              <Card key={submission.id} className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:border-[#523DC9]/30 transition-all cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {submission.submission_number}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{submission.tender_name}</p>
                  </div>
                  <Badge className={getStatusColor(submission.status)}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(submission.status)}
                      <span>{submission.status}</span>
                    </div>
                  </Badge>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300">{submission.organization}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(submission.amount)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">Échéance: {formatDate(submission.deadline)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">Probabilité: {submission.probability}%</span>
                  </div>
                  {submission.submitted_at && (
                    <div className="flex items-center gap-2 text-sm">
                      <FileCheck className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">Soumis le {formatDate(submission.submitted_at)}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Eye className="w-4 h-4 mr-2" />
                    Voir
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </MotionDiv>
    </PageContainer>
  );
}
