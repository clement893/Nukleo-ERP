'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useMemo } from 'react';
import { useRouter } from '@/i18n/routing';
import { Plus, Search, Users, DollarSign, Target, User } from 'lucide-react';
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
    tags: ['Tech', 'B2B'],
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
    tags: ['Innovation', 'B2B'],
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
    tags: ['Consulting'],
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
    tags: ['Sécurité'],
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
    tags: ['Formation'],
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
    tags: ['Cloud', 'Enterprise'],
  },
  {
    id: '7',
    name: 'DataFlow Systems',
    contact: 'Anne Gagnon',
    email: 'anne@dataflow.ca',
    phone: '+1 514 555-0129',
    stage: 'qualified',
    value: 175000,
    opportunities: 4,
    last_interaction: '2024-01-17',
    created_at: '2023-12-15',
    tags: ['Data', 'B2B'],
  },
  {
    id: '8',
    name: 'WebDesign Plus',
    contact: 'Marc Tremblay',
    email: 'marc@webdesignplus.com',
    phone: '+1 514 555-0130',
    stage: 'proposal',
    value: 85000,
    opportunities: 2,
    last_interaction: '2024-01-14',
    created_at: '2024-01-02',
    tags: ['Design'],
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
  const [dragOverStage, setDragOverStage] = useState<Stage | null>(null);
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

  const handleDragOver = (e: React.DragEvent, stage: Stage) => {
    e.preventDefault();
    setDragOverStage(stage);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = (stage: Stage) => {
    if (draggedClient) {
      // Ici on mettrait à jour le stage du client via API
      console.log(`Moving ${draggedClient.name} to ${stage}`);
      setDraggedClient(null);
      setDragOverStage(null);
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
    <div className="flex flex-col h-screen">
      {/* Compact Header */}
      <div className="relative -mt-4 -mx-4 px-4 py-4">
        <div className="absolute inset-0 bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] opacity-90" />
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
          backgroundSize: '200px 200px'
        }} />
        
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Pipeline de Vente
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {/* Inline Stats */}
            <div className="flex items-center gap-6 text-white/90 text-sm">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="font-bold">{stats.total}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <span className="font-bold">{formatCurrency(stats.totalValue)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                <span className="font-bold">{stats.totalOpportunities}</span>
              </div>
            </div>
            <Button className="bg-white text-[#523DC9] hover:bg-white/90" onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une opportunité
            </Button>
          </div>
        </div>
      </div>

      {/* Compact Search */}
      <div className="px-4 py-3">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 py-2"
          />
        </div>
      </div>

      {/* Kanban Pipeline - PLEINE HAUTEUR */}
      <div className="flex-1 overflow-x-auto px-4 pb-4">
        <div className="flex gap-3 h-full">
          {clientsByStage.map((stage) => (
            <div
              key={stage.id}
              className={`flex-1 min-w-[320px] transition-all duration-200 ${
                dragOverStage === stage.id ? 'scale-105' : ''
              }`}
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragLeave={handleDragLeave}
              onDrop={() => handleDrop(stage.id)}
            >
              <div className={`glass-card rounded-xl border-2 h-full flex flex-col transition-all duration-200 ${
                dragOverStage === stage.id 
                  ? 'border-[#523DC9] shadow-2xl shadow-[#523DC9]/20' 
                  : 'border-[#A7A2CF]/20'
              }`}>
                {/* Column Header */}
                <div className={`p-3 rounded-t-xl ${stage.bgColor}`}>
                  <div className="flex items-center justify-between">
                    <h3 className={`text-sm font-bold ${stage.color}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {stage.label}
                    </h3>
                    <Badge variant="default" className="text-xs">{stage.clients.length}</Badge>
                  </div>
                </div>

                {/* Clients */}
                <div className="flex-1 p-3 space-y-2 overflow-y-auto">
                  {stage.clients.map((client) => (
                    <div
                      key={client.id}
                      draggable
                      onDragStart={() => handleDragStart(client)}
                      onClick={() => router.push(`/dashboard/pipeline-client-demo/${client.id}`)}
                      className={`bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-[#523DC9] hover:shadow-lg transition-all duration-200 cursor-move group ${
                        draggedClient?.id === client.id ? 'opacity-50 scale-95' : ''
                      }`}
                    >
                      {/* Company Name */}
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-2 group-hover:text-[#523DC9] transition-colors truncate" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                        {client.name}
                      </h4>

                      {/* Value */}
                      <div className="text-lg font-bold text-[#523DC9] mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                        {formatCurrency(client.value)}
                      </div>

                      {/* Details */}
                      <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400 mb-2">
                        <div className="flex items-center gap-1.5 truncate">
                          <User className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{client.contact}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Target className="w-3 h-3 flex-shrink-0" />
                          <span>{client.opportunities} opp.</span>
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1">
                        {client.tags.map((tag, index) => (
                          <span key={index} className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
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

      {/* Modal Création Opportunité - EMBELLI */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title=""
        size="md"
        footer={null}
      >
        <div className="p-6">
          {/* Header Modal */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-lg bg-[#523DC9]/10 border border-[#523DC9]/30">
                <Plus className="w-6 h-6 text-[#523DC9]" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Nouvelle opportunité
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Ajoutez un nouveau prospect à votre pipeline</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Titre de l'opportunité <span className="text-red-500">*</span>
              </label>
              <Input
                value={opportunityForm.title}
                onChange={(e) => setOpportunityForm({ ...opportunityForm, title: e.target.value })}
                placeholder="Ex: Refonte site web"
                fullWidth
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Entreprise <span className="text-red-500">*</span>
                </label>
                <Input
                  value={opportunityForm.company}
                  onChange={(e) => setOpportunityForm({ ...opportunityForm, company: e.target.value })}
                  placeholder="Ex: TechCorp Inc."
                  fullWidth
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Contact <span className="text-red-500">*</span>
                </label>
                <Input
                  value={opportunityForm.contact}
                  onChange={(e) => setOpportunityForm({ ...opportunityForm, contact: e.target.value })}
                  placeholder="Ex: Marie Dubois"
                  fullWidth
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Email
                </label>
                <Input
                  type="email"
                  value={opportunityForm.email}
                  onChange={(e) => setOpportunityForm({ ...opportunityForm, email: e.target.value })}
                  placeholder="email@example.com"
                  fullWidth
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Téléphone
                </label>
                <Input
                  type="tel"
                  value={opportunityForm.phone}
                  onChange={(e) => setOpportunityForm({ ...opportunityForm, phone: e.target.value })}
                  placeholder="+1 514 555-0123"
                  fullWidth
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Valeur estimée (CAD)
              </label>
              <Input
                type="number"
                value={opportunityForm.value}
                onChange={(e) => setOpportunityForm({ ...opportunityForm, value: e.target.value })}
                placeholder="50000"
                fullWidth
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Description
              </label>
              <Textarea
                value={opportunityForm.description}
                onChange={(e) => setOpportunityForm({ ...opportunityForm, description: e.target.value })}
                placeholder="Décrivez l'opportunité..."
                rows={3}
                fullWidth
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1">
              Annuler
            </Button>
            <Button onClick={handleCreateOpportunity} className="flex-1">
              <Plus className="w-4 h-4 mr-2" />
              Créer l'opportunité
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
