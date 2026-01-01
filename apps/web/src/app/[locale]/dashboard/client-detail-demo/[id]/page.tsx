'use client';

import { useState } from 'react';
import { ArrowLeft, Users, DollarSign, TrendingUp, Phone, Mail, Globe, MapPin, FileText, Briefcase } from 'lucide-react';
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
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Bouton retour */}
        <Link href="/fr/dashboard/clients-demo" className="inline-block mb-6">
          <Button variant="ghost" size="sm" className="hover:glass-card">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux clients
          </Button>
        </Link>

        {/* Header Card avec logo plus grand */}
        <Card className="glass-card p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
            {/* Logo plus grand */}
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-nukleo-gradient rounded-2xl opacity-20 blur-lg" />
              <div className="relative w-48 h-48 md:w-56 md:h-56 rounded-2xl overflow-hidden border-2 border-[#A7A2CF]/30 shadow-xl bg-white">
                <img 
                  src={client.logo} 
                  alt={client.name} 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
            {/* Infos */}
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-nukleo font-bold text-[#523DC9] mb-3">
                {client.name}
              </h1>
              <p className="text-xl text-foreground/80 mb-4">{client.type} • {client.industry}</p>
              <Badge className="badge-nukleo px-4 py-1.5 text-sm mb-6">
                {client.status}
              </Badge>
              
              {/* Actions rapides */}
              <div className="flex flex-wrap gap-3">
                <Button size="sm" variant="outline" className="hover-nukleo">
                  <Phone className="w-4 h-4 mr-2" />
                  Appeler
                </Button>
                <Button size="sm" variant="outline" className="hover-nukleo">
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Button>
                <Button size="sm" variant="outline" className="hover-nukleo">
                  <Globe className="w-4 h-4 mr-2" />
                  Site web
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="glass-card p-6 hover:shadow-lg transition-all">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex gap-2 border-b border-border">
            {[
              { key: 'overview', label: 'Vue d\'ensemble' },
              { key: 'projects', label: 'Projets' },
              { key: 'contacts', label: 'Contacts' },
              { key: 'documents', label: 'Documents' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-6 py-3 font-medium transition-all relative ${
                  activeTab === tab.key
                    ? 'text-[#523DC9]'
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Informations générales */}
              <Card className="glass-card p-6">
                <h3 className="text-lg font-semibold mb-4 font-nukleo text-[#523DC9]">Informations générales</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Téléphone</p>
                      <p className="text-foreground">{client.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="text-foreground">{client.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Site web</p>
                      <p className="text-foreground">{client.website}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Adresse</p>
                      <p className="text-foreground">{client.address}</p>
                      <p className="text-foreground">{client.city}, {client.province} {client.postalCode}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Employés</p>
                      <p className="text-foreground">{client.employees} personnes</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Briefcase className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Fondée en</p>
                      <p className="text-foreground">{client.founded}</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Description */}
              <Card className="glass-card p-6">
                <h3 className="text-lg font-semibold mb-4 font-nukleo text-[#523DC9]">À propos</h3>
                <p className="text-foreground/80 leading-relaxed">{client.description}</p>
              </Card>
            </div>
          )}

          {activeTab === 'projects' && (
            <Card className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4 font-nukleo text-[#523DC9]">Projets</h3>
              <div className="space-y-4">
                {projects.map((project) => (
                  <div key={project.id} className="p-4 rounded-lg border border-border hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-foreground text-lg">{project.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(project.startDate).toLocaleDateString('fr-FR')} - {new Date(project.endDate).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <Badge className={`${getStatusColor(project.status)} border`}>
                        {project.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm mb-3">
                      <span className="text-muted-foreground">Budget: {project.budget.toLocaleString('fr-FR')} $</span>
                      <span className="text-[#523DC9] font-semibold">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-nukleo-gradient h-2 rounded-full transition-all"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeTab === 'contacts' && (
            <Card className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4 font-nukleo text-[#523DC9]">Contacts</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {contacts.map((contact) => (
                  <div key={contact.id} className="p-4 rounded-lg border border-border hover:shadow-md transition-all">
                    <div className="flex items-start gap-3">
                      <img
                        src={contact.photo}
                        alt={contact.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground">{contact.name}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{contact.title}</p>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            <span>{contact.email}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            <span>{contact.phone}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeTab === 'documents' && (
            <Card className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4 font-nukleo text-[#523DC9]">Documents</h3>
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 rounded-lg border border-border hover:shadow-md transition-all">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-[#523DC9]" />
                      <div>
                        <p className="font-medium text-foreground">{doc.name}</p>
                        <p className="text-sm text-muted-foreground">{doc.type} • {doc.size}</p>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(doc.date).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
