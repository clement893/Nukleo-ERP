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
  Eye,
  Calendar,
  ArrowUpRight
} from 'lucide-react';
import { Badge, Button, Card, Loading, Chart } from '@/components/ui';
import type { ChartDataPoint } from '@/components/ui';
import Link from 'next/link';
import { useInfiniteReseauContacts } from '@/lib/query/reseau-contacts';
import { useInfiniteCompanies } from '@/lib/query/companies';
import { useInfiniteReseauTestimonials } from '@/lib/query/reseau-testimonials';

export default function ReseauPage() {
  // Fetch data - using high limit to load all items
  const { data: contactsData, isLoading: loadingContacts } = useInfiniteReseauContacts(10000);
  const { data: companiesData, isLoading: loadingCompanies } = useInfiniteCompanies(10000);
  const { data: testimonialsData, isLoading: loadingTestimonials } = useInfiniteReseauTestimonials(10000);

  // Flatten data
  const contacts = useMemo(() => contactsData?.pages.flat() || [], [contactsData]);
  const companies = useMemo(() => companiesData?.pages.flat() || [], [companiesData]);
  const testimonials = useMemo(() => testimonialsData?.pages.flat() || [], [testimonialsData]);

  const loading = loadingContacts || loadingCompanies || loadingTestimonials;

  // Calculate growth statistics (30 days)
  const stats = useMemo(() => {
    const totalContacts = contacts.length;
    const totalCompanies = companies.length;
    const totalTestimonials = testimonials.length;
    const avgContactsPerCompany = totalCompanies > 0 ? (totalContacts / totalCompanies).toFixed(1) : '0';
    
    // Calculate growth over last 30 days
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const newContactsLast30Days = contacts.filter(c => {
      const createdAt = c.created_at ? new Date(c.created_at) : null;
      return createdAt && createdAt >= thirtyDaysAgo;
    }).length;
    
    const newCompaniesLast30Days = companies.filter(c => {
      const createdAt = c.created_at ? new Date(c.created_at) : null;
      return createdAt && createdAt >= thirtyDaysAgo;
    }).length;
    
    const newTestimonialsLast30Days = testimonials.filter(t => {
      const createdAt = t.created_at ? new Date(t.created_at) : null;
      return createdAt && createdAt >= thirtyDaysAgo;
    }).length;
    
    // Calculate growth percentage (comparing to previous period)
    // For simplicity, we'll compare to 30-60 days ago
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const contacts30to60DaysAgo = contacts.filter(c => {
      const createdAt = c.created_at ? new Date(c.created_at) : null;
      return createdAt && createdAt >= sixtyDaysAgo && createdAt < thirtyDaysAgo;
    }).length;
    
    const companies30to60DaysAgo = companies.filter(c => {
      const createdAt = c.created_at ? new Date(c.created_at) : null;
      return createdAt && createdAt >= sixtyDaysAgo && createdAt < thirtyDaysAgo;
    }).length;
    
    const testimonials30to60DaysAgo = testimonials.filter(t => {
      const createdAt = t.created_at ? new Date(t.created_at) : null;
      return createdAt && createdAt >= sixtyDaysAgo && createdAt < thirtyDaysAgo;
    }).length;
    
    // Calculate percentage change
    const contactsGrowthPercent = contacts30to60DaysAgo > 0 
      ? Math.round(((newContactsLast30Days - contacts30to60DaysAgo) / contacts30to60DaysAgo) * 100)
      : newContactsLast30Days > 0 ? 100 : 0;
    
    const companiesGrowthPercent = companies30to60DaysAgo > 0
      ? Math.round(((newCompaniesLast30Days - companies30to60DaysAgo) / companies30to60DaysAgo) * 100)
      : newCompaniesLast30Days > 0 ? 100 : 0;
    
    const testimonialsGrowthPercent = testimonials30to60DaysAgo > 0
      ? Math.round(((newTestimonialsLast30Days - testimonials30to60DaysAgo) / testimonials30to60DaysAgo) * 100)
      : newTestimonialsLast30Days > 0 ? 100 : 0;
    
    // Calculate testimonial response rate
    const companiesWithTestimonials = new Set(testimonials.map(t => t.company_id).filter(Boolean));
    const testimonialResponseRate = totalCompanies > 0 
      ? Math.round((companiesWithTestimonials.size / totalCompanies) * 100)
      : 0;
    
    return {
      totalContacts,
      totalCompanies,
      totalTestimonials,
      avgContactsPerCompany,
      newContactsLast30Days,
      newCompaniesLast30Days,
      newTestimonialsLast30Days,
      contactsGrowthPercent,
      companiesGrowthPercent,
      testimonialsGrowthPercent,
      testimonialResponseRate,
    };
  }, [contacts, companies, testimonials]);

  // Recent contacts (last 6)
  const recentContacts = useMemo(() => {
    return [...contacts]
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 6);
  }, [contacts]);

  // Recent companies (last 6)
  const recentCompanies = useMemo(() => {
    return [...companies]
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 6);
  }, [companies]);

  // Recent testimonials (last 6)
  const recentTestimonials = useMemo(() => {
    return [...testimonials]
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 6);
  }, [testimonials]);

  // Top companies by contact count
  const topCompanies = useMemo(() => {
    const companyContactCounts = new Map<number, { company: any; count: number }>();
    
    contacts.forEach(contact => {
      if (contact.company_id) {
        const existing = companyContactCounts.get(contact.company_id);
        if (existing) {
          existing.count++;
        } else {
          const company = companies.find(c => c.id === contact.company_id);
          if (company) {
            companyContactCounts.set(contact.company_id, { company, count: 1 });
          }
        }
      }
    });
    
    return Array.from(companyContactCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(item => ({ ...item.company, contactCount: item.count }));
  }, [contacts, companies]);

  // Contacts to follow (without company or recently added)
  const contactsToFollow = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    return contacts
      .filter(contact => {
        // Contacts without company
        if (!contact.company_id) return true;
        // Recently added contacts (last 7 days) that might need completion
        const createdAt = contact.created_at ? new Date(contact.created_at) : null;
        if (createdAt && createdAt >= sevenDaysAgo) {
          // Check if missing important info
          return !contact.email || !contact.phone || !contact.position;
        }
        return false;
      })
      .sort((a, b) => {
        // Prioritize contacts without company
        if (!a.company_id && b.company_id) return -1;
        if (a.company_id && !b.company_id) return 1;
        // Then by creation date (newest first)
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      })
      .slice(0, 5);
  }, [contacts]);

  // Time series data for evolution chart (last 6 months)
  const evolutionData = useMemo(() => {
    const now = new Date();
    const months: ChartDataPoint[] = [];
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonthDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const monthLabel = monthDate.toLocaleDateString('fr-FR', { month: 'short' });
      
      const contactsInMonth = contacts.filter(c => {
        const createdAt = c.created_at ? new Date(c.created_at) : null;
        return createdAt && createdAt >= monthDate && createdAt < nextMonthDate;
      }).length;
      
      const companiesInMonth = companies.filter(c => {
        const createdAt = c.created_at ? new Date(c.created_at) : null;
        return createdAt && createdAt >= monthDate && createdAt < nextMonthDate;
      }).length;
      
      months.push({
        label: monthLabel,
        value: contactsInMonth + companiesInMonth,
        color: 'var(--color-primary-500)',
      });
    }
    
    return months;
  }, [contacts, companies]);

  // Format date helper
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(date);
  };

  if (loading) {
    return (
      <PageContainer maxWidth="full">
        <div className="flex items-center justify-center h-96">
          <Loading />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="full" className="flex flex-col h-full">
      <MotionDiv variant="slideUp" duration="normal" className="flex flex-col flex-1 space-y-6">
        {/* Hero Header */}
        <div className="relative rounded-2xl overflow-hidden -mt-4 -mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-10 2xl:-mx-12 3xl:-mx-16 4xl:-mx-20 px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 3xl:px-16 4xl:px-20 pt-6 pb-8">
          <div className="absolute inset-0 bg-nukleo-gradient opacity-90" />
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
            backgroundSize: '200px 200px'
          }} />
          
          <div className="relative">
            <h1 className="text-5xl font-black text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Dashboard Réseau
            </h1>
            <p className="text-white/80 text-lg">
              Vue d'ensemble de votre réseau professionnel avec statistiques et tendances
            </p>
          </div>
        </div>

        {/* Stats Cards - Enhanced with growth */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Contacts Card */}
          <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20 hover:border-primary-500/40 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-primary-500/10 border border-primary-500/30">
                <Users className="w-6 h-6 text-primary-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.totalContacts}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Contacts</div>
            {stats.newContactsLast30Days > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1 text-success-600 dark:text-success-400">
                  <ArrowUpRight className="w-3 h-3" />
                  <span className="font-medium">+{stats.newContactsLast30Days}</span>
                </div>
                <span className="text-gray-500 dark:text-gray-500">ce mois</span>
                {stats.contactsGrowthPercent !== 0 && (
                  <span className={`font-medium ${stats.contactsGrowthPercent >= 0 ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400'}`}>
                    ({stats.contactsGrowthPercent >= 0 ? '+' : ''}{stats.contactsGrowthPercent}%)
                  </span>
                )}
              </div>
            )}
          </Card>

          {/* Companies Card */}
          <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20 hover:border-success-500/40 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-success-500/10 border border-success-500/30">
                <Building2 className="w-6 h-6 text-success-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.totalCompanies}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Entreprises</div>
            {stats.newCompaniesLast30Days > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1 text-success-600 dark:text-success-400">
                  <ArrowUpRight className="w-3 h-3" />
                  <span className="font-medium">+{stats.newCompaniesLast30Days}</span>
                </div>
                <span className="text-gray-500 dark:text-gray-500">ce mois</span>
                {stats.companiesGrowthPercent !== 0 && (
                  <span className={`font-medium ${stats.companiesGrowthPercent >= 0 ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400'}`}>
                    ({stats.companiesGrowthPercent >= 0 ? '+' : ''}{stats.companiesGrowthPercent}%)
                  </span>
                )}
              </div>
            )}
          </Card>

          {/* Testimonials Card */}
          <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20 hover:border-warning-500/40 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-warning-500/10 border border-warning-500/30">
                <MessageSquare className="w-6 h-6 text-warning-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.totalTestimonials}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Témoignages</div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500 dark:text-gray-500">Taux de réponse:</span>
              <span className="font-medium text-primary-600 dark:text-primary-400">{stats.testimonialResponseRate}%</span>
            </div>
            {stats.newTestimonialsLast30Days > 0 && (
              <div className="flex items-center gap-2 text-xs mt-1">
                <div className="flex items-center gap-1 text-success-600 dark:text-success-400">
                  <ArrowUpRight className="w-3 h-3" />
                  <span className="font-medium">+{stats.newTestimonialsLast30Days}</span>
                </div>
                <span className="text-gray-500 dark:text-gray-500">ce mois</span>
              </div>
            )}
          </Card>

          {/* Average Contacts/Company Card */}
          <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20 hover:border-primary-500/40 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-primary-500/10 border border-primary-500/30">
                <TrendingUp className="w-6 h-6 text-primary-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stats.avgContactsPerCompany}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Contacts/Entreprise</div>
          </Card>
        </div>

        {/* Evolution Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Évolution du réseau (6 derniers mois)
            </h3>
            {evolutionData.length > 0 ? (
              <Chart
                type="line"
                data={evolutionData}
                height={250}
              />
            ) : (
              <div className="flex items-center justify-center h-[250px] text-gray-500">
                <p className="text-sm">Pas assez de données pour afficher l'évolution</p>
              </div>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-4 text-center">
              Nombre de nouveaux contacts et entreprises par mois
            </p>
          </Card>

          {/* Top Companies */}
          <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Top entreprises actives
              </h3>
              <Badge className="bg-success-500/10 text-success-500 border-success-500/30">
                {topCompanies.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {topCompanies.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Aucune entreprise avec contacts</p>
              ) : (
                topCompanies.map((company) => (
                  <Link key={company.id} href={`/dashboard/reseau/entreprises/${company.id}`}>
                    <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-success-500/30 hover:bg-success-500/5 transition-all cursor-pointer group">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1 group-hover:text-success-500 transition-colors">
                            {company.name}
                          </h4>
                          <div className="flex items-center gap-2">
                            <Users className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {company.contactCount} contact{company.contactCount > 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                        <Eye className="w-4 h-4 text-gray-400 group-hover:text-success-500 transition-colors flex-shrink-0" />
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
            {topCompanies.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Link href="/dashboard/reseau/entreprises">
                  <Button variant="ghost" size="sm" className="w-full text-success-500 hover:text-secondary-600 hover:bg-success-500/10">
                    Voir toutes les entreprises
                    <ArrowUpRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        </div>

        {/* Contacts to Follow */}
        {contactsToFollow.length > 0 && (
          <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  Contacts à suivre
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Contacts nécessitant une attention ou complétion
                </p>
              </div>
              <Badge className="bg-warning-500/10 text-warning-500 border-warning-500/30">
                {contactsToFollow.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {contactsToFollow.map((contact) => (
                <Link key={contact.id} href={`/dashboard/reseau/contacts/${contact.id}`}>
                  <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-warning-500/30 hover:bg-warning-500/5 transition-all cursor-pointer group">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm group-hover:text-warning-500 transition-colors">
                            {contact.first_name} {contact.last_name}
                          </h4>
                          {!contact.company_id && (
                            <Badge className="bg-warning-500/20 text-warning-600 dark:text-warning-400 text-xs">
                              Sans entreprise
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-500">
                          {!contact.email && (
                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">Pas d'email</span>
                          )}
                          {!contact.phone && (
                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">Pas de téléphone</span>
                          )}
                          {!contact.position && (
                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">Pas de poste</span>
                          )}
                        </div>
                        {contact.created_at && (
                          <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-500 dark:text-gray-500">
                            <Calendar className="w-3 h-3" />
                            <span>Ajouté {formatDate(contact.created_at)}</span>
                          </div>
                        )}
                      </div>
                      <Eye className="w-4 h-4 text-gray-400 group-hover:text-warning-500 transition-colors flex-shrink-0 mt-0.5" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Link href="/dashboard/reseau/contacts">
                <Button variant="ghost" size="sm" className="w-full text-warning-500 hover:text-warning-600 hover:bg-warning-500/10">
                  Voir tous les contacts
                  <ArrowUpRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* Quick Actions - Enhanced */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/dashboard/reseau/contacts">
            <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20 hover:scale-105 hover:border-primary-500/40 transition-all duration-200 cursor-pointer group">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-4 rounded-xl bg-primary-500/10 border border-primary-500/30 group-hover:bg-primary-500/20 transition-colors">
                  <Users className="w-8 h-8 text-primary-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Contacts</h3>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">{stats.totalContacts} contact{stats.totalContacts > 1 ? 's' : ''}</p>
                    {stats.contactsGrowthPercent > 0 && (
                      <Badge className="bg-success-500/10 text-success-500 border-success-500/30 text-xs">
                        <ArrowUpRight className="w-3 h-3 mr-1" />
                        +{stats.contactsGrowthPercent}%
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="mb-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-500">Sans entreprise</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {contacts.filter(c => !c.company_id).length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-500">Ajoutés ce mois</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {contacts.filter(c => {
                      const createdAt = c.created_at ? new Date(c.created_at) : null;
                      const now = new Date();
                      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                      return createdAt && createdAt >= thisMonth;
                    }).length}
                  </span>
                </div>
              </div>
              <Button className="w-full hover-nukleo" variant="outline">
                <UserPlus className="w-4 h-4 mr-2" />
                Nouveau contact
              </Button>
            </Card>
          </Link>

          <Link href="/dashboard/reseau/entreprises">
            <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20 hover:scale-105 hover:border-success-500/40 transition-all duration-200 cursor-pointer group">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-4 rounded-xl bg-success-500/10 border border-success-500/30 group-hover:bg-success-500/20 transition-colors">
                  <Building2 className="w-8 h-8 text-success-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Entreprises</h3>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">{stats.totalCompanies} entreprise{stats.totalCompanies > 1 ? 's' : ''}</p>
                    {stats.companiesGrowthPercent > 0 && (
                      <Badge className="bg-success-500/10 text-success-500 border-success-500/30 text-xs">
                        <ArrowUpRight className="w-3 h-3 mr-1" />
                        +{stats.companiesGrowthPercent}%
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="mb-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-500">Avec contacts</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {topCompanies.length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-500">Moy. contacts/entreprise</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {stats.avgContactsPerCompany}
                  </span>
                </div>
              </div>
              <Button className="w-full hover-nukleo" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle entreprise
              </Button>
            </Card>
          </Link>

          <Link href="/dashboard/reseau/temoignages">
            <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20 hover:scale-105 hover:border-warning-500/40 transition-all duration-200 cursor-pointer group">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-4 rounded-xl bg-warning-500/10 border border-warning-500/30 group-hover:bg-warning-500/20 transition-colors">
                  <MessageSquare className="w-8 h-8 text-warning-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Témoignages</h3>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">{stats.totalTestimonials} témoignage{stats.totalTestimonials > 1 ? 's' : ''}</p>
                    {stats.testimonialsGrowthPercent > 0 && (
                      <Badge className="bg-success-500/10 text-success-500 border-success-500/30 text-xs">
                        <ArrowUpRight className="w-3 h-3 mr-1" />
                        +{stats.testimonialsGrowthPercent}%
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="mb-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-500">Ce mois</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {testimonials.filter(t => {
                      const createdAt = t.created_at ? new Date(t.created_at) : null;
                      const now = new Date();
                      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                      return createdAt && createdAt >= thisMonth;
                    }).length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-500">Récents (7j)</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {testimonials.filter(t => {
                      const createdAt = t.created_at ? new Date(t.created_at) : null;
                      const now = new Date();
                      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                      return createdAt && createdAt >= sevenDaysAgo;
                    }).length}
                  </span>
                </div>
              </div>
              <Button className="w-full hover-nukleo" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Nouveau témoignage
              </Button>
            </Card>
          </Link>
        </div>

        {/* Recent Activity - Enhanced with more items and details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Contacts */}
          <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Contacts récents</h3>
              <Badge className="bg-primary-500/10 text-primary-500 border-primary-500/30">
                {recentContacts.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {recentContacts.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Aucun contact récent</p>
              ) : (
                recentContacts.map((contact) => (
                  <Link key={contact.id} href={`/dashboard/reseau/contacts/${contact.id}`}>
                    <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500/30 hover:bg-primary-500/5 transition-all cursor-pointer group">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1 group-hover:text-primary-500 transition-colors">
                            {contact.first_name} {contact.last_name}
                          </h4>
                          {contact.position && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{contact.position}</p>
                          )}
                          {contact.company_name && (
                            <p className="text-xs text-gray-500 dark:text-gray-500 truncate">{contact.company_name}</p>
                          )}
                          {contact.created_at && (
                            <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-500 dark:text-gray-500">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDate(contact.created_at)}</span>
                            </div>
                          )}
                        </div>
                        <Eye className="w-4 h-4 text-gray-400 group-hover:text-primary-500 transition-colors flex-shrink-0 mt-0.5" />
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
            {recentContacts.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Link href="/dashboard/reseau/contacts">
                  <Button variant="ghost" size="sm" className="w-full text-primary-500 hover:text-primary-600 hover:bg-primary-500/10">
                    Voir tous les contacts
                    <ArrowUpRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            )}
          </Card>

          {/* Recent Companies */}
          <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Entreprises récentes</h3>
              <Badge className="bg-success-500/10 text-success-500 border-success-500/30">
                {recentCompanies.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {recentCompanies.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Aucune entreprise récente</p>
              ) : (
                recentCompanies.map((company) => (
                  <Link key={company.id} href={`/dashboard/reseau/entreprises/${company.id}`}>
                    <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-success-500/30 hover:bg-success-500/5 transition-all cursor-pointer group">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1 group-hover:text-success-500 transition-colors">
                            {company.name}
                          </h4>
                          {company.description && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-1">{company.description}</p>
                          )}
                          {company.created_at && (
                            <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-500 dark:text-gray-500">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDate(company.created_at)}</span>
                            </div>
                          )}
                        </div>
                        <Eye className="w-4 h-4 text-gray-400 group-hover:text-success-500 transition-colors flex-shrink-0 mt-0.5" />
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
            {recentCompanies.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Link href="/dashboard/reseau/entreprises">
                  <Button variant="ghost" size="sm" className="w-full text-success-500 hover:text-secondary-600 hover:bg-success-500/10">
                    Voir toutes les entreprises
                    <ArrowUpRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            )}
          </Card>

          {/* Recent Testimonials */}
          <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Témoignages récents</h3>
              <Badge className="bg-warning-500/10 text-warning-500 border-warning-500/30">
                {recentTestimonials.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {recentTestimonials.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Aucun témoignage récent</p>
              ) : (
                recentTestimonials.map((testimonial) => (
                  <div key={testimonial.id} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-warning-500/30 hover:bg-warning-500/5 transition-all">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                      {testimonial.title || 'Sans titre'}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-1">
                      {testimonial.testimonial_fr || testimonial.testimonial_en || 'Pas de contenu'}
                    </p>
                    {testimonial.company_name && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 truncate mb-1">
                        {testimonial.company_name}
                      </p>
                    )}
                    {testimonial.created_at && (
                      <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-500 dark:text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(testimonial.created_at)}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            {recentTestimonials.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Link href="/dashboard/reseau/temoignages">
                  <Button variant="ghost" size="sm" className="w-full text-warning-500 hover:text-warning-600 hover:bg-warning-500/10">
                    Voir tous les témoignages
                    <ArrowUpRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        </div>
      </MotionDiv>
    </PageContainer>
  );
}
