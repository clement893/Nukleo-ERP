'use client';

export const dynamic = 'force-dynamic';

import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Calendar,
  DollarSign,
  Briefcase,
  Users,
  FileText,
  TrendingUp,
  Clock,
  Edit,
  MoreVertical,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Badge, Button, Card } from '@/components/ui';

const clientData = {
  id: 1,
  name: 'TechCorp Inc.',
  logo: null,
  status: 'active',
  type: 'Entreprise',
  industry: 'Technologie',
  email: 'contact@techcorp.com',
  phone: '+1 (514) 555-0123',
  website: 'www.techcorp.com',
  address: '1234 Rue Saint-Laurent, Montréal, QC H2X 2T3',
  country: 'Canada',
  createdAt: '2024-03-15',
  contactPerson: {
    name: 'Jean Tremblay',
    position: 'Directeur des Opérations',
    email: 'j.tremblay@techcorp.com',
    phone: '+1 (514) 555-0124'
  },
  stats: {
    totalProjects: 8,
    activeProjects: 3,
    completedProjects: 5,
    totalRevenue: 450000,
    pendingInvoices: 2,
    totalInvoices: 12
  },
  recentProjects: [
    { id: 1, name: 'Refonte Site Web', status: 'in_progress', budget: 75000, progress: 65, startDate: '2025-11-01', endDate: '2026-02-28' },
    { id: 2, name: 'Application Mobile', status: 'in_progress', budget: 120000, progress: 40, startDate: '2025-12-15', endDate: '2026-04-30' },
    { id: 3, name: 'Système CRM', status: 'completed', budget: 95000, progress: 100, startDate: '2025-06-01', endDate: '2025-10-31' },
    { id: 4, name: 'Migration Cloud', status: 'completed', budget: 85000, progress: 100, startDate: '2025-03-01', endDate: '2025-08-15' },
  ],
  recentInvoices: [
    { id: 'INV-2026-001', amount: 75000, status: 'paid', dueDate: '2026-01-15', paidDate: '2026-01-10', project: 'Refonte Site Web' },
    { id: 'INV-2025-045', amount: 45000, status: 'pending', dueDate: '2026-01-30', paidDate: null, project: 'Application Mobile' },
    { id: 'INV-2025-038', amount: 95000, status: 'paid', dueDate: '2025-11-15', paidDate: '2025-11-12', project: 'Système CRM' },
    { id: 'INV-2025-029', amount: 85000, status: 'paid', dueDate: '2025-09-01', paidDate: '2025-08-28', project: 'Migration Cloud' },
  ],
  notes: [
    { id: 1, content: 'Client très satisfait du dernier projet. Intéressé par de futurs développements.', author: 'Marie Dubois', date: '2025-12-20' },
    { id: 2, content: 'Réunion prévue le 15 janvier pour discuter de nouveaux besoins.', author: 'Jean Martin', date: '2025-12-15' },
  ]
};

const statusConfig = {
  active: { label: 'Actif', color: 'bg-green-500/10 text-green-600 border-green-500/30' },
  inactive: { label: 'Inactif', color: 'bg-gray-500/10 text-gray-600 border-gray-500/30' },
  suspended: { label: 'Suspendu', color: 'bg-red-500/10 text-red-600 border-red-500/30' }
};

const projectStatusConfig = {
  in_progress: { label: 'En cours', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  completed: { label: 'Terminé', color: 'bg-green-500/10 text-green-600 border-green-500/30' },
  on_hold: { label: 'En pause', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30' }
};

const invoiceStatusConfig = {
  paid: { label: 'Payée', color: 'bg-green-500/10 text-green-600 border-green-500/30', icon: CheckCircle2 },
  pending: { label: 'En attente', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30', icon: Clock },
  overdue: { label: 'En retard', color: 'bg-red-500/10 text-red-600 border-red-500/30', icon: AlertCircle }
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
  }).format(amount);
};

export default function ClientDetailDemo() {
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
                <div className="w-16 h-16 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-3xl font-black text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {clientData.name}
                    </h1>
                    <Badge className={`${statusConfig[clientData.status as keyof typeof statusConfig].color} border`}>
                      {statusConfig[clientData.status as keyof typeof statusConfig].label}
                    </Badge>
                  </div>
                  <p className="text-white/80 text-sm">{clientData.industry} • Client depuis {new Date(clientData.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier
                </Button>
                <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <Briefcase className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Projets actifs</div>
            </div>
            <div className="text-3xl font-bold text-blue-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {clientData.stats.activeProjects}
            </div>
            <p className="text-xs text-gray-500 mt-1">{clientData.stats.totalProjects} au total</p>
          </Card>

          <Card className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/30">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Revenus totaux</div>
            </div>
            <div className="text-3xl font-bold text-green-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {formatCurrency(clientData.stats.totalRevenue)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Depuis le début</p>
          </Card>

          <Card className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Factures</div>
            </div>
            <div className="text-3xl font-bold text-purple-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {clientData.stats.totalInvoices}
            </div>
            <p className="text-xs text-gray-500 mt-1">{clientData.stats.pendingInvoices} en attente</p>
          </Card>

          <Card className="glass-card p-5 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/30">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Taux de succès</div>
            </div>
            <div className="text-3xl font-bold text-orange-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {Math.round((clientData.stats.completedProjects / clientData.stats.totalProjects) * 100)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">{clientData.stats.completedProjects} projets terminés</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Contact Information */}
          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Informations de contact
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-medium text-sm">{clientData.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Téléphone</p>
                  <p className="font-medium text-sm">{clientData.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Globe className="w-5 h-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Site web</p>
                  <p className="font-medium text-sm text-blue-600">{clientData.website}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Adresse</p>
                  <p className="font-medium text-sm">{clientData.address}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Contact Person */}
          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Personne de contact
            </h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#523DC9] flex items-center justify-center text-white font-semibold">
                {clientData.contactPerson.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <p className="font-semibold">{clientData.contactPerson.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{clientData.contactPerson.position}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-gray-500" />
                <span>{clientData.contactPerson.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-gray-500" />
                <span>{clientData.contactPerson.phone}</span>
              </div>
            </div>
          </Card>

          {/* Company Details */}
          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Détails de l'entreprise
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">Type</p>
                <p className="font-medium">{clientData.type}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Industrie</p>
                <p className="font-medium">{clientData.industry}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Pays</p>
                <p className="font-medium">{clientData.country}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Client depuis</p>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <p className="font-medium">{new Date(clientData.createdAt).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Projects */}
        <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 mb-6">
          <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Projets récents
          </h3>
          <div className="space-y-3">
            {clientData.recentProjects.map((project) => (
              <div key={project.id} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-semibold">{project.name}</h4>
                      <Badge className={`${projectStatusConfig[project.status as keyof typeof projectStatusConfig].color} border`}>
                        {projectStatusConfig[project.status as keyof typeof projectStatusConfig].label}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(project.startDate).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })} - {new Date(project.endDate).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#523DC9]">{formatCurrency(project.budget)}</p>
                  </div>
                </div>
                {project.status === 'in_progress' && (
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Progression</span>
                      <span className="font-bold text-[#523DC9]">{project.progress}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#523DC9] to-[#5F2B75]"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Invoices */}
        <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 mb-6">
          <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Factures récentes
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Numéro</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Projet</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Montant</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Statut</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {clientData.recentInvoices.map((invoice) => {
                  const statusKey = invoice.status as keyof typeof invoiceStatusConfig;
                  const StatusIcon = invoiceStatusConfig[statusKey].icon;
                  return (
                    <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{invoice.id}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{invoice.project}</td>
                      <td className="px-4 py-3 font-semibold">{formatCurrency(invoice.amount)}</td>
                      <td className="px-4 py-3">
                        <Badge className={`${invoiceStatusConfig[statusKey].color} border flex items-center gap-1 w-fit`}>
                          <StatusIcon className="w-3 h-3" />
                          {invoiceStatusConfig[statusKey].label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {invoice.paidDate ? new Date(invoice.paidDate).toLocaleDateString('fr-FR') : new Date(invoice.dueDate).toLocaleDateString('fr-FR')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Notes */}
        <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
          <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Notes
          </h3>
          <div className="space-y-3">
            {clientData.notes.map((note) => (
              <div key={note.id} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <p className="text-sm mb-2">{note.content}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Users className="w-3 h-3" />
                  <span>{note.author}</span>
                  <span>•</span>
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(note.date).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </MotionDiv>
    </PageContainer>
  );
}
