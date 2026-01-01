'use client';

import { useState } from 'react';
import { ArrowLeft, Building2, Users, DollarSign, TrendingUp, Phone, Mail, Globe, MapPin, Calendar, FileText, Briefcase, User } from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui';
import Link from 'next/link';

export default function ClientDetailDemoPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'contacts' | 'documents'>('overview');

  // Mock data
  const client = {
    id: 69,
    name: 'Innovatech Solutions Inc.',
    type: 'Entreprise',
    industry: 'Technologies',
    status: 'Actif',
    revenue: 450000,
    employees: 125,
    address: '1250 Boulevard René-Lévesque O',
    city: 'Montréal',
    province: 'Québec',
    postalCode: 'H3B 4W8',
    phone: '+1 (514) 555-0100',
    email: 'info@innovatech.ca',
    website: 'www.innovatech.ca',
    founded: '2015',
    description: 'Leader québécois en solutions technologiques innovantes. Spécialisée dans l\'automatisation, l\'IA et la transformation numérique pour les entreprises.',
    logo: 'https://ui-avatars.com/api/?name=Innovatech&background=523DC9&color=fff&size=200',
  };

  const stats = [
    { icon: Briefcase, label: 'Projets actifs', value: '8', color: 'text-blue-600', bgColor: 'bg-blue-100' },
    { icon: Users, label: 'Contacts', value: '12', color: 'text-purple-600', bgColor: 'bg-purple-100' },
    { icon: DollarSign, label: 'Revenu annuel', value: '450k $', color: 'text-green-600', bgColor: 'bg-green-100' },
    { icon: TrendingUp, label: 'Croissance', value: '+25%', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  ];

  const projects = [
    { id: 1, name: 'Automatisation RH', status: 'En cours', progress: 65, budget: 85000, startDate: '2025-10-01', endDate: '2026-02-15' },
    { id: 2, name: 'Module IA Prédictive', status: 'En cours', progress: 40, budget: 120000, startDate: '2025-11-15', endDate: '2026-03-30' },
    { id: 3, name: 'Plateforme Web', status: 'Terminé', progress: 100, budget: 65000, startDate: '2025-06-01', endDate: '2025-09-30' },
    { id: 4, name: 'Formation Équipe', status: 'Planifié', progress: 0, budget: 15000, startDate: '2026-01-10', endDate: '2026-01-20' },
  ];

  const contacts = [
    { id: 1, name: 'Marie-Claude Tremblay', title: 'Directrice des Opérations', email: 'mc.tremblay@innovatech.ca', phone: '+1 (514) 555-0123', photo: 'https://i.pravatar.cc/150?img=47' },
    { id: 2, name: 'Jean-François Dubois', title: 'CTO', email: 'jf.dubois@innovatech.ca', phone: '+1 (514) 555-0124', photo: 'https://i.pravatar.cc/150?img=12' },
    { id: 3, name: 'Sophie Gagnon', title: 'Chef de Projet', email: 's.gagnon@innovatech.ca', phone: '+1 (514) 555-0125', photo: 'https://i.pravatar.cc/150?img=32' },
    { id: 4, name: 'Marc Lefebvre', title: 'Responsable Achats', email: 'm.lefebvre@innovatech.ca', phone: '+1 (514) 555-0126', photo: 'https://i.pravatar.cc/150?img=68' },
  ];

  const documents = [
    { id: 1, name: 'Contrat_Services_2025.pdf', type: 'Contrat', size: '2.4 MB', date: '2025-01-15' },
    { id: 2, name: 'Proposition_Automatisation_RH.docx', type: 'Proposition', size: '856 KB', date: '2025-10-01' },
    { id: 3, name: 'Presentation_Solution_IA.pptx', type: 'Présentation', size: '5.2 MB', date: '2025-11-10' },
    { id: 4, name: 'Facture_Q4_2025.pdf', type: 'Facture', size: '124 KB', date: '2025-12-20' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'En cours': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'Terminé': return 'bg-green-100 text-green-700 border-green-300';
      case 'Planifié': return 'bg-orange-100 text-orange-700 border-orange-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header Aurora Borealis */}
      <div className="relative bg-nukleo-gradient overflow-hidden">
        {/* Texture grain */}
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
        }} />
        
        <div className="relative max-w-7xl mx-auto px-6 py-8">
          {/* Bouton retour */}
          <Link href="/fr/dashboard/clients-demo">
            <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10 mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux clients
            </Button>
          </Link>

          {/* Profil client */}
          <div className="flex items-start gap-6">
            {/* Logo */}
            <div className="relative">
              <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-white/20 shadow-2xl bg-white">
                <img src={client.logo} alt={client.name} className="w-full h-full object-cover" />
              </div>
            </div>

            {/* Infos */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2 font-nukleo">{client.name}</h1>
                  <p className="text-xl text-white/90 mb-3">{client.type} • {client.industry}</p>
                  <Badge className="bg-white/20 text-white border-white/30 px-3 py-1">
                    {client.status}
                  </Badge>
                </div>
              </div>

              {/* Contact rapide */}
              <div className="flex gap-3">
                <Button size="sm" className="bg-white/10 hover:bg-white/20 text-white border border-white/30">
                  <Phone className="w-4 h-4 mr-2" />
                  Appeler
                </Button>
                <Button size="sm" className="bg-white/10 hover:bg-white/20 text-white border border-white/30">
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Button>
                <Button size="sm" className="bg-white/10 hover:bg-white/20 text-white border border-white/30">
                  <Globe className="w-4 h-4 mr-2" />
                  Site web
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="glass-card hover-nukleo">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
            {[
              { id: 'overview', label: 'Vue d\'ensemble' },
              { id: 'projects', label: 'Projets' },
              { id: 'contacts', label: 'Contacts' },
              { id: 'documents', label: 'Documents' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 font-medium transition-all ${
                  activeTab === tab.id
                    ? 'text-[#523DC9] border-b-2 border-[#523DC9]'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            {activeTab === 'overview' && (
              <>
                {/* Description */}
                <Card className="glass-card">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 font-nukleo">
                      À propos
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 mb-6">{client.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Fondée en</p>
                        <p className="text-gray-900 dark:text-white font-medium">{client.founded}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Employés</p>
                        <p className="text-gray-900 dark:text-white font-medium">{client.employees}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Revenu annuel</p>
                        <p className="text-gray-900 dark:text-white font-medium">{client.revenue.toLocaleString('fr-CA')} $</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Industrie</p>
                        <p className="text-gray-900 dark:text-white font-medium">{client.industry}</p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Coordonnées */}
                <Card className="glass-card">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 font-nukleo">
                      Coordonnées
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-gray-900 dark:text-white">{client.address}</p>
                          <p className="text-gray-600 dark:text-gray-400">{client.city}, {client.province} {client.postalCode}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-gray-400" />
                        <p className="text-gray-900 dark:text-white">{client.phone}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-gray-400" />
                        <p className="text-gray-900 dark:text-white">{client.email}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-gray-400" />
                        <a href={`https://${client.website}`} target="_blank" rel="noopener noreferrer" className="text-[#523DC9] hover:underline">
                          {client.website}
                        </a>
                      </div>
                    </div>
                  </div>
                </Card>
              </>
            )}

            {activeTab === 'projects' && (
              <Card className="glass-card">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 font-nukleo">
                    Projets
                  </h3>
                  <div className="space-y-4">
                    {projects.map((project) => (
                      <div key={project.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-[#523DC9]/40 transition-all">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-medium text-gray-900 dark:text-white">{project.name}</h4>
                          <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                        </div>
                        
                        {/* Progress bar */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-600 dark:text-gray-400">Progression</span>
                            <span className="font-medium text-gray-900 dark:text-white">{project.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-[#523DC9] h-2 rounded-full transition-all"
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600 dark:text-gray-400 mb-1">Budget</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{project.budget.toLocaleString('fr-CA')} $</p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400 mb-1">Dates</p>
                            <p className="font-semibold text-gray-900 dark:text-white text-xs">{project.startDate} → {project.endDate}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'contacts' && (
              <Card className="glass-card">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 font-nukleo">
                    Contacts clés
                  </h3>
                  <div className="space-y-4">
                    {contacts.map((contact) => (
                      <div key={contact.id} className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-[#523DC9]/40 transition-all">
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700 flex-shrink-0">
                          <img src={contact.photo} alt={contact.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 dark:text-white">{contact.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{contact.title}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost">
                            <Phone className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Mail className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'documents' && (
              <Card className="glass-card">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 font-nukleo">
                    Documents
                  </h3>
                  <div className="space-y-3">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-[#523DC9]/40 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{doc.name}</p>
                            <p className="text-sm text-gray-500">{doc.type} • {doc.size} • {doc.date}</p>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost">
                          Télécharger
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Colonne latérale */}
          <div className="space-y-6">
            {/* Informations rapides */}
            <Card className="glass-card">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 font-nukleo">
                  Informations rapides
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Type</p>
                    <p className="text-gray-900 dark:text-white">{client.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Statut</p>
                    <Badge className="bg-green-100 text-green-700 border-green-300">{client.status}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Fondée en</p>
                    <p className="text-gray-900 dark:text-white">{client.founded}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Actions */}
            <Card className="glass-card">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 font-nukleo">
                  Actions
                </h3>
                <div className="space-y-2">
                  <Button fullWidth variant="outline">
                    Modifier le client
                  </Button>
                  <Button fullWidth variant="outline">
                    Créer un projet
                  </Button>
                  <Button fullWidth variant="outline">
                    Ajouter un contact
                  </Button>
                  <Button fullWidth variant="danger">
                    Archiver le client
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
