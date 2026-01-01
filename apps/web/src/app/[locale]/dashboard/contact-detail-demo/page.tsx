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
      {/* Header Aurora Borealis */}
      <div className="relative bg-nukleo-gradient overflow-hidden">
        {/* Texture grain */}
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
        }} />
        
        <div className="relative max-w-7xl mx-auto px-6 py-8">
          {/* Bouton retour */}
          <Link href="/fr/dashboard/reseau/contacts">
            <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10 mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux contacts
            </Button>
          </Link>

          {/* Profil contact */}
          <div className="flex items-start gap-6">
            {/* Photo */}
            <div className="relative">
              <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-white/20 shadow-2xl">
                <img src={contact.photo} alt={contact.name} className="w-full h-full object-cover" />
              </div>
            </div>

            {/* Infos */}
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-white mb-2 font-nukleo">{contact.name}</h1>
              <p className="text-xl text-white/90 mb-3">{contact.title}</p>
              <div className="flex items-center gap-2 text-white/80 mb-4">
                <Building2 className="w-5 h-5" />
                <span className="text-lg">{contact.company}</span>
              </div>
              
              {/* Tags */}
              <div className="flex gap-2 mb-6">
                {contact.tags.map((tag) => (
                  <Badge key={tag} className="bg-white/20 text-white border-white/30 px-3 py-1">
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Actions rapides */}
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
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
                <Button size="sm" className="bg-white/10 hover:bg-white/20 text-white border border-white/30">
                  <Linkedin className="w-4 h-4 mr-2" />
                  LinkedIn
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
              { id: 'activities', label: 'Activités' },
              { id: 'opportunities', label: 'Opportunités' },
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
                {/* Informations générales */}
                <Card className="glass-card">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 font-nukleo">
                      Informations de contact
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Email</p>
                        <p className="text-gray-900 dark:text-white">{contact.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Téléphone</p>
                        <p className="text-gray-900 dark:text-white">{contact.phone}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Mobile</p>
                        <p className="text-gray-900 dark:text-white">{contact.mobile}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Ville</p>
                        <p className="text-gray-900 dark:text-white">{contact.city}, {contact.province}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Adresse</p>
                      <p className="text-gray-900 dark:text-white">{contact.address}</p>
                    </div>
                  </div>
                </Card>

                {/* Notes */}
                <Card className="glass-card">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 font-nukleo">
                      Notes
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300">{contact.notes}</p>
                  </div>
                </Card>
              </>
            )}

            {activeTab === 'activities' && (
              <Card className="glass-card">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 font-nukleo">
                    Timeline des activités
                  </h3>
                  <div className="space-y-6">
                    {activities.map((activity) => {
                      const Icon = getActivityIcon(activity.type);
                      return (
                        <div key={activity.id} className="flex gap-4">
                          <div className={`p-2 rounded-lg ${getActivityColor(activity.type)} flex-shrink-0`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-1">
                              <h4 className="font-medium text-gray-900 dark:text-white">{activity.title}</h4>
                              <span className="text-sm text-gray-500">{activity.time}</span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{activity.description}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">{activity.date}</span>
                              {activity.status === 'completed' ? (
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-orange-600" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'opportunities' && (
              <Card className="glass-card">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 font-nukleo">
                    Opportunités en cours
                  </h3>
                  <div className="space-y-4">
                    {opportunities.map((opp) => (
                      <div key={opp.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-[#523DC9]/40 transition-all">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-medium text-gray-900 dark:text-white">{opp.title}</h4>
                          <Badge className={getStageColor(opp.stage)}>{opp.stage}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600 dark:text-gray-400 mb-1">Valeur</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{opp.value.toLocaleString('fr-CA')} $</p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400 mb-1">Date de clôture</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{opp.closeDate}</p>
                          </div>
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
                    Documents partagés
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
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Créé le</p>
                    <p className="text-gray-900 dark:text-white">{contact.createdAt}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Dernier contact</p>
                    <p className="text-gray-900 dark:text-white">{contact.lastContact}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Code postal</p>
                    <p className="text-gray-900 dark:text-white">{contact.postalCode}</p>
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
                    Modifier le contact
                  </Button>
                  <Button fullWidth variant="outline">
                    Créer une opportunité
                  </Button>
                  <Button fullWidth variant="outline">
                    Planifier une activité
                  </Button>
                  <Button fullWidth variant="danger">
                    Supprimer le contact
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
