'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { 
  Target, Plus, Search, DollarSign, Calendar, User, Building2, 
  TrendingUp, Mail, Phone, Clock, Tag
} from 'lucide-react';
import { Badge, Button, Card, Input } from '@/components/ui';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type Stage = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';

interface Opportunity {
  id: string;
  title: string;
  company: string;
  contact: string;
  email: string;
  phone: string;
  value: number;
  stage: Stage;
  closeDate: string;
  description: string;
  tags: string[];
  lastActivity: string;
}

const stageConfig: Record<Stage, { label: string; color: string; bgColor: string; borderColor: string }> = {
  lead: { label: 'Lead', color: 'text-gray-700 dark:text-gray-300', bgColor: 'bg-gray-100 dark:bg-gray-800', borderColor: 'border-gray-300 dark:border-gray-700' },
  qualified: { label: 'Qualifié', color: 'text-blue-700 dark:text-blue-300', bgColor: 'bg-blue-50 dark:bg-blue-900/20', borderColor: 'border-blue-300 dark:border-blue-700' },
  proposal: { label: 'Proposition', color: 'text-purple-700 dark:text-purple-300', bgColor: 'bg-purple-50 dark:bg-purple-900/20', borderColor: 'border-purple-300 dark:border-purple-700' },
  negotiation: { label: 'Négociation', color: 'text-orange-700 dark:text-orange-300', bgColor: 'bg-orange-50 dark:bg-orange-900/20', borderColor: 'border-orange-300 dark:border-orange-700' },
  closed_won: { label: 'Gagné', color: 'text-green-700 dark:text-green-300', bgColor: 'bg-green-50 dark:bg-green-900/20', borderColor: 'border-green-300 dark:border-green-700' },
  closed_lost: { label: 'Perdu', color: 'text-red-700 dark:text-red-300', bgColor: 'bg-red-50 dark:bg-red-900/20', borderColor: 'border-red-300 dark:border-red-700' },
};

function OpportunityCard({ opportunity, isDragging }: { opportunity: Opportunity; isDragging?: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: opportunity.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CA', { 
      style: 'currency', 
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-CA', { 
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing"
    >
      <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20 hover:border-[#523DC9]/40 hover:shadow-lg transition-all duration-200 group">
        {/* Header */}
        <div className="mb-3">
          <h4 className="font-semibold text-base mb-1 group-hover:text-[#523DC9] transition-colors">
            {opportunity.title}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {opportunity.description}
          </p>
        </div>

        {/* Company & Contact */}
        <div className="space-y-2 mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="w-4 h-4 text-gray-500" />
            <span className="font-medium">{opportunity.company}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <User className="w-4 h-4" />
            <span>{opportunity.contact}</span>
          </div>
        </div>

        {/* Value & Date */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              Valeur
            </div>
            <div className="text-lg font-bold text-[#523DC9]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {formatCurrency(opportunity.value)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Clôture
            </div>
            <div className="text-sm font-medium">
              {formatDate(opportunity.closeDate)}
            </div>
          </div>
        </div>

        {/* Tags */}
        {opportunity.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {opportunity.tags.map((tag, index) => (
              <Badge key={index} className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Last Activity */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-500">
          <Clock className="w-3 h-3" />
          <span>{opportunity.lastActivity}</span>
        </div>
      </Card>
    </div>
  );
}

function DroppableColumn({ 
  stage, 
  opportunities 
}: { 
  stage: Stage; 
  opportunities: Opportunity[];
}) {
  const config = stageConfig[stage];
  const totalValue = opportunities.reduce((sum, opp) => sum + opp.value, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CA', { 
      style: 'currency', 
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="flex flex-col h-full min-w-[320px]">
      {/* Column Header */}
      <div className={`${config.bgColor} ${config.borderColor} border-2 rounded-xl p-4 mb-3`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Badge className={`${config.color} ${config.bgColor} ${config.borderColor} border-2 font-semibold px-3 py-1`}>
              {config.label}
            </Badge>
            <Badge className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 font-bold">
              {opportunities.length}
            </Badge>
          </div>
        </div>
        <div className="text-sm font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          {formatCurrency(totalValue)}
        </div>
      </div>

      {/* Cards Container */}
      <SortableContext items={opportunities.map(o => o.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 space-y-3 overflow-y-auto min-h-[400px] max-h-[calc(100vh-300px)] pr-2">
          {opportunities.length === 0 ? (
            <div className="flex items-center justify-center h-32 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
              <p className="text-sm text-gray-500 dark:text-gray-500">Aucune opportunité</p>
            </div>
          ) : (
            opportunities.map((opportunity) => (
              <OpportunityCard key={opportunity.id} opportunity={opportunity} />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export default function PipelineDemo() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const [opportunities, setOpportunities] = useState<Opportunity[]>([
    {
      id: '1',
      title: 'Refonte Site Web Corporate',
      company: 'ABC Corporation',
      contact: 'Marie Dubois',
      email: 'marie.dubois@abc.com',
      phone: '514-555-0101',
      value: 45000,
      stage: 'lead',
      closeDate: '2026-03-15',
      description: 'Refonte complète du site web avec nouveau design et CMS',
      tags: ['Web', 'Design'],
      lastActivity: 'Il y a 2 heures'
    },
    {
      id: '2',
      title: 'App Mobile E-commerce',
      company: 'XYZ Limited',
      contact: 'Jean Martin',
      email: 'j.martin@xyz.com',
      phone: '514-555-0102',
      value: 85000,
      stage: 'qualified',
      closeDate: '2026-02-28',
      description: 'Développement application iOS et Android pour boutique en ligne',
      tags: ['Mobile', 'E-commerce'],
      lastActivity: 'Il y a 5 heures'
    },
    {
      id: '3',
      title: 'Système CRM Custom',
      company: 'Tech Solutions Inc',
      contact: 'Sophie Tremblay',
      email: 'stremblay@techsol.com',
      phone: '514-555-0103',
      value: 120000,
      stage: 'proposal',
      closeDate: '2026-04-10',
      description: 'CRM sur mesure avec intégrations multiples',
      tags: ['CRM', 'Enterprise'],
      lastActivity: 'Il y a 1 jour'
    },
    {
      id: '4',
      title: 'Plateforme SaaS B2B',
      company: 'Innovation Labs',
      contact: 'Pierre Gagnon',
      email: 'pgagnon@innovlabs.com',
      phone: '514-555-0104',
      value: 250000,
      stage: 'negotiation',
      closeDate: '2026-03-30',
      description: 'Plateforme SaaS complète pour gestion de projets',
      tags: ['SaaS', 'B2B', 'Cloud'],
      lastActivity: 'Il y a 3 heures'
    },
    {
      id: '5',
      title: 'Migration Cloud AWS',
      company: 'Global Enterprises',
      contact: 'Luc Bergeron',
      email: 'lbergeron@global.com',
      phone: '514-555-0105',
      value: 95000,
      stage: 'closed_won',
      closeDate: '2026-01-15',
      description: 'Migration infrastructure vers AWS avec formation',
      tags: ['Cloud', 'AWS', 'Migration'],
      lastActivity: 'Il y a 2 jours'
    },
    {
      id: '6',
      title: 'App Gestion Inventaire',
      company: 'Retail Plus',
      contact: 'Anne Lavoie',
      email: 'alavoie@retailplus.com',
      phone: '514-555-0106',
      value: 35000,
      stage: 'lead',
      closeDate: '2026-05-20',
      description: 'Application de gestion d\'inventaire en temps réel',
      tags: ['Retail', 'Inventaire'],
      lastActivity: 'Il y a 4 heures'
    },
    {
      id: '7',
      title: 'Portail Client B2C',
      company: 'Services Pro',
      contact: 'Marc Bouchard',
      email: 'mbouchard@servicespro.com',
      phone: '514-555-0107',
      value: 62000,
      stage: 'qualified',
      closeDate: '2026-03-25',
      description: 'Portail client avec espace membre et paiements',
      tags: ['Portail', 'B2C'],
      lastActivity: 'Il y a 6 heures'
    },
    {
      id: '8',
      title: 'Intégration ERP',
      company: 'Manufacturing Co',
      contact: 'Julie Côté',
      email: 'jcote@manufco.com',
      phone: '514-555-0108',
      value: 180000,
      stage: 'proposal',
      closeDate: '2026-04-30',
      description: 'Intégration ERP avec systèmes existants',
      tags: ['ERP', 'Intégration'],
      lastActivity: 'Il y a 1 jour'
    }
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Check if we're dropping on a stage (column)
    const stages: Stage[] = ['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
    const targetStage = stages.find(stage => overId === stage);

    if (targetStage) {
      setOpportunities(prev =>
        prev.map(opp =>
          opp.id === activeId
            ? { ...opp, stage: targetStage }
            : opp
        )
      );
    } else {
      // Dropping on another card - find the stage of the card we're dropping on
      const targetOpp = opportunities.find(opp => opp.id === overId);
      if (targetOpp) {
        setOpportunities(prev =>
          prev.map(opp =>
            opp.id === activeId
              ? { ...opp, stage: targetOpp.stage }
              : opp
          )
        );
      }
    }

    setActiveId(null);
  };

  const filteredOpportunities = opportunities.filter(opp =>
    opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    opp.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    opp.contact.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stages: Stage[] = ['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
  
  const opportunitiesByStage = stages.reduce((acc, stage) => {
    acc[stage] = filteredOpportunities.filter(opp => opp.stage === stage);
    return acc;
  }, {} as Record<Stage, Opportunity[]>);

  const totalValue = filteredOpportunities.reduce((sum, opp) => sum + opp.value, 0);
  const totalOpportunities = filteredOpportunities.length;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CA', { 
      style: 'currency', 
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const activeOpportunity = opportunities.find(opp => opp.id === activeId);

  return (
    <PageContainer>
      <MotionDiv variant="slideUp" duration="normal">
        {/* Hero Header */}
        <div className="relative mb-6 overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] opacity-90" />
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
            backgroundSize: '200px 200px'
          }} />
          <div className="relative px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    Pipeline de Vente
                  </h1>
                  <p className="text-white/80 text-sm">Glissez-déposez les opportunités entre les étapes</p>
                </div>
              </div>
              <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm">
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle opportunité
              </Button>
            </div>
          </div>
        </div>

        {/* Stats & Search */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
                <Target className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Opportunités</div>
            </div>
            <div className="text-2xl font-bold text-purple-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {totalOpportunities}
            </div>
          </Card>

          <Card className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Valeur totale</div>
            </div>
            <div className="text-2xl font-bold text-blue-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {formatCurrency(totalValue)}
            </div>
          </Card>

          <Card className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </Card>
        </div>

        {/* Kanban Board */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {stages.map((stage) => (
                <DroppableColumn
                  key={stage}
                  stage={stage}
                  opportunities={opportunitiesByStage[stage]}
                />
              ))}
            </div>
          </div>

          <DragOverlay>
            {activeOpportunity ? (
              <OpportunityCard opportunity={activeOpportunity} isDragging />
            ) : null}
          </DragOverlay>
        </DndContext>
      </MotionDiv>
    </PageContainer>
  );
}
