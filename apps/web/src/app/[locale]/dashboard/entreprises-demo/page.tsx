'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState } from 'react';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { 
  Plus, 
  Building2, 
  MapPin, 
  Users, 
  TrendingUp, 
  Eye, 
  Trash2,
  Grid,
  List,
  Globe
} from 'lucide-react';
import { Badge, Button, Card } from '@/components/ui';

// Mock data
const mockCompanies = [
  {
    id: 1,
    name: 'TechCorp Inc.',
    sector: 'Technologie',
    country: 'Canada',
    city: 'Montréal',
    contacts: 12,
    projects: 5,
    revenue: 2500000,
    website: 'techcorp.com',
    email: 'contact@techcorp.com',
    phone: '+1 514-555-0123',
    is_client: true,
  },
  {
    id: 2,
    name: 'InnoSoft Solutions',
    sector: 'Logiciel',
    country: 'Canada',
    city: 'Toronto',
    contacts: 8,
    projects: 3,
    revenue: 1800000,
    website: 'innosoft.ca',
    email: 'info@innosoft.ca',
    phone: '+1 416-555-0456',
    is_client: true,
  },
  {
    id: 3,
    name: 'DataFlow Systems',
    sector: 'Data Analytics',
    country: 'États-Unis',
    city: 'New York',
    contacts: 15,
    projects: 8,
    revenue: 4200000,
    website: 'dataflow.com',
    email: 'contact@dataflow.com',
    phone: '+1 212-555-0789',
    is_client: false,
  },
  {
    id: 4,
    name: 'CloudNet Technologies',
    sector: 'Cloud Computing',
    country: 'Canada',
    city: 'Vancouver',
    contacts: 6,
    projects: 2,
    revenue: 1500000,
    website: 'cloudnet.io',
    email: 'hello@cloudnet.io',
    phone: '+1 604-555-0321',
    is_client: true,
  },
  {
    id: 5,
    name: 'SecureData Corp',
    sector: 'Cybersécurité',
    country: 'France',
    city: 'Paris',
    contacts: 10,
    projects: 4,
    revenue: 3100000,
    website: 'securedata.fr',
    email: 'contact@securedata.fr',
    phone: '+33 1 55 55 01 23',
    is_client: false,
  },
  {
    id: 6,
    name: 'AI Innovations',
    sector: 'Intelligence Artificielle',
    country: 'Canada',
    city: 'Québec',
    contacts: 9,
    projects: 6,
    revenue: 2800000,
    website: 'ai-innovations.ca',
    email: 'info@ai-innovations.ca',
    phone: '+1 418-555-0654',
    is_client: true,
  },
];

export default function EntreprisesDemoPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState<'all' | 'clients' | 'prospects'>('all');

  const filteredCompanies = mockCompanies.filter((company) => {
    if (filterStatus === 'clients') return company.is_client;
    if (filterStatus === 'prospects') return !company.is_client;
    return true;
  });

  const stats = {
    total: mockCompanies.length,
    clients: mockCompanies.filter(c => c.is_client).length,
    prospects: mockCompanies.filter(c => !c.is_client).length,
    totalRevenue: mockCompanies.reduce((sum, c) => sum + c.revenue, 0),
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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-5xl font-black text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Entreprises
                </h1>
                <p className="text-white/80 text-lg">
                  Gérez votre réseau d'entreprises et partenaires
                </p>
              </div>
              <Button className="bg-white text-[#523DC9] hover:bg-white/90">
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle entreprise
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#523DC9]/10 border border-[#523DC9]/30">
                <Building2 className="w-6 h-6 text-[#523DC9]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.total}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total entreprises</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30">
                <TrendingUp className="w-6 h-6 text-[#10B981]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.clients}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Clients actifs</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30">
                <Users className="w-6 h-6 text-[#F59E0B]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.prospects}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Prospects</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/30">
                <TrendingUp className="w-6 h-6 text-[#3B82F6]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {formatCurrency(stats.totalRevenue)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Revenu total</div>
          </Card>
        </div>

        {/* Filters and View Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={filterStatus === 'all' ? 'primary' : 'outline'}
              onClick={() => setFilterStatus('all')}
            >
              Tous ({stats.total})
            </Button>
            <Button
              size="sm"
              variant={filterStatus === 'clients' ? 'primary' : 'outline'}
              onClick={() => setFilterStatus('clients')}
            >
              Clients ({stats.clients})
            </Button>
            <Button
              size="sm"
              variant={filterStatus === 'prospects' ? 'primary' : 'outline'}
              onClick={() => setFilterStatus('prospects')}
            >
              Prospects ({stats.prospects})
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={viewMode === 'grid' ? 'primary' : 'outline'}
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'list' ? 'primary' : 'outline'}
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Companies Grid/List */}
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
          {filteredCompanies.map((company) => (
            <Card 
              key={company.id} 
              className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:border-[#523DC9]/30 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#523DC9] to-[#6B1817] flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                      {company.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{company.sector}</p>
                  </div>
                </div>
                <Badge className={company.is_client ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'}>
                  {company.is_client ? 'Client' : 'Prospect'}
                </Badge>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <MapPin className="w-4 h-4" />
                  <span>{company.city}, {company.country}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Users className="w-4 h-4" />
                  <span>{company.contacts} contacts · {company.projects} projets</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Globe className="w-4 h-4" />
                  <span>{company.website}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-lg font-bold text-[#10B981]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {formatCurrency(company.revenue)}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </MotionDiv>
    </PageContainer>
  );
}
