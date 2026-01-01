'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { 
  UserCircle, 
  Building2, 
  MessageSquare, 
  TrendingUp, 
  Users, 
  ArrowRight
} from 'lucide-react';
import { Badge, Button, Card } from '@/components/ui';
import Link from 'next/link';

export default function ReseauDemoPage() {
  const recentContacts = [
    { id: 1, name: 'Sophie Martin', company: 'TechCorp Inc.', role: 'CTO', added: 'Il y a 2h' },
    { id: 2, name: 'Marc Dubois', company: 'InnoSoft Solutions', role: 'CEO', added: 'Il y a 5h' },
    { id: 3, name: 'Julie Tremblay', company: 'DataFlow Systems', role: 'VP Marketing', added: 'Hier' },
  ];

  const recentCompanies = [
    { id: 1, name: 'CloudNet Technologies', sector: 'Cloud Computing', contacts: 5, added: 'Il y a 1j' },
    { id: 2, name: 'SecureData Corp', sector: 'Cybersécurité', contacts: 3, added: 'Il y a 2j' },
    { id: 3, name: 'AI Innovations', sector: 'Intelligence Artificielle', contacts: 7, added: 'Il y a 3j' },
  ];

  const recentTestimonials = [
    { id: 1, author: 'Jean Lapointe', company: 'TechVision', rating: 5, date: 'Il y a 1 sem' },
    { id: 2, author: 'Marie Côté', company: 'InnoGroup', rating: 5, date: 'Il y a 2 sem' },
  ];

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
          
          <div className="relative">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-5xl font-black text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Dashboard Réseau
                </h1>
                <p className="text-white/80 text-lg">
                  Gérez vos contacts, entreprises et témoignages
                </p>
              </div>
              <div className="flex gap-2">
                <Button className="bg-white text-[#523DC9] hover:bg-white/90">
                  <UserCircle className="w-4 h-4 mr-2" />
                  Nouveau contact
                </Button>
                <Button className="bg-white/10 text-white hover:bg-white/20 border border-white/20">
                  <Building2 className="w-4 h-4 mr-2" />
                  Nouvelle entreprise
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#523DC9]/10 border border-[#523DC9]/30">
                <UserCircle className="w-6 h-6 text-[#523DC9]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              247
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Contacts</div>
            <div className="flex items-center gap-1 mt-2 text-xs text-green-600 dark:text-green-400">
              <TrendingUp className="w-3 h-3" />
              <span>+12 ce mois</span>
            </div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30">
                <Building2 className="w-6 h-6 text-[#10B981]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              89
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Entreprises</div>
            <div className="flex items-center gap-1 mt-2 text-xs text-green-600 dark:text-green-400">
              <TrendingUp className="w-3 h-3" />
              <span>+5 ce mois</span>
            </div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30">
                <MessageSquare className="w-6 h-6 text-[#F59E0B]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              34
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Témoignages</div>
            <div className="flex items-center gap-1 mt-2 text-xs text-green-600 dark:text-green-400">
              <TrendingUp className="w-3 h-3" />
              <span>+3 ce mois</span>
            </div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/30">
                <Users className="w-6 h-6 text-[#3B82F6]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              2.8
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Contacts / Entreprise</div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/dashboard/reseau/contacts">
            <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:border-[#523DC9]/30 transition-all cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-[#523DC9]/10 border border-[#523DC9]/30 group-hover:bg-[#523DC9]/20 transition-colors">
                    <UserCircle className="w-8 h-8 text-[#523DC9]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Contacts</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Gérez vos contacts</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#523DC9] transition-colors" />
              </div>
            </Card>
          </Link>

          <Link href="/dashboard/reseau/entreprises">
            <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:border-[#523DC9]/30 transition-all cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30 group-hover:bg-[#10B981]/20 transition-colors">
                    <Building2 className="w-8 h-8 text-[#10B981]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Entreprises</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Gérez vos entreprises</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#10B981] transition-colors" />
              </div>
            </Card>
          </Link>

          <Link href="/dashboard/reseau/temoignages">
            <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:border-[#523DC9]/30 transition-all cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30 group-hover:bg-[#F59E0B]/20 transition-colors">
                    <MessageSquare className="w-8 h-8 text-[#F59E0B]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Témoignages</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Gérez vos témoignages</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#F59E0B] transition-colors" />
              </div>
            </Card>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Contacts */}
          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Contacts récents</h3>
              <Badge className="bg-[#523DC9]/10 text-[#523DC9]">{recentContacts.length}</Badge>
            </div>
            <div className="space-y-3">
              {recentContacts.map((contact) => (
                <div key={contact.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-[#523DC9]/10 flex items-center justify-center">
                    <UserCircle className="w-5 h-5 text-[#523DC9]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{contact.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{contact.role} · {contact.company}</p>
                  </div>
                  <span className="text-xs text-gray-500">{contact.added}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Companies */}
          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Entreprises récentes</h3>
              <Badge className="bg-[#10B981]/10 text-[#10B981]">{recentCompanies.length}</Badge>
            </div>
            <div className="space-y-3">
              {recentCompanies.map((company) => (
                <div key={company.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-[#10B981]/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-[#10B981]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{company.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{company.sector} · {company.contacts} contacts</p>
                  </div>
                  <span className="text-xs text-gray-500">{company.added}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Testimonials */}
          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Témoignages récents</h3>
              <Badge className="bg-[#F59E0B]/10 text-[#F59E0B]">{recentTestimonials.length}</Badge>
            </div>
            <div className="space-y-3">
              {recentTestimonials.map((testimonial) => (
                <div key={testimonial.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-[#F59E0B]/10 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-[#F59E0B]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{testimonial.author}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{testimonial.company}</p>
                  </div>
                  <span className="text-xs text-gray-500">{testimonial.date}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </MotionDiv>
    </PageContainer>
  );
}
