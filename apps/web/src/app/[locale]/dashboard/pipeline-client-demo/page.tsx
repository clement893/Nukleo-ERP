'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useMemo } from 'react';
import { useRouter } from '@/i18n/routing';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { Plus, Search, Users, TrendingUp, DollarSign, Target, User, Calendar } from 'lucide-react';
import { Badge, Button, Input, Modal, Textarea } from '@/components/ui';

// Mock data
const mockClients = [
  {
    id: 'c7b4d752-0705-4618-8519-14a756d0fd0f',
    name: 'TechCorp Inc.',
    contact: 'Marie Dubois',
    email: 'marie@techcorp.com',
    phone: '+1 514 555-0123',
    stage: 'lead',
    value: 125000,
    opportunities: 3,
    last_interaction: '2024-01-15',
    created_at: '2023-12-01',
    tags: ['Tech', 'B2B', 'Enterprise'],
  },
  {
    id: '2',
    name: 'Innovation Labs',
    contact: 'Jean Martin',
    email: 'jean@innolabs.com',
    phone: '+1 514 555-0124',
    stage: 'qualified',
    value: 250000,
    opportunities: 5,
    last_interaction: '2024-01-18',
    created_at: '2023-10-15',
    tags: ['Innovation', 'B2B', 'Partenaire'],
  },
  {
    id: '3',
    name: 'Groupe Innovant',
    contact: 'Sophie Tremblay',
    email: 'sophie@groupe-innovant.ca',
    phone: '+1 514 555-0125',
    stage: 'proposal',
    value: 180000,
    opportunities: 2,
    last_interaction: '2024-01-20',
    created_at: '2024-01-05',
    tags: ['Consulting', 'B2B'],
  },
  {
    id: '4',
    name: 'SecureNet SA',
    contact: 'Pierre Lefebvre',
    email: 'pierre@securenet.com',
    phone: '+1 514 555-0126',
    stage: 'lead',
    value: 50000,
    opportunities: 1,
    last_interaction: '2024-01-10',
    created_at: '2024-01-08',
    tags: ['Sécurité', 'B2B'],
  },
  {
    id: '5',
    name: 'DevSchool Pro',
    contact: 'Lucie Bernard',
    email: 'lucie@devschool.pro',
    phone: '+1 514 555-0127',
    stage: 'negotiation',
    value: 95000,
    opportunities: 2,
    last_interaction: '2024-01-12',
    created_at: '2023-11-20',
    tags: ['Formation', 'B2B'],
  },
  {
    id: '6',
    name: 'CloudFirst Inc.',
    contact: 'Thomas Dubois',
    email: 'thomas@cloudfirst.io',
    phone: '+1 514 555-0128',
    stage: 'closed',
    value: 320000,
    opportunities: 6,
    last_interaction: '2024-01-19',
    created_at: '2023-09-10',
    tags: ['Cloud', 'B2B', 'Enterprise'],
  },
];

type Stage = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed';

const STAGES: { id: Stage; label: string; color: string; bgColor: string }[] = [
  { id: 'lead', label: 'Leads', color: 'text-gray-700 dark:text-gray-300', bgColor: 'bg-gray-100 dark:bg-gray-800' },
  { id: 'qualified', label: 'Qualifiés', color: 'text-blue-700 dark:text-blue-300', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
  { id: 'proposal', label: 'Proposition', color: 'text-yellow-700 dark:text-yellow-300', bgColor: 'bg-yellow-50 dark:bg-yellow-900/20' },
  { id: 'negotiation', label: 'Négociation', color: 'text-orange-700 dark:text-orange-300', bgColor: 'bg-orange-50 dark:bg-orange-900/20' },
  { id: 'closed', label: 'Clients', color: 'text-green-700 dark:text-green-300', bgColor: 'bg-green-50 dark:bg-green-900/20' },
];

export default function PipelineClientDemoPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedClient, setDraggedClient] = useState<typeof mockClients[0] | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [opportunityForm, setOpportunityForm] = useState({
    title: '',
    company: '',
    contact: '',
    email: '',
    phone: '',
    value: '',
    description: '',
  });

  const filteredClients = useMemo(() => {
    if (!searchQuery) return mockClients;
    
    const query = searchQuery.toLowerCase();
    return mockClients.filter(client =>
      client.name.toLowerCase().includes(query) ||
      client.contact.toLowerCase().includes(query) ||
      client.email.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const clientsByStage = useMemo(() => {
    return STAGES.map(stage => ({
      ...stage,
      clients: filteredClients.filter(c => c.stage === stage.id),
    }));
  }, [filteredClients]);

  const stats = useMemo(() => {
    const totalValue = mockClients.reduce((sum, client) => sum + client.value, 0);
    const totalOpportunities = mockClients.reduce((sum, client) => sum + client.opportunities, 0);
    const activeClients = mockClients.filter(c => c.stage === 'closed').length;
    
    return {
      total: mockClients.length,
      totalValue,
      totalOpportunities,
      activeClients,
    };
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleDragStart = (client: typeof mockClients[0]) => {
    setDraggedClient(client);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (stage: Stage) => {
    if (draggedClient) {
      // Ici on mettrait à jour le stage du client via API
      console.log(`Moving ${draggedClient.name} to ${stage}`);
      setDraggedClient(null);
    }
  };

  const handleCreateOpportunity = () => {
    console.log('Creating opportunity:', opportunityForm);
    setShowCreateModal(false);
    setOpportunityForm({
      title: '',
      company: '',
      contact: '',
      email: '',
      phone: '',
      value: '',
      description: '',
    });
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
          
          <div className="relative flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-black text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Pipeline de Vente
              </h1>
              <p className="text-white/80 text-lg">Gérez votre pipeline commercial en Kanban</p>
            </div>
            <Button className="bg-white text-[#523DC9] hover:bg-white/90" onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une opportunité
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#523DC9]/10 border border-[#523DC9]/30">
                <Users className="w-6 h-6 text-[#523DC9]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.total}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Prospects totaux</div>
          </div>

          <div className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30">
                <DollarSign className="w-6 h-6 text-[#10B981]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {formatCurrency(stats.totalValue)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Valeur totale</div>
          </div>

          <div className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/30">
                <Target className="w-6 h-6 text-[#3B82F6]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.totalOpportunities}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Opportunités</div>
          </div>

          <div className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30">
                <TrendingUp className="w-6 h-6 text-[#F59E0B]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.activeClients}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Clients actifs</div>
          </div>
        </div>

        {/* Search */}
        <div className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Rechercher un prospect..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Kanban Pipeline - PLEINE LARGEUR */}
        <div className="flex-1 overflow-x-auto -mx-4 px-4">
          <div className="flex gap-4 min-w-max pb-4">
            {clientsByStage.map((stage) => (
              <div
                key={stage.id}
                className="flex-1 min-w-[280px]"
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(stage.id)}
              >
                <div className="glass-card rounded-xl border border-[#A7A2CF]/20 h-full flex flex-col">
                  {/* Column Header */}
                  <div className={`p-4 rounded-t-xl ${stage.bgColor}`}>
                    <div className="flex items-center justify-between">
                      <h3 className={`font-bold ${stage.color}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                        {stage.label}
                      </h3>
                      <Badge variant="default">{stage.clients.length}</Badge>
                    </div>
                  </div>

                  {/* Clients */}
                  <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[600px]">
                    {stage.clients.map((client) => (
                      <div
                        key={client.id}
                        draggable
                        onDragStart={() => handleDragStart(client)}
                        onClick={() => router.push(`/dashboard/pipeline-client-demo/${client.id}`)}
                        className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-[#523DC9] hover:shadow-lg transition-all duration-200 cursor-move group"
                      >
                        {/* Company Name */}
                        <h4 className="font-bold text-gray-900 dark:text-white mb-2 group-hover:text-[#523DC9] transition-colors" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                          {client.name}
                        </h4>

                        {/* Value */}
                        <div className="text-xl font-bold text-[#523DC9] mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                          {formatCurrency(client.value)}
                        </div>

                        {/* Details */}
                        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>{client.contact}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Target className="w-4 h-4" />
                            <span>{client.opportunities} opportunités</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(client.last_interaction).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mt-3">
                          {client.tags.slice(0, 2).map((tag, index) => (
                            <span key={index} className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Création Opportunité */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Ajouter une opportunité"
          size="md"
          footer={
            <>
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreateOpportunity}>
                Créer l'opportunité
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <Input
                label="Titre de l'opportunité *"
                value={opportunityForm.title}
                onChange={(e) => setOpportunityForm({ ...opportunityForm, title: e.target.value })}
                placeholder="Ex: Refonte site web"
                fullWidth
              />
            </div>
            <div>
              <Input
                label="Entreprise *"
                value={opportunityForm.company}
                onChange={(e) => setOpportunityForm({ ...opportunityForm, company: e.target.value })}
                placeholder="Ex: TechCorp Inc."
                fullWidth
              />
            </div>
            <div>
              <Input
                label="Contact *"
                value={opportunityForm.contact}
                onChange={(e) => setOpportunityForm({ ...opportunityForm, contact: e.target.value })}
                placeholder="Ex: Marie Dubois"
                fullWidth
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Email"
                type="email"
                value={opportunityForm.email}
                onChange={(e) => setOpportunityForm({ ...opportunityForm, email: e.target.value })}
                placeholder="email@example.com"
                fullWidth
              />
              <Input
                label="Téléphone"
                type="tel"
                value={opportunityForm.phone}
                onChange={(e) => setOpportunityForm({ ...opportunityForm, phone: e.target.value })}
                placeholder="+1 514 555-0123"
                fullWidth
              />
            </div>
            <div>
              <Input
                label="Valeur estimée"
                type="number"
                value={opportunityForm.value}
                onChange={(e) => setOpportunityForm({ ...opportunityForm, value: e.target.value })}
                placeholder="50000"
                fullWidth
              />
            </div>
            <div>
              <Textarea
                label="Description"
                value={opportunityForm.description}
                onChange={(e) => setOpportunityForm({ ...opportunityForm, description: e.target.value })}
                placeholder="Décrivez l'opportunité..."
                rows={4}
                fullWidth
              />
            </div>
          </div>
        </Modal>
      </MotionDiv>
    </PageContainer>
  );
}
