'use client';

import { useState } from 'react';
import { ArrowLeft, Phone, Mail, MessageCircle, Linkedin, Building2, Calendar, FileText, TrendingUp, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui';
import Link from 'next/link';

export default function ContactDetailDemoPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'activities' | 'opportunities' | 'documents'>('overview');

  // Mock data
  const contact = {
    id: 6227,
    name: 'Marie-Claude Tremblay',
    title: 'Directrice des Opérations',
    company: 'Innovatech Solutions Inc.',
    email: 'mc.tremblay@innovatech.ca',
    phone: '+1 (514) 555-0123',
    mobile: '+1 (514) 555-0124',
    linkedin: 'https://linkedin.com/in/mctremblay',
    address: '1250 Boulevard René-Lévesque O, Montréal, QC H3B 4W8',
    city: 'Montréal',
    province: 'Québec',
    postalCode: 'H3B 4W8',
    tags: ['VIP', 'Client', 'Partenaire'],
    notes: 'Contact clé pour les projets d\'innovation. Très intéressée par l\'IA et l\'automatisation.',
    createdAt: '2024-01-15',
    lastContact: '2025-12-28',
    photo: 'https://i.pravatar.cc/300?img=47',
  };

  const stats = [
    { icon: TrendingUp, label: 'Opportunités', value: '3', color: 'text-green-600', bgColor: 'bg-green-100' },
    { icon: FileText, label: 'Documents', value: '12', color: 'text-blue-600', bgColor: 'bg-blue-100' },
    { icon: Clock, label: 'Activités', value: '24', color: 'text-purple-600', bgColor: 'bg-purple-100' },
    { icon: Calendar, label: 'Dernier contact', value: '3 jours', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  ];

  const activities = [
    { id: 1, type: 'call', title: 'Appel téléphonique', description: 'Discussion sur le projet Q1 2025', date: '2025-12-28', time: '14:30', status: 'completed' },
    { id: 2, type: 'email', title: 'Email envoyé', description: 'Proposition commerciale pour automatisation RH', date: '2025-12-25', time: '10:15', status: 'completed' },
    { id: 3, type: 'meeting', title: 'Réunion planifiée', description: 'Présentation solution IA', date: '2026-01-05', time: '15:00', status: 'scheduled' },
    { id: 4, type: 'note', title: 'Note ajoutée', description: 'Intéressée par module de reporting avancé', date: '2025-12-20', time: '16:45', status: 'completed' },
  ];

  const opportunities = [
    { id: 1, title: 'Automatisation RH', value: 85000, stage: 'Négociation', probability: 75, closeDate: '2026-02-15' },
    { id: 2, title: 'Module IA Prédictive', value: 120000, stage: 'Proposition', probability: 60, closeDate: '2026-03-30' },
    { id: 3, title: 'Formation Équipe', value: 15000, stage: 'Qualifié', probability: 80, closeDate: '2026-01-20' },
  ];

  const documents = [
    { id: 1, name: 'Proposition_Automatisation_RH.pdf', type: 'PDF', size: '2.4 MB', date: '2025-12-25' },
    { id: 2, name: 'Contrat_Services_2025.docx', type: 'Word', size: '856 KB', date: '2025-11-10' },
    { id: 3, name: 'Presentation_Solution_IA.pptx', type: 'PowerPoint', size: '5.2 MB', date: '2025-12-15' },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call': return Phone;
      case 'email': return Mail;
      case 'meeting': return Calendar;
      case 'note': return FileText;
      default: return Clock;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'call': return 'text-blue-600 bg-blue-100';
      case 'email': return 'text-green-600 bg-green-100';
      case 'meeting': return 'text-purple-600 bg-purple-100';
      case 'note': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Négociation': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'Proposition': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'Qualifié': return 'bg-green-100 text-green-700 border-green-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Bouton retour */}
        <Link href="/fr/dashboard/reseau/contacts" className="inline-block mb-6">
          <Button variant="ghost" size="sm" className="hover:glass-card">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux contacts
          </Button>
        </Link>
        
        {/* Header Card avec photo plus grande */}
        <Card className="glass-card p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
            {/* Photo plus grande */}
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-nukleo-gradient rounded-2xl opacity-20 blur-lg" />
              <div className="relative w-48 h-48 md:w-56 md:h-56 rounded-2xl overflow-hidden border-2 border-[#A7A2CF]/30 shadow-xl">
                <img 
                  src={contact.photo} 
                  alt={contact.name} 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
            {/* Infos */}
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-nukleo font-bold text-[#523DC9] mb-3">
                {contact.name}
              </h1>
              <p className="text-xl text-foreground/80 mb-2">{contact.title}</p>
              <div className="flex items-center gap-2 text-foreground/70 mb-4">
                <Building2 className="w-5 h-5" />
                <span className="text-lg">{contact.company}</span>
              </div>
              
              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {contact.tags.map((tag) => (
                  <Badge key={tag} className="badge-nukleo px-4 py-1.5 text-sm">
                    {tag}
                  </Badge>
                ))}
              </div>
              
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
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
                <Button size="sm" variant="outline" className="hover-nukleo">
                  <Linkedin className="w-4 h-4 mr-2" />
                  LinkedIn
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
              { key: 'activities', label: 'Activités' },
              { key: 'opportunities', label: 'Opportunités' },
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
              {/* Informations de contact */}
              <Card className="glass-card p-6">
                <h3 className="text-lg font-semibold mb-4 font-nukleo text-[#523DC9]">Informations de contact</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="text-foreground">{contact.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Téléphone</p>
                      <p className="text-foreground">{contact.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Mobile</p>
                      <p className="text-foreground">{contact.mobile}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Adresse</p>
                      <p className="text-foreground">{contact.address}</p>
                      <p className="text-foreground">{contact.city}, {contact.province} {contact.postalCode}</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Notes */}
              <Card className="glass-card p-6">
                <h3 className="text-lg font-semibold mb-4 font-nukleo text-[#523DC9]">Notes</h3>
                <p className="text-foreground/80 leading-relaxed">{contact.notes}</p>
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Créé le: {new Date(contact.createdAt).toLocaleDateString('fr-FR')}</span>
                    <span>Dernier contact: {new Date(contact.lastContact).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'activities' && (
            <Card className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4 font-nukleo text-[#523DC9]">Activités récentes</h3>
              <div className="space-y-4">
                {activities.map((activity) => {
                  const Icon = getActivityIcon(activity.type);
                  return (
                    <div key={activity.id} className="flex items-start gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-foreground">{activity.title}</h4>
                            <p className="text-sm text-muted-foreground">{activity.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {activity.status === 'completed' ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-orange-600" />
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(activity.date).toLocaleDateString('fr-FR')} à {activity.time}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {activeTab === 'opportunities' && (
            <Card className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4 font-nukleo text-[#523DC9]">Opportunités en cours</h3>
              <div className="space-y-4">
                {opportunities.map((opp) => (
                  <div key={opp.id} className="p-4 rounded-lg border border-border hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-foreground text-lg">{opp.title}</h4>
                        <p className="text-2xl font-bold text-[#523DC9] mt-1">
                          {opp.value.toLocaleString('fr-FR')} $
                        </p>
                      </div>
                      <Badge className={`${getStageColor(opp.stage)} border`}>
                        {opp.stage}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Probabilité: {opp.probability}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Clôture: {new Date(opp.closeDate).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-nukleo-gradient h-2 rounded-full transition-all"
                          style={{ width: `${opp.probability}%` }}
                        />
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
