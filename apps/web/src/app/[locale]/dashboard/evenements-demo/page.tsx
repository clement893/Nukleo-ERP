'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { Calendar, CalendarDays, Plus, Search, Users, MapPin, Clock, Video, User } from 'lucide-react';
import { Badge, Button, Card, Input } from '@/components/ui';

type EventType = 'meeting' | 'deadline' | 'reminder' | 'other';

const mockEvents = [
  {
    id: 1,
    title: 'Réunion client - Présentation Q1',
    type: 'meeting' as EventType,
    date: '2026-01-15',
    time: '14:00',
    duration: '1h30',
    location: 'Salle de conférence A',
    attendees: ['Marie Dubois', 'Jean Martin', 'Client ABC'],
    isVirtual: false,
    description: 'Présentation des résultats du premier trimestre'
  },
  {
    id: 2,
    title: 'Appel Zoom - Équipe Dev',
    type: 'meeting' as EventType,
    date: '2026-01-16',
    time: '10:00',
    duration: '45min',
    location: 'En ligne',
    attendees: ['Sophie Laurent', 'Pierre Durand', 'Luc Bernard'],
    isVirtual: true,
    description: 'Point hebdomadaire sur l\'avancement des sprints'
  },
  {
    id: 3,
    title: 'Formation Sécurité',
    type: 'other' as EventType,
    date: '2026-01-18',
    time: '09:00',
    duration: '3h',
    location: 'Auditorium',
    attendees: ['Tous les employés'],
    isVirtual: false,
    description: 'Formation obligatoire sur les protocoles de sécurité'
  },
  {
    id: 4,
    title: 'Revue de code - Module Auth',
    type: 'meeting' as EventType,
    date: '2026-01-19',
    time: '15:30',
    duration: '1h',
    location: 'Bureau Dev',
    attendees: ['Claire Petit', 'Pierre Durand'],
    isVirtual: false,
    description: 'Revue du nouveau module d\'authentification'
  },
  {
    id: 5,
    title: 'Déjeuner d\'équipe',
    type: 'other' as EventType,
    date: '2026-01-20',
    time: '12:00',
    duration: '1h30',
    location: 'Restaurant Le Gourmet',
    attendees: ['Toute l\'équipe'],
    isVirtual: false,
    description: 'Team building mensuel'
  },
  {
    id: 6,
    title: 'Webinaire Marketing Digital',
    type: 'other' as EventType,
    date: '2026-01-22',
    time: '14:00',
    duration: '2h',
    location: 'En ligne',
    attendees: ['Marie Dubois', 'Jean Martin'],
    isVirtual: true,
    description: 'Nouvelles stratégies de marketing digital 2026'
  }
];

const typeConfig = {
  meeting: { label: 'Réunion', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  deadline: { label: 'Échéance', color: 'bg-red-500/10 text-red-600 border-red-500/30' },
  reminder: { label: 'Rappel', color: 'bg-orange-500/10 text-orange-600 border-orange-500/30' },
  other: { label: 'Autre', color: 'bg-gray-500/10 text-gray-600 border-gray-500/30' }
};

export default function EvenementsDemo() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<EventType | 'all'>('all');

  const filteredEvents = mockEvents.filter(event => {
    const matchesSearch = !searchQuery || 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || event.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const stats = {
    total: mockEvents.length,
    meetings: mockEvents.filter(e => e.type === 'meeting').length,
    thisWeek: mockEvents.filter(e => new Date(e.date) <= new Date('2026-01-20')).length,
    virtual: mockEvents.filter(e => e.isVirtual).length
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
                    Événements
                  </h1>
                  <p className="text-white/80 text-sm">Gérez vos événements et réunions</p>
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
                  {stats.meetings}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Réunions</div>
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
                  {stats.thisWeek}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Cette semaine</div>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/30">
                <Video className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {stats.virtual}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">En ligne</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher un événement..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant={typeFilter === 'all' ? 'primary' : 'outline'} onClick={() => setTypeFilter('all')}>
                Tous
              </Button>
              <Button size="sm" variant={typeFilter === 'meeting' ? 'primary' : 'outline'} onClick={() => setTypeFilter('meeting')}>
                Réunions
              </Button>
              <Button size="sm" variant={typeFilter === 'other' ? 'primary' : 'outline'} onClick={() => setTypeFilter('other')}>
                Autres
              </Button>
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
                    <Badge className={`${typeConfig[event.type].color} border flex-shrink-0`}>
                      {typeConfig[event.type].label}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      <span>{event.time} • {event.duration}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {event.isVirtual ? <Video className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <User className="w-4 h-4" />
                      <span>{event.attendees.length} participant{event.attendees.length > 1 ? 's' : ''}</span>
                    </div>
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
