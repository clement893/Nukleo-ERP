'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useMemo } from 'react';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { 
  Users, 
  Building2, 
  MessageSquare, 
  TrendingUp,
  UserPlus,
  Plus,
  Eye
} from 'lucide-react';
import { Badge, Button, Card, Loading } from '@/components/ui';
import Link from 'next/link';
import { useInfiniteReseauContacts } from '@/lib/query/reseau-contacts';
import { useInfiniteCompanies } from '@/lib/query/companies';
import { useInfiniteTestimonials } from '@/lib/query/reseau-testimonials';

export default function ReseauPage() {
  // Fetch data
  const { data: contactsData, isLoading: loadingContacts } = useInfiniteReseauContacts(100);
  const { data: companiesData, isLoading: loadingCompanies } = useInfiniteCompanies(100);
  const { data: testimonialsData, isLoading: loadingTestimonials } = useInfiniteTestimonials(100);

  // Flatten data
  const contacts = useMemo(() => contactsData?.pages.flat() || [], [contactsData]);
  const companies = useMemo(() => companiesData?.pages.flat() || [], [companiesData]);
  const testimonials = useMemo(() => testimonialsData?.pages.flat() || [], [testimonialsData]);

  const loading = loadingContacts || loadingCompanies || loadingTestimonials;

  // Calculate stats
  const stats = useMemo(() => {
    const totalContacts = contacts.length;
    const totalCompanies = companies.length;
    const totalTestimonials = testimonials.length;
    const avgContactsPerCompany = totalCompanies > 0 ? (totalContacts / totalCompanies).toFixed(1) : '0';
    
    return { totalContacts, totalCompanies, totalTestimonials, avgContactsPerCompany };
  }, [contacts, companies, testimonials]);

  // Recent contacts (last 3)
  const recentContacts = useMemo(() => {
    return [...contacts]
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 3);
  }, [contacts]);

  // Recent companies (last 3)
  const recentCompanies = useMemo(() => {
    return [...companies]
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 3);
  }, [companies]);

  // Recent testimonials (last 3)
  const recentTestimonials = useMemo(() => {
    return [...testimonials]
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 3);
  }, [testimonials]);

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-96">
          <Loading />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="flex flex-col h-full">
      <MotionDiv variant="slideUp" duration="normal" className="flex flex-col flex-1 space-y-6">
        {/* Hero Header */}
        <div className="relative rounded-2xl overflow-hidden -mt-4 -mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-10 2xl:-mx-12 3xl:-mx-16 4xl:-mx-20 px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 3xl:px-16 4xl:px-20 pt-6 pb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] opacity-90" />
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
            backgroundSize: '200px 200px'
          }} />
          
          <div className="relative">
            <h1 className="text-5xl font-black text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Dashboard Réseau
            </h1>
            <p className="text-white/80 text-lg">
              Vue d'ensemble de votre réseau professionnel
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#523DC9]/10 border border-[#523DC9]/30">
                <Users className="w-6 h-6 text-[#523DC9]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.totalContacts}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Contacts</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30">
                <Building2 className="w-6 h-6 text-[#10B981]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.totalCompanies}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Entreprises</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30">
                <MessageSquare className="w-6 h-6 text-[#F59E0B]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.totalTestimonials}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Témoignages</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/30">
                <TrendingUp className="w-6 h-6 text-[#3B82F6]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.avgContactsPerCompany}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Contacts/Entreprise</div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/dashboard/reseau/contacts">
            <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:scale-105 hover:border-[#523DC9]/40 transition-all duration-200 cursor-pointer group">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-4 rounded-xl bg-[#523DC9]/10 border border-[#523DC9]/30 group-hover:bg-[#523DC9]/20 transition-colors">
                  <Users className="w-8 h-8 text-[#523DC9]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Contacts</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Gérez vos contacts</p>
                </div>
              </div>
              <Button className="w-full hover-nukleo" variant="outline">
                <UserPlus className="w-4 h-4 mr-2" />
                Nouveau contact
              </Button>
            </Card>
          </Link>

          <Link href="/dashboard/reseau/entreprises">
            <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:scale-105 hover:border-[#10B981]/40 transition-all duration-200 cursor-pointer group">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-4 rounded-xl bg-[#10B981]/10 border border-[#10B981]/30 group-hover:bg-[#10B981]/20 transition-colors">
                  <Building2 className="w-8 h-8 text-[#10B981]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Entreprises</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Gérez vos entreprises</p>
                </div>
              </div>
              <Button className="w-full hover-nukleo" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle entreprise
              </Button>
            </Card>
          </Link>

          <Link href="/dashboard/reseau/temoignages">
            <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:scale-105 hover:border-[#F59E0B]/40 transition-all duration-200 cursor-pointer group">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-4 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 group-hover:bg-[#F59E0B]/20 transition-colors">
                  <MessageSquare className="w-8 h-8 text-[#F59E0B]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Témoignages</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Gérez vos témoignages</p>
                </div>
              </div>
              <Button className="w-full hover-nukleo" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Nouveau témoignage
              </Button>
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
              {recentContacts.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Aucun contact récent</p>
              ) : (
                recentContacts.map((contact) => (
                  <Link key={contact.id} href={`/dashboard/reseau/contacts/${contact.id}`}>
                    <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-[#523DC9]/30 transition-all cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                            {contact.first_name} {contact.last_name}
                          </h4>
                          {contact.position && (
                            <p className="text-xs text-gray-600 dark:text-gray-400">{contact.position}</p>
                          )}
                        </div>
                        <Eye className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </Card>

          {/* Recent Companies */}
          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Entreprises récentes</h3>
              <Badge className="bg-[#10B981]/10 text-[#10B981]">{recentCompanies.length}</Badge>
            </div>
            <div className="space-y-3">
              {recentCompanies.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Aucune entreprise récente</p>
              ) : (
                recentCompanies.map((company) => (
                  <Link key={company.id} href={`/dashboard/reseau/entreprises/${company.id}`}>
                    <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-[#10B981]/30 transition-all cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm">{company.name}</h4>
                          {company.description && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">{company.description}</p>
                          )}
                        </div>
                        <Eye className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </Card>

          {/* Recent Testimonials */}
          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Témoignages récents</h3>
              <Badge className="bg-[#F59E0B]/10 text-[#F59E0B]">{recentTestimonials.length}</Badge>
            </div>
            <div className="space-y-3">
              {recentTestimonials.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Aucun témoignage récent</p>
              ) : (
                recentTestimonials.map((testimonial) => (
                  <div key={testimonial.id} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                      {testimonial.title || 'Sans titre'}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                      {testimonial.content_fr || testimonial.content_en || 'Pas de contenu'}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </MotionDiv>
    </PageContainer>
  );
}
