'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { Calendar, CalendarDays, Plus, Search, Users, MapPin, Clock, ExternalLink, Globe, Lock } from 'lucide-react';
import { Badge, Button, Card, Input } from '@/components/ui';

type EventType = 'five_to_seven' | 'team_event' | 'corporate' | 'training' | 'other';
type Visibility = 'public' | 'employees_only';

interface Event {
  id: number;
  title: string;
  type: EventType;
  date: string;
  time: string;
  duration: string;
  location: string;
  attendees: string[];
  visibility: Visibility;
  externalLink?: string;
  description: string;
}

const mockEvents: Event[] = [
  {
    id: 1,
    title: '5 à 7 Networking - Lancement Produit',
    type: 'five_to_seven',
    date: '2026-01-24',
    time: '17:00',
    duration: '2h',
    location: 'Bar Le Lounge, Centre-ville',
    attendees: ['Ouvert à tous'],
    visibility: 'public',
    externalLink: 'https://eventbrite.com/event-123',
    description: 'Soirée de lancement de notre nouveau produit avec cocktails et démonstrations'
  },
  {
    id: 2,
    title: 'Soirée d\'Équipe Dev - Karaoké',
    type: 'team_event',
    date: '2026-01-26',
    time: '18:30',
    duration: '3h',
    location: 'Karaoké Box Downtown',
    attendees: ['Équipe Développement'],
    visibility: 'employees_only',
    description: 'Team building informel avec l\'équipe de développement'
  },
  {
    id: 3,
    title: 'Gala Corporatif Annuel',
    type: 'corporate',
    date: '2026-02-14',
    time: '19:00',
    duration: '4h',
    location: 'Hôtel Ritz-Carlton',
    attendees: ['Tous les employés', 'Partenaires', 'Clients VIP'],
    visibility: 'public',
    externalLink: 'https://nukleo.com/gala-2026',
    description: 'Soirée de gala annuelle avec remise de prix et dîner gastronomique'
  },
  {
    id: 4,
    title: '5 à 7 Équipe Marketing',
    type: 'five_to_seven',
    date: '2026-01-30',
    time: '17:00',
    duration: '2h',
    location: 'Terrasse du Bureau',
    attendees: ['Équipe Marketing'],
    visibility: 'employees_only',
    description: 'Célébration de la fin du mois avec l\'équipe marketing'
  },
  {
    id: 5,
    title: 'Formation Leadership - Atelier',
    type: 'training',
    date: '2026-02-05',
    time: '09:00',
    duration: '6h',
    location: 'Centre de Formation Nukleo',
    attendees: ['Managers', 'Team Leads'],
    visibility: 'employees_only',
    description: 'Atelier intensif sur les compétences en leadership et gestion d\'équipe'
  },
  {
    id: 6,
    title: 'Soirée Corporative - Tournoi de Golf',
    type: 'corporate',
    date: '2026-02-20',
    time: '13:00',
    duration: '5h',
    location: 'Club de Golf Royal',
    attendees: ['Clients', 'Partenaires', 'Direction'],
    visibility: 'public',
    externalLink: 'https://nukleo.com/golf-tournament',
    description: 'Tournoi de golf annuel avec nos clients et partenaires stratégiques'
  },
  {
    id: 7,
    title: 'Happy Hour Vendredi - Toute l\'Entreprise',
    type: 'five_to_seven',
    date: '2026-01-31',
    time: '16:00',
    duration: '3h',
    location: 'Bureau Nukleo - Espace Lounge',
    attendees: ['Tous les employés'],
    visibility: 'employees_only',
    description: 'Happy hour mensuel pour célébrer les succès de janvier'
  },
  {
    id: 8,
    title: 'Soirée d\'Équipe Design - Escape Game',
    type: 'team_event',
    date: '2026-02-08',
    time: '18:00',
    duration: '2h30',
    location: 'Escape Room Downtown',
    attendees: ['Équipe Design'],
    visibility: 'employees_only',
    description: 'Activité team building avec l\'équipe design'
  },
  {
    id: 9,
    title: 'Conférence Tech - Sponsoring Nukleo',
    type: 'corporate',
    date: '2026-03-15',
    time: '09:00',
    duration: '8h',
    location: 'Palais des Congrès',
    attendees: ['Ouvert au public'],
    visibility: 'public',
    externalLink: 'https://techconf2026.com',
    description: 'Grande conférence technologique sponsorisée par Nukleo'
  }
];

const typeConfig = {
  five_to_seven: { label: '5 à 7', color: 'bg-purple-500/10 text-purple-600 border-purple-500/30' },
  team_event: { label: 'Événement d\'équipe', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  corporate: { label: 'Corporatif', color: 'bg-orange-500/10 text-orange-600 border-orange-500/30' },
  training: { label: 'Formation', color: 'bg-green-500/10 text-green-600 border-green-500/30' },
  other: { label: 'Autre', color: 'bg-gray-500/10 text-gray-600 border-gray-500/30' }
};

export default function EvenementsDemo() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<EventType | 'all'>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<Visibility | 'all'>('all');

  const filteredEvents = mockEvents.filter(event => {
    const matchesSearch = !searchQuery || 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || event.type === typeFilter;
    const matchesVisibility = visibilityFilter === 'all' || event.visibility === visibilityFilter;
    return matchesSearch && matchesType && matchesVisibility;
  });

  const stats = {
    total: mockEvents.length,
    fiveToSeven: mockEvents.filter(e => e.type === 'five_to_seven').length,
    thisMonth: mockEvents.filter(e => new Date(e.date).getMonth() === 0).length,
    publicEvents: mockEvents.filter(e => e.visibility === 'public').length
  };

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
                  <CalendarDays className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    Événements Corporatifs
                  </h1>
                  <p className="text-white/80 text-sm">5 à 7, soirées d'équipe et événements d'entreprise</p>
                </div>
              </div>
              <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm">
                <Plus className="w-4 h-4 mr-2" />
                Nouvel événement
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {stats.total}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Total</div>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {stats.fiveToSeven}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">5 à 7</div>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/30">
                <CalendarDays className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {stats.thisMonth}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Ce mois-ci</div>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/30">
                <Globe className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {stats.publicEvents}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Publics</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20 mb-6">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher un événement..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="flex gap-2">
                <Button size="sm" variant={typeFilter === 'all' ? 'primary' : 'outline'} onClick={() => setTypeFilter('all')}>
                  Tous
                </Button>
                <Button size="sm" variant={typeFilter === 'five_to_seven' ? 'primary' : 'outline'} onClick={() => setTypeFilter('five_to_seven')}>
                  5 à 7
                </Button>
                <Button size="sm" variant={typeFilter === 'team_event' ? 'primary' : 'outline'} onClick={() => setTypeFilter('team_event')}>
                  Équipe
                </Button>
                <Button size="sm" variant={typeFilter === 'corporate' ? 'primary' : 'outline'} onClick={() => setTypeFilter('corporate')}>
                  Corporatif
                </Button>
                <Button size="sm" variant={typeFilter === 'training' ? 'primary' : 'outline'} onClick={() => setTypeFilter('training')}>
                  Formation
                </Button>
              </div>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-700" />
              <div className="flex gap-2">
                <Button size="sm" variant={visibilityFilter === 'all' ? 'primary' : 'outline'} onClick={() => setVisibilityFilter('all')}>
                  Tous
                </Button>
                <Button size="sm" variant={visibilityFilter === 'public' ? 'primary' : 'outline'} onClick={() => setVisibilityFilter('public')}>
                  <Globe className="w-3 h-3 mr-1" />
                  Public
                </Button>
                <Button size="sm" variant={visibilityFilter === 'employees_only' ? 'primary' : 'outline'} onClick={() => setVisibilityFilter('employees_only')}>
                  <Lock className="w-3 h-3 mr-1" />
                  Employés
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Events List */}
        <div className="space-y-3">
          {filteredEvents.map((event) => (
            <Card key={event.id} className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20 hover:border-[#523DC9]/30 transition-all">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] flex flex-col items-center justify-center text-white">
                    <div className="text-xs font-medium">{new Date(event.date).toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase()}</div>
                    <div className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {new Date(event.date).getDate()}
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{event.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{event.description}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Badge className={`${typeConfig[event.type].color} border`}>
                        {typeConfig[event.type].label}
                      </Badge>
                      {event.visibility === 'public' ? (
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/30 border">
                          <Globe className="w-3 h-3 mr-1" />
                          Public
                        </Badge>
                      ) : (
                        <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30 border">
                          <Lock className="w-3 h-3 mr-1" />
                          Employés
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      <span>{event.time} • {event.duration}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      <span>{event.attendees.join(', ')}</span>
                    </div>
                    {event.externalLink && (
                      <a 
                        href={event.externalLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-[#523DC9] hover:text-[#6B1817] transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Lien externe</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </MotionDiv>
    </PageContainer>
  );
}
