'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { BarChart3, TrendingUp, Download, Loader2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Badge, Button, Card } from '@/components/ui';
import { projectsAPI } from '@/lib/api/projects';
import { employeesAPI } from '@/lib/api/employees';

interface MonthlyData {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
  projectCount: number;
}

export default function RapportPage() {
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    try {
      setLoading(true);
      
      const [projects, employees] = await Promise.all([
        projectsAPI.list(0, 1000),
        employeesAPI.list(0, 1000)
      ]);

      // Calculer les données mensuelles pour les 6 derniers mois
      const monthsData: MonthlyData[] = [];
      const currentDate = new Date();
      
      for (let i = 0; i < 6; i++) {
        const targetDate = new Date(currentDate);
        targetDate.setMonth(currentDate.getMonth() - i);
        
        const month = targetDate.toLocaleDateString('fr-FR', { month: 'long' });
        const monthNumber = targetDate.getMonth();
        const year = targetDate.getFullYear();
        
        // Filtrer les projets créés ce mois-là
        const monthProjects = projects.filter(p => {
          const createdDate = new Date(p.created_at);
          return createdDate.getMonth() === monthNumber && 
                 createdDate.getFullYear() === year;
        });
        
        // Calculer les revenus (budgets des projets)
        const revenue = monthProjects.reduce((sum, p) => sum + (p.budget || 0), 0);
        
        // Calculer les dépenses (salaires + overhead)
        const avgSalaryPerEmployee = 5000;
        const baseSalaries = employees.length * avgSalaryPerEmployee;
        const overhead = 15000; // Infrastructure, marketing, etc.
        const expenses = baseSalaries + overhead;
        
        // Calculer le profit
        const profit = revenue - expenses;
        
        monthsData.push({
          month: month.charAt(0).toUpperCase() + month.slice(1),
          revenue,
          expenses,
          profit,
          projectCount: monthProjects.length
        });
      }
      
      setMonthlyData(monthsData.reverse());
    } catch (error) {
      console.error('Erreur lors du chargement des données du rapport:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CA', { 
      style: 'currency', 
      currency: 'CAD',
      minimumFractionDigits: 0 
    }).format(amount);
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-[#523DC9]" />
        </div>
      </PageContainer>
    );
  }

  const currentMonth = monthlyData[monthlyData.length - 1];
  const previousMonth = monthlyData[monthlyData.length - 2];
  
  const revenueGrowth = currentMonth && previousMonth 
    ? ((((currentMonth?.revenue ?? 0) - (previousMonth?.revenue ?? 0)) / (previousMonth?.revenue ?? 1)) * 100).toFixed(1)
    : '0.0';
  
  const expensesGrowth = currentMonth && previousMonth 
    ? ((((currentMonth?.expenses ?? 0) - (previousMonth?.expenses ?? 0)) / (previousMonth?.expenses ?? 1)) * 100).toFixed(1)
    : '0.0';
  
  const profitGrowth = currentMonth && previousMonth && previousMonth.profit !== 0
    ? ((((currentMonth?.profit ?? 0) - (previousMonth?.profit ?? 0)) / Math.abs(previousMonth?.profit ?? 1)) * 100).toFixed(1)
    : '0.0';

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
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    Rapports Financiers
                  </h1>
                  <p className="text-white/80 text-sm">Analyses et tendances financières</p>
                </div>
              </div>
              <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm">
                <Download className="w-4 h-4 mr-2" />
                Exporter PDF
              </Button>
            </div>
          </div>
        </div>

        {/* Current Month Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Revenus</h3>
              <Badge className={`${Number(revenueGrowth) >= 0 ? 'bg-green-500/10 text-green-600 border-green-500/30' : 'bg-red-500/10 text-red-600 border-red-500/30'} border`}>
                {Number(revenueGrowth) >= 0 ? '+' : ''}{revenueGrowth}%
              </Badge>
            </div>
            <div className="text-3xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {formatCurrency(currentMonth?.revenue ?? 0)}
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
              {Number(revenueGrowth) >= 0 ? (
                <ArrowUpRight className="w-4 h-4 text-green-600" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-600" />
              )}
              <span>vs mois dernier</span>
            </div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Dépenses</h3>
              <Badge className={`${Number(expensesGrowth) <= 0 ? 'bg-green-500/10 text-green-600 border-green-500/30' : 'bg-red-500/10 text-red-600 border-red-500/30'} border`}>
                {Number(expensesGrowth) >= 0 ? '+' : ''}{expensesGrowth}%
              </Badge>
            </div>
            <div className="text-3xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {formatCurrency(currentMonth?.expenses ?? 0)}
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
              {Number(expensesGrowth) <= 0 ? (
                <ArrowDownRight className="w-4 h-4 text-green-600" />
              ) : (
                <ArrowUpRight className="w-4 h-4 text-red-600" />
              )}
              <span>vs mois dernier</span>
            </div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Profit Net</h3>
              <TrendingUp className={`w-5 h-5 ${(currentMonth?.profit ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
            <div className={`text-3xl font-bold mb-2 ${(currentMonth?.profit ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {formatCurrency(currentMonth?.profit ?? 0)}
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
              {Number(profitGrowth) >= 0 ? (
                <ArrowUpRight className="w-4 h-4 text-green-600" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-600" />
              )}
              <span>vs mois dernier</span>
            </div>
          </Card>
        </div>

        {/* Monthly Evolution */}
        <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 mb-6">
          <h2 className="text-xl font-bold mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Évolution Mensuelle
          </h2>
          <div className="space-y-6">
            {monthlyData.map((data, index) => {
              const maxRevenue = Math.max(...monthlyData.map(d => d.revenue));
              const revenuePercent = maxRevenue > 0 ? (data.revenue / maxRevenue) * 100 : 0;
              const expensesPercent = maxRevenue > 0 ? (data.expenses / maxRevenue) * 100 : 0;
              
              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium min-w-[100px]">{data.month}</span>
                      <Badge variant="default" className="text-xs">
                        {data.projectCount} projet{data.projectCount > 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <span className={`text-sm font-bold ${data.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      Profit: {formatCurrency(data.profit)}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                        <span>Revenus</span>
                        <span>{formatCurrency(data.revenue)}</span>
                      </div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500"
                          style={{ width: `${revenuePercent}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                        <span>Dépenses</span>
                        <span>{formatCurrency(data.expenses)}</span>
                      </div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all duration-500"
                          style={{ width: `${expensesPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <h3 className="font-semibold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Performance sur 6 mois
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Revenus totaux</span>
                <span className="font-bold text-green-600">
                  {formatCurrency(monthlyData.reduce((sum, d) => sum + d.revenue, 0))}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Dépenses totales</span>
                <span className="font-bold text-red-600">
                  {formatCurrency(monthlyData.reduce((sum, d) => sum + d.expenses, 0))}
                </span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                <span className="text-sm font-medium">Profit net total</span>
                <span className={`font-bold text-lg ${monthlyData.reduce((sum, d) => sum + d.profit, 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {formatCurrency(monthlyData.reduce((sum, d) => sum + d.profit, 0))}
                </span>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <h3 className="font-semibold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Projets par mois
            </h3>
            <div className="space-y-3">
              {monthlyData.slice(-3).reverse().map((data, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{data.month}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="text-xs">
                      {data.projectCount} projet{data.projectCount > 1 ? 's' : ''}
                    </Badge>
                    <span className="text-sm font-medium">
                      {formatCurrency(data.revenue)}
                    </span>
                  </div>
                </div>
              ))}
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total projets (6 mois)</span>
                  <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30 border">
                    {monthlyData.reduce((sum, d) => sum + d.projectCount, 0)} projets
                  </Badge>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Insights */}
        <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 mt-6">
          <h3 className="font-semibold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Insights
          </h3>
          <div className="space-y-3">
            {(currentMonth?.profit ?? 0) >= 0 ? (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <div className="font-medium text-green-600 mb-1">Performance positive</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Votre entreprise génère un profit ce mois-ci. Continuez sur cette lancée !
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-500/5 border border-orange-500/20">
                <TrendingUp className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <div className="font-medium text-orange-600 mb-1">Attention requise</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Les dépenses dépassent les revenus ce mois-ci. Considérez augmenter vos ventes ou optimiser vos coûts.
                  </div>
                </div>
              </div>
            )}
            
            {(currentMonth?.projectCount ?? 0) > (previousMonth?.projectCount ?? 0) && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                <BarChart3 className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <div className="font-medium text-blue-600 mb-1">Croissance des projets</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Vous avez {(currentMonth?.projectCount ?? 0) - (previousMonth?.projectCount ?? 0)} projet{((currentMonth?.projectCount ?? 0) - (previousMonth?.projectCount ?? 0)) > 1 ? 's' : ''} de plus que le mois dernier.
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </MotionDiv>
    </PageContainer>
  );
}
