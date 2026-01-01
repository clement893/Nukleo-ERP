'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState } from 'react';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { 
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Linkedin,
  Users,
  TrendingUp,
  FileText,
  Calendar,
  DollarSign,
  Edit,
  Trash2,
  Plus,
  ArrowLeft,
  CheckCircle2,
  Briefcase,
  MessageSquare,
  ExternalLink
} from 'lucide-react';
import { Badge, Button, Card } from '@/components/ui';
import Link from 'next/link';

// Mock data pour la démo
const mockCompany = {
  id: 723,
  name: 'Acme Corporation',
  description: 'Leader mondial des solutions technologiques innovantes pour les entreprises',
  logo_url: 'https://logo.clearbit.com/acme.com',
  is_client: true,
  website: 'https://www.acme.com',
  email: 'contact@acme.com',
  phone: '+1 (514) 555-0100',
  address: '1234 Rue de la Montagne',
  city: 'Montréal',
  state: 'QC',
  postal_code: 'H3G 1Z2',
  country: 'Canada',
  linkedin_url: 'https://linkedin.com/company/acme',
  industry: 'Technologie',
  employee_count: '500-1000',
  annual_revenue: 50000000,
  founded_year: 2010,
};

const mockContacts = [
  {
    id: 1,
    first_name: 'Sophie',
    last_name: 'Tremblay',
    title: 'Directrice Générale',
    email: 'sophie.tremblay@acme.com',
    phone: '+1 (514) 555-0101',
    linkedin_url: 'https://linkedin.com/in/sophie-tremblay',
    is_primary: true,
    avatar: 'ST',
    color: 'bg-blue-500'
  },
  {
    id: 2,
    first_name: 'Marc',
    last_name: 'Leblanc',
    title: 'VP Ventes',
    email: 'marc.leblanc@acme.com',
    phone: '+1 (514) 555-0102',
    linkedin_url: 'https://linkedin.com/in/marc-leblanc',
    is_primary: false,
    avatar: 'ML',
    color: 'bg-green-500'
  },
  {
    id: 3,
    first_name: 'Julie',
    last_name: 'Gagnon',
    title: 'Directrice Marketing',
    email: 'julie.gagnon@acme.com',
    phone: '+1 (514) 555-0103',
    linkedin_url: null,
    is_primary: false,
    avatar: 'JG',
    color: 'bg-purple-500'
  },
  {
    id: 4,
    first_name: 'Pierre',
    last_name: 'Dubois',
    title: 'Chef de Projet',
    email: 'pierre.dubois@acme.com',
    phone: '+1 (514) 555-0104',
    linkedin_url: 'https://linkedin.com/in/pierre-dubois',
    is_primary: false,
    avatar: 'PD',
    color: 'bg-orange-500'
  },
  {
    id: 5,
    first_name: 'Marie',
    last_name: 'Roy',
    title: 'Responsable Achats',
    email: 'marie.roy@acme.com',
    phone: '+1 (514) 555-0105',
    linkedin_url: null,
    is_primary: false,
    avatar: 'MR',
    color: 'bg-pink-500'
  },
];

const mockProjects = [
  {
    id: 1,
    name: 'Refonte Site Web',
    status: 'in_progress',
    progress: 65,
    start_date: '2026-01-01',
    end_date: '2026-03-31',
    budget: 75000
  },
  {
    id: 2,
    name: 'Migration Cloud',
    status: 'completed',
    progress: 100,
    start_date: '2025-10-01',
    end_date: '2025-12-31',
    budget: 120000
  },
  {
    id: 3,
    name: 'Application Mobile',
    status: 'planning',
    progress: 15,
    start_date: '2026-02-01',
    end_date: '2026-06-30',
    budget: 95000
  },
];

const mockOpportunities = [
  {
    id: 1,
    name: 'Contrat de maintenance annuel',
    value: 45000,
    stage: 'negotiation',
    probability: 75,
    close_date: '2026-02-15'
  },
  {
    id: 2,
    name: 'Extension plateforme e-commerce',
    value: 85000,
    stage: 'proposal',
    probability: 60,
    close_date: '2026-03-01'
  },
];

const statusConfig = {
  in_progress: { label: 'En cours', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  completed: { label: 'Terminé', color: 'bg-green-500/10 text-green-600 border-green-500/30' },
  planning: { label: 'Planification', color: 'bg-orange-500/10 text-orange-600 border-orange-500/30' },
};

const stageConfig = {
  negotiation: { label: 'Négociation', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  proposal: { label: 'Proposition', color: 'bg-purple-500/10 text-purple-600 border-purple-500/30' },
};

export default function EntrepriseDetailDemoPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'contacts' | 'projects' | 'opportunities'>('overview');

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
        {/* Back Button */}
        <div>
          <Link href="/dashboard/reseau/entreprises">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux entreprises
            </Button>
          </Link>
        </div>

        {/* Company Header Card */}
        <Card className="glass-card rounded-2xl border border-[#A7A2CF]/20 overflow-hidden">
          <div className="relative h-32 bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] opacity-90">
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
              backgroundSize: '200px 200px'
            }} />
          </div>
          
          <div className="px-8 pb-6">
            <div className="flex items-start gap-6 -mt-16 relative">
              {mockCompany.logo_url ? (
                <img
                  src={mockCompany.logo_url}
                  alt={mockCompany.name}
                  className="w-32 h-32 rounded-xl object-cover border-4 border-white dark:border-gray-800 shadow-lg bg-white"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`w-32 h-32 rounded-xl bg-white dark:bg-gray-800 border-4 border-white dark:border-gray-800 shadow-lg flex items-center justify-center ${mockCompany.logo_url ? 'hidden' : ''}`}>
                <Building2 className="w-16 h-16 text-[#523DC9]" />
              </div>

              <div className="flex-1 mt-16">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-3xl font-black text-gray-900 dark:text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                        {mockCompany.name}
                      </h1>
                      {mockCompany.is_client && (
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/30 border flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Client
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-2xl">
                      {mockCompany.description}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Briefcase className="w-4 h-4" />
                        <span>{mockCompany.industry}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Users className="w-4 h-4" />
                        <span>{mockCompany.employee_count} employés</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>Fondée en {mockCompany.founded_year}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      Modifier
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#523DC9]/10 border border-[#523DC9]/30">
                <Users className="w-6 h-6 text-[#523DC9]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {mockContacts.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Contacts</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30">
                <Briefcase className="w-6 h-6 text-[#10B981]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {mockProjects.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Projets</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30">
                <TrendingUp className="w-6 h-6 text-[#F59E0B]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {mockOpportunities.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Opportunités</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/30">
                <DollarSign className="w-6 h-6 text-[#3B82F6]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {formatCurrency(mockCompany.annual_revenue)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Revenu annuel</div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-3 px-1 border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-[#523DC9] text-[#523DC9] font-semibold'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Vue d'ensemble
            </button>
            <button
              onClick={() => setActiveTab('contacts')}
              className={`pb-3 px-1 border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'contacts'
                  ? 'border-[#523DC9] text-[#523DC9] font-semibold'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Contacts
              <Badge className="bg-[#523DC9]/10 text-[#523DC9]">{mockContacts.length}</Badge>
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`pb-3 px-1 border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'projects'
                  ? 'border-[#523DC9] text-[#523DC9] font-semibold'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Projets
              <Badge className="bg-[#10B981]/10 text-[#10B981]">{mockProjects.length}</Badge>
            </button>
            <button
              onClick={() => setActiveTab('opportunities')}
              className={`pb-3 px-1 border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'opportunities'
                  ? 'border-[#523DC9] text-[#523DC9] font-semibold'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Opportunités
              <Badge className="bg-[#F59E0B]/10 text-[#F59E0B]">{mockOpportunities.length}</Badge>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contact Information */}
            <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informations de contact</h3>
              <div className="space-y-4">
                {mockCompany.website && (
                  <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Site web</p>
                      <a href={mockCompany.website} target="_blank" rel="noopener noreferrer" className="text-[#523DC9] hover:underline flex items-center gap-1">
                        {mockCompany.website}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}
                {mockCompany.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Email</p>
                      <a href={`mailto:${mockCompany.email}`} className="text-gray-900 dark:text-white hover:text-[#523DC9]">
                        {mockCompany.email}
                      </a>
                    </div>
                  </div>
                )}
                {mockCompany.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Téléphone</p>
                      <a href={`tel:${mockCompany.phone}`} className="text-gray-900 dark:text-white hover:text-[#523DC9]">
                        {mockCompany.phone}
                      </a>
                    </div>
                  </div>
                )}
                {(mockCompany.address || mockCompany.city) && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Adresse</p>
                      <p className="text-gray-900 dark:text-white">
                        {mockCompany.address}<br />
                        {mockCompany.city}, {mockCompany.state} {mockCompany.postal_code}<br />
                        {mockCompany.country}
                      </p>
                    </div>
                  </div>
                )}
                {mockCompany.linkedin_url && (
                  <div className="flex items-start gap-3">
                    <Linkedin className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">LinkedIn</p>
                      <a href={mockCompany.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-[#523DC9] hover:underline flex items-center gap-1">
                        Voir le profil
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Recent Activity */}
            <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Activité récente</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-900 dark:text-white font-medium">Nouvelle soumission créée</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Il y a 2 heures</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-900 dark:text-white font-medium">Projet "Migration Cloud" terminé</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Il y a 5 jours</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-900 dark:text-white font-medium">Nouveau contact ajouté</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Il y a 1 semaine</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-4 h-4 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-900 dark:text-white font-medium">Réunion planifiée</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Il y a 2 semaines</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'contacts' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Contacts ({mockContacts.length})
              </h2>
              <Button className="hover-nukleo">
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un contact
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockContacts.map((contact) => (
                <Card key={contact.id} className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:border-[#523DC9]/40 transition-all duration-200 cursor-pointer">
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-14 h-14 rounded-full ${contact.color} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>
                      {contact.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {contact.first_name} {contact.last_name}
                        </h3>
                        {contact.is_primary && (
                          <Badge className="bg-[#523DC9]/10 text-[#523DC9] text-xs">Principal</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{contact.title}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <a href={`mailto:${contact.email}`} className="hover:text-[#523DC9] truncate">
                        {contact.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      <a href={`tel:${contact.phone}`} className="hover:text-[#523DC9]">
                        {contact.phone}
                      </a>
                    </div>
                    {contact.linkedin_url && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Linkedin className="w-4 h-4 flex-shrink-0" />
                        <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer" className="hover:text-[#523DC9] flex items-center gap-1">
                          LinkedIn
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Mail className="w-4 h-4 mr-1" />
                      Email
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Phone className="w-4 h-4 mr-1" />
                      Appeler
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Projets ({mockProjects.length})
              </h2>
              <Button className="hover-nukleo">
                <Plus className="w-4 h-4 mr-2" />
                Nouveau projet
              </Button>
            </div>

            <div className="space-y-4">
              {mockProjects.map((project) => (
                <Card key={project.id} className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:border-[#523DC9]/40 transition-all duration-200 cursor-pointer">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{project.name}</h3>
                        <Badge className={`${statusConfig[project.status as keyof typeof statusConfig].color} border`}>
                          {statusConfig[project.status as keyof typeof statusConfig].label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(project.start_date).toLocaleDateString('fr-CA')} - {new Date(project.end_date).toLocaleDateString('fr-CA')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          <span>{formatCurrency(project.budget)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Progression</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-[#523DC9] to-[#6B1817] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'opportunities' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Opportunités ({mockOpportunities.length})
              </h2>
              <Button className="hover-nukleo">
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle opportunité
              </Button>
            </div>

            <div className="space-y-4">
              {mockOpportunities.map((opportunity) => (
                <Card key={opportunity.id} className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:border-[#523DC9]/40 transition-all duration-200 cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{opportunity.name}</h3>
                        <Badge className={`${stageConfig[opportunity.stage as keyof typeof stageConfig].color} border`}>
                          {stageConfig[opportunity.stage as keyof typeof stageConfig].label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(opportunity.value)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          <span>{opportunity.probability}% de probabilité</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>Clôture: {new Date(opportunity.close_date).toLocaleDateString('fr-CA')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </MotionDiv>
    </PageContainer>
  );
}
